import { CELL_TYPES } from '../dungeonModule/constants';

/**
 * Encounter Generator for D&D Academy Tools
 * Creates single room encounters with monsters from the bestiary
 * Supports both single-player and group encounters
 */
class EncounterGenerator {
  /**
   * Create a new EncounterGenerator
   * @param {Object} bestiary - The bestiary containing monster definitions
   * @param {Object} options - Configuration options
   */
  constructor(bestiary, options = {}) {
    this.bestiary = bestiary;
    this.random = this._createRandomGenerator(options.seed);
    this.config = {
      minLevel: 4,
      maxLevel: 6,
      ...options
    };
  }

  /**
   * Creates a seeded random number generator
   * @param {number} seed - Seed for random number generation
   * @returns {Object} Random number generator object
   */
  _createRandomGenerator(seed) {
    // Simple seeded random implementation
    const actualSeed = seed || Math.floor(Math.random() * 1000000);
    
    return {
      seed: actualSeed,
      next() {
        // Mulberry32 algorithm
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      },
      nextInt(min, max) {
        return Math.floor(this.next() * (max - min)) + min;
      },
      select(array) {
        return array[Math.floor(this.next() * array.length)];
      }
    };
  }

  /**
   * Generate a single player encounter (smaller area, fewer monsters)
   * @param {Object} options - Configuration options
   * @returns {Object} Encounter data for rendering
   */
  generateSinglePlayerEncounter(options = {}) {
    return this.generateEncounter({
      width: 15,
      height: 15,
      roomCount: 1,
      monsterCount: this.random.nextInt(1, 3), // 1-2 monsters for single player
      includeBoss: this.random.next() < 0.3, // 30% chance of boss
      ...options
    });
  }

  /**
   * Generate a group encounter (larger area, more monsters)
   * @param {Object} options - Configuration options
   * @returns {Object} Encounter data for rendering
   */
  generateGroupEncounter(options = {}) {
    return this.generateEncounter({
      width: 20,
      height: 20,
      roomCount: this.random.next() < 0.5 ? 1 : 2, // 50% chance of 1 or 2 rooms
      monsterCount: this.random.nextInt(3, 7), // 3-6 monsters for groups
      includeBoss: this.random.next() < 0.4, // 40% chance of boss
      ...options
    });
  }

