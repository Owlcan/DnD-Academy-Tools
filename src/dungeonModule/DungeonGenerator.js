// Main dungeon generation class
import { DUNGEON_TYPES, THEME_SETTINGS } from './constants';

// Default configuration for dungeon generation
const DEFAULT_CONFIG = {
  width: 50,
  height: 30,
  roomSizeMin: 4,
  roomSizeMax: 10,
  maxRooms: 10,
  corridorWidth: 1,
  dungeonType: DUNGEON_TYPES.DARKLING_HIVE,
  algorithm: 'bsp',
  includeMandatoryRooms: true,
  useDiagonalPaths: true,
  partyLevel: 3
};

/**
 * Main dungeon generator class that creates procedural dungeons
 */
class DungeonGenerator {
  constructor(config = {}) {
    // Merge provided config with defaults
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize grid
    this.grid = Array(this.config.height).fill().map(() => 
      Array(this.config.width).fill(0) // 0 represents walls
    );
    
    this.rooms = [];
    this.corridors = [];
    this.entities = [];
    this.specialRooms = {};
  }
  
  /**
   * Generate a complete dungeon based on the configuration
   */
  generate() {
    console.log('Starting dungeon generation with config:', this.config);
    
    // Reset state for new generation
    this.grid = Array(this.config.height).fill().map(() => 
      Array(this.config.width).fill(0)
    );
    this.rooms = [];
    this.corridors = [];
    this.entities = [];
    this.specialRooms = {};
    
    // Choose generation algorithm based on config
    switch (this.config.algorithm) {
      case 'bsp':
        console.log('Using BSP algorithm');
        this._generateBSP();
        break;
      case 'cellular':
        console.log('Using Cellular algorithm');
        this._generateCellular();
        break;
      case 'random':
        console.log('Using Random algorithm');
        this._generateRandom();
        break;
      default:
        console.log('Using default BSP algorithm');
        this._generateBSP();
    }
    
    // Debug output of generated dungeon
    console.log('Generated rooms:', this.rooms.length);
    console.log('Generated corridors:', this.corridors.length);
    console.log('Grid size:', this.grid.length, 'x', this.grid[0].length);
    
    // Add special rooms if enabled
    if (this.config.includeMandatoryRooms) {
      this._addSpecialRooms();
    }
    
    // Add entities (monsters, treasures, traps)
    this._populateDungeon();
    
    const dungeonData = this._getDungeonData();
    console.log('Final dungeon data:', dungeonData);
    return dungeonData;
  }
  
  /**
   * Generate dungeon using Binary Space Partitioning
   * This creates more structured, room-based dungeons
   */
  _generateBSP() {
    // For now, just create a simple sample room layout
    // In a real implementation, this would use the BSP algorithm
    
    // Create a few sample rooms
    const numberOfRooms = Math.min(
      this.config.maxRooms, 
      Math.floor(Math.random() * 5) + 5
    );
    
    for (let i = 0; i < numberOfRooms; i++) {
      const roomWidth = Math.floor(Math.random() * 
        (this.config.roomSizeMax - this.config.roomSizeMin + 1)) + 
        this.config.roomSizeMin;
        
      const roomHeight = Math.floor(Math.random() * 
        (this.config.roomSizeMax - this.config.roomSizeMin + 1)) + 
        this.config.roomSizeMin;
        
      const roomX = Math.floor(Math.random() * 
        (this.config.width - roomWidth - 2)) + 1;
        
      const roomY = Math.floor(Math.random() * 
        (this.config.height - roomHeight - 2)) + 1;
      
      // Check if this room would overlap with any existing rooms
      let overlaps = false;
      for (const room of this.rooms) {
        if (
          roomX < room.x + room.width + 1 &&
          roomX + roomWidth + 1 > room.x &&
          roomY < room.y + room.height + 1 &&
          roomY + roomHeight + 1 > room.y
        ) {
          overlaps = true;
          break;
        }
      }
      
      // Only add the room if it doesn't overlap
      if (!overlaps) {
        const newRoom = { x: roomX, y: roomY, width: roomWidth, height: roomHeight };
        this.rooms.push(newRoom);
        
        // Carve out the room in the grid
        for (let y = roomY; y < roomY + roomHeight; y++) {
          for (let x = roomX; x < roomX + roomWidth; x++) {
            this.grid[y][x] = 1; // 1 represents floor
          }
        }
      }
    }
    
    // Connect rooms with corridors
    if (this.rooms.length > 1) {
      for (let i = 1; i < this.rooms.length; i++) {
        const prevRoom = this.rooms[i - 1];
        const currentRoom = this.rooms[i];
        
        // Get center points of the rooms
        const prevX = Math.floor(prevRoom.x + prevRoom.width / 2);
        const prevY = Math.floor(prevRoom.y + prevRoom.height / 2);
        const currX = Math.floor(currentRoom.x + currentRoom.width / 2);
        const currY = Math.floor(currentRoom.y + currentRoom.height / 2);
        
        // Create L-shaped corridor
        this._createCorridor(prevX, prevY, currX, currY);
      }
    }
  }
  
