/**
 * Utility to convert character spells to attack options
 */
import { DamageCalculator } from './diceUtils';

/**
 * Converts a spell object to an attack object
 * @param {Object} spell - The spell to convert
 * @param {number} index - The index for selection purposes
 * @returns {Object} - The attack object
 */
export const convertSpellToAttack = (spell, index) => {
  // Default attack object structure
  const attack = {
    name: spell.name || "Unknown Spell",
    type: "Spell",
    damage: spell.damage || "1d8",
    damageType: spell.damageType || "force",
    range: spell.range || 30,
    isSpell: true, // Flag to identify this as a converted spell
    originalSpell: spell, // Store reference to original spell
    selectionKey: index, // Store index for selection
    isHealing: spell.isHealing || false
  };

  // Add any spell-specific modifiers or properties
  if (spell.description) {
    attack.description = spell.description;
  }

  // Handle healing spells differently
  if (spell.isHealing || spell.name.toLowerCase().includes("heal") || 
      spell.name.toLowerCase().includes("cure")) {
    attack.isHealing = true;
    attack.damageType = "healing";
  }

  return attack;
};

/**
 * Get spell attacks from character's known spells
 * @param {Object} character - The character object
 * @returns {Array} - Array of attack objects created from spells
 */
export const getSpellAttacks = (character) => {
  // Return empty array if character has no spells
  if (!character || !character.knownSpells || character.knownSpells.length === 0) {
    return [];
  }

  // Convert each spell to an attack
  return character.knownSpells.map((spell, index) => 
    convertSpellToAttack(spell, index)
  );
};

/**
 * Display spell attacks as options in text window
 * @param {Array} spellAttacks - Array of spell attacks
 * @param {Function} displayFunction - Function to display text in the game
 */
export const displaySpellOptions = (spellAttacks, displayFunction) => {
  if (!spellAttacks || spellAttacks.length === 0) {
    displayFunction("You have no spells available.");
    return;
  }

  // Build options string
  let optionsText = "Available Spells:\n";
  spellAttacks.forEach((spell, index) => {
    const healingText = spell.isHealing ? " (Healing)" : "";
    optionsText += `${index}: ${spell.name}${healingText} - ${spell.damage} ${spell.damageType}\n`;
  });
  
  displayFunction(optionsText);
};

/**
 * Calculate spell damage consistently using the DamageCalculator
 * @param {Object} spell - The spell being cast
 * @param {Object} caster - The entity casting the spell
 * @param {boolean} isCritical - Whether this is a critical hit
 * @returns {Object} - Detailed damage result
 */
export const calculateSpellDamage = (spell, caster, isCritical = false) => {
  if (!spell) {
    return {
      total: 0,
      rolls: [],
      formula: "No spell",
      damageType: "force"
    };
  }
  
  // Get the damage formula from the spell
  const damageFormula = spell.damage || '1d10';
  
  // Determine spellcasting ability modifier
  const spellcastingMod = getSpellcastingModifier(caster, spell);
  
  // Calculate damage using our unified calculator
  const result = DamageCalculator.calculateDamage(damageFormula, {
    isCritical,
    characterBonus: spell.useSpellcastingMod ? spellcastingMod : 0,
    damageType: spell.damageType || 'force'
  });
  
  // Add a formatted string for display - simplified format
  result.formattedString = `${result.rolls.join(' + ')}${result.bonus > 0 ? ' + ' + result.bonus : ''} = ${result.total} ${result.damageType}`;
  
  return result;
};

/**
 * Calculate spell attack bonus for a caster
 * @param {Object} caster - The entity casting the spell
 * @returns {number} - The spell attack bonus
 */
export const calculateSpellAttackBonus = (caster) => {
  const spellcastingAbility = determineSpellcastingAbility(caster);
  const abilityMod = getAbilityModifier(caster, spellcastingAbility);
  const profBonus = getProficiencyBonus(caster);
  
  return abilityMod + profBonus;
};

/**
 * Helper function to determine the caster's spellcasting ability
 * @param {Object} caster - The entity casting the spell
 * @returns {string} - The spellcasting ability ("intelligence", "wisdom", or "charisma")
 */
export const determineSpellcastingAbility = (caster) => {
  if (!caster || !caster.properties) {
    return "wisdom"; // Default fallback
  }
  
  const characterClass = 
    caster.properties.characterData?.class?.toLowerCase() || 
    caster.properties.class?.toLowerCase() || 
    '';
    
  // Determine spellcasting ability based on class
  if (characterClass.includes('wizard') || characterClass.includes('artificer')) {
    return "intelligence";
  } else if (characterClass.includes('cleric') || characterClass.includes('druid') || 
             characterClass.includes('ranger') || characterClass.includes('monk')) {
    return "wisdom";
  } else if (characterClass.includes('sorcerer') || characterClass.includes('warlock') || 
             characterClass.includes('bard') || characterClass.includes('paladin')) {
    return "charisma";
  }
  
  // If we can't determine, default to wisdom
  return "wisdom";
};

