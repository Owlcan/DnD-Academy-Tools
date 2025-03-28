import { getAllDarklings, getDarklingByName } from './bestiaryIntegration';

/**
 * Roll a die with the specified number of sides
 * @param {number} sides - Number of sides on the die
 * @returns {number} - The result of the roll
 */
export const rollDie = (sides) => {
  return Math.floor(Math.random() * sides) + 1;
};

/**
 * Roll multiple dice with the specified number of sides
 * @param {number} count - Number of dice to roll
 * @param {number} sides - Number of sides on each die
 * @returns {Array<number>} - The results of each roll
 */
export const rollDice = (count, sides) => {
  const results = [];
  for (let i = 0; i < count; i++) {
    results.push(rollDie(sides));
  }
  return results;
};

/**
 * Sum the results of rolling multiple dice
 * @param {number} count - Number of dice to roll
 * @param {number} sides - Number of sides on each die
 * @returns {number} - The sum of the dice rolls
 */
export const rollDiceSum = (count, sides) => {
  return rollDice(count, sides).reduce((sum, roll) => sum + roll, 0);
};

/**
 * Parse a dice notation string (e.g. "2d6+3")
 * @param {string} notation - The dice notation to parse
 * @returns {Object} - An object with count, sides, and modifier
 */
export const parseDiceNotation = (notation) => {
  const regex = /(\d+)d(\d+)(?:\s*([+-])\s*(\d+))?/i;
  const match = notation.match(regex);
  
  if (!match) {
    console.warn(`Invalid dice notation: ${notation}`);
    return { count: 1, sides: 6, modifier: 0 };
  }
  
  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  let modifier = 0;
  
  if (match[3] && match[4]) {
    modifier = parseInt(match[4]) * (match[3] === '+' ? 1 : -1);
  }
  
  return { count, sides, modifier };
};

/**
 * Roll dice based on a dice notation string
 * @param {string} notation - The dice notation to roll
 * @returns {number} - The result of the roll
 */
export const rollDiceNotation = (notation) => {
  const { count, sides, modifier } = parseDiceNotation(notation);
  return rollDiceSum(count, sides) + modifier;
};

/**
 * Calculate a modifier based on an ability score
 * @param {number} score - The ability score
 * @returns {number} - The modifier for the score
 */
export const getAbilityModifier = (score) => {
  return Math.floor((score - 10) / 2);
};

/**
 * Roll initiative for an entity
 * @param {Object} entity - The entity to roll initiative for
 * @returns {number} - The initiative roll
 */
export const rollInitiative = (entity) => {
  // Get the dexterity modifier for the entity
  let dexMod = 0;
  
  if (entity.type === 'player') {
    dexMod = entity.properties?.dexMod || 0;
  } else if (entity.type === 'monster') {
    // For monsters, try to get dex mod from the bestiary
    const creatureName = entity.properties?.name;
    if (creatureName) {
      const creatureData = getDarklingByName(creatureName);
      if (creatureData && creatureData.stats && creatureData.stats.abilityScoreModifiers) {
        dexMod = creatureData.stats.abilityScoreModifiers.dexterity || 0;
      } else {
        // Fall back to properties if bestiary data not available
        dexMod = entity.properties?.dexMod || 0;
      }
    }
  }
  
  // Roll d20 + dex modifier
  return rollDie(20) + dexMod;
};

/**
 * Calculate a monster's attack roll
 * @param {Object} monster - The monster entity
 * @param {Object} attack - The attack data
 * @returns {number} - The attack roll result
 */
export const calculateMonsterAttackRoll = (monster, attack) => {
  // Parse the attack bonus from the attack description if not explicitly provided
  let attackBonus = attack.attackBonus;
  
  if (!attackBonus && attack.description) {
    // Try to extract attack bonus from description like "+5 to hit"
    const bonusMatch = attack.description.match(/([+-]\d+)\s+to\s+hit/i);
    if (bonusMatch && bonusMatch[1]) {
      attackBonus = parseInt(bonusMatch[1]);
    }
  }
  
  // Default to +0 if we still don't have a bonus
  attackBonus = attackBonus || 0;
  
  // Roll d20 + attack bonus
  return rollDie(20) + attackBonus;
};

/**
 * Calculate damage for a monster attack
 * @param {Object} monster - The monster entity
 * @param {Object} attack - The attack data
 * @returns {number} - The damage roll result
 */
