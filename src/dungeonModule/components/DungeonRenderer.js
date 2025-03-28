import React from 'react';
import './DungeonRenderer.css';

const DungeonRenderer = ({ 
  dungeon, 
  cellSize = 20,
  players = [],
  monsters = [],
  activeEntity = null,
  selectedCell = null,
  validMoves = [],
  onCellClick = () => {} 
}) => {
  if (!dungeon || !dungeon.grid) return <div>No dungeon data</div>;

  const getSizeMultiplier = (entity) => {
    switch(entity.properties?.size) {
      case 'Large': return 2;
      case 'Huge': return 3;
      case 'Gargantuan': return 4;
      default: return 1;
    }
  };

  const isPartOfLargeEntity = (x, y) => {
    return [...monsters, ...players].find(entity => {
      const size = getSizeMultiplier(entity);
      if (size === 1) return false;
      
      return x >= entity.x && x < entity.x + size &&
             y >= entity.y && y < entity.y + size;
    });
  };

  const renderCell = (cellValue, x, y) => {
    const player = players.find(p => p.x === x && p.y === y);
    const monster = monsters.find(m => m.x === x && m.y === y);
    const entity = player || monster;
    const isActive = entity && activeEntity && entity.id === activeEntity.id;
    const isValidMove = validMoves.some(move => move.x === x && move.y === y);
    const isSelected = selectedCell && selectedCell.x === x && selectedCell.y === y;

    const largeEntity = isPartOfLargeEntity(x, y);
    if (largeEntity && (largeEntity.x !== x || largeEntity.y !== y)) {
      return null;
    }

    let cellClass = 'grid-cell';
    if (isActive) cellClass += ' active';
    if (isValidMove) cellClass += ' valid-move';
    if (isSelected) cellClass += ' selected';
    if (entity?.type) cellClass += ` entity-${entity.type}`;

    const size = entity ? getSizeMultiplier(entity) : 1;
    const width = size * cellSize;
    const height = size * cellSize;

    return (
      <div
        key={`${x}-${y}`}
        className={cellClass}
        onClick={() => onCellClick(x, y)}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: isValidMove ? '#4a90e2' : getCellColor(cellValue, entity),
          color: getCellTextColor(cellValue, entity),
          fontSize: `${cellSize * 0.7}px`,
          gridColumn: `span ${size}`,
          gridRow: `span ${size}`,
          zIndex: entity ? 1 : 0
        }}
        title={getTooltip(entity)}
      >
        {renderContent(entity, cellValue)}
      </div>
    );
  };

  const renderContent = (entity, cellValue) => {
    if (entity) {
      if (entity.type === 'player') {
        return '@';
      } else if (entity.type === 'monster') {
        return entity.properties?.symbol || 'M';
      }
    }
    
    switch(cellValue) {
      case 0: return '█';
      case 1: return '·';
      case 2: return '·';
      case 3: return '▢';
      case 4: return '△';
      case 5: return '▽';
      default: return ' ';
    }
  };

  const getCellColor = (cellValue, entity) => {
    if (entity) {
      return entity.type === 'player' ? '#2ecc71' : '#e74c3c';
    }
    
    switch(cellValue) {
      case 0: return '#2c3e50';
      case 1: return '#ecf0f1';
      case 2: return '#ecf0f1';
      case 3: return '#95a5a6';
      case 4: return '#9b59b6';
      case 5: return '#8e44ad';
      default: return '#ffffff';
    }
  };

  const getCellTextColor = (cellValue, entity) => {
    if (entity) return '#ffffff';
    return cellValue === 0 ? '#ffffff' : '#2c3e50';
  };

  const getTooltip = (entity) => {
    if (!entity) return '';
    return `${entity.properties?.name || entity.type} (${entity.properties?.hp || 0}/${entity.properties?.maxHp || 0} HP)`;
  };

  return (
    <div className="dungeon-grid" style={{ 
      display: 'grid',
      gridTemplateColumns: `repeat(${dungeon.grid[0].length}, ${cellSize}px)`,
      gap: '0px',
      backgroundColor: '#34495e',
      padding: '10px',
      borderRadius: '4px'
    }}>
      {dungeon.grid.map((row, y) =>
        row.map((cell, x) => renderCell(cell, x, y))
      )}
    </div>
  );
};

export default DungeonRenderer;