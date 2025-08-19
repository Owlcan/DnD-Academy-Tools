// Main dungeon generation class
import { DUNGEON_TYPES, THEME_SETTINGS, CELL_TYPES } from './constants';

// Custom seeded random implementation (no external dependency)
// Based on mulberry32 algorithm, a simple but effective PRNG

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
  partyLevel: 3,
  seed: null // Added seed parameter for reproducible generation
};

/**
 * Seeded random number generator for deterministic dungeon generation
 * Based on mulberry32 algorithm
 */
class SeededRandom {
  constructor(seed) {
    this.seed = seed || Math.floor(Math.random() * 1000000);
    console.log(`Using seed: ${this.seed}`);
  }
  
  // Get the next random number between 0 and 1
  next() {
    // Convert seed to 32-bit unsigned integer
    let t = this.seed += 0x6D2B79F5;
    // Bitwise operations for mulberry32 algorithm - fixed operator precedence with parentheses
    t = Math.imul((t ^ (t >>> 15)), t | 1);
    t ^= t + Math.imul((t ^ (t >>> 7)), t | 61);
    // Convert to float between 0 and 1
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  
  // Get integer between min (inclusive) and max (exclusive)
  nextInt(min, max) {
    return Math.floor(this.next() * (max - min)) + min;
  }
  
  // Select random item from array
  select(array) {
    return array[Math.floor(this.next() * array.length)];
  }
}

/**
 * Main dungeon generator class that creates procedural dungeons
 */
class DungeonGenerator {
  constructor(config = {}) {
    // Merge provided config with defaults
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize random number generator with seed
    this.random = new SeededRandom(this.config.seed);
    
    // Initialize grid
    this.grid = Array(this.config.height).fill().map(() => 
      Array(this.config.width).fill(0) // 0 represents walls
    );
    
    this.rooms = [];
    this.corridors = [];
    this.entities = [];
    this.specialRooms = {};
    this.encounterActive = false;
    this.currentEncounter = null;
    this.combatSystem = null;
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
    
    // Initialize combat capabilities
    this.attachCombatSystem();

    const dungeonData = this._getDungeonData();
    console.log('Final dungeon data:', dungeonData);
    return dungeonData;
  }
  
  /**
   * Attach combat system to the dungeon
   */
  attachCombatSystem() {
    const { GameLogic } = require('./combat/GameLogic');
    this.combatSystem = new GameLogic(this);
    return this.combatSystem;
  }

  /**
   * Get players in the dungeon
   */
  getPlayers() {
    return this.players || [];
  }

  /**
   * Get monsters in the dungeon
   */
  getMonsters() {
    return this.monsters || [];
  }

  /**
   * Get chests in the dungeon
   */
  getChests() {
    return this.treasures || [];
  }

  /**
   * Get alive players in the dungeon
   */
  getAlivePlayers() {
    return this.getPlayers().filter(p => p.properties.hp > 0);
  }

  /**
   * Check if a move is valid
   */
  isValidMove(x, y) {
    if (!this.grid) return false;
    return this.grid[y]?.[x] === 1;
  }

  /**
   * Load an encounter into the dungeon
   * @param {Object} encounter - The encounter data to load
   */
  loadEncounter(encounter) {
    if (!encounter) return;
    
    this.grid = encounter.grid;
    this.rooms = encounter.rooms || [];
    this.corridors = encounter.corridors || [];
    this.entities = encounter.entities || [];
    this.width = encounter.width;
    this.height = encounter.height;
    
    console.log('Encounter loaded:', encounter);
  }

  /**
   * Clear the current encounter and reset
   */
  clearEncounter() {
    // Reset to empty grid
    this.grid = Array(this.config.height).fill().map(() => 
      Array(this.config.width).fill(0)
    );
    this.rooms = [];
    this.corridors = [];
    this.entities = [];
    
    console.log('Encounter cleared');
  }
  
  /**
   * Check if an encounter is currently active
   * @returns {boolean} True if an encounter is active
   */
  hasEncounter() {
    return this.encounterActive;
  }

