/**
 * Utility functions for converting D&D 5e spells to attack objects that our
 * combat system can process
 */

/**
 * Convert character spells into attack objects
 * @param {Object} character - Character object containing spells
 * @returns {Array} Array of spell attack objects
 */
export const getSpellAttacks = (character) => {
  if (!character || !character.spells) {
    return [];
  }

  const spellList = [];
  
  // Process spells known
  if (character.spells.known) {
    Object.entries(character.spells.known).forEach(([level, spells]) => {
      spells.forEach(spell => {
        spellList.push(convertSpellToAttack(spell, parseInt(level), character));
      });
    });
  }
  
  // Process cantrips
  if (character.spells.cantrips) {
    character.spells.cantrips.forEach(cantrip => {
      spellList.push(convertSpellToAttack(cantrip, 0, character));
    });
  }
  
  return spellList;
};

/**
 * Convert a D&D 5e spell to an attack object
 * @param {Object|string} spell - Spell object or spell name
 * @param {number} level - Spell level (0 for cantrips)
 * @param {Object} character - Character casting the spell
 * @returns {Object} Spell attack object
 */
const convertSpellToAttack = (spell, level, character) => {
  // If spell is just a string (name), create a basic object
  if (typeof spell === 'string') {
    spell = {
      name: spell,
      // Use predefined spell data if available, otherwise use defaults
      ...getSpellDataByName(spell)
    };
  }
  
  // Get character's spellcasting ability
  const spellcastingAbility = character.spellcastingAbility || determineSpellcastingAbility(character);
  const spellcastingMod = getAbilityModifier(character, spellcastingAbility);
  
  // Create the spell attack object
  return {
    name: spell.name,
    level: level,
    isSpell: true,
    // Determine damage based on spell level and type
    damage: spell.damage || determineDamageByLevel(level),
    damageType: spell.damageType || 'magical',
    range: spell.range || 60,
    isHealing: spell.isHealing || spell.name.toLowerCase().includes('heal') || spell.name.toLowerCase().includes('cure'),
    spellcastingAbility,
    spellcastingMod,
    effects: spell.effects || [],
    description: spell.description || `A ${level === 0 ? 'cantrip' : `level ${level} spell`}`
  };
};

/**
 * Display spell options in the game log
 * @param {Array} spells - Array of spell attack objects
 * @param {Function} logFunction - Function to log messages
 */
export const displaySpellOptions = (spells, logFunction) => {
  if (!spells || !spells.length || !logFunction) return;
  
  logFunction('Choose a spell to cast:');
  
  spells.forEach((spell, index) => {
    const spellType = spell.isHealing ? 'Healing' : 'Damage';
    const levelText = spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`;
    
    logFunction(`${index}: ${spell.name} (${levelText}) - ${spell.damage} ${spell.damageType} ${spellType}`);
  });
  
  logFunction('Press the number key to cast, or ESC to cancel');
};

/**
 * Get predefined spell data by name
 * @param {string} name - Spell name
 * @returns {Object} Spell data
 */
const getSpellDataByName = (name) => {
  // Common D&D 5e spells
  const spellData = {
    'Magic Missile': {
      damage: '3d4+3',
      damageType: 'force',
      description: 'Three magical darts strike a target'
    },
    'Fireball': {
      damage: '8d6',
      damageType: 'fire',
      description: 'A bright streak flashes from your pointing finger to a point you choose and then blossoms with a low roar into an explosion of flame'
    },
    'Cure Wounds': {
      damage: '1d8',
      damageType: 'healing',
      isHealing: true,
      description: 'A creature you touch regains hit points'
    },
    'Fire Bolt': {
      damage: '1d10',
      damageType: 'fire',
      description: 'You hurl a mote of fire at a creature or object'
    },
    'Eldritch Blast': {
      damage: '1d10',
      damageType: 'force',
      description: 'A beam of crackling energy streaks toward a creature'
    },
    'Healing Word': {
      damage: '1d4',
      damageType: 'healing',
      isHealing: true,
      description: 'A creature of your choice regains hit points'
    },
    'Acid Splash': {
      damage: '1d6',
      damageType: 'acid',
      description: 'You hurl a bubble of acid'
    },
    'Chill Touch': {
      damage: '1d8',
      damageType: 'necrotic',
      description: 'A ghostly, skeletal hand springs from your body to strike a creature'
    }
  };
  
  return spellData[name] || {
    damage: '1d6',
    damageType: 'magical'
  };
};

/**
 * Determine character's spellcasting ability based on class
 * @param {Object} character - Character object
 * @returns {string} Spellcasting ability
 */
const determineSpellcastingAbility = (character) => {
  if (!character || !character.class) {
    return 'intelligence';
  }
  
  const classToAbility = {
    wizard: 'intelligence',
    sorcerer: 'charisma',
    warlock: 'charisma',
    bard: 'charisma',
    cleric: 'wisdom',
    druid: 'wisdom',
    paladin: 'charisma',
    ranger: 'wisdom'
  };
  
  return classToAbility[character.class.toLowerCase()] || 'intelligence';
};

/**
 * Determine default damage dice based on spell level
 * @param {number} level - Spell level
 * @returns {string} Damage dice formula
 */
const determineDamageByLevel = (level) => {
  if (level === 0) return '1d10'; // Cantrip
  return `${level}d8`; // Leveled spell
};

/**
 * Get ability modifier from ability score
 * @param {Object} character - Character object
 * @param {string} ability - Ability name
 * @returns {number} Ability modifier
 */
const getAbilityModifier = (character, ability) => {
  if (!character || !character.abilities || !character.abilities[ability]) {
    return 0;
  }
  
  const score = character.abilities[ability];
  return Math.floor((score - 10) / 2);
};