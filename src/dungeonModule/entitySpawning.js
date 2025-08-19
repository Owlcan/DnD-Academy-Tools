/**
 * Entity spawning system for the dungeon generator
 * This handles spawning monsters, loot, traps, and other interactive elements
 */
import { getDarklingsForDungeon, getRandomDarklingByCR, convertCreatureToDungeonEntity } from './bestiaryIntegration';

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

// Get a Darkling monster by challenge rating
const getDarklingByCR = (bestiaryData, minCR, maxCR) => {
  // Filter for Darkling creatures in the CR range
  const darklings = bestiaryData.filter(monster => {
    const cr = monster.stats?.challengeRating || 0;
    const name = monster.name?.toLowerCase() || '';
    const isDarkling = name.includes('darkling') || 
                      name.includes('darkforme') || 
                      name.includes('dark');
    
    return isDarkling && cr >= minCR && cr <= maxCR;
  });
  
  if (darklings.length === 0) {
    console.warn(`No Darkling creatures found in CR range ${minCR}-${maxCR}. Using any available Darkling.`);
    
    // Fallback to any Darkling creature
    const anyDarklings = bestiaryData.filter(monster => {
      const name = monster.name?.toLowerCase() || '';
      return name.includes('darkling') || name.includes('darkforme') || name.includes('dark');
    });
    
    if (anyDarklings.length === 0) {
      console.warn('No Darkling creatures found at all. Using any available monster.');
      return getRandomItem(bestiaryData);
    }
    
    return getRandomItem(anyDarklings);
  }
  
  return getRandomItem(darklings);
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

// Get the actual size category and token size for a monster
const getSizeForMonster = (monster) => {
  // Default is medium (1x1)
  let size = 'medium';
  let tokenSize = 1;
  
  // If monster has specified size use that
  if (monster.stats && monster.stats.size) {
    size = monster.stats.size.toLowerCase();
    
    // Map size to token size
    switch (size) {
      case 'tiny': tokenSize = 1; break; // Keep tiny as 1x1 for visibility
      case 'small': tokenSize = 1; break;
      case 'medium': tokenSize = 1; break;
      case 'large': tokenSize = 2; break;
      case 'huge': tokenSize = 3; break;
      case 'gargantuan': tokenSize = 4; break;
      default: tokenSize = 1;
    }
  } else {
    // Base size on CR for monsters without explicit size
    const cr = monster.stats?.challengeRating || 0;
    if (cr >= 7) {
      size = 'huge';
      tokenSize = 3;
    } else if (cr >= 3) {
      size = 'large';
      tokenSize = 2;
    }
  }

  // Check if this is one of the special Darkling creatures that should be larger
  const name = monster.name?.toLowerCase() || '';
  
  // Override size based on name if it indicates a different size
  if (name.includes('darkforme overwatch') || 
      name.includes('darkforme-sleek-lurker pack alpha') || 
      name.includes('darkling-bellowbelly') ||
      name.includes('darkforme-hungore') ||
      name.includes('darkforme-shark') ||
      name.includes('darkling-ossuite charger')) {
    size = 'large';
    tokenSize = 2;
  } else if (name.includes('darkaconda') || 
             name.includes('dark commander') || 
             name.includes('darkling general') || 
             name.includes('darkforme-ossuarian') ||
             name.includes('darkforme-cavesweller')) {
    size = 'huge';
    tokenSize = 3;
  } else if (name.includes('dark titan') || 
             name.includes('dark harbinger') ||
             name.includes('darkling overlord')) {
    size = 'gargantuan';
    tokenSize = 4;
  }

  // Make boss monsters larger if they're not already
  if ((monster.stats?.isBoss || monster.isBoss) && tokenSize < 2) {
    size = 'large';
    tokenSize = 2;
  }

  return { size, tokenSize };
};

// Check if an area can fit a monster of a given size
const canFitMonster = (tiles, x, y, tokenSize, dungeon) => {
  // For larger monsters, check if all required cells are available
  for (let dy = 0; dy < tokenSize; dy++) {
    for (let dx = 0; dx < tokenSize; dx++) {
      const checkX = x + dx;
      const checkY = y + dy;
      
      // Check if out of dungeon bounds
      if (checkX >= dungeon.width || checkY >= dungeon.height) {
        return false;
      }
      
      // Check if this is a floor tile (1 or 2)
      if (dungeon.grid[checkY][checkX] !== 1 && dungeon.grid[checkY][checkX] !== 2) {
        return false;
      }
      
      // Check if already taken by another entity
      const isTileTaken = dungeon.entities.some(entity => 
        entity.x === checkX && entity.y === checkY
      );
      
      if (isTileTaken) {
        return false;
      }
    }
  }
  
  return true;
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
      
      // Get a random Darkling monster appropriate to the difficulty
      const monster = getDarklingByCR(bestiaryData, crRange.min, crRange.max);
      
      // Determine token size based on monster size
      const { size, tokenSize } = getSizeForMonster(monster);
      
      // For large+ monsters, we need to find a tile where they fit
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < 50 && shuffledTiles.length > 0) {
        const tileIndex = Math.floor(Math.random() * shuffledTiles.length);
        const tile = shuffledTiles[tileIndex];
        
        if (canFitMonster(shuffledTiles, tile.x, tile.y, tokenSize, dungeon)) {
          // The monster fits here, so place it
          console.log(`Spawning Darkling: ${monster.name} (${size}, ${tokenSize}x${tokenSize}) at ${tile.x},${tile.y}`);
          
          // Use the convertCreatureToDungeonEntity function to create a proper entity
          const monsterEntity = convertCreatureToDungeonEntity(
            monster, 
            tile.x, 
            tile.y, 
            monster.stats?.challengeRating >= crRange.max * 0.8 // Make high-CR monsters bosses
          );
          
          entities.push(monsterEntity);
          
          // Remove the taken tiles from available tiles
          for (let dy = 0; dy < tokenSize; dy++) {
            for (let dx = 0; dx < tokenSize; dx++) {
              const usedX = tile.x + dx;
              const usedY = tile.y + dy;
              
              // Remove all tiles that are now occupied
              const tileToRemoveIndex = shuffledTiles.findIndex(t => 
                t.x === usedX && t.y === usedY
              );
              
              if (tileToRemoveIndex !== -1) {
                shuffledTiles.splice(tileToRemoveIndex, 1);
              }
            }
          }
          
          placed = true;
        } else {
          // This tile doesn't work, remove it and try another
          shuffledTiles.splice(tileIndex, 1);
          attempts++;
        }
      }
      
      if (!placed) {
        console.warn(`Failed to place ${monster.name} after 50 attempts`);
      }
    }
  }
  
  // Spawn loot and traps as before
  if (loot) {
    for (let i = 0; i < maxLoot && shuffledTiles.length > 0; i++) {
      const tileIndex = Math.floor(Math.random() * shuffledTiles.length);
      const tile = shuffledTiles[tileIndex];
      
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
      
      // Remove the used tile
      shuffledTiles.splice(tileIndex, 1);
    }
  }
  
  if (traps) {
    for (let i = 0; i < maxTraps && shuffledTiles.length > 0; i++) {
      const tileIndex = Math.floor(Math.random() * shuffledTiles.length);
      const tile = shuffledTiles[tileIndex];
      
      // Generate a trap with random type
      const trapTypes = ['pit', 'dart', 'poison', 'fire', 'magical'];
      const trapType = trapTypes[Math.floor(Math.random() * trapTypes.length)];
      
      // Calculate trap difficulty based on dungeon difficulty
      let trapLevel = 1;
      if (difficulty === 'hard') trapLevel = 2;
      if (difficulty === 'deadly') trapLevel = 3;
      
      entities.push({
        type: 'trap',
        x: tile.x,
        y: tile.y,
        properties: {
          type: trapType,
          level: trapLevel,
          detected: false,
          triggered: false,
          damage: trapLevel * 2 + Math.floor(Math.random() * 4) + 1, // 1d4 + level * 2
          dcToSpot: 10 + trapLevel * 2,
          dcToDisarm: 12 + trapLevel * 2
        }
      });
      
      // Remove the used tile
      shuffledTiles.splice(tileIndex, 1);
    }
  }
  
  return entities;
};

// Export additional utility functions for testing
export const _testExports = {
  getSpawnableTiles,
  getDarklingByCR,
  getCRRangeForDifficulty,
  getSizeForMonster,
  canFitMonster
};