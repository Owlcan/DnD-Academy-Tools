import React, { useState, useRef, useEffect } from "react";
import Konva from "konva";
import { Stage, Layer } from "react-konva";
import bestiaryData from "./bestiary.json";
import WeatherEffects from './components/WeatherEffects';
import MusicPlayer from './components/MusicPlayer';
import FancyButton from './components/buttons/FancyButton';
import TopDrawer from './components/drawers/TopDrawer';
import SimPointsDrawer from './components/drawers/SimPointsDrawer';
import ModalMonster from './components/modals/ModalMonster';
import { availableMaps, monsterImageMappingManual, weatherOptions, defaultPlayerTokens } from './constants';
import MapLayer from './components/map/MapLayer';
import { preloadImage } from './utils/imageLoader';
import Sidebar from './components/Sidebar';
import ModalWindow from './components/modals/ModalWindow';
import DiceRoller from './components/DiceRoller';
import BottomMapDrawer from './components/drawers/BottomMapDrawer';
import backgroundImage from './assets/images/background.png';
import { tokenAspectRatios } from './constants/tokenDimensions';
import DungeonTestApp from './dungeonModule/TestApp';
import { initializeBestiary } from './dungeonModule/debug';
import { useDungeonTestApp, DungeonDebugButton } from './dungeonModule/debugIntegration';