  /**
   * Generates a standalone encounter map with monsters
   * @param {Object} options - Configuration options
   * @returns {Object} Map data that can be rendered on the main game board
   */
  generateEncounter(options = {}) {
    // Default options
    const defaultOptions = {
      width: 15,
      height: 15,
      roomCount: 1,
      monsterCount: 3,
      playerLevel: this.random.nextInt(this.config.minLevel, this.config.maxLevel + 1),
      includeBoss: false
    };

    const config = { ...defaultOptions, ...options };
    
    // Create a grid for the encounter
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
        this._createCorridor(room1.center.x, room1.center.y, room2.center.x, room2.center.y, grid, corridors);
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
    
    // Add monsters
    this._populateWithMonsters(rooms, entities, config);
    
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
   * Create a corridor between two points
   */
  _createCorridor(x1, y1, x2, y2, grid, corridors) {
    // Simple L-shaped corridor
    const corridor = { startX: x1, startY: y1, endX: x2, endY: y2, width: 1 };
    corridors.push(corridor);
    
    // Determine if we go horizontally first
    const horizontalFirst = this.random.next() > 0.5;
    
    if (horizontalFirst) {
      // Horizontal segment
      this._drawLine(x1, y1, x2, y1, 1, 1, grid);
      
      // Vertical segment
      this._drawLine(x2, y1, x2, y2, 1, 1, grid);
    } else {
      // Vertical segment
      this._drawLine(x1, y1, x1, y2, 1, 1, grid);
      
      // Horizontal segment
      this._drawLine(x1, y2, x2, y2, 1, 1, grid);
    }
  }

  /**
   * Draw a line on the grid (for corridors)
   */
  _drawLine(x1, y1, x2, y2, value, width, grid) {
    // Ensure coordinates are in bounds
    x1 = Math.max(1, Math.min(grid[0].length - 2, x1));
    y1 = Math.max(1, Math.min(grid.length - 2, y1));
    x2 = Math.max(1, Math.min(grid[0].length - 2, x2));
    y2 = Math.max(1, Math.min(grid.length - 2, y2));
    
    // Get the half-width (how many cells to each side)
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
   * Populate the encounter with monsters from the bestiary
   */
  _populateWithMonsters(rooms, entities, config) {
    // If no bestiary creatures, use placeholder monsters
    if (!this.bestiary || !this.bestiary.creatures || this.bestiary.creatures.length === 0) {
      console.warn("No bestiary found, using generic monsters");
      this._populateWithGenericMonsters(rooms, entities, config);
      return;
    }
    
    // Filter monsters by CR appropriate for the player level
    const minCR = Math.max(0, (config.playerLevel - 2) / 2);
    const maxCR = config.playerLevel + 1;
    
    const availableMonsters = this.bestiary.creatures.filter(monster => {
      const cr = monster.stats.challengeRating || 0;
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
      switch (monster.stats.size) {
        case 'Tiny':
          tokenSize = 1;
          break;
        case 'Small':
          tokenSize = 1;
          break;
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
              tokenImage: monster.flavor.imageUrl,
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
      const bossMonsters = this.bestiary.creatures.filter(monster => {
        const cr = monster.stats.challengeRating || 0;
        return cr >= config.playerLevel && cr <= config.playerLevel + 2;
      });
      
      let bossMonster;
      if (bossMonsters.length > 0) {
        bossMonster = this.random.select(bossMonsters);
      } else if (availableMonsters.length > 0) {
        bossMonster = this.random.select(availableMonsters);
      } else {
        // Fallback to generic boss
        return this._addGenericBoss(room, entities, config);
      }
      
      // Convert size string to token size
      let tokenSize = 2; // Default to Large for boss
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
        const bossHp = Math.floor(bossMonster.stats.hitPoints * bossHpMultiplier);
        
        entities.push({
          type: 'monster',
          x, y,
          properties: {
            name: bossMonster.name,
            level: config.playerLevel + 2,
            challengeRating: bossMonster.stats.challengeRating,
            hp: bossHp,
            maxHP: bossHp,
            ac: bossMonster.stats.armorClass + 2, // Boss has better AC
            size: bossMonster.stats.size,
            tokenSize: tokenSize,
            isBoss: true,
            tokenImage: bossMonster.flavor.imageUrl,
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
    // Add regular monsters
    const monsterCount = config.includeBoss ? config.monsterCount - 1 : config.monsterCount;
    
    const monsterTypes = [
      { name: "Darkling-Lurker", cr: 0.5, size: "Small", hp: 4, ac: 13 },
      { name: "Darkling-Slurper", cr: 0.5, size: "Small", hp: 4, ac: 10 },
      { name: "Darkling-Caller", cr: 0.25, size: "Small", hp: 5, ac: 11 },
      { name: "Darkforme Overwatch", cr: 2, size: "Medium", hp: 22, ac: 14 },
      { name: "Darkling-Bellowbelly", cr: 1, size: "Medium", hp: 26, ac: 13 },
      { name: "Darkforme-Shade-Sneak", cr: 0.5, size: "Small", hp: 13, ac: 13 }
    ];
    
    for (let i = 0; i < monsterCount; i++) {
      // Pick a random room
      const room = this.random.select(rooms);
      
      // Pick a random monster type
      const monsterType = this.random.select(monsterTypes);
      
      // Convert size string to token size
      let tokenSize = 1;
      if (monsterType.size === "Medium") tokenSize = 1;
      if (monsterType.size === "Large") tokenSize = 2;
      if (monsterType.size === "Huge") tokenSize = 3;
      
      // Find placement position
      let placed = false;
      let attempts = 0;
      const maxAttempts = 50;
      
      while (!placed && attempts < maxAttempts) {
        attempts++;
        
        // Place entity at a random position within the room
        const x = this.random.nextInt(room.x + 1, room.x + room.width - tokenSize);
        const y = this.random.nextInt(room.y + 1, room.y + room.height - tokenSize);
        
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
              name: monsterType.name,
              level: config.playerLevel,
              challengeRating: monsterType.cr,
              hp: monsterType.hp,
              maxHP: monsterType.hp,
              ac: monsterType.ac,
              size: monsterType.size,
              tokenSize: tokenSize,
              isBoss: false,
              useActualToken: true
            }
          });
          placed = true;
        }
      }
    }
    
    // Add boss if requested
    if (config.includeBoss) {
      this._addGenericBoss(rooms[0], entities, config);
    }
  }
  
  /**
   * Add a generic boss monster
   */
  _addGenericBoss(room, entities, config) {
    const bossTypes = [
      { name: "Darkforme-Cavesweller", cr: 3, size: "Large", hp: 136, ac: 15 },
      { name: "Darkform Enforcer", cr: 5, size: "Large", hp: 102, ac: 16 },
      { name: "The Darkformless", cr: 4, size: "Medium", hp: 39, ac: 15 },
      { name: "Darkforme-Ossuarian", cr: 7, size: "Huge", hp: 142, ac: 17 }
    ];
    
    const bossType = this.random.select(bossTypes);
    
    // Convert size string to token size
    let tokenSize;
    if (bossType.size === "Medium") tokenSize = 2; // Upgrade to Large
    if (bossType.size === "Large") tokenSize = 2;
    if (bossType.size === "Huge") tokenSize = 3;
    if (bossType.size === "Gargantuan") tokenSize = 4;
    
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
      entities.push({
        type: 'monster',
        x, y,
        properties: {
          name: bossType.name,
          level: config.playerLevel + 2,
          challengeRating: bossType.cr,
          hp: bossType.hp,
          maxHP: bossType.hp,
          ac: bossType.ac,
          size: bossType.size,
          tokenSize: tokenSize,
          isBoss: true,
          useActualToken: true
        }
      });
    }
  }

  /**
   * Create a custom encounter with specific parameters
   * @param {Object} options - Custom encounter configuration
   * @returns {Object} Encounter data for rendering
   */
  createCustomEncounter(options = {}) {
    // Default options merged with provided options
    const config = {
      width: 20,
      height: 20,
      roomCount: 1,
      monsterCount: 4,
      playerLevel: this.random.nextInt(this.config.minLevel, this.config.maxLevel + 1),
      includeBoss: this.random.next() < 0.3,
      ...options
    };
    
    return this.generateEncounter(config);
  }

  /**
   * Clear all generated encounters
   * @returns {Object} Empty grid data
   */
  clearEncounters() {
    return {
      grid: [],
      rooms: [],
      entities: [],
      corridors: [],
      width: 0,
      height: 0,
      isEncounterMap: false,
      cleared: true
    };
  }
}

export default EncounterGenerator;
