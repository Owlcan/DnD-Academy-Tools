import React from 'react';
import ReactDOM from 'react-dom';
import EncounterUI from './EncounterUI';

/**
 * Plugin that adds encounter generation UI to DungeonRenderer
 * This is a non-invasive way to add functionality without modifying core files
 */
class EncounterPlugin {
  constructor() {
    this.containerElement = null;
  }
  
  /**
   * Initialize the plugin by attaching to the DungeonRenderer component
   * @param {HTMLElement} containerElement - DOM element to attach the UI to
   * @param {Object} dungeonRenderer - Reference to the DungeonRenderer component
   * @param {Object} bestiary - Bestiary data
   */
  initialize(containerElement, dungeonRenderer, bestiary) {
    if (!containerElement) {
      console.error('EncounterPlugin: No container element provided');
      return;
    }
    
    this.containerElement = containerElement;
    this.dungeonRenderer = dungeonRenderer;
    
    // Create a div for the encounter UI
    this.uiContainer = document.createElement('div');
    this.uiContainer.className = 'encounter-plugin-container';
    
    // Insert it as the first child of the container
    if (containerElement.firstChild) {
      containerElement.insertBefore(this.uiContainer, containerElement.firstChild);
    } else {
      containerElement.appendChild(this.uiContainer);
    }
    
    // Render the encounter UI
    ReactDOM.render(
      <EncounterUI 
        bestiary={bestiary} 
        dungeonGenerator={dungeonRenderer.dungeonGenerator || dungeonRenderer.props?.dungeonRef?.current} 
      />,
      this.uiContainer
    );
    
    console.log('EncounterPlugin: Initialized successfully');
    return this;
  }
  
  /**
   * Clean up the plugin
   */
  cleanup() {
    if (this.uiContainer) {
      ReactDOM.unmountComponentAtNode(this.uiContainer);
      if (this.uiContainer.parentNode) {
        this.uiContainer.parentNode.removeChild(this.uiContainer);
      }
    }
  }
}

export default EncounterPlugin;
