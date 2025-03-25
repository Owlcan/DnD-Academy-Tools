import React, { useState, useEffect, useCallback } from 'react';
import FancyButton from '../buttons/FancyButton';
import TokenSelector from './TokenSelector';

const STATUS_CONDITIONS = {
  rage: { label: "Rage (+2 damage, resistance to physical)", icon: "😠" },
  confused: { label: "Confused (random movement)", icon: "😵" },
  asleep: { label: "Asleep (incapacitated)", icon: "😴" },
  poisoned: { label: "Poisoned (disadvantage)", icon: "🤢" },
  paralyzed: { label: "Paralyzed (incapacitated)", icon: "⚡" },
  stunned: { label: "Stunned (incapacitated)", icon: "💫" },
  prone: { label: "Prone (-speed, disadvantage)", icon: "⊝" },
  grappled: { label: "Grappled (0 speed)", icon: "🤼" },
  frightened: { label: "Frightened (can't move closer)", icon: "😱" },
  charmed: { label: "Charmed (can't attack source)", icon: "❧" },
  exhaustion: { label: "Exhaustion (-speed, disadvantage)", icon: "😫" },
  blessed: { label: "Blessed (+1d4 to rolls)", icon: "✨" },
  cursed: { label: "Cursed (-1d4 to rolls)", icon: "⚔️" },
  hasted: { label: "Hasted (double speed, +2 AC)", icon: "⏱️" },
  slowed: { label: "Slowed (half speed, -2 AC)", icon: "⏰" },
  invisible: { label: "Invisible (advantage on attacks)", icon: "👻" },
  bloodied: { label: "Bloodied (below half HP)", icon: "🩸" },
  marked: { label: "Marked (disadvantage vs others)", icon: "◎" },
  burning: { label: "Burning (ongoing fire damage)", icon: "🔥" },
  frozen: { label: "Frozen (half speed, vulnerability)", icon: "❄️" },
  deafened: { label: "Deafened (can't hear)", icon: "🔇" },
  blinded: { label: "Blinded (can't see)", icon: "⊘" }
};

const ModalWindow = ({ token, onClose, onUpdateStatus, onUpdateField, onUpdateImage, onRemove }) => {
  const [position, setPosition] = useState({ x: window.innerWidth/2 - 250, y: window.innerHeight/2 - 300 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageURLInput, setImageURLInput] = useState('');  // Fixed state management
  const [showTokenSelector, setShowTokenSelector] = useState(false);

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove]);

  const handleImageInput = (e) => {
    if (e.key === 'Enter') {
      const url = e.target.value.trim();
      if (url) {
        onUpdateImage(url);
        setImageURLInput('');  // Clear input after update
      }
    }
  };

  // Add this callback to handle token selection
  const handleTokenSelect = (tokenPath) => {
    onUpdateImage(tokenPath); // Update the actual token image
    setShowTokenSelector(false);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        transform: 'none',
        background: 'rgba(0,0,0,0.95)',
        padding: '30px',
        borderRadius: '8px',
        border: '1px solid #b8860b',
        color: 'gold',
        zIndex: 2000,
        width: '500px',
        maxHeight: '80vh',
        overflowY: 'auto',
        fontFamily: "'Cinzel', serif",
        boxShadow: '0 0 20px rgba(184, 134, 11, 0.3)',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        {token.image && (
          <img 
            src={token.image} 
            alt={token.name} 
            style={{ 
              width: '100px', 
              height: '100px', 
              objectFit: 'cover',
              borderRadius: '50%',
              border: '2px solid #b8860b'
            }} 
          />
        )}
        <div style={{ flex: 1 }}>
          <input
            value={token.name}
            onChange={(e) => onUpdateField('name', e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid #b8860b',
              color: 'gold',
              padding: '5px',
              width: '100%',
              marginBottom: '10px'
            }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <div>
              <label>HP: </label>
              <input
                type="number"
                value={token.hp || 0}
                onChange={(e) => onUpdateField('hp', e.target.value)}
                style={{
                  width: '60px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid #b8860b',
                  color: 'gold',
                  padding: '5px'
                }}
              />
            </div>
            <div>
              <label>Max HP: </label>
              <input
                type="number"
                value={token.maxHP || 0}
                onChange={(e) => onUpdateField('maxHP', e.target.value)}
                style={{
                  width: '60px',
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid #b8860b',
                  color: 'gold',
                  padding: '5px'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ color: '#b8860b', marginBottom: '10px' }}>Token Size</h4>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <FancyButton onClick={() => onUpdateField('size', (token.size || 40) - 5)}>
            -
          </FancyButton>
          <span>{token.size || 40}px</span>
          <FancyButton onClick={() => onUpdateField('size', (token.size || 40) + 5)}>
            +
          </FancyButton>
        </div>
      </div>

      <div style={{ 
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px' 
      }}>
        <input
          type="text"
          value={imageURLInput}
          onChange={(e) => setImageURLInput(e.target.value)}
          onKeyPress={handleImageInput}
          placeholder="Paste image URL and press Enter"
          style={{
            width: '100%',
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid #b8860b',
            color: 'gold',
            padding: '8px',
            borderRadius: '4px'
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ 
          color: '#b8860b', 
          borderBottom: '1px solid #b8860b', 
          paddingBottom: '5px', 
          marginBottom: '10px' 
        }}>
          Status Conditions
        </h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px'
        }}>
          {Object.entries(STATUS_CONDITIONS).map(([key, {label, icon}]) => (
            <div key={key} style={{ 
              display: 'flex', 
              alignItems: 'center',
              background: token.statuses?.[key] ? 'rgba(184, 134, 11, 0.2)' : 'transparent',
              padding: '5px',
              borderRadius: '4px',
              transition: 'background 0.2s'
            }}>
              <input
                type="checkbox"
                checked={token.statuses?.[key] || false}
                onChange={(e) => onUpdateStatus(key, e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              <span style={{ marginRight: '5px' }}>{icon}</span>
              <label title={label}>
                {label.split('(')[0].trim()}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
        <FancyButton
          onClick={() => setShowTokenSelector(true)}
          style={{ fontSize: '14px' }}
        >
          Choose Character Token
        </FancyButton>
        <FancyButton onClick={() => onRemove(token.id)}>Remove</FancyButton>
        <FancyButton onClick={onClose}>Close</FancyButton>
      </div>

      {showTokenSelector && (
        <TokenSelector
          onSelect={handleTokenSelect}  // Changed from directly using onUpdateImage
          onClose={() => setShowTokenSelector(false)}
        />
      )}
    </div>
  );
};

export default ModalWindow;
