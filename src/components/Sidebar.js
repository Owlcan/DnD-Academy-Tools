import React, { useMemo, useState } from 'react';
import FancyButton from './buttons/FancyButton';

const MonsterSection = ({ title, monsters, addEnemyToken, isOpen, onToggle }) => (
  <div style={{ marginBottom: '10px' }}>
    <div 
      onClick={onToggle} 
      style={{ 
        color: '#b8860b', 
        marginBottom: '5px', 
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
      }}
    >
      <span>{isOpen ? '▼' : '►'}</span>
      <span>{title} ({monsters.length})</span>
    </div>

    {isOpen && (
      <div style={{
        maxHeight: 'calc(70vh - 160px)',
        overflowY: 'auto',
        marginLeft: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
      }}>
        {monsters.map((monster, index) => {
          const cr = monster.stats?.challengeRating ?? monster.stats?.challengeRatingStr;
          const crText = cr !== undefined ? ` (CR ${cr})` : '';
          return (
            <FancyButton
              key={monster.name + index}
              onClick={() => addEnemyToken(monster)}
              style={{ width: '100%', textAlign: 'left', padding: '5px 10px' }}
            >
              {monster.name}{crText}
            </FancyButton>
          );
        })}
      </div>
    )}
  </div>
);

const Sidebar = ({
  addExtraPlayerToken,
  addSpecialToken,
  removePlayerTokens,
  monsters,
  addEnemyToken,
  removeEnemyTokens,
  resetApp,
  uploadPlayerToken,
  saveGame,
  loadGame
}) => {
  const [darklingsSectionOpen, setDarklingsSectionOpen] = useState(true);
  const [darkformesSectionOpen, setDarkformesSectionOpen] = useState(true);

  const [search, setSearch] = useState('');
  const lc = (s) => (s || '').toLowerCase();
  const filtered = useMemo(() => {
    if (!search) return monsters;
    const q = lc(search);
    return monsters.filter(m => lc(m.name).includes(q) || lc(m.type).includes(q) || lc(m.stats?.size || '').includes(q));
  }, [monsters, search]);
  const darklings = filtered.filter(m => 
    lc(m.name).includes('darkling') && !lc(m.name).includes('darkforme')
  );
  const darkformes = filtered.filter(m => 
    !lc(m.name).includes('darkling') || lc(m.name).includes('darkforme')
  );

  return (
    <div style={{
      position: 'fixed',
      left: '10px',
      top: '10px',
      width: '300px',
      background: 'rgba(0,0,0,0.95)',
      border: '1px solid #b8860b',
      borderRadius: '8px',
      padding: '20px',
      color: 'gold',
      zIndex: 1000,
      maxHeight: '90vh',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <FancyButton onClick={addExtraPlayerToken}>Add Player Token</FancyButton>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <FancyButton onClick={() => addSpecialToken('yellow-flag')} style={{ flex: '1 0 30%' }}>Flag</FancyButton>
          <FancyButton onClick={() => addSpecialToken('down-marker')} style={{ flex: '1 0 30%' }}>Down</FancyButton>
          <FancyButton onClick={() => addSpecialToken('arenaball')} style={{ flex: '1 0 30%' }}>Arenaball</FancyButton>
        </div>
        <input
          type="text"
          placeholder="Search monsters..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px',
            borderRadius: '6px',
            border: '1px solid #b8860b',
            background: 'rgba(0,0,0,0.6)',
            color: 'gold'
          }}
        />
        <input
          type="file"
          id="playerTokenUpload"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              uploadPlayerToken(null, file);
              e.target.value = ''; // Reset input after upload
            }
          }}
          accept="image/*"
        />
        <label htmlFor="playerTokenUpload">
          <FancyButton as="div" style={{ cursor: 'pointer', width: '100%' }}>
            Upload Player Token
          </FancyButton>
        </label>
        <FancyButton onClick={removePlayerTokens}>Remove Players</FancyButton>
        <FancyButton onClick={removeEnemyTokens}>Remove Enemies</FancyButton>
      </div>

      <div style={{ margin: '10px 0', borderTop: '1px solid #b8860b', paddingTop: '10px' }}>
        <MonsterSection
          title="Darklings"
          monsters={darklings}
          addEnemyToken={addEnemyToken}
          isOpen={darklingsSectionOpen}
          onToggle={() => setDarklingsSectionOpen(!darklingsSectionOpen)}
        />

        <MonsterSection
          title="Darkformes & Others"
          monsters={darkformes}
          addEnemyToken={addEnemyToken}
          isOpen={darkformesSectionOpen}
          onToggle={() => setDarkformesSectionOpen(!darkformesSectionOpen)}
        />
      </div>

      <div style={{ borderTop: '1px solid #b8860b', paddingTop: '10px' }}>
        <FancyButton onClick={saveGame}>Save Game</FancyButton>
        <FancyButton onClick={loadGame}>Load Game</FancyButton>
        <FancyButton onClick={resetApp}>Reset Game</FancyButton>
      </div>
    </div>
  );
};

export default Sidebar;