  /**
   * Generate a single player encounter (smaller area, fewer monsters)
   * @returns {Object} Encounter data for rendering
   */
  generateSinglePlayerEncounter() {
    console.log('Generating single player encounter');
    return this.generateEncounterMap({
      width: 15,
      height: 15,
      roomCount: 1,
      monsterCount: this.random.nextInt(1, 3), // 1-2 monsters for single player
      includeBoss: this.random.next() < 0.3, // 30% chance of boss
      playerLevel: this.config.partyLevel || 5 // Target level 4-6 characters
    });
  }

  /**
   * Generate a group encounter (larger area, more monsters)
   * @returns {Object} Encounter data for rendering
   */
  generateGroupEncounter() {
    console.log('Generating group encounter');
    return this.generateEncounterMap({
      width: 20,
      height: 20,
      roomCount: this.random.next() < 0.5 ? 1 : 2, // 50% chance of 1 or 2 rooms
      monsterCount: this.random.nextInt(3, 7), // 3-6 monsters for groups
      includeBoss: this.random.next() < 0.4, // 40% chance of boss
      playerLevel: this.config.partyLevel || 5 // Target level 4-6 characters
    });
  }

  /**
   * Generates a standalone encounter map with one or two rooms and monster tokens
   * @param {Object} options - Configuration options
   * @param {number} options.width - Width of the encounter area (default: 15)
   * @param {number} options.height - Height of the encounter area (default: 15)
   * @param {number} options.roomCount - Number of rooms (1 or 2, default: 1)
   * @param {number} options.monsterCount - Number of monsters to place (default: 3)
   * @param {number} options.playerLevel - Level of monsters (default: party level)
   * @param {boolean} options.includeBoss - Whether to include a boss monster (default: false)
   * @returns {Object} Map data that can be rendered on the main game board
   */
  generateEncounterMap(options = {}) {
    // Default options
    const defaultOptions = {
      width: 15,
      height: 15,
      roomCount: 1,
      monsterCount: 3,
      playerLevel: this.config.partyLevel || 5,
      includeBoss: false
    };

    const config = { ...defaultOptions, ...options };
    
    console.log('Generating encounter map with config:', config);
    
    // Create a smaller grid for the encounter
    const grid = Array(config.height).fill().map(() => 
      Array(config.width).fill(0) // 0 represents walls
    );
    
    const rooms = [];
    const entities = [];
    const corridors = [];
    
    // Generate rooms
    const roomWidth = Math.floor(config.width * 0.7); // 70% of map width
    const roomHeight = Math.floor(config.height * 0.7); // 70% of map height
    
    // First room centered in the map
    const room1 = {
      x: Math.floor((config.width - roomWidth) / 2),
      y: Math.floor((config.height - roomHeight) / 2),
      width: roomWidth,
      height: roomHeight,
      center: {
        x: Math.floor(config.width / 2),
        y: Math.floor(config.height / 2)
      }
    };
    
    rooms.push(room1);
    
    // Carve out the room
    for (let y = room1.y; y < room1.y + room1.height; y++) {
      for (let x = room1.x; x < room1.x + room1.width; x++) {
        if (y >= 0 && y < config.height && x >= 0 && x < config.width) {
          grid[y][x] = 1; // 1 represents floor
        }
      }
    }
    
    // Add a second room if requested
    if (config.roomCount > 1) {
      // Determine position (adjacent to first room)
      const direction = this.random.nextInt(0, 4); // 0: top, 1: right, 2: bottom, 3: left
      
      let room2Width = Math.floor(roomWidth * 0.8); // Slightly smaller
      let room2Height = Math.floor(roomHeight * 0.8);
      let room2X, room2Y;
      
      switch (direction) {
        case 0: // Top
          room2X = room1.x + Math.floor((room1.width - room2Width) / 2);
          room2Y = Math.max(1, room1.y - room2Height - 1);
          break;
        case 1: // Right
          room2X = room1.x + room1.width + 1;
          room2Y = room1.y + Math.floor((room1.height - room2Height) / 2);
          break;
        case 2: // Bottom
          room2X = room1.x + Math.floor((room1.width - room2Width) / 2);
          room2Y = room1.y + room1.height + 1;
          break;
        case 3: // Left
          room2X = Math.max(1, room1.x - room2Width - 1);
          room2Y = room1.y + Math.floor((room1.height - room2Height) / 2);
          break;
      }
      
      // Ensure room fits on the map
      if (room2X >= 0 && room2Y >= 0 && room2X + room2Width < config.width && room2Y + room2Height < config.height) {
        const room2 = {
          x: room2X,
          y: room2Y,
          width: room2Width,
          height: room2Height,
          center: {
            x: Math.floor(room2X + room2Width / 2),
            y: Math.floor(room2Y + room2Height / 2)
          }
        };
        
        rooms.push(room2);
        
        // Carve out the second room
        for (let y = room2.y; y < room2.y + room2.height; y++) {
          for (let x = room2.x; x < room2.x + room2.width; x++) {
            if (y >= 0 && y < config.height && x >= 0 && x < config.width) {
              grid[y][x] = 1; // 1 represents floor
            }
          }
        }
        
        // Create corridor between rooms
        this._createEncounterCorridor(room1.center.x, room1.center.y, room2.center.x, room2.center.y, grid, corridors);
      }
    }
    
    // Add player start position
    const startRoom = rooms[0];
    entities.push({
      type: 'player_start',
      x: startRoom.center.x,
      y: startRoom.center.y,
      properties: {}
    });
    
    // Add monsters from bestiary if available
    if (window.bestiary && window.bestiary.creatures && window.bestiary.creatures.length > 0) {
      this._populateWithBestiaryMonsters(rooms, entities, config, window.bestiary);
    } else {
      // Use generic monsters if no bestiary available
      this._populateWithGenericMonsters(rooms, entities, config);
    }
    
    // Update internal state
    this.encounterActive = true;
    
    return {
      grid,
      rooms,
      entities,
      corridors,
      width: config.width,
      height: config.height,
      isEncounterMap: true, // Flag to identify this as a standalone encounter map
      playerLevel: config.playerLevel
    };
  }

