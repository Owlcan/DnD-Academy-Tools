import React, { useState, useCallback } from 'react';
import { Image, Group, Text, Line, Label, Tag } from 'react-konva';
import useImage from 'use-image';
import DraggableToken from '../tokens/DraggableToken';

const getStatusIcon = (statuses) => {
  if (!statuses) return null;
  
  const activeStatuses = Object.entries(statuses)
    .filter(([_, isActive]) => isActive)
    .map(([status]) => status);
  
  if (activeStatuses.length === 0) return null;

  // Priority order for which status to show
  const priorityStatus = ['bloodied', 'rage', 'poisoned', 'paralyzed', 'stunned']
    .find(status => activeStatuses.includes(status));

  const statusIcons = {
    rage: "😠",
    confused: "😵",
    asleep: "😴",
    poisoned: "🤢",
    paralyzed: "⚡",
    stunned: "💫",
    prone: "⊝",
    grappled: "🤼",
    frightened: "😱",
    charmed: "❧",
    exhaustion: "😫",
    blessed: "✨",
    cursed: "⚔️",
    hasted: "⏱️",
    slowed: "⏰",
    invisible: "👻",
    bloodied: "🩸",
    marked: "◎",
    burning: "🔥",
    frozen: "❄️",
    deafened: "🔇",
    blinded: "⊘"
  };

  return statusIcons[priorityStatus] || null;
};

const Token = ({ token, updatePosition, updateHP, updateSize, onRightClick }) => {
  return (
    <Group>
      {/* Add name text above token */}
      <Text
        text={token.name}
        fontSize={14}
        fill="white"
        stroke="black"
        strokeWidth={0.5}
        align="center"
        width={token.size * 2}
        x={token.x - token.size}
        y={token.y - token.size - 20}
      />
      <Group
        opacity={token.statuses?.invisible ? 0.4 : 1}
      >
        <Text
          text={getStatusIcon(token.statuses)}
          fontSize={token.size * 0.5}
          x={-token.size * 0.25}
          y={-token.size * 0.25}
          fill="white"
          stroke="black"
          strokeWidth={1}
        />
      </Group>
    </Group>
  );
};

