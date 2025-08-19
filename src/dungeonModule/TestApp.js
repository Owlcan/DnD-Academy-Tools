import React, { useState, useEffect, useRef, useCallback } from 'react';
import DungeonGenerator from './DungeonGenerator';
import DungeonRenderer from './DungeonRenderer';
import CharacterSheet from '../components/modals/CharacterSheet';
import TokenSelector from '../components/TokenSelector';
import PlayerControls from './components/PlayerControls'; // Import the new PlayerControls component
import './TestApp.css';
import { findValidMoves, resolveMonsterAttack, resolvePlayerAttack } from './combatManager';
// Import CombatMenu as a named import for use in the imperative code
import { CombatMenu } from './combat/CombatMenu';
// Import the React wrapper component for use in JSX
import CombatMenuWrapper from './combat/CombatMenuWrapper';
import WeaponAttackButton from './components/WeaponAttackButton';
import { tokenAspectRatios } from '../constants/tokenDimensions';

// We'll load these JSON files directly instead of importing them as modules
const loadCharacterFile = async (filePath) => {
  try {
    // Use an absolute path based on the current location
    const absolutePath = filePath.startsWith('../') 
      ? `${process.env.PUBLIC_URL}/src${filePath.substring(2)}` 
      : filePath;
    
    console.log(`Attempting to load character from: ${absolutePath}`);
    const response = await fetch(absolutePath);
    
    if (!response.ok) {
      throw new Error(`Failed to load character file: ${filePath} (${response.status} ${response.statusText})`);
    }
    
    const text = await response.text();
    console.log(`File contents: ${text.substring(0, 100)}...`);
    
    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error(`JSON parsing error for file: ${filePath}`, parseError);
      throw new Error(`Invalid JSON in character file: ${parseError.message}`);
    }
  } catch (error) {
    console.error(`Error loading character file: ${filePath}`, error);
    return null;
  }
};

