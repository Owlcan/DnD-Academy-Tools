// Utility functions for handling items in the dungeon

/**
 * Categorizes items by rarity based on their category property
 * @returns {Object} Object with common, uncommon, and rare item lists
 */
export const categorizeItemsByRarity = () => {
  // Initialize empty arrays for each rarity
  const common = [];
  const uncommon = [];
  const rare = [];
  
  // Define the master items list directly here
  // Items from the master-items file are incorporated here
  const masterItems = [
    {
      name: 'Adhesive',
      description: 'A highly effective, sticky substance with powerful bonding properties, ideal for uniting disparate materials into one cohesive whole.',
      category: 'essence'
    },
    {
      name: 'Azure Moon Cream',
      description: 'Legendary cream harvested under a blue moon. Glows with ethereal light.',
      category: 'legendary'
    },
    {
      name: 'Barkgum',
      description: 'A sticky and rubbery organic compound refined from the sap of certain types of trees. It is used as a base to make an enormous array of products from chewing-gum to glue to rubber.',
      category: 'botanical'
    },
    {
      name: 'Berrimaters',
      description: 'Small, round, savory and sweet, these cherry-red little guys are awfully fun to eat! And they pair well with many treats, so you can flex your cooking feats!',
      category: 'botanical'
    },
    {
      name: 'Butter',
      description: 'Smooth, creamy butter, perfect for cooking.',
      category: 'food'
    },
    {
      name: 'Cotton Fluff',
      description: 'A soft, airy fluff derived from cotton fibers, cherished for its light, cushioning properties and gentle texture.',
      category: 'textile crafted'
    },
    {
      name: 'Cream',
      description: 'Fresh dairy cream, essential for making ice cream and other desserts.',
      category: 'food'
    },
    {
      name: 'Clear Crystal',
      description: 'A small, transparent crystal with weak magical properties.',
      category: 'crystal'
    },
    {
      name: 'Darkessence',
      description: 'A mysterious, shadow-infused essence that exudes an aura of hidden power, often employed in dark magical rites.',
      category: 'legendary reagent'
    },
    {
      name: 'Egg',
      description: 'A common binding agent used in cooking and baking.',
      category: 'food'
    },
    {
      name: 'Water Essence',
      description: 'The distilled magical essence of water.',
      category: 'essence'
    },
    {
      name: 'Health Potion',
      description: 'A basic healing potion that restores vitality.',
      category: 'potion'
    },
    {
      name: 'Common Herb',
      description: 'A common herb found in meadows and forests.',
      category: 'herb'
    },
    {
      name: 'Phoenix Feather',
      description: 'A rare feather from a phoenix, containing immense magical energy.',
      category: 'legendary'
    },
    {
      name: 'Lunar-Dodo Egg',
      description: 'An egg from the rare Lunar-Dodo bird. Emits a soft blue glow.',
      category: 'legendary'
    },
    {
      name: 'Iron Dust',
      description: 'Fine iron particles with minor alchemical uses.',
      category: 'metal'
    },
    {
      name: 'Distillation of a Night Sky',
      description: 'The essence of a perfect night sky captured in a bottle. Contains stardust and dreams.',
      category: 'legendary'
    },
    {
      name: 'Petrodistillate',
      description: 'A refined, volatile extract from crude oil, known for its flammable characteristics and use in catalyzing various reactions.',
      category: 'essence'
    },
    {
      name: 'Robusca',
      description: 'A dense, robust crystalline alloy prized for its exceptional strength and durability, ideal for crafting heavy-duty tools and resilient structures.',
      category: 'crystal'
    },
    {
      name: 'Rock Salt',
      description: 'Crystallized salt with preservative properties.',
      category: 'crystal'
    },
    {
      name: 'Savoury Herb',
      description: 'A fragrant herb with a strong taste, perfect for cooking.',
      category: 'herb'
    },
    {
      name: 'Solvent',
      description: 'A volatile liquid compound known for its ability to dissolve and extract substances, essential in various alchemical and industrial processes.',
      category: 'essence'
    },
    {
      name: 'Star Sugar',
      description: 'Crystallized sweetness that fell from the stars. Sparkles with cosmic energy.',
      category: 'legendary'
    },
    {
      name: 'Starsoaked Vanilla',
      description: 'Vanilla beans that have been bathed in starlight for a full lunar cycle.',
      category: 'legendary'
    },
    {
      name: 'White Sugar',
      description: 'Refined sugar that adds sweetness to any recipe.',
      category: 'food'
    },
    {
      name: 'Touch of Love',
      description: 'A magical essence that imbues items with care and affection.',
      category: 'exotic'
    },
    {
      name: 'Turbinado Sugar',
      description: 'A magical sugar with extraordinary properties.',
      category: 'food legendary'
    },
    {
      name: 'Vanilla',
      description: 'A fragrant flavoring extracted from vanilla pods.',
      category: 'botanical'
    },
    {
      name: 'Vanilla Ice Cream',
      description: 'The tried and true classic. Almost no one can mess this up- delicious even when it turns to soup!',
      category: 'food'
    },
    {
      name: 'Vitalium',
      description: 'A shimmering metal imbued with the essence of life, frequently harnessed to empower enchanting constructs and devices.',
      category: 'crystal exotic'
    },
    {
      name: 'Vitalocanum',
      description: 'A potent compound derived from Vitalium, renowned for its ability to bridge the gap between vitality and arcane energies.',
      category: 'crystal exotic'
    },
    {
      name: 'Yarn',
      description: 'Finely spun fiber used in weaving and knitting, prized for its delicate texture and potential enchantments in crafted garments.',
      category: 'textile'
    },
    // Add standard D&D adventure gear items
    {
      name: "Potion of Healing",
      description: "A red potion that restores 2d4+2 hit points when consumed.",
      category: "potion"
    },
    {
      name: "Torch",
      description: "A wooden stick with one end wrapped in cloth soaked in pitch.",
      category: "gear"
    },
    {
      name: "Rope (50 ft)",
      description: "Strong hempen rope that can support up to 2000 pounds.",
      category: "gear" 
    },
    {
      name: "Flint and Steel",
      description: "Used to start fires with combustible materials.",
      category: "gear"
    },
    {
      name: "Bedroll",
      description: "A portable bed roll for sleeping outdoors.",
      category: "gear"
    },
    {
      name: "Backpack",
      description: "A sturdy leather backpack for carrying equipment.",
      category: "gear"
    },
    {
      name: "Quiver",
      description: "A container for holding arrows.",
      category: "gear"
    },
    {
      name: "Arrows (20)",
      description: "Standard wooden arrows with metal tips.",
      category: "ammunition"
    },
    {
      name: "Waterskin",
      description: "A container for holding water, holds 4 pints.",
      category: "gear"
    },
    {
      name: "Rations (1 day)",
      description: "Dried meat, fruit and nuts for one day.",
      category: "food"
    },
    {
      name: "Caltrops",
      description: "Spikes that can slow pursuing enemies.",
      category: "gear"
    },
    {
      name: "Chalk",
      description: "Used for marking surfaces.",
      category: "gear"
    },
    {
      name: "Crowbar",
      description: "A metal bar used for prying things open.",
      category: "tool"
    },
    {
      name: "Hammer",
      description: "Used for pounding nails into wood or stone.",
      category: "tool"
    },
    {
      name: "Piton",
      description: "A metal spike used for climbing.",
      category: "gear"
    },
    {
      name: "Lantern",
      description: "A hooded lantern that burns oil for light.",
      category: "gear"
    },
    {
      name: "Oil Flask",
      description: "A flask of oil, can be used as fuel or thrown as a weapon.",
      category: "gear"
    },
    {
      name: "Small Mirror",
      description: "A small mirror with a metal or wooden frame.",
      category: "gear"
    },
    {
      name: "Fishing Tackle",
      description: "A set of hooks, line and small weights for fishing.",
      category: "tool"
    },
    {
      name: "Thieves' Tools",
      description: "A set of tools for picking locks and disabling traps.",
      category: "tool"
    }
  ];

  // Process the master item list
  masterItems.forEach(item => {
    // Skip if no category is provided
    if (!item.category) return;
    
    const category = item.category.toLowerCase();
    
    // Categorize based on item category
    if (category.includes('legendary') || category.includes('exotic') || category.includes('rare')) {
      // Rare items: legendary, exotic, rare
      rare.push(item);
    } else if (category.includes('crystal') || category.includes('essence') || category.includes('metal')) {
      // Uncommon items: crystal, essence, metal (without legendary/exotic)
      if (!category.includes('legendary') && !category.includes('exotic') && !category.includes('rare')) {
        uncommon.push(item);
      } else {
        rare.push(item);
      }
    } else if (category.includes('food') || category.includes('textile') || category.includes('crafted') || 
              category.includes('botanical') || category.includes('herb') || 
              category.includes('gear') || category.includes('tool') || category.includes('ammunition')) {
      // Common items: food, textile, crafted, botanical, herb, gear, tools (without legendary/exotic)
      if (!category.includes('legendary') && !category.includes('exotic') && !category.includes('rare')) {
        common.push(item);
      } else {
        // If it has both common category and rare keyword, put in uncommon
        uncommon.push(item);
      }
    } else {
      // Default to common if not matching other categories
      common.push(item);
    }
  });
  
  return { common, uncommon, rare };
};

/**
 * Gets items based on treasure rarity
 * @param {string} rarity - The rarity of the treasure chest 'common' or 'rare'
 * @param {number} count - Number of items to return
 * @returns {Array} List of items
 */
export const getTreasureItems = (rarity = 'common', count = 1) => {
  const { common, uncommon, rare } = categorizeItemsByRarity();
  
  // Create pools based on chest rarity
  let itemPool = [];
  
  if (rarity === 'common') {
    // Common chests can contain common (70%) and uncommon (30%) items
    itemPool = [...common, ...common, ...common, ...common, ...common, ...common, ...common, ...uncommon, ...uncommon, ...uncommon];
  } else if (rarity === 'rare') {
    // Rare chests can contain uncommon (60%) and rare (40%) items
    itemPool = [...uncommon, ...uncommon, ...uncommon, ...uncommon, ...uncommon, ...uncommon, ...rare, ...rare, ...rare, ...rare];
  }
  
  // Ensure we have items to select from
  if (itemPool.length === 0) {
    return [{
      name: "Mysterious Object",
      description: "An unknown object of curious design.",
      category: "unknown"
    }];
  }
  
  // Select random items
  const result = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * itemPool.length);
    result.push(itemPool[randomIndex]);
  }
  
  return result;
};