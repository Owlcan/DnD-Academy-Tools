/**
 * Spell options for character spell selection dropdowns
 */

// Common spell options for selection in character sheets
export const SPELL_OPTIONS = [
  // Cantrips
  { 
    name: "Fire Bolt", 
    level: "Cantrip", 
    school: "Evocation", 
    damage: "1d10", 
    damageType: "fire", 
    classes: ["Sorcerer", "Wizard"],
    isCantrip: true,
    description: "Hurl a mote of fire at a creature or object",
    castingTime: "1 action",
    range: "120 feet"
  },
  { 
    name: "Eldritch Blast", 
    level: "Cantrip", 
    school: "Evocation", 
    damage: "1d10", 
    damageType: "force", 
    classes: ["Warlock"],
    isCantrip: true,
    description: "A beam of crackling energy streaks toward a creature",
    castingTime: "1 action",
    range: "120 feet",
    isRangedSpell: true
  },
  { 
    name: "Sacred Flame", 
    level: "Cantrip", 
    school: "Evocation", 
    damage: "1d8", 
    damageType: "radiant", 
    classes: ["Cleric"],
    isCantrip: true,
    description: "Flame-like radiance descends on a creature",
    castingTime: "1 action",
    range: "60 feet"
  },
  { 
    name: "Shocking Grasp", 
    level: "Cantrip", 
    school: "Evocation", 
    damage: "1d8", 
    damageType: "lightning", 
    classes: ["Sorcerer", "Wizard"],
    isCantrip: true,
    description: "Lightning springs from your hand to deliver a shock",
    castingTime: "1 action",
    range: "Touch"
  },
  
  // Level 1 Spells
  { 
    name: "Magic Missile", 
    level: "1", 
    school: "Evocation", 
    damage: "3d4+3", 
    damageType: "force", 
    classes: ["Sorcerer", "Wizard"],
    description: "Three glowing darts of force strike a target",
    castingTime: "1 action",
    range: "120 feet"
  },
  { 
    name: "Cure Wounds", 
    level: "1", 
    school: "Evocation", 
    damage: "1d8+4", 
    damageType: "healing", 
    classes: ["Cleric", "Druid", "Paladin", "Bard", "Ranger"],
    description: "Heal a creature you touch",
    castingTime: "1 action",
    range: "Touch",
    isHealing: true,
    isSelfTargeted: true
  },
  { 
    name: "Guiding Bolt", 
    level: "1", 
    school: "Evocation", 
    damage: "4d6", 
    damageType: "radiant", 
    classes: ["Cleric"],
    description: "A flash of light strikes a creature of your choice",
    castingTime: "1 action",
    range: "120 feet"
  },
  { 
    name: "Burning Hands", 
    level: "1", 
    school: "Evocation", 
    damage: "3d6", 
    damageType: "fire", 
    classes: ["Sorcerer", "Wizard"],
    description: "Fire spreads out from your hands",
    castingTime: "1 action",
    range: "Self (15-foot cone)"
  },
  
  // Level 2 Spells
  { 
    name: "Scorching Ray", 
    level: "2", 
    school: "Evocation", 
    damage: "6d6", 
    damageType: "fire", 
    classes: ["Sorcerer", "Wizard"],
    description: "Three rays of fire streak toward targets",
    castingTime: "1 action",
    range: "120 feet"
  },
  { 
    name: "Spiritual Weapon", 
    level: "2", 
    school: "Evocation", 
    damage: "1d8+4", 
    damageType: "force", 
    classes: ["Cleric"],
    description: "Create a floating spectral weapon that strikes foes",
    castingTime: "1 bonus action",
    range: "60 feet"
  },
  { 
    name: "Lesser Restoration", 
    level: "2", 
    school: "Abjuration", 
    classes: ["Bard", "Cleric", "Druid", "Paladin", "Ranger"],
    description: "End one disease or condition afflicting a creature",
    castingTime: "1 action",
    range: "Touch"
  },
  
  // Level 3 Spells
  { 
    name: "Fireball", 
    level: "3", 
    school: "Evocation", 
    damage: "8d6", 
    damageType: "fire", 
    classes: ["Sorcerer", "Wizard"],
    description: "A bright streak flashes from your finger to a point you choose and then blossoms into an explosion of flame",
    castingTime: "1 action",
    range: "150 feet"
  },
  { 
    name: "Lightning Bolt", 
    level: "3", 
    school: "Evocation", 
    damage: "8d6", 
    damageType: "lightning", 
    classes: ["Sorcerer", "Wizard"],
    description: "A stroke of lightning forming a line from you to a target",
    castingTime: "1 action",
    range: "Self (100-foot line)"
  },
  { 
    name: "Mass Healing Word", 
    level: "3", 
    school: "Evocation", 
    damage: "1d4+4", 
    damageType: "healing", 
    classes: ["Cleric", "Bard"],
    description: "Heal up to six creatures that you can see",
    castingTime: "1 bonus action",
    range: "60 feet",
    isHealing: true
  },
  
  // Level 4+ Spells
  { 
    name: "Ice Storm", 
    level: "4", 
    school: "Evocation", 
    damage: "2d8+4d6", 
    damageType: "cold", 
    classes: ["Druid", "Sorcerer", "Wizard"],
    description: "A hail of rock-hard ice pounds an area",
    castingTime: "1 action",
    range: "300 feet"
  },
  { 
    name: "Flame Strike", 
    level: "5", 
    school: "Evocation", 
    damage: "8d6", 
    damageType: "fire", 
    classes: ["Cleric"],
    description: "A column of divine fire roars down",
    castingTime: "1 action",
    range: "60 feet"
  },
  { 
    name: "Mass Cure Wounds", 
    level: "5", 
    school: "Evocation", 
    damage: "3d8+4", 
    damageType: "healing", 
    classes: ["Bard", "Cleric", "Druid"],
    description: "A wave of healing energy washes out from a point",
    castingTime: "1 action",
    range: "60 feet",
    isHealing: true
  }
];

/**
 * Get available spells for a specific character class
 * @param {string} characterClass - The character's class
 * @returns {Array} - Array of spells available to that class
 */
export const getSpellsByClass = (characterClass) => {
  if (!characterClass) return [];
  
  const className = characterClass.toLowerCase();
  
  return SPELL_OPTIONS.filter(spell => {
    return spell.classes.some(spellClass => 
      spellClass.toLowerCase().includes(className) ||
      className.includes(spellClass.toLowerCase())
    );
  });
};

/**
 * Get spells of a specific level
 * @param {string} level - The spell level ("Cantrip", "1", "2", etc.)
 * @returns {Array} - Array of spells of that level
 */
export const getSpellsByLevel = (level) => {
  if (!level) return [];
  return SPELL_OPTIONS.filter(spell => spell.level === level);
};

/**
 * Convert a spell to a class ability format for the game engine
 * @param {Object} spell - The spell data
 * @returns {Object} - The spell converted to a class ability
 */
export const convertSpellToClassAbility = (spell) => {
  if (!spell) return null;
  
  return {
    name: spell.name,
    description: spell.description,
    damage: spell.damage || "0",
    damageType: spell.damageType || "magical",
    isSpell: true,
    isCantrip: spell.level === "Cantrip",
    isPureSpell: true,
    isRangedSpell: spell.range && parseInt(spell.range) > 5,
    isHealing: spell.isHealing || false,
    isSelfTargeted: spell.isSelfTargeted || false,
    charges: spell.level === "Cantrip" ? Infinity : 
             parseInt(spell.level) <= 3 ? 3 : 
             parseInt(spell.level) <= 6 ? 2 : 1,
    level: spell.level
  };
};
