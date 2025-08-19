import React, { useState, useEffect } from 'react';
import EncounterGenerator from './EncounterGenerator';
import './EncounterUI.css';

/**
 * Self-contained UI for generating encounters
 * This component manages its own state and directly interacts with the dungeon generator
 */
const EncounterUI = ({ bestiary, dungeonGenerator }) => {
  const [generator, setGenerator] = useState(null);
  const [generatingEncounter, setGeneratingEncounter] = useState(false);
  const [hasActiveEncounter, setHasActiveEncounter] = useState(false);
  const [error, setError] = useState(null);
  
  // Initialize the generator when the component mounts
  useEffect(() => {
    if (bestiary && bestiary.creatures) {
      console.log('Initializing encounter generator with bestiary');
      setGenerator(new EncounterGenerator(bestiary));
    }
  }, [bestiary]);
  
  // Check if dungeon generator has an active encounter
  useEffect(() => {
    if (dungeonGenerator) {
      setHasActiveEncounter(!!dungeonGenerator.encounterActive);
    }
  }, [dungeonGenerator]);
  
  const generateSinglePlayerEncounter = () => {
    if (!generator || !dungeonGenerator) {
      setError('Generator or dungeon reference not available');
      return;
    }
    
    setGeneratingEncounter(true);
    setError(null);
    
    try {
      console.log('Generating single player encounter');
      const encounter = generator.generateSinglePlayerEncounter();
      
      // Update the dungeon with the encounter
      dungeonGenerator.loadEncounter(encounter);
      dungeonGenerator.encounterActive = true;
      setHasActiveEncounter(true);
    } catch (err) {
      console.error('Error generating encounter:', err);
      setError(`Failed to generate encounter: ${err.message}`);
    } finally {
      setGeneratingEncounter(false);
    }
  };
  
  const generateGroupEncounter = () => {
    if (!generator || !dungeonGenerator) {
      setError('Generator or dungeon reference not available');
      return;
    }
    
    setGeneratingEncounter(true);
    setError(null);
    
    try {
      console.log('Generating group encounter');
      const encounter = generator.generateGroupEncounter();
      
      // Update the dungeon with the encounter
      dungeonGenerator.loadEncounter(encounter);
      dungeonGenerator.encounterActive = true;
      setHasActiveEncounter(true);
    } catch (err) {
      console.error('Error generating encounter:', err);
      setError(`Failed to generate encounter: ${err.message}`);
    } finally {
      setGeneratingEncounter(false);
    }
  };
  
  const clearEncounter = () => {
    if (!generator || !dungeonGenerator) {
      setError('Generator or dungeon reference not available');
      return;
    }
    
    try {
      console.log('Clearing encounter');
      dungeonGenerator.clearEncounter();
      dungeonGenerator.encounterActive = false;
      setHasActiveEncounter(false);
      setError(null);
    } catch (err) {
      console.error('Error clearing encounter:', err);
      setError(`Failed to clear encounter: ${err.message}`);
    }
  };
  
  return (
    <div className="encounter-ui-container">
      <h3>Encounter Generator</h3>
      
      <div className="encounter-button-group">
        <button 
          className="encounter-button single-player" 
          onClick={generateSinglePlayerEncounter}
          disabled={generatingEncounter || !generator}
        >
          Single Player Encounter
        </button>
        
        <button 
          className="encounter-button group-player" 
          onClick={generateGroupEncounter}
          disabled={generatingEncounter || !generator}
        >
          Group Encounter
        </button>
        
        {hasActiveEncounter && (
          <button 
            className="encounter-button clear" 
            onClick={clearEncounter}
            disabled={generatingEncounter || !generator}
          >
            Clear Encounter
          </button>
        )}
      </div>
      
      {generatingEncounter && (
        <div className="encounter-loading">Generating encounter...</div>
      )}
      
      {error && (
        <div className="encounter-error">{error}</div>
      )}
    </div>
  );
};

export default EncounterUI;
