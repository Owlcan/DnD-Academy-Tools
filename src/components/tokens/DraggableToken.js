import React, { useState } from 'react';
import { Image, Group, Text, Circle } from 'react-konva';
import useImage from 'use-image';

const DraggableToken = ({ token, zoom, onDragEnd, onRightClick, onHPChange, onSizeChange }) => {
  const [image] = useImage(token.image);
  const [isDragging, setIsDragging] = useState(false);

  const baseSize = token.size * (zoom / 100);
  const dimensions = {
    width: baseSize,
    height: baseSize / (token.aspectRatio || 0.8), // Use token's aspect ratio or default
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (e) => {
    setIsDragging(false);
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    
    // Calculate actual position accounting for zoom and stage scale
    const actualPos = {
      x: point.x,
      y: point.y
    };
    
    onDragEnd(actualPos);
  };

  const handleContextMenu = (e) => {
    e.evt.preventDefault();
    onRightClick();
  };

  return (
    <Group>
      {/* Add gold circle background */}
      <Circle
        x={token.x}
        y={token.y}
        radius={(token.size * (zoom / 100)) / 2}
        fill="rgba(184, 134, 11, 0.3)"
        stroke="#b8860b"
        strokeWidth={1}
      />
      <Image
        image={image}
        x={token.x - (dimensions.width / 2)}
        y={token.y - (dimensions.height / 2)}
        width={dimensions.width}
        height={dimensions.height}
        offsetX={0}
        offsetY={0}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onContextMenu={handleContextMenu}
        opacity={isDragging ? 0.7 : 1}
        dragBoundFunc={(pos) => ({
          x: pos.x,
          y: pos.y
        })}
      />
      {token.isPlayer && (
        <>
          <Text
            text={token.name || ""}
            x={token.x - 50}
            y={token.y - dimensions.height/2 - 20}
            width={100}
            align="center"
            fill="white"
            fontSize={14}
            fontStyle="bold"
            shadowColor="black"
            shadowBlur={2}
            shadowOffset={{ x: 1, y: 1 }}
            shadowOpacity={0.8}
          />
          <Text
            text={`${token.hp}/${token.maxHP}`}
            x={token.x - 30}
            y={token.y + dimensions.height/2 + 5}
            width={60}
            align="center"
            fill="white"
            fontSize={12}
            fontStyle="bold"
            shadowColor="black"
            shadowBlur={2}
            shadowOffset={{ x: 1, y: 1 }}
            shadowOpacity={0.8}
          />
        </>
      )}
    </Group>
  );
};

export default DraggableToken;
