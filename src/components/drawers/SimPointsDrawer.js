import React, { useState, useCallback, useEffect } from 'react';
import FancyButton from '../buttons/FancyButton';

const SimPointsDrawer = ({ simPoints, setSimPoints }) => {
  const [input, setInput] = useState('');
  const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 420 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [clearConfirm, setClearConfirm] = useState(false);

  const dividePoints = (divisor) => {
    const value = parseInt(input);
    if (!isNaN(value)) {
      setSimPoints(Math.floor(value / divisor));
      setInput('');
    }
  };

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove]);

  const handleClearClick = () => {
    if (clearConfirm) {
      setSimPoints(0);
      setClearConfirm(false);
    } else {
      setClearConfirm(true);
      setTimeout(() => setClearConfirm(false), 3000); // Reset after 3 seconds
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      const value = parseInt(input);
      if (!isNaN(value)) {
        setSimPoints(prev => prev + value);
        setInput('');
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: position.y,
      left: position.x,
      width: '300px',
      background: 'rgba(0,0,0,0.95)',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #b8860b',
      color: '#00ff00',
      zIndex: 1000,
      cursor: isDragging ? 'grabbing' : 'grab'
    }} onMouseDown={handleMouseDown}>
      <div style={{ 
        textAlign: 'center', 
        fontSize: '28px',
        fontFamily: '"Share Tech Mono", "Courier New", monospace',
        textShadow: '0 0 10px rgba(0,255,0,0.5)',
        letterSpacing: '2px',
        marginBottom: '15px'
      }}>
        {simPoints.toString().padStart(6, '0')}
      </div>
      
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Enter XP value"
        style={{
          width: '100%',
          background: 'rgba(0,0,0,0.7)',
          border: '1px solid #b8860b',
          color: '#00ff00',
          padding: '10px',
          fontSize: '20px',
          fontFamily: '"Share Tech Mono", "Courier New", monospace',
          textAlign: 'center',
          letterSpacing: '2px',
          marginBottom: '15px'
        }}
      />

      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px',
        marginBottom: '10px'
      }}>
        <FancyButton 
          onClick={() => dividePoints(2)}
          style={{ fontSize: '20px', padding: '10px' }}
        >
          /2
        </FancyButton>
        <FancyButton 
          onClick={() => dividePoints(3)}
          style={{ fontSize: '20px', padding: '10px' }}
        >
          /3
        </FancyButton>
        <FancyButton 
          onClick={() => dividePoints(4)}
          style={{ fontSize: '20px', padding: '10px' }}
        >
          /4
        </FancyButton>
        <FancyButton 
          onClick={() => dividePoints(5)}
          style={{ fontSize: '20px', padding: '10px' }}
        >
          /5
        </FancyButton>
      </div>

      <FancyButton
        onClick={handleClearClick}
        style={{ 
          width: '100%',
          fontSize: '16px',
          color: clearConfirm ? '#ff6b6b' : 'gold'
        }}
      >
        {clearConfirm ? 'Click again to confirm clear' : 'Clear Points'}
      </FancyButton>
    </div>
  );
};

export default SimPointsDrawer;
