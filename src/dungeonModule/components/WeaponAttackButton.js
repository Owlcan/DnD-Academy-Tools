import React from 'react';

// Helper function to determine if a weapon is ranged
const isRangedWeapon = (weaponName) => {
  if (!weaponName) return false;
  
  const name = weaponName.toLowerCase();
  const rangedWeaponKeywords = [
    'longbow', 'shortbow', 'crossbow', 'gun', 'rifle', 'pistol', 'magnum', 
    'blaster', 'hunting rifle', 'dart', 'javelin', 'sling'
  ];
  
  return rangedWeaponKeywords.some(keyword => name.includes(keyword));
};

// Helper function to determine damage type based on weapon name
const determineDamageType = (weaponName) => {
  if (!weaponName) return 'piercing';
  
  const name = weaponName.toLowerCase();
  
  if (name.includes('sword') || name.includes('scimitar') || name.includes('axe')) {
    return 'slashing';
  } else if (name.includes('mace') || name.includes('hammer') || name.includes('club') || name.includes('flail')) {
    return 'bludgeoning';
  } else if (name.includes('spear') || name.includes('dagger') || name.includes('rapier') || 
             name.includes('pike') || name.includes('arrow')) {
    return 'piercing';
  }
  
  return 'slashing'; // Default fallback
};

// Helper function to get available weapons for the player
const getPlayerWeapons = (player) => {
  if (!player || !player.properties || !player.properties.characterData) {
    return [];
  }

  const weapons = player.properties.characterData.equipment?.weapons || [];
  return weapons.map(weapon => {
    // Determine if it's a ranged weapon
    const isRanged = isRangedWeapon(weapon.name);
    
    return {
      name: weapon.name,
      damage: weapon.damage || '1d6',
      attackType: isRanged ? 'ranged' : 'melee',
      damageType: determineDamageType(weapon.name),
      range: isRanged ? 20 : 1,
      description: weapon.description || `A ${weapon.name}`
    };
  });
};

const WeaponAttackButton = ({ player, onAttack }) => {
  const playerWeapons = getPlayerWeapons(player);
  
  if (!playerWeapons || playerWeapons.length === 0) {
    return null;
  }
  
  return (
    <div className="weapon-attack-buttons">
      <h3>Weapon Attacks</h3>
      {playerWeapons.map((weapon, index) => (
        <button 
          key={index} 
          className="weapon-attack-button"
          onClick={() => onAttack(player, weapon)}
        >
          Attack with {weapon.name} {weapon.attackType === 'ranged' ? '(Ranged)' : '(Melee)'}
        </button>
      ))}
    </div>
  );
};

export default WeaponAttackButton;