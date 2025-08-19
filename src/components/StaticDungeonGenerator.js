import React, { useMemo, useState } from 'react';
import FancyButton from './buttons/FancyButton';
import { renderDungeonToDataUrl } from '../utils/dungeonImage';

// Tiny, self-contained dungeon generator supporting rooms, arena, and cavern with features.
function generateSimpleDungeon({ width, height, roomCount, monsterCount, seed, mode = 'rooms', opts = {} }) {
  const grid = Array.from({ length: height }, () => Array.from({ length: width }, () => 0));

  // Seeded RNG (mulberry32)
  let s = seed || Math.floor(Math.random() * 1_000_000);
  const rand = () => {
    let t = (s += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rInt = (min, max) => Math.floor(rand() * (max - min)) + min; // [min, max)

  const rooms = [];
  const corridors = [];
  const entities = [];
  const hazards = { grid: Array.from({ length: height }, () => Array.from({ length: width }, () => 0)) };
  const elevation = opts.enableElevation ? Array.from({ length: height }, () => Array.from({ length: width }, () => 0)) : null;
  const features = { walls: [], halfWalls: [], platforms: [], landPolys: [], bridges: [], debris: [], props: [], ladders: [] };

  const carveRoom = (r) => {
    for (let y = r.y; y < r.y + r.height; y++) {
      for (let x = r.x; x < r.x + r.width; x++) {
        if (x >= 0 && y >= 0 && x < width && y < height) grid[y][x] = 1;
      }
    }
  };

  const lCorridor = (a, b) => {
    const hFirst = rand() > 0.5;
    if (hFirst) {
      for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++) grid[a.y][x] = 2;
      for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) grid[y][b.x] = 2;
    } else {
      for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) grid[y][a.x] = 2;
      for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++) grid[b.y][x] = 2;
    }
    corridors.push({ startX: a.x, startY: a.y, endX: b.x, endY: b.y, width: 1 });
  };

  const rectsOverlap = (r1, r2, pad = 1) => {
    return !(
      r1.x + r1.width + pad <= r2.x ||
      r2.x + r2.width + pad <= r1.x ||
      r1.y + r1.height + pad <= r2.y ||
      r2.y + r2.height + pad <= r1.y
    );
  };

  const carveRoomsMode = () => {
    // First room near center
    const baseW = Math.max(4, Math.min(10, Math.floor(width * 0.35)));
    const baseH = Math.max(4, Math.min(10, Math.floor(height * 0.35)));
    const r1 = {
      x: Math.max(1, Math.floor((width - baseW) / 2)),
      y: Math.max(1, Math.floor((height - baseH) / 2)),
      width: Math.min(width - 2, baseW),
      height: Math.min(height - 2, baseH)
    };
    r1.center = { x: Math.floor(r1.x + r1.width / 2), y: Math.floor(r1.y + r1.height / 2) };
    rooms.push(r1);
    carveRoom(r1);

  // Additional rooms
  const targetRooms = Math.max(1, Math.floor(roomCount));
  const pattern = opts.roomPattern || 'random'; // random | grid | ring | cross
    const maxTries = targetRooms * 20;
    let tries = 0;
    while (rooms.length < targetRooms && tries < maxTries) {
      tries++;
      const rw = rInt(4, Math.max(5, Math.min(12, Math.floor(width / 2))));
      const rh = rInt(4, Math.max(5, Math.min(12, Math.floor(height / 2))));
      let rx, ry;
      if (pattern === 'grid') {
        const cols = Math.ceil(Math.sqrt(targetRooms));
        const rows = Math.ceil(targetRooms / cols);
        const cx = rooms.length % cols;
        const cy = Math.floor(rooms.length / cols);
        const cellW = Math.floor(width / (cols + 1));
        const cellH = Math.floor(height / (rows + 1));
        rx = Math.max(1, cx * cellW + rInt(1, Math.max(2, cellW - rw - 1)));
        ry = Math.max(1, cy * cellH + rInt(1, Math.max(2, cellH - rh - 1)));
      } else if (pattern === 'ring') {
        const cx = Math.floor(width / 2), cy = Math.floor(height / 2);
        const radius = Math.min(width, height) * 0.3;
        const ang = (rooms.length / targetRooms) * Math.PI * 2 + rand() * 0.2;
        rx = Math.floor(cx + Math.cos(ang) * radius - rw / 2);
        ry = Math.floor(cy + Math.sin(ang) * radius - rh / 2);
      } else if (pattern === 'cross') {
        const cx = Math.floor(width / 2), cy = Math.floor(height / 2);
        if (rooms.length % 2 === 0) {
          rx = rInt(1, Math.max(2, width - rw - 1));
          ry = cy - Math.floor(rh / 2);
        } else {
          rx = cx - Math.floor(rw / 2);
          ry = rInt(1, Math.max(2, height - rh - 1));
        }
      } else {
        rx = rInt(1, Math.max(2, width - rw - 1));
        ry = rInt(1, Math.max(2, height - rh - 1));
      }
      const r = { x: rx, y: ry, width: rw, height: rh };
      if (rooms.every(existing => !rectsOverlap(existing, r, 1))) {
        r.center = { x: Math.floor(r.x + r.width / 2), y: Math.floor(r.y + r.height / 2) };
        rooms.push(r);
        carveRoom(r);
        // Connect to the closest existing room center
        let best = rooms[0];
        let bestDist = Infinity;
        for (let i = 0; i < rooms.length - 1; i++) {
          const rr = rooms[i];
          const dx = rr.center.x - r.center.x;
          const dy = rr.center.y - r.center.y;
          const d = dx * dx + dy * dy;
          if (d < bestDist) { bestDist = d; best = rr; }
        }
        lCorridor(best.center, r.center);
      }
    }
  };

  const carveArenaMode = () => {
    const pad = 2;
    const rw = Math.max(6, width - pad * 2);
    const rh = Math.max(6, height - pad * 2);
    const r = { x: pad, y: pad, width: rw, height: rh };
    r.center = { x: Math.floor(r.x + r.width / 2), y: Math.floor(r.y + r.height / 2) };
    rooms.push(r);
    carveRoom(r);
  };

  const carveCavernMode = () => {
    // Cellular automata caverns
    const prob = opts.cavernFill || 0.45;
    // seed init
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        grid[y][x] = rand() < prob ? 0 : 1; // 1=floor, 0=wall initially inverted for smoothing
      }
    }
    const countNeighbors = (x, y) => {
      let c = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx, ny = y + dy;
          if (nx <= 0 || ny <= 0 || nx >= width - 1 || ny >= height - 1) { c++; continue; }
          if (grid[ny][nx] === 0) c++;
        }
      }
      return c;
    };
    const steps = 4;
    for (let sI = 0; sI < steps; sI++) {
      const next = grid.map(row => row.slice());
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const n = countNeighbors(x, y);
          next[y][x] = n > 4 ? 0 : 1; // more walls stay walls; less become floor
        }
      }
      for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) grid[y][x] = next[y][x];
    }
    // Invert so that 1=floor not wall for renderer
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) grid[y][x] = grid[y][x] === 1 ? 1 : 0;
  };

  if (mode === 'arena') carveArenaMode();
  else if (mode === 'cavern') carveCavernMode();
  else carveRoomsMode();

  // Basic structures/features generation
  const floorCells = [];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (grid[y][x] === 1) floorCells.push({ x, y });

  // Aquatic base map: set baseline water on all floor tiles
  if (opts.mapType === 'shallow' || opts.mapType === 'deep') {
    const waterCode = opts.mapType === 'shallow' ? 4 : 1;
    for (let i = 0; i < floorCells.length; i++) {
      const { x, y } = floorCells[i];
      hazards.grid[y][x] = waterCode;
    }
  }

  // Hazards placement (water=1, shallow=4, lava=2, pit=3, mud=5, bramble=6, sand=7, ice=8, thin-ice=9)
  const hazardEnabled = (opts.hazards && (opts.hazards.water || opts.hazards.shallow || opts.hazards.lava || opts.hazards.pit || opts.hazards.mud || opts.hazards.bramble));
  const hazardDensity = Math.max(0, Math.min(0.9, opts.hazardDensity || 0));
  const cluster = Math.max(0, Math.min(1, opts.hazardCluster == null ? 0.5 : opts.hazardCluster));
  if (hazardEnabled && floorCells.length) {
    const allTypes = [];
    const waterTypes = [];
    const nonWaterTypes = [];
    if (opts.hazards.water) { allTypes.push(1); waterTypes.push(1); }
    if (opts.hazards.shallow) { allTypes.push(4); waterTypes.push(4); }
    if (opts.hazards.lava) { allTypes.push(2); nonWaterTypes.push(2); }
    if (opts.hazards.pit) { allTypes.push(3); nonWaterTypes.push(3); }
    if (opts.hazards.mud) { allTypes.push(5); nonWaterTypes.push(5); }
    if (opts.hazards.bramble) { allTypes.push(6); nonWaterTypes.push(6); }
    if (opts.hazards.sand) { allTypes.push(7); nonWaterTypes.push(7); }
    if (opts.hazards.ice) { allTypes.push(8); nonWaterTypes.push(8); }
    if (opts.hazards.thinIce) { allTypes.push(9); nonWaterTypes.push(9); }

    // Place non-water hazards using clustered sprinkle
    if (nonWaterTypes.length && hazardDensity > 0) {
      const target = Math.floor(floorCells.length * hazardDensity * 0.6);
      const centers = [];
      const centerCount = Math.max(1, Math.floor(1 + cluster * 5));
      for (let i = 0; i < centerCount; i++) centers.push(floorCells[Math.floor(rand() * floorCells.length)]);
      for (let i = 0; i < target; i++) {
        const useCenter = rand() < cluster && centers.length > 0;
        const base = useCenter ? centers[Math.floor(rand() * centers.length)] : floorCells[Math.floor(rand() * floorCells.length)];
        const jitterX = useCenter ? Math.floor(rand() * 3) - 1 : 0;
        const jitterY = useCenter ? Math.floor(rand() * 3) - 1 : 0;
        const nx = Math.max(1, Math.min(width - 2, base.x + jitterX));
        const ny = Math.max(1, Math.min(height - 2, base.y + jitterY));
        if (!hazards.grid[ny][nx]) hazards.grid[ny][nx] = nonWaterTypes[Math.floor(rand() * nonWaterTypes.length)];
      }
    }

  // Water-specific forms
    if (waterTypes.length) {
      const pickWater = () => waterTypes[Math.floor(rand() * waterTypes.length)];
      const waterForm = opts.waterForm || 'pools';
      if (waterForm === 'submerged' && rooms.length) {
        // Fill entire rooms based on density proportion
        const roomCount = Math.max(1, Math.floor(rooms.length * Math.min(1, Math.max(0.15, hazardDensity * 1.5))));
        const shuffled = rooms.slice().sort(() => rand() - 0.5);
        for (let i = 0; i < roomCount; i++) {
          const r = shuffled[i];
          for (let y = r.y; y < r.y + r.height; y++) {
            for (let x = r.x; x < r.x + r.width; x++) {
              if (grid[y][x] === 1 || grid[y][x] === 2) hazards.grid[y][x] = pickWater();
            }
          }
        }
      } else if (waterForm === 'partial' && rooms.length) {
        // Fill a half/portion of selected rooms
        const roomCount = Math.max(1, Math.floor(rooms.length * Math.min(1, Math.max(0.2, hazardDensity))));
        const shuffled = rooms.slice().sort(() => rand() - 0.5);
        for (let i = 0; i < roomCount; i++) {
          const r = shuffled[i];
          const vertical = rand() < 0.5;
          if (vertical) {
            const split = r.x + Math.floor(r.width * (0.3 + rand() * 0.4));
            for (let y = r.y; y < r.y + r.height; y++) {
              for (let x = r.x; x < split; x++) if (grid[y][x] === 1 || grid[y][x] === 2) hazards.grid[y][x] = pickWater();
            }
          } else {
            const split = r.y + Math.floor(r.height * (0.3 + rand() * 0.4));
            for (let y = r.y; y < split; y++) {
              for (let x = r.x; x < r.x + r.width; x++) if (grid[y][x] === 1 || grid[y][x] === 2) hazards.grid[y][x] = pickWater();
            }
          }
        }
      } else if (waterForm === 'puddles') {
        // Many small scattered puddles
        const patches = Math.max(5, Math.floor(floorCells.length * Math.min(0.02, hazardDensity * 0.05)));
        for (let i = 0; i < patches; i++) {
          const c = floorCells[Math.floor(rand() * floorCells.length)];
          const blob = 2 + Math.floor(rand() * 5);
          for (let b = 0; b < blob; b++) {
            const nx = Math.max(1, Math.min(width - 2, c.x + Math.floor(rand() * 3) - 1));
            const ny = Math.max(1, Math.min(height - 2, c.y + Math.floor(rand() * 3) - 1));
            if (!hazards.grid[ny][nx]) hazards.grid[ny][nx] = pickWater();
          }
        }
      } else {
        // pools: clustered sprinkling
        const target = Math.floor(floorCells.length * hazardDensity);
        const centers = [];
        const centerCount = Math.max(1, Math.floor(1 + cluster * 6));
        for (let i = 0; i < centerCount; i++) centers.push(floorCells[Math.floor(rand() * floorCells.length)]);
        for (let i = 0; i < target; i++) {
          const useCenter = rand() < (0.6 + cluster * 0.4) && centers.length > 0;
          const base = useCenter ? centers[Math.floor(rand() * centers.length)] : floorCells[Math.floor(rand() * floorCells.length)];
          const jitterX = useCenter ? Math.floor(rand() * 5) - 2 : 0;
          const jitterY = useCenter ? Math.floor(rand() * 5) - 2 : 0;
          const nx = Math.max(1, Math.min(width - 2, base.x + jitterX));
          const ny = Math.max(1, Math.min(height - 2, base.y + jitterY));
          hazards.grid[ny][nx] = pickWater();
        }
      }
    }
  }

  // Ice to water boundary logic: if ice present, convert 1-cell ring around water to thin ice
  if (opts.hazards && (opts.hazards.ice || opts.hazards.thinIce)) {
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (hazards.grid[y][x] === 8) continue; // solid ice stays
        // thin ice near water/shallow
        if (!hazards.grid[y][x]) {
          const neigh = [
            hazards.grid[y - 1][x], hazards.grid[y + 1][x], hazards.grid[y][x - 1], hazards.grid[y][x + 1],
            hazards.grid[y - 1][x - 1], hazards.grid[y - 1][x + 1], hazards.grid[y + 1][x - 1], hazards.grid[y + 1][x + 1]
          ];
          if (neigh.some(h => h === 1 || h === 4)) hazards.grid[y][x] = 9;
        }
      }
    }
  }

  // Elevation variance on floors (independent of platforms)
  if (elevation) {
    const maxLvl = Math.max(0, Math.floor(opts.elevMax || 0));
    const freq = Math.max(0.01, Math.min(1, opts.elevFreq || 0.2));
    if (maxLvl > 0) {
      // Simple value noise via random centers with falloff
      const centers = [];
      const centerCount = Math.max(1, Math.floor((width * height) * freq * 0.02));
      for (let i = 0; i < centerCount; i++) centers.push({ x: rInt(1, width - 1), y: rInt(1, height - 1), v: Math.floor(rand() * (maxLvl + 1)) });
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (grid[y][x] !== 1 && grid[y][x] !== 2) continue;
          // nearest center weighted value
          let best = null, bestD = Infinity;
          for (let c of centers) {
            const dx = c.x - x, dy = c.y - y; const d = dx * dx + dy * dy;
            if (d < bestD) { bestD = d; best = c; }
          }
          const dist = Math.sqrt(bestD) || 1;
          const val = Math.max(0, Math.floor(best.v - dist * 0.1));
          elevation[y][x] = Math.max(0, Math.min(maxLvl, val));
        }
      }
      // Place ladders connecting elevation changes
      const laddersToPlace = Math.max(0, Math.floor(opts.ladderCount || 0));
      const allowed = {
        5: !!opts.ladder5,
        10: !!opts.ladder10,
        15: !!opts.ladder15
      };
      const heights = [5, 10, 15].filter(h => allowed[h]);
      for (let i = 0; i < laddersToPlace; i++) {
        if (!heights.length) break;
        const a = floorCells[Math.floor(rand() * floorCells.length)];
        if (!a) break;
        const dirs = [ [1,0],[-1,0],[0,1],[0,-1] ];
        const dir = dirs[Math.floor(rand() * dirs.length)];
        const bx = Math.max(1, Math.min(width - 2, a.x + dir[0] * rInt(1, 4)));
        const by = Math.max(1, Math.min(height - 2, a.y + dir[1] * rInt(1, 4)));
        const elevA = elevation[a.y][a.x] || 0;
        const elevB = elevation[by][bx] || 0;
        if (elevA === elevB) continue;
        const delta = Math.abs(elevA - elevB) * 5; // 5ft per level
        const target = heights[Math.floor(rand() * heights.length)];
        // accept ladder if target roughly matches delta (within 5ft)
        if (Math.abs(delta - target) <= 5) {
          features.ladders.push({ x1: a.x, y1: a.y, x2: bx, y2: by, lengthFt: target });
        }
      }
    }
  }

  // Land generation: platforms (rects) or landPolys (rock/island)
  const platformCount = Math.max(0, Math.floor(opts.platforms || 0));
  const platType = opts.platformGenType || 'platform'; // 'platform' | 'rock' | 'island'
  if (platType === 'platform') {
    for (let i = 0; i < platformCount; i++) {
      const minW = Math.max(1, opts.platformMin || 2);
      const maxW = Math.max(minW + 1, opts.platformMax || 6);
      const w = rInt(minW, Math.min(maxW, Math.floor(width / 2)));
      const h = rInt(minW, Math.min(maxW, Math.floor(height / 2)));
      let x = rInt(1, Math.max(2, width - w - 1));
      let y = rInt(1, Math.max(2, height - h - 1));
      // patterning
      if (opts.platformPattern && opts.platformPattern !== 'random') {
        const cx = Math.floor(width / 2), cy = Math.floor(height / 2);
        if (opts.platformPattern === 'ring') {
          const ang = (i / Math.max(1, platformCount)) * Math.PI * 2;
          const radius = Math.min(width, height) * 0.35;
          x = Math.max(1, Math.min(width - w - 1, Math.floor(cx + Math.cos(ang) * radius - w / 2)));
          y = Math.max(1, Math.min(height - h - 1, Math.floor(cy + Math.sin(ang) * radius - h / 2)));
        } else if (opts.platformPattern === 'grid') {
          const cols = Math.ceil(Math.sqrt(platformCount));
          const rows = Math.ceil(platformCount / cols);
          const gx = i % cols; const gy = Math.floor(i / cols);
          const cellW = Math.floor(width / (cols + 1));
          const cellH = Math.floor(height / (rows + 1));
          x = Math.max(1, gx * cellW + Math.floor(cellW / 2) - Math.floor(w / 2));
          y = Math.max(1, gy * cellH + Math.floor(cellH / 2) - Math.floor(h / 2));
        } else if (opts.platformPattern === 'line') {
          const span = Math.min(width - w - 2, Math.floor(width * 0.8));
          x = Math.max(1, Math.min(width - w - 1, Math.floor((width - span) / 2 + (span * i) / Math.max(1, platformCount - 1))));
          y = Math.max(1, Math.min(height - h - 1, cy - Math.floor(h / 2)));
        }
      }
      // Constrain to room interiors if requested and not submerged map
      if (opts.constrainPlatforms && opts.mapType === 'normal' && rooms.length) {
        const r = rooms[Math.floor(rand() * rooms.length)];
        x = Math.max(r.x + 1, Math.min(r.x + r.width - w - 1, x));
        y = Math.max(r.y + 1, Math.min(r.y + r.height - h - 1, y));
      }
      const elev = opts.platformElevMax ? rInt(opts.platformElevMin || 0, opts.platformElevMax + 1) : 0;
      features.platforms.push({ x, y, w, h, elev });
    }
  } else {
    // Generate irregular land blobs
    for (let i = 0; i < platformCount; i++) {
      const minR = Math.max(1, opts.platformMin || 2);
      const maxR = Math.max(minR + 1, opts.platformMax || 6);
      let cx = rInt(2, width - 2);
      let cy = rInt(2, height - 2);
      if (opts.platformPattern && opts.platformPattern !== 'random') {
        const CCX = Math.floor(width / 2), CCY = Math.floor(height / 2);
        if (opts.platformPattern === 'ring') {
          const ang = (i / Math.max(1, platformCount)) * Math.PI * 2;
          const radius = Math.min(width, height) * 0.35;
          cx = Math.max(2, Math.min(width - 2, Math.floor(CCX + Math.cos(ang) * radius)));
          cy = Math.max(2, Math.min(height - 2, Math.floor(CCY + Math.sin(ang) * radius)));
        } else if (opts.platformPattern === 'grid') {
          const cols = Math.ceil(Math.sqrt(platformCount));
          const rows = Math.ceil(platformCount / cols);
          const gx = i % cols; const gy = Math.floor(i / cols);
          const cellW = Math.floor(width / (cols + 1));
          const cellH = Math.floor(height / (rows + 1));
          cx = Math.max(2, gx * cellW + Math.floor(cellW / 2));
          cy = Math.max(2, gy * cellH + Math.floor(cellH / 2));
        } else if (opts.platformPattern === 'line') {
          const span = Math.min(width - 4, Math.floor(width * 0.8));
          cx = Math.max(2, Math.min(width - 2, Math.floor((width - span) / 2 + (span * i) / Math.max(1, platformCount - 1))));
          cy = CCY;
        }
      }
      if (opts.constrainPlatforms && opts.mapType === 'normal' && rooms.length) {
        const r = rooms[Math.floor(rand() * rooms.length)];
        cx = Math.max(r.x + 2, Math.min(r.x + r.width - 2, cx));
        cy = Math.max(r.y + 2, Math.min(r.y + r.height - 2, cy));
      }
      const points = [];
      const count = platType === 'island' ? rInt(10, 16) : rInt(6, 12);
      const baseR = rInt(minR, maxR);
      for (let k = 0; k < count; k++) {
        const t = (k / count) * Math.PI * 2;
        const jitter = platType === 'island' ? 0.2 : 0.5;
        const r = baseR * (0.7 + rand() * jitter);
        const x = Math.max(1, Math.min(width - 2, cx + Math.cos(t) * r));
        const y = Math.max(1, Math.min(height - 2, cy + Math.sin(t) * r));
        points.push({ x, y });
      }
      const elev = opts.platformElevMax ? rInt(opts.platformElevMin || 0, opts.platformElevMax + 1) : 0;
      features.landPolys.push({ points, elev });
    }
  }

  // Walls and half-walls as line segments
  const wallLines = Math.max(0, Math.floor(opts.walls || 0));
  for (let i = 0; i < wallLines; i++) {
    const x1 = rInt(1, width - 1), y1 = rInt(1, height - 1);
    const horizontal = rand() < 0.5;
    const len = rInt(Math.max(1, opts.wallLenMin || 1), Math.max(2, opts.wallLenMax || 5));
    const x2 = Math.max(1, Math.min(width - 1, x1 + (horizontal ? len : 0)));
    const y2 = Math.max(1, Math.min(height - 1, y1 + (!horizontal ? len : 0)));
    features.walls.push({ x1, y1, x2, y2 });
  }
  const halfWallLines = Math.max(0, Math.floor(opts.halfWalls || 0));
  for (let i = 0; i < halfWallLines; i++) {
    const x1 = rInt(1, width - 1), y1 = rInt(1, height - 1);
    const horizontal = rand() < 0.5;
    const len = rInt(Math.max(1, opts.halfWallLenMin || 1), Math.max(2, opts.halfWallLenMax || 4));
    const x2 = Math.max(1, Math.min(width - 1, x1 + (horizontal ? len : 0)));
    const y2 = Math.max(1, Math.min(height - 1, y1 + (!horizontal ? len : 0)));
    features.halfWalls.push({ x1, y1, x2, y2 });
  }

  // Bridges: draw lines (thick) preferably touching platforms
  const bridgeCount = Math.max(0, Math.floor(opts.bridges || 0));
  const platCentersRects = (features.platforms || []).map(p => ({ x: Math.floor(p.x + p.w / 2), y: Math.floor(p.y + p.h / 2) }));
  const platCentersPolys = (features.landPolys || []).map(poly => {
    const n = poly.points.length || 1;
    let sx = 0, sy = 0;
    poly.points.forEach(pt => { sx += pt.x; sy += pt.y; });
    return { x: Math.floor(sx / n), y: Math.floor(sy / n) };
  });
  const platCenters = [...platCentersRects, ...platCentersPolys];
  for (let i = 0; i < bridgeCount; i++) {
    const wFactor = Math.max(0.5, Math.min(2, opts.bridgeWidth == null ? 1.0 : opts.bridgeWidth));
    if (platCenters.length >= 1) {
      // Start at a platform center
      const a = platCenters[Math.floor(rand() * platCenters.length)];
      // Try to connect to nearest different platform if available, preferring to span water/lava
      let b = null;
      if (platCenters.length > 1) {
        let best = null, bestScore = -Infinity;
        platCenters.forEach(pc => {
          if (pc === a) return;
          const dx = pc.x - a.x, dy = pc.y - a.y; const dist = Math.hypot(dx, dy);
          const midx = Math.floor((a.x + pc.x) / 2), midy = Math.floor((a.y + pc.y) / 2);
          const midHaz = (hazards.grid[midy] && hazards.grid[midy][midx]) || 0;
          // score: prefer longer a bit and if crossing water/lava
          const crossBonus = (midHaz === 1 || midHaz === 4 || midHaz === 2) ? 10 : 0;
          const score = crossBonus + dist * 0.1 - Math.abs(dx) * 0.01 - Math.abs(dy) * 0.01;
          if (score > bestScore) { bestScore = score; best = pc; }
        });
        b = best;
      }
      if (b) {
        features.bridges.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, width: wFactor });
      } else {
        // Single platform: extend a short bridge into nearby floor/hazard
        const horizontal = rand() < 0.5;
        const len = rInt(3, 7);
        const x2 = Math.max(1, Math.min(width - 2, a.x + (horizontal ? len * (rand() < 0.5 ? 1 : -1) : 0)));
        const y2 = Math.max(1, Math.min(height - 2, a.y + (!horizontal ? len * (rand() < 0.5 ? 1 : -1) : 0)));
        features.bridges.push({ x1: a.x, y1: a.y, x2, y2, width: wFactor });
      }
    } else {
      // No platforms: fallback horizontal bridge
      const y = rInt(2, height - 2);
      const x1 = rInt(1, Math.floor(width / 2));
      const x2 = rInt(Math.floor(width / 2), width - 1);
      features.bridges.push({ x1, y1: y, x2, y2: y, width: wFactor });
    }
  }

  // Debris: random small polygons, density proportion of floor cells
  const debrisDensity = Math.max(0, Math.min(0.5, opts.debrisDensity || 0));
  const debrisCount = Math.floor(floorCells.length * debrisDensity * 0.05);
  const debrisKinds = ['wood', 'stone', 'junk'];
  const dMin = Math.max(0.05, opts.debrisMinSize == null ? 0.2 : Number(opts.debrisMinSize));
  const dMax = Math.max(dMin, opts.debrisMaxSize == null ? 0.7 : Number(opts.debrisMaxSize));
  for (let i = 0; i < debrisCount; i++) {
    const center = floorCells[Math.floor(rand() * floorCells.length)] || { x: rInt(1, width - 1), y: rInt(1, height - 1) };
    const points = [];
    const verts = rInt(3, 7);
    for (let v = 0; v < verts; v++) {
      const ang = (v / verts) * Math.PI * 2 + rand() * 0.5;
      const radius = dMin + rand() * (dMax - dMin);
      points.push({ x: center.x + Math.cos(ang) * radius, y: center.y + Math.sin(ang) * radius });
    }
    features.debris.push({ kind: debrisKinds[Math.floor(rand() * debrisKinds.length)], points });
  }

  // Props (room clutter): barrels, tables, shelves, desks, crates
  const pKinds = Object.entries(opts.propKinds || {}).filter(([, v]) => !!v).map(([k]) => k);
  const pCount = Math.max(0, Math.floor(opts.propsCount || 0));
  for (let i = 0; i < pCount; i++) {
    const kind = pKinds.length ? pKinds[Math.floor(rand() * pKinds.length)] : 'barrel';
    const c = floorCells[Math.floor(rand() * floorCells.length)] || { x: rInt(1, width - 2), y: rInt(1, height - 2) };
    const w = Math.max(0.4, (opts.propSizeMin || 0.6) + rand() * Math.max(0, (opts.propSizeMax || 1.2) - (opts.propSizeMin || 0.6)));
    const h = Math.max(0.4, (opts.propSizeMin || 0.6) + rand() * Math.max(0, (opts.propSizeMax || 1.2) - (opts.propSizeMin || 0.6)));
    features.props.push({ kind, x: c.x - w / 2, y: c.y - h / 2, w, h, rot: rand() * Math.PI });
  }

  // Sprinkle monster markers inside floor (room or cavern)
  for (let i = 0; i < monsterCount; i++) {
    const c = floorCells[Math.floor(rand() * floorCells.length)] || { x: rInt(1, width - 2), y: rInt(1, height - 2) };
    entities.push({ type: 'monster', x: c.x, y: c.y, properties: { name: 'M' } });
  }

  return { grid, rooms, corridors, entities, width, height, hazards, features, elevation };
}

