import React, { useEffect } from 'react';
import FancyButton from '../buttons/FancyButton';

const CustomAlert = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(0,0,0,0.95)',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #b8860b',
      color: 'gold',
      zIndex: 3000,
      minWidth: '300px',
      textAlign: 'center',
      fontFamily: "'Cinzel', serif",
      boxShadow: '0 0 20px rgba(184, 134, 11, 0.5)'
    }}>
      <div style={{ whiteSpace: 'pre-line', marginBottom: '15px' }}>{message}</div>
      <FancyButton onClick={onClose}>OK</FancyButton>
    </div>
  );
};

export default CustomAlert;