export const calculateMonsterDamage = (monster, attack) => {
  // Parse damage dice from description if not explicitly provided
  let damageDice = attack.damageDice;
  
  if (!damageDice && attack.description) {
    // Try to extract damage dice from description like "Hit: 7 (1d8 + 3) piercing damage"
    const damageMatch = attack.description.match(/Hit:\s+\d+\s+\(([^)]+)\)/i);
    if (damageMatch && damageMatch[1]) {
      damageDice = damageMatch[1];
    }
  }
  
  // Default damage if we still don't have dice
  if (!damageDice) {
    return rollDie(4) + 1; // Default to 1d4+1
  }
  
  // Roll the damage dice
  return rollDiceNotation(damageDice);
};

/**
 * Get attacks for a monster entity
 * @param {Object} monster - The monster entity
 * @returns {Array} - Array of attack objects
 */
export const getMonsterAttacks = (monster) => {
  // Try to get attacks from the bestiary
  const creatureName = monster.properties?.name;
  if (creatureName) {
    const creatureData = getDarklingByName(creatureName);
    
    if (creatureData && creatureData.stats && creatureData.stats.actions) {
      // Process actions to determine which ones are attacks
      return creatureData.stats.actions.map(action => {
        // Try to extract attack info from action description
        let attackBonus = 0;
        let damageDice = '';
        
        // Check if this action is an attack (contains "to hit" and "Hit:")
        if (action.description.includes('to hit') && action.description.includes('Hit:')) {
          // Extract attack bonus
          const bonusMatch = action.description.match(/([+-]\d+)\s+to\s+hit/i);
          if (bonusMatch && bonusMatch[1]) {
            attackBonus = parseInt(bonusMatch[1]);
          }
          
          // Extract damage dice
          const damageMatch = action.description.match(/Hit:\s+\d+\s+\(([^)]+)\)/i);
          if (damageMatch && damageMatch[1]) {
            damageDice = damageMatch[1];
          }
          
          // Determine attack type from description
          let attackType = 'melee';
          if (action.description.toLowerCase().includes('ranged')) {
            attackType = 'ranged';
          }
          
          return {
            name: action.name,
            description: action.description,
            attackBonus,
            damageDice,
            attackType,
            isAttack: true
          };
        }
        
        // For non-attack actions, just return basic info
        return {
          name: action.name,
          description: action.description,
          isAttack: false
        };
      });
    }
  }
  
  // Default attacks if bestiary data not available
  return [
    {
      name: 'Claws',
      description: 'Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) slashing damage.',
      attackBonus: 3,
      damageDice: '1d6+3',
      attackType: 'melee',
      isAttack: true
    },
    {
      name: 'Bite',
      description: 'Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 5 (1d4 + 3) piercing damage.',
      attackBonus: 3,
      damageDice: '1d4+3',
      attackType: 'melee',
      isAttack: true
    }
  ];
};

/**
 * Check if an entity can move to a specific position in the dungeon
 * @param {Object} entity - The entity to move
 * @param {number} x - The target x position
 * @param {number} y - The target y position
 * @param {Object} dungeon - The dungeon data
 * @param {Array} entities - All entities in the dungeon
 * @returns {boolean} - Whether the entity can move to the position
 */
export const canMoveTo = (entity, x, y, dungeon, entities) => {
  // Check if coordinates are within bounds
  if (!dungeon || !dungeon.grid || y < 0 || y >= dungeon.grid.length || 
      x < 0 || x >= dungeon.grid[y].length) {
    return false;
  }
  
  // Check if the cell is a floor or corridor (1 or 2), or door (3)
  const cell = dungeon.grid[y][x];
  if (![1, 2, 3].includes(cell)) {
    return false;
  }
  
  // Check if there's another entity at this position
  const entityAtPosition = entities.find(e => e.x === x && e.y === y);
  if (entityAtPosition) {
    return false;
  }
  
  return true;
};

/**
 * Find valid move targets within a certain range of an entity
 * @param {Object} entity - The entity to check moves for
 * @param {number} range - The movement range
 * @param {Object} dungeon - The dungeon data
 * @param {Array} entities - All entities in the dungeon
 * @returns {Array} - Array of valid move positions {x, y}
 */
