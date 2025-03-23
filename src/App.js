import React, { useState, useRef, useEffect } from "react";
import Konva from "konva";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Group,
  Text,
  Circle,
  Rect,
} from "react-konva";
import useImage from "use-image";
import bestiaryData from "./bestiary.json";

// Global availableMaps for map selection.
const availableMaps = [
  {
    name: "Field and River",
    thumb: "https://i.postimg.cc/mgPLD86r/battlemap1-dungeondraft-map-UHD.png",
    url: "https://i.postimg.cc/mgPLD86r/battlemap1-dungeondraft-map-UHD.png",
  },
  {
    name: "Indoor Hazard Arena",
    thumb: "https://i.postimg.cc/vHq8bphj/battlemap2.png",
    url: "https://i.postimg.cc/vHq8bphj/battlemap2.png",
  },
  {
    name: "Bridge Battle",
    thumb: "https://i.postimg.cc/bw4z2kK9/bridgebattlemap1-UHD.png",
    url: "https://i.postimg.cc/bw4z2kK9/bridgebattlemap1-UHD.png",
  },
  {
    name: "Classroom Brawl",
    thumb: "https://i.postimg.cc/m222xbYC/classbattle1-UHD.png",
    url: "https://i.postimg.cc/m222xbYC/classbattle1-UHD.png",
  },
  {
    name: "The Sea of Encounter 3",
    thumb:
      "https://i.postimg.cc/pr6vDz5z/Low-Res-Grid-The-Sea-of-Encounter-3-35x35.jpg",
    url: "https://i.postimg.cc/pr6vDz5z/Low-Res-Grid-The-Sea-of-Encounter-3-35x35.jpg",
  },
  {
    name: "The Sea of Encounter 4",
    thumb:
      "https://i.postimg.cc/05W9RRXj/Low-Res-Grid-The-Sea-of-Encounter-4-35x35.jpg",
    url: "https://i.postimg.cc/05W9RRXj/Low-Res-Grid-The-Sea-of-Encounter-4-35x35.jpg",
  },
  {
    name: "Sauna Hut",
    thumb: "https://i.postimg.cc/bNZpqC4T/Sauna-Fin-no-Roof-22x22-tagged.jpg",
    url: "https://i.postimg.cc/bNZpqC4T/Sauna-Fin-no-Roof-22x22-tagged.jpg",
  },
  {
    name: "Giant River 1",
    thumb:
      "https://i.postimg.cc/4ydZ7ByX/Social-Grid-6-water-day-Giant-river-35x30.jpg",
    url: "https://i.postimg.cc/4ydZ7ByX/Social-Grid-6-water-day-Giant-river-35x30.jpg",
  },
  {
    name: "Bottletop Hill Encounter",
    thumb:
      "https://i.postimg.cc/85TTD1VJ/Social-grid-7-Bottle-Encounter-Coind-and-Bottle.jpg",
    url: "https://i.postimg.cc/85TTD1VJ/Social-grid-7-Bottle-Encounter-Coind-and-Bottle.jpg",
  },
  {
    name: "Giant River 2",
    thumb:
      "https://i.postimg.cc/4dwsxrJ8/Social-Grid-8-water-day-Giant-river-35x30.jpg",
    url: "https://i.postimg.cc/4dwsxrJ8/Social-Grid-8-water-day-Giant-river-35x30.jpg",
  },
];

// Manual mapping for monster images.
const monsterImageMappingManual = {
  "Darkform Enforcer": "https://i.postimg.cc/15fLxnLn/Darkform-Enforcer.png",
  "Darkforme Overwatch":
    "https://i.postimg.cc/MZshrbrJ/Darkforme-Overwatch.png",
  "Darkforme-Cavesweller":
    "https://i.postimg.cc/jdmBRqb8/Darkforme-Cavesweller.png",
  "Darkforme-Shade-Sneak":
    "https://i.postimg.cc/pr14hRnL/Darkforme-Shade-Sneak.png",
  "Darkforme-Sleek-Lurker Pack Alpha":
    "https://i.postimg.cc/MT5hwy6R/Darkforme-Sleek-Lurker-Pack-Alpha.png",
  "Darkling-Bellowbelly Cubling":
    "https://i.postimg.cc/FzKwH7z6/Darkling-Bellowbelly-Cubling.png",
  "Darkling-Bellowbelly":
    "https://i.postimg.cc/LX2rGyp2/Darkling-Bellowbelly.png",
  "Darkling-Brackling": "https://i.postimg.cc/Xv0hy2Xd/Darkling-Brackling.png",
  "Darkling-Caller": "https://i.postimg.cc/GmDVt03b/Darkling-Caller.png",
  "Darkling-Lurker": "https://i.postimg.cc/LszcycGx/Darkling-Lurker.png",
  "Darkling-Slurper": "https://i.postimg.cc/Qt8yfHQM/Darkling-Slurper.png",
  "Darkling-Yowler": "https://i.postimg.cc/FKg6bjJq/Darkling-Yowler.png",
};

// Condition symbols for tokens.
const conditionSymbols = {
  poison: { symbol: "☣", color: "green" },
  rage: { symbol: "🔥", color: "red" },
  confusion: { symbol: "❓", color: "yellow" },
  fear: { symbol: "😱", color: "yellow" },
  sleeping: { symbol: "Z", color: "purple" },
  death: { symbol: "☠", color: "grey" },
};

/* FancyButton – the original button style.
   All fonts are gold and use a subtle drop-shadow for dimension.
*/
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

