/**
 * Wrapper file for bestiary data to avoid import issues
 * This centralizes monster data imports from various bestiary files
 */

// Import monster data from individual files
import { TINY_MONSTERS } from './bestiary/tiny-monsters.js';
import { SMALL_MONSTERS } from './bestiary/small-monsters.js';
import { MEDIUM_MONSTERS } from './bestiary/medium-monsters.js';
import { LARGE_MONSTERS } from './bestiary/large-monsters.js';
import { HUGE_MONSTERS } from './bestiary/huge-monsters.js';

// Create a consolidated bestiary array containing all monster categories
// Ensure the first element has a 'creatures' property that is a flat array of all monsters
export const BESTIARY = [
  {
    category: "Monsters",
    creatures: [
      ...TINY_MONSTERS, 
      ...SMALL_MONSTERS,
      ...MEDIUM_MONSTERS,
      ...LARGE_MONSTERS, 
      ...HUGE_MONSTERS
    ]
  }
];

// Make sure this is a non-empty array with proper structure
console.log(`Loaded ${BESTIARY[0]?.creatures?.length || 0} monsters into bestiary`);
console.log(`Monster sizes in bestiary: Tiny: ${TINY_MONSTERS.length}, Small: ${SMALL_MONSTERS.length}, Medium: ${MEDIUM_MONSTERS.length}, Large: ${LARGE_MONSTERS.length}, Huge: ${HUGE_MONSTERS.length}`);

// For debug purposes, log the first monster from each size category
if (TINY_MONSTERS.length > 0) console.log('First tiny monster:', TINY_MONSTERS[0].name);
if (SMALL_MONSTERS.length > 0) console.log('First small monster:', SMALL_MONSTERS[0].name);
if (MEDIUM_MONSTERS.length > 0) console.log('First medium monster:', MEDIUM_MONSTERS[0].name);
if (LARGE_MONSTERS.length > 0) console.log('First large monster:', LARGE_MONSTERS[0].name);
if (HUGE_MONSTERS.length > 0) console.log('First huge monster:', HUGE_MONSTERS[0].name);