function App() {
  // Add new state for grid control
  const [gridSize, setGridSize] = useState(0); // 0 = off, 25 = 25x25, 50 = 50x50

  // Add state for background loading
  const [bgLoaded, setBgLoaded] = useState(false);
  const [bgError, setBgError] = useState(false);

  // Use the dungeon test app hook
  const { openDungeonTestApp } = useDungeonTestApp();

  // Initialize bestiary data for dungeon generator
  useEffect(() => {
    if (bestiaryData?.creatures) {
      console.log('Initializing bestiary data for dungeon generator');
      initializeBestiary(bestiaryData);
    }
  }, []);

  // Update the background loading effect to properly clear errors
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setBgLoaded(true);
      setBgError(false); // Clear any previous errors when load succeeds
    };
    img.onerror = () => {
      setBgLoaded(false);
      setBgError(true);
    };
    img.src = backgroundImage;

    // Cleanup on unmount
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, []);

  // Keep original state management
  const [buttonScale, setButtonScale] = useState(Math.min(window.innerWidth / 1920, 1));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [simPoints, setSimPoints] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [tokens, setTokens] = useState([]);
  const [nextTokenId, setNextTokenId] = useState(1);
  const [monsterCounts, setMonsterCounts] = useState({});
  const [selectedMap, setSelectedMap] = useState(availableMaps[0].url);
  const [customBackground, setCustomBackground] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [modalToken, setModalToken] = useState(null);
  const [monsterModalToken, setMonsterModalToken] = useState(null);
  const [activeWeatherEffects, setActiveWeatherEffects] = useState([]);
  const [weatherMenuOpen, setWeatherMenuOpen] = useState(false);
  const [showMapDrawer, setShowMapDrawer] = useState(false);
  const [musicPlayerPos, setMusicPlayerPos] = useState({ x: 20, y: window.innerHeight - 300 });

  const tokensLayerRef = useRef(null);
  const monsters = bestiaryData.creatures || [];
  console.log('Loading bestiary data:', monsters.length, 'monsters found');

  useEffect(() => {
    const handleResize = () => {
      setButtonScale(Math.min(window.innerWidth / 1920, 1));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleWeatherEffect = (effectId) => {
    setActiveWeatherEffects(prev => 
      prev.includes(effectId) 
        ? prev.filter(id => id !== effectId)
        : [...prev, effectId]
    );
  };

  useEffect(() => {
    if (tokensLayerRef.current) {
      const anim = new Konva.Animation(() => {}, tokensLayerRef.current);
      anim.start();
    }
  }, []);

  const resetZoomAndCenter = () => {
    setZoom(100);
    setPanOffset({
      x: window.innerWidth * 0.35,  // Changed from 0.5 to 0.35 (moved 15% left)
      y: window.innerHeight * 0.1   // Move down by 10% of window height
    });
  };

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
          resetZoomAndCenter();
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
    setTokens(prevTokens => {
      const updatedTokens = prevTokens.map(token => {
        if (token.id === id) {
          // Create new token with updated field
          const updatedToken = {
            ...token,
            [field]: field === "hp" || field === "maxHP" ? Number(value) : value
          };
          console.log('Updating token:', id, field, value, updatedToken);
          return updatedToken;
        }
        return token;
      });
      return updatedTokens;
    });
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
    console.log('Updating token image:', { id, image });
    if (!image) {
      console.error('No image provided for token update');
      return;
    }
    setTokens(prevTokens => {
      const updatedTokens = prevTokens.map(token => {
        if (token.id === id) {
          console.log('Found token to update:', token.id);
          return { ...token, image };
        }
        return token;
      });
      console.log('Updated tokens:', updatedTokens);
      return updatedTokens;
    });
  };

  const updateTokenFieldWrapper = (field, value) => {
    if (modalToken) updateTokenField(modalToken.id, field, value);
  };

  const getRandomSpawnPoint = () => {
    // Get map center position accounting for pan offset and zoom
    const centerX = (window.innerWidth / 2) - panOffset.x;
    const centerY = (window.innerHeight / 2) - panOffset.y;
    
    // Calculate spawn radius scaled by zoom
    const radius = 100 * (zoom / 100);
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * radius;
    
    return {
      x: centerX + (r * Math.cos(angle)),
      y: centerY + (r * Math.sin(angle))
    };
  };

  const getRandomTokenPath = () => {
    // Debug log the defaultPlayerTokens
    console.log('Available tokens:', defaultPlayerTokens);
    
    const gender = Math.random() > 0.5 ? 'femme' : 'masc';
    const category = defaultPlayerTokens[gender];
    if (!category) {
      console.error('Invalid gender category:', gender);
      return '';
    }
  
    const tokenType = category[Math.floor(Math.random() * category.length)];
    if (!tokenType) {
      console.error('Could not select token type from category:', category);
      return '';
    }
  
    const tokenIndex = Math.floor(Math.random() * tokenType.count) + 1;
    // Fixed path formatting to include parentheses
    const path = `/assets/images/player.tokens/${tokenType.type} (${gender === 'femme' ? 'F' : 'M'}) (${tokenIndex}).png`;
    console.log('Selected token path:', path);
    return path;
  };

  const addExtraPlayerToken = () => {
    const spawnPoint = getRandomSpawnPoint();
    const tokenPath = getRandomTokenPath();
    const fileName = tokenPath.split('/').pop(); // Get filename from path
    const aspectRatio = tokenAspectRatios[fileName] || 0.8; // Default to 0.8 if not found
    
    console.log('Creating new player token with image:', tokenPath);
    console.log('Using aspect ratio:', aspectRatio);
  
    const newToken = {
      id: nextTokenId,
      image: tokenPath,
      name: `Player ${nextTokenId}`,
      hp: 10,
      maxHP: 10,
      x: spawnPoint.x,
      y: spawnPoint.y,
      isPlayer: true,
      size: 25,
      aspectRatio,
      forceSquare: false,
      statuses: {},
      characterData: {} // Initialize empty character data object
    };
  
    // Update state in correct order
    setTokens(prev => [...prev, newToken]);
    setNextTokenId(prev => prev + 1);
    
    // Debug log the new token
    console.log('Added new player token:', newToken);
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

  const getTokenSizeForCreature = (size) => {
    switch (size.toLowerCase()) {
      case 'tiny': return 15;      // 60% of medium
      case 'small': return 20;     // 80% of medium
      case 'medium': return 25;    // New base size
      case 'large': return 45;     // ~1.8x medium, 10% reduced
      case 'huge': return 75;      // 3x medium, 20% reduced
      case 'gargantuan': return 100; // 4x medium
      default: return 25;          // Default medium size
    }
  };

  const addEnemyToken = (monster) => {
    if (!monster) {
      console.error('No monster data provided to addEnemyToken');
      return;
    }

    const spawnPoint = getRandomSpawnPoint();
    const hasImage = monster.flavor?.imageUrl && monster.flavor.imageUrl.trim() !== "";
    const imageUrl = hasImage ? monster.flavor.imageUrl : monsterImageMappingManual[monster.name] || "";
    
    if (!imageUrl) {
      console.warn('No image URL found for monster:', monster.name);
    }

    console.log('Adding enemy token:', {
      name: monster.name,
      hasImage,
      imageUrl,
      spawnPoint
    });

    const newToken = {
      id: nextTokenId,
      image: imageUrl,
      typeCount: (monsterCounts[monster.name] || 0) + 1,
      name: monster.name,
      x: spawnPoint.x,
      y: spawnPoint.y,
      tokenType: monster.name,
      size: getTokenSizeForCreature(monster.stats.size),
      details: monster,
      forceSquare: false,
    };

    setMonsterCounts(prev => ({ ...prev, [monster.name]: newToken.typeCount }));
    setTokens(prev => [...prev, newToken]);
    setNextTokenId(prev => prev + 1);
  };

  const uploadPlayerToken = (formId, file) => {
    if (!file) {
      console.error('No file provided for upload');
      return;
    }

    console.log('Uploading file:', file.name); // Debug log
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const newToken = {
        id: nextTokenId,
        image: event.target.result,
        name: "New Player",
        hp: 10,
        maxHP: 10,
        x: 100,
        y: 100,
        isPlayer: true,
        size: 25,
        aspectRatio: 1.1,
        forceSquare: false, 
        statuses: {},
        characterData: {} // Initialize empty character data object
      };
      
      setTokens(prev => [...prev, newToken]);
      setNextTokenId(prev => prev + 1);
    };

    reader.onerror = (error) => {
      console.error('Error reading file:', error);
    };
    
    reader.readAsDataURL(file);
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
      simPoints,                   // Added sim points
      activeWeatherEffects,        // Added weather effects
      weatherMenuOpen,             // Added weather menu state
      drawerOpen                   // Added drawer state
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
          if (data.simPoints) setSimPoints(data.simPoints);                     // Added
          if (data.activeWeatherEffects) setActiveWeatherEffects(data.activeWeatherEffects); // Added
          if (data.weatherMenuOpen) setWeatherMenuOpen(data.weatherMenuOpen);   // Added
          if (data.drawerOpen) setDrawerOpen(data.drawerOpen);                 // Added
        } catch (error) {
          alert("Failed to load game data.");
        }
      };
      reader.readAsText(file);
    };
    fileInput.click();
  };

  const handleCustomMapUpload = (dataUrl) => {
    setCustomBackground(dataUrl);
    setShowMapDrawer(false);
  };

  useEffect(() => {
    // Preload all map images
    availableMaps.forEach(map => {
      preloadImage(map.url);
      preloadImage(map.thumb);
    });

    // Preload all monster images
    Object.values(monsterImageMappingManual).forEach(url => {
      preloadImage(url);
    });
  }, []);

  const keepInViewport = (pos, width, height) => {
    const bounds = {
      left: 0,
      right: window.innerWidth - width,
      top: 0,
      bottom: window.innerHeight - height
    };
    
    return {
      x: Math.min(Math.max(pos.x, bounds.left), bounds.right),
      y: Math.min(Math.max(pos.y, bounds.top), bounds.bottom)
    };
  };

  const recenterWindows = () => {
    // Recenter music player
    setMusicPlayerPos(keepInViewport(
      { x: 20, y: window.innerHeight - 300 },
      520,
      100
    ));
  };

  const handleMusicPlayerDrag = (e) => {
    if (!e.clientX || !e.clientY) return; // Prevent invalid coordinates
    
    setMusicPlayerPos(keepInViewport(
      { x: e.clientX, y: e.clientY },
      520,
      100
    ));
  };

  return (
    <div style={{
      position: "relative",
      width: "100vw",
      height: "100vh",
      boxSizing: "border-box",
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundColor: "rgba(0,0,0,0.85)", // Fallback color while loading
      border: "2px solid #b8860b",
      boxShadow: "0 0 10px #b8860b",
      opacity: bgLoaded ? 1 : 0.7,
      transition: "opacity 0.3s ease-in"
    }}>
      {bgError && !bgLoaded && ( // Only show error if loading failed and hasn't succeeded
        <div style={{
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#ff6b6b',
          background: 'rgba(0,0,0,0.8)',
          padding: '5px 10px',
          borderRadius: '4px',
          zIndex: 9999
        }}>
          Background image failed to load
        </div>
      )}

      {/* Add weather menu button next to help button */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2000,
        display: 'flex',
        gap: '10px'
      }}>
        <FancyButton
          onClick={() => setWeatherMenuOpen(!weatherMenuOpen)}
          style={{ width: "200px" }}
        >
          {weatherMenuOpen ? "Close Controls" : "Weather & Map Controls"}
        </FancyButton>
        <FancyButton
          onClick={() => setDrawerOpen(!drawerOpen)}
          style={{ width: "200px" }}
        >
          {drawerOpen ? "Close Help & Notes" : "Open Help & Notes"}
        </FancyButton>
        <FancyButton
          onClick={recenterWindows}
          style={{ width: "200px" }}
        >
          Recenter Windows
        </FancyButton>
        <FancyButton
          onClick={openDungeonTestApp}
          style={{ width: "200px" }}
        >
          Test Dungeons
        </FancyButton>
      </div>

      {/* Add weather menu */}
      {weatherMenuOpen && (
        <div style={{
          position: 'absolute',
          top: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1900,
          background: 'rgba(0,0,0,0.85)',
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid #b8860b',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          maxWidth: '600px'
        }}>
          <div style={{ 
            borderBottom: '1px solid #b8860b',
            marginBottom: '10px',
            paddingBottom: '10px',
            width: '100%'
          }}>
            <h3 style={{ color: '#b8860b', margin: '0 0 10px 0' }}>Grid Overlay</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <FancyButton
                onClick={() => setGridSize(0)}
                style={{
                  opacity: gridSize === 0 ? 1 : 0.6,
                  fontSize: '14px',
                  margin: '2px'
                }}
              >
                No Grid
              </FancyButton>
              <FancyButton
                onClick={() => setGridSize(15)}
                style={{
                  opacity: gridSize === 15 ? 1 : 0.6,
                  fontSize: '14px',
                  margin: '2px'
                }}
              >
                15x25 Grid
              </FancyButton>
              <FancyButton
                onClick={() => setGridSize(50)}
                style={{
                  opacity: gridSize === 50 ? 1 : 0.6,
                  fontSize: '14px',
                  margin: '2px'
                }}
              >
                25x25 Grid
              </FancyButton>
              <FancyButton
                onClick={() => setGridSize(30)}
                style={{
                  opacity: gridSize === 30 ? 1 : 0.6,
                  fontSize: '14px',
                  margin: '2px'
                }}
              >
                30x50 Grid
              </FancyButton>
              <FancyButton
                onClick={() => setGridSize(25)}
                style={{
                  opacity: gridSize === 25 ? 1 : 0.6,
                  fontSize: '14px',
                  margin: '2px'
                }}
              >
                50x50 Grid
              </FancyButton>
            </div>
          </div>
          
          <div>
            <h3 style={{ color: '#b8860b', margin: '0 0 10px 0' }}>Weather Effects</h3>
            {weatherOptions.map(option => (
              <FancyButton
                key={option.id}
                onClick={() => toggleWeatherEffect(option.id)}
                style={{
                  opacity: activeWeatherEffects.includes(option.id) ? 1 : 0.6,
                  fontSize: '14px'
                }}
              >
                {option.label}
              </FancyButton>
            ))}
          </div>
        </div>
      )}

      <TopDrawer
        isOpen={drawerOpen}
        onToggle={() => setDrawerOpen(!drawerOpen)}
        scale={buttonScale}
      />
      
      <SimPointsDrawer 
        simPoints={simPoints}
        setSimPoints={setSimPoints}
      />

      <WeatherEffects activeEffects={activeWeatherEffects} />
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
            gridSize={gridSize}
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
          onClick={resetZoomAndCenter}
          style={{ width: `${150 * buttonScale}px` }}
        >
          Reset Zoom
        </FancyButton>
        <FancyButton
          onClick={() => setShowMapDrawer(!showMapDrawer)}
          style={{
            position: "fixed",
            bottom: "380px", // Position it above the music player
            right: "20px",
            width: "150px",
            zIndex: 1100,
          }}
        >
          {showMapDrawer ? "Close Maps" : "Select Map"}
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
        <ModalMonster
          token={monsterModalToken}
          onClose={() => setMonsterModalToken(null)}
          onRemove={(id) => removeTokenById(id)}
          onCollectXP={(xp) => setSimPoints(prev => prev + xp)}
        />
      )}
      <div
        draggable
        onDrag={handleMusicPlayerDrag}
        onDragEnd={(e) => handleMusicPlayerDrag(e)}
        style={{ 
          position: 'fixed',
          right: `${musicPlayerPos.x}px`,
          top: `${musicPlayerPos.y}px`,
          zIndex: 1000,
          cursor: 'move',
          userSelect: 'none'
        }}
      >
        <MusicPlayer style={{ 
          width: '520px'
        }} />
      </div>
      
      <DiceRoller style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 1000,
        width: '520px'
      }} />
      <BottomMapDrawer
        isOpen={showMapDrawer}
        onClose={() => setShowMapDrawer(false)}
        onSelectMap={(url) => {
          setSelectedMap(url);
          setCustomBackground("");
          setShowMapDrawer(false);
        }}
        onCustomMapUpload={handleCustomMapUpload}
      />
    </div>
  );
}

export default App;
