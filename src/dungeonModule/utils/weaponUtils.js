// Import only what's needed
import { DamageCalculator } from './diceUtils';

// Weapon properties for calculating damage and other effects
export const WEAPON_PROPERTIES = {
  MELEE: {
    'Longsword': { damage: '1d8', damageType: 'slashing', isVersatile: true, versatileDamage: '1d10' },
    'Greatsword': { damage: '2d6', damageType: 'slashing', isTwoHanded: true },
    'Shortsword': { damage: '1d6', damageType: 'piercing', isFinesse: true },
    'Dagger': { damage: '1d4', damageType: 'piercing', isFinesse: true, isLight: true },
    'Battleaxe': { damage: '1d8', damageType: 'slashing', isVersatile: true, versatileDamage: '1d10' },
    'Greataxe': { damage: '1d12', damageType: 'slashing', isTwoHanded: true },
    'Warhammer': { damage: '1d8', damageType: 'bludgeoning', isVersatile: true, versatileDamage: '1d10' },
    'Maul': { damage: '2d6', damageType: 'bludgeoning', isTwoHanded: true },
    'Quarterstaff': { damage: '1d6', damageType: 'bludgeoning', isVersatile: true, versatileDamage: '1d8' }
  },
  RANGED: {
    'Longbow': { damage: '1d8', damageType: 'piercing', range: 150, maxRange: 600, isTwoHanded: true, isRanged: true },
    'Shortbow': { damage: '1d6', damageType: 'piercing', range: 80, maxRange: 320, isTwoHanded: true, isRanged: true },
    'Heavy Crossbow': { damage: '1d10', damageType: 'piercing', range: 100, maxRange: 400, isTwoHanded: true, isRanged: true },
    'Light Crossbow': { damage: '1d8', damageType: 'piercing', range: 80, maxRange: 320, isTwoHanded: true, isRanged: true },
    'Hand Crossbow': { damage: '1d6', damageType: 'piercing', range: 30, maxRange: 120, isLight: true, isRanged: true }
  }
};

/**
 * Get all available weapons for a player character
 * @param {Object} character - The character object
 * @returns {Array} Array of available weapons
 */
export const getPlayerWeapons = (character) => {
  if (!character || !character.properties) {
    return [];
  }

  // Check for equipped weapons
  if (character.properties.equipment && 
      character.properties.equipment.weapons && 
      Array.isArray(character.properties.equipment.weapons)) {
    
    return character.properties.equipment.weapons;
  }
  
  // Check for character data format with equipment
  if (character.properties.characterData && 
      character.properties.characterData.equipment &&
      character.properties.characterData.equipment.weapons) {
    
    return character.properties.characterData.equipment.weapons;
  }
  
  // Default to unarmed attack if no weapons found
  return [{
    name: "Unarmed Strike",
    damage: "1d4",
    damageType: "bludgeoning",
    isFinesse: false,
    isUnarmed: true
  }];
};

/**
 * Determine best weapon to use against a target based on range and damage
 * @param {Object} attacker - The attacking character
 * @param {Object} defender - The defending character
 * @returns {Object} The best weapon to use
 */
export const getBestWeaponForTarget = (attacker, defender) => {
  const weapons = getPlayerWeapons(attacker);
  
  if (!weapons || weapons.length === 0) {
    // Return default unarmed attack
    return {
      name: "Unarmed Strike",
      damage: "1d4",
      damageType: "bludgeoning"
    };
  }
  
  // Calculate distance to target
  const distance = calculateDistance(attacker, defender);
  
  // Filter weapons by range
  const availableWeapons = weapons.filter(weapon => {
    if (weapon.range) {
      return distance <= weapon.range;
    }
    // Assume melee range (5 feet / 1 square) if no range specified
    return distance <= 1;
  });
  
  if (availableWeapons.length === 0) {
    // No weapons in range, use first weapon in inventory
    return weapons[0];
  }
  
  // For now, just return the first available weapon
  // In a more advanced system, we could calculate expected damage
  // based on target attributes, resistances, etc.
  return availableWeapons[0];
};

/**
 * Calculate distance between two entities
 * @param {Object} entity1 - First entity
 * @param {Object} entity2 - Second entity
 * @returns {number} Distance in grid units
 */
export const calculateDistance = (entity1, entity2) => {
  if (!entity1 || !entity2) return Infinity;
  
  const dx = Math.abs(entity1.x - entity2.x);
  const dy = Math.abs(entity1.y - entity2.y);
  
  // Use Euclidean distance, rounded up to match D&D 5e grid movement
  return Math.ceil(Math.sqrt(dx * dx + dy * dy));
};

