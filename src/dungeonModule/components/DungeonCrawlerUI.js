// DungeonCrawlerUI component - the main interface for the dungeon crawler module
import React, { useState, useEffect, useCallback } from 'react';
import DungeonGenerator from '../DungeonGenerator';
import DungeonRenderer from './DungeonRenderer';
import { convertCharacterToPlayerEntity } from '../utils/characterIntegration';
import { CELL_TYPES, DUNGEON_TYPES, DIFFICULTY, THEME_SETTINGS } from '../constants';
import { resolveCombatAction } from '../utils/gameUtils';
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
  const [dungeonType, setDungeonType] = useState(DUNGEON_TYPES.DARKLING_HIVE);
  const [difficulty, setDifficulty] = useState(DIFFICULTY.MEDIUM);
  const [playerEntity, setPlayerEntity] = useState(null);
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
    const difficultyConfig = {
      monsterDensity: 0.1,
      treasureDensity: 0.05,
      trapDensity: 0.03
    };
    
    // Adjust based on difficulty
    switch(difficulty) {
      case DIFFICULTY.EASY:
        difficultyConfig.monsterDensity = 0.05;
        difficultyConfig.treasureDensity = 0.07;
        difficultyConfig.trapDensity = 0.01;
        break;
      case DIFFICULTY.HARD:
        difficultyConfig.monsterDensity = 0.15;
        difficultyConfig.treasureDensity = 0.04;
        difficultyConfig.trapDensity = 0.05;
        break;
      case DIFFICULTY.DEADLY:
        difficultyConfig.monsterDensity = 0.2;
        difficultyConfig.treasureDensity = 0.03;
        difficultyConfig.trapDensity = 0.07;
        break;
      default: // medium
        break;
    }
    
    const themeSettings = THEME_SETTINGS[dungeonType];
    
    const config = {
      ...dungeonConfig,
      dungeonType,
      partyLevel: playerStats.level,
      monsterDensity: difficultyConfig.monsterDensity,
      trapDensity: difficultyConfig.trapDensity,
      treasureDensity: difficultyConfig.treasureDensity,
    };
    
    // Create and generate the dungeon
    const generator = new DungeonGenerator(config);
    const newDungeon = generator.generate();
    
    // Find player start position
    const startEntity = newDungeon.entities.find(entity => entity.type === 'player_start');
    const startPosition = startEntity 
      ? { x: startEntity.x, y: startEntity.y }
      : { x: Math.floor(newDungeon.config.width / 2), y: Math.floor(newDungeon.config.height / 2) };
    
    // Initialize player entity
    let newPlayerEntity = null;
    if (playerCharacter) {
      newPlayerEntity = convertCharacterToPlayerEntity(playerCharacter, startPosition.x, startPosition.y);
    } else {
      // Create a default player if no character data provided
      newPlayerEntity = {
        id: 'player',
        type: 'player',
        x: startPosition.x,
        y: startPosition.y,
        properties: {
          name: 'Adventurer',
          level: 1,
          hp: 10,
          maxHp: 10,
          ac: 10,
          attackBonus: 2,
          damageBonus: 0,
          speed: 30
        }
      };
    }
    
    // Initialize game
    setDungeon(newDungeon);
    setPlayerEntity(newPlayerEntity);
    setPlayerPosition(startPosition);
    setRevealedCells([startPosition]);
    setGameStatus('playing');
    setShowOptions(false);
    
    // Initialize player stats from entity
    setPlayerStats({
      hp: newPlayerEntity.properties.hp || 10,
      maxHp: newPlayerEntity.properties.maxHp || 10,
      level: newPlayerEntity.properties.level || 1,
      xp: 0,
      gold: 0,
      collectedItems: []
    });
    
    addToGameLog(`You enter the ${themeSettings.name}...`);
  };
  
  // Add message to game log
  const addToGameLog = (message) => {
    setGameLog(prev => [...prev, { 
      message, 
      timestamp: new Date().toLocaleTimeString() 
    }]);
  };
  
  // Get the player's weapon to use in combat
  const getPlayerWeapon = (player) => {
    // Use the player's selected weapon if available
    if (player.selectedWeapon) {
      return player.selectedWeapon;
    }
    
    // Otherwise check player's weapons array
    const weapons = player.properties?.weapons || [];
    
    if (weapons.length > 0) {
      return weapons[0]; // Use first weapon as default
    }
    
    // Check if player has character data with equipment weapons
    if (player.properties?.characterData?.equipment?.weapons?.length > 0) {
      const charWeapon = player.properties.characterData.equipment.weapons[0];
      return {
        name: charWeapon.name || 'Weapon',
        damage: charWeapon.damage || '1d6',
        damageType: charWeapon.damageType || 'slashing',
        attackBonus: charWeapon.attack_bonus || 0,
        properties: charWeapon.properties || [],
        type: 'weapon'
      };
    }
    
    // Fallback to a basic weapon if nothing else is available
    return {
      name: "Unarmed Strike",
      damage: "1d4",
      damageType: "bludgeoning",
      attackBonus: 0,
      properties: ["light"],
      attackType: "melee",
      range: 1,
      type: "weapon"
    };
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
    
    // Also update player entity position
    if (playerEntity) {
      setPlayerEntity(prev => ({
        ...prev,
        x: newX,
        y: newY
      }));
    }
    
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
        // Handle player encounter with a monster
        const monsterName = entity.properties.name || 'Monster';
        addToGameLog(`You encounter a ${monsterName}!`);
        
        // Get player weapon using the getPlayerWeapon function
        const weapon = getPlayerWeapon(playerEntity);
        
        // Resolve combat with player attacking first
        const playerAttack = resolveCombatAction(playerEntity, entity, weapon);
        addToGameLog(playerAttack.message);
        
        if (playerAttack.hit) {
          // Update monster HP
          const monsterHp = entity.properties.hp - playerAttack.damage;
          
          if (monsterHp <= 0) {
            // Monster defeated
            addToGameLog(`You defeated the ${monsterName}!`);
            
            // Calculate XP based on monster challenge rating or level
            const xpGain = calculateXPFromMonster(entity);
            
            // Update player stats
            setPlayerStats(prev => ({
              ...prev,
              xp: prev.xp + xpGain
            }));
            
            addToGameLog(`Gained ${xpGain} XP!`);
            result.removeEntity = true;
            result.preventMovement = false;
          } else {
            // Monster takes damage but survives - now it attacks
            entity.properties.hp = monsterHp;
            
            // Get monster's attacks array
            const monsterAttacks = entity.properties?.attacks || [];
            // Select a random attack from the attacks array
            const selectedAttack = monsterAttacks.length > 0
              ? monsterAttacks[Math.floor(Math.random() * monsterAttacks.length)]
              : null;
            
            // Use the explicit monster attack resolution
            const monsterAttack = resolveCombatAction(entity, playerEntity, selectedAttack);
            addToGameLog(monsterAttack.message);
            
            if (monsterAttack.hit) {
              // Update player HP
              const newPlayerHp = playerEntity.properties.hp - monsterAttack.damage;
              
              if (newPlayerHp <= 0) {
                // Player defeated
                setPlayerStats(prev => ({ ...prev, hp: 0 }));
                setGameStatus('defeat');
                addToGameLog(`You were defeated by the ${monsterName}!`);
              } else {
                // Player takes damage
                setPlayerStats(prev => ({ ...prev, hp: newPlayerHp }));
                setPlayerEntity(prev => ({
                  ...prev,
                  properties: { ...prev.properties, hp: newPlayerHp }
                }));
              }
            }
          }
        } else {
          // Player missed, monster attacks
          const monsterAttacks = entity.properties?.attacks || [];
          const selectedAttack = monsterAttacks.length > 0
            ? monsterAttacks[Math.floor(Math.random() * monsterAttacks.length)]
            : null;
          
          const monsterAttack = resolveCombatAction(entity, playerEntity, selectedAttack);
          addToGameLog(monsterAttack.message);
          
          if (monsterAttack.hit) {
            // Update player HP
            const newPlayerHp = playerEntity.properties.hp - monsterAttack.damage;
            
            if (newPlayerHp <= 0) {
              // Player defeated
              setPlayerStats(prev => ({ ...prev, hp: 0 }));
              setGameStatus('defeat');
              addToGameLog(`You were defeated by the ${monsterName}!`);
            } else {
              // Player takes damage
              setPlayerStats(prev => ({ ...prev, hp: newPlayerHp }));
              setPlayerEntity(prev => ({
                ...prev,
                properties: { ...prev.properties, hp: newPlayerHp }
              }));
            }
          }
        }
        break;
      }
        
      case 'trap': {
        // Trap triggering
        const trapType = entity.properties.type || 'pit';
        
        if (!entity.properties.detected) {
          // Player didn't detect the trap
          addToGameLog(`You triggered a ${trapType} trap!`);
          
          // Calculate trap damage
          const trapDamage = calculateTrapDamage(entity);
          
          if (trapDamage >= playerStats.hp) {
            // Trap killed the player
            setPlayerStats(prev => ({ ...prev, hp: 0 }));
            setGameStatus('defeat');
            addToGameLog(`You were killed by the trap!`);
          } else {
            // Player survived the trap
            const newHp = playerStats.hp - trapDamage;
            setPlayerStats(prev => ({ ...prev, hp: newHp }));
            setPlayerEntity(prev => ({
              ...prev,
              properties: { ...prev.properties, hp: newHp }
            }));
            
            addToGameLog(`The trap damaged you! (-${trapDamage} HP)`);
          }
          
          // Mark trap as triggered
          entity.properties.triggered = true;
          entity.properties.detected = true;
        } else {
          // Player already detected the trap
          addToGameLog(`You carefully navigate around the ${trapType} trap.`);
        }
        
        result.preventMovement = false;
        break;
      }
        
      case 'treasure': {
        // Collecting treasure
        const treasureType = entity.properties.type || 'gold';
        const treasureValue = entity.properties.value || 10;
        
        addToGameLog(`You found treasure: ${treasureType} worth ${treasureValue} gold!`);
        
        // Add to player's gold/items
        setPlayerStats(prev => ({
          ...prev,
          gold: prev.gold + treasureValue,
          collectedItems: [...prev.collectedItems, {
            type: treasureType,
            value: treasureValue,
            name: entity.properties.name || treasureType
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
  
  // Calculate XP from monster
  const calculateXPFromMonster = (monster) => {
    const cr = monster.properties.challengeRating || 0;
    
    // XP by CR based on D&D 5e guidelines
    const xpTable = {
      0: 10,
      0.125: 25,
      0.25: 50,
      0.5: 100,
      1: 200,
      2: 450,
      3: 700,
      4: 1100,
      5: 1800
    };
    
    // Get XP for this CR, or default to 10
    return xpTable[cr] || Math.max(10, Math.floor(cr * 100));
  };
  
  // Calculate damage from trap
  const calculateTrapDamage = (trap) => {
    const trapLevel = trap.properties.level || 1;
    const baseDamage = Math.floor(Math.random() * 4) + 1; // 1d4 base damage
    return baseDamage + trapLevel;
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
  }, [gameStatus, playerPosition, dungeon, playerEntity, playerStats]);

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
  
  // If player has character data, use it to initialize on component mount
  useEffect(() => {
    if (playerCharacter && gameStatus === 'setup') {
      // Extract level
      let level = playerCharacter.level || 1;
      if (!playerCharacter.level && playerCharacter.class) {
        const levelMatch = playerCharacter.class.match(/\d+/);
        level = levelMatch ? parseInt(levelMatch[0], 10) : 1;
      }
      
      // Extract HP
      const hitPoints = playerCharacter.hit_points || {};
      
      // Update player stats
      setPlayerStats(prev => ({
        ...prev,
        level,
        hp: hitPoints.current || hitPoints.max || 10,
        maxHp: hitPoints.max || 10
      }));
    }
  }, [playerCharacter, gameStatus]);

  // Rest of component as before
};

export default DungeonCrawlerUI;