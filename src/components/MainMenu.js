import React from 'react';

const MainMenu = ({ onAction }) => {
  return (
    <div className="main-menu">
      <div className="menu-section">
        <h3>Encounters</h3>
        <button 
          onClick={() => onAction('generateSingleEncounter')} 
          className="menu-button"
        >
          Generate Single Player Encounter
        </button>
        <button 
          onClick={() => onAction('generateGroupEncounter')} 
          className="menu-button"
        >
          Generate Group Encounter
        </button>
        <button 
          onClick={() => onAction('clearEncounter')} 
          className="menu-button"
        >
          Clear Generated Encounter
        </button>
      </div>
    </div>
  );
};

export default MainMenu;