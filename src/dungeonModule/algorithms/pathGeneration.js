// Path generation algorithms to connect rooms with corridors
import { THEME_SETTINGS, DUNGEON_TYPES } from '../constants';

// Generate a path between two points using A* pathfinding
const findPath = (startX, startY, endX, endY, grid, config) => {
  const { width, height } = config;
  
  // Helper functions for A* algorithm
  const heuristic = (x, y) => {
    // Manhattan distance heuristic
    return Math.abs(x - endX) + Math.abs(y - endY);
  };
  
  // Create closed set to track visited nodes
  const closedSet = Array(height).fill().map(() => Array(width).fill(false));
  
  // Create open set for nodes to evaluate
  const openSet = [{
    x: startX,
    y: startY,
    g: 0,                    // Cost from start to current node
    h: heuristic(startX, startY), // Estimated cost to goal
    f: heuristic(startX, startY), // Total cost (g + h)
    parent: null             // Parent node for path reconstruction
  }];
  
  // While there are nodes to evaluate
  while (openSet.length > 0) {
    // Find node with lowest f score
    let currentIndex = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (openSet[i].f < openSet[currentIndex].f) {
        currentIndex = i;
      }
    }
    
    const current = openSet[currentIndex];
    
    // If we've reached the goal, reconstruct and return the path
    if (current.x === endX && current.y === endY) {
      const path = [];
      let node = current;
      
      while (node) {
        path.push({ x: node.x, y: node.y });
        node = node.parent;
      }
      
      return path.reverse();
    }
    
    // Remove current from open set and add to closed set
    openSet.splice(currentIndex, 1);
    closedSet[current.y][current.x] = true;
    
    // Check all adjacent nodes (8-directional movement including diagonals)
    const directions = [
      { dx: 0, dy: -1, cost: 1 },  // North
      { dx: 1, dy: -1, cost: 1.4 }, // Northeast
      { dx: 1, dy: 0, cost: 1 },   // East
      { dx: 1, dy: 1, cost: 1.4 },  // Southeast
      { dx: 0, dy: 1, cost: 1 },   // South
      { dx: -1, dy: 1, cost: 1.4 }, // Southwest
      { dx: -1, dy: 0, cost: 1 },  // West
      { dx: -1, dy: -1, cost: 1.4 } // Northwest
    ];
    
    // Allow option to disable diagonal movement based on config
    const useDiagonals = config.useDiagonalPaths !== false;
    const directionsToUse = useDiagonals ? directions : directions.filter(d => d.cost === 1);
    
    for (const dir of directionsToUse) {
      const neighborX = current.x + dir.dx;
      const neighborY = current.y + dir.dy;
      
      // Skip if out of bounds
      if (neighborX < 0 || neighborY < 0 || neighborX >= width || neighborY >= height) {
        continue;
      }
      
      // Skip if in closed set
      if (closedSet[neighborY][neighborX]) {
        continue;
      }
      
      // Cost to move to the neighbor (1 for cardinal directions, 1.4 for diagonals)
      const tentativeG = current.g + dir.cost;
      
      // Find if the neighbor is already in the open set
      let neighbor = openSet.find(node => node.x === neighborX && node.y === neighborY);
      
      if (!neighbor) {
        // Not in open set, add it
        neighbor = {
          x: neighborX,
          y: neighborY,
          g: tentativeG,
          h: heuristic(neighborX, neighborY),
          f: tentativeG + heuristic(neighborX, neighborY),
          parent: current
        };
        openSet.push(neighbor);
      } else if (tentativeG < neighbor.g) {
        // Found a better path to the neighbor
        neighbor.g = tentativeG;
        neighbor.f = tentativeG + neighbor.h;
        neighbor.parent = current;
      }
    }
  }
  
  // No path found
  return [];
};

// Convert paths to corridors with width
const expandPathToWidth = (path, width, grid, config) => {
  if (width <= 1) return path; // No expansion needed
  
  const { width: gridWidth, height: gridHeight } = config;
  const expandedPath = [];
  const halfWidth = Math.floor(width / 2);
  
  // For each point in the path, add surrounding points based on width
  for (const point of path) {
    for (let dy = -halfWidth; dy <= halfWidth; dy++) {
      for (let dx = -halfWidth; dx <= halfWidth; dx++) {
        const newX = point.x + dx;
        const newY = point.y + dy;
        
        // Skip if out of bounds
        if (newX < 0 || newY < 0 || newX >= gridWidth || newY >= gridHeight) {
          continue;
        }
        
        // Skip if the cell is a wall (0) in the grid
        if (grid && grid[newY] && grid[newY][newX] === 0) {
          continue;
        }
        
        // Add to expanded path if not already included
        if (!expandedPath.some(p => p.x === newX && p.y === newY)) {
          expandedPath.push({ x: newX, y: newY });
        }
      }
    }
  }
  
  return expandedPath;
};

// Generate corridors between rooms using a modified minimum spanning tree algorithm
export const connectRooms = (rooms, config) => {
  if (rooms.length <= 1) return [];
  
  const { dungeonType, corridorWidth = 1 } = config;
  const themeSettings = THEME_SETTINGS[dungeonType] || THEME_SETTINGS[DUNGEON_TYPES.FORGOTTEN_DUNGEON];
  const corridorComplexity = themeSettings.corridorComplexity || 0.5;
  
  // Build graph of room connections
  const edges = [];
  
  // Generate all possible connections between rooms
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const roomA = rooms[i];
      const roomB = rooms[j];
      
      // Calculate distance between room centers
      const distance = Math.sqrt(
        Math.pow(roomA.center.x - roomB.center.x, 2) +
        Math.pow(roomA.center.y - roomB.center.y, 2)
      );
      
      edges.push({
        from: i,
        to: j,
        distance
      });
    }
  }
  
  // Sort edges by distance (ascending)
  edges.sort((a, b) => a.distance - b.distance);
  
  // Track connected rooms in the tree
  const connected = Array(rooms.length).fill(false);
  const tree = [];
  
  // Add random extra corridors based on corridorComplexity
  const extraCorridors = [];
  const MAX_EXTRA_CORRIDORS = Math.floor(rooms.length * corridorComplexity);
  
  // Start with the shortest edge to ensure connectivity
  const firstEdge = edges[0];
  tree.push(firstEdge);
  connected[firstEdge.from] = true;
  connected[firstEdge.to] = true;
  
  // Build the minimum spanning tree
  for (const edge of edges) {
    if (edge === firstEdge) continue;
    
    const { from, to } = edge;
    
    // If one room is connected and the other is not
    if (connected[from] && !connected[to]) {
      tree.push(edge);
      connected[to] = true;
    } else if (!connected[from] && connected[to]) {
      tree.push(edge);
      connected[from] = true;
    } else if (!connected[from] && !connected[to]) {
      // Neither room is connected yet
      tree.push(edge);
      connected[from] = true;
      connected[to] = true;
    } else {
      // Both rooms are already connected, consider as extra corridor
      if (extraCorridors.length < MAX_EXTRA_CORRIDORS && Math.random() < corridorComplexity) {
        extraCorridors.push(edge);
      }
    }
    
    // Check if all rooms are connected
    if (connected.every(isConnected => isConnected)) {
      break;
    }
  }
  
  // Add some of the extra corridors based on complexity
  for (const extraEdge of extraCorridors) {
    tree.push(extraEdge);
  }
  
  // Generate actual corridor paths
  const corridors = [];
  
  // Create a simplified grid for pathfinding
  const grid = Array(config.height).fill().map(() => Array(config.width).fill(0));
  
  // Mark rooms on grid
  for (const room of rooms) {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (y >= 0 && y < config.height && x >= 0 && x < config.width) {
          grid[y][x] = 1; // 1 = room (passable)
        }
      }
    }
  }
  
  // Generate paths between connected rooms
  for (const edge of tree) {
    const roomA = rooms[edge.from];
    const roomB = rooms[edge.to];
    
    // Find path between room centers
    const path = findPath(
      roomA.center.x, roomA.center.y,
      roomB.center.x, roomB.center.y,
      grid, config
    );
    
    if (path.length > 0) {
      // Expand path to requested corridor width
      const expandedPath = corridorWidth > 1 
        ? expandPathToWidth(path, corridorWidth, grid, config)
        : path;
        
      corridors.push(expandedPath);
    }
  }
  
  return corridors;
};