/* TopDrawer – drop down drawer for instructions. */
const TopDrawer = ({ isOpen, onToggle, scale }) => {
  const drawerStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    background: "rgba(0,0,0,0.85)",
    color: "#b8860b",
    fontFamily: "'Cinzel', serif",
    boxSizing: "border-box",
    transition: "max-height 0.3s ease",
    maxHeight: isOpen ? `${150 * scale}px` : "0px",
    overflow: "hidden",
    padding: isOpen ? `${10 * scale}px` : `${0 * scale}px ${10 * scale}px`,
  };
  return (
    <div style={drawerStyle}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <strong>Notes/Instructions:</strong> Use CTRL+scroll or CTRL+hotkeys
          to zoom (focal on cursor). While dragging a token, press "w" to
          enlarge and "s" to shrink it. Right‑click tokens for customization.
        </div>
        <FancyButton
          onClick={onToggle}
          style={{
            padding: `${5 * scale}px ${10 * scale}px`,
            fontSize: `${12 * scale}px`,
          }}
        >
          {isOpen ? "Hide" : "Show"}
        </FancyButton>
      </div>
      {isOpen && (
        <textarea
          placeholder="Enter your notes here..."
          style={{
            width: "98%",
            height: `${80 * scale}px`,
            marginTop: `${10 * scale}px`,
            background: "#333",
            color: "gold",
            border: "1px solid #b8860b",
            borderRadius: `${4 * scale}px`,
            padding: `${5 * scale}px`,
            fontFamily: "'Cinzel', serif",
            textShadow: "1px 1px 3px rgba(0,0,0,0.7)",
          }}
        />
      )}
    </div>
  );
};

/* SimPointsDrawer – VR Sim Points drawer, chunkier style. */
const SimPointsDrawer = ({ simPoints, setSimPoints, scale }) => {
  const [isOpen, setIsOpen] = useState(false);
  const drawerStyle = {
    position: "absolute",
    right: "0px",
    top: "50%",
    transform: "translateY(-50%)",
    width: isOpen ? `${250 * scale}px` : `${30 * scale}px`,
    background: "#000",
    color: "gold",
    fontFamily: "'Digital-7', 'VT323', monospace",
    transition: "width 0.3s ease",
    border: `1px solid gold`,
    borderLeft: "none",
    borderTopLeftRadius: `${8 * scale}px`,
    borderBottomLeftRadius: `${8 * scale}px`,
    padding: isOpen ? `${10 * scale}px` : `${5 * scale}px`,
    zIndex: 1200,
  };
  return (
    <div style={drawerStyle}>
      {isOpen ? (
        <div>
          <div
            style={{
              marginBottom: `${10 * scale}px`,
              textAlign: "center",
              textShadow: "1px 1px 3px rgba(0,0,0,0.7)",
            }}
          >
            <strong style={{ fontSize: `${36 * scale}px` }}>
              VR Sim Points
            </strong>
          </div>
          <input
            type="number"
            value={simPoints}
            onChange={(e) => setSimPoints(Number(e.target.value))}
            style={{
              width: "100%",
              padding: `${5 * scale}px`,
              fontSize: `${36 * scale}px`,
              fontWeight: "900",
              textAlign: "right",
              background: "#000",
              color: "gold",
              border: `1px solid gold`,
              borderRadius: `${4 * scale}px`,
              fontFamily: "'Digital-7', 'VT323', monospace",
              textShadow: "1px 1px 3px rgba(0,0,0,0.7)",
            }}
          />
          <div
            style={{
              marginTop: `${10 * scale}px`,
              display: "flex",
              gap: `${5 * scale}px`,
            }}
          >
            {[2, 3, 4, 5, 6].map((divisor) => (
              <button
                key={divisor}
                onClick={() => setSimPoints(Math.floor(simPoints / divisor))}
                style={{
                  background: "#000",
                  color: "gold",
                  border: `${1 * scale}px solid gold`,
                  padding: `${5 * scale}px`,
                  fontSize: `${14 * scale}px`,
                  borderRadius: `${4 * scale}px`,
                  flex: 1,
                  cursor: "pointer",
                  fontFamily: "'Digital-7', 'VT323', monospace",
                  textShadow: "1px 1px 3px rgba(0,0,0,0.7)",
                }}
              >
                /{divisor}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              marginTop: `${10 * scale}px`,
              background: "#000",
              color: "gold",
              border: `${1 * scale}px solid gold`,
              padding: `${5 * scale}px`,
              fontSize: `${14 * scale}px`,
              borderRadius: `${4 * scale}px`,
              width: "100%",
              cursor: "pointer",
              fontFamily: "'Digital-7', 'VT323', monospace",
              textShadow: "1px 1px 3px rgba(0,0,0,0.7)",
            }}
          >
            Hide
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            background: "#000",
            color: "gold",
            border: `${1 * scale}px solid gold`,
            borderRadius: `${4 * scale}px`,
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            cursor: "pointer",
            width: "100%",
            fontFamily: "'Digital-7', 'VT323', monospace",
            textShadow: "1px 1px 3px rgba(0,0,0,0.7)",
          }}
        >
          VR Sim pts
        </button>
      )}
    </div>
  );
};

