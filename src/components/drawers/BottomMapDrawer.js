import React from 'react';
import FancyButton from '../buttons/FancyButton';
import { availableMaps } from '../../constants';

const BottomMapDrawer = ({ isOpen, onClose, onSelectMap, onCustomMapUpload }) => {
  if (!isOpen) return null;

  const handleCustomMapUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => onCustomMapUpload(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '80%',
      maxHeight: '40vh',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      border: '2px solid #b8860b',
      borderBottom: 'none',
      borderRadius: '8px 8px 0 0',
      padding: '20px',
      overflowY: 'auto',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '20px',
        justifyItems: 'center'
      }}>
        {availableMaps.map((map, index) => (
          <div key={index} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}>
            <img 
              src={map.thumb || map.url}
              alt={map.name || `Map ${index + 1}`}
              style={{
                width: '200px',
                height: '120px',
                objectFit: 'cover',
                cursor: 'pointer',
                border: '1px solid #b8860b',
                borderRadius: '4px'
              }}
              onClick={() => onSelectMap(map.url)}
            />
            <span style={{ color: '#b8860b' }}>
              {map.name || `Map ${index + 1}`}
            </span>
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        marginTop: 'auto'
      }}>
        <input
          type="file"
          id="custom-map"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleCustomMapUpload}
        />
        <FancyButton onClick={() => document.getElementById('custom-map').click()}>
          Upload Custom Map
        </FancyButton>
        <FancyButton onClick={onClose}>
          Close Map Selection
        </FancyButton>
      </div>
    </div>
  );
};

export default BottomMapDrawer;
