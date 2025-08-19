import React from 'react';
import { CELL_TYPES } from '../constants';

/**
 * Renders a dungeon as ASCII art
 */
const ASCIIRenderer = ({ dungeon }) => {
  if (!dungeon || !dungeon.grid) {
    return <pre className="ascii-renderer">No dungeon data available.</pre>;
  }
  
  // Map of cell types to ASCII characters
  const cellToChar = {
    [CELL_TYPES.WALL]: '#',
    [CELL_TYPES.FLOOR]: '.',
    [CELL_TYPES.CORRIDOR]: ',',
    [CELL_TYPES.DOOR]: '+',
    [CELL_TYPES.STAIRS_UP]: '<',
    [CELL_TYPES.STAIRS_DOWN]: '>'
  };
  
  // Convert dungeon grid to ASCII
  const renderASCII = () => {
    // First create a copy of the grid with just the basic cells
    const asciiGrid = dungeon.grid.map(row => 
      row.map(cell => cellToChar[cell] || '?')
    );
    
    // Add entities to the ASCII grid
    if (dungeon.entities && dungeon.entities.length > 0) {
      dungeon.entities.forEach(entity => {
        // Skip entities outside the grid bounds
        if (entity.x < 0 || entity.y < 0 || 
            entity.y >= asciiGrid.length || 
            entity.x >= asciiGrid[0].length) {
          return;
        }
        
        // Choose character based on entity type
        let char = '?';
        
        // Check for entity size
        let tokenSize = entity.properties?.tokenSize || 1;
        
        // Handle monster size from the monster data if available
        if (entity.type === 'monster' && entity.properties?.monsterData) {
          const monsterData = entity.properties.monsterData;
          
          // Use size from monsterData if available
          if (monsterData.size && Array.isArray(monsterData.size)) {
            // Handle size format used in bestiary files
            const sizeCode = monsterData.size[0];
            if (sizeCode === 'G') tokenSize = 4;
            else if (sizeCode === 'H') tokenSize = 3;
            else if (sizeCode === 'L') tokenSize = 2;
            else if (sizeCode === 'M' || sizeCode === 'S' || sizeCode === 'T') tokenSize = 1;
          }
          
          // Also use tokenSize from monsterData stats if available
          if (monsterData.stats && monsterData.stats.tokenSize) {
            tokenSize = monsterData.stats.tokenSize;
          }
        }
        
        switch(entity.type) {
          case 'monster':
            if (entity.properties?.isBoss) {
              char = 'B';
            } else {
              // Use different symbols based on size
              if (tokenSize >= 4) {
                char = 'G'; // Gargantuan
              } else if (tokenSize === 3) {
                char = 'H'; // Huge
              } else if (tokenSize === 2) {
                char = 'L'; // Large
              } else {
                char = 'M'; // Medium or smaller
              }
            }
            break;
          case 'treasure':
            char = '$';
            break;
          case 'trap':
            char = '^';
            break;
          case 'player_start':
            char = '@';
            break;
          case 'stairs':
            char = entity.properties?.direction === 'up' ? '<' : '>';
            break;
        }
        
        // Add the entity character to the grid
        asciiGrid[entity.y][entity.x] = char;
        
        // For larger entities, mark their extents
        if (tokenSize > 1) {
          // Add corner markers for large entities
          for (let dy = 0; dy < tokenSize; dy++) {
            for (let dx = 0; dx < tokenSize; dx++) {
              const cx = entity.x + dx;
              const cy = entity.y + dy;
              
              // Skip if out of bounds
              if (cx >= asciiGrid[0].length || cy >= asciiGrid.length) {
                continue;
              }
              
              // Mark corners and interior with different symbols
              if (dx === 0 && dy === 0) {
                // Top-left (already set to the main character)
              } else if (dx === tokenSize-1 && dy === 0) {
                // Top-right
                asciiGrid[cy][cx] = '┐';
              } else if (dx === 0 && dy === tokenSize-1) {
                // Bottom-left
                asciiGrid[cy][cx] = '└';
              } else if (dx === tokenSize-1 && dy === tokenSize-1) {
                // Bottom-right
                asciiGrid[cy][cx] = '┘';
              } else if (dx === 0 || dx === tokenSize-1) {
                // Left or right edge
                asciiGrid[cy][cx] = '│';
              } else if (dy === 0 || dy === tokenSize-1) {
                // Top or bottom edge
                asciiGrid[cy][cx] = '─';
              } else {
                // Interior
                asciiGrid[cy][cx] = '·';
              }
            }
          }
        }
      });
    }
    
    // Convert grid to string
    return asciiGrid.map(row => row.join('')).join('\n');
  };
  
  // Generate ASCII representation
  const asciiText = renderASCII();
  
  // Add map legend
  const legend = `
# - Wall    . - Floor    , - Corridor    + - Door
M - Medium Monster    L - Large Monster    H - Huge Monster    G - Gargantuan Monster
B - Boss    $ - Treasure    ^ - Trap
@ - Player Start    > - Stairs Down    < - Stairs Up
┌┐└┘ - Large entity borders
  `;
  
  return (
    <div className="ascii-renderer">
      <pre className="dungeon-ascii">{asciiText}</pre>
      <pre className="ascii-legend">{legend}</pre>
    </div>
  );
};

export default ASCIIRenderer;