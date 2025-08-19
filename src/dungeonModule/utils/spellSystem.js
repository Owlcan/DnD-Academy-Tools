// Create a spells utility file to handle spell loading and execution

import { getValidMovesInRange } from './gameUtils';

// Load all spells from the spells.json file
let allSpells = [];
try {
  allSpells = require('../data/Spells/spells.json');
  console.log(`Loaded ${allSpells.length} spells from spells.json`);
} catch (error) {
  console.error('Failed to load spells:', error);
}

// Add custom spells that might not be in the spells.json file
allSpells = [
  ...allSpells,
  {
    Spell: "Shocking Grasp",
    Level: "Cantrip",
    School: "Evocation",
    CastingTime: "1 action",
    Range: "Touch",
    Components: "V, S",
    Duration: "Instantaneous",
    Classes: ["Sorcerer", "Wizard", "Rogue", "Warlock"],
    Description: "Lightning springs from your hand to deliver a shock to a creature you try to touch. Make a melee spell attack against the target. On a hit, the target takes 1d8 lightning damage.",
    AtHigherLevels: "This spell's damage increases by 1d8 when you reach 5th level (2d8), 11th level (3d8), and 17th level (4d8).",
    isCantrip: true,
    damage: "1d8",
    damageType: "lightning",
    isPureSpell: true,
    hotkey: "S"
  },
  {
    Spell: "Eldritch Blast",
    Level: "Cantrip",
    School: "Evocation",
    CastingTime: "1 action",
    Range: "60 feet",
    Components: "V, S",
    Duration: "Instantaneous",
    Classes: ["Warlock", "Rogue"],
    Description: "A beam of crackling energy streaks toward a creature within range. Make a ranged spell attack against the target. On a hit, the target takes 1d8 force damage.",
    AtHigherLevels: "This spell's damage increases by 1d8 when you reach 5th level (2d8), 11th level (3d8), and 17th level (4d8).",
    isCantrip: true,
    damage: "1d8",
    damageType: "force",
    isRangedSpell: true,
    isPureSpell: true,
    hotkey: "E"
  },
  {
    Spell: "Burning Hands",
    Level: "1",
    School: "Evocation",
    CastingTime: "1 action",
    Range: "15 feet cone",
    Components: "V, S",
    Duration: "Instantaneous",
    Classes: ["Sorcerer", "Rogue", "Wizard"],
    Description: "A cone of fire erupts from your hands. Each creature in a 15-foot cone must make a Dexterity saving throw. A creature takes 3d6 fire damage on a failed save, or half as much damage on a successful one.",
    AtHigherLevels: "When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d6 for each slot level above 1st.",
    damage: "3d6",
    damageType: "fire",
    isAreaEffect: true,
    isPureSpell: true,
    hotkey: "C"
  },
  {
    Spell: "Warlock Bolt",
    Level: "1",
    School: "Necromancy",
    CastingTime: "1 action",
    Range: "60 feet",
    Components: "V, S",
    Duration: "Instantaneous",
    Classes: ["Warlock", "Rogue"],
    Description: "A bolt of dark energy shoots toward a creature. Make a ranged spell attack against the target. On a hit, the target takes 1d12 necrotic damage.",
    AtHigherLevels: "When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d12 for each slot level above 1st.",
    damage: "1d12",
    damageType: "necrotic",
    isRangedSpell: true,
    isPureSpell: true,
    hotkey: "W"
  }
];

/**
 * Get spells available to a character based on their class
 * @param {Object} character - The character object
 * @returns {Array} - Array of spell objects available to the character
 */
export const getAvailableSpells = (character) => {
  if (!character || !character.properties) return [];
  
  // Get character class
  const characterClass = 
    character.properties.characterData?.class?.toLowerCase() || 
    character.properties.class?.toLowerCase() || 
    '';
    
  // Get character's known spells if available
  const knownSpells = 
    character.properties.characterData?.spellcasting?.known_spells || 
    character.properties.spells || 
    [];
    
  if (!characterClass || knownSpells.length === 0) {
    return [];
  }
  
  // Filter spells by both class and if they're in the character's known spells
  return allSpells.filter(spell => {
    // Check if spell is known by the character
    const isKnown = knownSpells.some(
      knownSpell => knownSpell.toLowerCase() === spell.Spell.toLowerCase()
    );
    
    // Check if spell is available to character's class
    const isClassSpell = spell.Classes && spell.Classes.some(
      spellClass => characterClass.includes(spellClass.toLowerCase())
    );
    
    return isKnown && isClassSpell;
  });
};