export const findValidMoves = (entity, range, dungeon, entities) => {
  const validMoves = [];
  const visited = new Set();
  const queue = [{ x: entity.x, y: entity.y, distance: 0 }];
  
  // Simple BFS to find valid moves within range
  while (queue.length > 0) {
    const current = queue.shift();
    
    // Skip if we've already visited this cell or if we're beyond our range
    const key = `${current.x},${current.y}`;
    if (visited.has(key) || current.distance > range) {
      continue;
    }
    
    visited.add(key);
    
    // Add valid moves to our result (excluding the starting position)
    if (current.distance > 0) {
      validMoves.push({ x: current.x, y: current.y });
    }
    
    // Check adjacent cells
    const directions = [
      { dx: 0, dy: -1 }, // Up
      { dx: 1, dy: 0 },  // Right
      { dx: 0, dy: 1 },  // Down
      { dx: -1, dy: 0 }, // Left
    ];
    
    for (const dir of directions) {
      const newX = current.x + dir.dx;
      const newY = current.y + dir.dy;
      
      if (canMoveTo(entity, newX, newY, dungeon, entities)) {
        queue.push({
          x: newX,
          y: newY,
          distance: current.distance + 1
        });
      }
    }
  }
  
  return validMoves;
};

/**
 * Find targets that a monster can attack from its current position
 * @param {Object} monster - The monster entity
 * @param {Object} dungeon - The dungeon data
 * @param {Array} players - Array of player entities
 * @returns {Array} - Array of valid targets {entity, distance}
 */
export const findAttackTargets = (monster, dungeon, players) => {
  const targets = [];
  
  // Get the monster's attacks
  const attacks = getMonsterAttacks(monster);
  
  // Find the maximum reach among all attacks
  let maxReach = 5; // Default melee reach in feet
  
  attacks.forEach(attack => {
    if (attack.isAttack) {
      // Try to extract reach from description
      const reachMatch = attack.description.match(/reach\s+(\d+)\s+ft\./i);
      if (reachMatch && reachMatch[1]) {
        const reach = parseInt(reachMatch[1]);
        maxReach = Math.max(maxReach, reach);
      }
      
      // For ranged attacks, check for range
      const rangeMatch = attack.description.match(/range\s+(\d+)\s+ft\./i);
      if (rangeMatch && rangeMatch[1]) {
        const range = parseInt(rangeMatch[1]);
        maxReach = Math.max(maxReach, range);
      }
    }
  });
  
  // Convert reach in feet to grid cells (assuming 5ft per cell)
  const reachInCells = Math.ceil(maxReach / 5);
  
  // Check each player to see if they're within reach
  players.forEach(player => {
    // Calculate Manhattan distance
    const distance = Math.abs(monster.x - player.x) + Math.abs(monster.y - player.y);
    
    if (distance <= reachInCells) {
      targets.push({ entity: player, distance });
    }
  });
  
  // Sort by distance (closest first)
  return targets.sort((a, b) => a.distance - b.distance);
};

/**
 * Determine the best attack for a monster to use against a target
 * @param {Object} monster - The monster entity
 * @param {Object} target - The target entity
 * @returns {Object} - The best attack to use
 */
export const determineBestAttack = (monster, target) => {
  const attacks = getMonsterAttacks(monster);
  
  // Filter for just attack actions
  const attackActions = attacks.filter(attack => attack.isAttack);
  
  if (attackActions.length === 0) {
    // No attack actions found, return a default attack
    return {
      name: 'Improvised Attack',
      description: 'The monster improvises an attack.',
      attackBonus: 2,
      damageDice: '1d4',
      attackType: 'melee',
      isAttack: true
    };
  }
  
  // Calculate Manhattan distance to target
  const distance = Math.abs(monster.x - target.x) + Math.abs(monster.y - target.y);
  
  // For simplicity, prefer ranged attacks if target is more than 1 cell away
  // otherwise prefer melee attacks
  if (distance > 1) {
    const rangedAttacks = attackActions.filter(attack => 
      attack.attackType === 'ranged'
    );
    
    if (rangedAttacks.length > 0) {
      // Pick a random ranged attack
      return rangedAttacks[Math.floor(Math.random() * rangedAttacks.length)];
    }
  }
  
  // Either we're in melee range or we don't have ranged attacks, use a melee attack
  const meleeAttacks = attackActions.filter(attack => 
    attack.attackType === 'melee'
  );
  
  if (meleeAttacks.length > 0) {
    // Pick a random melee attack
    return meleeAttacks[Math.floor(Math.random() * meleeAttacks.length)];
  }
  
  // If all else fails, pick a random attack
  return attackActions[Math.floor(Math.random() * attackActions.length)];
};

