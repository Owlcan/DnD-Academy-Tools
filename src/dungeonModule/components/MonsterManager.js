import React, { useState, useEffect } from 'react';
import { CATEGORIZED_MONSTERS } from '../data/bestiary/index';

/**
 * Component for managing monster selection and placement
 */
const MonsterManager = ({ onSelectMonster }) => {
  const [selectedCategory, setSelectedCategory] = useState('small');
  const [selectedMonster, setSelectedMonster] = useState(null);
  
  // Set a default selected monster when category changes
  useEffect(() => {
    const monsters = CATEGORIZED_MONSTERS[selectedCategory] || [];
    if (monsters.length > 0) {
      setSelectedMonster(monsters[0]);
    } else {
      setSelectedMonster(null);
    }
  }, [selectedCategory]);
  
  // Handle monster selection
  const handleMonsterSelect = (monster) => {
    setSelectedMonster(monster);
    if (onSelectMonster) {
      // Pass complete monster data to parent
      onSelectMonster({
        ...monster,
        tokenSize: getMonsterSize(monster)
      });
    }
  };
  
  // Determine monster size from various possible formats
  const getMonsterSize = (monster) => {
    // First check for explicit tokenSize in the monster data
    if (monster.tokenSize) {
      return monster.tokenSize;
    }
    
    // Then check size array
    if (monster.size && Array.isArray(monster.size) && monster.size.length > 0) {
      const sizeCode = monster.size[0];
      if (sizeCode === 'G') return 4;      // Gargantuan
      else if (sizeCode === 'H') return 3; // Huge
      else if (sizeCode === 'L') return 2; // Large
      else return 1;                       // Medium or smaller
    }
    
    // Finally check text size in stats
    if (monster.stats && monster.stats.size) {
      const sizeText = monster.stats.size.toLowerCase();
      if (sizeText === 'gargantuan') return 4;
      else if (sizeText === 'huge') return 3;
      else if (sizeText === 'large') return 2;
      else return 1; // Medium, Small, or Tiny
    }
    
    // Default to medium (1x1) if no size info found
    return 1;
  };
  
  // Capitalize first letter of each word in a string
  const capitalizeWords = (str) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
  };
  
  return (
    <div className="monster-manager">
      <h3>Monsters</h3>
      
      {/* Category selection */}
      <div className="monster-categories">
        <button 
          className={selectedCategory === 'tiny' ? 'active' : ''} 
          onClick={() => setSelectedCategory('tiny')}
        >
          Tiny
        </button>
        <button 
          className={selectedCategory === 'small' ? 'active' : ''} 
          onClick={() => setSelectedCategory('small')}
        >
          Small
        </button>
        <button 
          className={selectedCategory === 'medium' ? 'active' : ''} 
          onClick={() => setSelectedCategory('medium')}
        >
          Medium
        </button>
        <button 
          className={selectedCategory === 'large' ? 'active' : ''} 
          onClick={() => setSelectedCategory('large')}
        >
          Large
        </button>
        <button 
          className={selectedCategory === 'huge' ? 'active' : ''} 
          onClick={() => setSelectedCategory('huge')}
        >
          Huge
        </button>
      </div>
      
      {/* Monster list */}
      <div className="monster-list">
        {CATEGORIZED_MONSTERS[selectedCategory] && CATEGORIZED_MONSTERS[selectedCategory].map((monster, index) => (
          <div 
            key={index} 
            className={`monster-item ${selectedMonster === monster ? 'selected' : ''}`}
            onClick={() => handleMonsterSelect(monster)}
          >
            <span className="monster-name">{monster.name}</span>
            <span className="monster-cr">CR {monster.stats.challengeRating}</span>
          </div>
        ))}
      </div>
      
      {/* Selected monster details */}
      {selectedMonster && (
        <div className="monster-details">
          <h4>{selectedMonster.name}</h4>
          <p>Type: {capitalizeWords(selectedMonster.type || '')}</p>
          <p>Size: {selectedMonster.stats.size} ({getMonsterSize(selectedMonster)}×{getMonsterSize(selectedMonster)})</p>
          <p>CR: {selectedMonster.stats.challengeRating}</p>
          <p>HP: {selectedMonster.stats.hitPoints}</p>
          <p>AC: {selectedMonster.stats.armorClass}</p>
          
          {selectedMonster.stats.attacks && selectedMonster.stats.attacks.length > 0 && (
            <>
              <h5>Attacks:</h5>
              <ul>
                {selectedMonster.stats.attacks.map((attack, idx) => (
                  <li key={idx}>{attack.name}</li>
                ))}
              </ul>
            </>
          )}
          
          <button 
            className="place-monster-btn"
            onClick={() => handleMonsterSelect(selectedMonster)}
          >
            Place on Map
          </button>
        </div>
      )}
    </div>
  );
};

export default MonsterManager;