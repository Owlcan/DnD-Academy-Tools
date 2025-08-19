import React, { useEffect, useRef } from 'react';
import { CombatMenu } from './CombatMenu';

/**
 * React component wrapper for the imperative CombatMenu class
 * This properly creates and manages the lifecycle of the CombatMenu
 */
const CombatMenuWrapper = ({ gameState }) => {
  const containerRef = useRef(null);
  const menuInstanceRef = useRef(null);
  
  useEffect(() => {
    // Only create a menu instance if we have both the container and gameState
    if (containerRef.current && gameState) {
      // Clean up any existing menu instance first
      if (menuInstanceRef.current) {
        try {
          // Remove old menu elements if they exist
          while (containerRef.current.firstChild) {
            containerRef.current.removeChild(containerRef.current.firstChild);
          }
        } catch (e) {
          console.error("Error cleaning up previous menu:", e);
        }
      }
      
      // Create a new menu instance
      try {
        const menuInstance = new CombatMenu(gameState, containerRef.current);
        menuInstanceRef.current = menuInstance;
      } catch (e) {
        console.error("Error creating CombatMenu:", e);
      }
    }
    
    // Cleanup function for when component unmounts
    return () => {
      if (containerRef.current) {
        try {
          // Remove all children
          while (containerRef.current.firstChild) {
            containerRef.current.removeChild(containerRef.current.firstChild);
          }
        } catch (e) {
          console.error("Error during cleanup:", e);
        }
      }
    };
  }, [gameState]); // Only re-run if gameState changes
  
  // Just return a container div with ref
  return <div id="combat-menu-container" className="combat-menu-wrapper" ref={containerRef}></div>;
};

export default CombatMenuWrapper;