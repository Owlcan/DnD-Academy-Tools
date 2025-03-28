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
        
        switch (entity.type) {
          case 'monster':
            char = entity.properties?.isBoss ? 'B' : 'M';
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
M - Monster    B - Boss    $ - Treasure    ^ - Trap
@ - Player Start    > - Stairs Down    < - Stairs Up
  `;
  
  return (
    <div className="ascii-renderer">
      <pre className="dungeon-ascii">{asciiText}</pre>
      <pre className="ascii-legend">{legend}</pre>
    </div>
  );
};

export default ASCIIRenderer;