  // Add entity to the dungeon
  const addEntity = (x, y, type, properties = {}) => {
    // Clone current dungeon state
    const updatedDungeon = {...dungeon};
    
    // Initialize entities array if it doesn't exist
    if (!updatedDungeon.entities) {
      updatedDungeon.entities = [];
    }
    
    // Create new entity
    const newEntity = {
      id: `entity_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type,
      x,
      y,
      properties
    };
    
    // Get token size from monster data if applicable
    if (type === 'monster' && properties.monsterData) {
      const monsterData = properties.monsterData;
      
      // Check for explicit tokenSize property
      if (monsterData.tokenSize) {
        newEntity.properties.tokenSize = monsterData.tokenSize;
      }
      // Check for size code in array
      else if (monsterData.size && Array.isArray(monsterData.size) && monsterData.size.length > 0) {
        const sizeCode = monsterData.size[0];
        if (sizeCode === 'G') newEntity.properties.tokenSize = 4;      // Gargantuan
        else if (sizeCode === 'H') newEntity.properties.tokenSize = 3; // Huge
        else if (sizeCode === 'L') newEntity.properties.tokenSize = 2; // Large
        else newEntity.properties.tokenSize = 1;                       // Medium or smaller
      }
      // Check text size in stats
      else if (monsterData.stats && monsterData.stats.size) {
        const sizeText = monsterData.stats.size.toLowerCase();
        if (sizeText === 'gargantuan') newEntity.properties.tokenSize = 4;
        else if (sizeText === 'huge') newEntity.properties.tokenSize = 3;
        else if (sizeText === 'large') newEntity.properties.tokenSize = 2;
        else newEntity.properties.tokenSize = 1; // Medium, Small, or Tiny
      }
    }
    
    // Add entity to array
    updatedDungeon.entities.push(newEntity);
    
    // Update dungeon state
    setDungeon(updatedDungeon);
  };