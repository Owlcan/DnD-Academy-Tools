// Constants for the dungeon generator module

// Dungeon types
export const DUNGEON_TYPES = {
  DARKLING_HIVE: 'DARKLING_HIVE',
  TEMPLE_RUINS: 'TEMPLE_RUINS',
  NECROMANCER_LAIR: 'NECROMANCER_LAIR',
  DRAGON_DEN: 'DRAGON_DEN',
  ELEMENTAL_CAVERN: 'ELEMENTAL_CAVERN',
  GOBLIN_WARREN: 'GOBLIN_WARREN',
  UNDERDARK_OUTPOST: 'UNDERDARK_OUTPOST',
  WIZARD_TOWER: 'WIZARD_TOWER'
};

// Visual and gameplay settings for each dungeon type
export const THEME_SETTINGS = {
  // Dark, maze-like hive of insectoid creatures
  [DUNGEON_TYPES.DARKLING_HIVE]: {
    name: 'Darkling Hive',
    colors: {
      wall: '#333',
      floor: '#ddd',
      corridor: '#ccc',
      door: '#855E42',
      stairs: '#855E42',
      room: {
        standard: '#ddd',
        entry: '#aaffaa',
        exit: '#ffaaaa',
        boss: '#ffccaa',
        treasure: '#ffffaa'
      }
    },
    // Gameplay settings
    population: {
      minMonsters: 4,
      maxMonsters: 10,
      minTreasure: 1,
      maxTreasure: 4,
      minTraps: 1,
      maxTraps: 3
    },
    // Special feature: darkness increases with depth
    darkness: true
  },
  
  // Ancient temple in ruins, with religious motifs
  [DUNGEON_TYPES.TEMPLE_RUINS]: {
    name: 'Temple Ruins',
    colors: {
      wall: '#7E735F',
      floor: '#d1c7a3',
      corridor: '#c1b793',
      door: '#8B4513',
      stairs: '#8B4513',
      room: {
        standard: '#d1c7a3',
        entry: '#b8e0b8',
        exit: '#e0b8b8',
        boss: '#e0c8b8',
        treasure: '#e0e0b8'
      }
    },
    // Gameplay settings
    population: {
      minMonsters: 3,
      maxMonsters: 8,
      minTreasure: 2,
      maxTreasure: 5,
      minTraps: 2,
      maxTraps: 6
    },
    // Special feature: more traps
    darkness: false
  },
  
  // Lair of a necromancer with undead minions
  [DUNGEON_TYPES.NECROMANCER_LAIR]: {
    name: 'Necromancer\'s Lair',
    colors: {
      wall: '#444',
      floor: '#aaa',
      corridor: '#999',
      door: '#555',
      stairs: '#555',
      room: {
        standard: '#aaa',
        entry: '#ccffcc',
        exit: '#ffcccc',
        boss: '#ffddcc',
        treasure: '#ffffcc'
      }
    },
    // Gameplay settings
    population: {
      minMonsters: 5,
      maxMonsters: 12,
      minTreasure: 1,
      maxTreasure: 3,
      minTraps: 1,
      maxTraps: 4
    },
    // Special feature: undead themed
    darkness: true
  },
  
  // Dragon's lair with treasure hoard
  [DUNGEON_TYPES.DRAGON_DEN]: {
    name: 'Dragon\'s Den',
    colors: {
      wall: '#6d5a50',
      floor: '#c0b090',
      corridor: '#b0a080',
      door: '#8B4513',
      stairs: '#8B4513',
      room: {
        standard: '#c0b090',
        entry: '#b8e0b8',
        exit: '#e0b8b8',
        boss: '#e0c8b8',
        treasure: '#fff8a0'
      }
    },
    // Gameplay settings
    population: {
      minMonsters: 2,
      maxMonsters: 6,
      minTreasure: 3,
      maxTreasure: 8,
      minTraps: 0,
      maxTraps: 2
    },
    // Special feature: more treasure
    darkness: false
  },
  
  // Elemental-themed cavern
  [DUNGEON_TYPES.ELEMENTAL_CAVERN]: {
    name: 'Elemental Cavern',
    colors: {
      wall: '#4a6fa5',
      floor: '#a0c0e0',
      corridor: '#90b0d0',
      door: '#5a7fb5',
      stairs: '#5a7fb5',
      room: {
        standard: '#a0c0e0',
        entry: '#a0e0c0',
        exit: '#e0a0c0',
        boss: '#e0c0a0',
        treasure: '#e0e0a0'
      }
    },
    // Gameplay settings
    population: {
      minMonsters: 3,
      maxMonsters: 8,
      minTreasure: 2,
      maxTreasure: 4,
      minTraps: 2,
      maxTraps: 4
    },
    // Special feature: elemental themed
    darkness: false
  },
  
  // Goblin warren - chaotic and messy
  [DUNGEON_TYPES.GOBLIN_WARREN]: {
    name: 'Goblin Warren',
    colors: {
      wall: '#5d4037',
      floor: '#a1887f',
      corridor: '#8d6e63',
      door: '#4e342e',
      stairs: '#4e342e',
      room: {
        standard: '#a1887f',
        entry: '#c5e1a5',
        exit: '#ef9a9a',
        boss: '#ffcc80',
        treasure: '#fff59d'
      }
    },
    // Gameplay settings
    population: {
      minMonsters: 6,
      maxMonsters: 15,
      minTreasure: 2,
      maxTreasure: 5,
      minTraps: 2,
      maxTraps: 4
    },
    // Special feature: more monsters
    darkness: true
  },
  
  // Underdark outpost - drow or mind flayer themed
  [DUNGEON_TYPES.UNDERDARK_OUTPOST]: {
    name: 'Underdark Outpost',
    colors: {
      wall: '#3e2723',
      floor: '#6d4c41',
      corridor: '#5d4037',
      door: '#4e342e',
      stairs: '#4e342e',
      room: {
        standard: '#6d4c41',
        entry: '#a5d6a7',
        exit: '#ef9a9a',
        boss: '#ffcc80',
        treasure: '#fff59d'
      }
    },
    // Gameplay settings
    population: {
      minMonsters: 4,
      maxMonsters: 10,
      minTreasure: 2,
      maxTreasure: 4,
      minTraps: 3,
      maxTraps: 7
    },
    // Special feature: complete darkness
    darkness: true
  },
  
  // Wizard's tower - more vertical, with magical elements
  [DUNGEON_TYPES.WIZARD_TOWER]: {
    name: 'Wizard\'s Tower',
    colors: {
      wall: '#4a148c',
      floor: '#7b1fa2',
      corridor: '#6a1b9a',
      door: '#4a148c',
      stairs: '#4a148c',
      room: {
        standard: '#7b1fa2',
        entry: '#a5d6a7',
        exit: '#ef9a9a',
        boss: '#ffcc80',
        treasure: '#fff59d'
      }
    },
    // Gameplay settings
    population: {
      minMonsters: 3,
      maxMonsters: 7,
      minTreasure: 3,
      maxTreasure: 6,
      minTraps: 2,
      maxTraps: 5
    },
    // Special feature: magical elements
    darkness: false
  }
};

