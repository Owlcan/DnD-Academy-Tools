import React, { useState, useCallback, useEffect } from 'react';
import FancyButton from '../buttons/FancyButton';

const ModalMonster = ({ token, onClose, onRemove, onCollectXP }) => {
  const [trusted, setTrusted] = useState(false);
  const [rollResults, setRollResults] = useState([]);
  const [position, setPosition] = useState({ x: window.innerWidth/2 - 300, y: window.innerHeight/2 - 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

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

  const rollAttack = (action) => {
    const roll = Math.floor(Math.random() * 20) + 1;
    const attackBonus = parseInt(action.description.match(/\+(\d+)/)?.[1] || 0);
    const totalAttack = roll + attackBonus;

    const damageMatch = action.description.match(/(\d+)d(\d+)\s*\+?\s*(\d+)?/);
    let damageRoll = 0;
    if (damageMatch) {
      const [_, numDice, diceType, bonus] = damageMatch;
      for (let i = 0; i < parseInt(numDice); i++) {
        damageRoll += Math.floor(Math.random() * parseInt(diceType)) + 1;
      }
      if (bonus) damageRoll += parseInt(bonus);
    }

    const result = `${action.name}: Attack ${totalAttack} (${roll}+${attackBonus}), Damage ${damageRoll}`;
    setRollResults(prev => [result, ...prev.slice(0, 4)]);
  };

  const handleCollectXP = () => {
    const xp = token.details.stats.experiencePoints || 0;
    onCollectXP(xp);
    onRemove(token.id);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        transform: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        background: 'rgba(0,0,0,0.95)',
        padding: '30px',
        borderRadius: '12px',
        border: '2px solid #b8860b',
        color: 'gold',
        zIndex: 2000,
        minWidth: '400px',
        maxWidth: trusted ? '800px' : '400px',
        maxHeight: '90vh',
        overflowY: 'auto',
        fontFamily: "'Cinzel', serif",
        boxShadow: '0 0 30px rgba(184, 134, 11, 0.4)',
        transition: 'all 0.3s ease-in-out'
      }}
      onMouseDown={handleMouseDown}
    >
      <div style={{ 
        display: 'flex', 
        flexDirection: trusted ? 'row' : 'column',
        gap: '20px',
        alignItems: trusted ? 'flex-start' : 'center'
      }}>
        <div style={{
          flexShrink: 0,
          width: trusted ? '200px' : '300px',
          transition: 'width 0.3s ease-in-out'
        }}>
          {token.image && (
            <img
              src={token.image}
              alt={token.name}
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '8px',
                border: '2px solid #b8860b',
                boxShadow: '0 0 15px rgba(184, 134, 11, 0.3)'
              }}
            />
          )}
          <h3 style={{ 
            textAlign: 'center', 
            margin: '10px 0',
            borderBottom: '1px solid #b8860b',
            paddingBottom: '5px'
          }}>
            {token.name}
          </h3>
        </div>

        {trusted ? (
          <div style={{ flex: 1 }}>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              marginBottom: '20px',
              background: 'rgba(184, 134, 11, 0.1)',
              padding: '15px',
              borderRadius: '8px'
            }}>
              <div>
                <div style={{ color: '#ffd700' }}>Armor Class</div>
                <div>{token.details.stats.armorClass}</div>
              </div>
              <div>
                <div style={{ color: '#ffd700' }}>Hit Points</div>
                <div>{token.details.stats.hitPoints}</div>
              </div>
              <div>
                <div style={{ color: '#ffd700' }}>Speed</div>
                <div>{token.details.stats.speed}</div>
              </div>
            </div>

            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '10px',
              marginBottom: '20px',
              background: 'rgba(0,0,0,0.3)',
              padding: '15px',
              borderRadius: '8px'
            }}>
              {Object.entries(token.details.stats.abilityScoreStrs).map(([ability, value]) => (
                <div key={ability} style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ffd700', fontSize: '0.9em' }}>{ability.toUpperCase()}</div>
                  <div>{value}</div>
                </div>
              ))}
            </div>

            {token.details.stats.actions && (
              <div>
                <h4 style={{ 
                  color: '#ffd700', 
                  marginBottom: '10px',
                  borderBottom: '1px solid #b8860b',
                  paddingBottom: '5px'
                }}>
                  Actions
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {token.details.stats.actions.map((action, index) => (
                    <FancyButton
                      key={index}
                      onClick={() => rollAttack(action)}
                      style={{
                        textAlign: 'left',
                        padding: '8px 12px',
                        background: 'rgba(0,0,0,0.3)'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{action.name}</div>
                      <div style={{ fontSize: '0.9em', opacity: 0.9 }}>{action.description}</div>
                    </FancyButton>
                  ))}
                </div>
              </div>
            )}

            {rollResults.length > 0 && (
              <div style={{
                marginTop: '20px',
                padding: '10px',
                background: 'rgba(184, 134, 11, 0.1)',
                borderRadius: '8px'
              }}>
                {rollResults.map((result, index) => (
                  <div key={index} style={{ 
                    opacity: 1 - (index * 0.2),
                    marginBottom: '5px'
                  }}>
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <FancyButton onClick={() => setTrusted(true)}>
            View Full Stats
          </FancyButton>
        )}
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '10px',
        marginTop: '20px',
        borderTop: '1px solid #b8860b',
        paddingTop: '20px'
      }}>
        <FancyButton onClick={() => onRemove(token.id)}>Remove</FancyButton>
        <FancyButton onClick={handleCollectXP}>
          Remove and Collect XP ({token.details.stats.experiencePoints || 0})
        </FancyButton>
        <FancyButton onClick={onClose}>Close</FancyButton>
      </div>
    </div>
  );
};

export default ModalMonster;
