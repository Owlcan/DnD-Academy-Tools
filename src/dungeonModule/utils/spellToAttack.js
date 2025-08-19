// Utility function to convert character spells to attacks
export const convertSpellsToAttacks = (character) => {
  // Check if character has known spells
  if (!character.knownSpells || character.knownSpells.length === 0) {
    return { hasSpells: false, attacks: [] };
  }

  // Convert each spell to an attack format
  const spellAttacks = character.knownSpells.map((spell, index) => {
    // Default values if spell details aren't provided
    const spellName = typeof spell === 'string' ? spell : spell.name;
    const damageType = spell.damageType || 'magical';
    const damage = spell.damage || '1d8';
    const isHealing = spell.isHealing || false;
    
    return {
      id: `spell-${index}`,
      name: spellName,
      type: "Spell Attack",
      toHit: character.spellAttackBonus || 0,
      reach: spell.range || 60,
      damage: damage,
      damageType: damageType,
      description: spell.description || `${spellName} spell attack`,
      isHealing: isHealing
    };
  });

  return { hasSpells: true, attacks: spellAttacks };
};

// Function to display spell attacks options in text window
export const displaySpellAttackOptions = (character, textDisplayFunction) => {
  const { hasSpells, attacks } = convertSpellsToAttacks(character);
  
  if (!hasSpells) {
    textDisplayFunction("You have no spells available.");
    return;
  }
  
  let optionsText = "Available Spell Attacks:\n";
  attacks.forEach((attack, index) => {
    const healingText = attack.isHealing ? " (Healing)" : "";
    optionsText += `${index}: ${attack.name}${healingText} - ${attack.damage} ${attack.damageType} damage\n`;
  });
  
  textDisplayFunction(optionsText);
  
  return attacks; // Return attacks for selection handling
};