/**
 * Utilities for integrating character sheet data with the dungeon module
 */

// Import spell options for character sheets
import { SPELL_OPTIONS, convertSpellToClassAbility } from './spellOptions';

// Weapon options for dropdown selection in character sheets
export const WEAPON_OPTIONS = [
  { name: "Shortsword", damage: "1d6", damageType: "piercing", properties: ["finesse", "light"] },
  { name: "Longsword", damage: "1d8", damageType: "slashing", properties: ["versatile"] },
  { name: "Greatsword", damage: "2d6", damageType: "slashing", properties: ["two-handed", "heavy"] },
  { name: "Battleaxe", damage: "1d8", damageType: "slashing", properties: ["versatile"] },
  { name: "Greataxe", damage: "1d12", damageType: "slashing", properties: ["two-handed", "heavy"] },
  { name: "Dagger", damage: "1d4", damageType: "piercing", properties: ["finesse", "light", "thrown"] },
  { name: "Longbow", damage: "1d8", damageType: "piercing", properties: ["ammunition", "heavy", "two-handed"] },
  { name: "Gun", damage: "2d10", damageType: "piercing", properties: ["ammunition", "finesse"] },
  { name: "Rifle", damage: "2d12", damageType: "piercing", properties: ["ammunition", "heavy", "two-handed"] },
  { name: "Shortbow", damage: "1d6", damageType: "piercing", properties: ["ammunition", "two-handed"] },
  { name: "Crossbow, Light", damage: "1d8", damageType: "piercing", properties: ["ammunition", "loading", "two-handed"] },
  { name: "Crossbow, Heavy", damage: "1d10", damageType: "piercing", properties: ["ammunition", "heavy", "loading", "two-handed"] },
  { name: "Handaxe", damage: "1d6", damageType: "slashing", properties: ["light", "thrown"] },
  { name: "Javelin", damage: "1d6", damageType: "piercing", properties: ["thrown"] },
  { name: "Spear", damage: "1d6", damageType: "piercing", properties: ["thrown", "versatile"] }
];

// Armor options for dropdown selection in character sheets
export const ARMOR_OPTIONS = [
  { name: "Padded", armor_class: 11, type: "Light", dex_bonus: true, strength_required: 0 },
  { name: "Leather", armor_class: 11, type: "Light", dex_bonus: true, strength_required: 0 },
  { name: "Studded Leather", armor_class: 12, type: "Light", dex_bonus: true, strength_required: 0 },
  { name: "Hide", armor_class: 12, type: "Medium", dex_bonus: true, max_dex: 2, strength_required: 0 },
  { name: "Chain Shirt", armor_class: 13, type: "Medium", dex_bonus: true, max_dex: 2, strength_required: 0 },
  { name: "Scale Mail", armor_class: 14, type: "Medium", dex_bonus: true, max_dex: 2, strength_required: 0 },
  { name: "Breastplate", armor_class: 14, type: "Medium", dex_bonus: true, max_dex: 2, strength_required: 0 },
  { name: "Half Plate", armor_class: 15, type: "Medium", dex_bonus: true, max_dex: 2, strength_required: 0 },
  { name: "Ring Mail", armor_class: 14, type: "Heavy", dex_bonus: false, strength_required: 0 },
  { name: "Chain Mail", armor_class: 16, type: "Heavy", dex_bonus: false, strength_required: 13 },
  { name: "Splint", armor_class: 17, type: "Heavy", dex_bonus: false, strength_required: 15 },
  { name: "Plate", armor_class: 18, type: "Heavy", dex_bonus: false, strength_required: 15 },
  { name: "Shield", armor_class: 2, type: "Shield", dex_bonus: false, strength_required: 0, is_shield: true }
];

/**
 * Character Class Abilities: Maps class names to their special abilities
 */
export const CLASS_ABILITIES = {
  PALADIN: {
    DIVINE_SMITE: {
      name: "Divine Smite",
      description: "Infuse your weapon with divine energy. Adds 4d6 radiant damage to your next attack.",
      maxCharges: 5,
      keybind: "S",
      damageType: "radiant",
      damageDice: "1d6+1d6+1d6+1d6",
      isHealing: false,
    }
  },
  RANGER: {
    HUNTERS_MARK: {
      name: "Hunter's Mark",
      description: "Mark a creature as your quarry. Add 1d6 damage to weapon attacks against it.",
      maxCharges: 3,
      keybind: "M",
      damageType: "weapon",
      damageDice: "1d6",
      isHealing: false,
    }
  }
};