/**
 * Get valid targets for a spell based on its range and type
 * @param {Object} spell - The spell object
 * @param {Object} caster - The caster entity
 * @param {Array} grid - The dungeon grid
 * @param {Array} entities - All entities in the dungeon
 * @returns {Array} - Array of valid target positions
 */
export const getSpellTargets = (spell, caster, grid, entities) => {
  if (!spell || !caster || !grid) return [];
  
  // Get range in squares (assuming 5 feet per square)
  const rangeText = spell.Range || '0';
  const rangeMatch = rangeText.match(/(\d+)/);
  const rangeInFeet = rangeMatch ? parseInt(rangeMatch[1], 10) : 0;
  const rangeInSquares = Math.floor(rangeInFeet / 5);
  
  // Special case for touch spells
  if (rangeText.toLowerCase().includes('touch')) {
    // For touch spells, only adjacent squares are valid
    return getValidMovesInRange(caster, grid, entities, 1);
  }
  
  // Get all valid positions within range
  return getValidMovesInRange(caster, grid, entities, rangeInSquares);
};

/**
 * Execute a spell's effects
 * @param {Object} spell - The spell object
 * @param {Object} caster - The caster entity
 * @param {Object} target - The target entity or position
 * @param {Array} entities - All entities in the dungeon
 * @returns {Object} - Result of the spell casting
 */
export const executeSpell = (spell, caster, target, entities) => {
  if (!spell || !caster || !target) {
    return { success: false, message: 'Invalid spell parameters' };
  }
  
  // Based on spell type, execute different effects
  switch (spell.Spell) {
    case 'Radiant Lance':
      return executeRadiantLance(spell, caster, target, entities);
    case 'Cure Light Wounds':
    case 'Cure Wounds':
      return executeHealingSpell(spell, caster, target, entities);
    case 'Shocking Touch':
      return executeShockingTouch(spell, caster, target, entities);
    case 'Warlock Blast':
      return executeWarlockBlast(spell, caster, target, entities);
    case 'Burning Cone':
      return executeBurningCone(spell, caster, target, entities);
    case 'Warlock Bolt':
      return executeWarlockBolt(spell, caster, target, entities);
    // Add more spell implementations as needed
    default:
      return { 
        success: false, 
        message: `Spell ${spell.Spell} is not implemented yet.` 
      };
  }
};

/**
 * Execute Radiant Lance spell
 * @param {Object} spell - The Radiant Lance spell object
 * @param {Object} caster - The caster entity
 * @param {Object} target - The target entity
 * @param {Array} entities - All entities in the dungeon
 * @returns {Object} - Result of the spell casting
 */
const executeRadiantLance = (spell, caster, target, entities) => {
  const result = {
    success: true,
    hit: false,
    damage: 0,
    message: ''
  };
  
  // Calculate spell attack bonus based on caster's spellcasting attribute (Wisdom for clerics)
  const spellcastingAbility = caster.properties.characterData?.attributes?.wisdom || 
                              caster.properties.wisdom || 10;
  const proficiencyBonus = Math.floor((caster.properties.level || 1) / 4) + 2;
  const spellAttackBonus = Math.floor((spellcastingAbility - 10) / 2) + proficiencyBonus;
  
  // Roll to hit
  const attackRoll = Math.floor(Math.random() * 20) + 1;
  const totalAttackRoll = attackRoll + spellAttackBonus;
  
  // Check if target is a darkling or darkforme for bonus damage
  const isDarklingOrDarkforme = 
    target.properties?.type?.toLowerCase().includes('darkling') || 
    target.properties?.type?.toLowerCase().includes('darkforme') ||
    target.properties?.monsterData?.type?.toLowerCase().includes('abomination') ||
    target.name?.toLowerCase().includes('darkling') || 
    target.name?.toLowerCase().includes('darkforme');
  
  // Critical hit on natural 20
  const isCritical = attackRoll === 20;
  
  if (isCritical || totalAttackRoll >= target.properties.ac) {
    // Hit! Calculate damage
    result.hit = true;
    
    // Roll base damage (2d8)
    let damageRoll = 0;
    const numDice = isDarklingOrDarkforme ? 4 : 2; // Double damage against darklings
    const rolls = [];
    
    for (let i = 0; i < numDice; i++) {
      const roll = Math.floor(Math.random() * 8) + 1;
      rolls.push(roll);
      damageRoll += roll;
    }
    
    // Double damage on critical hit
    if (isCritical) {
      damageRoll *= 2;
    }
    
    result.damage = damageRoll;
    
    // Create simplified hit message
    result.message = `${caster.properties.name} attacks with Radiant Lance`;
    
    // Add attack roll info
    result.message += ` (${attackRoll} + ${spellAttackBonus} = ${totalAttackRoll} vs AC ${target.properties.ac})`;
    
    // Add damage info
    if (isCritical) {
      result.message += ` Critical hit! Damage: ${rolls.join(' + ')} × 2 = ${damageRoll} radiant`;
    } else {
      result.message += ` Hit! Damage: ${rolls.join(' + ')} = ${damageRoll} radiant`;
    }
    
    // Add bonus against darklings if applicable
    if (isDarklingOrDarkforme) {
      result.message += ` (effective against this creature type)`;
    }
  } else {
    // Miss
    result.message = `${caster.properties.name} attacks with Radiant Lance (${attackRoll} + ${spellAttackBonus} = ${totalAttackRoll} vs AC ${target.properties.ac}) Miss!`;
  }
  
  return result;
};

