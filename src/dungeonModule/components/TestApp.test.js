import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TestApp from '../TestApp';

// Mock the dungeon renderer component to avoid canvas rendering issues in tests
jest.mock('../components/DungeonRenderer', () => {
  return function MockDungeonRenderer({ dungeon }) {
    return (
      <div data-testid="mock-dungeon-renderer">
        {dungeon ? 'Dungeon rendered' : 'No dungeon data'}
      </div>
    );
  };
});

// Mock the dungeon generator to return predictable data
jest.mock('../generators/dungeonGenerator', () => ({
  generateDungeon: jest.fn().mockImplementation(() => ({
    grid: [
      [0, 0, 0, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 1, 1, 1, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 0, 0],
    ],
    rooms: [{ x: 1, y: 1, width: 3, height: 3 }],
    specialRooms: {
      entry: { x: 1, y: 1, width: 1, height: 1 },
      boss: { x: 3, y: 3, width: 1, height: 1 },
    },
    entities: [],
    config: {
      dungeonType: 'CAVE',
      width: 5,
      height: 5,
      roomCount: 1,
      minRoomSize: 3,
      maxRoomSize: 3,
    }
  }))
}));

// Mock other components that might cause problems in the test environment
jest.mock('../components/ASCIIRenderer', () => {
  return function MockASCIIRenderer({ dungeon }) {
    return <pre data-testid="mock-ascii-renderer">{dungeon ? 'ASCII View' : 'No dungeon'}</pre>;
  };
});

describe('TestApp', () => {
  test('renders initial state correctly', () => {
    render(<TestApp />);
    
    // Check if the main title is rendered
    expect(screen.getByText('Dungeon Generator Test')).toBeInTheDocument();
    
    // Check if the dungeon controls are present
    expect(screen.getByText('Generate Dungeon')).toBeInTheDocument();
  });
  
  test('switches view modes correctly', () => {
    render(<TestApp />);
    
    // Generate a dungeon first
    fireEvent.click(screen.getByText('Generate Dungeon'));
    
    // Toggle view mode
    fireEvent.click(screen.getByText('Toggle View Mode'));
    
    // Check if ASCII view is displayed
    expect(screen.getByText('ASCII View')).toBeInTheDocument();
    
    // Toggle back to grid view
    fireEvent.click(screen.getByText('Toggle View Mode'));
    
    // Check if grid view is displayed
    expect(screen.getByText('Dungeon rendered')).toBeInTheDocument();
  });
  
  test('generates dungeon with updated settings', () => {
    render(<TestApp />);
    
    // Change dungeon width and height
    fireEvent.change(screen.getByLabelText('Width:'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Height:'), { target: { value: '50' } });
    
    // Click generate button
    fireEvent.click(screen.getByText('Generate Dungeon'));
    
    // Check if the dungeon is rendered
    expect(screen.getByTestId('mock-dungeon-renderer')).toHaveTextContent('Dungeon rendered');
  });
  
  test('updates entity status correctly', () => {
    render(<TestApp />);
    
    // Generate a dungeon first
    fireEvent.click(screen.getByText('Generate Dungeon'));
    
    // Update entity status
    fireEvent.click(screen.getByText('Update Entity Status'));
    
    // Check if entity status is updated
    expect(screen.getByText('Entity status updated')).toBeInTheDocument();
  });
  
  test('starts combat mode', async () => {
    render(<TestApp />);
    
    // Generate a dungeon first
    fireEvent.click(screen.getByText('Generate Dungeon'));
    
    // Start combat mode
    fireEvent.click(screen.getByText('Start Combat'));
    
    // Check if combat tracker is displayed
    expect(screen.getByText('Combat Tracker')).toBeInTheDocument();
  });
});