const TestApp = () => {
  const [dungeon, setDungeon] = useState(null);
  const [players, setPlayers] = useState([]);
  const [monsters, setMonsters] = useState([]);
  const [gameLog, setGameLog] = useState([]);
  const [activeEntity, setActiveEntity] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [gameState, setGameState] = useState('exploring');
  const [showCharacterSheet, setShowCharacterSheet] = useState(false);
  const [characterData, setCharacterData] = useState(null);
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [activeClassAbility, setActiveClassAbility] = useState(null);
  const [showGrid, setShowGrid] = useState(false);
  const [combatSystem, setCombatSystem] = useState(null);
  const controlsRef = useRef(null);

  const addLogEntry = useCallback((message) => {
    setGameLog(prev => [...prev, {
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  }, []);

  const moveEntity = useCallback((entity, x, y) => {
    console.log(`Moving ${entity.properties?.name || 'entity'} to (${x},${y})`);
    
    if (entity.type === 'player') {
      setPlayers(players => players.map(p => 
        p.id === entity.id ? { ...p, x, y } : p
      ));
      addLogEntry(`${entity.properties.name} moves to (${x},${y})`);
      
      // Don't automatically end turn after movement
      // This allows for spellcasting or using the end turn button
    } else if (entity.type === 'monster') {
      setMonsters(monsters => monsters.map(m => 
        m.id === entity.id ? { ...m, x, y } : m
      ));
      addLogEntry(`${entity.properties.name} moves to (${x},${y})`);
    }
  }, [addLogEntry]);
  const handleMonsterAttack = useCallback((monster, player) => {
    const result = resolveMonsterAttack(monster, player, players);
    addLogEntry(result.message);
    if (result.hit) {
      const newHp = player.properties.hp - result.damage;
      if (newHp <= 0) {
        addLogEntry(`${player.properties.name} has been defeated!`);
      } else {
        setPlayers(players => players.map(p => 
          p.id === player.id 
            ? { ...p, properties: { ...p.properties, hp: newHp }} 
            : p
        ));
      }
    }
  }, [addLogEntry, players]);

  const handleCharacterDataChange = (newData) => {
    setCharacterData(newData);
  };

  const handleImportJSON = (importedData) => {
    const characterData = importedData.character || importedData;
    setCharacterData(characterData);
    loadCharacter(characterData);
    setShowCharacterSheet(false);
  };

  const resolveMagicMissileAttacks = useCallback((caster, targets, spellAbility) => {
    if (!caster || !targets || !spellAbility) {
      console.error("Missing parameters for Magic Missile");
      return;
    }
    
    addLogEntry(`${caster.properties.name} casts Magic Missile!`);
    
    // Process each target
    targets.forEach((target, i) => {
      try {
        // Formula: 1d4+1 damage per dart
        const damage = Math.floor(Math.random() * 4) + 2;
        
        // Apply damage
        const newHp = Math.max(0, target.properties.hp - damage);
        addLogEntry(`Dart ${i+1} hits ${target.properties.name} for ${damage} force damage!`);
        
        // Update monster HP or remove if defeated
        if (newHp <= 0) {
          // Remove monster from state
          setMonsters(prev => prev.filter(m => m.id !== target.id));
          
          // Then notify combat system about entity death
          if (combatSystem?.gameState?.handleEntityDeath) {
            combatSystem.gameState.handleEntityDeath(
              target.id, 
              target.properties.name, 
              target.type
            );
          } else {
            addLogEntry(`${target.properties.name} is defeated!`);
          }
        } else {
          setMonsters(prev => prev.map(m => 
            m.id === target.id 
              ? { ...m, properties: { ...m.properties, hp: newHp }} 
              : m
          ));
        }
      } catch (error) {
        console.error(`Error processing Magic Missile on target ${i}:`, error);
      }
    });
    
    // Reduce spell charges
    try {
      setPlayers(prev => prev.map(p => {
        if (p.id === caster.id) {
          return {
            ...p,
            properties: {
              ...p.properties,
              classAbilities: (p.properties.classAbilities || []).map(a => 
                a.name === spellAbility.name && !a.isCantrip 
                  ? { ...a, charges: a.charges - 1 }
                  : a
              )
            }
          };
        }
        return p;
      }));
    } catch (error) {
      console.error("Error updating player spell charges:", error);
    }
  }, [addLogEntry, setMonsters, setPlayers, combatSystem]);

  const handleSelfHealing = useCallback((caster, healingAbility) => {
    if (!caster || !healingAbility || !healingAbility.isHealing) return;
    
    // Parse the healing dice formula (e.g., "1d8+4")
    const healingFormula = healingAbility.damage;
    const diceMatch = healingFormula.match(/(\d+)d(\d+)(?:\s*\+\s*(\d+))?/);
    
    if (!diceMatch) {
      addLogEntry(`Error processing healing spell formula: ${healingFormula}`);
      return;
    }
    
    // Calculate healing amount
    const numDice = parseInt(diceMatch[1], 10);
    const dieSize = parseInt(diceMatch[2], 10);
    const healingBonus = diceMatch[3] ? parseInt(diceMatch[3], 10) : 0;
    
    let healingRoll = 0;
    let diceResults = [];
    
    // Roll the healing dice
    for (let i = 0; i < numDice; i++) {
      const roll = Math.floor(Math.random() * dieSize) + 1;
      diceResults.push(roll);
      healingRoll += roll;
    }
    
    // Add any bonus healing
    const totalHealing = healingRoll + healingBonus;
    
    // Update the caster's HP, making sure not to exceed max HP
    const currentHP = caster.properties.hp || 0;
    const maxHP = caster.properties.maxHp || 0;
    const newHP = Math.min(currentHP + totalHealing, maxHP);
    
    // Update the player's HP
    const newPlayers = players.map(p => {
      if (p.id === caster.id) {
        // Only reduce charges for non-cantrips
        const updatedAbilities = p.properties.classAbilities.map(a => {
          if (a.name === healingAbility.name && !healingAbility.isCantrip) {
            return { ...a, charges: a.charges - 1 };
          }
          return a;
        });
        
        return {
          ...p,
          properties: {
            ...p.properties,
            hp: newHP,
            classAbilities: updatedAbilities
          }
        };
      }
      return p;
    });
    
    setPlayers(newPlayers);
    
    // Format a message about the healing
    const diceString = diceResults.join(' + ');
    const healingMessage = `${caster.properties.name} casts ${healingAbility.name} and heals for ${diceString}${healingBonus > 0 ? ' + ' + healingBonus : ''} = ${totalHealing} points! (${newHP}/${maxHP} HP)`;
    
    addLogEntry(healingMessage);
  }, [addLogEntry, players, setPlayers]);

  const handleLoadExampleCharacter = async () => {
    try {
      const characterData = await loadCharacterFile('../examples/syna_character.json');
      console.log("Loading Syna character data:", characterData);
      
      if (!characterData) {
        console.error("Failed to load Syna character data - file not found or invalid");
        addLogEntry("Error loading character - file not found or invalid");
        return;
      }
      
      console.log("Character name:", characterData.name);
      
      setCharacterData(characterData);
      
      setTimeout(() => {
        generateNewDungeon(characterData);
        
        setTimeout(() => {
          console.log("Final players array:", players);
        }, 100);
      }, 50);
      
      addLogEntry(`Loaded ${characterData.name}, the ${characterData.race} ${characterData.class}`);
    } catch (error) {
      console.error("Error loading example character:", error);
      addLogEntry(`Error loading example character: ${error.message}`);
    }
  };

  const handleLoadPaladinCharacter = async () => {
    try {
      const characterData = await loadCharacterFile('../examples/julie_paladin.json');
      console.log("Loading Julia character data:", characterData);
      
      if (!characterData) {
        console.error("Failed to load Julia character data - file not found or invalid");
        addLogEntry("Error loading character - file not found or invalid");
        return;
      }
      
      console.log("Character name:", characterData.name);
      
      setCharacterData(characterData);
      
      setTimeout(() => {
        generateNewDungeon(characterData);
        
        setTimeout(() => {
          console.log("Final players array:", players);
        }, 100);
      }, 50);
      
      addLogEntry(`Loaded ${characterData.name}, the ${characterData.race} ${characterData.class}`);
    } catch (error) {
      console.error("Error loading paladin character:", error);
      addLogEntry(`Error loading paladin character: ${error.message}`);
    }
  };

  const handleLoadDereCharacter = async () => {
    try {
      const characterData = await loadCharacterFile('../examples/dere.json');
      console.log("Loading Dere character data:", characterData);
      
      if (!characterData) {
        console.error("Failed to load Dere character data - file not found or invalid");
        addLogEntry("Error loading character - file not found or invalid");
        return;
      }
      
      console.log("Character name:", characterData.name);
      
      setCharacterData(characterData);
      
      setTimeout(() => {
        generateNewDungeon(characterData);
        
        setTimeout(() => {
          console.log("Final players array:", players);
        }, 100);
      }, 50);
      
      addLogEntry(`Loaded ${characterData.name}, the ${characterData.race} ${characterData.class}`);
    } catch (error) {
      console.error("Error loading Dere character:", error);
      addLogEntry(`Error loading Dere character: ${error.message}`);
    }
  };

  const handleTokenSelect = (tokenPath) => {
    setShowTokenSelector(false);
    
    if (players.length > 0) {
      const filename = tokenPath.split('/').pop();
      const aspectRatio = tokenAspectRatios[filename] || 0.8;
      
      const updatedPlayers = players.map(player => ({
        ...player,
        token: {
          image: tokenPath,
          aspectRatio
        }
      }));
      
      setPlayers(updatedPlayers);
      
      // Log the selected token for debugging
      console.log(`Selected token: ${tokenPath}, aspect ratio: ${aspectRatio}`);
      addLogEntry(`Token changed to ${filename}`);
    }
  };

  const healPlayer = () => {
    if (players.length === 0) {
      addLogEntry("No player to heal!");
      return;
    }
    
    // Calculate healing amount (1d8+4)
    const dieRoll = Math.floor(Math.random() * 8) + 1;
    const healAmount = dieRoll + 4;
    
    // Update the player's HP
    const player = players[0]; // Get the first player
    const currentHP = player.properties.hp || 0;
    const maxHP = player.properties.maxHp || 0;
    const newHP = Math.min(currentHP + healAmount, maxHP);
    
    // Apply healing
    const updatedPlayers = players.map(p => ({
      ...p,
      properties: {
        ...p.properties,
        hp: newHP
      }
    }));
    
    setPlayers(updatedPlayers);
    addLogEntry(`Healed ${player.properties.name} for ${healAmount} HP (${dieRoll}+4)! [${newHP}/${maxHP}]`);
  };

  const initializeTestPlayer = useCallback((x, y, characterData = null) => {
    if (characterData) {
      const { convertCharacterToPlayerEntity } = require('./utils/characterIntegration');
      const { convertSpellsToAttacks } = require('./utils/spellConverter');
      
      // Generate the base player entity
      const playerEntity = convertCharacterToPlayerEntity(characterData, x, y);
      
      // Generate spell attacks from character's spells
      const spellAttacks = convertSpellsToAttacks(characterData);
      
      // Add spell attacks as class abilities if they don't exist already
      if (spellAttacks.length > 0) {
        playerEntity.properties.classAbilities = playerEntity.properties.classAbilities || [];
        
        // Merge spell attacks with any existing abilities
        playerEntity.properties.classAbilities = [
          ...playerEntity.properties.classAbilities,
          ...spellAttacks
        ];
        
        console.log(`Created player entity with ${spellAttacks.length} spell attacks:`, 
          spellAttacks.map(spell => spell.name).join(', '));
      }
      
      return playerEntity;
    }
    
    return {
      id: 'player',
      type: 'player',
      x, y,
      properties: {
        name: 'Dere',
        level: 5,
        hp: 45,
        maxHp: 45,
        ac: 15,
        attackBonus: 5,
        damageBonus: 5,
        speed: 30,
        classAbilities: [
          {
            name: "Magic Missile",
            damage: "3d4+3",
            damageType: "force",
            description: "Three magical darts strike a target",
            keybind: "z",
            isSpell: true,
            charges: 3
          }
        ]
      }
    };
  }, []);

  const generateNewDungeon = useCallback((characterData = null) => {
    try {
      const generator = new DungeonGenerator({ width: 40, height: 30 });
      const newDungeon = generator.generate();
      setDungeon(newDungeon);

      // Check if specialRooms or entry exists, and provide default values if they don't
      const startRoom = newDungeon.specialRooms?.entry || {
        x: 1, 
        y: 1, 
        width: 3, 
        height: 3
      };
      
      const playerX = startRoom.x + Math.floor(startRoom.width / 2);
      const playerY = startRoom.y + Math.floor(startRoom.height / 2);
      
      const newPlayer = initializeTestPlayer(playerX, playerY, characterData);
      setPlayers([newPlayer]);
      
      // Instead of creating generic test monsters, use the bestiary monsters
      const bestiaryMonsters = [];
      
      // Import the bestiary monsters directly
      const { BESTIARY } = require('./data/bestiary/index');
      const darklingsAndDarkformes = BESTIARY[0]?.creatures || [];

      console.log(`Found ${darklingsAndDarkformes.length} monsters in the bestiary`);
      
      // Place monsters in available rooms
      const availableRooms = newDungeon.rooms.filter(room => {
        // Check if specialRooms and entry exist before using them
        return !(newDungeon.specialRooms?.entry && 
                room.x === newDungeon.specialRooms.entry.x && 
                room.y === newDungeon.specialRooms.entry.y);
      });
      
      if (availableRooms.length === 0) {
        console.warn('No available rooms to place bestiary monsters');
        setMonsters([]);
        return;
      }
      
      // Select a mix of monsters from different size categories for variety
      const getRandomMonsters = (arr, count) => {
        if (!arr || !arr.length) return [];
        const result = [];
        const tempArray = [...arr];
        
        for (let i = 0; i < count && tempArray.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * tempArray.length);
          result.push(tempArray.splice(randomIndex, 1)[0]);
        }
        
        return result;
      };
      
      const monsterPool = getRandomMonsters(darklingsAndDarkformes, Math.min(6, availableRooms.length));
      
      // Add these monsters to rooms
      for (let i = 0; i < monsterPool.length; i++) {
        const monster = monsterPool[i];
        const room = availableRooms[i % availableRooms.length];
        
        // Calculate token size based on monster size
        let tokenSize = monster.tokenSize || 1;
        if (!monster.tokenSize && monster.size && Array.isArray(monster.size)) {
          const sizeCode = monster.size[0];
          if (sizeCode === 'G') tokenSize = 4;      // Gargantuan
          else if (sizeCode === 'H') tokenSize = 3; // Huge
          else if (sizeCode === 'L') tokenSize = 2; // Large
          else tokenSize = 1;                       // Medium or smaller
        }

        // Position monster in the room
        const monsterX = Math.min(room.x + Math.floor(room.width / 2), room.x + room.width - tokenSize);
        const monsterY = Math.min(room.y + Math.floor(room.height / 2), room.y + room.height - tokenSize);
        
        // Get the monster's stats
        const monsterStats = monster.stats || {};
        
        // Create a monster entity with the bestiary data
        const monsterEntity = {
          id: `monster_${Math.random().toString(36).substr(2, 9)}`,
          type: 'monster',
          name: monster.name,
          x: monsterX,
          y: monsterY,
          size: tokenSize,
          properties: {
            name: monster.name,
            symbol: monster.name.charAt(0),
            hp: monsterStats.hitPoints || 10,
            maxHp: monsterStats.hitPoints || 10,
            ac: monsterStats.armorClass || 10,
            attackBonus: monsterStats.attacks?.[0]?.toHit || 
                         (monsterStats.attacks?.[0]?.description?.match(/\+(\d+) to hit/)?.[1] || 0),
            damageBonus: 0,
            size: monsterStats.size || 'medium',
            tokenSize: tokenSize,
            type: monster.type || 'unknown',
            monsterData: monster,
            stats: monsterStats,
            abilities: monsterStats.abilities || [],
            attacks: monsterStats.attacks || [],
            challengeRating: monsterStats.challengeRating || '?',
            strength: monsterStats.str,
            dexterity: monsterStats.dex,
            constitution: monsterStats.con,
            intelligence: monsterStats.int,
            wisdom: monsterStats.wis,
            charisma: monsterStats.cha,
            isInteractive: true
          }
        };
        
        bestiaryMonsters.push(monsterEntity);
        console.log(`Added ${monster.name} (${monsterStats.size}, CR ${monsterStats.challengeRating}) at (${monsterX},${monsterY})`);
      }
      
      // Set monsters to our bestiary ones
      setMonsters(bestiaryMonsters);
      
      const playerName = characterData?.name || 'Player';
      addLogEntry(`Dungeon generated with ${playerName} and ${bestiaryMonsters.length} monsters from your bestiary.`);
      bestiaryMonsters.forEach(monster => {
        addLogEntry(`- ${monster.properties.name} (HP: ${monster.properties.hp}, AC: ${monster.properties.ac})`);
      });
    } catch (err) {
      console.error('Failed to generate dungeon:', err);
      addLogEntry(`Error generating dungeon: ${err.message}`);
    }
  }, [addLogEntry, initializeTestPlayer]);

  const loadCharacter = (characterJson) => {
    try {
      let characterData = characterJson;
      
      if (typeof characterJson === 'string') {
        characterData = JSON.parse(characterJson);
      }
      
      if (characterData.character) {
        characterData = characterData.character;
      }
      
      setCharacterData(characterData);
      
      setTimeout(() => {
        generateNewDungeon(characterData);
      }, 50);
      
      addLogEntry(`Loaded character: ${characterData.name}`);
      return true;
    } catch (error) {
      console.error('Failed to load character:', error);
      addLogEntry('Failed to load character. Check the console for details.');
      return false;
    }
  };

  const handleAddExtraPlayer = (characterJson) => {
    try {
      let characterData = characterJson;
      
      if (typeof characterJson === 'string') {
        characterData = JSON.parse(characterJson);
      }
      
      if (characterData.character) {
        characterData = characterData.character;
      }
      
      const startRoom = dungeon.specialRooms?.entry || {
        x: 1, 
        y: 1, 
        width: 3, 
        height: 3
      };
      const playerX = startRoom.x + Math.floor(startRoom.width / 2);
      const playerY = startRoom.y + Math.floor(startRoom.height / 2);
      
      const newPlayer = initializeTestPlayer(playerX, playerY, characterData);
      setPlayers([...players, newPlayer]);
      
      addLogEntry(`Added extra player: ${characterData.name}`);
    } catch (error) {
      console.error('Failed to add extra player:', error);
      addLogEntry('Failed to add extra player. Check the console for details.');
    }
  };

  useEffect(() => {
    generateNewDungeon();
  }, [generateNewDungeon]);

  useEffect(() => {
    console.log("Players array changed:", players);
  }, [players]);

  useEffect(() => {
    if (dungeon) {
      try {
        // Create stable reference object for combat state
        const combatState = {
          inCombat: false,
          combatants: [],
          currentTurnIndex: 0,
          round: 1,
          activePlayer: null,
          
          // Add method to remove combatant from turn order
          removeCombatant: function(entityId) {
            const index = this.combatants.findIndex(c => c.id === entityId);
            if (index >= 0) {
              // Remove the combatant
              this.combatants.splice(index, 1);
              
              // If we removed an entity before the current turn, adjust index
              if (index < this.currentTurnIndex) {
                this.currentTurnIndex--;
              }
              // If we removed the last entity and were on the last turn, wrap around
              else if (index === this.combatants.length && this.currentTurnIndex >= this.combatants.length) {
                this.currentTurnIndex = 0;
                this.round++;
              }
              
              return true;
            }
            return false;
          },
          
          // Add method to update or add combatant in the turn order
          updateCombatant: function(entity) {
            const index = this.combatants.findIndex(c => c.id === entity.id);
            if (index >= 0) {
              // Update existing combatant
              this.combatants[index] = entity;
            } else {
              // Add new combatant
              this.combatants.push(entity);
            }
          }
        };
        
        // Create a simple game state object for combat
        const gameState = {
          dungeon: dungeon,
          
          startCombat: async () => {
            console.log("Starting combat from TestApp");
            // Gather all entities for combat
            const allCombatants = [...players, ...monsters];
            if (allCombatants.length < 2) {
              addLogEntry("Cannot start combat: Need both players and monsters");
              return false;
            }
            
            // Set combat state
            combatState.inCombat = true;
            setGameState('combat');
            addLogEntry(`Combat started with ${players.length} players and ${monsters.length} monsters!`);
            
            // Roll initiative for entities
            const rollInitiative = (entity) => {
              const dexMod = Math.floor(((entity.properties?.dexterity || 10) - 10) / 2);
              const roll = Math.floor(Math.random() * 20) + 1;
              const initiative = roll + dexMod;
              addLogEntry(`${entity.properties.name} rolls initiative: ${roll} + ${dexMod} = ${initiative}`);
              return initiative;
            };
            
            const sortedCombatants = allCombatants.map(entity => {
              return {
                entity,
                initiative: rollInitiative(entity)
              };
            }).sort((a, b) => b.initiative - a.initiative);
            
            addLogEntry("Combat order:");
            sortedCombatants.forEach((entry, index) => {
              addLogEntry(`${index + 1}: ${entry.entity.properties.name} (${entry.initiative})`);
            });
            
            // Store combat order
            combatState.combatants = sortedCombatants.map(c => c.entity);
            combatState.currentTurnIndex = 0;
            combatState.round = 1;
            
            // Start the first turn after a delay
            setTimeout(() => {
              if (combatState.combatants.length > 0) {
                const firstEntity = combatState.combatants[0];
                gameState.startTurn(firstEntity);
              }
            }, 1000);
            
            return true;
          },
          
          startTurn: (entity) => {
            try {
              if (!entity) {
                console.error("Invalid entity in startTurn");
                return;
              }
              
              // Check if entity is still alive and valid - use the latest state from players/monsters arrays
              if (entity.type === 'monster') {
                const currentMonster = monsters.find(m => m.id === entity.id);
                if (!currentMonster) {
                  console.log(`Monster ${entity.properties?.name} is no longer in the battlefield, skipping turn`);
                  
                  // Remove from combat order and go to next turn
                  combatState.removeCombatant(entity.id);
                  gameState.nextTurn();
                  return;
                } else {
                  // Use the up-to-date monster state
                  entity = currentMonster;
                  // Update the reference in combatants array
                  combatState.updateCombatant(currentMonster);
                }
              } else if (entity.type === 'player') {
                const currentPlayer = players.find(p => p.id === entity.id);
                if (!currentPlayer) {
                  console.log(`Player ${entity.properties?.name} is no longer in the battlefield, skipping turn`);
                  
                  // Remove from combat order and go to next turn
                  combatState.removeCombatant(entity.id);
                  gameState.nextTurn();
                  return;
                } else {
                  // Use the up-to-date player state
                  entity = currentPlayer;
                  // Update the reference in combatants array
                  combatState.updateCombatant(currentPlayer);
                }
              }
              
              // Continue with normal turn start using updated entity
              addLogEntry(`It's ${entity.properties.name}'s turn!`);
              
              if (entity.type === 'player') {
                // Set as active player
                combatState.activePlayer = entity;
                
                // Let player take their turn
                setActiveEntity(entity);
                
                // Calculate valid moves
                const validPlayerMoves = findValidMoves(entity, dungeon.grid, [...players, [...monsters]]);
                setValidMoves(validPlayerMoves);
                
                // Update game state to allow player movement
                setGameState('moving');
                
                // Update combat menu if available
                if (combatSystem && combatSystem.combatMenu) {
                  combatSystem.combatMenu.activatePlayerTurn(entity);
                }
              } 
              else if (entity.type === 'monster') {
                handleMonsterTurn(entity);
              }
            } catch (error) {
              console.error("Error in startTurn:", error);
              // Recover by advancing to next turn
              gameState.nextTurn();
            }
          },
          
          nextTurn: () => {
            try {
              // Store the current state of all entities BEFORE advancing the turn
              const currentMonsters = [...monsters];
              const currentPlayers = [...players];
              
              // Create a unified list with the latest state of all combatants
              const allCombatantsNow = [...currentPlayers, ...currentMonsters];
              
              // Update combatants list to match current state
              // This ensures any position changes are preserved between turns and rounds
              combatState.combatants = combatState.combatants.map(oldEntity => {
                // Find the up-to-date version of this entity with current position and HP
                const updatedEntity = allCombatantsNow.find(e => e.id === oldEntity.id);
                return updatedEntity || oldEntity;
              }).filter(e => {
                // Keep only entities that still exist in the current state
                // This properly removes defeated monsters from the initiative order
                return currentMonsters.some(m => m.id === e.id) || 
                       currentPlayers.some(p => p.id === e.id);
              });
              
              // Check if there are still valid combatants
              const remainingPlayers = combatState.combatants.filter(c => c.type === 'player').length;
              const remainingMonsters = combatState.combatants.filter(c => c.type === 'monster').length;
              
              // Check for combat end conditions
              if (remainingPlayers === 0) {
                addLogEntry("All players have been defeated! Combat ends.");
                combatState.inCombat = false;
                return;
              }
              if (remainingMonsters === 0) {
                addLogEntry("All monsters have been defeated! Victory!");
                combatState.inCombat = false;
                return;
              }
              
              // Increment turn counter
              combatState.currentTurnIndex = (combatState.currentTurnIndex + 1) % combatState.combatants.length;
              
              // Check for new round
              if (combatState.currentTurnIndex === 0) {
                combatState.round++;
                addLogEntry(`Round ${combatState.round} begins!`);
                
                // Log the entities for debugging purposes
                if (process.env.NODE_ENV !== 'production') {
                  console.log('Round transition - Current combatants:', 
                    combatState.combatants.map(c => ({
                      id: c.id,
                      name: c.properties?.name,
                      position: `(${c.x},${c.y})`,
                      hp: `${c.properties?.hp}/${c.properties?.maxHp}`
                    }))
                  );
                }
              }
              
              // Get next entity - this will be the up-to-date version
              const nextEntity = combatState.combatants[combatState.currentTurnIndex];
              if (!nextEntity) {
                console.error("Invalid entity in nextTurn");
                return;
              }
              
              // Start the next entity's turn with the updated entity
              gameState.startTurn(nextEntity);
            } catch (error) {
              console.error("Error in nextTurn:", error);
              // Try to recover
              setTimeout(() => gameState.nextTurn(), 1000);
            }
          },
          
          endTurn: () => {
            try {
              // Store the active entity before ending turn
              const currentActiveEntity = activeEntity;
              
              // Update the combatants array to store the current state of the active entity
              if (currentActiveEntity) {
                // Find the up-to-date version of this entity
                let updatedEntity;
                if (currentActiveEntity.type === 'player') {
                  updatedEntity = players.find(p => p.id === currentActiveEntity.id);
                } else if (currentActiveEntity.type === 'monster') {
                  updatedEntity = monsters.find(m => m.id === currentActiveEntity.id);
                }
                
                if (updatedEntity) {
                  combatState.updateCombatant(updatedEntity);
                }
              }
              
              // Clean up the current turn
              setValidMoves([]);
              setActiveEntity(null);
              setSelectedCell(null);
              setActiveClassAbility(null);
              
              // Clear active player
              combatState.activePlayer = null;
              
              // Update menu
              if (combatSystem && combatSystem.combatMenu) {
                combatSystem.combatMenu.deactivatePlayerTurn();
              }
              
              addLogEntry("Turn ended");
            } catch (error) {
              console.error("Error in endTurn:", error);
            }
          },
          
          castSpell: (player, spell) => {
            if (!player || !spell) return;
            
            addLogEntry(`${player.properties.name} prepares to cast ${spell.name}`);
            setActiveClassAbility(spell);
            setActiveEntity(player);
            setGameState('casting');
            
            // If it's a self-target spell (like healing), cast immediately
            if (spell.isSelfTargeted && spell.isHealing) {
              handleSelfHealing(player, spell);
              setActiveClassAbility(null);
              
              // End turn after self-healing
              setTimeout(() => {
                if (gameState === 'casting') {
                  gameState.endTurn();
                }
              }, 500);
            }
          },
          
          // Add method to properly handle entity death
          handleEntityDeath: (entityId, entityName, entityType) => {
            addLogEntry(`${entityName} is defeated!`);
            
            // Remove from current combatants list
            if (combatState.inCombat) {
              const removed = combatState.removeCombatant(entityId);
              if (removed) {
                console.log(`Removed ${entityName} (${entityId}) from combat order`);
              }
            }
          },
          
          getPlayers: () => players,
          getMonsters: () => monsters
        };
        
        // Function to handle monster turns
        const handleMonsterTurn = (monster) => {
          if (!monster) return;
          
          addLogEntry(`${monster.properties.name} is thinking...`);
          
          // Simple AI after delay
          setTimeout(() => {
            try {
              // Find nearest player
              let target = null;
              let minDistance = Infinity;
              
              players.forEach(player => {
                // Skip defeated players
                if (player.properties.hp <= 0) return;
                
                const distance = Math.abs(monster.x - player.x) + Math.abs(monster.y - player.y);
                if (distance < minDistance) {
                  minDistance = distance;
                  target = player;
                }
              });
              
              if (!target) {
                addLogEntry(`${monster.properties.name} sees no targets`);
                gameState.endTurn();
                setTimeout(() => {
                  gameState.nextTurn();
                }, 500);
                return;
              }
              
              // Check if already adjacent to target (can attack immediately)
              const isAdjacent = Math.abs(monster.x - target.x) + Math.abs(monster.y - target.y) <= 1;
              
              if (isAdjacent) {
                // Attack player - FIXED: Explicitly call handleMonsterAttack and ensure it works
                addLogEntry(`${monster.properties.name} attacks ${target.properties.name}!`);
                handleMonsterAttack(monster, target);
                
                // End turn after attack
                setTimeout(() => {
                  gameState.endTurn();
                  setTimeout(() => {
                    gameState.nextTurn();
                  }, 500);
                }, 1000);
              } else {
                // Move toward player
                addLogEntry(`${monster.properties.name} moves toward ${target.properties.name}`);
                
                // Calculate best direction to move
                const dx = target.x > monster.x ? 1 : target.x < monster.x ? -1 : 0;
                const dy = target.y > monster.y ? 1 : target.y < monster.y ? -1 : 0;
                
                // Try to move diagonally first (more aggressive)
                let moved = false;
                if (dx !== 0 && dy !== 0) {
                  const newX = monster.x + dx;
                  const newY = monster.y + dy;
                  if (isValidMove(newX, newY)) {
                    moveEntity(monster, newX, newY);
                    moved = true;
                  }
                }
                
                // If diagonal move failed, try horizontal movement
                if (!moved && dx !== 0) {
                  const newX = monster.x + dx;
                  if (isValidMove(monster.x + dx, monster.y)) {
                    moveEntity(monster, newX, monster.y);
                    moved = true;
                  }
                }
                
                // If horizontal move failed, try vertical movement
                if (!moved && dy !== 0) {
                  const newY = monster.y + dy;
                  if (isValidMove(monster.x, newY)) {
                    moveEntity(monster, monster.x, newY);
                    moved = true;
                  }
                }
                
                if (!moved) {
                  addLogEntry(`${monster.properties.name} can't find a clear path`);
                }
                
                // Check if move puts us adjacent to target for immediate attack
                const nowAdjacent = Math.abs(monster.x - target.x) + Math.abs(monster.y - target.y) <= 1;
                if (moved && nowAdjacent) {
                  addLogEntry(`${monster.properties.name} attacks ${target.properties.name} after moving!`);
                  handleMonsterAttack(monster, target);
                }
                
                // End turn after movement
                setTimeout(() => {
                  gameState.endTurn();
                  setTimeout(() => {
                    gameState.nextTurn();
                  }, 500);
                }, 1000);
              }
            } catch (error) {
              console.error("Error in monster turn:", error);
              gameState.endTurn();
              setTimeout(() => {
                gameState.nextTurn();
              }, 500);
            }
          }, 1000);
        };
        
        // Helper function to check if move is valid
        const isValidMove = (x, y) => {
          // Check grid bounds
          if (y < 0 || y >= dungeon.grid.length || x < 0 || x >= dungeon.grid[0].length) {
            return false;
          }
          
          // Check if cell is walkable (1 = room floor, 2 = corridor)
          if (![1, 2].includes(dungeon.grid[y][x])) {
            return false;
          }
          
          // Check if cell is occupied
          if ([...players, ...monsters].some(entity => entity.x === x && entity.y === y)) {
            return false;
          }
          
          return true;
        };
        
        // Initialize combat menu
        const container = document.getElementById('combat-menu-container');
        if (container) {
          const combatMenu = new CombatMenu(gameState, container);
          
          setCombatSystem({
            gameState,
            combatMenu
          });
        }
      } catch (error) {
        console.error("Error initializing combat system:", error);
      }
    }  }, [dungeon, players, monsters, addLogEntry, handleSelfHealing, activeEntity, handleMonsterAttack, moveEntity]); 
  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  // combatSystem is intentionally omitted from the dependency array to prevent infinite loops

  const handleCellClick = (x, y) => {
    if (!dungeon?.grid) return;
    
    console.log(`Cell clicked at (${x}, ${y})`);
    
    // Combat integration
    if (gameState === 'combat' && combatSystem?.gameState) {
      // Check if we're in a player's turn during combat
      const isCombatPlayerTurn = activeEntity && 
                                 activeEntity.type === 'player' && 
                                 validMoves.some(move => move.x === x && move.y === y);
      
      if (isCombatPlayerTurn) {
        console.log(`Moving player ${activeEntity.properties.name} to (${x}, ${y})`);
        moveEntity(activeEntity, x, y);
        return;
      }
    }
    
    // Spell casting mode
    if (gameState === 'casting' && activeEntity && activeClassAbility) {
      const clickedMonster = monsters.find(m => m.x === x && m.y === y);
      
      if (clickedMonster) {
        handleCombatWithAbility(activeEntity, clickedMonster, activeClassAbility);
        setActiveClassAbility(null);
        setGameState('combat');
        
        if (combatSystem?.gameState?.endTurn) {
          combatSystem.gameState.endTurn();
        }
      }
      return;
    }
    
    // Additional logic for selecting entities, etc...
    const clickedPlayer = players.find(p => p.x === x && p.y === y);
    const clickedMonster = monsters.find(m => m.x === x && m.y === y);
    
    // Special handling for Magic Missile's multi-targeting mode
    if (gameState === 'multiTargeting' && activeEntity && activeClassAbility?.name === "Magic Missile") {
      // Only allow targeting monsters
      if (clickedMonster) {
        // If this is our first target, initialize the magic missile targets array
        if (!activeEntity.magicMissileTargets) {
          activeEntity.magicMissileTargets = [];
        }
        
        // Add this monster to our targets list
        activeEntity.magicMissileTargets.push(clickedMonster);
        addLogEntry(`Magic Missile dart ${activeEntity.magicMissileTargets.length} targets ${clickedMonster.properties.name}`);
        
        // If we've targeted the maximum number of darts (3), resolve all attacks
        if (activeEntity.magicMissileTargets.length >= 3) {
          // Process all magic missile dart attacks
          resolveMagicMissileAttacks(activeEntity, activeEntity.magicMissileTargets, activeClassAbility);
          
          // Reset state
          setActiveClassAbility(null);
          activeEntity.magicMissileTargets = [];
          setGameState('exploring');
          setActiveEntity(null);
          return;
        }
        
        // Otherwise, continue targeting
        return;
      } else {
        addLogEntry("Magic Missile must target a monster. Click on a monster to direct a dart.");
        return;
      }
    }
    
    if (gameState === 'exploring') {
      // Exploration phase - select an entity if clicked, or move a player to a valid empty floor cell
      if (clickedPlayer || clickedMonster) {
        // Select the entity
        const entity = clickedPlayer || clickedMonster;
        setActiveEntity(entity);
        
        // Calculate valid moves for the selected entity
        const moves = findValidMoves(entity, dungeon.grid, [...players, ...monsters]);
        setValidMoves(moves);
        
        setGameState(clickedPlayer ? 'moving' : 'monsterTurn');
        
        if (clickedPlayer) {
          addLogEntry(`${entity.properties.name} selected (HP: ${entity.properties.hp}/${entity.properties.maxHp}, AC: ${entity.properties.ac})`);
        } else {
          addLogEntry(`${entity.properties.name} selected`);
        }
      } 
      else if (dungeon.grid[y][x] === 1) {
        // If we clicked on an empty floor cell and no entity is selected, try to move the first player
        if (players.length > 0 && !players.some(p => p.x === x && p.y === y) && !monsters.some(m => m.x === x && m.y === y)) {
          const firstPlayer = players[0];
          if (firstPlayer) {
            // Move the player to the clicked position
            console.log(`Moving player ${firstPlayer.properties?.name || 'Unknown'} to (${x}, ${y})`);
            moveEntity(firstPlayer, x, y);
          }
        }
      }
      return;
    }
    
    // Movement or attack phase
    if ((gameState === 'moving' || gameState === 'monsterTurn') && activeEntity) {
      const activeIsMonster = activeEntity.type === 'monster';
      const validTarget = activeIsMonster ? clickedPlayer : clickedMonster;
      
      // Check if clicked on a valid move position
      if (validMoves.some(move => move.x === x && move.y === y)) {
        // Move the entity to the new position
        moveEntity(activeEntity, x, y);
        
        // Check if move puts us adjacent to a valid target for automatic attack
        if (activeIsMonster && validTarget && isAdjacent(activeEntity, validTarget)) {
          handleMonsterAttack(activeEntity, validTarget);
        }
        
        return;
      }
    }
  };

  const handleCombatWithAbility = (attacker, defender, ability) => {
    // Check if this is a pure spell (no weapon involved)
    const isPureSpell = ability.isPureSpell || ability.isRangedSpell || 
                       ability.name === "Radiant Lance" || 
                       ability.name === "Guiding Bolt" || 
                       ability.name === "Eldritch Blast";
    
    if (isPureSpell) {
      // Handle pure spell attack (no weapon involved)
      
      // Roll for spell attack
      const attackRoll = Math.floor(Math.random() * 20) + 1;
      // Use spellcastingBonus if available, otherwise fall back to attackBonus
      const attackBonus = attacker.properties?.spellcastingBonus || attacker.properties?.attackBonus || 0;
      const toHit = attackRoll + attackBonus;
      const defenderAC = defender.properties?.ac || 10;
      
      // Check for critical hit or miss
      const isCritical = attackRoll === 20;
      const isCriticalMiss = attackRoll === 1;
      
      // Process hit or miss
      if (isCritical || (!isCriticalMiss && toHit >= defenderAC)) {
        // Hit - calculate spell damage
        const abilityDamage = ability.damage || "1d8";
        const diceMatch = abilityDamage.match(/(\d+)d(\d+)(?:\+(\d+))?/);
        
        if (diceMatch) {
          const numDice = parseInt(diceMatch[1], 10);
          const diceType = parseInt(diceMatch[2], 10);
          const bonusDamage = diceMatch[3] ? parseInt(diceMatch[3], 10) : 0;
          
          let spellDamageRoll = 0;
          for (let i = 0; i < numDice; i++) {
            spellDamageRoll += Math.floor(Math.random() * diceType) + 1;
          }
          
          // Add the bonus damage if any
          spellDamageRoll += bonusDamage;
          
          // If the ability doesn't have a damage type defined, determine it based on the spell name
          if (!ability.damageType) {
            const spellName = ability.name.toLowerCase();
            
            // Fire spells
            if (spellName.includes('fire') || 
                spellName.includes('flame') || 
                spellName.includes('burn') ||
                spellName.includes('blaze') ||
                spellName.includes('scorch')) {
              ability.damageType = 'fire';
            }
            // Cold spells
            else if (spellName.includes('cold') || 
                    spellName.includes('frost') || 
                    spellName.includes('ice') ||
                    spellName.includes('freeze')) {
              ability.damageType = 'cold';
            }
            // Lightning/thunder spells
            else if (spellName.includes('lightning') || 
                    spellName.includes('thunder') || 
                    spellName.includes('storm') ||
                    spellName.includes('shock') ||
                    spellName.includes('bolt')) {
              ability.damageType = spellName.includes('thunder') ? 'thunder' : 'lightning';
            }
            // Acid spells
            else if (spellName.includes('acid') || 
                    spellName.includes('corrosive')) {
              ability.damageType = 'acid';
            }
            // Poison spells
            else if (spellName.includes('poison') || 
                    spellName.includes('toxic') ||
                    spellName.includes('venom')) {
              ability.damageType = 'poison';
            }
            // Psychic spells
            else if (spellName.includes('psychic') || 
                    spellName.includes('mind') ||
                    spellName.includes('psionic')) {
              ability.damageType = 'psychic';
            }
            // Necrotic spells
            else if (spellName.includes('necro') || 
                    spellName.includes('death') ||
                    spellName.includes('withering') ||
                    spellName.includes('drain')) {
              ability.damageType = 'necrotic';
            }
            // Radiant spells
            else if (spellName.includes('radiant') || 
                    spellName.includes('holy') ||
                    spellName.includes('divine') ||
                    spellName.includes('sacred') ||
                    spellName.includes('light') ||
                    spellName.includes('radiance') ||
                    spellName.includes('lance')) {
              ability.damageType = 'radiant';
            }
            // Force spells
            else if (spellName.includes('force') || 
                    spellName.includes('missile') ||
                    spellName.includes('arcane')) {
              ability.damageType = 'force';
            }
            // Default to magical damage
            else {
              ability.damageType = 'magical';
            }
          }
          
          // Create a message for the spell attack
          let message;
          
          if (isCritical) {
            message = `Critical hit! ${attacker.properties.name} casts ${ability.name} and rolls ${attackRoll} + ${attackBonus} = ${toHit} vs AC ${defenderAC}. Critical spell damage: ${spellDamageRoll} ${ability.damageType} damage!`;
          } else {
            message = `Hit! ${attacker.properties.name} casts ${ability.name} and rolls ${attackRoll} + ${attackBonus} = ${toHit} vs AC ${defenderAC}. Spell damage: ${spellDamageRoll} ${ability.damageType} damage!`;
          }
          
          // Reduce spell charges for the caster if it's not a cantrip
          const newPlayers = players.map(p => {
            if (p.id === attacker.id) {
              // Only reduce charges for non-cantrips
              const updatedAbilities = p.properties.classAbilities.map(a => {
                if (a.name === ability.name && !ability.isCantrip) {
                  return { ...a, charges: a.charges - 1 };
                }
                return a;
              });
              
              return {
                ...p,
                properties: {
                  ...p.properties,
                  classAbilities: updatedAbilities
                }
              };
            }
            return p;
          });
          
          setPlayers(newPlayers);
          
          // Process hit result against the defender
          const newHp = defender.properties.hp - spellDamageRoll;
          addLogEntry(message);
          
          if (newHp <= 0) {
            setMonsters(monsters.filter(m => m.id !== defender.id));
            
            // Notify combat system about entity death
            if (combatSystem?.gameState?.handleEntityDeath) {
              combatSystem.gameState.handleEntityDeath(
                defender.id, 
                defender.properties.name, 
                defender.type
              );
            } else {
              addLogEntry(`${defender.properties.name} is defeated!`);
            }
          } else {
            setMonsters(monsters.map(m => 
              m.id === defender.id 
                ? { ...m, properties: { ...m.properties, hp: newHp }} 
                : m
            ));
          }
          return;
        }
      } else {
        // Miss
        const message = `Miss! ${attacker.properties.name} casts ${ability.name} and rolls ${attackRoll} + ${attackBonus} = ${toHit} vs AC ${defenderAC}.`;
        addLogEntry(message);
        
        // Reduce spell charges for the caster if it's not a cantrip
        if (!ability.isCantrip) {
          const newPlayers = players.map(p => {
            if (p.id === attacker.id) {
              const updatedAbilities = p.properties.classAbilities.map(a => {
                if (a.name === ability.name) {
                  return { ...a, charges: a.charges - 1 };
                }
                return a;
              });
              
              return {
                ...p,
                properties: {
                  ...p.properties,
                  classAbilities: updatedAbilities
                }
              };
            }
            return p;
          });
          
          setPlayers(newPlayers);
        }
        return;
      }
    }
    
    // Find the player's weapon - either from selectedWeapon or default to first weapon
    const weapon = attacker.selectedWeapon || {
      name: "Improvised Weapon",
      damage: "1d4",
      damageType: "bludgeoning"
    };
    
    // Call resolvePlayerAttack with the weapon parameter
    const result = resolvePlayerAttack(attacker, defender, weapon);
    
    // Create safe message formatting that doesn't rely on rollDetails
    if (result.hit) {
      // Use ability.damage instead of ability.damageDice
      const abilityDamage = ability.damage || "1d6";
      const diceMatch = abilityDamage.match(/(\d+)d(\d+)(?:\+(\d+))?/);
      
      if (diceMatch) {
        const numDice = parseInt(diceMatch[1], 10);
        const diceType = parseInt(diceMatch[2], 10);
        const bonusDamage = diceMatch[3] ? parseInt(diceMatch[3], 10) : 0;
        
        let abilityDamageRoll = 0;
        for (let i = 0; i < numDice; i++) {
          abilityDamageRoll += Math.floor(Math.random() * diceType) + 1;
        }
        
        // Add the bonus damage if any
        abilityDamageRoll += bonusDamage;
        
        const totalDamage = result.damage + abilityDamageRoll;
        
        // Check if the ability has a damage type, if not determine it
        if (!ability.damageType) {
          const spellName = ability.name.toLowerCase();
          
          // Fire spells
          if (spellName.includes('fire') || 
              spellName.includes('flame') || 
              spellName.includes('burn') ||
              spellName.includes('blaze') ||
              spellName.includes('scorch')) {
            ability.damageType = 'fire';
          }
          // Cold spells
          else if (spellName.includes('cold') || 
                  spellName.includes('frost') || 
                  spellName.includes('ice') ||
                  spellName.includes('freeze')) {
            ability.damageType = 'cold';
          }
          // Lightning/thunder spells
          else if (spellName.includes('lightning') || 
                  spellName.includes('thunder') || 
                  spellName.includes('storm') ||
                  spellName.includes('shock') ||
                  spellName.includes('bolt')) {
            ability.damageType = spellName.includes('thunder') ? 'thunder' : 'lightning';
          }
          // Acid spells
          else if (spellName.includes('acid') || 
                  spellName.includes('corrosive')) {
            ability.damageType = 'acid';
          }
          // Poison spells
          else if (spellName.includes('poison') || 
                  spellName.includes('toxic') ||
                  spellName.includes('venom')) {
            ability.damageType = 'poison';
          }
          // Psychic spells
          else if (spellName.includes('psychic') || 
                  spellName.includes('mind') ||
                  spellName.includes('psionic')) {
            ability.damageType = 'psychic';
          }
          // Necrotic spells
          else if (spellName.includes('necro') || 
                  spellName.includes('death') ||
                  spellName.includes('life drain') ||
                  spellName.includes('withering')) {
            ability.damageType = 'necrotic';
          }
          // Radiant spells
          else if (spellName.includes('radiant') || 
                  spellName.includes('holy') ||
                  spellName.includes('divine') ||
                  spellName.includes('sacred') ||
                  spellName.includes('light') ||
                  spellName.includes('radiance') ||
                  spellName.includes('lance')) {
            ability.damageType = 'radiant';
          }
          // Force spells
          else if (spellName.includes('force') || 
                  spellName.includes('missile') ||
                  spellName.includes('arcane')) {
            ability.damageType = 'force';
          }
          // Default to magical damage
          else {
            ability.damageType = 'magical';
          }
        }
        
        // Create a message that indicates if this is a cantrip
        const spellType = ability.isCantrip ? "cantrip" : "spell";
        
        // Fix issue with result message - don't use rollDetails which might be undefined
        let baseMessage = "";
        if (result.critical) {
          baseMessage = `Critical hit! ${attacker.properties.name} attacks ${defender.properties.name} with a weapon.`;
        } else {
          baseMessage = `Hit! ${attacker.properties.name} attacks ${defender.properties.name} with a weapon.`;
        }
        
        const abilityResult = {
          ...result,
          damage: totalDamage,
          message: `${baseMessage} Weapon damage: ${result.damage} + ${ability.name} ${spellType} for an additional ${abilityDamageRoll} ${ability.damageType || 'magical'} damage! Total: ${totalDamage} damage!`
        };
        
        // Rest of the function remains the same
        const newPlayers = players.map(p => {
          if (p.id === attacker.id) {
            // Only reduce charges for non-cantrips
            const updatedAbilities = p.properties.classAbilities.map(a => {
              if (a.name === ability.name && !ability.isCantrip) {
                return { ...a, charges: a.charges - 1 };
              }
              return a;
            });
            
            return {
              ...p,
              properties: {
                ...p.properties,
                classAbilities: updatedAbilities
              }
            };
          }
          return p;
        });
        
        setPlayers(newPlayers);
        
        handleCombatResult(abilityResult, defender);
        return;
      }
    }
    
    handleCombatResult(result, defender);
  };

  const isAdjacent = (entity1, entity2) => {
    if (!entity1 || !entity2) return false;
    const dx = Math.abs(entity1.x - entity2.x);
    const dy = Math.abs(entity1.y - entity2.y);
    return dx <= 1 && dy <= 1;
  };

  const handleCombatResult = (result, defender) => {
    addLogEntry(result.message);
    if (result.hit) {
      const newHp = defender.properties.hp - result.damage;
      if (newHp <= 0) {
        // Store defender information before removal
        const defenderInfo = {
          id: defender.id,
          name: defender.properties.name,
          type: defender.type
        };
        
        // Remove monster from the state first
        setMonsters(monsters.filter(m => m.id !== defender.id));
        
        // Then notify combat system about entity death
        if (combatSystem?.gameState?.handleEntityDeath) {
          combatSystem.gameState.handleEntityDeath(
            defenderInfo.id, 
            defenderInfo.name, 
            defenderInfo.type
          );
        } else {
          addLogEntry(`${defenderInfo.name} is defeated!`);
        }
      } else {
        // Update monster's HP without recreating the whole object structure
        setMonsters(monsters.map(m => 
          m.id === defender.id 
            ? { ...m, properties: { ...m.properties, hp: newHp }} 
            : m
        ));
        
        // If we're in combat, also update the monster in the combatants array
        if (combatSystem?.gameState) {
          // Find the updated monster
          const updatedMonster = monsters.find(m => m.id === defender.id);
          if (updatedMonster) {
            // Update monster's HP in the combat state
            if (combatSystem.gameState.combatants) {
              const monsterIndex = combatSystem.gameState.combatants.findIndex(c => c.id === defender.id);
              if (monsterIndex >= 0) {
                combatSystem.gameState.combatants[monsterIndex] = {
                  ...combatSystem.gameState.combatants[monsterIndex], 
                  properties: { 
                    ...combatSystem.gameState.combatants[monsterIndex].properties, 
                    hp: newHp 
                  }
                };
              }
            }
          }
        }
      }
    }
  };

  const generateDungeonWithSetting = (settings) => {
    console.log("Generating dungeon with settings:", settings);
    
    // Create generator with updated settings
    const generatorOptions = { width: 40, height: 30 };
    
    // Apply monster density settings
    if (settings.monsterDensity) {
      if (settings.monsterDensity === 'low') {
        generatorOptions.monsterDensity = 0.1;
        addLogEntry("Setting monster density to low");
      } else if (settings.monsterDensity === 'medium') {
        generatorOptions.monsterDensity = 0.2;
        addLogEntry("Setting monster density to medium");
      } else if (settings.monsterDensity === 'high') {
        generatorOptions.monsterDensity = 0.3;
        addLogEntry("Setting monster density to high");
      }
    }
    
    // Apply room size settings
    if (settings.roomSizePreference) {
      generatorOptions.roomSizePreference = settings.roomSizePreference;
      addLogEntry(`Setting room size preference to ${settings.roomSizePreference}`);
    }
    
    // Apply corridor density settings
    if (settings.corridorDensity) {
      if (settings.corridorDensity === 'low') {
        generatorOptions.corridorDensity = 0.2;
        addLogEntry("Setting corridor density to low");
      } else if (settings.corridorDensity === 'high') {
        generatorOptions.corridorDensity = 0.5;
        addLogEntry("Setting corridor density to high");
      }
    }
    
    // Apply dungeon type
    if (settings.dungeonType) {
      generatorOptions.dungeonType = settings.dungeonType;
      addLogEntry(`Setting dungeon type to ${settings.dungeonType}`);
    }
    
    // Generate the new dungeon with these settings
    const generator = new DungeonGenerator(generatorOptions);
    const newDungeon = generator.generate();
    setDungeon(newDungeon);
    
    // Place player in the entry room
    const startRoom = newDungeon.specialRooms?.entry || {
      x: 1, 
      y: 1, 
      width: 3, 
      height: 3
    };
    const playerX = startRoom.x + Math.floor(startRoom.width / 2);
    const playerY = startRoom.y + Math.floor(startRoom.height / 2);
    
    // Create/update player
    let newPlayer;
    if (players.length > 0) {
      // Keep existing player data but update position
      newPlayer = { ...players[0], x: playerX, y: playerY };
    } else {
      newPlayer = initializeTestPlayer(playerX, playerY, characterData);
    }
    setPlayers([newPlayer]);
    
    // Add monsters from bestiary based on the dungeon settings
    placeNewMonstersInDungeon(newDungeon, generatorOptions);
  };

  const placeNewMonstersInDungeon = (newDungeon, options) => {
    try {
      // Import monsters from the bestiary
      const { BESTIARY } = require('./data/bestiary/index');
      const darklingsAndDarkformes = BESTIARY[0]?.creatures || [];
      
      // Find available rooms for monsters (excluding entry room)
      const availableRooms = newDungeon.rooms.filter(room => {
        return !(newDungeon.specialRooms?.entry && 
                room.x === newDungeon.specialRooms.entry.x && 
                room.y === newDungeon.specialRooms.entry.y);
      });
      
      if (availableRooms.length === 0) {
        console.warn('No available rooms to place bestiary monsters');
        setMonsters([]);
        return;
      }
      
      // Calculate number of monsters based on density
      const monsterDensity = options.monsterDensity || 0.2;
      let monsterCount = Math.max(1, Math.floor(availableRooms.length * monsterDensity));
      
      // Select random monsters
      const getRandomMonsters = (arr, count) => {
        if (!arr || !arr.length) return [];
        const result = [];
        const tempArray = [...arr];
        
        for (let i = 0; i < count && tempArray.length > 0; i++) {
          const randomIndex = Math.floor(Math.random() * tempArray.length);
          result.push(tempArray.splice(randomIndex, 1)[0]);
        }
        
        return result;
      };
      
      const monsterPool = getRandomMonsters(darklingsAndDarkformes, monsterCount);
      const bestiaryMonsters = [];
      
      // Add these monsters to rooms
      for (let i = 0; i < monsterPool.length; i++) {
        const monster = monsterPool[i];
        const room = availableRooms[i % availableRooms.length];
        
        // Calculate token size based on monster size
        let tokenSize = monster.tokenSize || 1;
        if (!monster.tokenSize && monster.size && Array.isArray(monster.size)) {
          const sizeCode = monster.size[0];
          if (sizeCode === 'G') tokenSize = 4;      // Gargantuan
          else if (sizeCode === 'H') tokenSize = 3; // Huge
          else if (sizeCode === 'L') tokenSize = 2; // Large
          else tokenSize = 1;                       // Medium or smaller
        }

        // Position monster in the room
        const monsterX = Math.min(room.x + Math.floor(room.width / 2), room.x + room.width - tokenSize);
        const monsterY = Math.min(room.y + Math.floor(room.height / 2), room.y + room.height - tokenSize);
        
        // Get the monster's stats
        const monsterStats = monster.stats || {};
        
        // Create a monster entity
        const monsterEntity = {
          id: `monster_${Math.random().toString(36).substr(2, 9)}`,
          type: 'monster',
          name: monster.name,
          x: monsterX,
          y: monsterY,
          size: tokenSize,
          properties: {
            name: monster.name,
            symbol: monster.name.charAt(0),
            hp: monsterStats.hitPoints || 10,
            maxHp: monsterStats.hitPoints || 10,
            ac: monsterStats.armorClass || 10,
            attackBonus: monsterStats.attacks?.[0]?.toHit || 
                         (monsterStats.attacks?.[0]?.description?.match(/\+(\d+) to hit/)?.[1] || 0),
            damageBonus: 0,
            size: monsterStats.size || 'medium',
            tokenSize: tokenSize,
            type: monster.type || 'unknown',
            monsterData: monster,
            stats: monsterStats,
            abilities: monsterStats.abilities || [],
            attacks: monsterStats.attacks || [],
            challengeRating: monsterStats.challengeRating || '?',
            strength: monsterStats.str,
            dexterity: monsterStats.dex,
            constitution: monsterStats.con,
            intelligence: monsterStats.int,
            wisdom: monsterStats.wis,
            charisma: monsterStats.cha,
            isInteractive: true
          }
        };
        
        bestiaryMonsters.push(monsterEntity);
        console.log(`Added ${monster.name} (${monsterStats.size}, CR ${monsterStats.challengeRating}) at (${monsterX},${monsterY})`);
      }
      
      // Set monsters to our bestiary ones
      setMonsters(bestiaryMonsters);
      
      // Update game log
      addLogEntry(`Generated dungeon with ${bestiaryMonsters.length} monsters from your bestiary.`);
      bestiaryMonsters.forEach(monster => {
        addLogEntry(`- ${monster.properties.name} (HP: ${monster.properties.hp}, AC: ${monster.properties.ac})`);
      });
    } catch (err) {
      console.error('Error placing monsters:', err);
      addLogEntry(`Error placing monsters: ${err.message}`);
    }
  };

  const addRandomMonster = () => {
    if (!dungeon) {
      addLogEntry("Cannot add monster - no dungeon exists");
      return;
    }
    
    try {
      // Import monsters from bestiary
      const { BESTIARY } = require('./data/bestiary/index');
      const allMonsters = BESTIARY[0]?.creatures || [];
      
      if (allMonsters.length === 0) {
        addLogEntry("No monsters available in bestiary");
        return;
      }
      
      // Select a random monster
      const randomIndex = Math.floor(Math.random() * allMonsters.length);
      const monster = allMonsters[randomIndex];
      
      // Find a random empty floor cell
      const emptyCells = [];
      for (let y = 0; y < dungeon.grid.length; y++) {
        for (let x = 0; x < dungeon.grid[y].length; x++) {
          // Check if it's a floor cell (1) and no entity is already there
          if (dungeon.grid[y][x] === 1 && 
              !players.some(p => p.x === x && p.y === y) && 
              !monsters.some(m => m.x === x && m.y === y) &&
              !isInStartRoom(x, y)) {
            emptyCells.push({ x, y });
          }
        }
      }
      
      if (emptyCells.length === 0) {
        addLogEntry("No empty floor cells to place monster");
        return;
      }
      
      // Choose a random empty cell
      const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      
      // Calculate token size
      let tokenSize = monster.tokenSize || 1;
      if (!monster.tokenSize && monster.size && Array.isArray(monster.size)) {
        const sizeCode = monster.size[0];
        if (sizeCode === 'G') tokenSize = 4;      // Gargantuan
        else if (sizeCode === 'H') tokenSize = 3; // Huge
        else if (sizeCode === 'L') tokenSize = 2; // Large
        else tokenSize = 1;                       // Medium or smaller
      }
      
      // Get monster stats
      const monsterStats = monster.stats || {};
      
      // Create the monster entity
      const monsterEntity = {
        id: `monster_${Math.random().toString(36).substr(2, 9)}`,
        type: 'monster',
        name: monster.name,
        x: cell.x,
        y: cell.y,
        size: tokenSize,
        properties: {
          name: monster.name,
          symbol: monster.name.charAt(0),
          hp: monsterStats.hitPoints || 10,
          maxHp: monsterStats.hitPoints || 10,
          ac: monsterStats.armorClass || 10,
          attackBonus: monsterStats.attacks?.[0]?.toHit || 
                       (monsterStats.attacks?.[0]?.description?.match(/\+(\d+) to hit/)?.[1] || 0),
          damageBonus: 0,
          size: monsterStats.size || 'medium',
          tokenSize: tokenSize,
          type: monster.type || 'unknown',
          monsterData: monster,
          stats: monsterStats,
          abilities: monsterStats.abilities || [],
          attacks: monsterStats.attacks || [],
          challengeRating: monsterStats.challengeRating || '?',
          strength: monsterStats.str,
          dexterity: monsterStats.dex,
          constitution: monsterStats.con,
          intelligence: monsterStats.int,
          wisdom: monsterStats.wis,
          charisma: monsterStats.cha,
          isInteractive: true
        }
      };
      
      // Add the monster to the list
      setMonsters([...monsters, monsterEntity]);
      addLogEntry(`Added ${monster.name} at (${cell.x}, ${cell.y})`);
    } catch (err) {
      console.error("Error adding random monster:", err);
      addLogEntry(`Error adding monster: ${err.message}`);
    }
  };

  const addSpecificMonsterType = (sizeCategory) => {
    if (!dungeon) {
      addLogEntry("Cannot add monster - no dungeon exists");
      return;
    }
    
    try {
      // Import categorized monsters
      const { CATEGORIZED_MONSTERS } = require('./data/bestiary/index');
      
      // Get monsters of the specific size category
      let monstersBySize = [];
      switch (sizeCategory) {
        case 'tiny':
          monstersBySize = CATEGORIZED_MONSTERS.tiny || [];
          break;
        case 'small':
          monstersBySize = CATEGORIZED_MONSTERS.small || [];
          break;
        case 'medium':
          monstersBySize = CATEGORIZED_MONSTERS.medium || [];
          break;
        case 'large':
          monstersBySize = CATEGORIZED_MONSTERS.large || [];
          break;
        case 'huge':
          monstersBySize = CATEGORIZED_MONSTERS.huge || [];
          break;
        default:
          monstersBySize = [];
      }
      
      if (monstersBySize.length === 0) {
        addLogEntry(`No ${sizeCategory} monsters available in bestiary`);
        return;
      }
      
      // Select a random monster of the specified size
      const randomIndex = Math.floor(Math.random() * monstersBySize.length);
      const monster = monstersBySize[randomIndex];
      
      // Find a random empty floor cell with enough space for the monster
      const tokenSize = monster.tokenSize || 
                      (sizeCategory === 'huge' ? 3 : 
                       sizeCategory === 'large' ? 2 : 1);
      
      const emptyCells = [];
      for (let y = 0; y < dungeon.grid.length - tokenSize + 1; y++) {
        for (let x = 0; x < dungeon.grid[y].length - tokenSize + 1; x++) {
          // Check if all cells in the monster's footprint are empty floor
          let validPosition = true;
          
          for (let dy = 0; dy < tokenSize; dy++) {
            for (let dx = 0; dx < tokenSize; dx++) {
              // Check if it's a floor cell and no entity is already there
              if (y + dy >= dungeon.grid.length || 
                  x + dx >= dungeon.grid[y].length ||
                  dungeon.grid[y + dy][x + dx] !== 1 || 
                  players.some(p => p.x === x + dx && p.y === y + dy) || 
                  monsters.some(m => m.x === x + dx && m.y === y + dy) ||
                  isInStartRoom(x + dx, y + dy)) {
                validPosition = false;
                break;
              }
            }
            if (!validPosition) break;
          }
          
          if (validPosition) {
            emptyCells.push({ x, y });
          }
        }
      }
      
      if (emptyCells.length === 0) {
        addLogEntry(`No suitable space to place a ${sizeCategory} monster`);
        return;
      }
      
      // Choose a random empty cell
      const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      
      // Get monster stats
      const monsterStats = monster.stats || {};
      
      // Create the monster entity
      const monsterEntity = {
        id: `monster_${Math.random().toString(36).substr(2, 9)}`,
        type: 'monster',
        name: monster.name,
        x: cell.x,
        y: cell.y,
        size: tokenSize,
        properties: {
          name: monster.name,
          symbol: monster.name.charAt(0),
          hp: monsterStats.hitPoints || 10,
          maxHp: monsterStats.hitPoints || 10,
          ac: monsterStats.armorClass || 10,
          attackBonus: monsterStats.attacks?.[0]?.toHit || 
                       (monsterStats.attacks?.[0]?.description?.match(/\+(\d+) to hit/)?.[1] || 0),
          damageBonus: 0,
          size: monsterStats.size || sizeCategory,
          tokenSize: tokenSize,
          type: monster.type || 'unknown',
          monsterData: monster,
          stats: monsterStats,
          abilities: monsterStats.abilities || [],
          attacks: monsterStats.attacks || [],
          challengeRating: monsterStats.challengeRating || '?',
          strength: monsterStats.str,
          dexterity: monsterStats.dex,
          constitution: monsterStats.con,
          intelligence: monsterStats.int,
          wisdom: monsterStats.wis,
          charisma: monsterStats.cha,
          isInteractive: true
        }
      };
      
      // Add the monster to the list
      setMonsters([...monsters, monsterEntity]);
      addLogEntry(`Added ${sizeCategory} monster: ${monster.name} at (${cell.x}, ${cell.y})`);
    } catch (err) {
      console.error(`Error adding ${sizeCategory} monster:`, err);
      addLogEntry(`Error adding monster: ${err.message}`);
    }
  };

  const healAllMonsters = () => {
    setMonsters(monsters.map(monster => ({
      ...monster,
      properties: {
        ...monster.properties,
        hp: monster.properties.maxHp
      }
    })));
    addLogEntry("All monsters healed to full health.");
  };

  const removeAllMonsters = () => {
    setMonsters([]);
    addLogEntry("All monsters removed from the dungeon.");
  };

  const damageAllMonsters = (damage) => {
    setMonsters(monsters.map(monster => {
      const newHp = Math.max(0, monster.properties.hp - damage);
      
      if (newHp <= 0) {
        addLogEntry(`${monster.properties.name} was defeated by the damage!`);
      }
      
      return {
        ...monster,
        properties: {
          ...monster.properties,
          hp: newHp
        }
      };
    }).filter(monster => monster.properties.hp > 0));
    
    addLogEntry(`All monsters damaged by ${damage} points.`);
  };

  const highlightRooms = () => {
    if (!dungeon) {
      addLogEntry("Cannot highlight rooms - no dungeon exists");
      return;
    }
    
    dungeon.rooms.forEach((room, index) => {
      // Add a log entry about this room
      addLogEntry(`Room #${index+1}: Size ${room.width}x${room.height} at (${room.x},${room.y})`);
      
      if (room === dungeon.specialRooms?.entry) {
        addLogEntry(`Room #${index+1} is the Entry Room`);
      }
      
      // Check if any monsters are in this room
      const monstersInRoom = monsters.filter(monster => 
        monster.x >= room.x && monster.x < room.x + room.width &&
        monster.y >= room.y && monster.y < room.y + room.height
      );
      
      if (monstersInRoom.length > 0) {
        addLogEntry(`Room #${index+1} contains ${monstersInRoom.length} monsters: ${monstersInRoom.map(m => m.properties.name).join(', ')}`);
      }
    });
  };

  const showDungeonStats = () => {
    if (!dungeon) {
      addLogEntry("Cannot show dungeon stats - no dungeon exists");
      return;
    }
    
    // Display dungeon statistics
    addLogEntry("--- Dungeon Statistics ---");
    addLogEntry(`Dimensions: ${dungeon.grid[0].length}x${dungeon.grid.length}`);
    addLogEntry(`Total Rooms: ${dungeon.rooms.length}`);
    
    // Count corridor cells
    let corridorCells = 0;
    let floorCells = 0;
    let wallCells = 0;
    
    for (let y = 0; y < dungeon.grid.length; y++) {
      for (let x = 0; x < dungeon.grid[y].length; x++) {
        if (dungeon.grid[y][x] === 1) {
          // Check if this floor cell is in a room
          const inRoom = dungeon.rooms.some(room => 
            x >= room.x && x < room.x + room.width &&
            y >= room.y && y < room.y + room.height
          );
          
          if (inRoom) {
            floorCells++;
          } else {
            corridorCells++;
          }
        } else if (dungeon.grid[y][x] === 0) {
          wallCells++;
        }
      }
    }
    
    addLogEntry(`Room Cells: ${floorCells}`);
    addLogEntry(`Corridor Cells: ${corridorCells}`);
    addLogEntry(`Wall Cells: ${wallCells}`);
    
    // Special rooms
    const specialRooms = Object.keys(dungeon.specialRooms).length;
    addLogEntry(`Special Rooms: ${specialRooms}`);
    
    // Monster statistics
    const monstersByType = {};
    const monstersBySize = { tiny: 0, small: 0, medium: 0, large: 0, huge: 0 };
    
    monsters.forEach(monster => {
      // Count by type
      const type = monster.properties.type || 'unknown';
      monstersByType[type] = (monstersByType[type] || 0) + 1;
      
      // Count by size
      const size = monster.properties.size || 'medium';
      if (monstersBySize[size] !== undefined) {
        monstersBySize[size]++;
      }
    });
    
    addLogEntry(`Total Monsters: ${monsters.length}`);
    addLogEntry(`Monster Types: ${Object.entries(monstersByType).map(([type, count]) => `${type} (${count})`).join(', ')}`);
    addLogEntry(`Monster Sizes: ${Object.entries(monstersBySize).filter(([_, count]) => count > 0).map(([size, count]) => `${size} (${count})`).join(', ')}`);
  };

  const toggleGridDisplay = () => {
    setShowGrid(!showGrid);
    addLogEntry(`Grid display ${!showGrid ? 'enabled' : 'disabled'}`);
    
    // Update the renderer's grid display
    const gridContainer = document.querySelector('.dungeon-renderer-container');
    if (gridContainer) {
      if (!showGrid) {
        gridContainer.style.backgroundImage = 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)';
        gridContainer.style.backgroundSize = `24px 24px`;
      } else {
        gridContainer.style.backgroundImage = 'none';
      }
    }
  };

  const exportDungeon = () => {
    if (!dungeon) {
      addLogEntry("Cannot export - no dungeon exists");
      return;
    }
    
    // Create exportable dungeon data
    const exportData = {
      grid: dungeon.grid,
      rooms: dungeon.rooms,
      corridors: dungeon.corridors,
      specialRooms: dungeon.specialRooms,
      entities: [
        ...players.map(p => ({ 
          ...p, 
          type: 'player',
          exported: true
        })),
        ...monsters.map(m => ({ 
          ...m, 
          type: 'monster',
          exported: true
        })),
      ],
      config: dungeon.config || {}
    };
    
    // Convert to JSON string
    const jsonData = JSON.stringify(exportData, null, 2);
    
    // Create a downloadable file
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dnd-dungeon-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addLogEntry("Dungeon exported successfully");
  };
  
  const exportGameFile = () => {
    if (!dungeon) {
      addLogEntry("Cannot export - no dungeon exists");
      return;
    }
    
    // Create exportable game data including logs
    const exportData = {
      dungeon: {
        grid: dungeon.grid,
        rooms: dungeon.rooms,
        corridors: dungeon.corridors,
        specialRooms: dungeon.specialRooms,
        config: dungeon.config || {}
      },
      entities: {
        players: players,
        monsters: monsters,
      },
      gameState: {
        logs: gameLog,
        currentState: gameState,
        activeEntityId: activeEntity?.id
      },
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    // Convert to JSON string
    const jsonData = JSON.stringify(exportData, null, 2);
    
    // Create a downloadable file
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dnd-game-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addLogEntry("Game file exported successfully with logs");
  };
  
  const importDungeon = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target.result);
        
        // Check if it's a game file or a dungeon file
        const dungeonData = importData.dungeon || importData;
        
        // Set the dungeon data
        setDungeon({
          grid: dungeonData.grid,
          rooms: dungeonData.rooms,
          corridors: dungeonData.corridors,
          specialRooms: dungeonData.specialRooms,
          config: dungeonData.config || {}
        });
        
        // Set entities
        if (importData.entities) {
          // Game file format
          setPlayers(importData.entities.players || []);
          setMonsters(importData.entities.monsters || []);
          
          // Import logs if available
          if (importData.gameState?.logs) {
            setGameLog(importData.gameState.logs);
          }
        } else if (importData.entities) {
          // Dungeon file format - separate players and monsters
          const importedPlayers = importData.entities.filter(e => e.type === 'player');
          const importedMonsters = importData.entities.filter(e => e.type === 'monster');
          
          setPlayers(importedPlayers);
          setMonsters(importedMonsters);
        }
        
        addLogEntry("Dungeon imported successfully");
      } catch (err) {
        console.error('Error importing dungeon:', err);
        addLogEntry(`Error importing dungeon: ${err.message}`);
      }
      
      // Reset the input to allow the same file to be selected again
      event.target.value = '';
    };
    
    reader.readAsText(file);
  };

  const addPlayerToken = () => {
    if (!dungeon) {
      addLogEntry("Cannot add player token - no dungeon exists");
      return;
    }
    
    try {
      // Find an empty floor cell to place the new player, preferably near the existing player
      const emptyCells = [];
      
      // If there's an existing player, try to find cells near them first
      const existingPlayer = players[0];
      const centerX = existingPlayer ? existingPlayer.x : Math.floor(dungeon.grid[0].length / 2);
      const centerY = existingPlayer ? existingPlayer.y : Math.floor(dungeon.grid.length / 2);
      
      // Search for empty cells in increasing radius
      const maxRadius = 20;
      let found = false;
      
      for (let radius = 1; radius <= maxRadius && !found; radius++) {
        for (let dy = -radius; dy <= radius && !found; dy++) {
          for (let dx = -radius; dx <= radius && !found; dx++) {
            // Skip if not on the perimeter of the current radius
            if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
            
            const x = centerX + dx;
            const y = centerY + dy;
            
            // Skip if outside grid
            if (y < 0 || y >= dungeon.grid.length || x < 0 || x >= dungeon.grid[y].length) continue;
            
            // Check if it's an empty floor cell
            if (dungeon.grid[y][x] === 1 && 
                !players.some(p => p.x === x && p.y === y) && 
                !monsters.some(m => m.x === x && m.y === y)) {
              found = true;
              emptyCells.push({ x, y });
              break;
            }
          }
        }
      }
      
      // If we couldn't find a nearby cell, just find any valid cell
      if (emptyCells.length === 0) {
        for (let y = 0; y < dungeon.grid.length; y++) {
          for (let x = 0; x < dungeon.grid[y].length; x++) {
            if (dungeon.grid[y][x] === 1 && 
                !players.some(p => p.x === x && p.y === y) && 
                !monsters.some(m => m.x === x && m.y === y)) {
              emptyCells.push({ x, y });
            }
          }
        }
      }
      
      if (emptyCells.length === 0) {
        addLogEntry("No empty floor cells to place additional player token");
        return;
      }
      
      // Choose a cell (either the first nearby one or a random one)
      const cell = emptyCells[0];
      
      // Create player entity based on the original if it exists
      let newPlayer;
      if (players.length > 0) {
        // Clone the first player but with different position and ID
        const basePlayer = players[0];
        newPlayer = {
          ...basePlayer,
          id: `player_${Math.random().toString(36).substr(2, 9)}`,
          x: cell.x,
          y: cell.y,
          properties: {
            ...basePlayer.properties,
            name: `${basePlayer.properties.name} (2)`,
          }
        };
      } else {
        // Create a default player
        newPlayer = {
          id: `player_${Math.random().toString(36).substr(2, 9)}`,
          type: 'player',
          x: cell.x,
          y: cell.y,
          properties: {
            name: 'Player 2',
            level: 5,
            hp: 45,
            maxHp: 45,
            ac: 15,
            attackBonus: 5,
            damageBonus: 5,
            speed: 30
          }
        };
      }
      
      // Add the new player
      setPlayers([...players, newPlayer]);
      addLogEntry(`Added additional player token at (${cell.x}, ${cell.y})`);
    } catch (err) {
      console.error('Error adding player token:', err);
      addLogEntry(`Error adding player token: ${err.message}`);
    }
  };
  
  const addTreasure = (isRare = false) => {
    if (!dungeon) {
      addLogEntry("Cannot add treasure - no dungeon exists");
      return;
    }
    
    try {
      // Find a random empty floor cell that's NOT in the start room
      const emptyCells = [];
      const startRoom = dungeon.specialRooms?.entry;
      
      for (let y = 0; y < dungeon.grid.length; y++) {
        for (let x = 0; x < dungeon.grid[y].length; x++) {
          // Check if it's a floor cell and no entity is already there
          if (dungeon.grid[y][x] === 1 && 
              !players.some(p => p.x === x && p.y === y) && 
              !monsters.some(m => m.x === x && m.y === y)) {
            
            // Skip if it's in the start room
            if (startRoom && 
                x >= startRoom.x && x < startRoom.x + startRoom.width &&
                y >= startRoom.y && y < startRoom.y + startRoom.height) {
              continue;
            }
            
            emptyCells.push({ x, y });
          }
        }
      }
      
      if (emptyCells.length === 0) {
        addLogEntry("No suitable locations for treasure");
        return;
      }
      
      // Choose a random empty cell
      const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      
      // Generate treasure entity
      const treasureEntity = {
        id: `treasure_${Math.random().toString(36).substr(2, 9)}`,
        type: 'treasure',
        name: isRare ? 'Rare Treasure' : 'Treasure',
        x: cell.x,
        y: cell.y,
        properties: {
          name: isRare ? 'Ornate Chest' : 'Treasure Chest',
          symbol: '$',
          isRare: isRare,
          description: isRare 
            ? 'An ornate chest with gold trim and magical runes' 
            : 'A simple wooden chest that might contain valuables',
          isTreasure: true
        }
      };
      
      // Add the treasure to the monsters list (for rendering)
      setMonsters([...monsters, treasureEntity]);
      
      const chestType = isRare ? "rare ornate" : "common";
      addLogEntry(`Added ${chestType} treasure chest at (${cell.x}, ${cell.y})`);
    } catch (err) {
      console.error("Error adding treasure:", err);
      addLogEntry(`Error adding treasure: ${err.message}`);
    }
  };

  const isInStartRoom = (x, y) => {
    if (!dungeon || !dungeon.specialRooms || !dungeon.specialRooms.entry) return false;
    const room = dungeon.specialRooms.entry;
    return (
      x >= room.x && x < room.x + room.width &&
      y >= room.y && y < room.y + room.height
    );
  };

  return (
    <div className="test-app">
      <div className="controls" ref={controlsRef}>
        <button onClick={generateNewDungeon}>Generate New Dungeon</button>
        <button onClick={() => setShowCharacterSheet(true)}>Character Sheet</button>
        <button onClick={handleLoadExampleCharacter}>Load Syna</button>
        <button onClick={handleLoadPaladinCharacter}>Load Julia</button>
        <button onClick={() => handleLoadDereCharacter()}>Load Dere</button>
        <button onClick={() => setShowTokenSelector(true)}>Select Token</button>
        
        {/* Add heal button for players */}
        <button 
          onClick={healPlayer}
          style={{ 
            backgroundColor: '#4caf50',
            color: 'white',
            padding: '8px 12px',
            border: 'none',
            borderRadius: '4px',
            marginLeft: '8px'
          }}
        >
          Heal Player (1d8+4)
        </button>
        
        {/* Add export and import buttons */}
        <button onClick={exportDungeon}>Export Dungeon</button>
        <button onClick={exportGameFile}>Export Game File</button>
        <input 
          type="file" 
          accept=".json" 
          onChange={importDungeon} 
          style={{ display: 'none' }} 
          id="import-dungeon-input"
        />
        <button onClick={() => document.getElementById('import-dungeon-input').click()}>
          Import Dungeon
        </button>
      </div>
      
      <div className="dungeon-display">
        <div className="game-log">
          {gameLog.map((entry, i) => (
            <div key={i} className="log-entry">
              <span className="timestamp">[{entry.timestamp}]</span> {entry.message}
            </div>
          ))}
        </div>
        
        {dungeon && (
          <div className="dungeon-renderer-container">
            <DungeonRenderer
              dungeon={dungeon}
              players={players}
              monsters={monsters}
              activeEntity={activeEntity}
              selectedCell={selectedCell}
              validMoves={validMoves}
              onCellClick={handleCellClick}
              cellSize={24}
            />
            
            {/* Add the player movement controls */}
            <div style={{ position: 'absolute', bottom: '20px', right: '20px' }}>
              <PlayerControls 
                activePlayer={players[0]} 
                onMove={(x, y) => {
                  if (!dungeon?.grid) return;
                  
                  // Check if move is valid
                  if (y < 0 || y >= dungeon.grid.length || 
                      x < 0 || x >= dungeon.grid[0].length ||
                      ![1, 2].includes(dungeon.grid[y][x]) ||
                      monsters.some(m => m.x === x && m.y === y)) {
                    return;
                  }
                  
                  // Move player
                  if (players[0]) {
                    moveEntity(players[0], x, y);
                  }
                }}
              />
            </div>
          </div>
        )}
        
        {gameState === 'combat' && (
          <CombatMenuWrapper gameState={combatSystem?.gameState} />
        )}
        
        {gameState === 'combat' && activeEntity && activeEntity.type === 'player' && (
          <div className="weapon-attack-container" style={{
            position: 'absolute',
            right: '20px',
            top: '100px',
            backgroundColor: '#f5f5f5',
            padding: '10px',
            borderRadius: '4px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            zIndex: 100
          }}>
            <WeaponAttackButton 
              player={activeEntity} 
              onAttack={(player, weapon) => {
                addLogEntry(`${player.properties.name} prepares to attack with ${weapon.name}`);
                // Set the selected weapon for the player
                setPlayers(prev => prev.map(p => 
                  p.id === player.id 
                    ? { 
                        ...p, 
                        selectedWeapon: weapon 
                      } 
                    : p
                ));
                // Inform the player they need to click on a target
                const rangeText = weapon.attackType === 'ranged' 
                  ? `up to ${weapon.range} squares away` 
                  : 'adjacent to you';
                addLogEntry(`Click on a target ${rangeText} to attack with ${weapon.name}.`);
              }} 
            />
          </div>
        )}
        
        <div className="dungeon-settings">
          <div className="settings-title">Dungeon Controls</div>
          
          <div className="setting-group">
            <div className="setting-label">Monster Density</div>
            <div className="setting-control">
              <button onClick={() => generateDungeonWithSetting({ monsterDensity: 'low' })}>
                Low Density
              </button>
              <button onClick={() => generateDungeonWithSetting({ monsterDensity: 'medium' })}>
                Medium Density
              </button>
              <button onClick={() => generateDungeonWithSetting({ monsterDensity: 'high' })}>
                High Density
              </button>
            </div>
          </div>
          
          <div className="setting-group">
            <div className="setting-label">Room Size</div>
            <div className="setting-control">
              <button onClick={() => generateDungeonWithSetting({ roomSizePreference: 'small' })}>
                Small Rooms
              </button>
              <button onClick={() => generateDungeonWithSetting({ roomSizePreference: 'medium' })}>
                Medium Rooms
              </button>
              <button onClick={() => generateDungeonWithSetting({ roomSizePreference: 'large' })}>
                Large Rooms
              </button>
            </div>
          </div>
          
          <div className="setting-group">
            <div className="setting-label">Corridor Density</div>
            <div className="setting-control">
              <button onClick={() => generateDungeonWithSetting({ corridorDensity: 'low' })}>
                Few Corridors
              </button>
              <button onClick={() => generateDungeonWithSetting({ corridorDensity: 'high' })}>
                Many Corridors
              </button>
            </div>
          </div>
          
          <div className="setting-group">
            <div className="setting-label">Dungeon Type</div>
            <div className="setting-control">
              <button onClick={() => generateDungeonWithSetting({ dungeonType: 'cave' })}>
                Cave System
              </button>
              <button onClick={() => generateDungeonWithSetting({ dungeonType: 'dungeon' })}>
                Classic Dungeon
              </button>
              <button onClick={() => generateDungeonWithSetting({ dungeonType: 'keep' })}>
                Keep/Fortress
              </button>
            </div>
          </div>
          
          <div className="setting-group">
            <div className="setting-label">Add Monsters</div>
            <div className="setting-control">
              <button onClick={() => addRandomMonster()}>
                Add Random Monster
              </button>
              <button onClick={() => addSpecificMonsterType('large')}>
                Add Large Monster
              </button>
              <button onClick={() => addSpecificMonsterType('huge')}>
                Add Huge Monster
              </button>
            </div>
          </div>
          
          <div className="setting-group">
            <div className="setting-label">Monster By Size</div>
            <div className="setting-control">
              <button onClick={() => addSpecificMonsterType('tiny')}>
                Add Tiny
              </button>
              <button onClick={() => addSpecificMonsterType('small')}>
                Add Small
              </button>
              <button onClick={() => addSpecificMonsterType('medium')}>
                Add Medium
              </button>
            </div>
          </div>
          
          <div className="setting-group">
            <div className="setting-label">Monster Actions</div>
            <div className="setting-control">
              <button onClick={() => healAllMonsters()}>
                Heal All Monsters
              </button>
              <button onClick={() => removeAllMonsters()}>
                Remove All Monsters
              </button>
              <button onClick={() => damageAllMonsters(5)}>
                Damage All (5)
              </button>
            </div>
          </div>
          
          <div className="setting-group">
            <div className="setting-label">Map Exploration</div>
            <div className="setting-control">
              <button onClick={() => highlightRooms()}>
                Highlight Rooms
              </button>
              <button onClick={() => showDungeonStats()}>
                Dungeon Info
              </button>
              <button onClick={() => toggleGridDisplay()}>
                Toggle Grid
              </button>
            </div>
          </div>
          
          <div className="setting-group">
            <div className="setting-label">Additional Features</div>
            <div className="setting-control">
              <button onClick={addPlayerToken}>Add Player Token</button>
              <button onClick={() => addTreasure(false)}>Add Treasure</button>
              <button onClick={() => addTreasure(true)}>Add Rare Treasure</button>
            </div>
          </div>
        </div>
      </div>      {showCharacterSheet && (
        <div className="character-sheet-modal">
          <CharacterSheet 
            characterData={characterData || {}}
            onDataChange={handleCharacterDataChange}
            onImportJSON={handleImportJSON}
            onClose={() => {
              // Update player data when closing the sheet
              if (players.length > 0 && characterData) {
                const newPlayers = players.map((player, index) => {
                  if (index === 0) {
                    // Update the first player with new character data
                    return {
                      ...player,
                      properties: {
                        ...player.properties,
                        name: characterData.name,
                        level: characterData.level,
                        hp: characterData.hit_points?.current || player.properties.hp,
                        maxHp: characterData.hit_points?.max || player.properties.maxHp,
                        ac: characterData.equipment?.armor?.armor_class || player.properties.ac,
                        attackBonus: characterData.combat_bonuses?.to_hit || player.properties.attackBonus,
                        damageBonus: characterData.combat_bonuses?.damage || player.properties.damageBonus,
                        spellcastingBonus: characterData.combat_bonuses?.spell_attack || player.properties.spellcastingBonus,
                      }
                    };
                  }
                  return player;
                });
                
                setPlayers(newPlayers);
                addLogEntry(`Character ${characterData.name} updated`);
              }
              
              setShowCharacterSheet(false);
            }}
          />
        </div>
      )}

      {showTokenSelector && (
        <TokenSelector
          onSelect={handleTokenSelect}
          onClose={() => setShowTokenSelector(false)}
        />
      )}
    </div>
  );
};

export default TestApp;