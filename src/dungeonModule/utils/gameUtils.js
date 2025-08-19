// Import combat resolution functions from combatManager
import { resolvePlayerAttack, resolveMonsterAttack } from '../combatManager';

// Calculate valid moves considering diagonal movement rules and D&D 5e metrics
export const getValidMoves = (entity, grid, entities) => {
  const moves = [];
  const movementSpeed = entity.properties?.speed || 30;
  const maxSquares = movementSpeed / 5;
  
  // Get entity size (default to 1 if not specified)
  const entitySize = entity.properties?.tokenSize || 1;
  
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      // For larger entities, check if all required cells are valid
      let validForLargeEntity = true;
      
      if (entitySize > 1) {
        // Check if the entity would fit at this position
        for (let dy = 0; dy < entitySize; dy++) {
          for (let dx = 0; dx < entitySize; dx++) {
            if (!isValidCell(x + dx, y + dy, grid, entities)) {
              validForLargeEntity = false;
              break;
            }
          }
          if (!validForLargeEntity) break;
        }
      }
      
      // If it's a single-cell entity or all cells are valid for larger entity
      if (entitySize === 1 || validForLargeEntity) {
        if (isValidMove(entity.x, entity.y, x, y, maxSquares, grid, entities)) {
          moves.push({ x, y });
        }
      }
    }
  }
  return moves;
};

// Helper function to check if a cell is valid (not a wall or occupied)
const isValidCell = (x, y, grid, entities) => {
  // Check if cell is within bounds
  if (!grid[y] || !grid[y][x]) return false;
  
  // Check if cell is a wall
  if (grid[y][x] === 0) return false;
  
  // Check if cell is occupied by another entity
  if (entities.some(e => e.x === x && e.y === y)) return false;
  
  return true;
};

const isValidMove = (startX, startY, endX, endY, maxSquares, grid, entities) => {
  // Don't allow moving to the same position
  if (startX === endX && startY === endY) return false;
  
  // Check if destination is valid
  if (!grid[endY]?.[endX] || grid[endY][endX] === 0) return false;
  
  // Check for entity collision, but handle special "monster_part" entities correctly
  const entityAtPosition = entities.find(e => e.x === endX && e.y === endY);
  if (entityAtPosition) {
    // If this is a monster part, check if it's part of a larger entity
    if (entityAtPosition.type === 'monster_part') {
      // Get the parent entity to check if we should block movement
      const parentEntity = entities.find(e => 
        e.id === entityAtPosition.properties?.parentId
      );
      
      // If parent exists and is a monster, block the move
      if (parentEntity && parentEntity.type === 'monster') {
        return false;
      }
    } else {
      // Standard entity collision check
      return false;
    }
  }

  // Find valid path using A* pathfinding
  const path = findPath(startX, startY, endX, endY, grid);
  if (!path) return false;

  // Calculate total movement cost including diagonals
  let totalCost = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = Math.abs(path[i].x - path[i-1].x);
    const dy = Math.abs(path[i].y - path[i-1].y);
    if (dx === 1 && dy === 1) {
      totalCost += 7.5; // 1.5 squares for diagonal
    } else {
      totalCost += 5; // 1 square for orthogonal
    }
  }

  return totalCost <= maxSquares * 5;
};

const findPath = (startX, startY, endX, endY, grid) => {
  const openSet = [{ x: startX, y: startY, g: 0, f: 0, diagonalCount: 0 }];
  const closedSet = new Set();
  const cameFrom = new Map();

  while (openSet.length > 0) {
    let current = openSet.reduce((min, node) => node.f < min.f ? node : min);
    
    if (current.x === endX && current.y === endY) {
      return reconstructPath(cameFrom, current);
    }

    openSet.splice(openSet.indexOf(current), 1);
    closedSet.add(`${current.x},${current.y}`);

    for (const neighbor of getNeighbors(current, grid)) {
      if (closedSet.has(`${neighbor.x},${neighbor.y}`)) continue;

      const isDiagonal = Math.abs(neighbor.x - current.x) === 1 && 
                        Math.abs(neighbor.y - current.y) === 1;
      
      // Calculate movement cost based on D&D 5e diagonal rules
      const movementCost = isDiagonal ? 
        (current.diagonalCount === 0 ? 5 : 10) : 5;

      const tentativeG = current.g + movementCost;
      neighbor.diagonalCount = isDiagonal ? current.diagonalCount + 1 : 0;

      const existingNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);
      if (!existingNode) {
        neighbor.g = tentativeG;
        neighbor.f = tentativeG + heuristic(neighbor, { x: endX, y: endY });
        openSet.push(neighbor);
        cameFrom.set(`${neighbor.x},${neighbor.y}`, current);
      } else if (tentativeG < existingNode.g) {
        existingNode.g = tentativeG;
        existingNode.f = tentativeG + heuristic(existingNode, { x: endX, y: endY });
        existingNode.diagonalCount = neighbor.diagonalCount;
        cameFrom.set(`${existingNode.x},${existingNode.y}`, current);
      }
    }
  }

  return null;
};

