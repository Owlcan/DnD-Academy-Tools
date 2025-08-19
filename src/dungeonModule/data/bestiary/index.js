import { TINY_MONSTERS } from './tiny-monsters';
import { SMALL_MONSTERS } from './small-monsters';
import { MEDIUM_MONSTERS } from './medium-monsters';
import { LARGE_MONSTERS } from './large-monsters';
import { HUGE_MONSTERS } from './huge-monsters';

// Flatten any nested arrays in the monster lists
const flattenMonsterList = (monsterList) => {
  if (!monsterList) return [];
  return Array.isArray(monsterList[0]) ? monsterList.flat() : monsterList;
};

// Flatten all monster arrays
const tinyMonsters = flattenMonsterList(TINY_MONSTERS);
const smallMonsters = flattenMonsterList(SMALL_MONSTERS);
const mediumMonsters = flattenMonsterList(MEDIUM_MONSTERS);
const largeMonsters = flattenMonsterList(LARGE_MONSTERS);
const hugeMonsters = flattenMonsterList(HUGE_MONSTERS);

// Combine all monsters into one array for the BESTIARY format
const allMonsters = [
  ...tinyMonsters,
  ...smallMonsters,
  ...mediumMonsters,
  ...largeMonsters,
  ...hugeMonsters
];

// Format for compatibility with existing code
export const BESTIARY = [
  {
    "creatures": allMonsters,
    "_meta": {
      "sources": [
        {
          "json": "Combat-Academy-Main-Bestiary",
          "abbreviation": "M B",
          "full": "Main Bestiary",
          "url": "",
          "authors": ["Combat-Academy"],
          "convertedBy": []
        }
      ]
    }
  }
];

// Also export the categorized monsters
export const CATEGORIZED_MONSTERS = {
  tiny: tinyMonsters,
  small: smallMonsters,
  medium: mediumMonsters,
  large: largeMonsters,
  huge: hugeMonsters
};