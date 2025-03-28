// Debug utilities for testing the dungeon generation system
import DungeonGenerator from './DungeonGenerator';
import { 
  getAllDarklings, 
  getDarklingsForDungeon, 
  convertCreatureToDungeonEntity,
  getBossMonster
} from './bestiaryIntegration';
import { DUNGEON_TYPES, THEME_SETTINGS } from './constants';

// Debug utilities for the dungeon generator module

/**
 * Generates a test dungeon with specified parameters
 * @param {Object} options - Generation options
 * @param {number} options.width - Width of the dungeon
 * @param {number} options.height - Height of the dungeon
 * @param {number} options.roomDensity - How densely to pack rooms (0-1)
 * @param {number} options.monsterDensity - How many monsters to include (0-1)
 * @param {Array} options.monsters - Optional array of monster objects to use 
 * @returns {Object} The generated dungeon object
 */
export const generateTestDungeon = (options = {}) => {
  // Default options
  const defaults = {
    width: 30,
    height: 30,
    roomDensity: 0.6,
    monsterDensity: 0.5,
    monsters: null
  };

  const config = { ...defaults, ...options };
  
  try {
    // Check if we have access to the generator
    if (!window.dungeonGenerator) {
      console.error('Dungeon generator not found on window object');
      return null;
    }

    // If monsters not provided, try to use bestiary data
    if (!config.monsters && window.bestiary && window.bestiary.creatures) {
      config.monsters = window.bestiary.creatures;
      console.log(`Using ${config.monsters.length} monsters from bestiary`);
    }

    // Generate the dungeon
    const dungeon = window.dungeonGenerator.generate({
      width: config.width,
      height: config.height,
      roomDensity: config.roomDensity,
      monsterDensity: config.monsterDensity,
      monsters: config.monsters
    });

    console.log('Dungeon generated successfully:', dungeon);
    return dungeon;
  } catch (error) {
    console.error('Error generating test dungeon:', error);
    return null;
  }
};

/**
 * Prints a simple ASCII representation of a dungeon to the console
 * @param {Object} dungeon - The dungeon object to visualize
 */
export const printDungeonASCII = (dungeon) => {
  if (!dungeon || !dungeon.grid) {
    console.error('Invalid dungeon object provided to printDungeonASCII');
    return;
  }

  const { width, height, grid } = dungeon;
  let output = '';

  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < width; x++) {
      const cell = grid[y * width + x];
      
      if (!cell) {
        row += ' '; // Empty space
      } else if (cell.type === 'wall') {
        row += '#'; // Wall
      } else if (cell.type === 'floor') {
        if (cell.door) {
          row += '+'; // Door
        } else if (cell.monster) {
          row += 'M'; // Monster
        } else {
          row += '.'; // Floor
        }
      } else if (cell.type === 'corridor') {
        row += ','; // Corridor
      } else {
        row += '?'; // Unknown
      }
    }
    output += row + '\n';
  }

  console.log('Dungeon ASCII visualization:');
  console.log(output);
};

/**
 * Helper function to check the structure of a dungeon object
 * @param {Object} dungeon - The dungeon object to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const validateDungeonStructure = (dungeon) => {
  if (!dungeon) {
    console.error('Dungeon object is null or undefined');
    return false;
  }

  // Check basic properties
  const requiredProps = ['width', 'height', 'grid', 'rooms'];
  const missingProps = requiredProps.filter(prop => !(prop in dungeon));
  
  if (missingProps.length > 0) {
    console.error(`Dungeon is missing required properties: ${missingProps.join(', ')}`);
    return false;
  }

  // Check grid dimensions
  if (!Array.isArray(dungeon.grid) && !dungeon.grid.length) {
    console.error('Dungeon grid is not an array or is empty');
    return false;
  }

  if (dungeon.grid.length !== dungeon.width * dungeon.height) {
    console.error(`Grid size mismatch. Expected ${dungeon.width * dungeon.height} cells, found ${dungeon.grid.length}`);
    return false;
  }

  // Check for null cells
  const nullCells = dungeon.grid.filter(cell => cell === null || cell === undefined).length;
  if (nullCells > 0) {
    console.warn(`Dungeon has ${nullCells} null or undefined cells`);
  }

  // Check rooms
  if (!Array.isArray(dungeon.rooms)) {
    console.error('Dungeon rooms is not an array');
    return false;
  }

  console.log(`Dungeon validation passed: ${dungeon.width}x${dungeon.height}, ${dungeon.rooms.length} rooms`);
  return true;
};

/**
 * Runs a comprehensive test of the dungeon generator
 * Helps diagnose issues with generation, rendering and bestiary integration
 */
