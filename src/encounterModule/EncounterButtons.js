import React, { useState, useEffect } from 'react';
import EncounterGenerator from './EncounterGenerator';
import './EncounterButtons.css';

/**
 * Encounter Generator Buttons Component
 * Provides controls to generate single-room combat encounters
 */
const EncounterButtons = ({ bestiary, dungeonGenerator, onGenerate, onClear }) => {
  const [generator, setGenerator] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasActiveEncounter, setHasActiveEncounter] = useState(false);

  // Create generator when bestiary is available
  useEffect(() => {
    if (bestiary && bestiary.creatures) {
      setGenerator(new EncounterGenerator(bestiary));
    }
  }, [bestiary]);

  // Update active encounter state when dungeonGenerator changes
  useEffect(() => {
    if (dungeonGenerator) {
      setHasActiveEncounter(dungeonGenerator.encounterActive || false);
    }
  }, [dungeonGenerator]);

  // Generate a single-player encounter
  const handleSinglePlayerEncounter = () => {
    if (!generator || !dungeonGenerator) return;
    
    setIsGenerating(true);
    try {
      // Generate the encounter
      const encounter = generator.generateSinglePlayerEncounter();
      
      // Update the dungeon with the encounter data
      dungeonGenerator.loadEncounter(encounter);
      dungeonGenerator.encounterActive = true;
      
      // Notify parent component
      if (onGenerate) {
        onGenerate(encounter);
      }
      
      setHasActiveEncounter(true);
    } catch (error) {
      console.error('Error generating single player encounter:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate a group encounter
  const handleGroupEncounter = () => {
    if (!generator || !dungeonGenerator) return;
    
    setIsGenerating(true);
    try {
      // Generate the encounter
      const encounter = generator.generateGroupEncounter();
      
      // Update the dungeon with the encounter data
      dungeonGenerator.loadEncounter(encounter);
      dungeonGenerator.encounterActive = true;
      
      // Notify parent component
      if (onGenerate) {
        onGenerate(encounter);
      }
      
      setHasActiveEncounter(true);
    } catch (error) {
      console.error('Error generating group encounter:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Clear the current encounter
  const handleClearEncounter = () => {
    if (!dungeonGenerator) return;
    
    try {
      // Clear the encounter from dungeon
      dungeonGenerator.clearEncounter();
      dungeonGenerator.encounterActive = false;
      
      // Notify parent component
      if (onClear) {
        onClear();
      }
      
      setHasActiveEncounter(false);
    } catch (error) {
      console.error('Error clearing encounter:', error);
    }
  };

  return (
    <div className="encounter-buttons">
      <div className="encounter-buttons-header">
        <h3>Encounter Generator</h3>
      </div>
      
      <div className="encounter-buttons-controls">
        <button 
          className="encounter-button single-player" 
          onClick={handleSinglePlayerEncounter}
          disabled={isGenerating}
        >
          Single Player Encounter
        </button>
        
        <button 
          className="encounter-button group-player" 
          onClick={handleGroupEncounter}
          disabled={isGenerating}
        >
          Group Encounter
        </button>
        
        {hasActiveEncounter && (
          <button 
            className="encounter-button clear" 
            onClick={handleClearEncounter}
          >
            Clear Encounter
          </button>
        )}
      </div>
      
      {isGenerating && (
        <div className="encounter-generating">
          Generating encounter...
        </div>
      )}
    </div>
  );
};

export default EncounterButtons;
