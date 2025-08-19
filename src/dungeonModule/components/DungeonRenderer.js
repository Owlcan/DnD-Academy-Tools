import React, { useRef, useEffect, useState } from 'react';
import { CELL_TYPES } from '../constants';
import EncounterGenerator from '../../encounterModule/EncounterGenerator';

/**
 * Component for rendering the dungeon grid
 */
const DungeonRenderer = ({ 
  dungeon, 
  players = [],
  monsters = [],
  activeEntity,
  selectedCell,
  validMoves = [],
  onCellClick,
  cellSize = 32,
  editMode = false,
  bestiary,
  dungeonRef,
  onDungeonDataChange
}) => {
  const gridRef = useRef(null);
  const [hoverPos, setHoverPos] = useState(null);
  const [dragInfo, setDragInfo] = useState(null);
  const [encounterGenerator, setEncounterGenerator] = useState(null);
  const [isGeneratingEncounter, setIsGeneratingEncounter] = useState(false);
  const [hasActiveEncounter, setHasActiveEncounter] = useState(false);
  const [hasEncounter, setHasEncounter] = useState(false);
  
  // Set grid cursor based on active entity
  useEffect(() => {
    if (!gridRef.current) return;
    
    if (activeEntity) {
      gridRef.current.style.cursor = 'pointer';
    } else {
      gridRef.current.style.cursor = 'default';
    }
  }, [activeEntity]);
  
  // Initialize the encounter generator when bestiary is available
  useEffect(() => {
    if (bestiary && bestiary.creatures) {
      setEncounterGenerator(new EncounterGenerator(bestiary));
    }
  }, [bestiary]);
  
  // Check for active encounters
  useEffect(() => {
    if (dungeonRef && dungeonRef.current) {
      setHasEncounter(dungeonRef.current.encounterActive);
    }
  }, [dungeonRef, dungeon]);

  // Handle mouse movement over the grid
  const handleMouseMove = (e) => {
    if (!gridRef.current) return;
    
    // Calculate cell position from mouse coordinates
    const rect = gridRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    
    // Only update if position changed
    if (!hoverPos || hoverPos.x !== x || hoverPos.y !== y) {
      setHoverPos({ x, y });
    }
  };
  
  // Handle cell click
  const handleCellClick = (x, y) => {
    if (onCellClick) {
      onCellClick(x, y);
    }
  };
  
  // Generate cell style based on cell type and state
  const getCellStyle = (cellType, x, y) => {
    const isHovered = hoverPos && hoverPos.x === x && hoverPos.y === y;
    const isValidMove = validMoves.some(move => move.x === x && move.y === y);
    
    const style = {
      width: cellSize,
      height: cellSize,
      position: 'absolute',
      left: `${x * cellSize}px`,
      top: `${y * cellSize}px`,
      border: '1px solid #333',
      transition: 'background-color 0.1s'
    };
    
    // Set background color based on cell type
    switch(cellType) {
      case CELL_TYPES.WALL:
        style.backgroundColor = '#555';
        break;
      case CELL_TYPES.FLOOR:
        style.backgroundColor = '#eee';
        break;
      case CELL_TYPES.CORRIDOR:
        style.backgroundColor = '#ddd';
        break;
      case CELL_TYPES.DOOR:
        style.backgroundColor = '#8B4513';
        break;
      case CELL_TYPES.STAIRS_UP:
        style.background = 'linear-gradient(45deg, #eee 0%, #aaa 100%)';
        break;
      case CELL_TYPES.STAIRS_DOWN:
        style.background = 'linear-gradient(135deg, #aaa 0%, #eee 100%)';
        break;
      default:
        style.backgroundColor = '#000';
    }
    
    // Highlight valid moves
    if (isValidMove) {
      style.backgroundColor = 'rgba(100, 200, 100, 0.4)';
      style.border = '1px solid #2a2';
      style.zIndex = 2;
    }
    
    // Add hover effect
    if (isHovered) {
      style.boxShadow = 'inset 0 0 8px rgba(0, 100, 255, 0.7)';
      style.zIndex = isValidMove ? 3 : 1;
    }
    
    return style;
  };
  
  // Generate entity style based on entity type and state
  const getEntityStyle = (entity) => {
    const isHovered = hoverPos && hoverPos.x === entity.x && hoverPos.y === entity.y;
    const isActive = activeEntity && activeEntity.id === entity.id;
    
    // Base token size - can be overridden by entity properties
    let tokenSize = entity.properties?.tokenSize || entity.size || 1;
    
    const style = {
      width: `${cellSize * tokenSize}px`,
      height: `${cellSize * tokenSize}px`,
      position: 'absolute',
      left: `${entity.x * cellSize}px`,
      top: `${entity.y * cellSize}px`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `${cellSize / 2}px`,
      fontWeight: 'bold',
      color: '#fff',
      textShadow: '1px 1px 2px #000',
      zIndex: isActive ? 10 : 5,
      cursor: 'pointer',
      pointerEvents: 'auto',
      borderRadius: entity.type === 'player' ? '50%' : '25%',
      border: isActive ? '2px solid #fff' : '1px solid #333',
      boxSizing: 'border-box',
      transition: 'all 0.2s ease'
    };
    
    // Set style based on entity type
    if (entity.type === 'player') {
      style.backgroundColor = 'rgba(30, 144, 255, 0.8)';
    } else if (entity.type === 'monster') {
      if (entity.properties?.isBoss) {
        style.backgroundColor = 'rgba(220, 50, 50, 0.8)';
        style.color = '#ff0';
        style.fontWeight = 'bolder';
      } else {
        style.backgroundColor = 'rgba(180, 30, 30, 0.8)';
      }
    }
    
    // Add hover effect
    if (isHovered) {
      style.boxShadow = 'inset 0 0 12px rgba(255, 255, 255, 0.9), 0 0 10px rgba(255, 255, 0, 0.5)';
      style.transform = 'scale(1.05)';
      style.zIndex = 15;
    }
    
    return style;
  };
  
  // Generate text for entity label
  const getEntityLabel = (entity) => {
    if (entity.properties?.symbol) {
      return entity.properties.symbol;
    }
    
    if (entity.properties?.name) {
      return entity.properties.name.charAt(0);
    }
    
    return entity.type === 'player' ? 'P' : 'M';
  };
  
  // Create tooltip content for entity
  const getEntityTooltip = (entity) => {
    let tooltipContent = '';
    
    if (entity.properties?.name) {
      tooltipContent += `${entity.properties.name}\n`;
    }
    
    if (entity.properties?.hp !== undefined) {
      tooltipContent += `HP: ${entity.properties.hp}/${entity.properties.maxHp}\n`;
    }
    
    if (entity.properties?.ac !== undefined) {
      tooltipContent += `AC: ${entity.properties.ac}`;
    }
    
    return tooltipContent;
  };
  
  // Handle generating single player encounter
  const handleGenerateSinglePlayerEncounter = () => {
    if (!encounterGenerator) return;
    
    setIsGeneratingEncounter(true);
    try {
      const encounter = encounterGenerator.generateSinglePlayerEncounter();
      
      // Update the dungeon data with the encounter
      if (dungeonRef && dungeonRef.current) {
        dungeonRef.current.loadEncounter(encounter);
      }
      
      // Or update directly if you have access to setDungeonData
      if (onDungeonDataChange) {
        onDungeonDataChange(encounter);
      }
      
      setHasActiveEncounter(true);
    } catch (error) {
      console.error("Error generating encounter:", error);
    } finally {
      setIsGeneratingEncounter(false);
    }
  };

  // Handle generating group encounter
  const handleGenerateGroupEncounter = () => {
    if (!encounterGenerator) return;
    
    setIsGeneratingEncounter(true);
    try {
      const encounter = encounterGenerator.generateGroupEncounter();
      
      // Update the dungeon data with the encounter
      if (dungeonRef && dungeonRef.current) {
        dungeonRef.current.loadEncounter(encounter);
      }
      
      // Or update directly if you have access to setDungeonData
      if (onDungeonDataChange) {
        onDungeonDataChange(encounter);
      }
      
      setHasActiveEncounter(true);
    } catch (error) {
      console.error("Error generating encounter:", error);
    } finally {
      setIsGeneratingEncounter(false);
    }
  };

  // Handle clearing encounter
  const handleClearEncounter = () => {
    if (!encounterGenerator) return;
    
    try {
      const emptyData = encounterGenerator.clearEncounters();
      
      // Clear the encounter data
      if (dungeonRef && dungeonRef.current) {
        dungeonRef.current.clearEncounter();
      }
      
      // Or update directly if you have access to setDungeonData
      if (onDungeonDataChange) {
        onDungeonDataChange(emptyData);
      }
      
      setHasActiveEncounter(false);
    } catch (error) {
      console.error("Error clearing encounter:", error);
    }
  };
  
  // Render the dungeon grid and entities
  return (
    <div 
      className="dungeon-renderer" 
      ref={gridRef}
      onMouseMove={handleMouseMove}
      style={{
        position: 'relative',
        width: `${dungeon.grid[0].length * cellSize}px`,
        height: `${dungeon.grid.length * cellSize}px`,
        backgroundColor: '#111',
        userSelect: 'none',
        overflow: 'auto'
      }}
    >
      {/* Render encounter controls */}
      <div className="encounter-controls">
        <h3>Encounter Generator</h3>
        <div className="encounter-buttons">
          <button 
            className="encounter-button single-player"
            onClick={() => {
              if (dungeonRef && dungeonRef.current) {
                const encounterData = dungeonRef.current.generateSinglePlayerEncounter();
                setHasEncounter(true);
                if (onDungeonDataChange) {
                  onDungeonDataChange(encounterData);
                }
              }
            }}
          >
            Generate Single Player Encounter
          </button>
          
          <button 
            className="encounter-button group-player"
            onClick={() => {
              if (dungeonRef && dungeonRef.current) {
                const encounterData = dungeonRef.current.generateGroupEncounter();
                setHasEncounter(true);
                if (onDungeonDataChange) {
                  onDungeonDataChange(encounterData);
                }
              }
            }}
          >
            Generate Group Encounter
          </button>
          
          {hasEncounter && (
            <button 
              className="encounter-button clear"
              onClick={() => {
                if (dungeonRef && dungeonRef.current) {
                  dungeonRef.current.clearEncounter();
                  setHasEncounter(false);
                  if (onDungeonDataChange) {
                    onDungeonDataChange({ cleared: true });
                  }
                }
              }}
            >
              Clear Generated Encounter
            </button>
          )}
        </div>
      </div>
      
      {/* Render grid cells */}
      {dungeon.grid.map((row, y) => 
        row.map((cell, x) => (
          <div 
            key={`cell-${x}-${y}`}
            style={getCellStyle(cell, x, y)}
            onClick={() => handleCellClick(x, y)}
            data-x={x}
            data-y={y}
          />
        ))
      )}
      
      {/* Render valid move indicators */}
      {validMoves.map((move, index) => (
        <div
          key={`move-${index}`}
          style={{
            position: 'absolute',
            left: `${move.x * cellSize}px`,
            top: `${move.y * cellSize}px`,
            width: `${cellSize}px`,
            height: `${cellSize}px`,
            backgroundColor: 'rgba(100, 255, 100, 0.3)',
            border: '1px solid rgba(0, 255, 0, 0.5)',
            zIndex: 3,
            pointerEvents: 'none'
          }}
        />
      ))}
      
      {/* Render players */}
      {players.map((player, index) => (
        <div 
          key={`player-${player.id || index}`}
          style={getEntityStyle(player)}
          onClick={() => handleCellClick(player.x, player.y)}
          title={getEntityTooltip(player)}
          data-entity-id={player.id}
          data-entity-type="player"
        >
          {getEntityLabel(player)}
        </div>
      ))}
      
      {/* Render monsters */}
      {monsters.map((monster, index) => (
        <div 
          key={`monster-${monster.id || index}`}
          style={getEntityStyle(monster)}
          onClick={() => handleCellClick(monster.x, monster.y)}
          title={getEntityTooltip(monster)}
          data-entity-id={monster.id}
          data-entity-type="monster"
        >
          {getEntityLabel(monster)}
        </div>
      ))}
    </div>
  );
};

export default DungeonRenderer;