// Calculate valid moves considering diagonal movement rules and D&D 5e metrics
export const getValidMoves = (entity, grid, entities) => {
  const moves = [];
  const movementSpeed = entity.properties?.speed || 30;
  const maxSquares = movementSpeed / 5;
  
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[0].length; x++) {
      if (isValidMove(entity.x, entity.y, x, y, maxSquares, grid, entities)) {
        moves.push({ x, y });
      }
    }
  }
  return moves;
};

const isValidMove = (startX, startY, endX, endY, maxSquares, grid, entities) => {
  if (!grid[endY]?.[endX] || grid[endY][endX] === 0) return false;
  if (entities.some(e => e.x === endX && e.y === endY)) return false;

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

export const resolveCombatAction = (attacker, defender) => {
  const attackRoll = Math.floor(Math.random() * 20) + 1;
  const attackBonus = attacker.properties?.attackBonus || attacker.properties?.toHit || 0;
  const toHit = attackRoll + attackBonus;
  const ac = defender.properties?.armorClass || defender.properties?.ac || 10;

  const rollDetails = {
    baseRoll: attackRoll,
    bonus: attackBonus,
    total: toHit,
    targetAC: ac
  };

  if (attackRoll === 20) {
    const damage = calculateDamage(attacker, true);
    return {
      hit: true,
      critical: true,
      damage: damage.total,
      damageDetails: damage,
      rollDetails,
      message: `Critical hit! ${attacker.properties.name} rolls ${attackRoll} + ${attackBonus} = ${toHit} vs AC ${ac}. Crit damage: ${formatDamageCalc(damage)}`
    };
  } else if (attackRoll === 1) {
    return {
      hit: false,
      critical: false,
      damage: 0,
      rollDetails,
      message: `${attacker.properties.name} rolls natural 1 (${attackRoll} + ${attackBonus} = ${toHit} vs AC ${ac}). Critical miss!`
    };
  } else if (toHit >= ac) {
    const damage = calculateDamage(attacker, false);
    return {
      hit: true,
      critical: false,
      damage: damage.total,
      damageDetails: damage,
      rollDetails,
      message: `${attacker.properties.name} rolls ${attackRoll} + ${attackBonus} = ${toHit} vs AC ${ac}. Hit! Damage: ${formatDamageCalc(damage)}`
    };
  }
  
  return {
    hit: false,
    critical: false,
    damage: 0,
    rollDetails,
    message: `${attacker.properties.name} rolls ${attackRoll} + ${attackBonus} = ${toHit} vs AC ${ac}. Miss!`
  };
};

const calculateDamage = (attacker, isCritical) => {
  const diceCount = isCritical ? 4 : 2;
  const rolls = [];
  let subtotal = 0;
  
  for (let i = 0; i < diceCount; i++) {
    const roll = Math.floor(Math.random() * 6) + 1;
    rolls.push(roll);
    subtotal += roll;
  }
  
  const damageBonus = attacker.properties?.damageBonus || 
                      attacker.properties?.attackBonus || 
                      attacker.properties?.damage?.bonus || 5;
  
  return {
    rolls,
    bonus: damageBonus,
    subtotal,
    total: subtotal + damageBonus
  };
};

const formatDamageCalc = (damage) => {
  return `[${damage.rolls.join(' + ')}] + ${damage.bonus} = ${damage.total}`;
};