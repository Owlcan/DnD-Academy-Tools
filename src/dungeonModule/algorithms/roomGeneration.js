// Room generation algorithms for the dungeon module
import { DUNGEON_TYPES, THEME_SETTINGS } from '../constants';

// Room class to represent a single room in the dungeon
export class Room {
  constructor(x, y, width, height, type = 'normal') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.center = {
      x: Math.floor(x + width / 2),
      y: Math.floor(y + height / 2)
    };
    this.type = type; // 'normal', 'entry', 'exit', 'boss', 'treasure'
  }

  // Check if this room intersects with another room
  intersects(otherRoom, padding = 1) {
    return (
      this.x - padding < otherRoom.x + otherRoom.width &&
      this.x + this.width + padding > otherRoom.x &&
      this.y - padding < otherRoom.y + otherRoom.height &&
      this.y + this.height + padding > otherRoom.y
    );
  }
}

// Generate rooms using Binary Space Partitioning (BSP) algorithm
const generateRoomsBSP = (config) => {
  const {
    width,
    height,
    roomSizeMin, 
    roomSizeMax,
    maxRooms,
    dungeonType
  } = config;

  const themeSettings = THEME_SETTINGS[dungeonType] || THEME_SETTINGS[DUNGEON_TYPES.FORGOTTEN_DUNGEON];
  const roomDensity = themeSettings.roomDensity || 0.5;
  const roomSizeVariance = themeSettings.roomSizeVariance || 0.5;

  // Function to partition a space recursively
  const partitionSpace = (x, y, width, height, depth, maxDepth) => {
    // Stop recursion at max depth or when space is too small
    if (
      depth >= maxDepth ||
      width < roomSizeMin * 2 ||
      height < roomSizeMin * 2
    ) {
      return [{ x, y, width, height }];
    }

    const spaces = [];
    const splitHorizontal = Math.random() > 0.5;

    if (splitHorizontal) {
      // Split horizontally
      const splitPoint = Math.floor(height * (0.3 + Math.random() * 0.4)); // Split between 30% and 70%
      spaces.push(...partitionSpace(x, y, width, splitPoint, depth + 1, maxDepth));
      spaces.push(...partitionSpace(x, y + splitPoint, width, height - splitPoint, depth + 1, maxDepth));
    } else {
      // Split vertically
      const splitPoint = Math.floor(width * (0.3 + Math.random() * 0.4)); // Split between 30% and 70%
      spaces.push(...partitionSpace(x, y, splitPoint, height, depth + 1, maxDepth));
      spaces.push(...partitionSpace(x + splitPoint, y, width - splitPoint, height, depth + 1, maxDepth));
    }

    return spaces;
  };

  // Calculate max depth based on desired number of rooms
  // The number of terminal spaces in a BSP tree is approximately 2^depth
  const maxDepth = Math.ceil(Math.log2(maxRooms * (1 + roomDensity)));

  // Partition the entire dungeon space
  const spaces = partitionSpace(0, 0, width, height, 0, maxDepth);

  // Create rooms within each partition
  const rooms = [];
  spaces.forEach(space => {
    // Apply room density - skip some spaces
    if (Math.random() > roomDensity) return;

    // Calculate room size within the space
    // Smaller variance means rooms closer to the space size
    // Larger variance means more random room sizes
    const roomWidthMin = Math.max(roomSizeMin, Math.floor(space.width * (1 - roomSizeVariance * 0.8)));
    const roomHeightMin = Math.max(roomSizeMin, Math.floor(space.height * (1 - roomSizeVariance * 0.8)));
    
    const roomWidthMax = Math.min(space.width - 1, roomSizeMax);
    const roomHeightMax = Math.min(space.height - 1, roomSizeMax);
    
    // Ensure minimum values are not greater than maximum values
    if (roomWidthMin >= roomWidthMax || roomHeightMin >= roomHeightMax) return;
    
    const roomWidth = Math.floor(roomWidthMin + Math.random() * (roomWidthMax - roomWidthMin));
    const roomHeight = Math.floor(roomHeightMin + Math.random() * (roomHeightMax - roomHeightMin));
    
    // Calculate position within the space (centered with some randomness)
    const paddingX = Math.floor((space.width - roomWidth) / 2);
    const paddingY = Math.floor((space.height - roomHeight) / 2);
    
    // Add some randomness to the position
    const randOffsetX = Math.floor((paddingX * 0.8) * (Math.random() * 2 - 1));
    const randOffsetY = Math.floor((paddingY * 0.8) * (Math.random() * 2 - 1));
    
    const roomX = space.x + paddingX + randOffsetX;
    const roomY = space.y + paddingY + randOffsetY;
    
    // Create the room
    const room = new Room(roomX, roomY, roomWidth, roomHeight);
    rooms.push(room);
  });

  return rooms;
};

