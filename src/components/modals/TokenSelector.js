import React, { useState } from 'react';
import FancyButton from '../buttons/FancyButton';

const TokenSelector = ({ onSelect, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('femme'); // or 'masc'

  // Define token categories
  const tokenCategories = {
    femme: [
      { type: 'Battlemage', count: 3 },
      { type: 'Druid', count: 4 },
      { type: 'Fighter', count: 5 },
      { type: 'Knight', count: 1 },
      { type: 'Monk', count: 3 },
      { type: 'Rogue', count: 9 },
      { type: 'Sorceress', count: 3 }
    ],
    masc: [
      { type: 'Alchemist', count: 4 },
      { type: 'Fighter', count: 3 },
      { type: 'R.Mage', count: 3 }
    ]
  };

  const getTokenPath = (type, gender, index) => {
    return require(`../../assets/images/player.tokens/${type} (${gender}) (${index}).png`);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      border: '2px solid #b8860b',
      borderRadius: '8px',
      padding: '20px',
      zIndex: 2100,
      maxWidth: '800px',
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <FancyButton
          onClick={() => setSelectedCategory('femme')}
          style={{ opacity: selectedCategory === 'femme' ? 1 : 0.6 }}
        >
          Femme Tokens
        </FancyButton>
        <FancyButton
          onClick={() => setSelectedCategory('masc')}
          style={{ opacity: selectedCategory === 'masc' ? 1 : 0.6 }}
        >
          Masc Tokens
        </FancyButton>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
        gap: '10px',
        padding: '10px'
      }}>
        {tokenCategories[selectedCategory].map(({ type, count }) => (
          Array.from({ length: count }, (_, i) => (
            <div
              key={`${type}-${i + 1}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <img
                src={getTokenPath(type, selectedCategory === 'femme' ? 'F' : 'M', i + 1)}
                alt={`${type} ${i + 1}`}
                style={{
                  width: '80px',
                  height: '80px',
                  cursor: 'pointer',
                  border: '1px solid #b8860b',
                  borderRadius: '4px'
                }}
                onClick={() => onSelect(getTokenPath(type, selectedCategory === 'femme' ? 'F' : 'M', i + 1))}
              />
              <div style={{ color: '#b8860b', fontSize: '12px' }}>
                {type} #{i + 1}
              </div>
            </div>
          ))
        ))}
      </div>

      <FancyButton
        onClick={onClose}
        style={{ marginTop: '20px' }}
      >
        Close
      </FancyButton>
    </div>
  );
};

export default TokenSelector;
