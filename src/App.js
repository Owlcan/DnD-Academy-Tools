import React, { useState, useRef, useEffect, Suspense, lazy, useCallback } from "react";
import { Stage, Layer } from "react-konva";
import bestiaryData from "./bestiary.json";
import WeatherEffects from './components/WeatherEffects';
import FancyButton from './components/buttons/FancyButton';
import TopDrawer from './components/drawers/TopDrawer';
import SimPointsDrawer from './components/drawers/SimPointsDrawer';
import ModalMonster from './components/modals/ModalMonster';
import { availableMaps as baseMaps, monsterImageMappingManual, weatherOptions, defaultPlayerTokens } from './constants';
import MapLayer from './components/map/MapLayer';
import { preloadImage } from './utils/imageLoader';
import Sidebar from './components/Sidebar';
import ModalWindow from './components/modals/ModalWindow';
import DiceRoller from './components/DiceRoller';
import BottomMapDrawer from './components/drawers/BottomMapDrawer';
import backgroundImage from './assets/images/background.png';
import { tokenAspectRatios } from './constants/tokenDimensions';
import { initializeBestiary } from './dungeonModule/debug';
import { renderDungeonToDataUrl } from './utils/dungeonImage';
// import { useDungeonTestApp } from './dungeonModule/debugIntegration';
// Lazy-load heavier components (must be after imports for lint rule compliance)
const MusicPlayer = lazy(() => import('./components/MusicPlayer'));
const EncounterComponent = lazy(() => import('./encounterModule/EncounterComponent'));
const StaticDungeonGenerator = lazy(() => import('./components/StaticDungeonGenerator'));

function App() {
  // Add new state for grid control
  const [gridSize, setGridSize] = useState(0); // 0 = off, 25 = 25x25, 50 = 50x50
  const [gridCols, setGridCols] = useState(0); // custom grid: number of squares across (horizontal)
  const [gridRows, setGridRows] = useState(0); // custom grid: number of squares down (vertical)

  // Add state for background loading
  const [bgLoaded, setBgLoaded] = useState(false);
  const [bgError, setBgError] = useState(false);

  // Dungeon test app is currently disabled

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
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [simPoints, setSimPoints] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [tokens, setTokens] = useState([]);
  const [nextTokenId, setNextTokenId] = useState(1);
  const [monsterCounts, setMonsterCounts] = useState({});
  const [dynamicMaps, setDynamicMaps] = useState([]);
  const allMaps = React.useMemo(() => {
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
  // Helper: choose a preferred "Scholia Forest" style map when available
  const pickPreferredMap = React.useCallback((arr) => {
    if (!Array.isArray(arr)) return null;
    const str = (v) => (typeof v === 'string' ? v.toLowerCase() : '');
    const isMatch = (m) => (str(m?.name).includes('scholia') && str(m?.name).includes('forest')) ||
                         (str(m?.url).includes('scholia') && str(m?.url).includes('forest'));
    const isFallback = (m) => str(m?.name).includes('scholia') || str(m?.url).includes('scholia');
    return arr.find(isMatch) || arr.find(isFallback) || null;
  }, []);
  // Default map preference: choose a Scholia Forest map from dynamic manifest when available
  const [selectedMap, setSelectedMap] = useState('');
  const [customBackground, setCustomBackground] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const [modalToken, setModalToken] = useState(null);
  const [monsterModalToken, setMonsterModalToken] = useState(null);
  const [activeWeatherEffects, setActiveWeatherEffects] = useState([]);
  const [weatherMenuOpen, setWeatherMenuOpen] = useState(false);
  const [showMapDrawer, setShowMapDrawer] = useState(false);
  const [musicPlayerPos, setMusicPlayerPos] = useState({ x: 20, y: window.innerHeight - 300 });
  const [encounterData, setEncounterData] = useState(null);
  const [dungeonData, setDungeonData] = useState(null);
  const [lastEncounterTag, setLastEncounterTag] = useState(null);
  const [prevMapBackup, setPrevMapBackup] = useState({ url: null, custom: null });
  const [measureMode, setMeasureMode] = useState(false);
  const [dicePos, setDicePos] = useState({ x: 20, y: 20 });
  const [diceCollapsed, setDiceCollapsed] = useState(true);
  const [musicCollapsed, setMusicCollapsed] = useState(true); // start collapsed
  const [pointsCollapsed, setPointsCollapsed] = useState(true); // start collapsed
  const [showStaticGen, setShowStaticGen] = useState(true);
  const [snapTokensToGrid, setSnapTokensToGrid] = useState(false);
  // Spawn point management
  const [spawnPoint, setSpawnPoint] = useState(null); // map coords
  const [spawnIndex, setSpawnIndex] = useState(0); // cycles around spawn
  const [settingSpawn, setSettingSpawn] = useState(false);
  // Middle-mouse panning state
  const mmbPanRef = useRef({ active: false, start: { x: 0, y: 0 }, panStart: { x: 0, y: 0 } });
  const [isMmbPanning, setIsMmbPanning] = useState(false);

  const tokensLayerRef = useRef(null);
  const wheelThrottleRef = useRef(0);
  const ZOOM_MIN = 40;   // percent
  const ZOOM_MAX = 400;  // percent
  const WHEEL_THROTTLE_MS = 16; // ~60fps
  const monsters = bestiaryData.creatures || [];
  console.log('Loading bestiary data:', monsters.length, 'monsters found');

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

  const recenterWindows = useCallback(() => {
    // Recenter music player
    setMusicPlayerPos(keepInViewport(
      { x: 20, y: window.innerHeight - 300 },
      520,
      100
    ));
  // Recenter Dice Roller
  setDicePos(keepInViewport({ x: 20, y: 20 }, 360, 280));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      setButtonScale(Math.min(window.innerWidth / 1920, 1));
      // Keep floating windows in view
      recenterWindows();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [recenterWindows]);

  const toggleWeatherEffect = (effectId) => {
    setActiveWeatherEffects(prev => 
      prev.includes(effectId) 
        ? prev.filter(id => id !== effectId)
        : [...prev, effectId]
    );
  };

  // Removed always-on Konva animation to save CPU

  const resetZoomAndCenter = useCallback(() => {
    setZoom(100);
    setPanOffset({
      x: viewport.width * 0.35,
      y: viewport.height * 0.1
    });
  }, [viewport.width, viewport.height]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = (e.target && e.target.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || e.target?.isContentEditable;
      if (!typing && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        setMeasureMode((m) => !m);
        return;
      }
      if (e.ctrlKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          setZoom((prev) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev * 1.2)));
        } else if (e.key === "-") {
          e.preventDefault();
          setZoom((prev) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev / 1.2)));
        } else if (e.key === "0") {
          e.preventDefault();
          resetZoomAndCenter();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [resetZoomAndCenter]);

  useEffect(() => {
    const handleArrowKeys = (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "ArrowUp") {
        setPanOffset((prev) => ({ ...prev, y: prev.y - 10 }));
      } else if (e.key === "ArrowDown") {
        setPanOffset((prev) => ({ ...prev, y: prev.y + 10 }));
      } else if (e.key === "ArrowLeft") {
        setPanOffset((prev) => ({ ...prev, x: prev.x - 10 }));
      } else if (e.key === "ArrowRight") {
        setPanOffset((prev) => ({ ...prev, x: prev.x + 10 }));
      }
      e.preventDefault();
    };
    document.addEventListener("keydown", handleArrowKeys);
    return () => document.removeEventListener("keydown", handleArrowKeys);
  }, []);

  const clamp = (val, min, max) => Math.min(max, Math.max(min, val));

  const handleStageWheel = (e) => {
    if (!e.evt.ctrlKey) return;

    const now = performance.now();
    if (now - wheelThrottleRef.current < WHEEL_THROTTLE_MS) return;
    wheelThrottleRef.current = now;

    e.evt.preventDefault();

    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    const oldZoom = zoom;

    // Compute next zoom and clamp
    const zoomFactor = e.evt.deltaY < 0 ? 1.2 : 1 / 1.2;
    const candidate = oldZoom * zoomFactor;
    const newZoom = clamp(candidate, ZOOM_MIN, ZOOM_MAX);

    // Keep pointer under mouse
    const mousePointTo = {
      x: (pointer.x - panOffset.x) / (oldZoom / 100),
      y: (pointer.y - panOffset.y) / (oldZoom / 100),
    };
    setPanOffset({
      x: pointer.x - mousePointTo.x * (newZoom / 100),
      y: pointer.y - mousePointTo.y * (newZoom / 100),
    });
    setZoom(newZoom);
  };

  // Middle mouse button (MMB) drag-to-pan
  const endMmbPan = React.useCallback(() => {
    if (!mmbPanRef.current.active) return;
    mmbPanRef.current.active = false;
    setIsMmbPanning(false);
  }, []);

  const handleStageMouseDown = (e) => {
    // 0=left, 1=middle, 2=right
    if (e.evt && e.evt.button === 1) {
      // Prevent browser auto-scroll behavior on MMB
      e.evt.preventDefault();
      const stage = e.target.getStage();
      const ptr = stage.getPointerPosition();
      if (!ptr) return;
      mmbPanRef.current.active = true;
      mmbPanRef.current.start = { x: ptr.x, y: ptr.y };
      mmbPanRef.current.panStart = { x: panOffset.x, y: panOffset.y };
      setIsMmbPanning(true);
      // Ensure we end pan even if mouseup happens outside the stage
      const upListener = () => {
        endMmbPan();
        window.removeEventListener('mouseup', upListener);
      };
      window.addEventListener('mouseup', upListener);
    }
  };

  const handleStageMouseMove = (e) => {
    if (!mmbPanRef.current.active) return;
    if (e.evt) e.evt.preventDefault();
    const stage = e.target.getStage();
    const ptr = stage.getPointerPosition();
    if (!ptr) return;
    const dx = ptr.x - mmbPanRef.current.start.x;
    const dy = ptr.y - mmbPanRef.current.start.y;
    setPanOffset({
      x: mmbPanRef.current.panStart.x + dx,
      y: mmbPanRef.current.panStart.y + dy,
    });
  };

  const handleStageMouseUp = (e) => {
    if (e.evt && e.evt.button === 1) {
      e.evt.preventDefault();
      endMmbPan();
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
    setTokens(prev =>
      prev.map(token =>
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

  const getNextSpawnPoint = () => {
    // If a user-defined spawn exists, place tokens around it in clockwise steps
    if (spawnPoint && Number.isFinite(spawnPoint.x) && Number.isFinite(spawnPoint.y)) {
      const i = spawnIndex;
      const step = i % 8; // 8 directions (0..7)
      const ring = Math.floor(i / 8) + 1;
      const baseRadius = Math.max(30, gridSize > 0 ? gridSize : 40);
      const radius = baseRadius * ring;
      const angleDeg = step * 45; // start east (0deg), then clockwise
      const rad = (Math.PI / 180) * angleDeg;
      const pt = {
        x: spawnPoint.x + Math.cos(rad) * radius,
        y: spawnPoint.y + Math.sin(rad) * radius,
      };
      setSpawnIndex(i + 1);
      return pt;
    }
    // Fallback: spawn near current view center
    const centerX = (window.innerWidth / 2) - panOffset.x;
    const centerY = (window.innerHeight / 2) - panOffset.y;
    const radius = 100 * (zoom / 100);
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * radius;
    return { x: centerX + (r * Math.cos(angle)), y: centerY + (r * Math.sin(angle)) };
  };

  // If snapping is enabled and a fixed grid size is set, snap to nearest cell center
  const maybeSnapToGridCenter = (pt) => {
    if (!snapTokensToGrid) return pt;
    if (gridSize && gridSize > 0) {
      const gx = Math.floor(pt.x / gridSize) + 0.5;
      const gy = Math.floor(pt.y / gridSize) + 0.5;
      return { x: gx * gridSize, y: gy * gridSize };
    }
    return pt;
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
  let spawn = getNextSpawnPoint();
    spawn = maybeSnapToGridCenter(spawn);
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
  x: spawn.x,
  y: spawn.y,
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
    setTokens(prev => prev.filter(token => !token.isPlayer));
  };

  const removeEnemyTokens = () => {
    setTokens(prev => prev.filter(token => token.isPlayer));
  };

  const resetApp = () => {
    // Prefer a Scholia Forest map on reset as well
    const preferred = pickPreferredMap(dynamicMaps.length ? dynamicMaps : allMaps);
    setSelectedMap(preferred?.url || '');
    setCustomBackground("");
    setTokens([]);
    setMonsterCounts({});
    setNextTokenId(1);
  setGridSize(0);
  setGridCols(0);
  setGridRows(0);
    setZoom(100);
    setPanOffset({ x: 0, y: 0 });
    setModalToken(null);
    setMonsterModalToken(null);
  };

  const updateTokenPosition = (id, newPos) => {
    setTokens(prev =>
      prev.map(token =>
        token.id === id ? { ...token, x: newPos.x, y: newPos.y } : token
      )
    );
  };

  const updateTokenHP = (id, delta) => {
    setTokens(prev =>
      prev.map(token =>
        token.id === id
          ? { ...token, hp: Math.max(0, token.hp + delta) }
          : token
      )
    );
  };

  const updateTokenSize = (id, delta) => {
    setTokens(prev =>
      prev.map(token => {
        if (token.id !== id) return token;
        const newSize = (token.size || 40) + delta;
        return { ...token, size: newSize < 20 ? 20 : newSize };
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

  let spawn = getNextSpawnPoint();
    spawn = maybeSnapToGridCenter(spawn);
    const hasImage = monster.flavor?.imageUrl && monster.flavor.imageUrl.trim() !== "";
    const imageUrl = hasImage ? monster.flavor.imageUrl : monsterImageMappingManual[monster.name] || "";
    
    if (!imageUrl) {
      console.warn('No image URL found for monster:', monster.name);
    }

    console.log('Adding enemy token:', {
      name: monster.name,
      hasImage,
      imageUrl,
  spawnPoint: spawn
    });

    const newToken = {
      id: nextTokenId,
      image: imageUrl,
      typeCount: (monsterCounts[monster.name] || 0) + 1,
      name: monster.name,
  x: spawn.x,
  y: spawn.y,
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
      let spawn = getNextSpawnPoint();
      spawn = maybeSnapToGridCenter(spawn);
      const newToken = {
        id: nextTokenId,
        image: event.target.result,
        name: "New Player",
        hp: 10,
        maxHP: 10,
        x: spawn.x,
        y: spawn.y,
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

  // Add special vector-based tokens (flags, markers, arenaball)
  const addSpecialToken = (specialType) => {
    const spawn = getNextSpawnPoint();
    const nameMap = {
      'yellow-flag': 'Flag',
      'down-marker': 'Down',
      'arenaball': 'Arenaball'
    };
    const newToken = {
      id: nextTokenId,
      specialType,
      name: nameMap[specialType] || 'Token',
      x: spawn.x,
      y: spawn.y,
      size: 25,
      forceSquare: true
    };
    setTokens(prev => [...prev, newToken]);
    setNextTokenId(prev => prev + 1);
  };

  const handleTokenRightClick = (token) => {
    if (token.isPlayer) {
      setModalToken(token);
    } else {
      setMonsterModalToken(token);
    }
  };

  const removeTokenById = (id) => {
    setTokens(prev => prev.filter(token => token.id !== id));
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
  drawerOpen,                  // Added drawer state
  snapTokensToGrid             // Added snap-to-grid setting
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
          if (typeof data.snapTokensToGrid === 'boolean') setSnapTokensToGrid(data.snapTokensToGrid);
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
    // Load dynamic maps manifest and set a preferred default map
    fetch('/assets/maps/manifest.json', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data && Array.isArray(data.maps)) {
          setDynamicMaps(data.maps);

          // If no map is selected yet or it's still the original base default, prefer a Scholia Forest map
          const isDefaultBaseSelected = selectedMap && selectedMap === (baseMaps[0]?.url || '');
          if (!selectedMap || isDefaultBaseSelected) {
            const preferred = pickPreferredMap(data.maps);
            if (preferred && preferred.url) {
              setSelectedMap(preferred.url);
            }
          }
        }
      })
      .catch(() => void 0);
  // Preload all base map images
  baseMaps.forEach(map => {
      preloadImage(map.url);
      preloadImage(map.thumb);
    });

    // Preload all monster images
    Object.values(monsterImageMappingManual).forEach(url => {
      preloadImage(url);
    });
  }, []);

  

  const handleMusicPlayerDrag = (e) => {
    if (!e.clientX || !e.clientY) return; // Prevent invalid coordinates
    
    setMusicPlayerPos(keepInViewport(
      { x: e.clientX, y: e.clientY },
      520,
      100
    ));
  };

  const handleEncounterGenerated = (encounter) => {
    // We only want a static map image from the working generation logic.
    // 1) Back up current map state
    setPrevMapBackup({ url: selectedMap, custom: customBackground || null });

    // 2) Render dungeon to a PNG data URL
    try {
      const dataUrl = renderDungeonToDataUrl(encounter, { cellSize: 25, drawGrid: true });
      setCustomBackground(dataUrl); // override map to generated image
      setSelectedMap('');
    } catch (e) {
      console.error('Failed to render dungeon image:', e);
    }

    // 3) Adjust grid and center view
    setGridSize(25);
    if (encounter && encounter.width && encounter.height) {
      const g = 25;
      const encounterCenter = {
        x: (encounter.width * g) / 2,
        y: (encounter.height * g) / 2
      };
      setPanOffset({
        x: viewport.width / 2 - encounterCenter.x * (zoom / 100),
        y: viewport.height / 2 - encounterCenter.y * (zoom / 100)
      });
    }

    // 4) Clear any previous encounter tokens/overlay data
    setEncounterData(encounter);
    setDungeonData(null);
    setLastEncounterTag(null);
    setTokens(prev => prev.filter(t => !t.encounterTag));
  };

  const handleEncounterCleared = () => {
    setEncounterData(null);
    setDungeonData(null);
    // Restore previous map background
    if (prevMapBackup.url || prevMapBackup.custom) {
      if (prevMapBackup.custom) {
        setCustomBackground(prevMapBackup.custom);
        setSelectedMap('');
      } else if (prevMapBackup.url) {
        setSelectedMap(prevMapBackup.url);
        setCustomBackground('');
      }
    }
    setTokens(prev => prev.filter(t => !t.encounterTag));
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

  {/* Top center controls (Help, Weather, Recenter, Dungeon) */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2000,
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        padding: '6px 10px',
        background: 'rgba(0,0,0,0.4)',
        borderRadius: '8px'
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
          onClick={() => setShowStaticGen(s => !s)}
          style={{ width: "220px" }}
        >
          {showStaticGen ? 'Hide Dungeon Generator' : 'Show Dungeon Generator'}
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
                onClick={() => { setGridSize(0); setGridCols(0); setGridRows(0); }}
                style={{
                  opacity: gridSize === 0 ? 1 : 0.6,
                  fontSize: '14px',
                  margin: '2px'
                }}
              >
                No Grid
              </FancyButton>
              <FancyButton
                onClick={() => { setGridSize(15); setGridCols(0); setGridRows(0); }}
                style={{
                  opacity: gridSize === 15 ? 1 : 0.6,
                  fontSize: '14px',
                  margin: '2px'
                }}
              >
                15x25 Grid
              </FancyButton>
              <FancyButton
                onClick={() => { setGridSize(50); setGridCols(0); setGridRows(0); }}
                style={{
                  opacity: gridSize === 50 ? 1 : 0.6,
                  fontSize: '14px',
                  margin: '2px'
                }}
              >
                25x25 Grid
              </FancyButton>
              <FancyButton
                onClick={() => { setGridSize(30); setGridCols(0); setGridRows(0); }}
                style={{
                  opacity: gridSize === 30 ? 1 : 0.6,
                  fontSize: '14px',
                  margin: '2px'
                }}
              >
                30x50 Grid
              </FancyButton>
              <FancyButton
                onClick={() => { setGridSize(25); setGridCols(0); setGridRows(0); }}
                style={{
                  opacity: gridSize === 25 ? 1 : 0.6,
                  fontSize: '14px',
                  margin: '2px'
                }}
              >
                50x50 Grid
              </FancyButton>
              {/* Adaptive presets */}
              <FancyButton
                onClick={() => { setGridSize(Math.round((viewport.width + viewport.height) / 2 / 40)); setGridCols(0); setGridRows(0); }}
                style={{
                  opacity: false,
                  fontSize: '14px',
                  margin: '2px'
                }}
              >
                Fit (Dense)
              </FancyButton>
              <FancyButton
                onClick={() => { setGridSize(Math.round((viewport.width + viewport.height) / 2 / 30)); setGridCols(0); setGridRows(0); }}
                style={{
                  opacity: false,
                  fontSize: '14px',
                  margin: '2px'
                }}
              >
                Fit (Coarse)
              </FancyButton>
              {/* Custom grid by counts */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ color: '#b8860b', fontSize: 14 }}>Columns (across):
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={gridCols}
                    onChange={(e) => setGridCols(Math.max(0, parseInt(e.target.value || '0', 10)))}
                    style={{ width: 80, marginLeft: 6, background: 'rgba(0,0,0,0.3)', color: 'gold', border: '1px solid #b8860b', borderRadius: 4, padding: '2px 6px' }}
                  />
                </label>
                <label style={{ color: '#b8860b', fontSize: 14 }}>Rows (down):
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={gridRows}
                    onChange={(e) => setGridRows(Math.max(0, parseInt(e.target.value || '0', 10)))}
                    style={{ width: 80, marginLeft: 6, background: 'rgba(0,0,0,0.3)', color: 'gold', border: '1px solid #b8860b', borderRadius: 4, padding: '2px 6px' }}
                  />
                </label>
                <FancyButton
                  onClick={() => { if (gridCols === 0 || gridRows === 0) { /* keep as-is */ }}}
                  style={{ fontSize: '14px' }}
                >
                  Apply (auto)
                </FancyButton>
                {(gridCols > 0 || gridRows > 0) && (
                  <FancyButton
                    onClick={() => { setGridCols(0); setGridRows(0); }}
                    style={{ fontSize: '14px', opacity: 0.9 }}
                  >
                    Clear Custom Counts
                  </FancyButton>
                )}
              </div>
              {/* Active grid mode indicator */}
              <div style={{ color: 'gold', fontSize: 12, marginTop: 4 }}>
                {gridSize > 0 ? `Cell size: ${gridSize}px` : (gridCols > 0 || gridRows > 0) ? `Custom grid: ${gridCols || '?'} x ${gridRows || '?'}` : 'Grid off'}
              </div>
              <div style={{ width: '100%', display: 'flex', gap: '8px', alignItems: 'center', marginTop: 6 }}>
                <FancyButton
                  onClick={() => setSnapTokensToGrid(s => !s)}
                  style={{ fontSize: '14px', opacity: snapTokensToGrid ? 1 : 0.8 }}
                >
                  {snapTokensToGrid ? 'Snap tokens to grid: ON' : 'Snap tokens to grid: OFF'}
                </FancyButton>
              </div>
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
  collapsed={pointsCollapsed}
  onToggle={() => setPointsCollapsed(c => !c)}
      />

      <WeatherEffects activeEffects={activeWeatherEffects} />
      <Stage
        width={viewport.width}
        height={viewport.height}
        onWheel={handleStageWheel}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        style={{ border: "none", cursor: isMmbPanning ? 'grabbing' : 'default' }}
      >
        <Layer ref={tokensLayerRef}>
          <MapLayer
            mapUrl={customBackground || selectedMap}
            tokens={tokens}
            zoom={zoom}
            panOffset={panOffset}
            gridSize={gridSize}
            gridCols={gridCols}
            gridRows={gridRows}
            dungeon={null}
            measureMode={measureMode}
            spawnPoint={spawnPoint}
            settingSpawn={settingSpawn}
            onSetSpawn={(pt) => { setSpawnPoint(pt); setSettingSpawn(false); setSpawnIndex(0); }}
            snapTokensToGrid={snapTokensToGrid}
            updateTokenPosition={updateTokenPosition}
            updateTokenHP={updateTokenHP}
            updateTokenSize={updateTokenSize}
            onRightClickToken={handleTokenRightClick}
          />
        </Layer>
      </Stage>
    <div
        style={{
      position: "fixed",
      top: `${10 * buttonScale}px`,
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
          onClick={() => setZoom(prev => clamp(prev * 1.2, ZOOM_MIN, ZOOM_MAX))}
          style={{ width: `${150 * buttonScale}px` }}
        >
          Zoom In
        </FancyButton>
        <FancyButton
          onClick={() => setZoom(prev => clamp(prev / 1.2, ZOOM_MIN, ZOOM_MAX))}
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
          onClick={() => setMeasureMode(prev => !prev)}
          style={{ width: `${150 * buttonScale}px` }}
        >
          {measureMode ? 'Exit Measure (M)' : 'Measure (M)'}
        </FancyButton>
        <FancyButton
          onClick={() => setSettingSpawn(s => !s)}
          style={{ width: `${150 * buttonScale}px`, opacity: settingSpawn ? 1 : 0.9 }}
        >
          {settingSpawn ? 'Click Map: Set Spawn' : 'Set Token Spawn'}
        </FancyButton>
        <FancyButton
          onClick={() => setShowMapDrawer(!showMapDrawer)}
          style={{ width: `${150 * buttonScale}px` }}
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
          addSpecialToken={addSpecialToken}
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
      <Suspense fallback={null}>
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
          <div style={{ marginBottom: '6px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <FancyButton onClick={() => setMusicCollapsed(c => !c)} style={{ padding: musicCollapsed ? '8px 12px' : '2px 8px', fontSize: musicCollapsed ? '14px' : '12px' }}>
              {musicCollapsed ? 'Expand' : 'Collapse'}
            </FancyButton>
          </div>
          {!musicCollapsed && <MusicPlayer style={{ width: '420px' }} />}
        </div>

        {showStaticGen && (
          <StaticDungeonGenerator
            onApplyMap={(dataUrl, dungeon, opts) => {
              // backup current
              setPrevMapBackup({ url: selectedMap, custom: customBackground || null });
              // apply
              setCustomBackground(dataUrl);
              setSelectedMap('');
              const g = Math.max(10, Number(opts?.cellSize) || 25);
              setGridSize(g);
              if (dungeon?.width && dungeon?.height) {
                const center = { x: (dungeon.width * g) / 2, y: (dungeon.height * g) / 2 };
                setPanOffset({
                  x: viewport.width / 2 - center.x * (zoom / 100),
                  y: viewport.height / 2 - center.y * (zoom / 100)
                });
              }
              // Optionally place real tokens at generated monster positions
              if (opts?.placeTokens && Array.isArray(dungeon?.entities)) {
                // Prefer full monsters from bestiary
                const bestiary = (bestiaryData && Array.isArray(bestiaryData.creatures)) ? bestiaryData.creatures : [];
                const localTokens = [
                  '/assets/monster.tokens/darkaconda.png',
                  '/assets/monster.tokens/darkforme-hungore.png',
                  '/assets/monster.tokens/darkforme-nightpinyon.png',
                  '/assets/monster.tokens/darkforme-ossokin-aegisite.png',
                  '/assets/monster.tokens/darkforme-ossuarian.png',
                  '/assets/monster.tokens/darkforme-suffocator.png',
                  '/assets/monster.tokens/darkling-hooter.png',
                  '/assets/monster.tokens/darkling-hungerer.png',
                  '/assets/monster.tokens/darkling-ossokin-proselyte.png',
                  '/assets/monster.tokens/darkling-ossokin.png',
                  '/assets/monster.tokens/darkling-ossuite-charger.png',
                  '/assets/monster.tokens/darkling-paralurker.png',
                  '/assets/monster.tokens/darkling-slitherscale.png',
                  '/assets/monster.tokens/sky-darkener-nightveil.png',
                  '/assets/monster.tokens/weirdling-paralurker.png'
                ];
                const randPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
                const pickMonster = () => (bestiary.length ? randPick(bestiary) : null);
                const mkImage = (monster) => {
                  if (!monster) return randPick(localTokens) || '';
                  const hasImage = monster.flavor?.imageUrl && monster.flavor.imageUrl.trim() !== '';
                  return hasImage ? monster.flavor.imageUrl : (monsterImageMappingManual[monster.name] || randPick(localTokens) || '');
                };
                const newTokens = [];
                const localCounts = {};
                dungeon.entities.filter(ent => ent.type === 'monster').forEach((ent, idx) => {
                  const m = pickMonster();
                  const name = m?.name || 'Monster';
                  localCounts[name] = (localCounts[name] || 0) + 1;
                  newTokens.push({
                    id: nextTokenId + idx,
                    image: mkImage(m),
                    name,
                    typeCount: localCounts[name],
                    x: ent.x * g + g / 2,
                    y: ent.y * g + g / 2,
                    tokenType: name,
                    size: m?.stats?.size ? getTokenSizeForCreature(m.stats.size) : 25,
                    details: m || undefined,
                    forceSquare: false
                  });
                });
                if (newTokens.length) {
                  setTokens(prev => [...prev, ...newTokens]);
                  setNextTokenId(prev => prev + newTokens.length);
                }
              }
            }}
            onRestore={() => {
              if (prevMapBackup.custom) {
                setCustomBackground(prevMapBackup.custom);
                setSelectedMap('');
              } else if (prevMapBackup.url) {
                setSelectedMap(prevMapBackup.url);
                setCustomBackground('');
              }
            }}
          />
        )}
      </Suspense>
      
      {/* Movable, collapsible Dice Roller */}
      <div
        onMouseDown={(e) => {
          const target = e.currentTarget;
          if (e.target.closest('button') || e.target.closest('input')) return;
          const startX = e.clientX - dicePos.x;
          const startY = e.clientY - dicePos.y;
          const onMove = (ev) => setDicePos({ x: ev.clientX - startX, y: ev.clientY - startY });
          const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
          };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        }}
        style={{ position: 'fixed', left: `${dicePos.x}px`, top: `${dicePos.y}px`, zIndex: 1100, cursor: 'move' }}
      >
        <div style={{ marginBottom: '6px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <FancyButton onClick={() => setDiceCollapsed(c => !c)} style={{ padding: diceCollapsed ? '8px 12px' : '2px 8px', fontSize: diceCollapsed ? '14px' : '12px' }}>
            {diceCollapsed ? 'Open Dice' : 'Close Dice'}
          </FancyButton>
        </div>
        {!diceCollapsed && (
          <div style={{ transform: 'scale(0.85)', transformOrigin: 'top left' }}>
            <DiceRoller />
          </div>
        )}
      </div>
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
