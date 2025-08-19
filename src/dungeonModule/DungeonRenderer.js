import React, { useEffect, useRef, useState } from 'react';
import './DungeonRenderer.css';

const DungeonRenderer = ({ 
  dungeon, 
  players, 
  monsters, 
  activeEntity, 
  selectedCell, 
  validMoves, 
  onCellClick,
  cellSize = 24 
}) => {
  const canvasRef = useRef(null);
  // Track the current player positions to update movement boxes
  const [playerPositions, setPlayerPositions] = useState({});
  
  // Update player positions when they move
  useEffect(() => {
    const newPositions = {};
    players.forEach(player => {
      newPositions[player.id] = { x: player.x, y: player.y };
    });
    setPlayerPositions(newPositions);
  }, [players]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dungeon) return;

    const ctx = canvas.getContext('2d');
    const { grid } = dungeon;
    
    // Set canvas dimensions
    const width = grid[0].length * cellSize;
    const height = grid.length * cellSize;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw dungeon grid
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        const cellX = x * cellSize;
        const cellY = y * cellSize;

        // Color based on cell type
        switch(cell) {
          case 0:
            ctx.fillStyle = '#333333'; // Wall
            break;
          case 1:
            ctx.fillStyle = '#F5F5DC'; // Floor (Beige)
            break;
          case 2:
            ctx.fillStyle = '#D2B48C'; // Corridor (Tan)
            break;
          case 3:
            ctx.fillStyle = '#8B4513'; // Door (Brown)
            break;
          default:
            ctx.fillStyle = '#000000';
        }

        ctx.fillRect(cellX, cellY, cellSize, cellSize);

        // Draw grid lines
        ctx.strokeStyle = '#777';
        ctx.lineWidth = 0.2;
        ctx.strokeRect(cellX, cellY, cellSize, cellSize);
      }
    }

    // Highlight valid moves
    if (validMoves && validMoves.length > 0) {
      validMoves.forEach(move => {
        const moveX = move.x * cellSize;
        const moveY = move.y * cellSize;
        
        ctx.fillStyle = 'rgba(100, 255, 100, 0.5)';
        ctx.fillRect(moveX, moveY, cellSize, cellSize);
      });
    }

    // Draw selected cell highlight
    if (selectedCell) {
      const selectedX = selectedCell.x * cellSize;
      const selectedY = selectedCell.y * cellSize;
      
      ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
      ctx.fillRect(selectedX, selectedY, cellSize, cellSize);
    }

    // Draw active entity highlight
    if (activeEntity) {
      const activeX = activeEntity.x * cellSize;
      const activeY = activeEntity.y * cellSize;
      const size = (activeEntity.size || 1) * cellSize;
      
      ctx.fillStyle = 'rgba(255, 215, 0, 0.6)'; // Golden highlight
      ctx.fillRect(activeX, activeY, size, size);
      
      // Draw movement range indicator around active player
      if (activeEntity.type === 'player') {
        const moveRange = activeEntity.properties.speed / 5 || 6; // Convert feet to grid cells
        const rangeRadius = moveRange * cellSize;
        
        ctx.strokeStyle = 'rgba(100, 255, 100, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
          activeX + (size / 2), 
          activeY + (size / 2), 
          rangeRadius, 
          0, 
          Math.PI * 2
        );
        ctx.stroke();
      }
    }

    // Draw movement range indicators for all players
    players.forEach(player => {
      // Get the player position, using the latest position from state
      const x = player.x * cellSize;
      const y = player.y * cellSize; 
      const size = (player.size || 1) * cellSize;
      const moveRange = player.properties.speed / 5 || 6; // Convert feet to grid cells
      
      // Draw a lighter movement range indicator for non-active players
      if (!activeEntity || player.id !== activeEntity.id) {
        ctx.strokeStyle = 'rgba(100, 200, 100, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(
          x + (size / 2), 
          y + (size / 2), 
          moveRange * cellSize, 
          0, 
          Math.PI * 2
        );
        ctx.stroke();
      }
    });

    // Draw monsters
    monsters.forEach(monster => {
      const monsterX = monster.x * cellSize;
      const monsterY = monster.y * cellSize;
      const monsterSize = (monster.size || 1) * cellSize;
      
      if (monster.type === 'treasure') {
        // Draw treasure chests differently
        if (monster.properties.isRare) {
          // Gold chest for rare treasures
          ctx.fillStyle = 'gold';
        } else {
          // Brown chest for common treasures
          ctx.fillStyle = '#8B4513';
        }
        
        // Draw chest body
        ctx.fillRect(monsterX + 4, monsterY + 8, monsterSize - 8, monsterSize - 12);
        
        // Draw chest lid
        ctx.fillStyle = monster.properties.isRare ? '#FFD700' : '#A0522D';
        ctx.fillRect(monsterX + 2, monsterY + 4, monsterSize - 4, 6);
        
        // Draw lock
        ctx.fillStyle = monster.properties.isRare ? 'silver' : '#696969';
        ctx.fillRect(monsterX + (monsterSize / 2) - 2, monsterY + 8, 4, 4);
      } else {
        // Regular monster
        ctx.fillStyle = '#FF6347'; // Tomato red
        ctx.fillRect(monsterX, monsterY, monsterSize, monsterSize);
        
        // Draw a border
        ctx.strokeStyle = '#8B0000'; // Dark red
        ctx.lineWidth = 2;
        ctx.strokeRect(monsterX, monsterY, monsterSize, monsterSize);
        
        // Add monster initial or symbol
        if (monster.properties.name) {
          ctx.fillStyle = 'white';
          ctx.font = `bold ${cellSize/2}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            monster.properties.symbol || monster.properties.name[0],
            monsterX + monsterSize / 2,
            monsterY + monsterSize / 2
          );
        }
        
        // Add health bar if monster has HP
        if (monster.properties.hp !== undefined && monster.properties.maxHp !== undefined) {
          const hpPercent = monster.properties.hp / monster.properties.maxHp;
          const barWidth = monsterSize - 4;
          const currentBarWidth = barWidth * hpPercent;
          
          // Background
          ctx.fillStyle = '#444';
          ctx.fillRect(monsterX + 2, monsterY - 6, barWidth, 4);
          
          // Health remaining
          ctx.fillStyle = hpPercent > 0.5 ? 'green' : hpPercent > 0.25 ? 'yellow' : 'red';
          ctx.fillRect(monsterX + 2, monsterY - 6, currentBarWidth, 4);
        }
      }
    });

    // Draw players
    players.forEach(player => {
      const playerX = player.x * cellSize;
      const playerY = player.y * cellSize;
      const playerSize = (player.size || 1) * cellSize;
      
      // Draw player token
      ctx.fillStyle = '#4169E1'; // Royal blue
      ctx.fillRect(playerX, playerY, playerSize, playerSize);
      
      // Draw a border
      ctx.strokeStyle = '#00008B'; // Dark blue
      ctx.lineWidth = 2;
      ctx.strokeRect(playerX, playerY, playerSize, playerSize);
      
      // Add player initial
      if (player.properties.name) {
        ctx.fillStyle = 'white';
        ctx.font = `bold ${cellSize/2}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          player.properties.name[0],
          playerX + playerSize / 2,
          playerY + playerSize / 2
        );
      }
      
      // Add health bar if player has HP
      if (player.properties.hp !== undefined && player.properties.maxHp !== undefined) {
        const hpPercent = player.properties.hp / player.properties.maxHp;
        const barWidth = playerSize - 4;
        const currentBarWidth = barWidth * hpPercent;
        
        // Background
        ctx.fillStyle = '#444';
        ctx.fillRect(playerX + 2, playerY - 6, barWidth, 4);
        
        // Health remaining
        ctx.fillStyle = hpPercent > 0.5 ? 'green' : hpPercent > 0.25 ? 'yellow' : 'red';
        ctx.fillRect(playerX + 2, playerY - 6, currentBarWidth, 4);
      }
    });

  }, [dungeon, players, monsters, activeEntity, selectedCell, validMoves, cellSize, playerPositions]);

  const handleClick = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / cellSize);
    const y = Math.floor((event.clientY - rect.top) / cellSize);
    
    // Pass the cell coordinates to the parent component
    onCellClick(x, y);
  };

  if (!dungeon) {
    return <div>No dungeon data available.</div>;
  }

  return (
    <canvas 
      ref={canvasRef} 
      onClick={handleClick} 
      className="dungeon-canvas"
      style={{ border: '1px solid #333' }}
    />
  );
};

export default DungeonRenderer;