const getNeighbors = (node, grid) => {
  const neighbors = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      
      const x = node.x + dx;
      const y = node.y + dy;
      
      if (x >= 0 && x < grid[0].length && y >= 0 && y < grid.length && grid[y][x] !== 0) {
        neighbors.push({ x, y, g: 0, f: 0 });
      }
    }
  }
  return neighbors;
};

const heuristic = (a, b) => {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};

const reconstructPath = (cameFrom, current) => {
  const path = [current];
  while (cameFrom.has(`${current.x},${current.y}`)) {
    current = cameFrom.get(`${current.x},${current.y}`);
    path.unshift(current);
  }
  return path;
};

/**
 * Resolve combat action between attacker and defender
 * @param {Object} attacker - The attacking entity
 * @param {Object} defender - The defending entity
 * @param {Object} weapon - The weapon being used (for player attacks)
 * @returns {Object} - Result object with hit, damage, and message
 */
export const resolveCombatAction = (attacker, defender, weapon) => {
  // Get attacker stats
  const attackerName = attacker.properties?.name || 'Unnamed';
  const attackBonus = attacker.properties?.attackBonus || 0;
  
  // Get defender stats
  const ac = defender.properties?.ac || 10;
  
  // Roll for attack (d20 + attack bonus)
  const attackRoll = Math.floor(Math.random() * 20) + 1;
  const toHit = attackRoll + attackBonus;
  
  // Store roll details for reference
  const rollDetails = {
    roll: attackRoll,
    bonus: attackBonus,
    total: toHit,
    target: ac
  };
  
  // Handle different entity types
  if (attacker.type === 'player' && defender.type === 'monster') {
    // Player attacking monster
    return resolvePlayerAttack(attacker, defender, weapon);
  } else if (attacker.type === 'monster' && defender.type === 'player') {
    // Monster attacking player
    return resolveMonsterAttack(attacker, defender);
  }
  
  // Handle critical hit (natural 20)
  if (attackRoll === 20) {
    const damage = calculateDamage(attacker, true);
    return {
      hit: true,
      critical: true,
      damage: damage.total,
      damageDetails: damage,
      rollDetails,
      message: `${attackerName} rolls natural 20! Critical hit! Damage: ${formatDamageCalc(damage)}`
    };
  } 
  // Handle critical miss (natural 1)
  else if (attackRoll === 1) {
    return {
      hit: false,
      critical: false,
      damage: 0,
      rollDetails,
      message: `${attackerName} rolls natural 1 (${attackRoll} + ${attackBonus} = ${toHit} vs AC ${ac}). Critical miss!`
    };
  } 
  // Handle normal hit
  else if (toHit >= ac) {
    const damage = calculateDamage(attacker, false);
    return {
      hit: true,
      critical: false,
      damage: damage.total,
      damageDetails: damage,
      rollDetails,
      message: `${attackerName} rolls ${attackRoll} + ${attackBonus} = ${toHit} vs AC ${ac}. Hit! Damage: ${formatDamageCalc(damage)}`
    };
  }
  // Handle miss
  else {
    return {
      hit: false,
      critical: false,
      damage: 0,
      rollDetails,
      message: `${attackerName} rolls ${attackRoll} + ${attackBonus} = ${toHit} vs AC ${ac}. Miss!`
    };
  }
};