/**
 * Normalize character data by unwrapping any nested character object
 * @param {Object} data - The raw character data
 * @returns {Object} - Normalized character data
 */
export const normalizeCharacterData = (data) => {
  if (!data) return {};
  
  // If data has a character property that's an object, use that instead
  if (data.character && typeof data.character === 'object') {
    console.log("Found nested character data, unwrapping it");
    return data.character;
  }
  
  return data;
};

/**
 * Check if a character has a specific class (including subclasses)
 * @param {Object} characterData - The character data
 * @param {string} className - The class name to check for
 * @returns {boolean} - Whether the character has the specified class
 */
export const hasClass = (characterData, className) => {
  if (!characterData || !characterData.class) return false;
  
  // Check in both class and subclass fields if they exist
  const charClass = (characterData.class || '').toLowerCase();
  const charSubclass = (characterData.subclass || '').toLowerCase();
  
  return charClass.includes(className.toLowerCase()) || 
         charSubclass.includes(className.toLowerCase());
};

/**
 * Get available class abilities for a character
 * @param {Object} characterData - The character data
 * @returns {Array} - Array of available class abilities
 */
export const getClassAbilities = (characterData) => {
  if (!characterData) return [];
  
  const abilities = [];
  
  // Check for Paladin abilities
  if (hasClass(characterData, 'paladin')) {
    console.log("Detected Paladin class, adding Divine Smite ability");
    abilities.push({
      ...CLASS_ABILITIES.PALADIN.DIVINE_SMITE,
      charges: CLASS_ABILITIES.PALADIN.DIVINE_SMITE.maxCharges
    });
  }
  
  // Check for Ranger abilities
  if (hasClass(characterData, 'ranger')) {
    console.log("Detected Ranger class, adding Hunter's Mark ability");
    abilities.push({
      ...CLASS_ABILITIES.RANGER.HUNTERS_MARK,
      charges: CLASS_ABILITIES.RANGER.HUNTERS_MARK.maxCharges
    });
  }
  
  // If character has spellcasting, add those spells as abilities
  if (characterData.spellcasting && characterData.spellcasting.known_spells) {
    const spells = characterData.spellcasting.known_spells;
    spells.forEach(spell => {
      // Convert known spells into usable abilities
      if (spell === "Heal") {
        abilities.push({
          name: "Heal",
          description: "Restore hit points to a creature",
          charges: 3,
          keybind: "H",
          isHealing: true,
          isSelfTargeted: true,
          damage: "1d8+4"
        });
      } else if (spell === "Hunter's Mark") {
        // Skip if we already added Hunter's Mark from class abilities
        if (!abilities.some(a => a.name === "Hunter's Mark")) {
          abilities.push({
            ...CLASS_ABILITIES.RANGER.HUNTERS_MARK,
            charges: CLASS_ABILITIES.RANGER.HUNTERS_MARK.maxCharges
          });
        }
      } else {
        // Convert other spells using the utility function
        const spellAbility = convertSpellToClassAbility(spell);
        if (spellAbility) {
          abilities.push(spellAbility);
        }
      }
    });
  }
  
  return abilities;
};

/**
 * Process and convert character spells to usable game abilities
 * @param {Object} characterData - The character data
 * @returns {Array} - Array of spell abilities ready to use in combat
 */
export const convertSpellsToAttacks = (characterData) => {
  if (!characterData || !characterData.spellcasting || !characterData.spellcasting.known_spells) {
    return [];
  }
  
  const knownSpells = characterData.spellcasting.known_spells || [];
  const spellAttacks = [];
  
  // Find the matching spell data from SPELL_OPTIONS
  knownSpells.forEach(spellName => {
    // Find the spell in our predefined list
    const foundSpell = SPELL_OPTIONS.find(s => 
      s.name.toLowerCase() === spellName.toLowerCase()
    );
    
    if (foundSpell) {
      // Convert to ability format for use in combat
      spellAttacks.push(convertSpellToClassAbility(foundSpell));
    } else {
      // If not in our predefined list, create a basic spell ability
      console.log(`Creating generic spell ability for: ${spellName}`);
      spellAttacks.push({
        name: spellName,
        description: `Cast ${spellName}`,
        damage: "1d6",
        damageType: "magical",
        isSpell: true,
        isPureSpell: true,
        charges: 3,
        level: "1" // Default to level 1 if unknown
      });
    }
  });
  
  return spellAttacks;
};

/**
 * Calculate spell attack bonus based on character's spellcasting ability
 * @param {Object} characterData - The character data
 * @returns {Number} - Calculated spell attack bonus
 */