/**
 * Execute healing spell (Cure Light Wounds, Cure Wounds)
 * @param {Object} spell - The healing spell object
 * @param {Object} caster - The caster entity
 * @param {Object} target - The target entity
 * @returns {Object} - Result of the spell casting
 */
const executeHealingSpell = (spell, caster, target) => {
  const result = {
    success: true,
    healing: 0,
    message: ''
  };
  
  // Calculate healing based on spell level and caster's spellcasting modifier
  const spellcastingAbility = caster.properties.characterData?.attributes?.wisdom || 
                             caster.properties.wisdom || 10;
  const spellcastingMod = Math.floor((spellcastingAbility - 10) / 2);
  
  // Determine number of dice based on spell
  const diceCount = spell.Spell === 'Cure Light Wounds' ? 1 : 2;
  
  // Roll for healing
  let healingRoll = 0;
  for (let i = 0; i < diceCount; i++) {
    healingRoll += Math.floor(Math.random() * 8) + 1;
  }
  
  // Add spellcasting modifier
  healingRoll += spellcastingMod;
  
  result.healing = healingRoll;
  result.message = `${caster.properties.name} casts ${spell.Spell} on ${target.properties.name}, healing for ${healingRoll} hit points!`;
  
  return result;
};

/**
 * Execute Shocking Touch spell
 * @param {Object} spell - The Shocking Touch spell object
 * @param {Object} caster - The caster entity
 * @param {Object} target - The target entity
 * @param {Array} entities - All entities in the dungeon
 * @returns {Object} - Result of the spell casting
 */
const executeShockingTouch = (spell, caster, target, entities) => {
  const result = {
    success: true,
    hit: false,
    damage: 0,
    message: ''
  };
  
  // Calculate spell attack bonus based on spellcasting ability
  // For shocking touch, we should use Intelligence for Wizards, Charisma for Sorcerers/Warlocks
  let spellcastingAbility = 10;
  const characterClass = caster.properties.characterData?.class?.toLowerCase() || 
                        caster.properties.class?.toLowerCase() || '';
  
  if (characterClass.includes('wizard')) {
    spellcastingAbility = caster.properties.characterData?.attributes?.intelligence || 
                          caster.properties.intelligence || 10;
  } else {
    spellcastingAbility = caster.properties.characterData?.attributes?.charisma || 
                          caster.properties.charisma || 10;
  }
  
  // Get custom spell attack bonus if available
  const customSpellAttackBonus = caster.properties?.combat_bonuses?.spell_attack || 0;
  
  const proficiencyBonus = Math.floor((caster.properties.level || 1) / 4) + 2;
  const spellAttackBonus = Math.floor((spellcastingAbility - 10) / 2) + proficiencyBonus + customSpellAttackBonus;
  
  // Roll to hit
  const attackRoll = Math.floor(Math.random() * 20) + 1;
  const totalAttackRoll = attackRoll + spellAttackBonus;
  
  // Critical hit on natural 20
  const isCritical = attackRoll === 20;
  
  if (isCritical || totalAttackRoll >= target.properties.ac) {
    // Hit! Calculate damage
    result.hit = true;
    
    // Roll base damage (1d8)
    let damageRoll = 0;
    const rolls = [];
    
    // Determine number of dice based on level (cantrip scaling)
    const casterLevel = caster.properties.level || 1;
    const numDice = casterLevel >= 17 ? 4 : casterLevel >= 11 ? 3 : casterLevel >= 5 ? 2 : 1;
    
    for (let i = 0; i < numDice; i++) {
      const roll = Math.floor(Math.random() * 8) + 1;
      rolls.push(roll);
      damageRoll += roll;
    }
    
    // Double damage on critical hit
    if (isCritical) {
      damageRoll *= 2;
    }
    
    result.damage = damageRoll;
    
    // Create message
    result.message = `${caster.properties.name} casts Shocking Touch`;
    
    // Add attack roll info
    result.message += ` (${attackRoll} + ${spellAttackBonus} = ${totalAttackRoll} vs AC ${target.properties.ac})`;
    
    // Add damage info
    if (isCritical) {
      result.message += ` Critical hit! Damage: ${rolls.join(' + ')} × 2 = ${damageRoll} lightning damage!`;
    } else {
      result.message += ` Hit! Damage: ${rolls.join(' + ')} = ${damageRoll} lightning damage!`;
    }
  } else {
    // Miss
    result.message = `${caster.properties.name} casts Shocking Touch (${attackRoll} + ${spellAttackBonus} = ${totalAttackRoll} vs AC ${target.properties.ac}). Miss!`;
  }
  
  return result;
};

