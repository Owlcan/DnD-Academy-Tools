// Utility to integrate the dungeon test app with the main application
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import DungeonTestApp from './TestApp';

// Create a modal container for the dungeon test app
export const createTestAppModal = () => {
  // Create container if it doesn't exist
  let container = document.getElementById('dungeon-test-app-modal');
  if (!container) {
    container = document.createElement('div');
    container.id = 'dungeon-test-app-modal';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.zIndex = '10000';
    container.style.overflow = 'auto';
    document.body.appendChild(container);
  }
  return container;
};

// Hook to use the dungeon test app in other components
export const useDungeonTestApp = () => {
  const [showTestApp, setShowTestApp] = useState(false);
  
  // Effect to mount/unmount the test app
  useEffect(() => {
    if (showTestApp) {
      const container = createTestAppModal();
      const testAppContainer = document.createElement('div');
      testAppContainer.className = 'dungeon-test-app-wrapper';
      testAppContainer.style.backgroundColor = 'white';
      testAppContainer.style.width = '95%';
      testAppContainer.style.height = '95%';
      testAppContainer.style.borderRadius = '8px';
      testAppContainer.style.overflow = 'auto';
      testAppContainer.style.position = 'relative';
      container.appendChild(testAppContainer);
      
      // Add close button
      const closeButton = document.createElement('button');
      closeButton.innerText = 'Close Dungeon Debugger';
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
        setShowTestApp(false);
      });
      
      testAppContainer.appendChild(closeButton);
      
      // Render the test app
      const testAppContentElement = document.createElement('div');
      testAppContentElement.style.padding = '20px';
      testAppContentElement.style.paddingTop = '50px'; // Make space for close button
      testAppContainer.appendChild(testAppContentElement);
      
      ReactDOM.render(<DungeonTestApp />, testAppContentElement);
      
      // Clean up function
      return () => {
        if (container.parentNode) {
          ReactDOM.unmountComponentAtNode(testAppContentElement);
          document.body.removeChild(container);
        }
      };
    }
  }, [showTestApp]);
  
  // Function to open the test app
  const openDungeonTestApp = () => {
    console.log('Opening dungeon test app...');
    setShowTestApp(true);
  };
  
  return {
    showTestApp,
    openDungeonTestApp,
    closeDungeonTestApp: () => setShowTestApp(false)
  };
};

// Simple debug button component that opens the test app
export const DungeonDebugButton = ({ label = "Open Dungeon Debugger" }) => {
  const { openDungeonTestApp } = useDungeonTestApp();
  
  return (
    <button 
      onClick={openDungeonTestApp}
      style={{
        padding: '8px 16px',
        backgroundColor: '#4a6fa5',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold'
      }}
    >
      {label}
    </button>
  );
};