/**
 * Have a monster attack a target
 * @param {Object} monster - The monster entity
 * @param {Object} target - The target entity
 * @returns {Object} - Attack result with success, damage, critical, etc.
 */
export const monsterAttack = (monster, target) => {
  // Determine the best attack to use
  const attack = determineBestAttack(monster, target);
  
  // Roll attack
  const attackRoll = calculateMonsterAttackRoll(monster, attack);
  const isCritical = attackRoll === 20;
  
  // Get target's AC
  const targetAC = target.properties?.ac || 10;
  
  // Check if attack hits
  const hits = isCritical || attackRoll >= targetAC;
  
  // Calculate damage if attack hits
  let damage = 0;
  if (hits) {
    // Roll damage dice once for normal hit, twice for critical
    damage = calculateMonsterDamage(monster, attack);
    
    if (isCritical) {
      // Add extra damage dice for critical hit
      const extraDamage = calculateMonsterDamage(monster, attack);
      damage += extraDamage;
    }
  }
  
  return {
    monster,
    target,
    attack,
    attackRoll,
    targetAC,
    hits,
    damage,
    isCritical
  };
};

/**
 * Combat Manager for the Dungeon Module
 * Handles combat initialization, turn order, and monster AI
 */

// Initialize combat by rolling initiative for all entities
export const initializeCombat = (players, monsters) => {
  if (!players || players.length === 0) {
    console.warn('No players to initialize combat with');
    return [];
  }

  // Combine players and monsters into a single array
  const allEntities = [...players, ...monsters];
  
  // Roll initiative for each entity
  allEntities.forEach(entity => {
    // Base initiative on dexterity modifier if available
    const dexMod = entity.properties?.dexMod || 0;
    const initiativeRoll = Math.floor(Math.random() * 20) + 1; // d20 roll
    entity.initiative = initiativeRoll + dexMod;
    
    console.log(`${entity.properties?.name || 'Entity'} rolled ${initiativeRoll} + ${dexMod} = ${entity.initiative} for initiative`);
  });
  
  // Sort by initiative (highest first)
  const sortedEntities = allEntities.sort((a, b) => b.initiative - a.initiative);
  
  return sortedEntities;
};

// Get the next entity in the combat order
export const getNextCombatant = (combatOrder, currentEntity) => {
  if (!combatOrder || combatOrder.length === 0) return null;
  
  // Find the current entity's index
  const currentIndex = combatOrder.findIndex(e => e.id === currentEntity.id);
  
  // If not found or it's the last entity, return the first entity
  if (currentIndex === -1 || currentIndex === combatOrder.length - 1) {
    return combatOrder[0];
  }
  
  // Otherwise, return the next entity in order
  return combatOrder[currentIndex + 1];
};

// Process a monster's turn
export const processMonsterTurn = (monster, dungeon, players, monsters) => {
  if (!monster || !dungeon || !players || players.length === 0) {
    return { 
      actionTaken: 'none', 
      message: 'No valid targets or dungeon data' 
    };
  }
  
  // Get the closest player to the monster
  const targetPlayer = findClosestPlayer(monster, players);
  if (!targetPlayer) {
    return {
      actionTaken: 'none',
      message: `${monster.properties?.name || 'Monster'} has no valid targets`
    };
  }
  
  // Calculate distance to target
  const distance = calculateDistance(monster.x, monster.y, targetPlayer.x, targetPlayer.y);
  
  // Determine if the monster can attack
  const attackRange = getMonsterAttackRange(monster);
  
  if (distance <= attackRange) {
    // Attack the player
    return performMonsterAttack(monster, targetPlayer, players);
  } else {
    // Move toward the player
    return moveMonsterTowardPlayer(monster, targetPlayer, dungeon, monsters);
  }
};

// Find the closest player to a monster
const findClosestPlayer = (monster, players) => {
  if (!players || players.length === 0) return null;
  
  let closestPlayer = null;
  let shortestDistance = Infinity;
  
  players.forEach(player => {
    if (player.properties?.hp <= 0) return; // Skip defeated players
    
    const distance = calculateDistance(monster.x, monster.y, player.x, player.y);
    if (distance < shortestDistance) {
      shortestDistance = distance;
      closestPlayer = player;
    }
  });
  
  return closestPlayer;
};