export const calculateSpellAttackBonus = (characterData) => {
  if (!characterData) return 0;
  
  const attributes = characterData.attributes || {};
  const level = characterData.level || 1;
  
  // Calculate proficiency bonus
  const profBonus = Math.ceil(1 + (level / 4));
  
  // Determine spellcasting ability based on class
  let spellAbilityMod = 0;
  const charClass = (characterData.class || '').toLowerCase();
  
  if (charClass.includes('wizard') || charClass.includes('artificer')) {
    // Intelligence-based casters
    const int = attributes.intelligence || attributes.int || 10;
    spellAbilityMod = Math.floor((int - 10) / 2);
  } else if (charClass.includes('cleric') || charClass.includes('druid') || 
             charClass.includes('ranger') || charClass.includes('monk')) {
    // Wisdom-based casters
    const wis = attributes.wisdom || attributes.wis || 10;
    spellAbilityMod = Math.floor((wis - 10) / 2);
  } else if (charClass.includes('bard') || charClass.includes('paladin') || 
             charClass.includes('sorcerer') || charClass.includes('warlock')) {
    // Charisma-based casters
    const cha = attributes.charisma || attributes.cha || 10;
    spellAbilityMod = Math.floor((cha - 10) / 2);
  }
  
  // Return spell attack bonus: ability modifier + proficiency bonus
  return spellAbilityMod + profBonus;
};

/**
 * Calculate spell save DC based on character's spellcasting ability
 * @param {Object} characterData - The character data
 * @returns {Number} - Calculated spell save DC
 */
export const calculateSpellSaveDC = (characterData) => {
  // Base DC is 8 + proficiency + ability modifier
  return 8 + calculateSpellAttackBonus(characterData);
};

/**
 * Convert character data from a character sheet format to a player entity for the dungeon
 * @param {Object} characterData - Character data from imported JSON
 * @param {number} x - Starting x position
 * @param {number} y - Starting y position
 * @returns {Object} - Player entity compatible with the dungeon module
 */