/**
 * Calculate damage for a weapon attack using the new DamageCalculator
 * @param {Object} weapon - The weapon being used
 * @param {boolean} isCritical - Whether the attack is a critical hit
 * @param {number} characterBonus - Character's damage bonus
 * @returns {Object} Detailed damage information
 */
export const calculateWeaponDamage = (weapon, isCritical = false, characterBonus = 0) => {
  if (!weapon) {
    return {
      total: 0,
      rolls: [],
      formula: "No weapon"
    };
  }
  
  // Get the damage formula from the weapon
  const damageFormula = weapon.damage || '1d6';
  
  // Calculate damage using our unified calculator
  const result = DamageCalculator.calculateDamage(damageFormula, {
    isCritical,
    characterBonus,
    damageType: weapon.damageType || 'physical'
  });
  
  // Add a friendly readable string to the result
  result.formattedString = DamageCalculator.formatDamage(result);
  
  return result;
};

/**
 * Resolve a player's attack against a target
 * @param {Object} attacker - The attacking character
 * @param {Object} defender - The defending character
 * @param {Object} weapon - The weapon being used (optional)
 * @returns {Object} Result of the attack
 */
export const resolvePlayerAttack = (attacker, defender, weapon = null) => {
  // Get attacker properties
  const attackerName = attacker.properties?.name || 'Unnamed';
  const level = attacker.properties?.level || 1;
  
  // Calculate proficiency bonus based on level
  const profBonus = Math.floor((level - 1) / 4) + 2;
  
  // Get defender properties
  const defenderName = defender.properties?.name || 'Unnamed';
  const targetAC = defender.properties?.ac || 10;
  
  // If no weapon specified, get the best one
  const selectedWeapon = weapon || getBestWeaponForTarget(attacker, defender);
  const weaponName = selectedWeapon?.name || "Unarmed Strike";
  
  // Determine which ability modifier to use
  let abilityMod = 0;
  let abilityScore = 10;
  
  // Get character's strength and dexterity scores
  const str = attacker.properties?.attributes?.strength || attacker.properties?.strength || 10;
  const dex = attacker.properties?.attributes?.dexterity || attacker.properties?.dexterity || 10;
  
  // Explicitly check for isRanged property first
  if (selectedWeapon.isRanged) {
    // Use DEX for all ranged weapons
    abilityScore = dex;
    abilityMod = Math.floor((dex - 10) / 2);
  }
  else if (selectedWeapon.isFinesse) {
    // Use the better of STR or DEX for finesse weapons
    if (dex > str) {
      abilityScore = dex;
      abilityMod = Math.floor((dex - 10) / 2);
    } else {
      abilityScore = str;
      abilityMod = Math.floor((str - 10) / 2);
    }
  }
  else {
    // Use STR for standard melee weapons
    abilityScore = str;
    abilityMod = Math.floor((str - 10) / 2);
  }
  
  // Get custom combat bonuses if available
  const combatBonuses = attacker.properties?.combat_bonuses || attacker.properties?.characterData?.combat_bonuses || {};
  const customToHitBonus = combatBonuses.to_hit || 0;
  const customDamageBonus = combatBonuses.damage || 0;
  
  // Calculate final attack bonus (ability modifier + proficiency + custom bonuses)
  const attackBonus = abilityMod + profBonus + customToHitBonus;
  
  // Roll for attack
  const attackRoll = Math.floor(Math.random() * 20) + 1;
  const attackTotal = attackRoll + attackBonus;
  
  // Check for hit
  const isCritical = attackRoll === 20;
  const hits = isCritical || attackTotal >= targetAC;
  
  // Calculate damage if hit
  let damage = 0;
  let damageResult = null;
  
  if (hits) {
    // Use our damage calculator with the custom damage bonus applied
    damageResult = calculateWeaponDamage(selectedWeapon, isCritical, abilityMod + customDamageBonus);
    damage = damageResult.total;
  }
  
  // Prepare result object
  return {
    attackerName,
    defenderName,
    weaponName,
    attackRoll,
    attackBonus,
    attackTotal,
    targetAC,
    hits,
    isCritical,
    damage,
    damageType: selectedWeapon.damageType || 'bludgeoning',
    damageDetails: damageResult,
    abilityModUsed: abilityMod, // Added for debugging
    abilityUsed: selectedWeapon.isRanged ? "DEX" : (selectedWeapon.isFinesse ? (dex > str ? "DEX" : "STR") : "STR"),
    customBonuses: {
      toHit: customToHitBonus,
      damage: customDamageBonus
    }
  };
};

/**
 * Get weapon damage based on weapon properties
 * @param {Object} weapon - The weapon object
 * @returns {string} Damage formula
 */
export const getWeaponDamage = (weapon) => {
  // Use weapon's damage property or default to 1d6
  return weapon.damage || '1d6';
};