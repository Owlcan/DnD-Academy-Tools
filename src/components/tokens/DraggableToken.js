import React, { useState } from 'react';
import { Image, Group, Text, Circle, Label, Tag, Rect } from 'react-konva';
import useImage from 'use-image';

const DraggableToken = ({ token, zoom, onDragEnd, onRightClick, onHPChange, onSizeChange }) => {
  const [image] = useImage(token.image);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const baseSize = token.size * (zoom / 100);
  const dimensions = {
    width: baseSize,
    height: baseSize / (token.aspectRatio || 0.8), // Use token's aspect ratio or default
  };

  const handleDragStart = () => {
    setIsHovered(false);
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

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Get stats to display from character data if available
  const characterData = token.characterData || {};
  const attributes = characterData.attributes || {};
  const hitPoints = characterData.hit_points || {};
  
  // Helper to get attribute modifier
  const getAttributeModifier = (attributeValue) => {
    const mod = Math.floor((attributeValue || 10) / 2) - 5;
    return mod >= 0 ? `+${mod}` : mod.toString();
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
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
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
          
          {/* Display character sheet tooltip on hover if character data exists */}
          {isHovered && token.characterData && Object.keys(token.characterData).length > 0 && (
            <Label
              x={token.x + dimensions.width/2 + 10}
              y={token.y - dimensions.height/2 - 10}
            >
              <Tag
                fill="rgba(26, 26, 26, 0.95)"
                stroke="#3a0000"
                strokeWidth={1}
                cornerRadius={6}
                shadowColor="black"
                shadowBlur={10}
                shadowOffset={{ x: 5, y: 5 }}
                shadowOpacity={0.5}
                pointerDirection="left"
                pointerWidth={15}
                pointerHeight={15}
                lineJoin="round"
              />
              <Text
                text={`${token.name}
${characterData.class || ''}
${characterData.race || ''}

STR: ${attributes.strength || '-'} (${getAttributeModifier(attributes.strength)})
DEX: ${attributes.dexterity || '-'} (${getAttributeModifier(attributes.dexterity)})
CON: ${attributes.constitution || '-'} (${getAttributeModifier(attributes.constitution)})
INT: ${attributes.intelligence || '-'} (${getAttributeModifier(attributes.intelligence)})
WIS: ${attributes.wisdom || '-'} (${getAttributeModifier(attributes.wisdom)})
CHA: ${attributes.charisma || '-'} (${getAttributeModifier(attributes.charisma)})

HP: ${hitPoints.current || token.hp}/${hitPoints.max || token.maxHP}
AC: ${characterData.equipment?.armor?.armor_class || '-'}
Speed: ${characterData.speed || '-'}`}
                padding={10}
                fill="#c41e3a"
                fontSize={12}
                fontFamily="Share Tech Mono"
                lineHeight={1.2}
                width={180}
              />
            </Label>
          )}
        </>
      )}
    </Group>
  );
};

export default DraggableToken;
