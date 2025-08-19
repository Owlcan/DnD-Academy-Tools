// Generates public/assets/maps/manifest.json by scanning the maps folder for images.
// Supports .webp, .png, .jpg, .jpeg. Run automatically via prebuild/prestart.

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const MAPS_DIR = path.join(ROOT, 'public', 'assets', 'maps');
const OUT_FILE = path.join(MAPS_DIR, 'manifest.json');
const exts = new Set(['.webp', '.png', '.jpg', '.jpeg']);

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...walk(full));
    } else if (ent.isFile()) {
      const ext = path.extname(ent.name).toLowerCase();
      if (exts.has(ext)) out.push(full);
    }
  }
  return out;
}

function toPublicUrl(absPath) {
  // Convert absolute disk path to public URL starting at /assets/maps
  const rel = path.relative(path.join(ROOT, 'public'), absPath).replace(/\\/g, '/');
  return '/' + rel;
}

try {
  if (!fs.existsSync(MAPS_DIR)) {
    console.warn(`[maps:manifest] Directory not found: ${MAPS_DIR}`);
    process.exit(0);
  }
  const files = walk(MAPS_DIR);
  const items = files.map((abs) => {
    const url = toPublicUrl(abs);
    const base = path.basename(abs);
    const name = path.parse(base).name;
    return {
      name,
      url,
      thumb: url,
      description: ''
    };
  }).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  fs.writeFileSync(OUT_FILE, JSON.stringify({ maps: items }, null, 2));
  console.log(`[maps:manifest] Wrote ${items.length} entries to ${OUT_FILE}`);
} catch (err) {
  console.error('[maps:manifest] Failed:', err);
  process.exit(1);
}
