import React, { useState, useEffect, useCallback, useRef } from 'react';
import FancyButton from '../buttons/FancyButton';
import TokenSelector from './TokenSelector';
import CharacterSheet from './CharacterSheet';

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
  const [size, setSize] = useState({ width: 500, height: 450 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [imageURLInput, setImageURLInput] = useState('');
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [showCharSheet, setShowCharSheet] = useState(false);
  const [characterData, setCharacterData] = useState(token.characterData || {});
  const modalRef = useRef(null);

  useEffect(() => {
    setSize(prev => ({ ...prev, width: showCharSheet ? 600 : 500 }));
  }, [showCharSheet]);

  const handleCharacterDataChange = (newData) => {
    setCharacterData(newData);
    onUpdateField('characterData', newData);
  };

  const handleImportJSON = (importedData) => {
    if (importedData && importedData.character) {
      const charData = importedData.character;
      setCharacterData(charData);
      onUpdateField('characterData', charData);
      
      if (charData.name) {
        onUpdateField('name', charData.name);
      }
      if (charData.hit_points) {
        onUpdateField('hp', charData.hit_points.current || charData.hit_points.max);
        onUpdateField('maxHP', charData.hit_points.max);
      }
    } else {
      alert('Invalid character data format');
    }
  };

  const exportCharacterData = () => {
    if (!characterData || Object.keys(characterData).length === 0) {
      alert('No character data to export');
      return;
    }
    
    const dataToExport = { character: characterData };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${token.name || 'character'}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'TEXTAREA') return;
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
    } else if (isResizing) {
      const newWidth = Math.max(300, resizeStart.width + (e.clientX - resizeStart.x));
      const newHeight = Math.max(300, resizeStart.height + (e.clientY - resizeStart.y));
      
      setSize({
        width: newWidth,
        height: newHeight
      });
    }
  }, [isDragging, isResizing, dragStart, resizeStart]);

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const handleResizeStart = (e) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove]);

  const handleImageInput = (e) => {
    if (e.key === 'Enter') {
      const url = e.target.value.trim();
      if (url) {
        onUpdateImage(url);
        setImageURLInput('');
      }
    }
  };

  const handleTokenSelect = (tokenPath) => {
    onUpdateImage(tokenPath);
    setShowTokenSelector(false);
  };

  return (
    <div 
      ref={modalRef}
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
        width: `${size.width}px`,
        height: `${size.height}px`,
        overflowY: 'auto',
        fontFamily: "'Cinzel', serif",
        boxShadow: '0 0 20px rgba(184, 134, 11, 0.3)',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: 'width 0.3s ease',
        boxSizing: 'border-box'
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

      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <FancyButton
          onClick={() => setShowCharSheet(!showCharSheet)}
          style={{ flex: 1 }}
        >
          {showCharSheet ? 'Hide Character Sheet' : 'Show Character Sheet'}
        </FancyButton>
        
        {showCharSheet && (
          <FancyButton
            onClick={exportCharacterData}
            style={{ fontSize: '14px' }}
          >
            Export Character
          </FancyButton>
        )}
      </div>

      {showCharSheet ? (
        <CharacterSheet
          characterData={characterData}
          onDataChange={handleCharacterDataChange}
          onImportJSON={handleImportJSON}
        />
      ) : (
        <>
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
        </>
      )}

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
          onSelect={handleTokenSelect}
          onClose={() => setShowTokenSelector(false)}
        />
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '20px',
          height: '20px',
          cursor: 'nwse-resize',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          userSelect: 'none',
          padding: '5px',
        }}
        onMouseDown={handleResizeStart}
      >
        <div
          style={{
            width: '10px',
            height: '10px',
            background: '#b8860b',
            clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
          }}
        />
      </div>
    </div>
  );
};

export default ModalWindow;