/* MonsterModal – for monster tokens. */
const MonsterModal = ({ token, onClose, onRemove }) => {
  const [isPinned, setIsPinned] = useState(false);
  const [position, setPosition] = useState({
    x: window.innerWidth / 2 - 300,
    y: window.innerHeight / 2 - 200,
  });
  const [dragOffset, setDragOffset] = useState(null);
  const [trusted, setTrusted] = useState(false);

  const handleMouseDown = (e) => {
    if (!isPinned)
      setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (dragOffset && !isPinned)
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
    };
    const handleMouseUp = () => setDragOffset(null);
    if (!isPinned) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragOffset, isPinned]);

  const modalStyle = {
    position: "absolute",
    top: position.y,
    left: position.x,
    background: "#222",
    border: "1px solid #b8860b",
    color: "gold",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0px 4px 10px rgba(0,0,0,0.8)",
    zIndex: 2000,
    fontFamily: "'Cinzel', serif",
    maxWidth: "600px",
    maxHeight: "80vh",
    overflowY: "auto",
    textAlign: "center",
  };

  return (
    <div style={modalStyle} onMouseDown={handleMouseDown}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: isPinned ? "default" : "move",
        }}
      >
        <h2 style={{ margin: 0, textShadow: "1px 1px 3px rgba(0,0,0,0.7)" }}>
          Monster Info
        </h2>
        <div>
          <FancyButton
            onClick={() => setIsPinned(!isPinned)}
            style={{ marginRight: "5px", fontSize: "12px" }}
          >
            {isPinned ? "Unpin" : "Pin"}
          </FancyButton>
          <FancyButton
            onClick={onClose}
            style={{ padding: "5px 10px", fontSize: "14px" }}
          >
            X
          </FancyButton>
        </div>
      </div>
      {token.details && token.details.xp && (
        <Text
          text={`VR Sim Points: ${token.details.xp}`}
          x={10}
          y={40}
          fontSize={16}
          fill="gold"
          fontStyle="bold"
          shadowColor="black"
          shadowBlur={3}
          shadowOffsetX={1}
          shadowOffsetY={1}
        />
      )}
      {trusted ? (
        <img
          src={
            monsterImageMappingManual[token.details?.name] || token.image || ""
          }
          alt={token.name}
          style={{ width: "100%", marginTop: "10px", borderRadius: "8px" }}
        />
      ) : (
        <div
          style={{
            marginTop: "10px",
            fontSize: "14px",
            textShadow: "1px 1px 3px rgba(0,0,0,0.7)",
          }}
        >
          <p>
            <strong>Basic Info:</strong> {token.name}
          </p>
          <p>
            <strong>Type:</strong> {token.tokenType || "Unknown"}
          </p>
        </div>
      )}
      <FancyButton
        onClick={() => setTrusted(true)}
        style={{ marginTop: "10px", fontSize: "14px" }}
      >
        Trust &amp; Reveal Stat Block
      </FancyButton>
      <FancyButton
        onClick={() => onRemove(token.id)}
        style={{ marginTop: "10px", fontSize: "14px" }}
      >
        Remove Monster
      </FancyButton>
    </div>
  );
};

