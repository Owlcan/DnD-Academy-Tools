/**
 * Entity spawning system for the dungeon generator
 * This handles spawning monsters, loot, traps, and other interactive elements
 */

// Helper to get a random item from an array
const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// Find available floor tiles for spawning entities
const getSpawnableTiles = (dungeon) => {
  const spawnableTiles = [];
  const grid = dungeon.grid;
  
  for (let y = 0; y < dungeon.height; y++) {
    for (let x = 0; x < dungeon.width; x++) {
      // Check if this is a floor or corridor (1 or 2)
      if (grid[y][x] === 1 || grid[y][x] === 2) {
        spawnableTiles.push({ x, y });
      }
    }
  }
  
  return spawnableTiles;
};

// Get monster by challenge rating
const getMonsterByCR = (bestiaryData, minCR, maxCR) => {
  // Filter monsters by CR range
  const suitableMonsters = bestiaryData.filter(monster => {
    const cr = monster.stats?.challengeRating || 0;
    return cr >= minCR && cr <= maxCR;
  });
  
  if (suitableMonsters.length === 0) {
    console.warn(`No monsters found in CR range ${minCR}-${maxCR}. Using any available monster.`);
    return getRandomItem(bestiaryData);
  }
  
  return getRandomItem(suitableMonsters);
};

// Calculate appropriate CR range based on difficulty
const getCRRangeForDifficulty = (difficulty) => {
  switch (difficulty) {
    case 'easy':
      return { min: 0, max: 1 };
    case 'medium':
      return { min: 0.5, max: 3 };
    case 'hard':
      return { min: 1, max: 5 };
    case 'deadly':
      return { min: 3, max: 10 };
    default:
      return { min: 0, max: 3 };
  }
};

/**
 * Spawn entities in the dungeon
 * @param {Object} dungeon - The dungeon object
 * @param {Object} options - Options for entity spawning
 * @returns {Array} - Array of entities
 */
export const spawnEntities = (dungeon, options = {}) => {
  const {
    monsters = true,
    loot = true,
    traps = true,
    monsterDensity = 0.5,
    difficulty = 'medium',
    bestiaryData = []
  } = options;
  
  const entities = [];
  const spawnableTiles = getSpawnableTiles(dungeon);
  
  // Shuffle the tiles to avoid predictable patterns
  const shuffledTiles = [...spawnableTiles].sort(() => Math.random() - 0.5);
  
  // Calculate how many entities to spawn
  const totalFloorTiles = shuffledTiles.length;
  const maxMonsters = Math.floor(totalFloorTiles * monsterDensity * 0.1);
  const maxLoot = Math.floor(totalFloorTiles * 0.05);
  const maxTraps = Math.floor(totalFloorTiles * 0.03);
  
  console.log(`Spawning up to ${maxMonsters} monsters, ${maxLoot} loot, ${maxTraps} traps`);
  
  // Get CR range based on difficulty
  const crRange = getCRRangeForDifficulty(difficulty);
  
  // Spawn monsters
  if (monsters && bestiaryData.length > 0) {
    for (let i = 0; i < maxMonsters; i++) {
      if (shuffledTiles.length === 0) break;
      
      const tile = shuffledTiles.pop();
      const monster = getMonsterByCR(bestiaryData, crRange.min, crRange.max);
      
      entities.push({
        type: 'monster',
        x: tile.x,
        y: tile.y,
        properties: {
          id: monster._id,
          name: monster.name,
          cr: monster.stats.challengeRating,
          hp: monster.stats.hitPoints,
          ac: monster.stats.armorClass,
          size: monster.stats.size,
          abilities: monster.stats?.additionalAbilities || [],
          actions: monster.stats?.actions || []
        }
      });
    }
  }
  
  // Spawn loot
  if (loot) {
    for (let i = 0; i < maxLoot; i++) {
      if (shuffledTiles.length === 0) break;
      
      const tile = shuffledTiles.pop();
      entities.push({
        type: 'loot',
        x: tile.x,
        y: tile.y,
        properties: {
          name: 'Treasure',
          value: Math.floor(Math.random() * 50) + 10,
          isChest: Math.random() > 0.7
        }
      });
    }
  }
  
  // Spawn traps
  if (traps) {
    for (let i = 0; i < maxTraps; i++) {
      if (shuffledTiles.length === 0) break;
      
      const tile = shuffledTiles.pop();
      entities.push({
        type: 'trap',
        x: tile.x,
        y: tile.y,
        properties: {
          name: 'Trap',
          damage: Math.floor(Math.random() * 10) + 5,
          detected: false
        }
      });
    }
  }
  
  return entities;
};

// Export additional utility functions for testing
export const _testExports = {
  getSpawnableTiles,
  getMonsterByCR,
  getCRRangeForDifficulty
};