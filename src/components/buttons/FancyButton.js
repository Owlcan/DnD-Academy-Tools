import React, { useState } from 'react';

const FancyButton = ({ children, onClick, style, ...props }) => {
  const [hover, setHover] = useState(false);
  const baseStyle = {
    padding: "10px 20px",
    borderRadius: "8px",
    background: "linear-gradient(45deg, #444, #222)",
    border: "1px solid #b8860b",
    color: "gold",
    fontFamily: "'Cinzel', serif",
    boxShadow: "inset 0 1px 0 #b8860b, 0 1px 2px rgba(0,0,0,0.5)",
    cursor: "pointer",
    transition: "transform 0.1s ease, box-shadow 0.1s ease",
    textShadow: "1px 1px 3px rgba(0,0,0,0.7)",
  };
  const hoverStyle = hover
    ? {
        transform: "scale(1.05)",
        boxShadow: "inset 0 1px 0 #b8860b, 0 3px 4px rgba(0,0,0,0.7)",
      }
    : {};
  return (
    <button
      {...props}
      onClick={onClick}
      style={{ ...baseStyle, ...style, ...hoverStyle }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </button>
  );
};

export default FancyButton;