export const runDungeonGeneratorTest = () => {
  console.group('Dungeon Generator Diagnostic Test');
  
  // Check for generator
  console.log('Checking for dungeon generator...');
  if (!window.dungeonGenerator) {
    console.error('Dungeon generator not found on window object');
    console.groupEnd();
    return;
  }
  console.log('✓ Generator found');

  // Check for bestiary
  console.log('Checking for bestiary data...');
  if (!window.bestiary) {
    console.warn('Bestiary data not found on window object');
  } else {
    console.log(`✓ Bestiary found with ${window.bestiary.creatures?.length || 0} creatures`);
  }

  // Generate a simple dungeon
  console.log('Attempting to generate a simple dungeon...');
  try {
    const testDungeon = generateTestDungeon({
      width: 20,
      height: 20,
      roomDensity: 0.5,
      monsterDensity: 0.3
    });

    if (!testDungeon) {
      console.error('Failed to generate test dungeon');
      console.groupEnd();
      return;
    }

    console.log('✓ Basic dungeon generation successful');
    
    // Validate the dungeon structure
    console.log('Validating dungeon structure...');
    const isValid = validateDungeonStructure(testDungeon);
    if (isValid) {
      console.log('✓ Dungeon structure is valid');
    } else {
      console.error('Dungeon structure is invalid');
      console.groupEnd();
      return;
    }

    // Print ASCII representation
    printDungeonASCII(testDungeon);

    // Deep inspection of a few cells
    console.log('Inspecting random dungeon cells:');
    const { width, height, grid } = testDungeon;
    
    // Sample a few random cells
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      const index = y * width + x;
      
      if (index >= 0 && index < grid.length) {
        console.log(`Cell at (${x}, ${y}):`, grid[index]);
      }
    }

    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error during dungeon generation test:', error);
  }
  
  console.groupEnd();
};

/**
 * Debug function that logs detailed information about a dungeon object
 * @param {Object} dungeon - The dungeon to debug
 */
export const debugDungeon = (dungeon) => {
  if (!dungeon) {
    console.error('No dungeon provided to debugDungeon');
    return;
  }

  console.group('Dungeon Debug Information');
  
  // Basic info
  console.log('Dimensions:', `${dungeon.width}x${dungeon.height}`);
  console.log('Number of rooms:', dungeon.rooms?.length || 0);
  console.log('Grid size:', dungeon.grid?.length || 0);
  
  // Check for monsters
  let monsterCount = 0;
  let doorCount = 0;
  let wallCount = 0;
  let floorCount = 0;
  let corridorCount = 0;
  let unknownCount = 0;
  
  if (dungeon.grid && Array.isArray(dungeon.grid)) {
    dungeon.grid.forEach(cell => {
      if (!cell) {
        unknownCount++;
        return;
      }
      
      if (cell.type === 'wall') wallCount++;
      else if (cell.type === 'floor') floorCount++;
      else if (cell.type === 'corridor') corridorCount++;
      else unknownCount++;
      
      if (cell.monster) monsterCount++;
      if (cell.door) doorCount++;
    });
  }
  
  console.log('Cell statistics:');
  console.log('- Walls:', wallCount);
  console.log('- Floors:', floorCount);
  console.log('- Corridors:', corridorCount);
  console.log('- Unknown/null:', unknownCount);
  console.log('- Doors:', doorCount);
  console.log('- Monsters:', monsterCount);
  
  // Room information
  if (dungeon.rooms && Array.isArray(dungeon.rooms) && dungeon.rooms.length > 0) {
    console.group('Room details:');
    dungeon.rooms.forEach((room, index) => {
      console.log(`Room ${index+1}:`, `(${room.x},${room.y}) ${room.width}x${room.height}`);
    });
    console.groupEnd();
  }
  
  // Check if there are any monster references that don't exist
  if (monsterCount > 0) {
    console.group('Monster references:');
    const monsterMap = new Map();
    
    dungeon.grid.forEach(cell => {
      if (cell && cell.monster) {
        const monsterId = cell.monster.id || 'unknown';
        if (!monsterMap.has(monsterId)) {
          monsterMap.set(monsterId, 1);
        } else {
          monsterMap.set(monsterId, monsterMap.get(monsterId) + 1);
        }
      }
    });
    
    monsterMap.forEach((count, id) => {
      console.log(`Monster ID "${id}": ${count} instances`);
    });
    
    console.groupEnd();
  }
  
  console.groupEnd();
};