/**
 * Execute Warlock Blast spell
 * @param {Object} spell - The Warlock Blast spell object
 * @param {Object} caster - The caster entity
 * @param {Object} target - The target entity
 * @param {Array} entities - All entities in the dungeon
 * @returns {Object} - Result of the spell casting
 */
const executeWarlockBlast = (spell, caster, target, entities) => {
  const result = {
    success: true,
    hit: false,
    damage: 0,
    message: ''
  };
  
  // Calculate spell attack bonus based on spellcasting ability (Charisma for Warlocks)
  const spellcastingAbility = caster.properties.characterData?.attributes?.charisma || 
                             caster.properties.charisma || 10;
  
  // Get custom spell attack bonus if available
  const customSpellAttackBonus = caster.properties?.combat_bonuses?.spell_attack || 0;
  
  const proficiencyBonus = Math.floor((caster.properties.level || 1) / 4) + 2;
  const spellAttackBonus = Math.floor((spellcastingAbility - 10) / 2) + proficiencyBonus + customSpellAttackBonus;
  
  // Roll to hit
  const attackRoll = Math.floor(Math.random() * 20) + 1;
  const totalAttackRoll = attackRoll + spellAttackBonus;
  
  // Critical hit on natural 20
  const isCritical = attackRoll === 20;
  
  if (isCritical || totalAttackRoll >= target.properties.ac) {
    // Hit! Calculate damage
    result.hit = true;
    
    // Roll base damage (1d8)
    let damageRoll = 0;
    const rolls = [];
    
    // Determine number of dice based on level (cantrip scaling)
    const casterLevel = caster.properties.level || 1;
    const numDice = casterLevel >= 17 ? 4 : casterLevel >= 11 ? 3 : casterLevel >= 5 ? 2 : 1;
    
    for (let i = 0; i < numDice; i++) {
      const roll = Math.floor(Math.random() * 8) + 1;
      rolls.push(roll);
      damageRoll += roll;
    }
    
    // Double damage on critical hit
    if (isCritical) {
      damageRoll *= 2;
    }
    
    result.damage = damageRoll;
    
    // Create message
    result.message = `${caster.properties.name} casts Warlock Blast`;
    
    // Add attack roll info
    result.message += ` (${attackRoll} + ${spellAttackBonus} = ${totalAttackRoll} vs AC ${target.properties.ac})`;
    
    // Add damage info
    if (isCritical) {
      result.message += ` Critical hit! Damage: ${rolls.join(' + ')} × 2 = ${damageRoll} force damage!`;
    } else {
      result.message += ` Hit! Damage: ${rolls.join(' + ')} = ${damageRoll} force damage!`;
    }
  } else {
    // Miss
    result.message = `${caster.properties.name} casts Warlock Blast (${attackRoll} + ${spellAttackBonus} = ${totalAttackRoll} vs AC ${target.properties.ac}). Miss!`;
  }
  
  return result;
};

/**
 * Execute Burning Cone spell
 * @param {Object} spell - The Burning Cone spell object
 * @param {Object} caster - The caster entity
 * @param {Object} target - The target entity
 * @param {Array} entities - All entities in the dungeon
 * @returns {Object} - Result of the spell casting
 */