export const convertCharacterToPlayerEntity = (characterData, x, y) => {
  // Handle null or undefined character data
  if (!characterData) {
    console.error("Null or undefined character data provided");
    return {
      id: `player_${Math.random().toString(36).substr(2, 9)}`,
      type: 'player',
      x, y,
      properties: {
        name: 'Default Character',
        level: 1,
        hp: 10,
        maxHp: 10,
        ac: 10,
        attackBonus: 0,
        damageBonus: 0,
        speed: 30,
        characterData: {},
        weapons: [{
          name: 'Dagger',
          damage: '1d4',
          damageType: 'piercing',
          properties: ['light', 'finesse'],
          attackBonus: 0,
          type: 'weapon'
        }]
      }
    };
  }
  
  console.log("Converting character data to player entity:", characterData.name);
  
  try {
    // ========== EXTRACT BASE CHARACTER DATA ==========
    const attributes = characterData.attributes || {};
    const equipment = characterData.equipment || {};
    const hitPoints = characterData.hit_points || {};
    const combatBonuses = characterData.combat_bonuses || {};
    
    // ========== CALCULATE LEVEL & PROFICIENCY BONUS ==========
    let level = characterData.level || 1;
    // Extract level from class string if needed (e.g. "Fighter 5")
    if (!characterData.level && characterData.class) {
      const levelMatch = characterData.class.match(/\d+/);
      level = levelMatch ? parseInt(levelMatch[0]) : 1;
    }
    
    // Standard D&D 5e proficiency bonus calculation
    const proficiencyBonus = Math.floor((level - 1) / 4) + 2;
    console.log(`Character Level: ${level}, Proficiency Bonus: +${proficiencyBonus}`);
    
    // ========== EXTRACT ATTRIBUTES & CALCULATE MODIFIERS ==========
    // Get all attributes with proper fallbacks
    const strength = attributes.strength || attributes.str || 10;
    const dexterity = attributes.dexterity || attributes.dex || 10;  
    const constitution = attributes.constitution || attributes.con || 10;
    const intelligence = attributes.intelligence || attributes.int || 10;
    const wisdom = attributes.wisdom || attributes.wis || 10;
    const charisma = attributes.charisma || attributes.cha || 10;
    
    // Calculate ability modifiers using standard D&D formula
    const strMod = Math.floor((strength - 10) / 2);
    const dexMod = Math.floor((dexterity - 10) / 2);
    const conMod = Math.floor((constitution - 10) / 2);
    const intMod = Math.floor((intelligence - 10) / 2);
    const wisMod = Math.floor((wisdom - 10) / 2);
    const chaMod = Math.floor((charisma - 10) / 2);
    
    // ========== HANDLE HIT POINTS ==========
    // Use the exact values from the character sheet
    const currentHp = hitPoints.current !== undefined ? hitPoints.current : (hitPoints.max || 10);
    const maxHp = hitPoints.max || 10;
    console.log(`HP: ${currentHp}/${maxHp}`);
    
    // ========== CALCULATE ARMOR CLASS ==========
    // Get AC directly from armor if available
    let armorClass = 10 + dexMod; // Default AC calculation
    if (equipment.armor && equipment.armor.armor_class) {
      armorClass = equipment.armor.armor_class;
      console.log(`Armor Class from equipment: ${armorClass}`);
    }
    
    // ========== PROCESS WEAPONS ==========
    // Process weapons to ensure they have all necessary properties for combat
    const weaponList = [];
    if (equipment.weapons && Array.isArray(equipment.weapons)) {
      console.log(`Processing ${equipment.weapons.length} weapons from character sheet`);
      
      equipment.weapons.forEach(weapon => {
        if (!weapon.name) return;
        
        // Get attack bonus - either directly from weapon or calculate it
        let attackBonus;
        
        // First try to get attack bonus directly from weapon
        if (weapon.attack_bonus !== undefined) {
          if (typeof weapon.attack_bonus === 'number') {
            attackBonus = weapon.attack_bonus;
          } else if (typeof weapon.attack_bonus === 'string') {
            // Handle string format like "+5"
            const match = weapon.attack_bonus.match(/([+-]?\d+)/);
            if (match) {
              attackBonus = parseInt(match[1]);
            }
          }
        } 
        // If no attack bonus specified, calculate it based on ability scores and proficiency
        else {
          // Default to strength modifier for melee weapons, dexterity for ranged
          const weaponName = weapon.name.toLowerCase();
          const isRanged = weaponName.includes('bow') || 
                           weaponName.includes('crossbow') || 
                           weaponName.includes('gun') || 
                           weaponName.includes('dart') || 
                           weaponName.includes('javelin');
          
          const isFinesse = weaponName.includes('rapier') || 
                           weaponName.includes('dagger') || 
                           weaponName.includes('scimitar');
          
          // For finesse weapons, use the higher of STR or DEX
          if (isFinesse) {
            attackBonus = Math.max(strMod, dexMod) + proficiencyBonus;
          }
          // For ranged weapons, use DEX
          else if (isRanged) {
            attackBonus = dexMod + proficiencyBonus;
          }
          // For all other weapons, use STR
          else {
            attackBonus = strMod + proficiencyBonus;
          }
        }
        
        // Get weapon damage
        let damage = weapon.damage || '1d6';
        
        // Determine damage type based on weapon properties or name
        let damageType = weapon.damageType;
        if (!damageType) {
          const weaponName = weapon.name.toLowerCase();
          
          // Determine damage type based on weapon name
          if (weaponName.includes('gun') || 
              weaponName.includes('pistol') || 
              weaponName.includes('rifle') || 
              weaponName.includes('crossbow') || 
              weaponName.includes('dart') || 
              weaponName.includes('spear') || 
              weaponName.includes('pike') || 
              weaponName.includes('rapier') || 
              weaponName.includes('dagger')) {
            damageType = 'piercing';
          } else if (weaponName.includes('sword') || 
                    weaponName.includes('axe') || 
                    weaponName.includes('scimitar') || 
                    weaponName.includes('glaive')) {
            damageType = 'slashing';
          } else if (weaponName.includes('hammer') || 
                    weaponName.includes('mace') || 
                    weaponName.includes('staff') || 
                    weaponName.includes('club') || 
                    weaponName.includes('flail')) {
            damageType = 'bludgeoning';
          }
        }
        
        // Get or determine weapon properties
        let properties = weapon.properties || [];
        if (!Array.isArray(properties)) {
          properties = [];
        }
        
        // Add weapon to the list with all necessary properties
        weaponList.push({
          name: weapon.name,
          damage: damage,
          damageType: damageType || 'slashing', // Default to slashing if unknown
          attack_bonus: weapon.attack_bonus, // Keep original format for compatibility
          attackBonus: attackBonus, // Calculated or parsed attack bonus
          properties: properties,
          // Additional properties needed for game mechanics
          type: 'weapon'
        });
        
        console.log(`Processed weapon: ${weapon.name} (${damage}, +${attackBonus} to hit)`);
      });
    }
      // Create the player entity with all necessary properties
    const playerEntity = {
      id: `player_${Math.random().toString(36).substr(2, 9)}`,
      type: 'player',
      x, y,
      properties: {
        // Basic character information
        name: characterData.name || 'Unknown Character',
        level: level,
        hp: currentHp,
        maxHp: maxHp,
        ac: armorClass,
        
        // Ability Modifiers
        strMod, dexMod, conMod, intMod, wisMod, chaMod,
        
        // Character Skills & Proficiencies
        skills: characterData.skills || {},
        savingThrows: characterData.saving_throws || {},
        proficiencies: characterData.proficiencies || [],
        languages: characterData.languages || [],
        
        // Movement speed (parse from string like "30 ft." if needed)
        speed: parseInt((characterData.speed || '30').match(/\d+/)?.[0] || '30'),
        
        // Equipment - Weapons with proper attack bonuses
        weapons: weaponList,
        
        // Default weapon selection
        selectedWeapon: weaponList.length > 0 ? weaponList[0] : null,
        
        // Features, Traits & Spellcasting
        featuresAndTraits: characterData.features_traits || [],
        spellcasting: characterData.spellcasting || {},
        
        // Store the original character data for reference
        characterData: characterData
      }
    };
    
    // Add class abilities
    playerEntity.properties.classAbilities = getClassAbilities(characterData);
    
    console.log("Successfully created player entity with weapons:", 
                weaponList.map(w => `${w.name} (${w.damage})`).join(", "));
    
    return playerEntity;
  } catch (error) {
    console.error("Error converting character data:", error);
    return {
      id: `player_${Math.random().toString(36).substr(2, 9)}`,
      type: 'player',
      x, y,
      properties: {
        name: characterData.name || 'Error Character',
        level: 1,
        hp: 10,
        maxHp: 10,
        ac: 10,
        attackBonus: 0,
        damageBonus: 0,
        speed: 30,
        weapons: [{
          name: 'Backup Dagger',
          damage: '1d4',
          damageType: 'piercing',
          properties: ['light', 'finesse'],
          attackBonus: 0,
          type: 'weapon'
        }],
        characterData: characterData // Still store the original data for debugging
      }
    };
  }
};

