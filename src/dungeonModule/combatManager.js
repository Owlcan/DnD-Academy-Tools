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
  // First check if monster has predefined attacks
  if (monster.properties?.attacks && monster.properties.attacks.length > 0) {
    return monster.properties.attacks.map(attack => ({
      name: attack.name,
      description: attack.description,
      attackBonus: attack.toHit || 0,
      damageDice: attack.damage || '1d4',
      reach: attack.reach || 5,
      attackType: attack.type?.toLowerCase().includes('ranged') ? 'ranged' : 'melee',
      isAttack: true
    }));
  }
  
  // Check if we have actions that can be interpreted as attacks
  const attacks = [];
  
  if (monster.properties?.actions) {
    monster.properties.actions.forEach(action => {
      // Check if the action is an attack
      if (action.description && (
          action.description.includes('Attack') || 
          action.description.includes('Weapon Attack'))) {
        
        // Try to extract attack information
        const attackBonusMatch = action.description.match(/\+(\d+) to hit/);
        const damageMatch = action.description.match(/Hit: (\d+d\d+\s*[\+\-]\s*\d+|\d+d\d+|\d+)/i);
        
        if (attackBonusMatch || damageMatch) {
          attacks.push({
            name: action.name,
            attackBonus: attackBonusMatch ? parseInt(attackBonusMatch[1]) : 0,
            damageDice: damageMatch ? damageMatch[1].trim() : '1d4',
            description: action.description,
            // Determine attack type and reach
            attackType: action.description.toLowerCase().includes('ranged') ? 'ranged' : 'melee',
            isAttack: true
          });
        }
      }
    });
  }
  
  // Return the attacks if we found any
  if (attacks.length > 0) {
    return attacks;
  }
  
  // Default attacks if nothing else is available
  return [
    {
      name: 'Claw',
      description: 'Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 6 (1d6 + 3) slashing damage.',
      attackBonus: 3,
      damageDice: '1d6+3',
      attackType: 'melee',
      reach: 5,
      isAttack: true
    },
    {
      name: 'Bite',
      description: 'Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 5 (1d4 + 3) piercing damage.',
      attackBonus: 3,
      damageDice: '1d4+3',
      attackType: 'melee',
      reach: 5,
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
  
  // Check if the cell is a floor (1), corridor (2), or door (3)
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
      // Add diagonal movements
      { dx: 1, dy: -1 },  // Up-Right
      { dx: 1, dy: 1 },   // Down-Right
      { dx: -1, dy: 1 },  // Down-Left
      { dx: -1, dy: -1 }  // Up-Left
    ];
    
    for (const dir of directions) {
      const newX = current.x + dir.dx;
      const newY = current.y + dir.dy;
      
      // Calculate movement cost (sqrt(2) for diagonals, approximated as 1.5)
      const moveCost = (Math.abs(dir.dx) + Math.abs(dir.dy) === 2) ? 1.5 : 1;
      
      // Only add if the new position is valid and the total distance is within range
      if (canMoveTo(entity, newX, newY, dungeon, entities) && 
          (current.distance + moveCost) <= range) {
        queue.push({
          x: newX,
          y: newY,
          distance: current.distance + moveCost
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
      const reachMatch = attack.description?.match(/reach\s+(\d+)\s+ft\./i);
      if (reachMatch && reachMatch[1]) {
        const reach = parseInt(reachMatch[1]);
        maxReach = Math.max(maxReach, reach);
      }
      
      // For ranged attacks, check for range
      const rangeMatch = attack.description?.match(/range\s+(\d+)\s+ft\./i);
      if (rangeMatch && rangeMatch[1]) {
        const range = parseInt(rangeMatch[1]);
        maxReach = Math.max(maxReach, range);
      }
      
      // Also check for reach property directly on the attack object
      if (attack.reach) {
        maxReach = Math.max(maxReach, attack.reach);
      }
    }
  });
  
  // Convert reach in feet to grid cells (assuming 5ft per cell)
  const reachInCells = Math.ceil(maxReach / 5);
  
  // Check each player to see if they're within reach
  players.forEach(player => {
    // Skip invalid or defeated players
    if (!player || !player.properties || player.properties.hp <= 0) {
      return;
    }
    
    // Calculate Euclidean distance for more accurate reach
    const dx = monster.x - player.x;
    const dy = monster.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance <= reachInCells) {
      targets.push({ entity: player, distance });
    }
  });
  
  // Sort by distance (closest first)
  return targets.sort((a, b) => a.distance - b.distance);
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
  const allEntities = [...players, [...monsters]];
  
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

/**
 * Get all available weapons for a player
 * @param {Object} player - The player entity
 * @returns {Array} - Array of weapon objects
 */
export const getPlayerWeapons = (player) => {
  if (!player || !player.properties) {
    return [];
  }

  // Check if player has weapons directly in its properties
  if (player.properties.weapons && Array.isArray(player.properties.weapons)) {
    return player.properties.weapons;
  }

  // Check if player has character data with equipment weapons
  if (player.properties.characterData && 
      player.properties.characterData.equipment && 
      player.properties.characterData.equipment.weapons) {
    
    const characterWeapons = player.properties.characterData.equipment.weapons;
    
    return characterWeapons.map(weapon => {
      // Convert to standardized weapon format
      return {
        name: weapon.name || 'Unnamed Weapon',
        damage: weapon.damage || '1d6',
        damageType: weapon.damageType || 'slashing',
        attackBonus: weapon.attack_bonus || 0,
        properties: weapon.properties || [],
        range: weapon.range || 1,
        attackType: weapon.name?.toLowerCase()?.includes('bow') || 
                  weapon.name?.toLowerCase()?.includes('gun') || 
                  weapon.name?.toLowerCase()?.includes('crossbow') || 
                  weapon.name?.toLowerCase()?.includes('dart') || 
                  weapon.name?.toLowerCase()?.includes('thrown') ? 'ranged' : 'melee',
        type: 'weapon'
      };
    });
  }

  // Default weapons if none found
  return [
    {
      name: 'Shortsword',
      damage: '1d6',
      damageType: 'piercing',
      properties: ['light', 'finesse'],
      attackBonus: 0,
      attackType: 'melee',
      range: 1,
      type: 'weapon'
    },
    {
      name: 'Dagger',
      damage: '1d4',
      damageType: 'piercing',
      properties: ['light', 'finesse', 'thrown'],
      attackBonus: 0,
      attackType: 'melee',
      range: 1,
      type: 'weapon'
    }
  ];
};

/**
 * Get the player's current weapon for combat
 * @param {Object} player - The player entity
 * @returns {Object} - The selected weapon, or a default weapon
 */
export const getPlayerWeapon = (player) => {
  // Use the player's selected weapon if available
  if (player.selectedWeapon) {
    return player.selectedWeapon;
  }
  
  // Otherwise look at player's weapons array
  const weapons = player.properties?.weapons || [];
  
  if (weapons.length > 0) {
    return weapons[0]; // Use first weapon as default
  }
  
  // Check if player has character data with equipment weapons
  if (player.properties?.characterData?.equipment?.weapons?.length > 0) {
    const charWeapon = player.properties.characterData.equipment.weapons[0];
    return {
      name: charWeapon.name || 'Weapon',
      damage: charWeapon.damage || '1d6',
      damageType: charWeapon.damageType || 'slashing',
      attackBonus: charWeapon.attack_bonus || 0,
      properties: charWeapon.properties || [],
      type: 'weapon'
    };
  }
  
  // Fallback to a basic weapon if nothing else is available
  return {
    name: "Unarmed Strike",
    damage: "1d4",
    damageType: "bludgeoning",
    attackBonus: 0,
    properties: ["light"],
    attackType: "melee",
    range: 1,
    type: "weapon"
  };
};

/**
 * Resolve a player's attack against a monster
 * @param {Object} player - The attacking player
 * @param {Object} monster - The monster being attacked
 * @param {Object} weapon - The weapon being used
 * @param {Array} monsters - All monsters in the dungeon
 * @returns {Object} - Result of the attack
 */
export const resolvePlayerAttack = (player, monster, weapon, monsters) => {
  if (!player || !monster) {
    return { success: false, message: 'Invalid attack parameters' };
  }

  // Ensure we have a weapon
  if (!weapon) {
    // Try to get weapon from player properties
    weapon = player.selectedWeapon || (player.properties?.weapons && player.properties.weapons.length > 0 
      ? player.properties.weapons[0] 
      : {
        name: "Unarmed Strike",
        damage: "1d4",
        damageType: "bludgeoning",
        attackBonus: 0,
        properties: ["light"]
      });
  }

  const playerName = player.properties?.name || 'Player';
  const monsterName = monster.properties?.name || 'Monster';
  const weaponName = weapon.name || 'weapon';

  // Calculate attack bonus - prefer using the bonus from weapon if available
  let attackBonus = (typeof weapon.attackBonus === 'number') ? weapon.attackBonus : 0;

  // If weapon doesn't have a bonus, calculate it from stats and proficiency
  if (attackBonus === 0) {
    // Use ability modifier based on weapon properties
    const strMod = player.properties?.strMod || getAbilityModifier(player.properties?.strength || 10);
    const dexMod = player.properties?.dexMod || getAbilityModifier(player.properties?.dexterity || 10);
    
    // Use dexterity for finesse weapons, otherwise strength
    if (weapon.properties && weapon.properties.includes('finesse')) {
      attackBonus += Math.max(strMod, dexMod);
    } else if (weapon.attackType === 'ranged') {
      attackBonus += dexMod;
    } else {
      attackBonus += strMod;
    }
    
    // Add proficiency bonus
    const profBonus = Math.floor((player.properties?.level || 1) / 4) + 2;
    attackBonus += profBonus;
  }

  // Roll attack
  const attackRoll = rollDie(20);
  const totalAttack = attackRoll + attackBonus;
  
  // Check if attack hits
  const monsterAC = monster.properties?.ac || 10;
  const isHit = attackRoll === 20 || totalAttack >= monsterAC;
  const isCritical = attackRoll === 20;

  if (!isHit) {
    return {
      success: true,
      hit: false,
      message: `${playerName} attacks ${monsterName} with ${weaponName} but misses! (Rolled ${attackRoll} + ${attackBonus} = ${totalAttack} vs AC ${monsterAC})`
    };
  }

  // Calculate damage
  const weaponDamage = weapon.damage || '1d6';
  const damageRolls = [];
  let totalDamage = 0;
  
  // Parse the damage dice notation
  const diceParts = parseDiceNotation(weaponDamage);
  
  // Roll damage dice (double dice on critical)
  const diceCount = isCritical ? diceParts.count * 2 : diceParts.count;
  
  for (let i = 0; i < diceCount; i++) {
    const roll = rollDie(diceParts.sides);
    damageRolls.push(roll);
    totalDamage += roll;
  }
  
  // Add damage modifier
  totalDamage += diceParts.modifier;

  // Build result message
  let hitType = isCritical ? 'critically hits' : 'hits';
  let message = `${playerName} attacks ${monsterName} with ${weaponName} and ${hitType}! `;
  message += `(Rolled ${attackRoll} + ${attackBonus} = ${totalAttack} vs AC ${monsterAC}) `;
  
  if (isCritical) {
    message += `Critical hit! `;
  }
  
  message += `Damage: ${damageRolls.join(' + ')}`;
  if (diceParts.modifier > 0) {
    message += ` + ${diceParts.modifier}`;
  }
  message += ` = ${totalDamage} ${weapon.damageType || 'damage'}`;
  
  return {
    success: true,
    hit: true,
    critical: isCritical,
    damage: totalDamage,
    message,
    rollDetails: {
      attackRoll,
      attackBonus,
      totalAttack,
      damageRolls,
      weaponDamage,
      weapon
    }
  };
};

/**
 * Resolve a monster's attack against a player
 * @param {Object} monster - The attacking monster
 * @param {Object} player - The player being attacked
 * @param {Array} allPlayers - All players in the dungeon
 * @returns {Object} - Result of the attack
 */
export const resolveMonsterAttack = (monster, player, allPlayers) => {
  if (!monster || !player) {
    return { success: false, message: 'Invalid attack parameters' };
  }

  const monsterName = monster.properties?.name || 'Monster';
  const playerName = player.properties?.name || 'Player';

  // Get monster attacks
  const attacks = getMonsterAttacks(monster);
  
  // Select an attack to use
  const attack = attacks[Math.floor(Math.random() * attacks.length)];
  const attackName = attack?.name || 'attack';
  
  // Calculate attack roll
  const attackRoll = rollDie(20);
  const attackBonus = attack?.attackBonus || monster.properties?.attackBonus || 0;
  const totalAttack = attackRoll + attackBonus;
  
  // Check if attack hits
  const playerAC = player.properties?.ac || 10;
  const isHit = attackRoll === 20 || totalAttack >= playerAC;
  const isCritical = attackRoll === 20;

  if (!isHit) {
    return {
      success: true,
      hit: false,
      message: `${monsterName} attacks ${playerName} with ${attackName} but misses! (Rolled ${attackRoll} + ${attackBonus} = ${totalAttack} vs AC ${playerAC})`
    };
  }

  // Calculate damage
  let damageRoll = 0;
  const damageDice = attack?.damageDice || attack?.damage || '1d6';
  
  // Parse dice notation
  const diceParts = parseDiceNotation(damageDice);
  
  // Roll damage dice (double dice on critical)
  const diceCount = isCritical ? diceParts.count * 2 : diceParts.count;
  
  for (let i = 0; i < diceCount; i++) {
    damageRoll += rollDie(diceParts.sides);
  }
  
  // Add damage modifier
  const damageBonus = diceParts.modifier;
  let totalDamage = damageRoll + damageBonus;

  // Build result message
  let hitType = isCritical ? 'critically hits' : 'hits';
  let message = `${monsterName} attacks ${playerName} with ${attackName} and ${hitType}! `;
  message += `(Rolled ${attackRoll} + ${attackBonus} = ${totalAttack} vs AC ${playerAC}) `;
  message += `Damage: ${damageRoll} + ${damageBonus} = ${totalDamage} damage`;
  
  return {
    success: true,
    hit: true,
    critical: isCritical,
    damage: totalDamage,
    message
  };
};