// Calculate distance between two points
const calculateDistance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

// Get the attack range of a monster based on its abilities
const getMonsterAttackRange = (monster) => {
  // Default to melee range (1.5 squares)
  let range = 1.5;
  
  // Check if the monster has actions with specific reach
  if (monster.properties?.actions) {
    monster.properties.actions.forEach(action => {
      if (action.description && action.description.includes('reach')) {
        // Try to parse reach from the description
        const reachMatch = action.description.match(/reach (\d+) ft/);
        if (reachMatch && reachMatch[1]) {
          const actionRange = parseInt(reachMatch[1]) / 5; // Convert from feet to grid squares
          range = Math.max(range, actionRange);
        }
      }
      
      if (action.description && action.description.includes('range')) {
        // Try to parse range from the description
        const rangeMatch = action.description.match(/range (\d+) ft/);
        if (rangeMatch && rangeMatch[1]) {
          const actionRange = parseInt(rangeMatch[1]) / 5; // Convert from feet to grid squares
          range = Math.max(range, actionRange);
        }
      }
    });
  }
  
  return range;
};

// Perform a monster's attack against a player
const performMonsterAttack = (monster, player, allPlayers) => {
  const monsterName = monster.properties?.name || 'Monster';
  const playerName = player.properties?.name || 'Player';
  
  // Pick a random attack from the monster's actions
  const attacks = getMonsterAttacks(monster);
  let attackToUse = null;
  
  if (attacks.length > 0) {
    const randomIndex = Math.floor(Math.random() * attacks.length);
    attackToUse = attacks[randomIndex];
  } else {
    // Fallback to a generic attack
    attackToUse = {
      name: 'Slam',
      attackBonus: monster.properties?.strMod || 0,
      damage: `1d6+${monster.properties?.strMod || 0}`,
      damageType: 'bludgeoning'
    };
  }
  
  // Roll attack
  const attackRoll = Math.floor(Math.random() * 20) + 1;
  const attackBonus = attackToUse.attackBonus || monster.properties?.strMod || 0;
  const totalAttackRoll = attackRoll + attackBonus;
  
  // Check if attack hits
  const playerAC = player.properties?.ac || 10;
  const isHit = attackRoll === 20 || totalAttackRoll >= playerAC;
  const isCritical = attackRoll === 20;
  
  if (isHit) {
    // Calculate damage
    const damage = rollDamage(attackToUse.damage, isCritical);
    
    // Update player HP
    const updatedPlayers = allPlayers.map(p => {
      if (p.id === player.id) {
        const newHP = Math.max(0, p.properties.hp - damage);
        p.properties.hp = newHP;
      }
      return p;
    });
    
    // Check if player is defeated
    const isDefeated = player.properties.hp <= 0;
    
    // Construct message
    const hitType = isCritical ? 'critically hits' : 'hits';
    const message = `${monsterName} attacks ${playerName} with ${attackToUse.name} and ${hitType} for ${damage} damage!`;
    
    return {
      actionTaken: 'attack',
      message,
      damage,
      targetDefeated: isDefeated
    };
  } else {
    // Attack missed
    return {
      actionTaken: 'attack',
      message: `${monsterName} attacks ${playerName} with ${attackToUse.name} but misses!`
    };
  }
};