/* ModalWindow – for player tokens. */
const ModalWindow = ({
  token,
  onClose,
  onUpdateStatus,
  onUpdateField,
  onUpdateImage,
  onRemove,
}) => {
  const [isPinned, setIsPinned] = useState(false);
  const [position, setPosition] = useState({
    x: window.innerWidth / 2 - 300,
    y: window.innerHeight / 2 - 200,
  });
  const [dragOffset, setDragOffset] = useState(null);

  const [name, setName] = useState(token.name);
  const [hp, setHp] = useState(token.hp);
  const [maxHP, setMaxHP] = useState(token.maxHP);

  useEffect(() => {
    setName(token.name);
    setHp(token.hp);
    setMaxHP(token.maxHP);
  }, [token]);

  const handleMouseDown = (e) => {
    if (!isPinned) {
      setDragOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (dragOffset && !isPinned) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };
    const handleMouseUp = () => setDragOffset(null);
    if (!isPinned) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragOffset, isPinned]);

  const modalStyle = {
    position: "absolute",
    top: position.y,
    left: position.x,
    background: "#222",
    border: "1px solid #b8860b",
    color: "gold",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0px 4px 10px rgba(0,0,0,0.8)",
    zIndex: 2000,
    fontFamily: "'Cinzel', serif",
    maxWidth: "600px",
    maxHeight: "80vh",
    overflowY: "auto",
    textAlign: "center",
  };

  return (
    <div style={modalStyle} onMouseDown={handleMouseDown}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: isPinned ? "default" : "move",
        }}
      >
        <h2 style={{ margin: 0, textShadow: "1px 1px 3px rgba(0,0,0,0.7)" }}>
          Player Token
        </h2>
        <div>
          <FancyButton
            onClick={() => setIsPinned(!isPinned)}
            style={{ marginRight: "5px", fontSize: "12px" }}
          >
            {isPinned ? "Unpin" : "Pin"}
          </FancyButton>
          <FancyButton
            onClick={onClose}
            style={{ padding: "5px 10px", fontSize: "14px" }}
          >
            X
          </FancyButton>
        </div>
      </div>
      <div
        style={{
          marginTop: "10px",
          textAlign: "left",
          textShadow: "1px 1px 3px rgba(0,0,0,0.7)",
        }}
      >
        <div style={{ marginBottom: "10px" }}>
          <label>Name: </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              onUpdateField("name", e.target.value);
            }}
            style={{
              width: "100%",
              padding: "5px",
              border: "1px solid #b8860b",
              background: "#333",
              color: "gold",
            }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>HP: </label>
          <input
            type="number"
            value={hp}
            onChange={(e) => {
              const newHP = Number(e.target.value);
              setHp(newHP);
              onUpdateField("hp", newHP);
            }}
            style={{
              width: "100%",
              padding: "5px",
              border: "1px solid #b8860b",
              background: "#333",
              color: "gold",
            }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Max HP: </label>
          <input
            type="number"
            value={maxHP}
            onChange={(e) => {
              const newMaxHP = Number(e.target.value);
              setMaxHP(newMaxHP);
              onUpdateField("maxHP", newMaxHP);
            }}
            style={{
              width: "100%",
              padding: "5px",
              border: "1px solid #b8860b",
              background: "#333",
              color: "gold",
            }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <FancyButton
            onClick={() => onRemove(token.id)}
            style={{ fontSize: "14px" }}
          >
            Remove Token
          </FancyButton>
        </div>
        <div>
          <p
            style={{
              margin: "10px 0",
              fontSize: "14px",
              textShadow: "1px 1px 3px rgba(0,0,0,0.7)",
            }}
          >
            <strong>Status:</strong>
          </p>
          <div style={{ display: "flex", gap: "5px" }}>
            {Object.keys(conditionSymbols).map((statusKey) => (
              <FancyButton
                key={statusKey}
                title={statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
                onClick={() =>
                  onUpdateStatus(statusKey, !token.statuses?.[statusKey])
                }
                style={{ fontSize: "18px", padding: "8px" }}
              >
                {conditionSymbols[statusKey].symbol}
              </FancyButton>
            ))}
          </div>
        </div>
        <div style={{ marginTop: "10px" }}>
          <label>Upload New Image: </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                  onUpdateImage(reader.result);
                };
                reader.readAsDataURL(file);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

/* MonsterMenuComponent – renders monster buttons (unchanged). */
const MonsterMenuComponent = ({ monsters, onAddMonster }) => (
  <div style={{ marginTop: "20px" }}>
    <h3 style={{ fontFamily: "'Cinzel', serif", marginBottom: "10px" }}>
      Monsters
    </h3>
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: "5px",
      }}
    >
      {monsters.map((monster, index) => (
        <FancyButton
          key={index}
          onClick={() => onAddMonster(monster)}
          style={{ fontSize: "14px", padding: "6px 12px" }}
        >
          {monster.name}
        </FancyButton>
      ))}
    </div>
  </div>
);

/* MapSelectorComponent – displays available maps. */
const MapSelectorComponent = ({ maps, onSelect }) => (
  <div style={{ marginBottom: "10px" }}>
    <h3 style={{ fontFamily: "'Cinzel', serif" }}>Select a Map:</h3>
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      {maps.map((map, idx) => (
        <img
          key={idx}
          src={map.thumb}
          alt={map.name}
          style={{
            width: "150px",
            margin: "5px",
            cursor: "pointer",
            borderRadius: "4px",
            border: "1px solid #b8860b",
          }}
          onClick={() => onSelect(map.url)}
        />
      ))}
    </div>
  </div>
);

/* Sidebar – contains controls (unchanged aside from text effects). */
const Sidebar = ({
  addExtraPlayerToken,
  removePlayerTokens,
  showMapSelector,
  setShowMapSelector,
  setSelectedMap,
  customBackground,
  setCustomBackground,
  monsters,
  addEnemyToken,
  removeEnemyTokens,
  resetApp,
  uploadPlayerToken,
  saveGame,
  loadGame,
}) => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "300px",
      height: "100%",
      boxSizing: "border-box",
      background: "rgba(0,0,0,0.7)",
      border: "1px solid #b8860b",
      color: "gold",
      overflowY: "auto",
      padding: "10px",
      zIndex: 1000,
      fontFamily: "'Cinzel', serif",
      textShadow: "1px 1px 3px rgba(0,0,0,0.7)",
    }}
  >
    <h2>Controls</h2>
    <section style={{ marginBottom: "20px" }}>
      <h3>Player Features</h3>
      <FancyButton onClick={addExtraPlayerToken} style={{ marginTop: "10px" }}>
        Add Extra Player
      </FancyButton>
      <FancyButton onClick={removePlayerTokens} style={{ marginTop: "10px" }}>
        Remove Player Tokens
      </FancyButton>
    </section>
    <section style={{ marginBottom: "20px" }}>
      <h3>Map Controls</h3>
      <FancyButton
        onClick={() => setShowMapSelector(!showMapSelector)}
        style={{ marginBottom: "10px" }}
      >
        {showMapSelector ? "Hide Map Selector" : "Show Map Selector"}
      </FancyButton>
      {showMapSelector && (
        <MapSelectorComponent maps={availableMaps} onSelect={setSelectedMap} />
      )}
      <div style={{ marginBottom: "10px" }}>
        <h4>Custom Background</h4>
        <input
          type="file"
          accept="image/*"
          style={{ borderRadius: "4px" }}
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => setCustomBackground(reader.result);
              reader.readAsDataURL(file);
            }
          }}
        />
      </div>
    </section>
    <section style={{ marginBottom: "20px" }}>
      <h3>Enemy Features</h3>
      <MonsterMenuComponent monsters={monsters} onAddMonster={addEnemyToken} />
      <FancyButton onClick={removeEnemyTokens} style={{ marginBottom: "10px" }}>
        Remove Enemy Tokens
      </FancyButton>
      <FancyButton onClick={resetApp}>Reset App</FancyButton>
    </section>
    <section style={{ marginBottom: "20px" }}>
      <h3>Extras</h3>
      <FancyButton onClick={saveGame} style={{ marginBottom: "10px" }}>
        Save Game
      </FancyButton>
      <FancyButton onClick={loadGame} style={{ marginBottom: "10px" }}>
        Load Game
      </FancyButton>
    </section>
    <div
      style={{
        marginTop: "10px",
        fontSize: "12px",
        color: "gold",
        fontFamily: "'Cinzel', serif",
        textShadow: "1px 1px 3px rgba(0,0,0,0.7)",
      }}
    >
      CTRL+Scroll or CTRL+Hotkeys Zoom (focal on cursor). While dragging a
      token, press W/S to resize. Right‑click tokens for customization.
    </div>
  </div>
);

