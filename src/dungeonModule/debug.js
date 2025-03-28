// Main debug exports file - provides easy access to all debug utilities
import {
  generateTestDungeon,
  printDungeonASCII,
  debugDungeon,
  runDungeonGeneratorTest
} from './debugUtils';

import {
  useDungeonTestApp,
  DungeonDebugButton
} from './debugIntegration';

import DungeonTestApp from './TestApp';

// Initialize bestiary data from the provided JSON if needed
export const initializeBestiary = (bestiaryData) => {
  if (!window.bestiary && bestiaryData) {
    window.bestiary = bestiaryData;
    console.log('Bestiary data initialized on window.bestiary');
    return true;
  } else if (window.bestiary) {
    console.log('Bestiary data already initialized');
    return true;
  } else {
    console.warn('No bestiary data provided! Dungeon generator might not work correctly.');
    return false;
  }
};

// Export all debug utilities
export {
  // Core utility functions
  generateTestDungeon,
  printDungeonASCII,
  debugDungeon,
  runDungeonGeneratorTest,
  
  // Components and hooks
  useDungeonTestApp,
  DungeonDebugButton,
  DungeonTestApp
};

// Simple function to quickly launch the debug UI
export const launchDungeonDebugger = (bestiaryData) => {
  // Initialize bestiary if provided
  const initialized = initializeBestiary(bestiaryData);
  if (!initialized) {
    console.error('Failed to initialize bestiary data. Attempting to continue anyway.');
  }
  
  // Create and append a container div if it doesn't exist
  let container = document.getElementById('dungeon-debugger-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'dungeon-debugger-container';
    document.body.appendChild(container);
  }
  
  // Create a button to open the debugger
  const button = document.createElement('button');
  button.innerText = 'Open Dungeon Debugger';
  button.style.position = 'fixed';
  button.style.bottom = '20px';
  button.style.right = '20px';
  button.style.padding = '10px 15px';
  button.style.backgroundColor = '#4a6fa5';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  button.style.zIndex = '9999';
  button.style.fontWeight = 'bold';
  button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
  
  // Add click event to launch the test app
  button.addEventListener('click', () => {
    // Create full-screen container for the app
    const appContainer = document.createElement('div');
    appContainer.style.position = 'fixed';
    appContainer.style.top = '0';
    appContainer.style.left = '0';
    appContainer.style.width = '100vw';
    appContainer.style.height = '100vh';
    appContainer.style.backgroundColor = 'white';
    appContainer.style.zIndex = '10000';
    appContainer.style.overflow = 'auto';
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.innerText = 'Close Debugger';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.zIndex = '10001';
    closeButton.style.padding = '8px 12px';
    closeButton.style.background = '#f44336';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '4px';
    closeButton.style.cursor = 'pointer';
    
    closeButton.addEventListener('click', () => {
      document.body.removeChild(appContainer);
    });
    
    appContainer.appendChild(closeButton);
    
    // Create container for the test app
    const testAppDiv = document.createElement('div');
    appContainer.appendChild(testAppDiv);
    
    document.body.appendChild(appContainer);
    
    // Function to load the test app (assumes you have React and ReactDOM available)
    if (window.React && window.ReactDOM) {
      window.ReactDOM.render(
        window.React.createElement(DungeonTestApp),
        testAppDiv
      );
    } else {
      testAppDiv.innerHTML = '<h2>Error: React and ReactDOM are required to render the debugger</h2>';
      console.error('React and ReactDOM are required to render the dungeon debugger');
    }
  });
  
  container.appendChild(button);
  
  return {
    openDebugger: () => button.click(),
    removeDebugger: () => document.body.removeChild(container)
  };
};