// Move monster toward a player
const moveMonsterTowardPlayer = (monster, player, dungeon, allMonsters) => {
  const monsterName = monster.properties?.name || 'Monster';
  const playerName = player.properties?.name || 'Player';
  
  // Calculate direction to player
  const dx = player.x - monster.x;
  const dy = player.y - monster.y;
  
  // Normalize to get a single step in the right direction
  const distance = Math.sqrt(dx * dx + dy * dy);
  const stepX = Math.round(dx / distance);
  const stepY = Math.round(dy / distance);
  
  // Calculate new position
  const newX = monster.x + stepX;
  const newY = monster.y + stepY;
  
  // Check if the new position is valid
  if (isValidPosition(newX, newY, dungeon, allMonsters)) {
    // Update monster position
    const oldX = monster.x;
    const oldY = monster.y;
    
    return {
      actionTaken: 'move',
      message: `${monsterName} moves toward ${playerName}`,
      newPosition: { x: newX, y: newY },
      oldPosition: { x: oldX, y: oldY }
    };
  } else {
    // Try to find an alternative path
    const alternativeMoves = [
      { x: monster.x + 1, y: monster.y },
      { x: monster.x - 1, y: monster.y },
      { x: monster.x, y: monster.y + 1 },
      { x: monster.x, y: monster.y - 1 }
    ];
    
    // Sort by closest to player
    alternativeMoves.sort((a, b) => {
      const distA = calculateDistance(a.x, a.y, player.x, player.y);
      const distB = calculateDistance(b.x, b.y, player.x, player.y);
      return distA - distB;
    });
    
    // Find the first valid move
    for (const move of alternativeMoves) {
      if (isValidPosition(move.x, move.y, dungeon, allMonsters)) {
        const oldX = monster.x;
        const oldY = monster.y;
        
        return {
          actionTaken: 'move',
          message: `${monsterName} moves toward ${playerName}`,
          newPosition: { x: move.x, y: move.y },
          oldPosition: { x: oldX, y: oldY }
        };
      }
    }
    
    // No valid moves found
    return {
      actionTaken: 'none',
      message: `${monsterName} can't find a path to ${playerName}`
    };
  }
};

// Check if a position is valid for movement
const isValidPosition = (x, y, dungeon, monsters) => {
  // Check if out of bounds
  if (!dungeon || !dungeon.grid || y < 0 || y >= dungeon.grid.length || x < 0 || x >= dungeon.grid[y].length) {
    return false;
  }
  
  // Check if walkable terrain (floor, corridor, door, stairs up/down, etc.)
  const terrainType = dungeon.grid[y][x];
  const walkable = [1, 2, 3, 4, 5]; // Floor, corridor, door, stairs up/down
  if (!walkable.includes(terrainType)) {
    return false;
  }
  
  // Check if occupied by another monster
  const occupied = monsters.some(m => m.x === x && m.y === y);
  if (occupied) {
    return false;
  }
  
  return true;
};

// Get monster attacks from its properties
const getMonsterAttacks = (monster) => {
  const attacks = [];
  
  if (!monster.properties?.actions) return attacks;
  
  monster.properties.actions.forEach(action => {
    // Check if the action is an attack
    if (action.description && (
        action.description.includes('Attack') || 
        action.description.includes('Weapon Attack'))) {
      
      // Try to extract attack information
      const attackBonusMatch = action.description.match(/\+(\d+) to hit/);
      const damageMatch = action.description.match(/Hit: (\d+d\d+\s*[\+\-]\s*\d+|\d+d\d+|\d+)/i);
      
      if (attackBonusMatch && damageMatch) {
        attacks.push({
          name: action.name,
          attackBonus: parseInt(attackBonusMatch[1]),
          damage: damageMatch[1].trim(),
          description: action.description
        });
      }
    }
  });
  
  return attacks;
};

// Roll damage dice based on a damage expression
const rollDamage = (damageExpr, isCritical = false) => {
  try {
    // Parse the damage expression (e.g., "2d6+3" or "1d10")
    const matches = damageExpr.match(/(\d+)d(\d+)(?:([+-])(\d+))?/);
    
    if (matches) {
      const numDice = parseInt(matches[1]);
      const dieSize = parseInt(matches[2]);
      const hasModifier = matches[3] !== undefined;
      const modifierSign = matches[3] || '+';
      const modifierValue = parseInt(matches[4] || '0');
      
      // Roll the dice
      let totalDamage = 0;
      const diceToRoll = isCritical ? numDice * 2 : numDice;
      
      for (let i = 0; i < diceToRoll; i++) {
        totalDamage += Math.floor(Math.random() * dieSize) + 1;
      }
      
      // Apply modifier
      if (hasModifier) {
        if (modifierSign === '+') {
          totalDamage += modifierValue;
        } else {
          totalDamage -= modifierValue;
        }
      }
      
      // Ensure damage is at least 1
      return Math.max(1, totalDamage);
    } else {
      // If the expression doesn't match our pattern, just return a fixed value
      return parseInt(damageExpr) || 1;
    }
  } catch (error) {
    console.error('Error rolling damage:', error);
    return 1; // Default damage on error
  }
};

export default {
  initializeCombat,
  getNextCombatant,
  processMonsterTurn
};