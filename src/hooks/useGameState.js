import { useState } from 'react';
import { availableMaps } from '../constants/gameData';

export const useGameState = () => {
  const [tokens, setTokens] = useState([]);
  const [nextTokenId, setNextTokenId] = useState(1);
  const [monsterCounts, setMonsterCounts] = useState({});
  const [selectedMap, setSelectedMap] = useState(availableMaps[0].url);
  const [customBackground, setCustomBackground] = useState("");
  const [zoom, setZoom] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // ...rest of the code from App.js gameState functions...
  
  return {
    tokens,
    setTokens,
    nextTokenId,
    setNextTokenId,
    monsterCounts,
    setMonsterCounts,
    selectedMap,
    setSelectedMap,
    customBackground,
    setCustomBackground,
    zoom,
    setZoom,
    panOffset,
    setPanOffset
  };
};
