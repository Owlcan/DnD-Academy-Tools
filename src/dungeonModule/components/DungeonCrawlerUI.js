// DungeonCrawlerUI component - the main interface for the dungeon crawler module
import React, { useState, useEffect, useCallback } from 'react';
import DungeonGenerator from '../DungeonGenerator';
import DungeonRenderer from './DungeonRenderer';
import { CELL_TYPES, DUNGEON_TYPES, DIFFICULTY_LEVELS, THEME_SETTINGS, TRAP_TYPES } from '../constants';
import FancyButton from '../../components/buttons/FancyButton';
import './DungeonCrawlerUI.css';

const DungeonCrawlerUI = ({
  playerCharacter = null,
  onComplete = () => {},
  onCollectReward = () => {},
  onClose = () => {},
}) => {
  // Dungeon state
  const [dungeon, setDungeon] = useState(null);
  const [dungeonType, setDungeonType] = useState(DUNGEON_TYPES.FORGOTTEN_DUNGEON);
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [playerPosition, setPlayerPosition] = useState(null);
  const [gameStatus, setGameStatus] = useState('setup'); // 'setup', 'playing', 'victory', 'defeat'
  const [currentEvent, setCurrentEvent] = useState(null);
  const [gameLog, setGameLog] = useState([]);
  const [revealedCells, setRevealedCells] = useState([]);
  const [playerStats, setPlayerStats] = useState({
    hp: 0,
    maxHp: 0,
    level: 1,
    xp: 0,
    gold: 0,
    collectedItems: []
  });
  
  // Setup options
  const [showOptions, setShowOptions] = useState(true);
  const [dungeonConfig, setDungeonConfig] = useState({
    width: 50,
    height: 50,
    roomSizeMin: 4,
    roomSizeMax: 10,
    maxRooms: 12,
    algorithm: 'bsp',
    includeMandatoryRooms: true,
  });
  
  // Generate a new dungeon
  const generateDungeon = () => {
    // Apply difficulty modifiers
    const diffConfig = DIFFICULTY_LEVELS[difficulty];
    const themeSettings = THEME_SETTINGS[dungeonType];
    
    const config = {
      ...dungeonConfig,
      dungeonType,
      partyLevel: playerStats.level,
      monsterDensity: themeSettings.monsterDensity + (diffConfig?.monsterDensityModifier || 0),
      trapDensity: themeSettings.trapDensity + (diffConfig?.trapDensityModifier || 0),
      treasureDensity: themeSettings.treasureDensity + (diffConfig?.treasureDensityModifier || 0),
    };
    
    // Create and generate the dungeon
    const generator = new DungeonGenerator(config);
    const newDungeon = generator.generate();
    
    // Find player start position
    const startEntity = newDungeon.entities.find(entity => entity.type === 'player_start');
    const startPosition = startEntity 
      ? { x: startEntity.x, y: startEntity.y }
      : { x: Math.floor(newDungeon.config.width / 2), y: Math.floor(newDungeon.config.height / 2) };
    
    // Initialize game
    setDungeon(newDungeon);
    setPlayerPosition(startPosition);
    setRevealedCells([startPosition]);
    setGameStatus('playing');
    setShowOptions(false);
    
    // Initialize player stats
    if (playerCharacter) {
      setPlayerStats({
        hp: playerCharacter.hit_points?.current || 10,
        maxHp: playerCharacter.hit_points?.max || 10,
        level: getCharacterLevel(playerCharacter),
        xp: 0,
        gold: 0,
        collectedItems: []
      });
    }
    
    addToGameLog(`You enter the ${themeSettings.name}...`);
  };
  
  // Get character level from character data
  const getCharacterLevel = (character) => {
    if (!character) return 1;
    if (character.level) return character.level;
    
    // Extract from class string like "Paladin 5"
    if (character.class) {
      const classMatch = character.class.match(/(\d+)/);
      if (classMatch && classMatch[1]) {
        return parseInt(classMatch[1], 10);
      }
    }
    
    return 1;
  };
  
  // Add message to game log
  const addToGameLog = (message) => {
    setGameLog(prev => [...prev, { 
      message, 
      timestamp: new Date().toLocaleTimeString() 
    }]);
  };
  
  // Handle player movement
  const movePlayer = (dx, dy) => {
    if (gameStatus !== 'playing' || !dungeon || !playerPosition) return;
    
    const newX = playerPosition.x + dx;
    const newY = playerPosition.y + dy;
    
    // Check if the move is valid
    if (
      newX < 0 || newX >= dungeon.config.width || 
      newY < 0 || newY >= dungeon.config.height ||
      dungeon.grid[newY][newX] === CELL_TYPES.WALL
    ) {
      // Invalid move - hit a wall
      return;
    }
    
    // Check for entity at the target position
    const entityAtTarget = dungeon.entities.find(e => e.x === newX && e.y === newY);
    
    if (entityAtTarget) {
      // Handle interaction with entity
      const result = handleEntityInteraction(entityAtTarget);
      
      // If interaction prevents movement, abort
      if (result.preventMovement) {
        return;
      }
      
      // If entity should be removed
      if (result.removeEntity) {
        setDungeon(prev => ({
          ...prev,
          entities: prev.entities.filter(e => e !== entityAtTarget)
        }));
      }
    }
    
    // Update player position
    setPlayerPosition({ x: newX, y: newY });
    
    // Add to revealed cells
    setRevealedCells(prev => {
      if (prev.some(cell => cell.x === newX && cell.y === newY)) {
        return prev;
      }
      return [...prev, { x: newX, y: newY }];
    });
  };
  
  // Handle interaction with entity
  const handleEntityInteraction = (entity) => {
    const result = {
      preventMovement: false,
      removeEntity: false
    };
    
    switch (entity.type) {
      case 'monster': {
        // Combat with monster
        result.preventMovement = true;
        
        const monsterName = entity.properties.name || 'Monster';
        addToGameLog(`You encounter a ${monsterName}!`);
        
        // Simulate simple combat - in a complete implementation this would open a combat UI
        const { difficulty, xpValue } = entity.properties;
        const simulateCombat = window.confirm(`Do you want to fight the ${monsterName}?`);
        
        if (simulateCombat) {
          // Simple combat simulation
          const damageToPlayer = calculateDamageToPlayer(difficulty);
          
          if (damageToPlayer >= playerStats.hp) {
            // Player defeated
            setPlayerStats(prev => ({ ...prev, hp: 0 }));
            setGameStatus('defeat');
            addToGameLog(`You were defeated by the ${monsterName}!`);
          } else {
            // Monster defeated
            setPlayerStats(prev => ({
              ...prev,
              hp: prev.hp - damageToPlayer,
              xp: prev.xp + xpValue
            }));
            
            addToGameLog(`You defeated the ${monsterName}! (-${damageToPlayer} HP, +${xpValue} XP)`);
            result.removeEntity = true;
            result.preventMovement = false;
          }
        }
        break;
      }
        
      case 'trap': {
        // Trap triggering
        const trapType = entity.properties.type;
        const trapData = TRAP_TYPES[trapType];
        
        if (!entity.properties.detected) {
          // Player didn't detect the trap
          addToGameLog(`You triggered a ${trapData.description}!`);
          
          // Calculate trap damage
          const trapDamage = calculateTrapDamage(trapData.damage);
          
          if (trapDamage >= playerStats.hp) {
            // Trap killed the player
            setPlayerStats(prev => ({ ...prev, hp: 0 }));
            setGameStatus('defeat');
            addToGameLog(`You were killed by the trap!`);
          } else {
            // Player survived the trap
            setPlayerStats(prev => ({
              ...prev,
              hp: prev.hp - trapDamage
            }));
            
            addToGameLog(`The trap damaged you! (-${trapDamage} HP)`);
          }
          
          // Mark trap as triggered
          entity.properties.triggered = true;
          entity.properties.detected = true;
        } else {
          // Player already detected the trap
          addToGameLog(`You carefully navigate around the ${trapData.description}`);
        }
        
        result.preventMovement = false;
        break;
      }
        
      case 'treasure': {
        // Collecting treasure
        const treasureType = entity.properties.type;
        const treasureValue = entity.properties.value;
        
        addToGameLog(`You found treasure: ${TREASURE_TYPES[treasureType].description} worth ${treasureValue} gold!`);
        
        // Add to player's gold/items
        setPlayerStats(prev => ({
          ...prev,
          gold: prev.gold + treasureValue,
          collectedItems: [...prev.collectedItems, {
            type: treasureType,
            value: treasureValue,
            name: TREASURE_TYPES[treasureType].description
          }]
        }));
        
        result.removeEntity = true;
        break;
      }
        
      case 'stairs': {
        // Victory condition - reached the exit
        addToGameLog("You reached the exit! Dungeon complete!");
        
        setGameStatus('victory');
        result.preventMovement = true;
        break;
      }
        
      default:
        break;
    }
    
    return result;
  };
  
  // Calculate damage from trap
  const calculateTrapDamage = (damageDice) => {
    if (!damageDice) return 1;
    
    // Simple dice parser for formats like "3d6" or "1d10 + 2"
    const diceMatch = damageDice.match(/(\d+)d(\d+)(?:\s*\+\s*(\d+))?/);
    
    if (diceMatch) {
      const [_, numDice, dieSize, bonus] = diceMatch;
      let damage = 0;
      
      // Roll dice
      for (let i = 0; i < parseInt(numDice, 10); i++) {
        damage += Math.floor(Math.random() * parseInt(dieSize, 10)) + 1;
      }
      
      // Add bonus if any
      if (bonus) {
        damage += parseInt(bonus, 10);
      }
      
      return damage;
    }
    
    return 1; // Default damage
  };
  
  // Calculate damage to player based on monster difficulty
  const calculateDamageToPlayer = (difficulty) => {
    switch(difficulty) {
      case 'easy': return Math.floor(Math.random() * 4) + 1; // 1-4 damage
      case 'medium': return Math.floor(Math.random() * 6) + 2; // 2-7 damage
      case 'hard': return Math.floor(Math.random() * 8) + 3; // 3-10 damage
      case 'deadly': return Math.floor(Math.random() * 12) + 4; // 4-15 damage
      default: return Math.floor(Math.random() * 4) + 1;
    }
  };
  
  // Handle cell click in the dungeon renderer
  const handleCellClick = (x, y) => {
    if (gameStatus !== 'playing' || !playerPosition) return;
    
    // Calculate direction from player to clicked cell
    const dx = x - playerPosition.x;
    const dy = y - playerPosition.y;
    
    // If adjacent, move there directly
    if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1) {
      movePlayer(dx, dy);
      return;
    }
    
    // Otherwise, move one step in that general direction
    const moveX = dx !== 0 ? Math.sign(dx) : 0;
    const moveY = dy !== 0 ? Math.sign(dy) : 0;
    
    movePlayer(moveX, moveY);
  };
  
  // Handle keyboard movement
  const handleKeyDown = useCallback((e) => {
    if (gameStatus !== 'playing') return;
    
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
        movePlayer(0, -1);
        break;
      case 'ArrowRight':
      case 'd':
        movePlayer(1, 0);
        break;
      case 'ArrowDown':
      case 's':
        movePlayer(0, 1);
        break;
      case 'ArrowLeft':
      case 'a':
        movePlayer(-1, 0);
        break;
      default:
        break;
    }
  }, [gameStatus, movePlayer]);

  // Set up keyboard controls
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // Claim rewards and exit
  const finishDungeon = () => {
    // Calculate total reward
    const goldReward = playerStats.gold;
    const xpReward = playerStats.xp;
    
    // Call parent component's reward handler
    onCollectReward({
      gold: goldReward,
      xp: xpReward,
      items: playerStats.collectedItems
    });
    
    // Close the dungeon crawler
    onClose();
  };
  
  // Render setup screen
  const renderSetupScreen = () => (
    <div className="dungeon-setup">
      <h2>Dungeon Crawler Setup</h2>
      
      {!playerCharacter && (
        <div className="setup-warning">
          <p>Warning: No character data provided. You may want to load a character first.</p>
        </div>
      )}
      
      <div className="setup-options">
        <div className="option-group">
          <h3>Dungeon Type</h3>
          <div className="option-buttons">
            {Object.entries(DUNGEON_TYPES).map(([key, value]) => (
              <FancyButton
                key={key}
                onClick={() => setDungeonType(value)}
                style={{
                  opacity: dungeonType === value ? 1 : 0.6,
                  backgroundColor: THEME_SETTINGS[value]?.backgroundColor || '#333'
                }}
              >
                {THEME_SETTINGS[value]?.name || key}
              </FancyButton>
            ))}
          </div>
        </div>
        
        <div className="option-group">
          <h3>Difficulty</h3>
          <div className="option-buttons">
            {Object.keys(DIFFICULTY_LEVELS).map(key => (
              <FancyButton
                key={key}
                onClick={() => setDifficulty(key)}
                style={{
                  opacity: difficulty === key ? 1 : 0.6
                }}
              >
                {DIFFICULTY_LEVELS[key].name}
              </FancyButton>
            ))}
          </div>
        </div>
        
        <div className="option-group">
          <h3>Advanced Options</h3>
          <div className="option-fields">
            <div className="option-field">
              <label>Width:</label>
              <input
                type="number"
                min="20"
                max="100"
                value={dungeonConfig.width}
                onChange={e => setDungeonConfig(prev => ({
                  ...prev,
                  width: parseInt(e.target.value, 10)
                }))}
              />
            </div>
            
            <div className="option-field">
              <label>Height:</label>
              <input
                type="number"
                min="20"
                max="100"
                value={dungeonConfig.height}
                onChange={e => setDungeonConfig(prev => ({
                  ...prev,
                  height: parseInt(e.target.value, 10)
                }))}
              />
            </div>
            
            <div className="option-field">
              <label>Max Rooms:</label>
              <input
                type="number"
                min="5"
                max="30"
                value={dungeonConfig.maxRooms}
                onChange={e => setDungeonConfig(prev => ({
                  ...prev,
                  maxRooms: parseInt(e.target.value, 10)
                }))}
              />
            </div>
            
            <div className="option-field">
              <label>Algorithm:</label>
              <select
                value={dungeonConfig.algorithm}
                onChange={e => setDungeonConfig(prev => ({
                  ...prev,
                  algorithm: e.target.value
                }))}
              >
                <option value="bsp">Binary Space Partition</option>
                <option value="cellular">Cellular Automata</option>
                <option value="random">Random Rooms</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="setup-actions">
        <FancyButton
          onClick={generateDungeon}
          style={{ fontSize: '1.2em', padding: '10px 20px' }}
        >
          Generate Dungeon & Start Adventure
        </FancyButton>
      </div>
    </div>
  );
  
  // Render game interface
  const renderGameInterface = () => (
    <div className="dungeon-game">
      <div className="dungeon-header">
        <div className="player-stats">
          <div>HP: {playerStats.hp}/{playerStats.maxHp}</div>
          <div>XP: {playerStats.xp}</div>
          <div>Gold: {playerStats.gold}</div>
        </div>
        
        <div className="dungeon-controls">
          <FancyButton onClick={() => setShowOptions(true)}>
            Menu
          </FancyButton>
        </div>
      </div>
      
      <div className="dungeon-main">
        <div className="dungeon-view">
          <DungeonRenderer
            dungeon={dungeon}
            playerPosition={playerPosition}
            fogOfWar={true}
            revealedCells={revealedCells}
            onCellClick={handleCellClick}
          />
        </div>
        
        <div className="game-log">
          <h3>Adventure Log</h3>
          <div className="log-entries">
            {gameLog.map((entry, index) => (
              <div key={index} className="log-entry">
                <span className="log-time">[{entry.timestamp}]</span>
                <span className="log-message">{entry.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Game event modal */}
      {currentEvent && (
        <div className="event-modal">
          <div className="event-content">
            <h3>{currentEvent.title}</h3>
            <p>{currentEvent.description}</p>
            <div className="event-actions">
              {currentEvent.actions.map((action, index) => (
                <FancyButton key={index} onClick={action.handler}>
                  {action.label}
                </FancyButton>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Victory/Defeat screen */}
      {gameStatus === 'victory' && (
        <div className="game-result victory">
          <h2>Victory!</h2>
          <p>You successfully completed the dungeon!</p>
          <div className="reward-summary">
            <h3>Rewards:</h3>
            <p>Gold: {playerStats.gold}</p>
            <p>XP: {playerStats.xp}</p>
            <p>Items: {playerStats.collectedItems.length}</p>
          </div>
          <FancyButton onClick={finishDungeon}>
            Claim Rewards & Exit
          </FancyButton>
        </div>
      )}
      
      {gameStatus === 'defeat' && (
        <div className="game-result defeat">
          <h2>Defeat!</h2>
          <p>You were defeated in the dungeon.</p>
          <div className="reward-summary">
            <h3>Partial Rewards:</h3>
            <p>Gold: {Math.floor(playerStats.gold * 0.5)}</p>
            <p>XP: {Math.floor(playerStats.xp * 0.5)}</p>
          </div>
          <FancyButton onClick={() => {
            // Give partial rewards
            onCollectReward({
              gold: Math.floor(playerStats.gold * 0.5),
              xp: Math.floor(playerStats.xp * 0.5),
              items: []
            });
            onClose();
          }}>
            Exit Dungeon
          </FancyButton>
        </div>
      )}
      
      {/* Pause menu */}
      {showOptions && gameStatus === 'playing' && (
        <div className="pause-menu">
          <h2>Game Paused</h2>
          <div className="pause-actions">
            <FancyButton onClick={() => setShowOptions(false)}>
              Resume Game
            </FancyButton>
            <FancyButton onClick={() => {
              if (window.confirm('Are you sure you want to exit? You will lose all progress.')) {
                onClose();
              }
            }}>
              Exit Dungeon (No Rewards)
            </FancyButton>
          </div>
        </div>
      )}
    </div>
  );
  
  return (
    <div className="dungeon-crawler-ui">
      {gameStatus === 'setup' ? renderSetupScreen() : renderGameInterface()}
    </div>
  );
};

export default DungeonCrawlerUI;