const executeBurningCone = (spell, caster, target, entities) => {
  const result = {
    success: true,
    hit: true, // Always hits as it requires a saving throw
    damage: 0,
    message: ''
  };
  
  // Calculate spell save DC based on spellcasting ability
  let spellcastingAbility = 10;
  const characterClass = caster.properties.characterData?.class?.toLowerCase() || 
                        caster.properties.class?.toLowerCase() || '';
  
  if (characterClass.includes('wizard')) {
    spellcastingAbility = caster.properties.characterData?.attributes?.intelligence || 
                          caster.properties.intelligence || 10;
  } else {
    spellcastingAbility = caster.properties.characterData?.attributes?.charisma || 
                          caster.properties.charisma || 10;
  }
  
  const proficiencyBonus = Math.floor((caster.properties.level || 1) / 4) + 2;
  const spellSaveDC = 8 + Math.floor((spellcastingAbility - 10) / 2) + proficiencyBonus;
  
  // Roll base damage (3d6)
  let damageRoll = 0;
  const rolls = [];
  
  // Base 3d6 for level 1 spell
  for (let i = 0; i < 3; i++) {
    const roll = Math.floor(Math.random() * 6) + 1;
    rolls.push(roll);
    damageRoll += roll;
  }
  
  // Roll for saving throw (simulate with 1d20)
  const savingThrowRoll = Math.floor(Math.random() * 20) + 1;
  
  // Estimate target's Dexterity save bonus (simplified)
  const targetDexMod = Math.floor(((target.properties.dexterity || 10) - 10) / 2);
  const totalSaveRoll = savingThrowRoll + targetDexMod;
  
  // Check if save is successful
  const saveSuccessful = totalSaveRoll >= spellSaveDC;
  
  // Calculate final damage
  if (saveSuccessful) {
    damageRoll = Math.floor(damageRoll / 2); // Half damage on successful save
    result.message = `${caster.properties.name} casts Burning Cone! ${target.properties.name} makes a successful Dexterity save (${savingThrowRoll} + ${targetDexMod} = ${totalSaveRoll} vs DC ${spellSaveDC}) and takes half damage: ${damageRoll} fire damage!`;
  } else {
    result.message = `${caster.properties.name} casts Burning Cone! ${target.properties.name} fails a Dexterity save (${savingThrowRoll} + ${targetDexMod} = ${totalSaveRoll} vs DC ${spellSaveDC}) and takes ${damageRoll} fire damage!`;
  }
  
  result.damage = damageRoll;
  
  return result;
};

/**
 * Execute Warlock Bolt spell
 * @param {Object} spell - The Warlock Bolt spell object
 * @param {Object} caster - The caster entity
 * @param {Object} target - The target entity
 * @param {Array} entities - All entities in the dungeon
 * @returns {Object} - Result of the spell casting
 */
const executeWarlockBolt = (spell, caster, target, entities) => {
  const result = {
    success: true,
    hit: false,
    damage: 0,
    message: ''
  };
  
  // Calculate spell attack bonus based on spellcasting ability (Charisma for Warlocks)
  const spellcastingAbility = caster.properties.characterData?.attributes?.charisma || 
                             caster.properties.charisma || 10;
  
  // Get custom spell attack bonus if available
  const customSpellAttackBonus = caster.properties?.combat_bonuses?.spell_attack || 0;
  
  const proficiencyBonus = Math.floor((caster.properties.level || 1) / 4) + 2;
  const spellAttackBonus = Math.floor((spellcastingAbility - 10) / 2) + proficiencyBonus + customSpellAttackBonus;
  
  // Roll to hit
  const attackRoll = Math.floor(Math.random() * 20) + 1;
  const totalAttackRoll = attackRoll + spellAttackBonus;
  
  // Critical hit on natural 20
  const isCritical = attackRoll === 20;
  
  if (isCritical || totalAttackRoll >= target.properties.ac) {
    // Hit! Calculate damage
    result.hit = true;
    
    // Roll base damage (1d12)
    let damageRoll = 0;
    const rolls = [];
    
    // Roll 1d12 for level 1 spell
    for (let i = 0; i < 1; i++) {
      const roll = Math.floor(Math.random() * 12) + 1;
      rolls.push(roll);
      damageRoll += roll;
    }
    
    // Double damage on critical hit
    if (isCritical) {
      damageRoll *= 2;
    }
    
    result.damage = damageRoll;
    
    // Create message
    result.message = `${caster.properties.name} casts Warlock Bolt`;
    
    // Add attack roll info
    result.message += ` (${attackRoll} + ${spellAttackBonus} = ${totalAttackRoll} vs AC ${target.properties.ac})`;
    
    // Add damage info
    if (isCritical) {
      result.message += ` Critical hit! Damage: ${rolls.join(' + ')} × 2 = ${damageRoll} necrotic damage!`;
    } else {
      result.message += ` Hit! Damage: ${rolls.join(' + ')} = ${damageRoll} necrotic damage!`;
    }
  } else {
    // Miss
    result.message = `${caster.properties.name} casts Warlock Bolt (${attackRoll} + ${spellAttackBonus} = ${totalAttackRoll} vs AC ${target.properties.ac}). Miss!`;
  }
  
  return result;
};