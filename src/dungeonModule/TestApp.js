import React, { useState, useEffect } from 'react';
import DungeonRenderer from './components/DungeonRenderer';
import DungeonGenerator from './DungeonGenerator';
import { getValidMoves, resolveCombatAction } from './utils/gameUtils';
import { BESTIARY } from './data/bestiary';
import './TestApp.css';

const TestApp = () => {
  const [dungeon, setDungeon] = useState(null);
  const [players, setPlayers] = useState([]);
  const [monsters, setMonsters] = useState([]);
  const [activeEntity, setActiveEntity] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [gameLog, setGameLog] = useState([]);
  const [gameState, setGameState] = useState('exploring');

  // Initialize Dere as our test character
  const initializeTestPlayer = (x, y) => ({
    id: 'dere',
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
      speed: 30
    }
  });

  const generateNewDungeon = () => {
    try {
      const generator = new DungeonGenerator({ width: 40, height: 30 });
      const newDungeon = generator.generate();
      setDungeon(newDungeon);

      // Place player at entrance
      const startRoom = newDungeon.specialRooms.entry;
      const playerX = startRoom.x + Math.floor(startRoom.width / 2);
      const playerY = startRoom.y + Math.floor(startRoom.height / 2);
      
      setPlayers([initializeTestPlayer(playerX, playerY)]);

      // Place monsters using bestiary
      const newMonsters = newDungeon.entities
        .filter(e => e.type === 'monster')
        .map(e => {
          const monsterData = BESTIARY[0].creatures[
            Math.floor(Math.random() * BESTIARY[0].creatures.length)
          ];
          return {
            ...e,
            id: `monster-${Math.random()}`,
            properties: {
              ...monsterData.stats,
              name: monsterData.name,
              symbol: monsterData.name.charAt(0).toUpperCase(),
              hp: monsterData.stats.hitPoints,
              maxHp: monsterData.stats.hitPoints,
              ac: monsterData.stats.armorClass,
              attackBonus: monsterData.stats.abilityScoreModifiers.strength + 2,
              speed: parseInt(monsterData.stats.speed) || 30
            }
          };
        });

      setMonsters(newMonsters);
      addLogEntry('Dungeon generated with Darklings. Ready for testing.');
    } catch (err) {
      console.error('Failed to generate dungeon:', err);
    }
  };

  useEffect(() => {
    generateNewDungeon();
  }, []);

  const handleCellClick = (x, y) => {
    if (!dungeon?.grid) return;
    
    const clickedPlayer = players.find(p => p.x === x && p.y === y);
    const clickedMonster = monsters.find(m => m.x === x && m.y === y);
    
    // Only allow selecting entities in exploring state
    if (gameState === 'exploring') {
      if (clickedPlayer || clickedMonster) {
        const entity = clickedPlayer || clickedMonster;
        setActiveEntity(entity);
        const moves = getValidMoves(entity, dungeon.grid, [...players, ...monsters]);
        setValidMoves(moves);
        setGameState(clickedPlayer ? 'moving' : 'monsterTurn');
        addLogEntry(`${entity.properties.name} selected - Click a highlighted square to move`);
      }
      return;
    }

    // Handle movement and combat states
    if ((gameState === 'moving' || gameState === 'monsterTurn') && activeEntity) {
      const activeIsMonster = activeEntity.type === 'monster';
      const validTarget = activeIsMonster ? clickedPlayer : clickedMonster;

      // Check if clicked cell is a valid move
      if (validMoves.some(move => move.x === x && move.y === y)) {
        moveEntity(activeEntity, x, y);
        if (activeIsMonster && isAdjacent(activeEntity, validTarget)) {
          handleMonsterAttack(activeEntity, validTarget);
        }
        endTurn();
        return;
      }

      // Check if clicked cell contains a valid attack target
      if (validTarget && isAdjacent(activeEntity, validTarget)) {
        if (activeIsMonster) {
          handleMonsterAttack(activeEntity, validTarget);
        } else {
          handleCombatAction(activeEntity, validTarget);
        }
        endTurn();
        return;
      }

      // If click was invalid (not a move or attack), ignore it
      return;
    }
  };

  const endTurn = () => {
    setGameState('exploring');
    setValidMoves([]);
    setActiveEntity(null);
    setSelectedCell(null);
  };

  const isAdjacent = (entity1, entity2) => {
    if (!entity1 || !entity2) return false;
    const dx = Math.abs(entity1.x - entity2.x);
    const dy = Math.abs(entity1.y - entity2.y);
    return dx <= 1 && dy <= 1;
  };

  const findAdjacentPlayer = (x, y) => {
    return players.find(p => 
      Math.abs(p.x - x) <= 1 && Math.abs(p.y - y) <= 1
    );
  };

  const handleCombatAction = (attacker, defender) => {
    const result = resolveCombatAction(attacker, defender);
    handleCombatResult(result, defender);
  };

  const handleMonsterAttack = (monster, player) => {
    const result = resolveCombatAction(monster, player);
    addLogEntry(result.message);
    if (result.hit) {
      const newHp = player.properties.hp - result.damage;
      if (newHp <= 0) {
        addLogEntry(`${player.properties.name} has been defeated!`);
        // Handle player defeat
      } else {
        setPlayers(players.map(p => 
          p.id === player.id 
            ? { ...p, properties: { ...p.properties, hp: newHp }} 
            : p
        ));
      }
    }
  };

  const moveEntity = (entity, x, y) => {
    if (entity.type === 'player') {
      setPlayers(players.map(p => 
        p.id === entity.id ? { ...p, x, y } : p
      ));
    } else {
      setMonsters(monsters.map(m => 
        m.id === entity.id ? { ...m, x, y } : m
      ));
    }
    addLogEntry(`${entity.properties.name} moves to (${x},${y})`);
  };

  const handleCombatResult = (result, defender) => {
    addLogEntry(result.message);
    if (result.hit) {
      const newHp = defender.properties.hp - result.damage;
      if (newHp <= 0) {
        setMonsters(monsters.filter(m => m.id !== defender.id));
        addLogEntry(`${defender.properties.name} is defeated!`);
      } else {
        setMonsters(monsters.map(m => 
          m.id === defender.id 
            ? { ...m, properties: { ...m.properties, hp: newHp }} 
            : m
        ));
      }
    }
  };

  const addLogEntry = (message) => {
    setGameLog(prev => [...prev, message]);
  };

  return (
    <div className="test-app">
      <div className="controls">
        <button onClick={generateNewDungeon}>Generate New Dungeon</button>
      </div>
      
      <div className="dungeon-display">
        {dungeon && (
          <DungeonRenderer
            dungeon={dungeon}
            players={players}
            monsters={monsters}
            activeEntity={activeEntity}
            selectedCell={selectedCell}
            validMoves={validMoves}
            onCellClick={handleCellClick}
            cellSize={20}
          />
        )}
        <div className="game-log">
          {gameLog.map((entry, i) => (
            <div key={i} className="log-entry">{entry}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestApp;