import { initEncounterUI } from './initEncounterUI';

/**
 * Simple helper to add the encounter UI to the page
 * Can be imported and called from anywhere without modifying App.js
 * 
 * Example:
 * import loadEncounterUI from './encounterModule/encounterLoader';
 * loadEncounterUI(myBestiary);
 */
const loadEncounterUI = (bestiary) => {
  return initEncounterUI(bestiary);
};

export default loadEncounterUI;