/* MapLayer – renders the map and tokens. */
const MapLayer = ({
  mapUrl,
  tokens,
  zoom,
  panOffset,
  updateTokenPosition,
  updateTokenHP,
  updateTokenSize,
  onRightClickToken,
}) => {
  const scale = zoom / 100;
  const [bgImage] = useImage(mapUrl);
  let offset = { x: 0, y: 0 };
  if (bgImage) {
    offset.x = (window.innerWidth - bgImage.width * scale) / 2 + panOffset.x;
    offset.y = (window.innerHeight - bgImage.height * scale) / 2 + panOffset.y;
  }
  return (
    <>
      {bgImage && (
        <KonvaImage
          image={bgImage}
          width={bgImage.width * scale}
          height={bgImage.height * scale}
          x={offset.x}
          y={offset.y}
        />
      )}
      {tokens.map((token) => (
        <DraggableToken
          key={token.id}
          token={token}
          zoom={zoom}
          offset={offset}
          updateTokenPosition={updateTokenPosition}
          updateTokenHP={updateTokenHP}
          updateTokenSize={updateTokenSize}
          onRightClick={onRightClickToken}
        />
      ))}
    </>
  );
};

/* DraggableToken – token image scales with zoom. */
const DraggableToken = ({
  token,
  zoom,
  offset,
  updateTokenPosition,
  updateTokenHP,
  updateTokenSize,
  onRightClick,
}) => {
  const scale = zoom / 100;
  const [image] = useImage(token.image);
  const tokenSize = (token.size || 40) * scale;
  const [isHeld, setIsHeld] = useState(false);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isHeld) {
        if (e.key.toLowerCase() === "w") {
          updateTokenSize(token.id, 5);
        } else if (e.key.toLowerCase() === "s") {
          updateTokenSize(token.id, -5);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isHeld, token.id, updateTokenSize]);
  return (
    <Group
      draggable
      x={token.x * scale + offset.x}
      y={token.y * scale + offset.y}
      onMouseDown={() => setIsHeld(true)}
      onMouseUp={() => setIsHeld(false)}
      onDragEnd={(e) => {
        const absPos = e.target.getAbsolutePosition();
        const newX = (absPos.x - offset.x) / scale;
        const newY = (absPos.y - offset.y) / scale;
        updateTokenPosition(token.id, { x: newX, y: newY });
      }}
      onContextMenu={(e) => {
        e.evt.preventDefault();
        if (onRightClick) onRightClick(token);
      }}
    >
      {image ? (
        <KonvaImage image={image} width={tokenSize} height={tokenSize} />
      ) : (
        <Group>
          <Circle
            x={tokenSize / 2}
            y={tokenSize / 2}
            radius={tokenSize / 2}
            fill="gray"
          />
          <Text
            text={token.label || ""}
            x={0}
            y={tokenSize / 4}
            width={tokenSize}
            align="center"
            fontSize={20}
            fontStyle="bold"
            fill="gold"
            shadowColor="black"
            shadowBlur={3}
            shadowOffsetX={1}
            shadowOffsetY={1}
          />
        </Group>
      )}
      {token.isPlayer ? (
        <>
          <Text
            text={`${token.name} (${token.hp}/${token.maxHP})`}
            x={0}
            y={tokenSize + 5}
            fontSize={14}
            fill="blue"
            fontStyle="bold"
            align="center"
            width={tokenSize}
            shadowColor="black"
            shadowBlur={3}
            shadowOffsetX={1}
            shadowOffsetY={1}
          />
          <Text
            text="-"
            x={0}
            y={tokenSize + 25}
            fontSize={14}
            fill="gold"
            fontStyle="bold"
            width={tokenSize / 2}
            align="center"
            onClick={() => updateTokenHP(token.id, -1)}
            style={{ cursor: "pointer" }}
            shadowColor="black"
            shadowBlur={3}
            shadowOffsetX={1}
            shadowOffsetY={1}
          />
          <Text
            text="+"
            x={tokenSize / 2}
            y={tokenSize + 25}
            fontSize={14}
            fill="gold"
            fontStyle="bold"
            width={tokenSize / 2}
            align="center"
            onClick={() => updateTokenHP(token.id, 1)}
            style={{ cursor: "pointer" }}
            shadowColor="black"
            shadowBlur={3}
            shadowOffsetX={1}
            shadowOffsetY={1}
          />
        </>
      ) : (
        <Text
          text={`${token.typeCount}`}
          x={tokenSize - 10}
          y={0}
          fontSize={14}
          fill="red"
          fontStyle="bold"
          shadowColor="black"
          shadowBlur={3}
          shadowOffsetX={1}
          shadowOffsetY={1}
        />
      )}
      <Group x={tokenSize} y={0}>
        <Text
          text="–"
          fontSize={14}
          fill="red"
          onClick={() => updateTokenSize(token.id, -5)}
          style={{ cursor: "pointer" }}
          shadowColor="black"
          shadowBlur={3}
          shadowOffsetX={1}
          shadowOffsetY={1}
        />
        <Text
          text="+"
          fontSize={14}
          fill="red"
          y={tokenSize / 2}
          onClick={() => updateTokenSize(token.id, 5)}
          style={{ cursor: "pointer" }}
          shadowColor="black"
          shadowBlur={3}
          shadowOffsetX={1}
          shadowOffsetY={1}
        />
      </Group>
      {token.statuses &&
        Object.keys(token.statuses)
          .filter((key) => token.statuses[key])
          .map((key, index) => (
            <Text
              key={key}
              text={conditionSymbols[key]?.symbol || ""}
              x={2 + index * 18}
              y={2}
              fontSize={18}
              fontStyle="bold"
              fill="gold"
              shadowColor="black"
              shadowBlur={3}
              shadowOffsetX={1}
              shadowOffsetY={1}
            />
          ))}
    </Group>
  );
};