const Field = ({ label, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <label style={{ color: '#b8860b', minWidth: 95 }}>{label}</label>
    {children}
  </div>
);

const StaticDungeonGenerator = ({ onApplyMap, onRestore }) => {
  const [width, setWidth] = useState(20);
  const [height, setHeight] = useState(20);
  const [rooms, setRooms] = useState(6);
  const [monsters, setMonsters] = useState(0);
  const [cellSize, setCellSize] = useState(25);
  const [drawGrid, setDrawGrid] = useState(true);
  const [placeTokens, setPlaceTokens] = useState(true);
  const [drawMonsters, setDrawMonsters] = useState(false);
  const [seed, setSeed] = useState('');
  const [theme, setTheme] = useState('dungeon');
  const [mode, setMode] = useState('rooms'); // rooms | arena | cavern
  const [mapType, setMapType] = useState('normal'); // normal | shallow | deep
  const [hazardWater, setHazardWater] = useState(false);
  const [hazardShallow, setHazardShallow] = useState(false);
  const [hazardLava, setHazardLava] = useState(false);
  const [hazardPit, setHazardPit] = useState(false);
  const [hazardMud, setHazardMud] = useState(false);
  const [hazardBramble, setHazardBramble] = useState(false);
  const [hazardDensity, setHazardDensity] = useState(0);
  const [hazardCluster, setHazardCluster] = useState(0.5); // 0=spread, 1=clustered
  // removed smooth hazards option per request
  const [waterForm, setWaterForm] = useState('pools'); // puddles | pools | partial | submerged
  const [hazardSand, setHazardSand] = useState(false);
  const [hazardIce, setHazardIce] = useState(false);
  const [hazardThinIce, setHazardThinIce] = useState(false);
  const [platforms, setPlatforms] = useState(0);
  const [platformMin, setPlatformMin] = useState(2);
  const [platformMax, setPlatformMax] = useState(6);
  const [platformGenType, setPlatformGenType] = useState('platform'); // platform | rock | island
  const [constrainPlatforms, setConstrainPlatforms] = useState(false);
  const [platformElevMin, setPlatformElevMin] = useState(0);
  const [platformElevMax, setPlatformElevMax] = useState(0);
  const [platformPattern, setPlatformPattern] = useState('random'); // reserved for future
  const [roomPattern, setRoomPattern] = useState('random');
  const [bridges, setBridges] = useState(0);
  const [bridgeWidth, setBridgeWidth] = useState(1.0);
  const [walls, setWalls] = useState(0);
  const [wallLenMin, setWallLenMin] = useState(1);
  const [wallLenMax, setWallLenMax] = useState(5);
  const [halfWalls, setHalfWalls] = useState(0);
  const [halfWallLenMin, setHalfWallLenMin] = useState(1);
  const [halfWallLenMax, setHalfWallLenMax] = useState(4);
  const [debrisDensity, setDebrisDensity] = useState(0);
  const [debrisMinSize, setDebrisMinSize] = useState(0.2);
  const [debrisMaxSize, setDebrisMaxSize] = useState(0.7);
  // Props (room clutter)
  const [propsCount, setPropsCount] = useState(0);
  const [propSizeMin, setPropSizeMin] = useState(0.6);
  const [propSizeMax, setPropSizeMax] = useState(1.2);
  const [propKinds, setPropKinds] = useState({ barrel: true, table: true, shelf: true, desk: true, crate: true });
  const [preset, setPreset] = useState('none');
  // Elevation controls
  const [enableElevation, setEnableElevation] = useState(false);
  const [elevMax, setElevMax] = useState(0);
  const [elevFreq, setElevFreq] = useState(0.2);
  const [ladderCount, setLadderCount] = useState(0);
  const [ladder5, setLadder5] = useState(true);
  const [ladder10, setLadder10] = useState(false);
  const [ladder15, setLadder15] = useState(false);

  const panelStyle = useMemo(() => ({
    position: 'fixed',
    left: 20,
    bottom: 20,
    zIndex: 1160,
  width: 'min(92vw, 900px)',
  maxHeight: '80vh',
  overflowY: 'auto',
    background: 'rgba(0,0,0,0.65)',
    borderRadius: 8,
    border: '1px solid #b8860b',
    padding: 10,
    color: 'gold'
  }), []);

  // Palette preview for swatches (keep in sync with renderer palettes)
  const swatchPalette = useMemo(() => {
    const base = {
      dungeon: {
        water: '#3b6ea5', shallowWater: '#6ea7d6', lava: '#d14a28', pit: '#2a2a2a', mud: '#6b4f33', bramble: '#3c6b3c', sand: '#c2ab76', ice: '#a7d3f0', thinIce: '#cfe8f6'
      },
      forest: {
        water: '#3a7fb5', shallowWater: '#6fb0e0', lava: '#d06030', pit: '#2f3d2f', mud: '#5a442f', bramble: '#2f6b2f', sand: '#cdbb8a', ice: '#a9d7f5', thinIce: '#d9eefb'
      },
      desert: {
        water: '#4fa3c8', shallowWater: '#85c5de', lava: '#d56a2f', pit: '#a89064', mud: '#8a6a44', bramble: '#7c9a45', sand: '#e5d3a1', ice: '#b4defa', thinIce: '#e1f3ff'
      },
      tundra: {
        water: '#4b7fae', shallowWater: '#8eb5d9', lava: '#cf582e', pit: '#223344', mud: '#6b6b6b', bramble: '#557788', sand: '#d7d7c8', ice: '#b8e1ff', thinIce: '#e8f6ff'
      },
      marsh: {
        water: '#2f5e74', shallowWater: '#5f97a9', lava: '#be4f2a', pit: '#1f2d1f', mud: '#4a3a29', bramble: '#335533', sand: '#b9a774', ice: '#a0cfe9', thinIce: '#d0e8f4'
      }
    };
    return base[theme] || base.dungeon;
  }, [theme]);

  const applyPreset = () => {
    switch (preset) {
      case 'arena-clean':
        setMode('arena'); setTheme('dungeon'); setHazardWater(false); setHazardLava(false); setHazardPit(false);
        setHazardShallow(false); setHazardMud(false); setHazardBramble(false);
        setHazardDensity(0); setPlatforms(0); setBridges(0); setWalls(2); setHalfWalls(2); setDebrisDensity(0.05);
        setPropsCount(2);
        break;
      case 'arena-lava-bridges':
        setMode('arena'); setTheme('dungeon'); setHazardWater(false); setHazardLava(true); setHazardPit(false);
        setHazardShallow(false); setHazardMud(false); setHazardBramble(false);
  setHazardDensity(0.12); setBridges(2); setPlatforms(1); setWalls(1); setHalfWalls(2); setDebrisDensity(0.05); setWaterForm('pools');
        setBridgeWidth(0.7); setPropsCount(1);
        break;
      case 'cavern-flooded':
        setMode('cavern'); setTheme('forest'); setHazardWater(true); setHazardLava(false); setHazardPit(false);
        setHazardShallow(true); setHazardMud(true); setHazardBramble(false);
  setHazardDensity(0.18); setPlatforms(2); setBridges(1); setWalls(1); setHalfWalls(3); setDebrisDensity(0.1); setHazardCluster(0.7); setWaterForm('partial');
        setPropsCount(3);
        break;
      case 'desert-ruins':
        setMode('arena'); setTheme('desert'); setHazardWater(false); setHazardLava(false); setHazardPit(true);
        setHazardShallow(false); setHazardMud(true); setHazardBramble(true);
        setHazardDensity(0.08); setPlatforms(1); setBridges(0); setWalls(3); setHalfWalls(3); setDebrisDensity(0.2); setPropsCount(4);
        break;
      case 'forest-clearing':
        setMode('arena'); setTheme('forest'); setHazardWater(true); setHazardLava(false); setHazardPit(false);
        setHazardShallow(true); setHazardMud(false); setHazardBramble(true);
        setHazardDensity(0.05); setPlatforms(1); setBridges(1); setWalls(1); setHalfWalls(2); setDebrisDensity(0.15); setPropsCount(3);
        break;
      case 'lair-marsh-hollow': {
        setMode('rooms'); setTheme('marsh'); setMapType('shallow');
        setHazardWater(true); setHazardShallow(true); setHazardLava(false); setHazardPit(false); setHazardMud(true); setHazardBramble(true);
        setHazardDensity(0.22); setHazardCluster(0.8); setWaterForm('submerged');
        setPlatformGenType('island'); setPlatforms(3); setPlatformMin(2); setPlatformMax(5); setBridges(2);
        setConstrainPlatforms(false);
        setEnableElevation(false); setPropsCount(2);
        break;
      }
      case 'lair-lava-expanse': {
        setMode('arena'); setTheme('dungeon'); setMapType('normal');
        setHazardWater(false); setHazardShallow(false); setHazardLava(true); setHazardPit(false); setHazardMud(false); setHazardBramble(false);
        setHazardDensity(0.2); setHazardCluster(0.6); setWaterForm('pools');
        setPlatforms(4); setPlatformGenType('platform'); setPlatformMin(3); setPlatformMax(7); setBridges(3); setBridgeWidth(0.9);
        setConstrainPlatforms(true);
        setEnableElevation(true); setElevMax(1); setLadderCount(1); setLadder5(true); setLadder10(false); setLadder15(false);
        break;
      }
      case 'lair-column-hall': {
        setMode('arena'); setTheme('dungeon'); setMapType('normal');
        setHazardWater(false); setHazardShallow(false); setHazardLava(false); setHazardPit(false); setHazardMud(false); setHazardBramble(false);
        setPlatforms(0); setWalls(0); setHalfWalls(0); setBridges(0); setDebrisDensity(0);
        // fill with columns as props
        setPropsCount(24);
        setPropKinds(prev => ({ ...prev, column: true }));
        break;
      }
      default:
        break;
    }
  };

  const generate = () => {
    const w = Math.max(10, Number(width) || 20);
    const h = Math.max(10, Number(height) || 20);
  const dungeon = generateSimpleDungeon({
      width: w,
      height: h,
      roomCount: Math.max(1, Math.min(100, Number(rooms) || 1)),
      monsterCount: Math.max(0, Number(monsters) || 0),
      seed: seed ? Number(seed) : undefined,
      mode,
  opts: {
  hazards: { water: hazardWater, shallow: hazardShallow, lava: hazardLava, pit: hazardPit, mud: hazardMud, bramble: hazardBramble, sand: hazardSand, ice: hazardIce, thinIce: hazardThinIce },
        hazardDensity: Number(hazardDensity) || 0,
    hazardCluster: Number(hazardCluster) || 0,
  waterForm,
  mapType,
    platforms: Number(platforms) || 0,
    platformMin: Number(platformMin) || 2,
    platformMax: Number(platformMax) || 6,
  platformGenType,
  constrainPlatforms: constrainPlatforms,
  platformElevMin: Number(platformElevMin) || 0,
  platformElevMax: Number(platformElevMax) || 0,
  platformPattern,
  roomPattern,
    bridges: Number(bridges) || 0,
  bridgeWidth: Number(bridgeWidth) || 1.0,
    walls: Number(walls) || 0,
    wallLenMin: Number(wallLenMin) || 1,
    wallLenMax: Number(wallLenMax) || 5,
    halfWalls: Number(halfWalls) || 0,
    halfWallLenMin: Number(halfWallLenMin) || 1,
    halfWallLenMax: Number(halfWallLenMax) || 4,
        debrisDensity: Number(debrisDensity) || 0,
  debrisMinSize: Number(debrisMinSize) || 0.2,
  debrisMaxSize: Number(debrisMaxSize) || 0.7,
    propsCount: Number(propsCount) || 0,
    propSizeMin: Number(propSizeMin) || 0.6,
    propSizeMax: Number(propSizeMax) || 1.2,
  propKinds,
    cavernFill: 0.45,
    enableElevation,
    elevMax: Number(elevMax) || 0,
    elevFreq: Number(elevFreq) || 0.2,
    ladderCount: Number(ladderCount) || 0,
    ladder5, ladder10, ladder15
      }
    });
    const dataUrl = renderDungeonToDataUrl(dungeon, {
      cellSize: Math.max(10, Number(cellSize) || 25),
    drawGrid,
    // If placing tokens, do not also draw entity markers on the image
    drawEntities: !placeTokens && drawMonsters,
  theme
    });
    onApplyMap?.(dataUrl, dungeon, { cellSize, placeTokens });
  };

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h4 style={{ margin: 0, color: '#b8860b' }}>Static Dungeon Generator</h4>
        <FancyButton onClick={onRestore} style={{ padding: '2px 8px', fontSize: 12 }}>Restore Map</FancyButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Width">
          <input value={width} onChange={e => setWidth(e.target.value)} style={{ width: 80 }} />
        </Field>
        <Field label="Height">
          <input value={height} onChange={e => setHeight(e.target.value)} style={{ width: 80 }} />
        </Field>
        <Field label="Theme">
          <select value={theme} onChange={e => setTheme(e.target.value)} style={{ width: 120 }}>
            <option value="dungeon">Dungeon</option>
            <option value="forest">Forest</option>
            <option value="desert">Desert</option>
            <option value="tundra">Tundra</option>
            <option value="marsh">Marsh</option>
          </select>
        </Field>
        <Field label="Map Type">
          <select value={mapType} onChange={e => setMapType(e.target.value)} style={{ width: 120 }}>
            <option value="normal">Normal</option>
            <option value="shallow">Shallow Water</option>
            <option value="deep">Deep Water</option>
          </select>
        </Field>
        <Field label="Mode">
          <select value={mode} onChange={e => setMode(e.target.value)} style={{ width: 120 }}>
            <option value="rooms">Rooms</option>
            <option value="arena">Arena</option>
            <option value="cavern">Cavern</option>
          </select>
        </Field>
        <Field label="Room Pattern">
          <select value={roomPattern} onChange={e => setRoomPattern(e.target.value)} style={{ width: 140 }}>
            <option value="random">Random</option>
            <option value="grid">Grid</option>
            <option value="ring">Ring</option>
            <option value="cross">Cross</option>
          </select>
        </Field>
  <Field label="Rooms (1-100)">
          <input value={rooms} onChange={e => setRooms(e.target.value)} style={{ width: 80 }} />
        </Field>
        <Field label="Monsters">
          <input value={monsters} onChange={e => setMonsters(e.target.value)} style={{ width: 80 }} />
        </Field>
        <Field label="Cell Size">
          <input value={cellSize} onChange={e => setCellSize(e.target.value)} style={{ width: 80 }} />
        </Field>
        <Field label="Seed">
          <input value={seed} onChange={e => setSeed(e.target.value)} placeholder="optional" style={{ width: 120 }} />
        </Field>
        <Field label="Show Grid">
          <input type="checkbox" checked={drawGrid} onChange={e => setDrawGrid(e.target.checked)} />
        </Field>
        <Field label="Place Tokens">
          <input type="checkbox" checked={placeTokens} onChange={e => setPlaceTokens(e.target.checked)} />
        </Field>
        <Field label="Draw Monsters">
          <input type="checkbox" checked={drawMonsters} onChange={e => setDrawMonsters(e.target.checked)} />
        </Field>
    <Field label="Preset">
          <select value={preset} onChange={e => setPreset(e.target.value)} style={{ width: 160 }}>
            <option value="none">None</option>
            <option value="arena-clean">Arena: Clean</option>
            <option value="arena-lava-bridges">Arena: Lava Bridges</option>
            <option value="cavern-flooded">Cavern: Flooded</option>
            <option value="desert-ruins">Desert Ruins</option>
      <option value="forest-clearing">Forest Clearing</option>
      <option value="lair-marsh-hollow">Lair: Marshy Hollow</option>
      <option value="lair-lava-expanse">Lair: Lava Expanse</option>
      <option value="lair-column-hall">Lair: Column Hall</option>
          </select>
        </Field>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FancyButton onClick={applyPreset} style={{ padding: '2px 8px', fontSize: 12 }}>Apply Preset</FancyButton>
        </div>
        <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #b8860b', margin: '6px 0' }} />
    <Field label="Hazards">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <label title="Deep water"><input type="checkbox" checked={hazardWater} onChange={e => setHazardWater(e.target.checked)} /> Water</label>
            <label title="Shallow water"><input type="checkbox" checked={hazardShallow} onChange={e => setHazardShallow(e.target.checked)} /> Shallow</label>
            <label><input type="checkbox" checked={hazardLava} onChange={e => setHazardLava(e.target.checked)} /> Lava</label>
            <label><input type="checkbox" checked={hazardPit} onChange={e => setHazardPit(e.target.checked)} /> Pit</label>
            <label><input type="checkbox" checked={hazardMud} onChange={e => setHazardMud(e.target.checked)} /> Mud</label>
      <label><input type="checkbox" checked={hazardBramble} onChange={e => setHazardBramble(e.target.checked)} /> Bramble</label>
      <label><input type="checkbox" checked={hazardSand} onChange={e => setHazardSand(e.target.checked)} /> Sand</label>
      <label><input type="checkbox" checked={hazardIce} onChange={e => setHazardIce(e.target.checked)} /> Ice</label>
      <label><input type="checkbox" checked={hazardThinIce} onChange={e => setHazardThinIce(e.target.checked)} /> Thin Ice</label>
          </div>
        </Field>
        {/* Color swatches to preview hazard colors for current theme */}
  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: '#b8860b' }}>Swatches</span>
          {[
            { label: 'Water', color: swatchPalette.water, key: 'water' },
            { label: 'Shallow', color: swatchPalette.shallowWater, key: 'shallow' },
            { label: 'Lava', color: swatchPalette.lava, key: 'lava' },
            { label: 'Pit', color: swatchPalette.pit, key: 'pit' },
            { label: 'Mud', color: swatchPalette.mud, key: 'mud' },
            { label: 'Bramble', color: swatchPalette.bramble, key: 'bramble' },
            { label: 'Sand', color: swatchPalette.sand, key: 'sand' },
            { label: 'Ice', color: swatchPalette.ice, key: 'ice' },
            { label: 'Thin Ice', color: swatchPalette.thinIce, key: 'thinIce' },
          ].map(s => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 16, height: 16, border: '1px solid #333', background: s.color }} />
              <span style={{ fontSize: 12 }}>{s.label}</span>
            </div>
          ))}
        </div>
        <Field label="Hazard Density">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="range" min="0" max="0.9" step="0.01" value={hazardDensity} onChange={e => setHazardDensity(e.target.value)} />
            <span style={{ minWidth: 42, textAlign: 'right' }}>{Number(hazardDensity).toFixed(2)}</span>
          </div>
        </Field>
        <Field label="Clustering">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="range" min="0" max="1" step="0.01" value={hazardCluster} onChange={e => setHazardCluster(e.target.value)} />
            <span style={{ minWidth: 42, textAlign: 'right' }}>{Number(hazardCluster).toFixed(2)}</span>
          </div>
        </Field>
        <Field label="Water Form">
          <select value={waterForm} onChange={e => setWaterForm(e.target.value)} style={{ width: 140 }}>
            <option value="puddles">Scattered Puddles</option>
            <option value="pools">Pools</option>
            <option value="partial">Partial Rooms</option>
            <option value="submerged">Submerged Rooms</option>
          </select>
        </Field>
        <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #b8860b', margin: '6px 0' }} />
        <Field label="Platforms">
          <input value={platforms} onChange={e => setPlatforms(e.target.value)} style={{ width: 80 }} />
        </Field>
        <Field label="Land Type">
          <select value={platformGenType} onChange={e => setPlatformGenType(e.target.value)} style={{ width: 140 }}>
            <option value="platform">Rect Platforms</option>
            <option value="rock">Rocky Blobs</option>
            <option value="island">Island Blobs</option>
          </select>
        </Field>
        <Field label="Constrain to Rooms">
          <input type="checkbox" checked={constrainPlatforms} onChange={e => setConstrainPlatforms(e.target.checked)} />
        </Field>
        <Field label="Plat Size (min/max)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" value={platformMin} onChange={e => setPlatformMin(e.target.value)} style={{ width: 60 }} />
            <span>to</span>
            <input type="number" value={platformMax} onChange={e => setPlatformMax(e.target.value)} style={{ width: 60 }} />
          </div>
        </Field>
        <Field label="Plat Elev (min/max)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" value={platformElevMin} onChange={e => setPlatformElevMin(e.target.value)} style={{ width: 60 }} />
            <span>to</span>
            <input type="number" value={platformElevMax} onChange={e => setPlatformElevMax(e.target.value)} style={{ width: 60 }} />
          </div>
        </Field>
        <Field label="Bridges">
          <input value={bridges} onChange={e => setBridges(e.target.value)} style={{ width: 80 }} />
        </Field>
        <Field label="Bridge Width">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="range" min="0.5" max="2" step="0.05" value={bridgeWidth} onChange={e => setBridgeWidth(e.target.value)} />
            <span style={{ minWidth: 42, textAlign: 'right' }}>{Number(bridgeWidth).toFixed(2)}x</span>
          </div>
        </Field>
        <Field label="Walls">
          <input value={walls} onChange={e => setWalls(e.target.value)} style={{ width: 80 }} />
        </Field>
        <Field label="Wall Len (min/max)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" value={wallLenMin} onChange={e => setWallLenMin(e.target.value)} style={{ width: 60 }} />
            <span>to</span>
            <input type="number" value={wallLenMax} onChange={e => setWallLenMax(e.target.value)} style={{ width: 60 }} />
          </div>
        </Field>
        <Field label="Half Walls">
          <input value={halfWalls} onChange={e => setHalfWalls(e.target.value)} style={{ width: 80 }} />
        </Field>
        <Field label="Half Len (min/max)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" value={halfWallLenMin} onChange={e => setHalfWallLenMin(e.target.value)} style={{ width: 60 }} />
            <span>to</span>
            <input type="number" value={halfWallLenMax} onChange={e => setHalfWallLenMax(e.target.value)} style={{ width: 60 }} />
          </div>
        </Field>
        <Field label="Debris Density">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="range" min="0" max="0.5" step="0.01" value={debrisDensity} onChange={e => setDebrisDensity(e.target.value)} />
            <span style={{ minWidth: 42, textAlign: 'right' }}>{Number(debrisDensity).toFixed(2)}</span>
          </div>
        </Field>
        <Field label="Debris Size (min/max)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" step="0.05" value={debrisMinSize} onChange={e => setDebrisMinSize(e.target.value)} style={{ width: 60 }} />
            <span>to</span>
            <input type="number" step="0.05" value={debrisMaxSize} onChange={e => setDebrisMaxSize(e.target.value)} style={{ width: 60 }} />
          </div>
        </Field>
        <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #b8860b', margin: '6px 0' }} />
        <Field label="Elevation">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <label><input type="checkbox" checked={enableElevation} onChange={e => setEnableElevation(e.target.checked)} /> Enable</label>
            <span>Max lvl</span>
            <input type="number" min={0} max={4} value={elevMax} onChange={e => setElevMax(e.target.value)} style={{ width: 60 }} />
            <span>Freq</span>
            <input type="range" min="0.05" max="1" step="0.05" value={elevFreq} onChange={e => setElevFreq(e.target.value)} />
            <span style={{ minWidth: 40, textAlign: 'right' }}>{Number(elevFreq).toFixed(2)}</span>
          </div>
        </Field>
        <Field label="Ladders (5/10/15)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <input type="number" min={0} value={ladderCount} onChange={e => setLadderCount(e.target.value)} style={{ width: 60 }} />
            <label><input type="checkbox" checked={ladder5} onChange={e => setLadder5(e.target.checked)} /> 5ft</label>
            <label><input type="checkbox" checked={ladder10} onChange={e => setLadder10(e.target.checked)} /> 10ft</label>
            <label><input type="checkbox" checked={ladder15} onChange={e => setLadder15(e.target.checked)} /> 15ft</label>
          </div>
        </Field>
        <Field label="Props Count">
          <input value={propsCount} onChange={e => setPropsCount(e.target.value)} style={{ width: 80 }} />
        </Field>
        <Field label="Prop Size (min/max)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" step="0.1" value={propSizeMin} onChange={e => setPropSizeMin(e.target.value)} style={{ width: 60 }} />
            <span>to</span>
            <input type="number" step="0.1" value={propSizeMax} onChange={e => setPropSizeMax(e.target.value)} style={{ width: 60 }} />
          </div>
        </Field>
        <Field label="Prop Types">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.keys(propKinds).map(k => (
              <label key={k}><input type="checkbox" checked={propKinds[k]} onChange={e => setPropKinds(prev => ({ ...prev, [k]: e.target.checked }))} /> {k}</label>
            ))}
          </div>
        </Field>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
        <FancyButton onClick={generate} style={{ minWidth: 140 }}>Generate Map</FancyButton>
      </div>
    </div>
  );
};

export default StaticDungeonGenerator;
