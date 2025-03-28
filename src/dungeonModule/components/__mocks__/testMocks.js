import React from 'react';
import { jest } from '@jest/globals';

// Mock constants
export const MOCK_THEME_SETTINGS = {
  'DARKLING_HIVE': {
    name: 'Darkling Hive',
    colors: {
      wall: '#333',
      floor: '#ddd',
      corridor: '#ccc',
      door: '#855E42',
      stairs: '#855E42',
      room: {
        standard: '#ddd',
        entry: '#aaffaa',
        exit: '#ffaaaa',
        boss: '#ffccaa',
        treasure: '#ffffaa'
      }
    },
    darkness: false,
    population: {
      minTreasure: 1,
      maxTreasure: 3,
      minMonsters: 3,
      maxMonsters: 8,
      minTraps: 0,
      maxTraps: 2
    }
  }
};

// Mock dungeon generator function that returns a simple dungeon
export const generateMockDungeon = () => ({
  grid: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 0, 1, 1, 1, 0],
    [0, 1, 1, 1, 0, 0, 1, 1, 1, 0],
    [0, 1, 1, 1, 3, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  rooms: [
    { x: 1, y: 1, width: 3, height: 3 },
    { x: 6, y: 1, width: 3, height: 3 }
  ],
  corridors: [
    { startX: 3, startY: 3, endX: 6, endY: 3, width: 1 }
  ],
  entities: [
    { type: 'monster', x: 2, y: 2, properties: { name: 'Test Monster', hp: 10, maxHP: 20 } },
    { type: 'treasure', x: 7, y: 2, properties: { value: 100 } }
  ],
  specialRooms: {
    entry: { x: 1, y: 1, width: 3, height: 3 },
    exit: { x: 6, y: 1, width: 3, height: 3 }
  },
  config: {
    width: 10,
    height: 5,
    dungeonType: 'DARKLING_HIVE',
    algorithm: 'bsp',
    partyLevel: 3
  }
});

/**
 * Mock implementation of the DungeonTestApp for testing
 * This version avoids the infinite re-render issues by using simplified functionality
 */
export const MockDungeonTestApp = () => {
  return (
    <div className="dungeon-test-app">
      <h1>Dungeon Generator Debug Tool</h1>

      <div className="app-tabs">
        <div className="tab active">Generator</div>
        <div className="tab">Test Suite</div>
        <div className="tab">Help</div>
      </div>

      <div className="tab-content">
        <div className="generator-tab">
          <div className="test-controls">
            <div className="control-group">
              <h3>Dungeon Type</h3>
              <select aria-label="Dungeon Type">
                <option value="DARKLING_HIVE">Darkling Hive</option>
                <option value="TEMPLE_RUINS">Temple Ruins</option>
              </select>
            </div>

            <div className="control-group">
              <h3>Algorithm</h3>
              <select>
                <option value="bsp">Binary Space Partition</option>
                <option value="cellular">Cellular Automata</option>
              </select>
            </div>

            <div className="control-group">
              <h3>Configuration</h3>
              <div className="config-grid">
                <div className="config-item">
                  <label>Party Level:</label>
                  <input type="number" value="3" />
                </div>
              </div>
            </div>

            <div className="button-group">
              <button className="primary-button">Generate Dungeon</button>
              <button>Show ASCII View</button>
            </div>
          </div>

          <div className="dungeon-preview">
            <h2>Dungeon Preview</h2>
            <div className="dungeon-stats">
              <div>Rooms: 5</div>
              <div>Corridors: 4</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mock test functions
export const mockGenerateTestDungeon = jest.fn().mockImplementation(generateMockDungeon);
export const mockDebugDungeon = jest.fn();
export const mockPrintDungeonASCII = jest.fn().mockReturnValue("### ASCII REPRESENTATION ###");
export const mockRunDungeonGeneratorTest = jest.fn().mockReturnValue(["Test passed!", "All systems operational"]);