  /**
   * Create a corridor specifically for encounters
   */
  _createEncounterCorridor(x1, y1, x2, y2, grid, corridors) {
    // Simple L-shaped corridor
    const corridor = { startX: x1, startY: y1, endX: x2, endY: y2, width: 1 };
    corridors.push(corridor);
    
    // Determine if we go horizontally first
    const horizontalFirst = this.random.next() > 0.5;
    
    if (horizontalFirst) {
      // Horizontal segment
      this._drawEncounterLine(x1, y1, x2, y1, 1, 1, grid);
      
      // Vertical segment
      this._drawEncounterLine(x2, y1, x2, y2, 1, 1, grid);
    } else {
      // Vertical segment
      this._drawEncounterLine(x1, y1, x1, y2, 1, 1, grid);
      
      // Horizontal segment
      this._drawEncounterLine(x1, y2, x2, y2, 1, 1, grid);
    }
  }

  /**
   * Draw a line for encounter corridors
   */
  _drawEncounterLine(x1, y1, x2, y2, value, width, grid) {
    // Ensure coordinates are in bounds
    x1 = Math.max(1, Math.min(grid[0].length - 2, x1));
    y1 = Math.max(1, Math.min(grid.length - 2, y1));
    x2 = Math.max(1, Math.min(grid[0].length - 2, x2));
    y2 = Math.max(1, Math.min(grid.length - 2, y2));
    
    // Get the half-width
    const halfWidth = Math.floor(width / 2);
    
    if (x1 === x2) {
      // Vertical line
      const startY = Math.min(y1, y2);
      const endY = Math.max(y1, y2);
      
      for (let y = startY; y <= endY; y++) {
        for (let w = -halfWidth; w <= halfWidth; w++) {
          const tx = x1 + w;
          if (tx >= 1 && tx < grid[0].length - 1) {
            grid[y][tx] = value;
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
          if (ty >= 1 && ty < grid.length - 1) {
            grid[ty][x] = value;
          }
        }
      }
    }
  }

  /**
   * Generate dungeon using Binary Space Partitioning
   * This creates more structured, room-based dungeons
   */
  _generateBSP() {
    console.log('Generating dungeon using BSP algorithm');
    
    // Function to partition a space recursively
    const partitionSpace = (x, y, width, height, depth, maxDepth) => {
      // Stop recursion at max depth or when space is too small
      if (
        depth >= maxDepth ||
        width < this.config.roomSizeMin * 2 ||
        height < this.config.roomSizeMin * 2
      ) {
        return [{ x, y, width, height }];
      }

      const spaces = [];
      // Split horizontally or vertically with some randomness
      const splitHorizontal = this.random.next() > 0.5;

      if (splitHorizontal) {
        // Split horizontally between 30% and 70% of height
        const splitPoint = Math.floor(height * (0.3 + this.random.next() * 0.4));
        spaces.push(...partitionSpace(x, y, width, splitPoint, depth + 1, maxDepth));
        spaces.push(...partitionSpace(x, y + splitPoint, width, height - splitPoint, depth + 1, maxDepth));
      } else {
        // Split vertically between 30% and 70% of width
        const splitPoint = Math.floor(width * (0.3 + this.random.next() * 0.4));
        spaces.push(...partitionSpace(x, y, splitPoint, height, depth + 1, maxDepth));
        spaces.push(...partitionSpace(x + splitPoint, y, width - splitPoint, height, depth + 1, maxDepth));
      }

      return spaces;
    };

    // Calculate max depth based on desired number of rooms
    // The number of terminal spaces in a BSP tree is approximately 2^depth
    const roomDensity = 0.75; // Configure as needed
    const maxDepth = Math.ceil(Math.log2(this.config.maxRooms * (1 + roomDensity)));

    // Partition the entire dungeon space
    const spaces = partitionSpace(1, 1, this.config.width - 2, this.config.height - 2, 0, maxDepth);
    
    // Create rooms within each partition
    for (const space of spaces) {
      // Apply room density - skip some spaces for variety
      if (this.random.next() > roomDensity) continue;

      // Calculate room size within the space (smaller than the partition)
      const roomSizeVariance = 0.3; // Controls how much rooms can vary in size
      
      // Minimum width/height (at least roomSizeMin, but possibly larger based on partition)
      const roomWidthMin = Math.max(
        this.config.roomSizeMin, 
        Math.floor(space.width * (1 - roomSizeVariance))
      );
      
      const roomHeightMin = Math.max(
        this.config.roomSizeMin, 
        Math.floor(space.height * (1 - roomSizeVariance))
      );
      
      // Maximum width/height (capped by config.roomSizeMax and partition size)
      const roomWidthMax = Math.min(space.width - 1, this.config.roomSizeMax);
      const roomHeightMax = Math.min(space.height - 1, this.config.roomSizeMax);
      
      // Skip if min dimensions are greater than max (space too small)
      if (roomWidthMin >= roomWidthMax || roomHeightMin >= roomHeightMax) continue;
      
      // Generate random room dimensions
      const roomWidth = this.random.nextInt(roomWidthMin, roomWidthMax + 1);
      const roomHeight = this.random.nextInt(roomHeightMin, roomHeightMax + 1);
      
      // Calculate position within the space (centered with some randomness)
      const paddingX = Math.floor((space.width - roomWidth) / 2);
      const paddingY = Math.floor((space.height - roomHeight) / 2);
      
      // Add some randomness to the position (up to 80% of the padding)
      const randOffsetX = Math.floor((paddingX * 0.8) * (this.random.next() * 2 - 1));
      const randOffsetY = Math.floor((paddingY * 0.8) * (this.random.next() * 2 - 1));
      
      const roomX = space.x + paddingX + randOffsetX;
      const roomY = space.y + paddingY + randOffsetY;
      
      // Make sure room is within dungeon boundaries
      if (roomX < 1 || roomY < 1 || 
          roomX + roomWidth >= this.config.width - 1 || 
          roomY + roomHeight >= this.config.height - 1) {
        continue;
      }
      
      // Create and add the room
      const newRoom = { 
        x: roomX, 
        y: roomY, 
        width: roomWidth, 
        height: roomHeight,
        center: {
          x: Math.floor(roomX + roomWidth / 2),
          y: Math.floor(roomY + roomHeight / 2)
        }
      };
      
      this.rooms.push(newRoom);
      
      // Carve out the room in the grid
      for (let y = roomY; y < roomY + roomHeight; y++) {
        for (let x = roomX; x < roomX + roomWidth; x++) {
          if (y >= 0 && y < this.config.height && x >= 0 && x < this.config.width) {
            this.grid[y][x] = 1; // 1 represents floor
          }
        }
      }
    }
    
    console.log(`Generated ${this.rooms.length} rooms using BSP algorithm`);
    
    // Connect rooms with corridors
    this._connectRooms();
  }

  /**
   * Connect rooms with corridors
   * Helper method for BSP generation
   */
  _connectRooms() {
    if (this.rooms.length <= 1) return;

    // Sort rooms by position from left to right
    const sortedRooms = [...this.rooms].sort((a, b) => a.center.x - b.center.x);
    
    // Connect adjacent rooms in the sorted list (creates primary path)
    for (let i = 0; i < sortedRooms.length - 1; i++) {
      const roomA = sortedRooms[i];
      const roomB = sortedRooms[i + 1];
      
      this._createCorridor(
        roomA.center.x, roomA.center.y,
        roomB.center.x, roomB.center.y
      );
    }
    
    // Add some random connections between non-adjacent rooms (creates loops)
    const extraConnectionCount = Math.floor(this.rooms.length * 0.3); // 30% extra connections
    
    for (let i = 0; i < extraConnectionCount; i++) {
      const roomAIndex = this.random.nextInt(0, this.rooms.length);
      let roomBIndex = this.random.nextInt(0, this.rooms.length);
      
      // Make sure we don't connect a room to itself
      while (roomBIndex === roomAIndex) {
        roomBIndex = this.random.nextInt(0, this.rooms.length);
      }
      
      const roomA = this.rooms[roomAIndex];
      const roomB = this.rooms[roomBIndex];
      
      // Only connect if rooms are not adjacent in the primary path
      if (Math.abs(roomAIndex - roomBIndex) > 1) {
        this._createCorridor(
          roomA.center.x, roomA.center.y,
          roomB.center.x, roomB.center.y
        );
      }
    }
  }

  /**
   * Create a corridor between two points
   */
  _createCorridor(x1, y1, x2, y2) {
    // Simple L-shaped corridor
    const corridorWidth = this.config.corridorWidth || 1;
    const corridor = { startX: x1, startY: y1, endX: x2, endY: y2, width: corridorWidth };
    this.corridors.push(corridor);
    
    // Determine if we go horizontally first
    const horizontalFirst = this.random.next() > 0.5;
    
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

  /**
   * Get monster types appropriate for the current dungeon theme
   */
  getMonsterTypes() {
    const dungeonType = this.config.dungeonType;
    const theme = THEME_SETTINGS[dungeonType];
    
    if (!theme || !theme.monsters) {
      // Fallback to basic monsters if theme not found
      return [
        { name: "Goblin", challenge: 0.25, size: "Small" },
        { name: "Skeleton", challenge: 0.25, size: "Medium" },
        { name: "Zombie", challenge: 0.25, size: "Medium" },
        { name: "Orc", challenge: 0.5, size: "Medium" },
        { name: "Giant Rat", challenge: 0.125, size: "Small" }
      ];
    }
    
    return theme.monsters;
  }

  /**
   * Pick a monster appropriate for the level
   */
  pickMonsterByLevel(monsterTypes, level) {
    // Filter monsters that are appropriate for this level
    const appropriateMonsters = monsterTypes.filter(monster => {
      const challenge = monster.challenge || 1;
      // Allow monsters within +/- 2 levels of party level
      return challenge >= Math.max(0.125, level - 2) && 
             challenge <= level + 2;
    });
    
    // If no appropriate monsters, use any available
    if (appropriateMonsters.length === 0) {
      return this.random.select(monsterTypes);
    }
    
    return this.random.select(appropriateMonsters);
  }

  /**
   * Calculate monster HP based on type, level and boss status
   */
  calculateMonsterHP(monsterType, level, isBoss) {
    // Base HP formula
    let baseHP = 5 + (level * 5);
    
    // Add monster-specific modifiers
    if (monsterType.hpModifier) {
      baseHP += monsterType.hpModifier;
    }
    
    // Size modifiers
    const sizeMultipliers = {
      "Tiny": 0.5,
      "Small": 0.8,
      "Medium": 1.0,
      "Large": 1.5,
      "Huge": 2.0,
      "Gargantuan": 3.0
    };
    
    const sizeMultiplier = sizeMultipliers[monsterType.size || "Medium"] || 1.0;
    baseHP = Math.floor(baseHP * sizeMultiplier);
    
    // Boss monsters get more HP
    if (isBoss) {
      baseHP = Math.floor(baseHP * 2.5);
    }
    
    // Add some randomness
    const variance = Math.floor(baseHP * 0.2); // 20% variance
    baseHP += this.random.nextInt(-variance, variance + 1);
    
    return Math.max(1, baseHP);
  }

  /**
   * Calculate monster armor class based on type, level and boss status
   */
  calculateMonsterAC(monsterType, level, isBoss) {
    // Base AC formula (scales slightly with level)
    let baseAC = 10 + Math.floor(level / 3);
    
    // Add monster-specific modifiers
    if (monsterType.acModifier) {
      baseAC += monsterType.acModifier;
    }
    
    // Size modifiers (smaller = harder to hit)
    const sizeModifiers = {
      "Tiny": 2,
      "Small": 1,
      "Medium": 0,
      "Large": -1,
      "Huge": -2,
      "Gargantuan": -3
    };
    
    baseAC += sizeModifiers[monsterType.size || "Medium"] || 0;
    
    // Boss monsters get better AC
    if (isBoss) {
      baseAC += 2;
    }
    
    return Math.max(10, baseAC); // Minimum AC of 10
  }

  /**
   * Populate encounter with monsters from the bestiary
   */
  _populateWithBestiaryMonsters(rooms, entities, config, bestiary) {
    console.log('Populating with bestiary monsters');
    
    // Filter monsters by CR appropriate for the player level
    const minCR = Math.max(0, (config.playerLevel - 2) / 2);
    const maxCR = config.playerLevel + 1;
    
    const availableMonsters = bestiary.creatures.filter(monster => {
      const cr = monster.stats?.challengeRating || 0;
      return cr >= minCR && cr <= maxCR;
    });
    
    // Use generic monsters if no suitable monsters found
    if (availableMonsters.length === 0) {
      console.warn("No suitable monsters found in bestiary, using generic monsters");
      this._populateWithGenericMonsters(rooms, entities, config);
      return;
    }
    
    // Add regular monsters
    const monsterCount = config.includeBoss ? config.monsterCount - 1 : config.monsterCount;
    
    for (let i = 0; i < monsterCount; i++) {
      // Pick a random room
      const room = this.random.select(rooms);
      
      // Pick a random monster
      const monster = this.random.select(availableMonsters);
      
      // Convert size string to token size
      let tokenSize = 1;
      if (monster.stats && monster.stats.size) {
        switch (monster.stats.size) {
          case 'Tiny':
          case 'Small':
          case 'Medium':
            tokenSize = 1;
            break;
          case 'Large':
            tokenSize = 2;
            break;
          case 'Huge':
            tokenSize = 3;
            break;
          case 'Gargantuan':
            tokenSize = 4;
            break;
        }
      }
      
      // Find placement position
      let placed = false;
      let attempts = 0;
      const maxAttempts = 50;
      
      while (!placed && attempts < maxAttempts) {
        attempts++;
        
        // Place entity at a random position within the room, with margin for token size
        const margin = tokenSize - 1;
        const maxX = room.x + room.width - 1 - margin;
        const maxY = room.y + room.height - 1 - margin;
        
        if (maxX <= room.x || maxY <= room.y) {
          continue; // Room too small, skip this attempt
        }
        
        const x = this.random.nextInt(room.x + 1, maxX);
        const y = this.random.nextInt(room.y + 1, maxY);
        
        // Check if the area is clear
        let clear = true;
        for (let dy = 0; dy < tokenSize; dy++) {
          for (let dx = 0; dx < tokenSize; dx++) {
            const checkX = x + dx;
            const checkY = y + dy;
            
            // Check if position is occupied
            if (entities.some(entity => entity.x === checkX && entity.y === checkY)) {
              clear = false;
              break;
            }
          }
          if (!clear) break;
        }
        
        if (clear) {
          entities.push({
            type: 'monster',
            x, y,
            properties: {
              name: monster.name,
              level: config.playerLevel,
              challengeRating: monster.stats.challengeRating,
              hp: monster.stats.hitPoints,
              maxHP: monster.stats.hitPoints,
              ac: monster.stats.armorClass,
              size: monster.stats.size,
              tokenSize: tokenSize,
              isBoss: false,
              tokenImage: monster.flavor?.imageUrl,
              bestiaryId: monster._id,
              useActualToken: true
            }
          });
          placed = true;
        }
      }
    }
    
    // Add boss if requested
    if (config.includeBoss) {
      const room = rooms[0]; // Put boss in main room
      
      // Pick a boss monster (higher CR)
      const bossMonsters = bestiary.creatures.filter(monster => {
        const cr = monster.stats?.challengeRating || 0;
        return cr >= config.playerLevel && cr <= config.playerLevel + 2;
      });
      
      let bossMonster;
      if (bossMonsters.length > 0) {
        bossMonster = this.random.select(bossMonsters);
      } else if (availableMonsters.length > 0) {
        bossMonster = this.random.select(availableMonsters);
      } else {
        // Fallback to generic boss
        this._addGenericBoss(room, entities, config);
        return;
      }
      
      // Convert size string to token size
      let tokenSize = 2; // Default to Large for boss
      if (bossMonster.stats && bossMonster.stats.size) {
        switch (bossMonster.stats.size) {
          case 'Medium':
            tokenSize = 2; // Upgrade Medium bosses to Large
            break;
          case 'Large':
            tokenSize = 2;
            break;
          case 'Huge':
            tokenSize = 3;
            break;
          case 'Gargantuan':
            tokenSize = 4;
            break;
        }
      }
      
      // Place in center of room if possible
      const x = Math.floor(room.x + room.width / 2) - Math.floor(tokenSize / 2);
      const y = Math.floor(room.y + room.height / 2) - Math.floor(tokenSize / 2);
      
      // Check if position is clear
      let clear = true;
      for (let dy = 0; dy < tokenSize; dy++) {
        for (let dx = 0; dx < tokenSize; dx++) {
          const checkX = x + dx;
          const checkY = y + dy;
          
          // Check if position is occupied
          if (entities.some(entity => entity.x === checkX && entity.y === checkY)) {
            clear = false;
            break;
          }
        }
        if (!clear) break;
      }
      
      if (clear) {
        // Calculate scaled HP for boss (25-50% more than normal)
        const bossHpMultiplier = 1 + (this.random.next() * 0.25 + 0.25); // 1.25x to 1.5x
        const bossHp = Math.floor((bossMonster.stats?.hitPoints || 50) * bossHpMultiplier);
        
        entities.push({
          type: 'monster',
          x, y,
          properties: {
            name: bossMonster.name,
            level: config.playerLevel + 2,
            challengeRating: bossMonster.stats.challengeRating,
            hp: bossHp,
            maxHP: bossHp,
            ac: (bossMonster.stats?.armorClass || 15) + 2, // Boss has better AC
            size: bossMonster.stats.size,
            tokenSize: tokenSize,
            isBoss: true,
            tokenImage: bossMonster.flavor?.imageUrl,
            bestiaryId: bossMonster._id,
            useActualToken: true
          }
        });
      }
    }
  }
  
  /**
   * Add generic monsters when bestiary monsters are not available
   */
  _populateWithGenericMonsters(rooms, entities, config) {
    // ...existing code...
  }
  
  /**
   * Add a generic boss monster
   */
  _addGenericBoss(room, entities, config) {
    // ...existing code...
  }

  /**
   * Add special rooms like entrance and boss room
   * This is needed by the generate method
   */
  _addSpecialRooms() {
    if (this.rooms.length < 2) {
      console.warn('Not enough rooms to add special rooms');
      return;
    }
    
    // Entry room (usually the first room)
    this.specialRooms.entry = { ...this.rooms[0] };
    
    // Boss room (usually the last room or the farthest from entry)
    this.specialRooms.boss = { ...this.rooms[this.rooms.length - 1] };
    
    // Add doors between rooms and corridors - optional for basic functionality
    if (typeof this._addDoors === 'function') {
      this._addDoors();
    }
  }
  
  /**
   * Add doors between rooms and corridors
   * Optional method - will only be called if it exists
   */
  _addDoors() {
    // Simple door placement algorithm
    for (const room of this.rooms) {
      // Try each wall of the room
      const walls = [
        { x: room.x + Math.floor(room.width / 2), y: room.y }, // Top
        { x: room.x + Math.floor(room.width / 2), y: room.y + room.height - 1 }, // Bottom
        { x: room.x, y: room.y + Math.floor(room.height / 2) }, // Left
        { x: room.x + room.width - 1, y: room.y + Math.floor(room.height / 2) }  // Right
      ];
      
      for (const wall of walls) {
        // Check if this position has a corridor adjacent to it
        let hasCorridor = false;
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const nx = wall.x + dx;
            const ny = wall.y + dy;
            
            if (nx >= 0 && nx < this.config.width && 
                ny >= 0 && ny < this.config.height &&
                this.grid[ny][nx] === 2) { // 2 = corridor
              hasCorridor = true;
              break;
            }
          }
          if (hasCorridor) break;
        }
        
        // Add door if there's a corridor
        if (hasCorridor && this.random.next() < 0.5) {
          this.grid[wall.y][wall.x] = 3; // 3 = door
        }
      }
    }
  }
  
