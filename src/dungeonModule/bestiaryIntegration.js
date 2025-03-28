// Integration utilities for using bestiary data in dungeon generation
import { DUNGEON_TYPES } from './constants';

/**
 * Get all Darkling creatures from the bestiary
 */
export const getAllDarklings = () => {
  if (!window.bestiary || !window.bestiary.creatures) {
    console.warn('Bestiary data not available');
    return [];
  }
  
  // Filter for any creatures that have "Darkling" or "Darkforme" in the name
  return window.bestiary.creatures.filter(creature => 
    creature.name && (
      creature.name.toLowerCase().includes('darkling') ||
      creature.name.toLowerCase().includes('darkforme') ||
      creature.name.toLowerCase().includes('dark') ||
      creature.name.toLowerCase().includes('weirdling')
    )
  );
};

/**
 * Get appropriate creatures for a dungeon type - only returns Darkling creatures
 * regardless of dungeon type since those are the only enemies in this project
 * @param {string} dungeonType - The type of dungeon
 * @param {number} partyLevel - The level of the party (1-20)
 * @param {number} count - Number of monsters to return
 */
export const getDungeonsForType = (dungeonType, partyLevel = 3, count = 5) => {
  // We only use Darkling/Darkforme creatures regardless of dungeon type
  return getDarklingsForDungeon({ partyLevel, dungeonType }, count);
};

/**
 * Get appropriate Darkling creatures for a dungeon's difficulty
 * @param {object} dungeonConfig - The dungeon configuration
 * @param {number} count - Number of monsters to return
 */
export const getDarklingsForDungeon = (dungeonConfig, count = 5) => {
  const partyLevel = dungeonConfig.partyLevel || 3;
  
  // Get all Darklings
  const allDarklings = getAllDarklings();
  
  if (allDarklings.length === 0) {
    console.warn('No Darkling creatures found in bestiary');
    return [];
  }
  
  // Define CR ranges based on party level
  const minCR = Math.max(0, partyLevel - 3);
  const maxCR = partyLevel + 2;
  
  // Filter by CR
  const appropriateDarklings = allDarklings.filter(creature => {
    const cr = creature.stats?.challengeRating || 0;
    return cr >= minCR && cr <= maxCR;
  });
  
  // If there are no appropriate darklings, return any darklings
  if (appropriateDarklings.length === 0) {
    console.warn(`No appropriate Darkling creatures found for party level ${partyLevel}, using any available`);
    return allDarklings.slice(0, count);
  }
  
  // Randomly select 'count' darklings
  const selectedDarklings = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * appropriateDarklings.length);
    selectedDarklings.push(appropriateDarklings[randomIndex]);
  }
  
  return selectedDarklings;
};

/**
 * Get a Darkling creature by name
 * @param {string} name - The name of the creature
 * @returns {object|null} - The creature object or null if not found
 */
export const getDarklingByName = (name) => {
  if (!window.bestiary || !window.bestiary.creatures) {
    console.warn('Bestiary data not available');
    return null;
  }
  
  return window.bestiary.creatures.find(creature => 
    creature.name && creature.name === name
  ) || null;
};

/**
 * Get a random Darkling creature of a specific CR range
 * @param {number} minCR - Minimum challenge rating
 * @param {number} maxCR - Maximum challenge rating
 * @returns {object|null} - A random Darkling creature that matches the CR range
 */
export const getRandomDarklingByCR = (minCR = 0, maxCR = 5) => {
  const allDarklings = getAllDarklings();
  
  if (allDarklings.length === 0) {
    console.warn('No Darkling creatures found in bestiary');
    return null;
  }
  
  const appropriateDarklings = allDarklings.filter(creature => {
    const cr = creature.stats?.challengeRating || 0;
    return cr >= minCR && cr <= maxCR;
  });
  
  if (appropriateDarklings.length === 0) {
    console.warn(`No Darkling creatures found in CR range ${minCR}-${maxCR}`);
    return allDarklings[0]; // Return any darkling if none match the CR range
  }
  
  const randomIndex = Math.floor(Math.random() * appropriateDarklings.length);
  return appropriateDarklings[randomIndex];
};

/**
 * Get an appropriate boss monster for the dungeon - always a powerful Darkling
 * @param {object} dungeonConfig - The dungeon configuration
 */
