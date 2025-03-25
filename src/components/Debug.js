import React from 'react';

const Debug = ({ monsters, tokens }) => {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      left: 10,
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: 10,
      fontSize: 12,
      zIndex: 9999,
    }}>
      <div>Monsters loaded: {monsters?.length || 0}</div>
      <div>Active tokens: {tokens?.length || 0}</div>
    </div>
  );
};

export default Debug;
