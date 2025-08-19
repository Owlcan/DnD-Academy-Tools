import React from 'react';
import { tokenAspectRatios } from '../constants/tokenDimensions';

const CharacterToken = ({ character, size = 100, showName = true }) => {
  // Extract basic character info
  const name = character?.name || 'Unknown';
  const className = character?.class?.split(' ')[0] || '';
  const level = character?.level || 1;
  const gender = character?.gender || '';
  
  // Determine token image based on class and gender
  const getTokenImage = () => {
    // Default to first Fighter token if no match
    let tokenImage = 'Fighter (M) (1).png';
    
    // Try to find a matching token based on class and gender
    const classLower = className.toLowerCase();
    const genderCode = gender.toLowerCase().startsWith('f') ? 'F' : 'M';
    
    // Map D&D classes to token class names
    const classMap = {
      'fighter': 'Fighter',
      'ranger': 'Fighter', // Use Fighter token for Rangers
      'paladin': 'Knight',
      'barbarian': 'Fighter',
      'rogue': 'Rogue',
      'monk': 'Monk',
      'wizard': 'R.Mage',
      'sorcerer': 'Sorceress',
      'warlock': 'R.Mage',
      'druid': 'Druid',
      'cleric': 'Battlemage',
      'bard': 'Rogue',
      'alchemist': 'Alchemist'
    };
    
    const mappedClass = classMap[classLower] || 'Fighter';
    
    // For female Sorcerers, use Sorceress tokens
    const adjustedClass = classLower === 'sorcerer' && genderCode === 'F' 
      ? 'Sorceress' 
      : mappedClass;
    
    // Look for a matching token in the tokenAspectRatios
    const possibleTokens = Object.keys(tokenAspectRatios).filter(token => 
      token.includes(adjustedClass) && token.includes(`(${genderCode})`)
    );
    
    if (possibleTokens.length > 0) {
      // Use the first matching token
      tokenImage = possibleTokens[0];
    }
    
    return tokenImage;
  };
  
  const tokenImage = getTokenImage();
  const aspectRatio = tokenAspectRatios[tokenImage] || 1;
  
  // Calculate dimensions
  const width = size;
  const height = size / aspectRatio;
  
  // Style for the container
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: `${width}px`,
  };
  
  // Style for the token image
  const tokenStyle = {
    width: `${width}px`,
    height: `${height}px`,
    backgroundImage: `url('/tokens/${tokenImage}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: '50%',
    border: '2px solid #3a0000',
  };
  
  // Style for the text
  const textStyle = {
    fontSize: `${size / 10}px`,
    color: '#e1e1e1',
    textAlign: 'center',
    marginTop: '5px',
    fontWeight: 'bold',
    textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
  };
  
  return (
    <div style={containerStyle}>
      <div style={tokenStyle} title={`${name} - ${className} ${level}`} />
      {showName && (
        <div style={textStyle}>
          {name}
          <div style={{ fontSize: `${size / 12}px`, opacity: 0.8 }}>
            {className} {level}
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterToken;