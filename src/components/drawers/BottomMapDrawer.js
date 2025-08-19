import React from 'react';
import FancyButton from '../buttons/FancyButton';
import { availableMaps as baseMaps } from '../../constants';

const BottomMapDrawer = ({ isOpen, onClose, onSelectMap, onCustomMapUpload }) => {
  // Hooks must be called unconditionally at the top level
  const handleCustomMapUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => onCustomMapUpload(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Attempt to read dynamic manifest generated at build/start time
  const [dynamicMaps, setDynamicMaps] = React.useState([]);
  React.useEffect(() => {
    fetch('/assets/maps/manifest.json', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data && Array.isArray(data.maps)) setDynamicMaps(data.maps);
      })
      .catch(() => void 0);
  }, []);

  const maps = React.useMemo(() => {
    // Merge base and dynamic by URL to avoid duplicates
    const seen = new Set();
    const merged = [];
    [...baseMaps, ...dynamicMaps].forEach(m => {
      const url = m && m.url;
      if (!url || seen.has(url)) return;
      seen.add(url);
      merged.push(m);
    });
    return merged;
  }, [dynamicMaps]);

  // Only now is it safe to conditionally return
  if (!isOpen) return null;

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
  {maps.map((map, index) => (
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