export const getBossMonster = (dungeonConfig) => {
  const partyLevel = dungeonConfig.partyLevel || 3;
  
  if (!window.bestiary || !window.bestiary.creatures) {
    console.warn('Bestiary data not available');
    return null;
  }
  
  // Get all Darklings
  const allDarklings = getAllDarklings();
  
  if (allDarklings.length === 0) {
    console.warn('No Darkling creatures found in bestiary');
    return null;
  }
  
  // For boss monsters, we target CR at party level + 2 or +3
  const targetCR = partyLevel + 2;
  const minCR = targetCR - 1;
  const maxCR = targetCR + 2;
  
  // Find Darklings that could serve as a boss
  let possibleBosses = allDarklings.filter(creature => {
    const cr = creature.stats?.challengeRating || 0;
    return cr >= minCR && cr <= maxCR;
  });
  
  // If we don't have any options in the ideal range, broaden the search
  if (possibleBosses.length === 0) {
    possibleBosses = allDarklings.filter(creature => {
      const cr = creature.stats?.challengeRating || 0;
      return cr >= minCR - 1 && cr <= maxCR + 1;
    });
  }
  
  // If still no options, just pick the strongest Darkling
  if (possibleBosses.length === 0) {
    possibleBosses = allDarklings.sort((a, b) => {
      const crA = a.stats?.challengeRating || 0;
      const crB = b.stats?.challengeRating || 0;
      return crB - crA; // Sort in descending order
    }).slice(0, 3);
  }
  
  // If absolutely nothing works, just grab any creature
  if (possibleBosses.length === 0) {
    return allDarklings[Math.floor(Math.random() * allDarklings.length)];
  }
  
  // Pick a random boss from the candidates
  return possibleBosses[Math.floor(Math.random() * possibleBosses.length)];
};

/**
 * Convert a bestiary creature to a dungeon entity
 * @param {object} creature - The creature from the bestiary
 * @param {number} x - The x position in the dungeon
 * @param {number} y - The y position in the dungeon
 * @param {boolean} isBoss - Whether this creature is a boss
 */
export const convertCreatureToDungeonEntity = (creature, x, y, isBoss = false) => {
  if (!creature) return null;
  
  // Calculate HP based on the creature's hit dice
  let hp = 0;
  let maxHP = 0;
  
  if (creature.stats?.hp) {
    // If hp is provided directly, use that
    maxHP = typeof creature.stats.hp === 'string' 
      ? parseInt(creature.stats.hp) 
      : creature.stats.hp;
    
    // If parsing failed, use a default based on CR
    if (isNaN(maxHP)) {
      const cr = creature.stats?.challengeRating || 0;
      maxHP = Math.max(10, cr * 15);
    }
    
    hp = maxHP;
  } else if (creature.stats?.hitDice) {
    // Parse hit dice string (e.g., "3d8+6")
    const hdRegex = /(\d+)d(\d+)(?:\+(\d+))?/;
    const match = creature.stats.hitDice.match(hdRegex);
    
    if (match) {
      const numDice = parseInt(match[1]);
      const diceSize = parseInt(match[2]);
      const modifier = match[3] ? parseInt(match[3]) : 0;
      
      // Calculate average for the dice formula
      maxHP = Math.floor(numDice * ((diceSize + 1) / 2)) + modifier;
      hp = maxHP;
    } else {
      // Fallback to CR-based HP
      const cr = creature.stats?.challengeRating || 0;
      maxHP = Math.max(10, cr * 15);
      hp = maxHP;
    }
  } else {
    // Default: use CR to estimate HP
    const cr = creature.stats?.challengeRating || 0;
    maxHP = Math.max(10, cr * 15);
    hp = maxHP;
  }
  
  // Difficulty based on CR
  let difficulty = 'medium';
  const cr = creature.stats?.challengeRating || 0;
  
  if (isBoss) {
    difficulty = 'boss';
  } else if (cr <= 0.25) {
    difficulty = 'easy';
  } else if (cr <= 2) {
    difficulty = 'medium';
  } else if (cr <= 5) {
    difficulty = 'hard';
  } else {
    difficulty = 'deadly';
  }
  
  // Map creature size to token size
  let size = 1;
  switch (creature.stats?.size?.toLowerCase()) {
    case 'tiny': size = 0.5; break;
    case 'small': size = 0.8; break;
    case 'medium': size = 1; break;
    case 'large': size = 2; break;
    case 'huge': size = 3; break;
    case 'gargantuan': size = 4; break;
    default: size = 1;
  }
  
  return {
    type: 'monster',
    x, y,
    properties: {
      name: creature.name,
      hp,
      maxHP,
      cr: creature.stats?.challengeRating || 0,
      challengeRating: creature.stats?.challengeRating || 0,
      challengeRatingStr: creature.stats?.challengeRatingStr || '0',
      type: creature.type || 'abomination',
      size: creature.stats?.size || 'medium',
      difficulty,
      isBoss,
      imageUrl: creature.flavor?.imageUrl || '',
      tokenSize: size,
      // Include other useful creature stats
      ac: creature.stats?.ac || 10,
      speed: creature.stats?.speed || '30 ft.',
      // Add references to attributes and abilities for encounter calculations
      str: creature.abilities?.str || 10,
      dex: creature.abilities?.dex || 10,
      con: creature.abilities?.con || 10,
      int: creature.abilities?.int || 10,
      wis: creature.abilities?.wis || 10,
      cha: creature.abilities?.cha || 10
    }
  };
};