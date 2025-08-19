import React from 'react';

/**
 * Simple player controls component for dungeon movement
 */
const PlayerControls = ({ onMove, activePlayer }) => {
  // Basic movement in four directions
  const handleMove = (dx, dy) => {
    if (onMove && activePlayer) {
      onMove(activePlayer.x + dx, activePlayer.y + dy);
    }
  };

  return (
    <div className="player-controls" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      margin: '10px',
      padding: '10px',
      backgroundColor: '#f0f0f0',
      borderRadius: '5px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
    }}>
      <div style={{ marginBottom: '8px' }}>
        <button 
          onClick={() => handleMove(0, -1)}
          style={{ width: '40px', height: '40px' }}
        >
          ↑
        </button>
      </div>
      <div>
        <button 
          onClick={() => handleMove(-1, 0)}
          style={{ width: '40px', height: '40px', marginRight: '8px' }}
        >
          ←
        </button>
        <button 
          onClick={() => handleMove(1, 0)}
          style={{ width: '40px', height: '40px' }}
        >
          →
        </button>
      </div>
      <div style={{ marginTop: '8px' }}>
        <button 
          onClick={() => handleMove(0, 1)}
          style={{ width: '40px', height: '40px' }}
        >
          ↓
        </button>
      </div>
    </div>
  );
};

export default PlayerControls;