// Cell types for the grid
export const CELL_TYPES = {
  WALL: 0,
  FLOOR: 1,
  CORRIDOR: 2,
  DOOR: 3,
  STAIRS_UP: 4,
  STAIRS_DOWN: 5
};

// Entity types
export const ENTITY_TYPES = {
  MONSTER: 'monster',
  TREASURE: 'treasure',
  TRAP: 'trap',
  PLAYER_START: 'player_start',
  STAIRS: 'stairs'
};

// Difficulty constants
export const DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  DEADLY: 'deadly',
  BOSS: 'boss'
};

// Monster faction types
export const MONSTER_FACTIONS = {
  UNDEAD: 'undead',
  HUMANOID: 'humanoid',
  ABERRATION: 'aberration',
  ELEMENTAL: 'elemental',
  CONSTRUCT: 'construct',
  BEAST: 'beast',
  MONSTROSITY: 'monstrosity',
  PLANT: 'plant',
  DRAGON: 'dragon',
  FIEND: 'fiend',
  CELESTIAL: 'celestial',
  FEY: 'fey',
  GIANT: 'giant',
  OOZE: 'ooze'
};

// Trap types
export const TRAP_TYPES = {
  PIT: 'pit',
  DART: 'dart',
  POISON: 'poison',
  FIRE: 'fire',
  LIGHTNING: 'lightning',
  FROST: 'frost',
  ACID: 'acid',
  MAGICAL: 'magical',
  CRUSHING: 'crushing',
  SPIKE: 'spike'
};

// Treasure types
export const TREASURE_TYPES = {
  COINS: 'coins',
  GEMS: 'gems',
  MAGIC_ITEM: 'magic_item',
  CHEST: 'chest',
  HOARD: 'hoard'
};

// Room types
export const ROOM_TYPES = {
  STANDARD: 'standard',
  ENTRY: 'entry',
  EXIT: 'exit',
  BOSS: 'boss',
  TREASURE: 'treasure',
  LIBRARY: 'library',
  ARMORY: 'armory',
  LABORATORY: 'laboratory',
  SHRINE: 'shrine',
  PRISON: 'prison',
  BARRACKS: 'barracks',
  KITCHEN: 'kitchen',
  STORAGE: 'storage'
};

// Default dungeon generator configuration
export const DEFAULT_CONFIG = {
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
  partySize: 4
};