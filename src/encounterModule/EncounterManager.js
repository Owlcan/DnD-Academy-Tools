import React, { useEffect, useState } from 'react';
import EncounterButtons from './EncounterButtons';
import './EncounterManager.css';

/**
 * Encounter Manager Component
 * Handles integration of encounter generation with the main application
 */
const EncounterManager = ({ bestiary, dungeonRef }) => {
  const [activeEncounter, setActiveEncounter] = useState(null);

  // Handler for when an encounter is generated
  const handleEncounterGenerated = (encounter) => {
    setActiveEncounter(encounter);
  };

  // Handler for when an encounter is cleared
  const handleEncounterCleared = () => {
    setActiveEncounter(null);
  };

  return (
    <div className="encounter-manager">
      <EncounterButtons 
        bestiary={bestiary}
        dungeonGenerator={dungeonRef?.current}
        onGenerate={handleEncounterGenerated}
        onClear={handleEncounterCleared}
      />
      
      {activeEncounter && (
        <div className="encounter-details">
          <div className="encounter-stats">
            <div className="encounter-stat">
              <span className="label">Room Size:</span>
              <span className="value">{activeEncounter.width}x{activeEncounter.height}</span>
            </div>
            <div className="encounter-stat">
              <span className="label">Monsters:</span>
              <span className="value">
                {activeEncounter.entities.filter(e => e.type === 'monster').length}
              </span>
            </div>
            {activeEncounter.entities.some(e => e.properties?.isBoss) && (
              <div className="encounter-stat boss">
                <span className="label">Boss:</span>
                <span className="value">Yes</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EncounterManager;
