import React from 'react';
import './WeatherEffects.css';

const WeatherEffects = ({ activeEffects }) => {
  return (
    <div className="weather-container">
      {activeEffects.includes('rain') && <div className="rain-effect" />}
      {activeEffects.includes('snow') && (
        <>
          <div className="snow-effect" />
          <div className="cold-overlay" />
        </>
      )}
      {activeEffects.includes('miasma') && <div className="miasma-effect" />}
      {activeEffects.includes('timeMagic') && <div className="time-magic-effect" />}
      {activeEffects.includes('heat') && <div className="heat-effect" />}
      {activeEffects.includes('night') && <div className="night-overlay" />}
      {activeEffects.includes('fog') && <div className="fog-effect" />}
    </div>
  );
};

export default WeatherEffects;
