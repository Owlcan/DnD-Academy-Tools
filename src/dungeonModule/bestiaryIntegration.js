/**
 * Integrates monster data from the bestiary into the dungeon generator
 */
import { BESTIARY } from './data/bestiary/index';
import { ENTITY_TYPES } from './constants';

// The bestiary data is in a format where the first element contains a creatures array
const ALL_MONSTERS = BESTIARY[0]?.creatures || [];

// Log the number of monsters loaded for debugging
console.log(`Loaded ${ALL_MONSTERS.length} monsters from bestiary`);

// Debug first few monsters to verify structure
if (ALL_MONSTERS.length > 0) {
  console.log('First 3 monsters:', ALL_MONSTERS.slice(0, 3).map(m => m.name));
}

// Get monsters by size and type
export function getMonstersBySize(size) {
  return ALL_MONSTERS.filter(monster => monster.size?.includes?.(size));
}

export function getMonstersByType(type) {
  return ALL_MONSTERS.filter(monster => monster.type === type);
}

export function getMonstersBySizeAndType(size, type) {
  return ALL_MONSTERS.filter(monster => 
    monster.size?.includes?.(size) && monster.type === type
  );
}

// Get a random monster based on criteria
export function getRandomMonster(size = null, type = null) {
  let filteredMonsters = ALL_MONSTERS;
  
  if (size && type) {
    filteredMonsters = getMonstersBySizeAndType(size, type);
  } else if (size) {
    filteredMonsters = getMonstersBySize(size);
  } else if (type) {
    filteredMonsters = getMonstersByType(type);
  }
  
  if (filteredMonsters.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * filteredMonsters.length);
  return filteredMonsters[randomIndex];
}

// Function to get monster by name
export function getMonsterByName(name) {
  return ALL_MONSTERS.find(monster => monster.name === name);
}

// Function to get darkling monster by name - specifically for darkling monsters
export function getDarklingByName(name) {
  return ALL_MONSTERS.find(monster => 
    monster.name === name && 
    (monster.type === 'darkling' || 
     monster.name.toLowerCase().includes('darkling') || 
     monster.name.toLowerCase().includes('darkforme'))
  );
}

// Convert a monster from the bestiary into an entity for the dungeon
export function monsterToEntity(monster, position) {
  if (!monster) {
    console.error('Cannot create entity: Monster is null or undefined');
    return null;
  }

  // Extract x and y from position if it's an object, otherwise use directly
  const x = position?.x !== undefined ? position.x : (Array.isArray(position) ? position[0] : 0);
  const y = position?.y !== undefined ? position.y : (Array.isArray(position) ? position[1] : 0);
  
  // Calculate token size from monster size or use explicit tokenSize if defined
  let tokenSize = monster.tokenSize || 1;
  if (!monster.tokenSize && monster.size && Array.isArray(monster.size)) {
    const sizeCode = monster.size[0];
    if (sizeCode === 'G') tokenSize = 4;      // Gargantuan
    else if (sizeCode === 'H') tokenSize = 3; // Huge
    else if (sizeCode === 'L') tokenSize = 2; // Large
    else tokenSize = 1;                       // Medium or smaller
  }
  
  // Use the monster's existing stats structure
  const monsterStats = monster.stats || {};
  
  // Extract useful stats for display and mechanics
  const hp = monsterStats.hitPoints || 10;
  const ac = monsterStats.armorClass || 10;
  const attackBonus = monsterStats.attacks?.[0]?.toHit || 
                    (monsterStats.attacks?.[0]?.description?.match(/\+(\d+) to hit/)?.[1] || 0);
  
  // Create a properly formatted monster entity
  console.log(`Converting monster ${monster.name} to entity at (${x},${y}) with size ${tokenSize}`);
  
  return {
    id: `monster_${Math.random().toString(36).substr(2, 9)}`,
    type: ENTITY_TYPES.MONSTER,
    name: monster.name,
    x: x,
    y: y,
    size: tokenSize,
    properties: {
      // Basic display properties
      name: monster.name,
      symbol: monster.name?.charAt(0) || 'M',
      
      // Combat stats
      hp: hp,
      maxHp: hp,
      ac: ac,
      attackBonus: parseInt(attackBonus) || 0,
      damageBonus: 0,
      
      // Size and type
      size: monsterStats.size || "medium",
      tokenSize: tokenSize,
      type: monster.type || "unknown",
      
      // Original data
      monsterData: monster,
      
      // Monster abilities and attacks
      stats: monsterStats,
      abilities: monsterStats.abilities || [],
      attacks: monsterStats.attacks || [],
      
      // Additional display info
      challengeRating: monsterStats.challengeRating || "?",
      strength: monsterStats.str,
      dexterity: monsterStats.dex,
      constitution: monsterStats.con,
      intelligence: monsterStats.int,
      wisdom: monsterStats.wis,
      charisma: monsterStats.cha,
      
      // Interactive properties
      isInteractive: true
    }
  };
}