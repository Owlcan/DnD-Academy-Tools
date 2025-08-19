/**
 * Equipment options for character equipment selection dropdowns
 */

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
 * Calculates attack bonus based on character attributes and weapon properties
 * @param {Object} character - Character data
 * @param {Object} weapon - Weapon data
 * @returns {Number} - Calculated attack bonus
 */
export const calculateAttackBonus = (character, weapon) => {
  if (!character || !weapon) return 0;
  
  const attributes = character.attributes || {};
  const strMod = Math.floor((attributes.strength || 10) / 2) - 5;
  const dexMod = Math.floor((attributes.dexterity || 10) / 2) - 5;
  
  // Calculate proficiency bonus based on level
  const level = character.level || 1;
  const profBonus = Math.ceil(1 + (level / 4));
  
  // Determine if weapon uses Dexterity (finesse property) or Strength
  const usesDex = weapon.properties?.includes('finesse');
  
  // Return the attack bonus: ability modifier + proficiency bonus
  return (usesDex ? dexMod : strMod) + profBonus;
};

/**
 * Calculates damage bonus based on character attributes and weapon properties
 * @param {Object} character - Character data
 * @param {Object} weapon - Weapon data
 * @returns {Number} - Calculated damage bonus
 */
export const calculateDamageBonus = (character, weapon) => {
  if (!character || !weapon) return 0;
  
  const attributes = character.attributes || {};
  const strMod = Math.floor((attributes.strength || 10) / 2) - 5;
  const dexMod = Math.floor((attributes.dexterity || 10) / 2) - 5;
  
  // Determine if weapon uses Dexterity (finesse property) or Strength for damage
  const usesDex = weapon.properties?.includes('finesse');
  
  // Return the ability modifier for damage
  return usesDex ? dexMod : strMod;
};

/**
 * Calculate AC based on armor type and character's Dexterity
 * @param {Object} character - Character data
 * @param {Object} armor - Armor data
 * @returns {Number} - Calculated armor class
 */
export const calculateArmorClass = (character, armor) => {
  if (!character || !armor) return 10; // Default AC is 10
  
  const attributes = character.attributes || {};
  const dexMod = Math.floor((attributes.dexterity || 10) / 2) - 5;
  
  let baseAC = armor.armor_class || 10;
  
  // Apply DEX bonus based on armor type rules
  if (armor.dex_bonus) {
    if (armor.max_dex !== undefined) {
      // Medium armor limits DEX bonus to the max_dex value (usually +2)
      baseAC += Math.min(dexMod, armor.max_dex);
    } else {
      // Light armor gets full DEX bonus
      baseAC += dexMod;
    }
  }
  
  return baseAC;
};
