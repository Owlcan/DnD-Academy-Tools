/**
 * Converts complex bestiary format to simplified monster objects
 * that work with the token rendering system
 */
export function convertBestiaryToSimple(bestiary) {
  const simplifiedMonsters = [];
  
  if (!bestiary || !bestiary.length || !bestiary[0].monster) {
    console.error('Invalid bestiary format');
    return [];
  }
  
  // Process each monster in the bestiary
  bestiary[0].monster.forEach(monster => {
    try {
      // Extract basic monster info
      const simplifiedMonster = {
        name: monster.name,
        size: monster.size || [],
        type: monster.type || 'unknown',
        stats: {
          size: getSizeText(monster.size?.[0] || 'M'),
          challengeRating: getChallengeRating(monster.cr),
          hitPoints: monster.hp?.average || 10,
          armorClass: monster.ac?.[0]?.ac || 10,
          speed: convertSpeed(monster.speed || {}),
          str: monster.str || 10,
          dex: monster.dex || 10,
          con: monster.con || 10,
          int: monster.int || 10, 
          wis: monster.wis || 10,
          cha: monster.cha || 10,
          attacks: convertAttacks(monster.action || []),
          abilities: convertAbilities(monster.trait || [])
        },
        tokenSize: getTokenSize(monster.size?.[0] || 'M')
      };
      
      simplifiedMonsters.push(simplifiedMonster);
    } catch (err) {
      console.error(`Error converting monster: ${monster.name}`, err);
    }
  });
  
  return simplifiedMonsters;
}

// Convert size code to text
function getSizeText(sizeCode) {
  const sizeMap = {
    'T': 'tiny',
    'S': 'small', 
    'M': 'medium',
    'L': 'large',
    'H': 'huge',
    'G': 'gargantuan'
  };
  return sizeMap[sizeCode] || 'medium';
}

// Get token size based on creature size
function getTokenSize(sizeCode) {
  const tokenSizeMap = {
    'T': 1,
    'S': 1,
    'M': 1,
    'L': 2,
    'H': 3,
    'G': 4
  };
  return tokenSizeMap[sizeCode] || 1;
}

// Convert CR string to number
function getChallengeRating(cr) {
  if (!cr) return 0;
  
  // Handle fractional CRs
  if (cr.includes('/')) {
    const [num, denom] = cr.split('/').map(Number);
    return num / denom;
  }
  
  return Number(cr) || 0;
}

// Convert speed object
function convertSpeed(speedObj) {
  const result = {};
  
  // Convert each speed type
  for (const [type, value] of Object.entries(speedObj)) {
    // Handle string values (which might have quotes)
    if (typeof value === 'string') {
      result[type] = parseInt(value.replace(/"/g, '')) || 0;
    } else {
      result[type] = value;
    }
  }
  
  return result;
}

// Convert monster actions to attacks
function convertAttacks(actions) {
  if (!actions || !actions.length) return [];
  
  return actions.map(action => {
    // Parse attack bonus and damage from text if available
    let toHit = 0;
    let damage = '';
    let damageType = '';
    
    // Try to extract attack bonus
    const toHitMatch = action.entries?.[0]?.match(/\+(\d+) to hit/);
    if (toHitMatch) {
      toHit = parseInt(toHitMatch[1]);
    }
    
    // Try to extract damage
    const damageMatch = action.entries?.[0]?.match(/Hit: (?:\d+ \()?([\dd+]+)(?: *\))?( [a-z]+)? damage/i);
    if (damageMatch) {
      damage = damageMatch[1];
      damageType = (damageMatch[2] || '').trim();
    }
    
    return {
      name: action.name,
      description: action.entries?.[0] || '',
      toHit: toHit,
      damage: damage,
      damageType: damageType
    };
  });
}

// Convert monster traits to abilities
function convertAbilities(traits) {
  if (!traits || !traits.length) return [];
  
  return traits.map(trait => {
    return {
      name: trait.name,
      description: trait.entries?.[0] || ''
    };
  });
}