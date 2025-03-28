import React, { useState, useEffect } from 'react';
import DungeonRenderer from './DungeonRenderer';
import DungeonGenerator from '../DungeonGenerator';

const DEFAULT_CONFIG = {
  width: 40,
  height: 30,
  roomSizeMin: 4,
  roomSizeMax: 10,
  maxRooms: 10,
  corridorWidth: 1,
  algorithm: 'bsp',
  includeMandatoryRooms: true
};

const TestApp = () => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [dungeon, setDungeon] = useState(null);
  const [error, setError] = useState(null);

  // Generate a new dungeon
  const generateNewDungeon = () => {
    try {
      console.log('Generating dungeon with config:', config);
      const generator = new DungeonGenerator(config);
      const newDungeon = generator.generate();
      console.log('Generated dungeon:', newDungeon);
      setDungeon(newDungeon);
      setError(null);
    } catch (err) {
      console.error('Failed to generate dungeon:', err);
      setError(err.message);
    }
  };

  // Generate initial dungeon
  useEffect(() => {
    generateNewDungeon();
  }, []);

  const handleCellClick = (x, y) => {
    console.log(`Clicked cell at ${x},${y}`);
  };

  return (
    <div className="test-app">
      <div className="controls">
        <button onClick={generateNewDungeon}>Generate New Dungeon</button>
      </div>
      
      {error && <div className="error">{error}</div>}
      
      <div className="dungeon-view">
        {dungeon && (
          <DungeonRenderer
            dungeon={dungeon}
            cellSize={20}
            onCellClick={handleCellClick}
          />
        )}
      </div>
    </div>
  );
};

export default TestApp;