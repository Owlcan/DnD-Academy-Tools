import React, { useState } from 'react';
import { Image, Group, Text, Circle, Label, Tag, Rect, Line } from 'react-konva';
import useImage from 'use-image';

const DraggableToken = ({ token, zoom, onDragEnd, onRightClick, onHPChange, onSizeChange, draggable = true }) => {
  const useImg = !token.specialType && token.image; // only load if not a special vector token
  const [image] = useImage(useImg || null);
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
    // Use the group's position relative to the MapLayer group (map coordinates)
    const gx = e.target.x();
    const gy = e.target.y();
    onDragEnd({ x: gx, y: gy });
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

  const renderSpecial = () => {
    const cx = 0;
    const cy = 0;
    const r = (token.size * (zoom / 100)) / 2;
    if (token.specialType === 'yellow-flag') {
      // flagpole and triangular flag
      const poleH = r * 2.2;
      return (
        <Group>
          <Rect x={- r * 0.05} y={- poleH / 2} width={r * 0.1} height={poleH} fill="#8b6b3a" cornerRadius={r * 0.05} />
          <Line points={[0, - poleH / 2 + r * 0.2, r * 1.4, - poleH / 2 + r * 0.8, 0, - poleH / 2 + r * 1.2]} closed fill="#ffeb3b" stroke="#b8860b" strokeWidth={1} />
        </Group>
      );
    }
    if (token.specialType === 'down-marker') {
      // red circle with white down arrow
      return (
        <Group>
          <Circle x={0} y={0} radius={r} fill="#b71c1c" stroke="#880e4f" strokeWidth={2} />
          <Line points={[0, - r * 0.5, 0, r * 0.5]} stroke="#ffffff" strokeWidth={4} lineCap="round" />
          <Line points={[- r * 0.3, r * 0.2, 0, r * 0.5, r * 0.3, r * 0.2]} stroke="#ffffff" strokeWidth={4} lineCap="round" />
        </Group>
      );
    }
    if (token.specialType === 'arenaball') {
      // silver ball with blue accents
      return (
        <Group>
          <Circle x={0} y={0} radius={r} fill="#c0c0c0" stroke="#607d8b" strokeWidth={2} />
          {/* blue lining accents */}
          <Line points={[- r * 0.8, 0, r * 0.8, 0]} stroke="#2196f3" strokeWidth={2} opacity={0.9} />
          <Line points={[0, - r * 0.8, 0, r * 0.8]} stroke="#2196f3" strokeWidth={2} opacity={0.9} />
          <Circle x={0} y={0} radius={r * 0.3} stroke="#2196f3" strokeWidth={2} opacity={0.9} />
        </Group>
      );
    }
    return null;
  };

  return (
    <Group
      x={token.x}
      y={token.y}
      draggable={draggable}
      onDragStart={draggable ? handleDragStart : undefined}
      onDragEnd={draggable ? handleDragEnd : undefined}
      onContextMenu={handleContextMenu}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      opacity={isDragging ? 0.7 : 1}
    >
      {/* Add gold circle background */}
      <Circle
        x={0}
        y={0}
        radius={(token.size * (zoom / 100)) / 2}
        fill="rgba(184, 134, 11, 0.3)"
        stroke="#b8860b"
        strokeWidth={1}
      />
      {!token.specialType && image && (
        <Image
          image={image}
          x={- (dimensions.width / 2)}
          y={- (dimensions.height / 2)}
          width={dimensions.width}
          height={dimensions.height}
          offsetX={0}
          offsetY={0}
        />
      )}
      {token.specialType && renderSpecial()}
      {token.isPlayer && (
        <>
          <Text
            text={token.name || ""}
            x={-50}
            y={-dimensions.height/2 - 20}
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
            x={-30}
            y={dimensions.height/2 + 5}
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
          x={dimensions.width/2 + 10}
          y={-dimensions.height/2 - 10}
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
