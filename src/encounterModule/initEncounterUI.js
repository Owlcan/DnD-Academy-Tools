import EncounterPlugin from './EncounterPlugin';

/**
 * Initialize encounter UI by attaching it to the dungeon renderer
 * This can be called from anywhere without modifying App.js
 * @param {Object} bestiary - The bestiary data
 */
export function initEncounterUI(bestiary) {
  // Find the dungeon renderer container
  const dungeonContainer = document.querySelector('.dungeon-renderer-container') || 
                           document.querySelector('.dungeon-view');
  
  if (!dungeonContainer) {
    console.warn('Could not find dungeon container to attach encounter UI');
    return null;
  }
  
  // Find the dungeon renderer instance (React component)
  // This is a bit hacky but works without modifying the core app
  let dungeonRenderer = null;
  for (const key in dungeonContainer) {
    if (key.startsWith('__reactInternalInstance$') || key.startsWith('__reactFiber$')) {
      const fiber = dungeonContainer[key];
      // Navigate up the fiber tree to find the component
      let node = fiber;
      while (node) {
        if (node.stateNode && node.stateNode.constructor && 
            node.stateNode.constructor.name === 'DungeonRenderer') {
          dungeonRenderer = node.stateNode;
          break;
        }
        node = node.return;
      }
      if (dungeonRenderer) break;
    }
  }
  
  if (!dungeonRenderer) {
    console.warn('Could not find dungeon renderer component');
  }
  
  // Initialize the plugin
  const plugin = new EncounterPlugin();
  return plugin.initialize(dungeonContainer, dungeonRenderer, bestiary);
}

// Auto-initialize after page load (can be removed if you want manual initialization)
document.addEventListener('DOMContentLoaded', () => {
  // Try to get bestiary from window object (if app exposes it)
  // Or can be initialized later with proper bestiary
  setTimeout(() => {
    const bestiary = window.bestiary || window.appState?.bestiary;
    if (bestiary) {
      initEncounterUI(bestiary);
    }
  }, 1000); // Short delay to ensure dungeon renderer is mounted
});

export default initEncounterUI;