/**
 * Calculate damage for a character's attack based on their weapon
 * @param {Object} rawCharacterData - The character data
 * @param {boolean} isCritical - Whether this is a critical hit
 * @returns {Object} - The damage details
 */
export const calculateCharacterDamage = (rawCharacterData, isCritical = false) => {
  if (!rawCharacterData) return { total: 0 };
  
  // Normalize character data
  const characterData = normalizeCharacterData(rawCharacterData);
  
  const weapons = characterData.equipment?.weapons || [];
  
  // If no weapons, use unarmed strike
  if (weapons.length === 0) {
    const attributes = characterData.attributes || {};
    const strength = attributes.strength || 10;
    const strMod = Math.floor((strength - 10) / 2);
    return {
      diceRoll: isCritical ? 2 : 1,
      diceType: 4,
      bonus: strMod,
      total: isCritical ? (1 + 1 + strMod) : (1 + strMod) // 1d4 unarmed damage
    };
  }
  
  // Use first weapon in the list
  const weapon = weapons[0];
  const damageStr = weapon.damage || '1d4';
  
  // Parse damage dice (e.g., "1d8+3")
  const diceMatch = damageStr.match(/(\d+)d(\d+)(?:\+(\d+))?/);
  
  if (diceMatch) {
    const numDice = parseInt(diceMatch[1], 10);
    const diceType = parseInt(diceMatch[2], 10);
    const bonus = diceMatch[3] ? parseInt(diceMatch[3], 10) : 0;
    
    // Roll individual dice and sum the results
    let diceRolls = [];
    const diceCount = isCritical ? numDice * 2 : numDice;
    
    for (let i = 0; i < diceCount; i++) {
      diceRolls.push(Math.floor(Math.random() * diceType) + 1);
    }
    
    const diceRoll = diceRolls.reduce((sum, roll) => sum + roll, 0);
    
    return {
      diceRoll,
      diceType,
      bonus,
      total: diceRoll + bonus,
      rolls: diceRolls // Added for debugging
    };
  }
  
  // Fallback damage
  return {
    diceRoll: isCritical ? 2 : 1,
    diceType: 4,
    bonus: 0,
    total: isCritical ? 2 : 1
  };
};

/**
 * Format damage calculation as a readable string
 * @param {Object} damage - The damage calculation object
 * @returns {string} - A formatted string describing the damage
 */
export const formatDamageCalc = (damage) => {
  if (!damage) return "0";
  return `${damage.diceRoll} [${damage.diceType}] + ${damage.bonus} = ${damage.total}`;
};