// Generate rooms using Cellular Automata algorithm
const generateRoomsCellular = (config) => {
  const {
    width,
    height,
    maxRooms,
    dungeonType
  } = config;
  
  const themeSettings = THEME_SETTINGS[dungeonType] || THEME_SETTINGS[DUNGEON_TYPES.FORGOTTEN_DUNGEON];
  const roomDensity = themeSettings.roomDensity || 0.5;
  
  // Initialize grid with random walls and floors
  const grid = Array(height).fill().map(() => 
    Array(width).fill().map(() => Math.random() < roomDensity ? 1 : 0)
  );
  
  // Apply cellular automata rules for several iterations
  for (let i = 0; i < 5; i++) {
    const newGrid = Array(height).fill().map(() => Array(width).fill(0));
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Count neighbors that are walls
        let walls = 0;
        for (let ny = -1; ny <= 1; ny++) {
          for (let nx = -1; nx <= 1; nx++) {
            if (nx === 0 && ny === 0) continue;
            
            const checkX = x + nx;
            const checkY = y + ny;
            
            // Treat out-of-bounds as walls
            if (checkX < 0 || checkY < 0 || checkX >= width || checkY >= height) {
              walls++;
            } else if (grid[checkY][checkX] === 0) {
              walls++;
            }
          }
        }
        
        // Apply rules
        if (grid[y][x] === 1) {
          // Floor cell stays floor if it has 4 or more floor neighbors
          newGrid[y][x] = (walls <= 4) ? 1 : 0;
        } else {
          // Wall cell becomes floor if it has 5 or more floor neighbors
          newGrid[y][x] = (walls <= 3) ? 1 : 0;
        }
      }
    }
    
    // Update grid
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        grid[y][x] = newGrid[y][x];
      }
    }
  }
  
  // Identify distinct rooms by flood fill
  const visited = Array(height).fill().map(() => Array(width).fill(false));
  const roomGroups = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] === 1 && !visited[y][x]) {
        // Found an unvisited floor cell, start a new room
        const roomCells = [];
        const queue = [{ x, y }];
        
        while (queue.length > 0) {
          const cell = queue.shift();
          
          if (cell.x < 0 || cell.y < 0 || 
              cell.x >= width || cell.y >= height || 
              visited[cell.y][cell.x] || 
              grid[cell.y][cell.x] !== 1) {
            continue;
          }
          
          visited[cell.y][cell.x] = true;
          roomCells.push({ x: cell.x, y: cell.y });
          
          // Add adjacent cells to the queue
          queue.push({ x: cell.x + 1, y: cell.y });
          queue.push({ x: cell.x - 1, y: cell.y });
          queue.push({ x: cell.x, y: cell.y + 1 });
          queue.push({ x: cell.x, y: cell.y - 1 });
        }
        
        if (roomCells.length > 0) {
          roomGroups.push(roomCells);
        }
      }
    }
  }
  
  // Convert room groups to Room objects
  // Filter out tiny rooms and limit to maxRooms
  const rooms = [];
  roomGroups
    .filter(cells => cells.length >= 9) // Minimum room size
    .sort((a, b) => b.length - a.length) // Sort by size (largest first)
    .slice(0, maxRooms) // Limit to maxRooms
    .forEach(cells => {
      // Find bounding box of the room
      let minX = width, minY = height, maxX = 0, maxY = 0;
      
      cells.forEach(cell => {
        minX = Math.min(minX, cell.x);
        minY = Math.min(minY, cell.y);
        maxX = Math.max(maxX, cell.x);
        maxY = Math.max(maxY, cell.y);
      });
      
      const roomWidth = maxX - minX + 1;
      const roomHeight = maxY - minY + 1;
      
      rooms.push(new Room(minX, minY, roomWidth, roomHeight));
    });
  
  return rooms;
};

// Generate rooms randomly (basic algorithm)
const generateRoomsRandom = (config) => {
  const {
    width,
    height,
    roomSizeMin, 
    roomSizeMax,
    maxRooms,
    dungeonType
  } = config;

  const themeSettings = THEME_SETTINGS[dungeonType] || THEME_SETTINGS[DUNGEON_TYPES.FORGOTTEN_DUNGEON];
  const roomDensity = themeSettings.roomDensity || 0.5;
  
  const MAX_ATTEMPTS = 100;
  const rooms = [];
  let attempts = 0;
  
  // Room padding for checking intersections
  const roomPadding = 2;
  
  // Adjust number of rooms based on roomDensity
  const targetRooms = Math.max(1, Math.floor(maxRooms * roomDensity));
  
  while (rooms.length < targetRooms && attempts < MAX_ATTEMPTS) {
    // Generate random room dimensions
    const roomWidth = Math.floor(roomSizeMin + Math.random() * (roomSizeMax - roomSizeMin));
    const roomHeight = Math.floor(roomSizeMin + Math.random() * (roomSizeMax - roomSizeMin));
    
    // Generate random position
    const roomX = Math.floor(Math.random() * (width - roomWidth));
    const roomY = Math.floor(Math.random() * (height - roomHeight));
    
    // Create candidate room
    const room = new Room(roomX, roomY, roomWidth, roomHeight);
    
    // Check if the room intersects with any existing room
    let intersects = false;
    for (const existingRoom of rooms) {
      if (room.intersects(existingRoom, roomPadding)) {
        intersects = true;
        break;
      }
    }
    
    if (!intersects) {
      rooms.push(room);
    }
    
    attempts++;
  }
  
  return rooms;
};

// Main function to generate rooms based on algorithm
export const generateRooms = (config) => {
  const { algorithm } = config;
  
  switch (algorithm) {
    case 'bsp':
      return generateRoomsBSP(config);
    case 'cellular':
      return generateRoomsCellular(config);
    case 'random':
      return generateRoomsRandom(config);
    default:
      return generateRoomsBSP(config);
  }
};