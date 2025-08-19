// Render a dungeon with optional hazards and features to a PNG data URL
// cellValues: 0=wall, 1=floor, 2=corridor, 3=door
// hazards: dungeon.hazards?.grid => 0=none, 1=water, 4=shallow, 2=lava, 3=pit, 5=mud, 6=bramble, 7=sand, 8=ice, 9=thin ice
export function renderDungeonToDataUrl(dungeon, options = {}) {
  if (!dungeon || !Array.isArray(dungeon.grid) || dungeon.grid.length === 0) {
    throw new Error('Invalid dungeon data: grid is empty');
  }

  const grid = dungeon.grid;
  const width = grid[0].length;
  const height = grid.length;
  const cellSize = options.cellSize || 25;

  // Themes
  const theme = options.theme || 'dungeon';
  const palettes = {
    dungeon: {
      wall: '#1d1b1a', floor: '#d9c9a3', corridor: '#c6b087', door: '#8b5a2b', grid: 'rgba(0,0,0,0.15)',
      water: '#3b6ea5', shallowWater: '#6ea7d6', lava: '#d14a28', pit: '#2a2a2a', mud: '#6b4f33', bramble: '#3c6b3c', sand: '#c2ab76', ice: '#a7d3f0', thinIce: '#cfe8f6',
      wallLine: '#3b2d1f', halfWallLine: '#a7a7a7', platform: '#b9a078', bridge: '#6e4b3a', debrisStone: '#6d6d6d', debrisWood: '#8b5a2b', debrisJunk: '#777777'
    },
    forest: {
      wall: '#1c2a1a', floor: '#6b8e23', corridor: '#7aa63a', door: '#5b7f2f', grid: 'rgba(0,0,0,0.12)',
      water: '#3a7fb5', shallowWater: '#6fb0e0', lava: '#d06030', pit: '#2f3d2f', mud: '#5a442f', bramble: '#2f6b2f', sand: '#cdbb8a', ice: '#a9d7f5', thinIce: '#d9eefb',
      wallLine: '#2f3d2b', halfWallLine: '#b1c79a', platform: '#7f8e52', bridge: '#6b4e2e', debrisStone: '#5d5d5d', debrisWood: '#6b4e2e', debrisJunk: '#6e6e6e'
    },
    desert: {
      wall: '#7a5c38', floor: '#e6d2a2', corridor: '#d7c08c', door: '#b08646', grid: 'rgba(0,0,0,0.12)',
      water: '#4fa3c8', shallowWater: '#85c5de', lava: '#d56a2f', pit: '#a89064', mud: '#8a6a44', bramble: '#7c9a45', sand: '#e5d3a1', ice: '#b4defa', thinIce: '#e1f3ff',
      wallLine: '#8a6a44', halfWallLine: '#ccb78b', platform: '#d7c08c', bridge: '#8f6b4f', debrisStone: '#8f816d', debrisWood: '#8f6b4f', debrisJunk: '#80745f'
    },
    tundra: {
      wall: '#2b3946', floor: '#dde6ef', corridor: '#c7d6e3', door: '#7b8a96', grid: 'rgba(0,0,0,0.12)',
      water: '#4b7fae', shallowWater: '#8eb5d9', lava: '#cf582e', pit: '#223344', mud: '#6b6b6b', bramble: '#557788', sand: '#d7d7c8', ice: '#b8e1ff', thinIce: '#e8f6ff',
      wallLine: '#3a4a57', halfWallLine: '#9bb1c1', platform: '#cfd8e0', bridge: '#7b8a96', debrisStone: '#8aa0b0', debrisWood: '#8b6a4b', debrisJunk: '#8899aa'
    },
    marsh: {
      wall: '#243124', floor: '#6a7b4c', corridor: '#7f8f5d', door: '#54634a', grid: 'rgba(0,0,0,0.12)',
      water: '#2f5e74', shallowWater: '#5f97a9', lava: '#be4f2a', pit: '#1f2d1f', mud: '#4a3a29', bramble: '#335533', sand: '#b9a774', ice: '#a0cfe9', thinIce: '#d0e8f4',
      wallLine: '#364336', halfWallLine: '#a9b89a', platform: '#8a9a6c', bridge: '#6b5a42', debrisStone: '#6d7a6d', debrisWood: '#6b5a42', debrisJunk: '#6e7466'
    }
  };
  const colors = {
    wall: options.wallColor || palettes[theme].wall,
    floor: options.floorColor || palettes[theme].floor,
    corridor: options.corridorColor || palettes[theme].corridor,
    door: options.doorColor || palettes[theme].door,
    grid: options.gridColor || palettes[theme].grid,
  water: palettes[theme].water,
  shallowWater: palettes[theme].shallowWater,
    lava: palettes[theme].lava,
    pit: palettes[theme].pit,
  mud: palettes[theme].mud,
  bramble: palettes[theme].bramble,
    sand: palettes[theme].sand,
    ice: palettes[theme].ice,
    thinIce: palettes[theme].thinIce,
    wallLine: palettes[theme].wallLine,
    halfWallLine: palettes[theme].halfWallLine,
    platform: palettes[theme].platform,
    bridge: palettes[theme].bridge,
    debrisStone: palettes[theme].debrisStone,
    debrisWood: palettes[theme].debrisWood,
    debrisJunk: palettes[theme].debrisJunk
  };

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = width * cellSize;
  canvas.height = height * cellSize;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = colors.wall;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw cells
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = grid[y][x];
      const cx = x * cellSize;
      const cy = y * cellSize;

      if (cell === 0) continue; // wall already drawn as background

      switch (cell) {
        case 1:
          ctx.fillStyle = colors.floor; // room floor
          break;
        case 2:
          ctx.fillStyle = colors.corridor; // corridor
          break;
        case 3:
          ctx.fillStyle = colors.door; // door tile
          break;
        default:
          ctx.fillStyle = colors.floor;
      }
      ctx.fillRect(cx, cy, cellSize, cellSize);
    }
  }

  // Hazards overlay (full-cell) + optional half-tile smoothing
  const hazards = dungeon.hazards && Array.isArray(dungeon.hazards.grid) ? dungeon.hazards.grid : null;
  const drawHalf = options.drawHalfTiles === true;
  if (hazards) {
    const hHeight = hazards.length;
    const hWidth = hazards[0].length;
    const colorForHazard = (h) => {
      switch (h) {
        case 1: return colors.water;
        case 4: return colors.shallowWater;
        case 2: return colors.lava;
        case 3: return colors.pit;
        case 5: return colors.mud;
        case 6: return colors.bramble;
        case 7: return colors.sand;
        case 8: return colors.ice;
        case 9: return colors.thinIce;
        default: return null;
      }
    };
    // full cell fill
    for (let y = 0; y < hHeight; y++) {
      for (let x = 0; x < hWidth; x++) {
        const h = hazards[y][x];
        if (!h) continue;
        const c = colorForHazard(h);
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
    // half-tiles for adjacency smoothing
  if (drawHalf) {
      const tri = (x1, y1, x2, y2, x3, y3, color) => {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      };
      for (let y = 0; y < hHeight; y++) {
        for (let x = 0; x < hWidth; x++) {
          if (hazards[y][x]) continue; // only draw smoothing into non-hazard cells
          const cx = x * cellSize; const cy = y * cellSize; const midX = cx + cellSize / 2; const midY = cy + cellSize / 2;
          const up = y > 0 ? hazards[y - 1][x] : 0;
          const down = y + 1 < hHeight ? hazards[y + 1][x] : 0;
          const left = x > 0 ? hazards[y][x - 1] : 0;
          const right = x + 1 < hWidth ? hazards[y][x + 1] : 0;
          if (up) tri(cx, cy, cx + cellSize, cy, midX, midY, colorForHazard(up));
          if (down) tri(cx, cy + cellSize, cx + cellSize, cy + cellSize, midX, midY, colorForHazard(down));
          if (left) tri(cx, cy, cx, cy + cellSize, midX, midY, colorForHazard(left));
          if (right) tri(cx + cellSize, cy, cx + cellSize, cy + cellSize, midX, midY, colorForHazard(right));
          // diagonal corners smoothing (smaller triangles)
          const upLeft = (y > 0 && x > 0) ? hazards[y - 1][x - 1] : 0;
          const upRight = (y > 0 && x + 1 < hWidth) ? hazards[y - 1][x + 1] : 0;
          const downLeft = (y + 1 < hHeight && x > 0) ? hazards[y + 1][x - 1] : 0;
          const downRight = (y + 1 < hHeight && x + 1 < hWidth) ? hazards[y + 1][x + 1] : 0;
          const qx = cx + cellSize * 0.65;
          const qy = cy + cellSize * 0.65;
          const ex = cx + cellSize * 0.35;
          const ey = cy + cellSize * 0.35;
          if (upLeft) tri(cx, cy, ex, cy, cx, ey, colorForHazard(upLeft));
          if (upRight) tri(cx + cellSize, cy, cx + cellSize, ey, qx, cy, colorForHazard(upRight));
          if (downLeft) tri(cx, cy + cellSize, ex, cy + cellSize, cx, qy, colorForHazard(downLeft));
          if (downRight) tri(cx + cellSize, cy + cellSize, cx + cellSize, qy, qx, cy + cellSize, colorForHazard(downRight));
        }
      }
    }
  }

  // Elevation shading and contours (if provided)
  const elevation = Array.isArray(dungeon.elevation) ? dungeon.elevation : null;
  if (elevation) {
    // per-cell subtle shading by level
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const lvl = (elevation[y] && elevation[y][x]) || 0;
        if (!lvl) continue;
        if (grid[y][x] !== 1 && grid[y][x] !== 2) continue;
        const cx = x * cellSize; const cy = y * cellSize;
        // Slight darkening per level
        ctx.fillStyle = `rgba(0,0,0,${Math.min(0.06 * lvl, 0.35)})`;
        ctx.fillRect(cx, cy, cellSize, cellSize);
      }
    }
    // draw contour lines where elevation changes between neighbors
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const lvl = (elevation[y] && elevation[y][x]) || 0;
        if (grid[y][x] !== 1 && grid[y][x] !== 2) continue;
        const cx = x * cellSize; const cy = y * cellSize;
        // Right edge
        if (x + 1 < width) {
          const rLvl = (elevation[y] && elevation[y][x + 1]) || 0;
          if (lvl !== rLvl && (grid[y][x + 1] === 1 || grid[y][x + 1] === 2)) {
            ctx.beginPath();
            ctx.moveTo(cx + cellSize - 0.5, cy);
            ctx.lineTo(cx + cellSize - 0.5, cy + cellSize);
            ctx.stroke();
          }
        }
        // Bottom edge
        if (y + 1 < height) {
          const bLvl = (elevation[y + 1] && elevation[y + 1][x]) || 0;
          if (lvl !== bLvl && (grid[y + 1][x] === 1 || grid[y + 1][x] === 2)) {
            ctx.beginPath();
            ctx.moveTo(cx, cy + cellSize - 0.5);
            ctx.lineTo(cx + cellSize, cy + cellSize - 0.5);
            ctx.stroke();
          }
        }
      }
    }
  }

  // Optional grid overlay for clarity on static map
  if (options.drawGrid !== false) {
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize + 0.5, 0);
      ctx.lineTo(x * cellSize + 0.5, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize + 0.5);
      ctx.lineTo(canvas.width, y * cellSize + 0.5);
      ctx.stroke();
    }
  }

  // Structural features: walls, half-walls, platforms, bridges
  const features = dungeon.features || {};
  if (Array.isArray(features.platforms)) {
    ctx.fillStyle = colors.platform;
    ctx.strokeStyle = '#00000055';
    features.platforms.forEach(p => {
      const x = p.x * cellSize, y = p.y * cellSize, w = p.w * cellSize, h = p.h * cellSize;
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
    });
  }
  if (Array.isArray(features.landPolys)) {
    ctx.fillStyle = colors.platform;
    ctx.strokeStyle = '#00000055';
    features.landPolys.forEach(poly => {
      if (!Array.isArray(poly.points) || poly.points.length < 3) return;
      ctx.beginPath();
      poly.points.forEach((pt, idx) => {
        const x = pt.x * cellSize, y = pt.y * cellSize;
        if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }
  if (Array.isArray(features.walls)) {
    ctx.strokeStyle = colors.wallLine;
    ctx.lineWidth = 3;
    features.walls.forEach(w => {
      ctx.beginPath();
      ctx.setLineDash([]);
      ctx.moveTo(w.x1 * cellSize, w.y1 * cellSize);
      ctx.lineTo(w.x2 * cellSize, w.y2 * cellSize);
      ctx.stroke();
    });
  }
  if (Array.isArray(features.halfWalls)) {
    ctx.strokeStyle = colors.halfWallLine;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    features.halfWalls.forEach(w => {
      ctx.beginPath();
      ctx.moveTo(w.x1 * cellSize, w.y1 * cellSize);
      ctx.lineTo(w.x2 * cellSize, w.y2 * cellSize);
      ctx.stroke();
    });
    ctx.setLineDash([]);
  }
  if (Array.isArray(features.bridges)) {
    ctx.strokeStyle = colors.bridge;
    features.bridges.forEach(b => {
      ctx.lineWidth = Math.max(3, (b.width || 0.6) * cellSize);
      ctx.beginPath();
      ctx.moveTo(b.x1 * cellSize, b.y1 * cellSize);
      ctx.lineTo(b.x2 * cellSize, b.y2 * cellSize);
      ctx.stroke();
      // planks
      const steps = 6;
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const px = (b.x1 + (b.x2 - b.x1) * t) * cellSize;
        const py = (b.y1 + (b.y2 - b.y1) * t) * cellSize;
        const nx = -(b.y2 - b.y1); // perpendicular
        const ny = (b.x2 - b.x1);
        const len = Math.hypot(nx, ny) || 1;
        const ux = (nx / len) * (cellSize * (b.width || 0.6) / 2);
        const uy = (ny / len) * (cellSize * (b.width || 0.6) / 2);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px - ux, py - uy);
        ctx.lineTo(px + ux, py + uy);
        ctx.stroke();
      }
    });
  }
  // Ladders connecting elevation changes
  if (Array.isArray(features.ladders)) {
    features.ladders.forEach(l => {
      const x1 = l.x1 * cellSize, y1 = l.y1 * cellSize;
      const x2 = l.x2 * cellSize, y2 = l.y2 * cellSize;
      // ladder rails
      ctx.strokeStyle = '#caa96b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      // rungs spaced along the ladder
      const steps = 5;
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const px = x1 + (x2 - x1) * t;
        const py = y1 + (y2 - y1) * t;
        // perpendicular small rung
        const nx = -(y2 - y1);
        const ny = (x2 - x1);
        const len = Math.hypot(nx, ny) || 1;
        const rungHalf = Math.min(6, Math.max(4, (cellSize * 0.15)));
        const ux = (nx / len) * rungHalf;
        const uy = (ny / len) * rungHalf;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(px - ux, py - uy);
        ctx.lineTo(px + ux, py + uy);
        ctx.stroke();
      }
      // optional label
      if (l.lengthFt) {
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.font = `${Math.max(10, Math.floor(cellSize * 0.4))}px sans-serif`;
        const tx = (x1 + x2) / 2;
        const ty = (y1 + y2) / 2;
        ctx.lineWidth = 3;
        ctx.strokeText(`${l.lengthFt}ft`, tx + 1, ty + 1);
        ctx.fillText(`${l.lengthFt}ft`, tx, ty);
        ctx.restore();
      }
    });
  }
  // Props: barrels, tables, shelves, desks, crates (simple shapes)
  if (Array.isArray(features.props)) {
    features.props.forEach(p => {
      const x = p.x * cellSize; const y = p.y * cellSize; const w = (p.w || 0.8) * cellSize; const h = (p.h || 0.8) * cellSize;
      const cx = x + w / 2; const cy = y + h / 2;
      ctx.save();
      if (p.rot) {
        ctx.translate(cx, cy);
        ctx.rotate(p.rot);
        ctx.translate(-cx, -cy);
      }
      switch (p.kind) {
        case 'barrel': {
          const r = Math.min(w, h) / 2;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fillStyle = colors.debrisWood;
          ctx.fill();
          ctx.strokeStyle = '#3b2d1f';
          ctx.lineWidth = 2;
          ctx.stroke();
          break;
        }
        case 'table':
        case 'desk':
        case 'shelf':
        case 'crate':
        case 'column':
        default: {
          if (p.kind === 'column') {
            const r = Math.min(w, h) / 2;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = colors.debrisStone;
            ctx.fill();
            ctx.strokeStyle = '#3b3b3b';
            ctx.lineWidth = 2;
            ctx.stroke();
            break;
          }
          ctx.fillStyle = p.kind === 'crate' ? '#a07a4a' : colors.debrisWood;
          ctx.strokeStyle = '#3b2d1f';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.rect(x, y, w, h);
          ctx.fill();
          ctx.stroke();
          break;
        }
      }
      ctx.restore();
    });
  }
  if (Array.isArray(features.debris)) {
    features.debris.forEach(d => {
      const color = d.kind === 'wood' ? colors.debrisWood : d.kind === 'stone' ? colors.debrisStone : colors.debrisJunk;
      ctx.fillStyle = color;
      ctx.beginPath();
      d.points.forEach((pt, idx) => {
        const x = pt.x * cellSize, y = pt.y * cellSize;
        if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
    });
  }

  // Optionally draw entity markers (e.g., monsters) as static icons
  if (options.drawEntities && Array.isArray(dungeon.entities)) {
    const size = cellSize;
    dungeon.entities.forEach(ent => {
      if (ent.type !== 'monster') return;
      const cx = ent.x * size + size / 2;
      const cy = ent.y * size + size / 2;
      // marker circle
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(4, Math.floor(size * 0.25)), 0, Math.PI * 2);
      ctx.fillStyle = '#b22222';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#640000';
      ctx.stroke();

      // initial letter
      if (ent.properties && ent.properties.name) {
        ctx.fillStyle = 'white';
        ctx.font = `${Math.max(10, Math.floor(size * 0.4))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ent.properties.name[0].toUpperCase(), cx, cy);
      }
    });
  }

  return canvas.toDataURL('image/png');
}
