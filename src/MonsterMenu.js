import React, { useState } from "react";

const FancyButton = ({ children, onClick, style, ...props }) => {
  const [hover, setHover] = useState(false);
  const baseStyle = {
    padding: "10px 20px",
    borderRadius: "8px",
    background: "linear-gradient(45deg, #444, #222)",
    border: "none",
    color: "gold",
    fontFamily: "'Cinzel', serif",
    boxShadow: "0px 4px 6px rgba(0,0,0,0.5)",
    cursor: "pointer",
    transition: "transform 0.1s ease, box-shadow 0.1s ease",
  };

  const hoverStyle = hover
    ? { transform: "scale(1.05)", boxShadow: "0px 6px 8px rgba(0,0,0,0.7)" }
    : {};

  return (
    <button
      onClick={onClick}
      style={{ ...baseStyle, ...style, ...hoverStyle }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...props}
    >
      {children}
    </button>
  );
};

const MonsterMenu = ({ monsters, onAddMonster }) => {
  return (
    <div style={{ marginTop: "20px" }}>
      <h3 style={{ fontFamily: "'Cinzel', serif", marginBottom: "10px" }}>
        Monsters
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {monsters.map((monster, index) => (
          <FancyButton key={index} onClick={() => onAddMonster(monster)}>
            {monster.name}
          </FancyButton>
        ))}
      </div>
    </div>
  );
};

export default MonsterMenu;
