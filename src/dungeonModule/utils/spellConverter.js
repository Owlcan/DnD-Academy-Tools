/**
 * Utilities for converting character spells to combat abilities
 */
import { normalizeCharacterData } from './characterIntegration';

// Spell damage mapping
const SPELL_DAMAGE_MAP = {
  "Magic Missile": {
    name: "Magic Missile",
    damage: "3d4+3", // 3 missiles, each doing 1d4+1
    damageType: "force",
    description: "Three magical darts strike targets of your choice",
    isPureSpell: true,
    isRangedSpell: true,
    keybind: "m",
    charges: 3
  },
  "Hunter's Mark": {
    name: "Hunter's Mark",
    damage: "1d6",
    damageType: "weapon",
    description: "Mark a target to deal extra damage with weapon attacks",
    keybind: "h",
    charges: 3
  },
  "Guiding Bolt": {
    name: "Guiding Bolt",
    damage: "4d6",
    damageType: "radiant",
    description: "A flash of light strikes a creature of your choice",
    isPureSpell: true,
    isRangedSpell: true,
    keybind: "g",
    charges: 4
  },
  "Eldritch Blast": {
    name: "Eldritch Blast",
    damage: "1d10",
    damageType: "force",
    description: "A beam of crackling energy streaks toward a creature",
    isPureSpell: true,
    isRangedSpell: true,
    keybind: "e",
    charges: Infinity,
    isCantrip: true
  },
  "Fireball": {
    name: "Fireball",
    damage: "8d6",
    damageType: "fire",
    description: "A bright streak flashes from your finger to a point you choose and then blossoms with a low roar into an explosion of flame",
    isPureSpell: true,
    isRangedSpell: true,
    keybind: "f",
    charges: 1
  },
  "Cure Wounds": {
    name: "Cure Wounds",
    damage: "1d8+4",
    damageType: "healing",
    description: "A creature you touch regains hit points",
    isHealing: true,
    isSelfTargeted: true,
    keybind: "c",
    charges: 4
  },
  "Healing Word": {
    name: "Healing Word",
    damage: "1d4+4",
    damageType: "healing",
    description: "A creature of your choice regains hit points",
    isHealing: true,
    isSelfTargeted: true,
    keybind: "w",
    charges: 3
  },
  "Heal": {
    name: "Heal",
    damage: "2d8+4",
    damageType: "healing",
    description: "A wave of healing energy washes over a creature",
    isHealing: true,
    isSelfTargeted: true,
    keybind: "l",
    charges: 2
  },
  "Spike Growth": {
    name: "Spike Growth",
    damage: "2d4",
    damageType: "piercing",
    description: "The ground in a 20-foot radius is filled with spikes",
    isAOE: true,
    keybind: "s",
    charges: 1
  },
  "Silence": {
    name: "Silence",
    description: "No sound can be created within or pass through a 20-foot-radius sphere",
    isUtility: true,
    keybind: "z",
    charges: 2
  }
};

/**
 * Convert a character's known spells to combat ability objects
 * @param {Object} rawCharacterData - The character data
 * @returns {Array} - Array of spell abilities
 */
export const convertSpellsToAttacks = (rawCharacterData) => {
  if (!rawCharacterData) return [];
  
  // Normalize character data (handle nested character object)
  const characterData = normalizeCharacterData(rawCharacterData);
  
  console.log("Converting spells for character:", characterData.name);
  
  // If the character doesn't have spellcasting, return empty array
  if (!characterData.spellcasting || !characterData.spellcasting.known_spells) {
    console.log("No spellcasting data found for character");
    return [];
  }
  
  const knownSpells = characterData.spellcasting.known_spells || [];
  console.log("Known spells:", knownSpells);
  
  // Convert each known spell to a combat ability
  const spellAbilities = knownSpells.map(spellName => {
    // Look up the spell in our mapping
    const spellData = SPELL_DAMAGE_MAP[spellName];
    
    if (!spellData) {
      console.log(`No spell data found for spell: ${spellName}`);
      // Return a generic version of the spell
      return {
        name: spellName,
        description: `Cast the ${spellName} spell`,
        keybind: spellName.charAt(0).toLowerCase(),
        charges: 3,
        isSpell: true
      };
    }
    
    console.log(`Converting spell: ${spellName} to combat ability`);
    // Return the mapped spell data
    return {
      ...spellData,
      isSpell: true
    };
  });
  
  return spellAbilities;
};

/**
 * Get spell damage for a spell by name
 * @param {string} spellName - The name of the spell
 * @returns {Object} - The spell damage info
 */
export const getSpellDamage = (spellName) => {
  return SPELL_DAMAGE_MAP[spellName] || null;
};

// Export the spell map for reference
export const SPELLS = SPELL_DAMAGE_MAP;