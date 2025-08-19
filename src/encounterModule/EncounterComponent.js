import React, { useState, useEffect } from 'react';
import EncounterGenerator from './EncounterGenerator';

/**
 * Encounter Component - UI for generating encounters
 */
const EncounterComponent = ({ bestiary, onGenerateEncounter, onClearEncounter }) => {
  const [generator, setGenerator] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Initialize generator when bestiary is loaded
  useEffect(() => {
    if (bestiary && bestiary.creatures) {
      setGenerator(new EncounterGenerator(bestiary));
    }
  }, [bestiary]);
  
  const handleGenerateSinglePlayer = () => {
    if (!generator) return;
    
    setLoading(true);
    try {
      const encounter = generator.generateSinglePlayerEncounter();
      setLoading(false);
      if (onGenerateEncounter) {
        onGenerateEncounter(encounter);
      }
    } catch (err) {
      setError('Error generating encounter: ' + err.message);
      setLoading(false);
    }
  };
  
  const handleGenerateGroup = () => {
    if (!generator) return;
    
    setLoading(true);
    try {
      const encounter = generator.generateGroupEncounter();
      setLoading(false);
      if (onGenerateEncounter) {
        onGenerateEncounter(encounter);
      }
    } catch (err) {
      setError('Error generating encounter: ' + err.message);
      setLoading(false);
    }
  };
  
  const handleClearEncounter = () => {
    if (!generator) return;
    
    if (onClearEncounter) {
      onClearEncounter(generator.clearEncounters());
    }
  };
  
  return (
    <div className="encounter-generator-container">
      <div className="encounter-buttons">
        <button 
          onClick={handleGenerateSinglePlayer} 
          disabled={loading || !generator}
          className="encounter-button single-player"
        >
          Generate Single Player Encounter
        </button>
        <button 
          onClick={handleGenerateGroup} 
          disabled={loading || !generator}
          className="encounter-button group-player"
        >
          Generate Group Encounter
        </button>
        <button 
          onClick={handleClearEncounter} 
          disabled={loading || !generator}
          className="encounter-button clear"
        >
          Clear Encounter
        </button>
      </div>
      
      {loading && <div className="loading-indicator">Generating encounter...</div>}
      {error && <div className="error-message">{error}</div>}
      
      <style jsx>{`
        .encounter-generator-container {
          margin: 10px 0;
          padding: 10px;
          background-color: rgba(0,0,0,0.1);
          border-radius: 5px;
        }
        
        .encounter-buttons {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
        }
        
        .encounter-button {
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.2s ease;
          min-width: 200px;
        }
        
        .encounter-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .encounter-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .encounter-button.single-player {
          background-color: #4e9af1;
          color: white;
        }
        
        .encounter-button.group-player {
          background-color: #5fb85f;
          color: white;
        }
        
        .encounter-button.clear {
          background-color: #d9534f;
          color: white;
        }
        
        .loading-indicator {
          margin-top: 10px;
          text-align: center;
          color: #666;
        }
        
        .error-message {
          margin-top: 10px;
          padding: 8px;
          background-color: #f8d7da;
          color: #721c24;
          border-radius: 4px;
        }
        
        @media (max-width: 768px) {
          .encounter-buttons {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default EncounterComponent;