// Helper function to calculate damage
const calculateDamage = (attacker, isCritical, spellData = null) => {
  // If using a spell, use its damage formula
  if (spellData) {
    return calculateSpellDamage(spellData, isCritical);
  }
  
  // Get attacker's damage bonus
  const damageBonus = attacker.properties?.damageBonus || 0;
  
  // Default damage die
  let damageDice = "1d6"; 
  let damageType = "slashing";
  
  // Check for selected weapon first
  if (attacker.selectedWeapon) {
    damageDice = attacker.selectedWeapon.damage || damageDice;
    damageType = attacker.selectedWeapon.damageType || damageType;
  }
  // Check for weapons in properties
  else if (attacker.properties?.weapons && attacker.properties.weapons.length > 0) {
    const weapon = attacker.properties.weapons[0];
    damageDice = weapon.damage || damageDice;
    damageType = weapon.damageType || damageType;
  }
  // Check for attacks from monster data
  else if (attacker.properties?.attacks && attacker.properties.attacks.length > 0) {
    const attack = attacker.properties.attacks[0];
    if (attack.damageDice) {
      damageDice = attack.damageDice;
    } else if (attack.damage) {
      damageDice = attack.damage;
    }
    damageType = attack.damageType || damageType;
  }
  
  // Parse the damage dice (e.g., "2d6+3")
  const diceMatch = damageDice.match(/(\d+)d(\d+)(?:\s*\+\s*(\d+))?/);
  
  if (!diceMatch) {
    // If format doesn't match, default to 1d6 + damage bonus
    const dieRoll = Math.floor(Math.random() * 6) + 1;
    const total = dieRoll + damageBonus;
    
    return {
      dice: [dieRoll],
      bonus: damageBonus,
      total: total,
      formula: `1d6 + ${damageBonus}`,
      damageType: damageType
    };
  }
  
  // Extract numbers from dice notation
  const numDice = parseInt(diceMatch[1]);
  const dieSize = parseInt(diceMatch[2]);
  const diceBonus = diceMatch[3] ? parseInt(diceMatch[3]) : 0;
  
  // Roll the dice
  const diceRolls = [];
  let diceTotal = 0;
  
  // Double the number of dice on critical hit
  const diceToRoll = isCritical ? numDice * 2 : numDice;
  
  for (let i = 0; i < diceToRoll; i++) {
    const roll = Math.floor(Math.random() * dieSize) + 1;
    diceRolls.push(roll);
    diceTotal += roll;
  }
  
  // Calculate total damage
  const totalDamage = diceTotal + diceBonus + damageBonus;
  
  // Return detailed damage information
  return {
    dice: diceRolls,
    diceTotal: diceTotal,
    diceBonus: diceBonus,
    attackerBonus: damageBonus,
    total: totalDamage,
    formula: `${isCritical ? numDice * 2 : numDice}d${dieSize} + ${diceBonus} + ${damageBonus}`,
    damageType: damageType
  };
};

// Helper function to calculate spell damage
const calculateSpellDamage = (spell, isCritical) => {
  const damageDice = spell.damage || "1d10";
  
  // Parse the damage dice (e.g., "2d6+3")
  const diceMatch = damageDice.match(/(\d+)d(\d+)(?:\s*\+\s*(\d+))?/);
  
  if (!diceMatch) {
    // If format doesn't match, default to 1d10
    const dieRoll = Math.floor(Math.random() * 10) + 1;
    return {
      dice: [dieRoll],
      bonus: 0,
      total: dieRoll,
      formula: `1d10`,
      damageType: spell.damageType || "force",
      isSpell: true
    };
  }
  
  // Extract numbers from dice notation
  const numDice = parseInt(diceMatch[1]);
  const dieSize = parseInt(diceMatch[2]);
  const diceBonus = diceMatch[3] ? parseInt(diceMatch[3]) : 0;
  
  // Roll the dice
  const diceRolls = [];
  let diceTotal = 0;
  
  // Double the number of dice on critical hit
  const diceToRoll = isCritical ? numDice * 2 : numDice;
  
  for (let i = 0; i < diceToRoll; i++) {
    const roll = Math.floor(Math.random() * dieSize) + 1;
    diceRolls.push(roll);
    diceTotal += roll;
  }
  
  // Calculate total damage
  const totalDamage = diceTotal + diceBonus;
  
  // Return detailed damage information
  return {
    dice: diceRolls,
    diceTotal: diceTotal,
    bonus: diceBonus,
    total: totalDamage,
    formula: `${isCritical ? numDice * 2 : numDice}d${dieSize} + ${diceBonus}`,
    damageType: spell.damageType || "force",
    isSpell: true
  };
};

// Helper function to format damage calculation as a string
const formatDamageCalc = (damage) => {
  if (damage.dice.length === 0) {
    return `${damage.total}`;
  }
  
  let result = `${damage.dice.join(' + ')}`;
  
  if (damage.bonus > 0) {
    result += ` + ${damage.bonus}`;
  }
  
  result += ` = ${damage.total}`;
  
  if (damage.damageType) {
    result += ` ${damage.damageType}`;
  }
  
  return result;
};

export const getValidMovesInRange = (entity, range, dungeon, entities) => {
    const validMoves = [];
    const x = entity.x;
    const y = entity.y;
    
    // Check each position within range
    for (let dx = -range; dx <= range; dx++) {
        for (let dy = -range; dy <= range; dy++) {
            // Calculate manhattan distance
            if (Math.abs(dx) + Math.abs(dy) <= range) {
                const newX = x + dx;
                const newY = y + dy;
                
                // Check if move is valid
                if (dungeon.isValidMove(newX, newY)) {
                    validMoves.push({x: newX, y: newY});
                }
            }
        }
    }
    
    return validMoves;
};