  /**
   * Generate dungeon using Cellular Automata
   * This creates more organic, cave-like structures
   */
  _generateCellular() {
    // Initialize with random noise
    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        // Add border walls
        if (x === 0 || y === 0 || x === this.config.width - 1 || y === this.config.height - 1) {
          this.grid[y][x] = 0; // Wall
        } else {
          // Random fill (45% walls)
          this.grid[y][x] = Math.random() < 0.45 ? 0 : 1;
        }
      }
    }
    
    // Apply cellular automata rules multiple times
    for (let i = 0; i < 5; i++) {
      this._applyCellularAutomataStep();
    }
    
    // Find and store rooms
    this._identifyRooms();
  }
  
  /**
   * Apply one step of the cellular automata algorithm
   */
  _applyCellularAutomataStep() {
    const newGrid = Array(this.config.height).fill().map(() => 
      Array(this.config.width).fill(0)
    );
    
    for (let y = 1; y < this.config.height - 1; y++) {
      for (let x = 1; x < this.config.width - 1; x++) {
        // Count walls in 3x3 neighborhood
        let walls = 0;
        for (let ny = -1; ny <= 1; ny++) {
          for (let nx = -1; nx <= 1; nx++) {
            if (this.grid[y + ny][x + nx] === 0) {
              walls++;
            }
          }
        }
        
        // Apply cellular automata rules
        if (this.grid[y][x] === 0) {
          // If cell is a wall
          newGrid[y][x] = (walls >= 4) ? 0 : 1;
        } else {
          // If cell is a floor
          newGrid[y][x] = (walls >= 5) ? 0 : 1;
        }
      }
    }
    
    // Keep border walls
    for (let y = 0; y < this.config.height; y++) {
      for (let x = 0; x < this.config.width; x++) {
        if (x === 0 || y === 0 || x === this.config.width - 1 || y === this.config.height - 1) {
          newGrid[y][x] = 0;
        }
      }
    }
    
    this.grid = newGrid;
  }
  
  /**
   * Identify distinct rooms in a cellular automata generated map
   */
  _identifyRooms() {
    const visited = Array(this.config.height).fill().map(() => 
      Array(this.config.width).fill(false)
    );
    
    const floodFill = (x, y, roomCells) => {
      // Out of bounds or not floor or already visited
      if (x < 0 || y < 0 || x >= this.config.width || y >= this.config.height ||
          this.grid[y][x] !== 1 || visited[y][x]) {
        return;
      }
      
      visited[y][x] = true;
      roomCells.push({ x, y });
      
      // Check 4 cardinal directions
      floodFill(x + 1, y, roomCells);
      floodFill(x - 1, y, roomCells);
      floodFill(x, y + 1, roomCells);
      floodFill(x, y - 1, roomCells);
    };
    
    // Find connected regions (rooms)
    for (let y = 1; y < this.config.height - 1; y++) {
      for (let x = 1; x < this.config.width - 1; x++) {
        if (this.grid[y][x] === 1 && !visited[y][x]) {
          const roomCells = [];
          floodFill(x, y, roomCells);
          
          // Only consider as a room if it has minimum size
          if (roomCells.length >= 16) { // At least 4x4
            // Find bounding box
            let minX = this.config.width;
            let minY = this.config.height;
            let maxX = 0;
            let maxY = 0;
            
            roomCells.forEach(cell => {
              minX = Math.min(minX, cell.x);
              minY = Math.min(minY, cell.y);
              maxX = Math.max(maxX, cell.x);
              maxY = Math.max(maxY, cell.y);
            });
            
            this.rooms.push({
              x: minX,
              y: minY,
              width: maxX - minX + 1,
              height: maxY - minY + 1,
              cells: roomCells
            });
          }
        }
      }
    }
    
    // Connect rooms with corridors
    if (this.rooms.length > 1) {
      for (let i = 1; i < this.rooms.length; i++) {
        const room1 = this.rooms[i - 1];
        const room2 = this.rooms[i];
        
        // Get random cells from each room
        const cell1 = room1.cells[Math.floor(Math.random() * room1.cells.length)];
        const cell2 = room2.cells[Math.floor(Math.random() * room2.cells.length)];
        
        // Create corridor between these cells
        this._createCorridor(cell1.x, cell1.y, cell2.x, cell2.y);
      }
    }
  }
  
  /**
   * Generate dungeon with completely random rooms
   */
  _generateRandom() {
    // Simpler approach - just place rooms randomly
    const numRooms = Math.floor(Math.random() * 10) + 5;
    
    for (let i = 0; i < numRooms; i++) {
      const width = Math.floor(Math.random() * 
        (this.config.roomSizeMax - this.config.roomSizeMin)) + this.config.roomSizeMin;
      const height = Math.floor(Math.random() * 
        (this.config.roomSizeMax - this.config.roomSizeMin)) + this.config.roomSizeMin;
      
      const x = Math.floor(Math.random() * (this.config.width - width - 2)) + 1;
      const y = Math.floor(Math.random() * (this.config.height - height - 2)) + 1;
      
      this.rooms.push({ x, y, width, height });
      
      // Carve room
      for (let ry = y; ry < y + height; ry++) {
        for (let rx = x; rx < x + width; rx++) {
          this.grid[ry][rx] = 1;
        }
      }
    }
    
    // Connect all rooms
    for (let i = 0; i < this.rooms.length - 1; i++) {
      const room1 = this.rooms[i];
      const room2 = this.rooms[i + 1];
      
      const x1 = Math.floor(room1.x + room1.width / 2);
      const y1 = Math.floor(room1.y + room1.height / 2);
      const x2 = Math.floor(room2.x + room2.width / 2);
      const y2 = Math.floor(room2.y + room2.height / 2);
      
      this._createCorridor(x1, y1, x2, y2);
    }
  }
  
  /**
   * Create a corridor between two points
   */
  _createCorridor(x1, y1, x2, y2) {
    // Simple L-shaped corridor
    const corridorWidth = this.config.corridorWidth;
    const corridor = { startX: x1, startY: y1, endX: x2, endY: y2, width: corridorWidth };
    this.corridors.push(corridor);
    
    // Determine if we go horizontally first
    const horizontalFirst = Math.random() > 0.5;
    
    if (horizontalFirst) {
      // Horizontal segment
      this._drawLine(x1, y1, x2, y1, 2, corridorWidth); // 2 = corridor
      
      // Vertical segment
      this._drawLine(x2, y1, x2, y2, 2, corridorWidth);
    } else {
      // Vertical segment
      this._drawLine(x1, y1, x1, y2, 2, corridorWidth);
      
      // Horizontal segment
      this._drawLine(x1, y2, x2, y2, 2, corridorWidth);
    }
  }
  
  /**
   * Draw a line on the grid (for corridors)
   */
  _drawLine(x1, y1, x2, y2, value, width = 1) {
    // Ensure coordinates are in bounds
    x1 = Math.max(1, Math.min(this.config.width - 2, x1));
    y1 = Math.max(1, Math.min(this.config.height - 2, y1));
    x2 = Math.max(1, Math.min(this.config.width - 2, x2));
    y2 = Math.max(1, Math.min(this.config.height - 2, y2));
    
    // Get the half-width (how many cells to each side)
    const halfWidth = Math.floor(width / 2);
    
    if (x1 === x2) {
      // Vertical line
      const startY = Math.min(y1, y2);
      const endY = Math.max(y1, y2);
      
      for (let y = startY; y <= endY; y++) {
        for (let w = -halfWidth; w <= halfWidth; w++) {
          const tx = x1 + w;
          if (tx >= 1 && tx < this.config.width - 1) {
            this.grid[y][tx] = value;
          }
        }
      }
    } else if (y1 === y2) {
      // Horizontal line
      const startX = Math.min(x1, x2);
      const endX = Math.max(x1, x2);
      
      for (let x = startX; x <= endX; x++) {
        for (let w = -halfWidth; w <= halfWidth; w++) {
          const ty = y1 + w;
          if (ty >= 1 && ty < this.config.height - 1) {
            this.grid[ty][x] = value;
          }
        }
      }
    } else if (this.config.useDiagonalPaths) {
      // Diagonal line using Bresenham's algorithm
      const dx = Math.abs(x2 - x1);
      const dy = Math.abs(y2 - y1);
      const sx = x1 < x2 ? 1 : -1;
      const sy = y1 < y2 ? 1 : -1;
      let err = dx - dy;
      
      let x = x1;
      let y = y1;
      
      while (true) {
        for (let w = -halfWidth; w <= halfWidth; w++) {
          for (let h = -halfWidth; h <= halfWidth; h++) {
            const tx = x + w;
            const ty = y + h;
            if (tx >= 1 && tx < this.config.width - 1 && 
                ty >= 1 && ty < this.config.height - 1) {
              this.grid[ty][tx] = value;
            }
          }
        }
        
        if (x === x2 && y === y2) break;
        
        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x += sx;
        }
        if (e2 < dx) {
          err += dx;
          y += sy;
        }
      }
    }
  }
  
  /**
   * Add special rooms like the entrance, boss room, etc.
   */
  _addSpecialRooms() {
    if (this.rooms.length < 2) {
      console.warn('Not enough rooms to add special rooms');
      return;
    }
    
    // Entry/Starting room
    const entryRoomIndex = 0;
    const entryRoom = this.rooms[entryRoomIndex];
    this.specialRooms.entry = { ...entryRoom };
    
    // Boss room - usually far from the entry
    const bossRoomIndex = this.rooms.length - 1;
    const bossRoom = this.rooms[bossRoomIndex];
    this.specialRooms.boss = { ...bossRoom };
    
    // Add doors between rooms and corridors
    this._addDoors();
  }
  
  /**
   * Add doors between rooms and corridors
   */
  _addDoors() {
    // For now, just add a few sample doors
    for (const room of this.rooms) {
      // Try to place doors on each wall of the room
      const walls = [
        { x: room.x + Math.floor(room.width / 2), y: room.y }, // Top
        { x: room.x + Math.floor(room.width / 2), y: room.y + room.height - 1 }, // Bottom
        { x: room.x, y: room.y + Math.floor(room.height / 2) }, // Left
        { x: room.x + room.width - 1, y: room.y + Math.floor(room.height / 2) }  // Right
      ];
      
      for (const wall of walls) {
        // Check if this cell has a corridor adjacent to it
        let hasCorridor = false;
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const nx = wall.x + dx;
            const ny = wall.y + dy;
            
            if (nx >= 0 && nx < this.config.width && 
                ny >= 0 && ny < this.config.height &&
                this.grid[ny][nx] === 2) { // Corridor
              hasCorridor = true;
              break;
            }
          }
          if (hasCorridor) break;
        }
        
        // 10% chance to add a door if it's adjacent to a corridor
        if (hasCorridor && Math.random() < 0.1) {
          this.grid[wall.y][wall.x] = 3; // Door
        }
      }
    }
  }
  
  /**
   * Populate the dungeon with enemies, treasures, and traps
   */
  _populateDungeon() {
    const theme = THEME_SETTINGS[this.config.dungeonType];
    
    if (!theme) {
      console.warn(`No theme settings found for ${this.config.dungeonType}`);
      return;
    }
    
    // Determine number of monsters based on theme and party level
    const partyLevel = this.config.partyLevel || 3;
    const monsterCount = Math.floor(
      Math.random() * (theme.population.maxMonsters - theme.population.minMonsters + 1) + 
      theme.population.minMonsters
    );
    
    // Determine number of treasures
    const treasureCount = Math.floor(
      Math.random() * (theme.population.maxTreasure - theme.population.minTreasure + 1) + 
      theme.population.minTreasure
    );
    
    // Determine number of traps
    const trapCount = Math.floor(
      Math.random() * (theme.population.maxTraps - theme.population.minTraps + 1) + 
      theme.population.minTraps
    );
    
    // Add monsters
    this._addEntities('monster', monsterCount, partyLevel);
    
    // Add treasures
    this._addEntities('treasure', treasureCount);
    
    // Add traps
    this._addEntities('trap', trapCount, partyLevel);
    
    // Add player starting point in the entry room
    if (this.specialRooms.entry) {
      const entry = this.specialRooms.entry;
      const x = entry.x + Math.floor(entry.width / 2);
      const y = entry.y + Math.floor(entry.height / 2);
      
      this.entities.push({
        type: 'player_start',
        x, y,
        properties: {}
      });
    }
    
    // Add boss monster in the boss room
    if (this.specialRooms.boss) {
      const boss = this.specialRooms.boss;
      const x = boss.x + Math.floor(boss.width / 2);
      const y = boss.y + Math.floor(boss.height / 2);
      
      this.entities.push({
        type: 'monster',
        x, y,
        properties: {
          name: 'Boss Monster', // This would be replaced with actual boss data
          hp: 50,
          maxHP: 50,
          isBoss: true,
          level: partyLevel + 2,
          difficulty: 'boss',
          challengeRating: Math.min(partyLevel + 2, 20)
        }
      });
    }
    
    // Add exit
    if (this.rooms.length > 1) {
      // Usually place exit in a room that's not the entry or boss room
      let exitRoomIndex = Math.floor(Math.random() * (this.rooms.length - 2)) + 1;
      
      // Make sure it's not the boss room
      if (exitRoomIndex === this.rooms.length - 1) {
        exitRoomIndex = this.rooms.length - 2;
      }
      
      const exitRoom = this.rooms[exitRoomIndex];
      this.specialRooms.exit = { ...exitRoom };
      
      const x = exitRoom.x + Math.floor(exitRoom.width / 2);
      const y = exitRoom.y + Math.floor(exitRoom.height / 2);
      
      this.entities.push({
        type: 'stairs',
        x, y,
        properties: {
          direction: 'down'
        }
      });
    }
  }
  
  /**
   * Add entities of a specific type to the dungeon
   */
  _addEntities(type, count, level = 1) {
    // Get available rooms (exclude special rooms)
    const availableRooms = this.rooms.filter(room => {
      // Skip entry and boss rooms
      if (this.specialRooms.entry && 
          room.x === this.specialRooms.entry.x && 
          room.y === this.specialRooms.entry.y) {
        return false;
      }
      
      if (this.specialRooms.boss && 
          room.x === this.specialRooms.boss.x && 
          room.y === this.specialRooms.boss.y) {
        return false;
      }
      
      return true;
    });
    
    if (availableRooms.length === 0) {
      return;
    }
    
    for (let i = 0; i < count; i++) {
      // Select a random room
      const room = availableRooms[Math.floor(Math.random() * availableRooms.length)];
      
      // Place entity at a random position within the room
      const x = room.x + Math.floor(Math.random() * (room.width - 2)) + 1;
      const y = room.y + Math.floor(Math.random() * (room.height - 2)) + 1;
      
      // Check if position is already occupied
      const isOccupied = this.entities.some(entity => 
        entity.x === x && entity.y === y
      );
      
      if (!isOccupied) {
        // Generate entity properties based on type
        let properties = {};
        
        switch (type) {
          case 'monster':
            properties = this._generateMonsterProperties(level);
            break;
          case 'treasure':
            properties = this._generateTreasureProperties(level);
            break;
          case 'trap':
            properties = this._generateTrapProperties(level);
            break;
        }
        
        this.entities.push({
          type,
          x, y,
          properties
        });
      }
    }
  }
  
  /**
   * Generate properties for a monster entity
   */
  _generateMonsterProperties(level) {
    // In a real implementation, this would look up monsters from a bestiary
    
    // Determine difficulty category based on level
    const difficulties = ['easy', 'medium', 'hard', 'deadly'];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    
    // Simple monster template
    return {
      name: 'Generic Monster',
      hp: 10 + level * 5,
      maxHP: 10 + level * 5,
      level: level,
      difficulty: difficulty,
      challengeRating: Math.max(1, Math.min(level, 20)),
      isBoss: false
    };
  }
  
  /**
   * Generate properties for a treasure entity
   */
  _generateTreasureProperties(level) {
    // Calculate base value based on party level
    const baseValue = level * 50;
    const value = Math.floor((Math.random() * 0.5 + 0.75) * baseValue);
    
    return {
      value,
      type: Math.random() < 0.2 ? 'chest' : 'coins',
      rarity: Math.random() < 0.1 ? 'rare' : 'common'
    };
  }
  
  /**
   * Generate properties for a trap entity
   */
  _generateTrapProperties(level) {
    // Trap damage is based on level
    const damage = Math.floor(level * 1.5) + Math.floor(Math.random() * level);
    
    const trapTypes = ['pit', 'dart', 'poison', 'fire', 'frost', 'magical'];
    const type = trapTypes[Math.floor(Math.random() * trapTypes.length)];
    
    return {
      damage,
      type,
      difficulty: Math.min(10 + level, 20), // DC to detect/disarm
      detected: false
    };
  }
  
  /**
   * Get the complete dungeon data structure
   */
  _getDungeonData() {
    return {
      grid: this.grid,
      rooms: this.rooms,
      corridors: this.corridors,
      entities: this.entities,
      specialRooms: this.specialRooms,
      config: this.config
    };
  }
}

export default DungeonGenerator;