/**
 * Get the ability modifier value for a character
 * @param {Object} character - The character object
 * @param {string} ability - The ability to get the modifier for ("strength", "dexterity", etc.)
 * @returns {number} - The ability modifier
 */
export const getAbilityModifier = (character, ability) => {
  if (!character || !character.properties) {
    return 0;
  }
  
  // Try to get the ability score from various possible locations
  const abilityScore = 
    character.properties.attributes?.[ability] || 
    character.properties.characterData?.attributes?.[ability] || 
    character.properties[ability] || 
    10;
  
  // Calculate modifier using D&D 5e formula
  return Math.floor((abilityScore - 10) / 2);
};

/**
 * Get the spellcasting modifier for a character and spell
 * @param {Object} character - The character object
 * @param {Object} spell - The spell object
 * @returns {number} - The spellcasting modifier
 */
export const getSpellcastingModifier = (character, spell) => {
  const ability = determineSpellcastingAbility(character);
  return getAbilityModifier(character, ability);
};

/**
 * Get the proficiency bonus based on character level
 * @param {Object} character - The character object
 * @returns {number} - The proficiency bonus
 */
export const getProficiencyBonus = (character) => {
  if (!character || !character.properties) {
    return 2; // Default proficiency bonus
  }
  
  const level = 
    character.properties.level || 
    character.properties.characterData?.level || 
    1;
  
  // D&D 5e proficiency bonus formula
  return Math.floor((level - 1) / 4) + 2;
};

/**
 * Resolve a spell attack against a target
 * @param {Object} caster - The spellcasting entity
 * @param {Object} target - The target entity
 * @param {Object} spell - The spell being cast
 * @returns {Object} - The result of the spell attack
 */
export const resolveSpellAttack = (caster, target, spell) => {
  if (!caster || !target || !spell) {
    return {
      success: false,
      message: "Invalid spell attack parameters"
    };
  }
  
  // Get names for display
  const casterName = caster.properties?.name || "Caster";
  const targetName = target.properties?.name || "Target";
  const spellName = spell.name || "Unknown Spell";
  
  // Calculate attack bonus
  const attackBonus = calculateSpellAttackBonus(caster);
  
  // Roll attack
  const attackRoll = Math.floor(Math.random() * 20) + 1;
  const attackTotal = attackRoll + attackBonus;
  
  // Get target AC
  const targetAC = target.properties?.ac || 10;
  
  // Check for hit
  const isCritical = attackRoll === 20;
  const hits = isCritical || attackTotal >= targetAC;
  
  // For healing spells, always hit allies
  const isHealing = spell.isHealing || 
                   spell.damageType === "healing" || 
                   spell.name.toLowerCase().includes("cure") || 
                   spell.name.toLowerCase().includes("heal");
  
  const isAlly = caster.type === target.type; // Simple ally check
  
  if (isHealing && isAlly) {
    // Healing spells on allies always succeed
    const healingResult = calculateSpellDamage(spell, caster, false);
    
    return {
      success: true,
      hit: true,
      isHealing: true,
      healing: healingResult.total,
      message: `${casterName} casts ${spellName} and heals ${targetName} for ${healingResult.total} hit points!`,
      healingDetails: healingResult
    };
  }
  
  // Handle normal attack spells
  if (!hits) {
    return {
      success: true,
      hit: false,
      message: `${casterName} casts ${spellName} at ${targetName} but misses! (Rolled ${attackRoll} + ${attackBonus} = ${attackTotal} vs AC ${targetAC})`
    };
  }
  
  // Calculate damage on hit
  const damageResult = calculateSpellDamage(spell, caster, isCritical);
  
  // Build result message
  let hitType = isCritical ? "critically hits" : "hits";
  const message = `${casterName} casts ${spellName} at ${targetName} and ${hitType}! ` +
                 `(Rolled ${attackRoll} + ${attackBonus} = ${attackTotal} vs AC ${targetAC}) ` +
                 `Damage: ${damageResult.formattedString}`;
  
  return {
    success: true,
    hit: true,
    critical: isCritical,
    damage: damageResult.total,
    damageType: spell.damageType,
    damageDetails: damageResult,
    message
  };
};