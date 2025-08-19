/**
 * Utility functions for dice rolling and damage calculations
 */

/**
 * Roll a single die
 * @param {number} sides - Number of sides on the die
 * @returns {number} Result of the roll (1 to sides)
 */
export const rollDie = (sides) => {
  return Math.floor(Math.random() * sides) + 1;
};

/**
 * Parse a dice notation string (e.g. "2d6+3")
 * @param {string} notation - The dice notation
 * @returns {Object} Parsed dice components
 */
export const parseDiceNotation = (notation) => {
  if (!notation || typeof notation !== 'string') {
    return { count: 1, sides: 6, modifier: 0 };
  }

  // Match common dice notation formats: XdY+Z, XdY-Z, XdY
  const regex = /^(\d+)d(\d+)(?:([+-])(\d+))?$/i;
  const match = notation.match(regex);
  
  if (!match) {
    console.warn(`Invalid dice notation: ${notation}, using 1d6`);
    return { count: 1, sides: 6, modifier: 0 };
  }
  
  const count = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  let modifier = 0;
  
  if (match[3] && match[4]) {
    const value = parseInt(match[4], 10);
    modifier = match[3] === '+' ? value : -value;
  }
  
  return { count, sides, modifier };
};

/**
 * Roll dice based on notation and calculate damage
 * @param {string} notation - Dice notation (e.g. "2d6+3")
 * @param {boolean} isCritical - Whether this is a critical hit
 * @param {number} additionalBonus - Any additional bonus to add
 * @returns {Object} Detailed damage result
 */
export const rollDamage = (notation, isCritical = false, additionalBonus = 0) => {
  // Parse the dice notation
  const { count, sides, modifier } = parseDiceNotation(notation);
  
  // Roll the appropriate number of dice (double on critical)
  const diceToRoll = isCritical ? count * 2 : count;
  const rolls = [];
  
  for (let i = 0; i < diceToRoll; i++) {
    rolls.push(rollDie(sides));
  }
  
  // Sum the dice rolls
  const diceTotal = rolls.reduce((sum, roll) => sum + roll, 0);
  
  // Handle bonuses carefully to avoid double-counting
  let totalBonus = 0;
  
  // First, check if the notation already includes a modifier
  if (modifier !== 0) {
    // If notation includes a modifier, use it and log for clarity
    totalBonus = modifier;
    console.log(`Using modifier from notation: ${modifier}`);
  } else if (additionalBonus !== 0) {
    // If no modifier in notation but we have an additional bonus, use that
    totalBonus = additionalBonus;
    console.log(`Using additional bonus: ${additionalBonus}`);
  }
  
  // Calculate total damage (dice + bonus)
  const totalDamage = diceTotal + totalBonus;
  
  return {
    notation,
    rolls,
    diceTotal,
    modifier,
    additionalBonus: modifier === 0 ? additionalBonus : 0, // Only track this for reference
    totalBonus,
    total: totalDamage,
    isCritical
  };
};

/**
 * Format damage result as a readable string
 * @param {Object} damageResult - The damage calculation result
 * @param {string} damageType - Optional damage type (e.g. "fire")
 * @returns {string} Formatted damage string
 */
export const formatDamage = (damageResult, damageType = '') => {
  if (!damageResult) return "0 damage";
  
  let result = '';
  
  // Show individual dice rolls in a more readable way
  if (damageResult.rolls && damageResult.rolls.length > 0) {
    // Show the actual roll results in a clear format
    result += `Rolls [${damageResult.rolls.join(', ')}]`;
  }
  
  // Add bonus if any
  if (damageResult.totalBonus !== 0) {
    result += ` + ${damageResult.totalBonus}`;
  }
  
  // Add total
  result += ` = ${damageResult.total}`;
  
  // Add damage type if provided
  if (damageType) {
    result += ` ${damageType}`;
  }
  
  // Add critical note
  if (damageResult.isCritical) {
    result += ' (critical hit)';
  }
  
  return result;
};

/**
 * Roll multiple dice and return results
 * @param {number} count - Number of dice to roll
 * @param {number} sides - Number of sides per die
 * @returns {Array} Array of roll results
 */
export const rollDice = (count, sides) => {
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(rollDie(sides));
  }
  return results;
};

/**
 * Calculate average expected damage for a dice formula
 * @param {string} notation - Dice notation (e.g. "2d6+3")
 * @returns {number} Average expected damage
 */
export const calculateAverageDamage = (notation) => {
  const { count, sides, modifier } = parseDiceNotation(notation);
  
  // Average value of a die is (sides + 1) / 2
  const averageDieValue = (sides + 1) / 2;
  
  // Calculate average total: dice average × count + modifier
  return (averageDieValue * count) + modifier;
};

/**
 * Create a new set of utility functions for consistently calculating damage
 * across all spells, weapons, and abilities
 */
export const DamageCalculator = {
  /**
   * Calculate damage from a single attack
   * @param {string} diceFormula - The dice formula (e.g. "2d6+3")
   * @param {Object} options - Options for damage calculation
   * @param {boolean} options.isCritical - Whether this is a critical hit
   * @param {boolean} options.characterBonus - Character-specific bonus to add
   * @param {string} options.damageType - Type of damage being dealt
   * @returns {Object} Complete damage result
   */
  calculateDamage: (diceFormula, options = {}) => {
    const { isCritical = false, characterBonus = 0, damageType = 'physical' } = options;
    
    // Parse the dice formula
    const { count, sides, modifier } = parseDiceNotation(diceFormula);
    
    // Only add character bonus if the formula doesn't already have a modifier
    const effectiveBonus = modifier !== 0 ? modifier : characterBonus;
    
    // Roll all dice (double on critical)
    const diceToRoll = isCritical ? count * 2 : count;
    const rolls = rollDice(diceToRoll, sides);
    
    // Sum the dice rolls
    const diceTotal = rolls.reduce((sum, roll) => sum + roll, 0);
    
    // Calculate total damage
    const totalDamage = diceTotal + effectiveBonus;
    
    return {
      formula: diceFormula,
      rolls,
      diceTotal,
      bonus: effectiveBonus,
      total: totalDamage,
      isCritical,
      damageType
    };
  },
  
  /**
   * Format the damage calculation as a readable string
   * @param {Object} result - The damage calculation result
   * @returns {string} Formatted damage string
   */
  formatDamage: (result) => {
    if (!result) return "0 damage";
    
    let formattedString = '';
    
    // Format dice rolls in an easy-to-read way
    if (result.rolls && result.rolls.length > 0) {
      // First show the total of the dice rolls, not each individual die
      formattedString += `${result.diceTotal}`;
    }
    
    // Add bonus if any
    if (result.bonus !== 0) {
      formattedString += ` + ${result.bonus}`;
    }
    
    // Add total with clear equals sign
    formattedString += ` = ${result.total}`;
    
    // Add damage type
    if (result.damageType) {
      formattedString += ` ${result.damageType}`;
    }
    
    // Add critical note
    if (result.isCritical) {
      formattedString += ' (critical hit)';
    }
    
    return formattedString;
  }
};