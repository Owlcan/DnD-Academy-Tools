import React, { useEffect } from 'react';
import FancyButton from '../buttons/FancyButton';

const CustomAlert = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
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
      zIndex: 3000
    }}>
      <div>{message}</div>
      <FancyButton onClick={onClose}>Close</FancyButton>
    </div>
  );
};

export default CustomAlert;