  /**
   * Populate the dungeon with entities
   * This is needed by the generate method
   */
  _populateDungeon() {
    // Add player start in entry room
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
    
    // Add some basic monsters
    for (const room of this.rooms) {
      // Skip entry room
      if (this.specialRooms.entry && 
          room.x === this.specialRooms.entry.x && 
          room.y === this.specialRooms.entry.y) {
        continue;
      }
      
      // Skip boss room
      if (this.specialRooms.boss && 
          room.x === this.specialRooms.boss.x && 
          room.y === this.specialRooms.boss.y) {
        continue;
      }
      
      // 40% chance for a monster in each normal room
      if (this.random.next() < 0.4) {
        const x = room.x + Math.floor(room.width / 2);
        const y = room.y + Math.floor(room.height / 2);
        
        this.entities.push({
          type: 'monster',
          x, y,
          properties: {
            name: 'Monster',
            hp: 10,
            maxHP: 10,
            ac: 12,
            level: this.config.partyLevel
          }
        });
      }
    }
    
    // Add boss in boss room
    if (this.specialRooms.boss) {
      const boss = this.specialRooms.boss;
      const x = boss.x + Math.floor(boss.width / 2);
      const y = boss.y + Math.floor(boss.height / 2);
      
      this.entities.push({
        type: 'monster',
        x, y,
        properties: {
          name: 'Boss',
          hp: 50,
          maxHP: 50,
          ac: 15,
          level: this.config.partyLevel + 2,
          isBoss: true
        }
      });
    }
    
    // Add exit stairs
    if (this.rooms.length > 1) {
      const exitRoom = this.rooms[Math.floor(this.rooms.length / 2)];
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
}

export default DungeonGenerator;