const MapLayer = ({ 
  mapUrl, 
  tokens, 
  zoom, 
  panOffset,
  gridSize,
  gridCols = 0,
  gridRows = 0,
  dungeon,
  measureMode,
  snapTokensToGrid,
  spawnPoint,
  settingSpawn,
  onSetSpawn,
  updateTokenPosition,
  updateTokenHP,
  updateTokenSize,
  onRightClickToken 
}) => {
  const [image] = useImage(mapUrl);
  const [measureStart, setMeasureStart] = useState(null);
  const [measureEnd, setMeasureEnd] = useState(null);
  
  console.log('MapLayer rendering tokens:', tokens); // Debug log

  const toMapCoords = useCallback((stage, pointer) => {
    const p = pointer || stage.getPointerPosition();
    if (!p) return null;
    return {
      x: (p.x - panOffset.x) / (zoom / 100),
      y: (p.y - panOffset.y) / (zoom / 100)
    };
  }, [panOffset.x, panOffset.y, zoom]);

  // Compute per-axis grid spacing: if gridSize>0, both axes use it; else derive from counts
  const cell = React.useMemo(() => {
    if (!image) return { w: 0, h: 0 };
    // If explicit pixel size set, enforce squares with that size
    if (gridSize && gridSize > 0) return { w: gridSize, h: gridSize };
    const w = image.width || 0;
    const h = image.height || 0;
    let size = 0;
    if (gridCols > 0 && gridRows > 0) {
      // Choose the largest square size that fits the requested counts in both axes
      size = Math.min(w / gridCols, h / gridRows);
    } else if (gridCols > 0) {
      size = w / gridCols;
    } else if (gridRows > 0) {
      size = h / gridRows;
    }
    if (!Number.isFinite(size) || size <= 0) size = 0;
    return { w: size, h: size };
  }, [gridSize, gridCols, gridRows, image]);

  const snapToGrid = (pt) => {
    if (!pt || !cell.w || !cell.h || cell.w <= 0 || cell.h <= 0) return null;
    return {
      x: Math.round(pt.x / cell.w) * cell.w,
      y: Math.round(pt.y / cell.h) * cell.h,
      cellX: Math.round(pt.x / cell.w),
      cellY: Math.round(pt.y / cell.h)
    };
  };

  const distanceFeet = (a, b) => {
  if (!a || !b || !cell.w || !cell.h || cell.w <= 0 || cell.h <= 0) return 0;
    const dx = Math.abs(b.cellX - a.cellX);
    const dy = Math.abs(b.cellY - a.cellY);
    const diag = Math.min(dx, dy);
    const orth = Math.max(dx, dy) - diag;
    const diagFeet = Math.floor(diag / 2) * 15 + (diag % 2 === 1 ? 5 : 0);
    return diagFeet + orth * 5;
  };

  return (
    <Group
      x={panOffset.x}
      y={panOffset.y}
      scaleX={zoom / 100}
      scaleY={zoom / 100}
      onMouseDown={(e) => {
  const hasGrid = (gridSize && gridSize > 0) || (cell.w > 0 && cell.h > 0);
  // if setting spawn, set and exit early
  if (settingSpawn && typeof onSetSpawn === 'function') {
        const stage = e.target.getStage();
        const mapPt = toMapCoords(stage);
        if (mapPt) onSetSpawn(mapPt);
        return;
      }
  if (!measureMode || !hasGrid) return;
        const stage = e.target.getStage();
        const mapPt = toMapCoords(stage);
        const snapped = snapToGrid(mapPt);
        setMeasureStart(snapped);
        setMeasureEnd(snapped);
      }}
      onMouseMove={(e) => {
  const hasGrid = (gridSize && gridSize > 0) || (cell.w > 0 && cell.h > 0);
  if (!measureMode || !measureStart || !hasGrid) return;
        const stage = e.target.getStage();
        const mapPt = toMapCoords(stage);
        setMeasureEnd(snapToGrid(mapPt));
      }}
      onMouseUp={() => {
        // keep last measurement until cleared/toggled off
      }}
    >
  <Image image={image} />

      {/* Spawn point indicator */}
      {spawnPoint && (
        <Group x={spawnPoint.x} y={spawnPoint.y} listening={false}>
          <Line points={[-12,0,12,0]} stroke="#00bcd4" strokeWidth={2} opacity={0.9} />
          <Line points={[0,-12,0,12]} stroke="#00bcd4" strokeWidth={2} opacity={0.9} />
        </Group>
      )}

      {/* Optional dungeon overlay (cells) */}
      {dungeon && dungeon.grid && dungeon.grid.length > 0 && (
        <Group opacity={0.25}>
          {dungeon.grid.map((row, y) => (
            row.map((cell, x) => {
              if (cell === 0) return null; // walls invisible overlay
              const color = cell === 1 ? '#00ff99' : cell === 2 ? '#66ccff' : '#ffaa00';
              const size = gridSize > 0 ? gridSize : 25;
              return (
                <Line
                  key={`dcell-${x}-${y}`}
                  points={[x * size, y * size, (x + 1) * size, y * size, (x + 1) * size, (y + 1) * size, x * size, (y + 1) * size, x * size, y * size]}
                  closed
                  stroke={color}
                  strokeWidth={1}
                />
              );
            })
          ))}
        </Group>
      )}
      
      {/* Grid Overlay */}
    {(cell.w > 0 && cell.h > 0) && image && (
        <Group>
          {/* Vertical lines */}
      {Array.from({ length: Math.ceil(image.width / cell.w) }).map((_, i) => (
            <Line
              key={`v${i}`}
        points={[i * cell.w, 0, i * cell.w, image.height]}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={1}
            />
          ))}
          {/* Horizontal lines */}
      {Array.from({ length: Math.ceil(image.height / cell.h) }).map((_, i) => (
            <Line
              key={`h${i}`}
        points={[0, i * cell.h, image.width, i * cell.h]}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={1}
            />
          ))}
        </Group>
      )}

      {tokens.map(token => (
        <DraggableToken
          key={token.id}
          token={token}
          zoom={zoom}
          draggable={!measureMode}
          onDragEnd={(pos) => {
            // Convert stage coords -> map coords
            const mapPt = {
              x: (pos.x - panOffset.x) / (zoom / 100),
              y: (pos.y - panOffset.y) / (zoom / 100)
            };
            // Optionally snap to grid cell center if enabled
            let finalPt = mapPt;
            const hasCell = cell.w > 0 && cell.h > 0;
            if (snapTokensToGrid && hasCell) {
              const cx = Math.floor(mapPt.x / cell.w) + 0.5;
              const cy = Math.floor(mapPt.y / cell.h) + 0.5;
              finalPt = { x: cx * cell.w, y: cy * cell.h };
            }
            updateTokenPosition(token.id, finalPt);
          }}
          onRightClick={() => onRightClickToken(token)}
          onHPChange={(delta) => updateTokenHP(token.id, delta)}
          onSizeChange={(delta) => updateTokenSize(token.id, delta)}
        >
          <Token
            token={token}
            updatePosition={updateTokenPosition}
            updateHP={updateTokenHP}
            updateSize={updateTokenSize}
            onRightClick={onRightClickToken}
          />
        </DraggableToken>
      ))}

      {/* Distance measurement overlay */}
  {measureMode && (cell.w > 0 && cell.h > 0) && measureStart && measureEnd && (
        <Group>
          <Line
            points={[measureStart.x, measureStart.y, measureEnd.x, measureEnd.y]}
            stroke="#ffd700"
            dash={[6, 6]}
            strokeWidth={2}
          />
          <Label x={(measureStart.x + measureEnd.x) / 2} y={(measureStart.y + measureEnd.y) / 2 - 20}>
            <Tag fill="rgba(0,0,0,0.8)" stroke="#b8860b" />
            <Text
              text={`${distanceFeet(measureStart, measureEnd)} ft`}
              fill="gold"
              padding={6}
              fontStyle="bold"
            />
          </Label>
        </Group>
      )}
    </Group>
  );
};

export default MapLayer;