/* DiceRoller – standard D&D dice with adjustable multipliers; roll history above the dice buttons. */
const diceRollerInitialMultipliers = {
  2: 1,
  4: 1,
  6: 1,
  8: 1,
  10: 1,
  12: 1,
  20: 1,
  100: 1,
};
const DiceRoller = () => {
  const diceList = [
    { label: "d2", sides: 2 },
    { label: "d4", sides: 4 },
    { label: "d6", sides: 6 },
    { label: "d8", sides: 8 },
    { label: "d10", sides: 10 },
    { label: "d12", sides: 12 },
    { label: "d20", sides: 20 },
    { label: "d100", sides: 100 },
  ];
  const [rollHistory, setRollHistory] = useState([]);
  const [diceMultipliers, setDiceMultipliers] = useState(
    diceRollerInitialMultipliers
  );
  const updateMultiplier = (sides, delta) => {
    setDiceMultipliers((prev) => {
      const newVal = Math.max(1, (prev[sides] || 1) + delta);
      return { ...prev, [sides]: newVal };
    });
  };
  const rollDice = (sides, count) => {
    let rolls = [];
    for (let i = 0; i < count; i++) {
      const roll = Math.floor(Math.random() * sides) + 1;
      rolls.push(roll);
    }
    const total = rolls.reduce((a, b) => a + b, 0);
    const timestamp = new Date().toLocaleTimeString();
    const rollEntry = `Rolled ${count}d${sides}: [${rolls.join(
      " + "
    )}] = ${total} at ${timestamp}`;
    setRollHistory((prev) => [...prev, rollEntry]);
  };
  const clearHistory = () => setRollHistory([]);
  return (
    <div style={diceRollerStyles.container}>
      <div style={diceRollerStyles.historyContainer}>
        <div style={diceRollerStyles.historyHeader}>
          <span style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.7)" }}>
            Roll History
          </span>
          <button onClick={clearHistory} style={diceRollerStyles.clearButton}>
            Clear
          </button>
        </div>
        <div style={diceRollerStyles.historyContent}>
          {rollHistory.map((entry, index) => (
            <div key={index}>{entry}</div>
          ))}
        </div>
      </div>
      <div style={diceRollerStyles.diceContainer}>
        {diceList.map((dice) => {
          const multiplier = diceMultipliers[dice.sides] || 1;
          return (
            <div key={dice.sides} style={diceRollerStyles.diceButtonWrapper}>
              <button
                onClick={() => updateMultiplier(dice.sides, -1)}
                style={diceRollerStyles.multiplierButton}
              >
                –
              </button>
              <button
                onClick={() => rollDice(dice.sides, multiplier)}
                style={diceRollerStyles.diceButton}
              >
                {multiplier}d{dice.sides}
              </button>
              <button
                onClick={() => updateMultiplier(dice.sides, 1)}
                style={diceRollerStyles.multiplierButton}
              >
                +
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const diceRollerStyles = {
  container: {
    position: "absolute",
    bottom: "10px",
    right: "10px",
    zIndex: 900,
    fontFamily: "'Cinzel', serif",
    border: "1px solid #b8860b",
    boxShadow: "0 0 10px #b8860b",
    padding: "5px",
    borderRadius: "4px",
    background: "rgba(0,0,0,0.8)",
  },
  diceContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    marginTop: "10px",
  },
  diceButtonWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
  },
  diceButton: {
    background: "rgba(0, 0, 0, 0.5)",
    border: "1px solid #b8860b",
    color: "gold",
    padding: "10px 18px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    outline: "none",
    boxShadow: "0 0 5px #b8860b",
    textShadow: "1px 1px 3px rgba(0,0,0,0.7)",
  },
  multiplierButton: {
    background: "rgba(0, 0, 0, 0.5)",
    border: "1px solid #b8860b",
    color: "gold",
    padding: "6px 10px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    outline: "none",
    boxShadow: "0 0 3px #b8860b",
    textShadow: "1px 1px 3px rgba(0,0,0,0.7)",
  },
  historyContainer: {
    background: "rgba(0, 0, 0, 0.7)",
    border: "1px solid #b8860b",
    borderRadius: "4px",
    maxHeight: "150px",
    width: "300px",
    overflowY: "auto",
    padding: "5px",
    boxShadow: "0 0 5px #b8860b",
  },
  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "5px",
    alignItems: "center",
  },
  clearButton: {
    background: "none",
    border: "none",
    color: "gold",
    cursor: "pointer",
    fontSize: "14px",
    textShadow: "1px 1px 3px rgba(0,0,0,0.7)",
  },
  historyContent: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "gold",
    textShadow: "1px 1px 3px rgba(0,0,0,0.7)",
  },
};

function App() {
  // Use a tighter scaling factor (clamped at 1) for UHD screens.
  const [buttonScale, setButtonScale] = useState(
    Math.min(window.innerWidth / 1920, 1)
  );
  useEffect(() => {
    const handleResize = () => {
      setButtonScale(Math.min(window.innerWidth / 1920, 1));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const tokensLayerRef = useRef(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [simPoints, setSimPoints] = useState(0);
  const [zoom, setZoom] = useState(100);
  const monsters = bestiaryData.creatures;
  const [selectedMap, setSelectedMap] = useState(availableMaps[0].url);
  const [tokens, setTokens] = useState([]);
  const [nextTokenId, setNextTokenId] = useState(1);
  const [monsterCounts, setMonsterCounts] = useState({});
  const [customBackground, setCustomBackground] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [modalToken, setModalToken] = useState(null);
  const [monsterModalToken, setMonsterModalToken] = useState(null);

  useEffect(() => {
    if (tokensLayerRef.current) {
      const anim = new Konva.Animation(() => {}, tokensLayerRef.current);
      anim.start();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          setZoom((prev) => prev * 1.2);
        } else if (e.key === "-") {
          e.preventDefault();
          setZoom((prev) => prev / 1.2);
        } else if (e.key === "0") {
          e.preventDefault();
          setZoom(100);
          setPanOffset({ x: 0, y: 0 });
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleArrowKeys = (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "ArrowUp") {
        setPanOffset((prev) => ({ ...prev, y: prev.y + 10 }));
      } else if (e.key === "ArrowDown") {
        setPanOffset((prev) => ({ ...prev, y: prev.y - 10 }));
      } else if (e.key === "ArrowLeft") {
        setPanOffset((prev) => ({ ...prev, x: prev.x + 10 }));
      } else if (e.key === "ArrowRight") {
        setPanOffset((prev) => ({ ...prev, x: prev.x - 10 }));
      }
      e.preventDefault();
    };
    document.addEventListener("keydown", handleArrowKeys);
    return () => document.removeEventListener("keydown", handleArrowKeys);
  }, []);

  const handleStageWheel = (e) => {
    if (e.evt.ctrlKey) {
      e.evt.preventDefault();
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      const oldZoom = zoom;
      let newZoom = zoom;
      if (e.evt.deltaY < 0) {
        newZoom = zoom * 1.2;
      } else if (e.evt.deltaY > 0) {
        newZoom = zoom / 1.2;
      }
      const mousePointTo = {
        x: (pointer.x - panOffset.x) / (oldZoom / 100),
        y: (pointer.y - panOffset.y) / (oldZoom / 100),
      };
      setPanOffset({
        x: pointer.x - mousePointTo.x * (newZoom / 100),
        y: pointer.y - mousePointTo.y * (newZoom / 100),
      });
      setZoom(newZoom);
    }
  };

  useEffect(() => {
    if (modalToken) {
      const updated = tokens.find((t) => t.id === modalToken.id);
      if (updated) setModalToken(updated);
    }
    if (monsterModalToken) {
      const updated = tokens.find((t) => t.id === monsterModalToken.id);
      if (updated) setMonsterModalToken(updated);
    }
  }, [tokens, modalToken, monsterModalToken]);

  const updateTokenField = (id, field, value) => {
    setTokens(
      tokens.map((token) =>
        token.id === id
          ? {
              ...token,
              [field]:
                field === "hp" || field === "maxHP" ? Number(value) : value,
            }
          : token
      )
    );
  };

  const updateTokenStatus = (id, key, value) => {
    setTokens(
      tokens.map((token) =>
        token.id === id
          ? { ...token, statuses: { ...token.statuses, [key]: value } }
          : token
      )
    );
  };

  const updateTokenImage = (id, image) => {
    setTokens(
      tokens.map((token) => (token.id === id ? { ...token, image } : token))
    );
  };

  const updateTokenFieldWrapper = (field, value) => {
    if (modalToken) updateTokenField(modalToken.id, field, value);
  };

  const addExtraPlayerToken = () => {
    const newToken = {
      id: nextTokenId,
      image: "",
      name: "New Player",
      hp: 10,
      maxHP: 10,
      x: 100,
      y: 100,
      isPlayer: true,
      size: 40,
      statuses: {},
    };
    setTokens([...tokens, newToken]);
    setNextTokenId(nextTokenId + 1);
  };

  const removePlayerTokens = () => {
    setTokens(tokens.filter((token) => !token.isPlayer));
  };

  const removeEnemyTokens = () => {
    setTokens(tokens.filter((token) => token.isPlayer));
  };

  const resetApp = () => {
    setSelectedMap(availableMaps[0].url);
    setCustomBackground("");
    setTokens([]);
    setMonsterCounts({});
    setNextTokenId(1);
    setZoom(100);
    setPanOffset({ x: 0, y: 0 });
    setModalToken(null);
    setMonsterModalToken(null);
  };

  const updateTokenPosition = (id, newPos) => {
    setTokens(
      tokens.map((token) =>
        token.id === id ? { ...token, x: newPos.x, y: newPos.y } : token
      )
    );
  };

  const updateTokenHP = (id, delta) => {
    setTokens(
      tokens.map((token) =>
        token.id === id
          ? { ...token, hp: Math.max(0, token.hp + delta) }
          : token
      )
    );
  };

  const updateTokenSize = (id, delta) => {
    setTokens(
      tokens.map((token) => {
        if (token.id === id) {
          const newSize = (token.size || 40) + delta;
          return { ...token, size: newSize < 20 ? 20 : newSize };
        }
        return token;
      })
    );
  };

  const addEnemyToken = (monster) => {
    const hasImage =
      monster.flavor.imageUrl && monster.flavor.imageUrl.trim() !== "";
    let type = monster.name;
    let currentCount = monsterCounts[type] || 0;
    currentCount++;
    setMonsterCounts({ ...monsterCounts, [type]: currentCount });
    const newToken = {
      id: nextTokenId,
      image: hasImage ? monster.flavor.imageUrl : "",
      typeCount: currentCount,
      name: monster.name,
      x: 100,
      y: 100,
      tokenType: type,
      size: 40,
      details: monster,
    };
    setTokens([...tokens, newToken]);
    setNextTokenId(nextTokenId + 1);
  };

  const uploadPlayerToken = (formId, file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const newToken = {
        id: nextTokenId,
        image: reader.result,
        name: "New Player",
        hp: 10,
        maxHP: 10,
        x: 100,
        y: 100,
        isPlayer: true,
        size: 40,
        statuses: {},
      };
      setTokens([...tokens, newToken]);
      setNextTokenId(nextTokenId + 1);
    };
    if (file) {
      reader.readAsDataURL(file);
    }
  };

  const handleTokenRightClick = (token) => {
    if (token.isPlayer) {
      setModalToken(token);
    } else {
      setMonsterModalToken(token);
    }
  };

  const removeTokenById = (id) => {
    setTokens(tokens.filter((token) => token.id !== id));
    setModalToken(null);
    setMonsterModalToken(null);
  };

  const saveGame = () => {
    const stateToSave = {
      tokens,
      panOffset,
      zoom,
      customBackground,
      selectedMap,
      monsterCounts,
    };
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(stateToSave));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "game_state.json");
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const loadGame = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";
    fileInput.onchange = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (data.tokens) setTokens(data.tokens);
          if (data.panOffset) setPanOffset(data.panOffset);
          if (data.zoom) setZoom(data.zoom);
          if (data.customBackground) setCustomBackground(data.customBackground);
          if (data.selectedMap) setSelectedMap(data.selectedMap);
          if (data.monsterCounts) setMonsterCounts(data.monsterCounts);
        } catch (error) {
          alert("Failed to load game data.");
        }
      };
      reader.readAsText(file);
    };
    fileInput.click();
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        boxSizing: "border-box",
        backgroundImage:
          'url("https://i.postimg.cc/WbrFcVxj/Designer-2025-03-22-T050835-772-upscayl-2x-digital-art-4x.png")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        border: "2px solid #b8860b",
        boxShadow: "0 0 10px #b8860b",
      }}
    >
      <TopDrawer
        isOpen={drawerOpen}
        onToggle={() => setDrawerOpen(!drawerOpen)}
        scale={buttonScale}
      />
      <SimPointsDrawer
        simPoints={simPoints}
        setSimPoints={setSimPoints}
        scale={buttonScale}
      />
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onWheel={handleStageWheel}
        style={{ border: "none" }}
      >
        <Layer ref={tokensLayerRef}>
          <MapLayer
            mapUrl={customBackground || selectedMap}
            tokens={tokens}
            zoom={zoom}
            panOffset={panOffset}
            updateTokenPosition={updateTokenPosition}
            updateTokenHP={updateTokenHP}
            updateTokenSize={updateTokenSize}
            onRightClickToken={handleTokenRightClick}
          />
        </Layer>
      </Stage>
      <div
        style={{
          position: "absolute",
          top: drawerOpen ? `${170 * buttonScale}px` : `${10 * buttonScale}px`,
          right: `${10 * buttonScale}px`,
          zIndex: 1100,
          display: "flex",
          flexDirection: "column",
          gap: `${5 * buttonScale}px`,
        }}
      >
        <FancyButton
          onClick={() => setShowSidebar(!showSidebar)}
          style={{ width: `${150 * buttonScale}px` }}
        >
          {showSidebar ? "Close Menu" : "Open Menu"}
        </FancyButton>
        <FancyButton
          onClick={() => setZoom(zoom * 1.2)}
          style={{ width: `${150 * buttonScale}px` }}
        >
          Zoom In
        </FancyButton>
        <FancyButton
          onClick={() => setZoom(zoom / 1.2)}
          style={{ width: `${150 * buttonScale}px` }}
        >
          Zoom Out
        </FancyButton>
        <FancyButton
          onClick={() => {
            setZoom(100);
            setPanOffset({ x: 0, y: 0 });
          }}
          style={{ width: `${150 * buttonScale}px` }}
        >
          Reset Zoom
        </FancyButton>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(3, ${50 * buttonScale}px)`,
            gap: `${5 * buttonScale}px`,
            justifyContent: "center",
            marginTop: `${10 * buttonScale}px`,
          }}
        >
          <div></div>
          <FancyButton
            onClick={() =>
              setPanOffset((prev) => ({ ...prev, y: prev.y - 10 }))
            }
            style={{
              width: `${50 * buttonScale}px`,
              height: `${50 * buttonScale}px`,
              padding: "0",
            }}
          >
            ↑
          </FancyButton>
          <div></div>
          <FancyButton
            onClick={() =>
              setPanOffset((prev) => ({ ...prev, x: prev.x - 10 }))
            }
            style={{
              width: `${50 * buttonScale}px`,
              height: `${50 * buttonScale}px`,
              padding: "0",
            }}
          >
            ←
          </FancyButton>
          <FancyButton
            onClick={() =>
              setPanOffset((prev) => ({ ...prev, y: prev.y + 10 }))
            }
            style={{
              width: `${50 * buttonScale}px`,
              height: `${50 * buttonScale}px`,
              padding: "0",
            }}
          >
            ↓
          </FancyButton>
          <FancyButton
            onClick={() =>
              setPanOffset((prev) => ({ ...prev, x: prev.x + 10 }))
            }
            style={{
              width: `${50 * buttonScale}px`,
              height: `${50 * buttonScale}px`,
              padding: "0",
            }}
          >
            →
          </FancyButton>
        </div>
      </div>
      {showSidebar && (
        <Sidebar
          addExtraPlayerToken={addExtraPlayerToken}
          removePlayerTokens={removePlayerTokens}
          showMapSelector={showMapSelector}
          setShowMapSelector={setShowMapSelector}
          setSelectedMap={setSelectedMap}
          customBackground={customBackground}
          setCustomBackground={setCustomBackground}
          monsters={monsters}
          addEnemyToken={addEnemyToken}
          removeEnemyTokens={removeEnemyTokens}
          resetApp={resetApp}
          uploadPlayerToken={uploadPlayerToken}
          saveGame={saveGame}
          loadGame={loadGame}
        />
      )}
      {modalToken && (
        <ModalWindow
          token={modalToken}
          onClose={() => setModalToken(null)}
          onUpdateStatus={(key, value) =>
            updateTokenStatus(modalToken.id, key, value)
          }
          onUpdateField={updateTokenFieldWrapper}
          onUpdateImage={(value) => updateTokenImage(modalToken.id, value)}
          onRemove={(id) => removeTokenById(id)}
        />
      )}
      {monsterModalToken && (
        <MonsterModal
          token={monsterModalToken}
          onClose={() => setMonsterModalToken(null)}
          onRemove={(id) => removeTokenById(id)}
        />
      )}
      <DiceRoller />
    </div>
  );
}

export default App;
