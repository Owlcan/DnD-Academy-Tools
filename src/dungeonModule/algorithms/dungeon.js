import { generateRooms } from './roomGeneration';
import { connectRooms } from './pathGeneration';
import { CELL_TYPES } from '../constants';

// Main dungeon generation function
export const generateDungeon = (config) => {
  // Generate rooms
  const rooms = generateRooms(config);
  
  // Initialize grid with walls
  const grid = Array(config.height).fill().map(() => 
    Array(config.width).fill(CELL_TYPES.WALL)
  );
  
  // Place rooms on the grid
  for (const room of rooms) {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (y >= 0 && y < config.height && x >= 0 && x < config.width) {
          grid[y][x] = CELL_TYPES.FLOOR;
        }
      }
    }
  }
  
  // Connect rooms with corridors
  const corridors = connectRooms(rooms, config);
  
  // Place corridors on the grid
  for (const corridor of corridors) {
    for (const point of corridor) {
      if (point.y >= 0 && point.y < config.height && 
          point.x >= 0 && point.x < config.width &&
          grid[point.y][point.x] === CELL_TYPES.WALL) { // Only change walls to corridors
        grid[point.y][point.x] = CELL_TYPES.CORRIDOR;
      }
    }
  }
  
  // Designate special rooms if needed
  let specialRooms = {};
  if (config.includeMandatoryRooms && rooms.length >= 4) {
    specialRooms = designateSpecialRooms(rooms);
  }
  
  // Add doors between rooms and corridors
  addDoors(grid, config);
  
  return {
    grid,
    rooms,
    corridors,
    specialRooms,
    config
  };
};

// Add doors where corridors meet rooms
const addDoors = (grid, config) => {
  const { width, height } = config;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (grid[y][x] === CELL_TYPES.CORRIDOR) {
        // Check if this corridor cell is adjacent to a room
        const adjacent = [
          { x: x, y: y - 1 }, // North
          { x: x + 1, y: y }, // East
          { x: x, y: y + 1 }, // South
          { x: x - 1, y: y }  // West
        ];
        
        for (const pos of adjacent) {
          if (grid[pos.y][pos.x] === CELL_TYPES.FLOOR) {
            // Found corridor-room connection, add a door
            grid[y][x] = CELL_TYPES.DOOR;
            break;
          }
        }
      }
    }
  }
};

// Select rooms for special purposes (entry, exit, boss)
const designateSpecialRooms = (rooms) => {
  // Sort rooms by size (largest to smallest)
  const sortedRooms = [...rooms].sort((a, b) => 
    (b.width * b.height) - (a.width * a.height)
  );
  
  // Assign special purposes
  const specialRooms = {
    boss: sortedRooms[0], // Largest room is boss room
    treasure: sortedRooms[1], // Second largest is treasure room
    entry: null,
    exit: null
  };
  
  // Find rooms for entry and exit (preferably far apart)
  const remainingRooms = sortedRooms.slice(2);
  
  if (remainingRooms.length >= 2) {
    // Use first room as entry
    specialRooms.entry = remainingRooms[0];
    
    // Find room farthest from entry for exit
    let maxDistance = 0;
    let farthestRoom = null;
    
    for (let i = 1; i < remainingRooms.length; i++) {
      const distance = Math.sqrt(
        Math.pow(remainingRooms[i].center.x - specialRooms.entry.center.x, 2) +
        Math.pow(remainingRooms[i].center.y - specialRooms.entry.center.y, 2)
      );
      
      if (distance > maxDistance) {
        maxDistance = distance;
        farthestRoom = remainingRooms[i];
      }
    }
    
    specialRooms.exit = farthestRoom || remainingRooms[1];
  }
  
  // Update room types
  if (specialRooms.boss) specialRooms.boss.type = 'boss';
  if (specialRooms.treasure) specialRooms.treasure.type = 'treasure';
  if (specialRooms.entry) specialRooms.entry.type = 'entry';
  if (specialRooms.exit) specialRooms.exit.type = 'exit';
  
  return specialRooms;
};