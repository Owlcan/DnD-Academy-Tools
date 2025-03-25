import React, { useState, useEffect } from 'react';
import { Text } from 'react-konva';
import { FancyButton } from './FancyButton';
import { CustomAlert } from './CustomAlert';

const MonsterModal = ({ token, onClose, onRemove }) => {
  const [isPinned, setIsPinned] = useState(false);
  const [position, setPosition] = useState({
    x: window.innerWidth / 2 - 300,
    y: window.innerHeight / 2 - 200,
  });
  const [dragOffset, setDragOffset] = useState(null);
  const [trusted, setTrusted] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  // ...existing handleMouseDown and useEffect code from App.js...

  const modalStyle = {
    position: "absolute",
    top: position.y,
    left: position.x,
    background: "rgba(0,0,0,0.95)",
    border: "2px solid #b8860b",
    color: "gold",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 0 20px rgba(184, 134, 11, 0.3)",
    zIndex: 2000,
    fontFamily: "'Cinzel', serif",
    maxWidth: "600px",
    maxHeight: "80vh",
    overflowY: "auto",
    textAlign: "center",
  };

  // ...existing rollAttack function from App.js...

  return (
    <>
      <div style={modalStyle} onMouseDown={handleMouseDown}>
        {/* ...existing header code... */}
        
        {trusted ? (
          <div style={{ textAlign: "left", marginTop: "20px" }}>
            {token.details && (
              <>
                <div style={{ 
                  borderBottom: '1px solid #b8860b',
                  marginBottom: '10px',
                  paddingBottom: '5px'
                }}>
                  <h3 style={{ color: "#ffd700", margin: '0 0 5px 0' }}>
                    {token.name}
                  </h3>
                  <div style={{ color: '#aaa', fontSize: '14px' }}>
                    {token.details.stats.size} {token.details.stats.race}, {token.details.stats.alignment}
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <strong>Armor Class:</strong> {token.details.stats.armorClass} {token.details.stats.armorTypeStr}<br/>
                  <strong>Hit Points:</strong> {token.details.stats.hitPoints} ({token.details.stats.hitPointsStr})<br/>
                  <strong>Speed:</strong> {token.details.stats.speed}
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: '10px',
                  textAlign: 'center',
                  margin: '10px 0',
                  padding: '10px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '4px'
                }}>
                  {Object.entries(token.details.stats.abilityScoreStrs).map(([ability, value]) => (
                    <div key={ability}>
                      <div style={{ color: '#ffd700' }}>{ability.toUpperCase()}</div>
                      <div>{value}</div>
                    </div>
                  ))}
                </div>

                {token.details.stats.actions && (
                  <div style={{ marginTop: '20px' }}>
                    <h4 style={{ color: "#ffd700", marginBottom: '10px' }}>Actions</h4>
                    {token.details.stats.actions.map((action, index) => (
                      <div key={index} style={{ marginBottom: "10px" }}>
                        <FancyButton
                          onClick={() => rollAttack(action)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "8px",
                            backgroundColor: "rgba(0,0,0,0.5)"
                          }}
                        >
                          <strong>{action.name}</strong>
                          <br />
                          <span style={{ fontSize: "0.9em" }}>{action.description}</span>
                        </FancyButton>
                      </div>
                    ))}
                  </div>
                )}

                {token.details.stats.additionalAbilities?.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <h4 style={{ color: "#ffd700", marginBottom: '10px' }}>Special Abilities</h4>
                    {token.details.stats.additionalAbilities.map((ability, index) => (
                      <div key={index} style={{ marginBottom: '10px' }}>
                        <strong>{ability.name}.</strong> {ability.description}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div style={{ marginTop: "10px", fontSize: "14px" }}>
            <p><strong>Basic Info:</strong> {token.name}</p>
            <p><strong>Type:</strong> {token.tokenType || "Unknown"}</p>
          </div>
        )}
        
        <FancyButton
          onClick={() => setTrusted(true)}
          style={{ marginTop: "10px", fontSize: "14px" }}
        >
          Trust & Reveal Stat Block
        </FancyButton>
        
        <FancyButton
          onClick={() => onRemove(token.id)}
          style={{ marginTop: "10px", fontSize: "14px" }}
        >
          Remove Monster
        </FancyButton>
      </div>
      
      {alertMessage && (
        <CustomAlert 
          message={alertMessage} 
          onClose={() => setAlertMessage(null)} 
        />
      )}
    </>
  );
};

export default MonsterModal;
