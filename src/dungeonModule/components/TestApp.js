import React, { useState, useEffect } from 'react';
import DungeonRenderer from './DungeonRenderer';
import DungeonGenerator from '../DungeonGenerator';
import { DEFAULT_CONFIG, DUNGEON_TYPES } from '../constants';
import { BESTIARY } from '../data/bestiary-wrapper.js';

const TestApp = () => {
  const [config, setConfig] = useState({...DEFAULT_CONFIG});
  const [dungeon, setDungeon] = useState(null);
  const [error, setError] = useState(null);
  const [generationAttempts, setGenerationAttempts] = useState(0);
  const [players, setPlayers] = useState([]);

  // Generate a new dungeon
  const generateNewDungeon = () => {
    try {
      console.log('Generating dungeon with config:', config);
      const generator = new DungeonGenerator(config);
      const newDungeon = generator.generate();
      console.log('Generated dungeon:', newDungeon);
      setDungeon(newDungeon);
      setError(null);
      setGenerationAttempts(prev => prev + 1);
    } catch (err) {
      console.error('Failed to generate dungeon:', err);
      setError(err.message);
    }
  };

  // Generate initial dungeon
  useEffect(() => {
    console.log('Initial config from constants:', DEFAULT_CONFIG);
    console.log('Available dungeon types:', Object.keys(DUNGEON_TYPES));
    generateNewDungeon();
  }, []);

  const handleCellClick = (x, y) => {
    console.log(`Clicked cell at ${x},${y}`);
    
    // Check if we can move to this cell
    if (dungeon?.grid?.[y]?.[x] === 1) {
      // Make sure the cell isn't occupied by another entity
      const isOccupied = false; // In a full implementation, check players and monsters arrays
      
      if (!isOccupied) {
        // Move the player to the selected position if we have player data
        if (dungeon && players && players.length > 0) {
          const updatedPlayers = players.map((player, index) => {
            if (index === 0) { // Move the first player for simplicity
              return { ...player, x, y };
            }
            return player;
          });
          setPlayers(updatedPlayers);
          console.log(`Player moved to (${x},${y})`);
        }
      }
    }
  };

  return (
    <div className="test-app">
      <div className="controls">
        <button onClick={generateNewDungeon}>Generate New Dungeon</button>
        <div>Generation attempts: {generationAttempts}</div>
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