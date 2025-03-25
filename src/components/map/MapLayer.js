import React from 'react';
import { Image, Group, Text, Line } from 'react-konva';
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
  updateTokenPosition,
  updateTokenHP,
  updateTokenSize,
  onRightClickToken 
}) => {
  const [image] = useImage(mapUrl);
  
  console.log('MapLayer rendering tokens:', tokens); // Debug log

  return (
    <Group
      x={panOffset.x}
      y={panOffset.y}
      scaleX={zoom / 100}
      scaleY={zoom / 100}
    >
      <Image image={image} />
      
      {/* Grid Overlay */}
      {gridSize > 0 && image && (
        <Group>
          {/* Vertical lines */}
          {Array.from({ length: Math.ceil(image.width / gridSize) }).map((_, i) => (
            <Line
              key={`v${i}`}
              points={[i * gridSize, 0, i * gridSize, image.height]}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={1}
            />
          ))}
          {/* Horizontal lines */}
          {Array.from({ length: Math.ceil(image.height / gridSize) }).map((_, i) => (
            <Line
              key={`h${i}`}
              points={[0, i * gridSize, image.width, i * gridSize]}
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
          onDragEnd={(pos) => {
            const updatedPos = {
              x: (pos.x - panOffset.x) / (zoom / 100),
              y: (pos.y - panOffset.y) / (zoom / 100)
            };
            updateTokenPosition(token.id, updatedPos);
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
    </Group>
  );
};

export default MapLayer;
