import React, { useState, useEffect, useRef } from 'react';
import EncounterGenerator from './EncounterGenerator';
import EncounterButtons from './EncounterButtons';

/**
 * Container component for the encounter generator system
 * This connects the generator to the main application
 */
const EncounterContainer = ({ bestiary, dungeonGenerator }) => {
  const [generator, setGenerator] = useState(null);
  const [hasEncounter, setHasEncounter] = useState(false);
  
  // Initialize generator when bestiary is available
  useEffect(() => {
    if (bestiary && bestiary.creatures) {
      setGenerator(new EncounterGenerator(bestiary));
    }
  }, [bestiary]);
  
  // Check if dungeon generator has an active encounter
  useEffect(() => {
    if (dungeonGenerator) {
      setHasEncounter(dungeonGenerator.hasEncounter());
    }
  }, [dungeonGenerator]);
  
  const handleGenerateSingleEncounter = () => {
    if (!generator || !dungeonGenerator) return;
    
    const encounter = generator.generateSinglePlayerEncounter();
    dungeonGenerator.loadEncounter(encounter);
    setHasEncounter(true);
  };
  
  const handleGenerateGroupEncounter = () => {
    if (!generator || !dungeonGenerator) return;
    
    const encounter = generator.generateGroupEncounter();
    dungeonGenerator.loadEncounter(encounter);
    setHasEncounter(true);
  };
  
  const handleClearEncounter = () => {
    if (!dungeonGenerator) return;
    
    dungeonGenerator.clearEncounter();
    setHasEncounter(false);
  };
  
  return (
    <div className="encounter-container">
      <EncounterButtons
        onGenerateSingle={handleGenerateSingleEncounter}
        onGenerateGroup={handleGenerateGroupEncounter}
        onClear={handleClearEncounter}
        hasEncounter={hasEncounter}
      />
    </div>
  );
};

export default EncounterContainer;
