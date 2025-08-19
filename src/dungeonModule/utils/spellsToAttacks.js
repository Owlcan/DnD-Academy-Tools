/**
 * Utility function to convert character's known spells to attack format
 */

/**
 * Converts a spell to an attack object format
 * @param {string} spellName - The name of the spell
 * @param {number} index - The index of the spell in the list (for UI reference)
 * @returns {Object} An attack object
 */
export const convertSpellToAttack = (spellName, index) => {
  // Simple conversion - in a real implementation, you might lookup spell details from a database
  return {
    name: spellName,
    type: "Spell Attack",
    toHit: "+?", // This would ideally come from character's spellcasting ability
    reach: "Varies",
    damage: "1d8", // Default damage, ideally this would be looked up
    damageType: "magical",
    description: `Spell: ${spellName}`,
    isSpell: true,
    spellIndex: index
  };
};

/**
 * Gets all spells from a character and converts them to attack format
 * @param {Object} character - The character object
 * @returns {Array} Array of attack objects
 */
export const getSpellsAsAttacks = (character) => {
  if (!character || !character.knownSpells || character.knownSpells.length === 0) {
    return [];
  }

  return character.knownSpells.map((spell, index) => 
    convertSpellToAttack(spell, index)
  );
};

/**
 * Displays spell attacks in the text window
 * @param {Array} spellAttacks - Array of spell attacks
 * @param {Function} printToTextWindow - Function to print to the text window
 */
export const displaySpellOptions = (spellAttacks, printToTextWindow) => {
  if (!spellAttacks || spellAttacks.length === 0) {
    printToTextWindow("You have no spells available.");
    return;
  }

  printToTextWindow("Available Spells:");
  spellAttacks.forEach((spell, index) => {
    printToTextWindow(`${index}: ${spell.name} - ${spell.damage} ${spell.damageType} damage`);
  });
  printToTextWindow("Enter the spell number to cast, or any other key to cancel.");
};