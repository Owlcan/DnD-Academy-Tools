/**
 * DnD Academy Tools - Character Builder
 * This script powers the standalone character builder tool
 */

// Import weapon properties from our main game system
const WEAPON_PROPERTIES = {
  MELEE: {
    'Longsword': { damage: '1d8', damageType: 'slashing', isVersatile: true, versatileDamage: '1d10' },
    'Greatsword': { damage: '2d6', damageType: 'slashing', isTwoHanded: true },
    'Shortsword': { damage: '1d6', damageType: 'piercing', isFinesse: true },
    'Dagger': { damage: '1d4', damageType: 'piercing', isFinesse: true, isLight: true },
    'Battleaxe': { damage: '1d8', damageType: 'slashing', isVersatile: true, versatileDamage: '1d10' },
    'Greataxe': { damage: '1d12', damageType: 'slashing', isTwoHanded: true },
    'Warhammer': { damage: '1d8', damageType: 'bludgeoning', isVersatile: true, versatileDamage: '1d10' },
    'Maul': { damage: '2d6', damageType: 'bludgeoning', isTwoHanded: true },
    'Quarterstaff': { damage: '1d6', damageType: 'bludgeoning', isVersatile: true, versatileDamage: '1d8' }
  },
  RANGED: {
    'Longbow': { damage: '1d8', damageType: 'piercing', range: 150, maxRange: 600, isTwoHanded: true },
    'Shortbow': { damage: '1d6', damageType: 'piercing', range: 80, maxRange: 320, isTwoHanded: true },
    'Heavy Crossbow': { damage: '1d10', damageType: 'piercing', range: 100, maxRange: 400, isTwoHanded: true },
    'Light Crossbow': { damage: '1d8', damageType: 'piercing', range: 80, maxRange: 320, isTwoHanded: true },
    'Hand Crossbow': { damage: '1d6', damageType: 'piercing', range: 30, maxRange: 120, isLight: true },
    'Pistol': { damage: '1d10', damageType: 'piercing', range: 50, maxRange: 150, isLight: true },
    'Musket': { damage: '1d12', damageType: 'piercing', range: 120, maxRange: 360, isTwoHanded: true },
    'Blunderbuss': { damage: '2d8', damageType: 'piercing', range: 15, maxRange: 30, isTwoHanded: true },
    'Hunting Rifle': { damage: '2d10', damageType: 'piercing', range: 150, maxRange: 450, isTwoHanded: true },
    'Blowgun': { damage: '1', damageType: 'piercing', range: 25, maxRange: 100 },
    'Throwing Knives': { damage: '1d4', damageType: 'piercing', range: 20, maxRange: 60, isLight: true, isFinesse: true },
    'Chakram': { damage: '1d6', damageType: 'slashing', range: 30, maxRange: 90, isLight: true },
    'Bolas': { damage: '1d4', damageType: 'bludgeoning', range: 20, maxRange: 60 }
  }
};

// Armor data
const ARMOR_DATA = [
  { name: 'Padded Armor', armor_class: 11, type: 'Light' },
  { name: 'Leather Armor', armor_class: 11, type: 'Light' },
  { name: 'Studded Leather', armor_class: 12, type: 'Light' },
  { name: 'Hide Armor', armor_class: 12, type: 'Medium' },
  { name: 'Chain Shirt', armor_class: 13, type: 'Medium' },
  { name: 'Scale Mail', armor_class: 14, type: 'Medium' },
  { name: 'Breastplate', armor_class: 14, type: 'Medium' },
  { name: 'Half Plate', armor_class: 15, type: 'Medium' },
  { name: 'Ring Mail', armor_class: 14, type: 'Heavy' },
  { name: 'Chain Mail', armor_class: 16, type: 'Heavy' },
  { name: 'Splint', armor_class: 17, type: 'Heavy' },
  { name: 'Plate', armor_class: 18, type: 'Heavy' }
];

// Spells data
const SPELLS_DATA = [
  { name: 'Magic Missile', level: 1, school: 'Evocation', damage: '3d4+3', damageType: 'force' },
  { name: 'Cure Wounds', level: 1, school: 'Evocation', damage: '1d8+3', damageType: 'healing', isHealing: true },
  { name: 'Radiant Lance', level: 0, school: 'Evocation', damage: '2d8', damageType: 'radiant' },
  { name: 'Fireball', level: 3, school: 'Evocation', damage: '8d6', damageType: 'fire' },
  { name: 'Healing Word', level: 1, school: 'Evocation', damage: '1d4+3', damageType: 'healing', isHealing: true },
  { name: 'Guiding Bolt', level: 1, school: 'Evocation', damage: '4d6', damageType: 'radiant' },
  { name: 'Shield', level: 1, school: 'Abjuration' },
  { name: 'Mage Armor', level: 1, school: 'Abjuration' },
  { name: 'Detect Magic', level: 1, school: 'Divination' },
  { name: 'Bless', level: 1, school: 'Enchantment' },
  { name: 'Hunter\'s Mark', level: 1, school: 'Divination', damage: '1d6', damageType: 'weapon' },
  { name: 'Eldritch Blast', level: 0, school: 'Evocation', damage: '1d10', damageType: 'force' },
  { name: 'Fire Bolt', level: 0, school: 'Evocation', damage: '1d10', damageType: 'fire' },
  { name: 'Sacred Flame', level: 0, school: 'Evocation', damage: '1d8', damageType: 'radiant' },
  { name: 'Chill Touch', level: 0, school: 'Necromancy', damage: '1d8', damageType: 'necrotic' }
];

// Character builder state
let character = {
  name: '',
  race: '',
  class: '',
  level: 1,
  attributes: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10
  },
  hit_points: {
    max: 10,
    current: 10
  },
  equipment: {
    weapons: [],
    armor: { name: 'Leather Armor', armor_class: 11 }
  },
  spellcasting: {
    known_spells: []
  }
};

// Current step in the builder process
let currentStep = 1;

// DOM ready function
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the form
  initializeForm();
  
  // Set up step navigation
  setupStepNavigation();
  
  // Initialize attribute modifiers
  updateAttributeModifiers();
  
  // Populate weapon and armor selectors
  populateWeaponSelect();
  populateArmorSelect();
  
  // Populate spell selector
  populateSpellSelect();
});

// Initialize the form with default values
function initializeForm() {
  // Basic info (step 1)
  document.getElementById('charName').value = character.name;
  document.getElementById('charRace').value = character.race;
  document.getElementById('charClass').value = character.class;
  document.getElementById('charLevel').value = character.level;
  
  // Attributes (step 2)
  document.getElementById('attrStr').value = character.attributes.strength;
  document.getElementById('attrDex').value = character.attributes.dexterity;
  document.getElementById('attrCon').value = character.attributes.constitution;
  document.getElementById('attrInt').value = character.attributes.intelligence;
  document.getElementById('attrWis').value = character.attributes.wisdom;
  document.getElementById('attrCha').value = character.attributes.charisma;
  document.getElementById('hitPoints').value = character.hit_points.max;
  
  // Set up event listeners for attribute changes
  const attributeInputs = document.querySelectorAll('.attribute-box input');
  attributeInputs.forEach(input => {
    input.addEventListener('change', updateAttributeModifiers);
  });
  
  // Set up class change listener to toggle spell interface
  document.getElementById('charClass').addEventListener('change', updateSpellInterface);
  
  // Set up level change listener for hit points calculation
  document.getElementById('charLevel').addEventListener('change', updateHitPoints);
  document.getElementById('attrCon').addEventListener('change', updateHitPoints);
}

// Update attribute modifiers when attributes change
function updateAttributeModifiers() {
  // Update each attribute modifier
  updateModifier('attrStr', 'strMod');
  updateModifier('attrDex', 'dexMod');
  updateModifier('attrCon', 'conMod');
  updateModifier('attrInt', 'intMod');
  updateModifier('attrWis', 'wisMod');
  updateModifier('attrCha', 'chaMod');
  
  // Update hit points based on constitution
  updateHitPoints();
}

// Calculate and display a single attribute modifier
function updateModifier(attrId, modId) {
  const attrValue = parseInt(document.getElementById(attrId).value) || 10;
  const modifier = Math.floor((attrValue - 10) / 2);
  const modText = modifier >= 0 ? `+${modifier}` : modifier;
  document.getElementById(modId).textContent = modText;
  
  // Update character object
  const attrName = attrId.replace('attr', '').toLowerCase();
  character.attributes[attrName] = attrValue;
}

// Update hit points based on level and constitution
function updateHitPoints() {
  const level = parseInt(document.getElementById('charLevel').value) || 1;
  const constitution = parseInt(document.getElementById('attrCon').value) || 10;
  const conMod = Math.floor((constitution - 10) / 2);
  const charClass = document.getElementById('charClass').value;
  
  // Set base hit points based on class
  let baseHP = 8; // Default to d8 hit die
  if (charClass === 'Barbarian') {
    baseHP = 12; // d12 hit die
  } else if (charClass === 'Fighter' || charClass === 'Paladin' || charClass === 'Ranger') {
    baseHP = 10; // d10 hit die
  } else if (charClass === 'Wizard' || charClass === 'Sorcerer') {
    baseHP = 6; // d6 hit die
  }
  
  // Calculate hit points: base + (level-1) * (avg hit die) + (level * con mod)
  const avgHitDie = Math.ceil(baseHP / 2) + 1;
  const hitPoints = baseHP + (level - 1) * avgHitDie + (level * conMod);
  
  // Update UI
  document.getElementById('hitPoints').value = hitPoints;
  
  // Update character object
  character.level = level;
  character.hit_points.max = hitPoints;
  character.hit_points.current = hitPoints;
}

// Toggle spell interface based on class selection
function updateSpellInterface() {
  const charClass = document.getElementById('charClass').value;
  const spellSection = document.getElementById('spellSection');
  
  // List of spellcasting classes
  const spellcastingClasses = ['Wizard', 'Cleric', 'Druid', 'Bard', 'Sorcerer', 'Warlock', 'Paladin', 'Ranger'];
  
  // Show spell interface only for spellcasting classes
  if (spellcastingClasses.includes(charClass)) {
    spellSection.style.display = 'block';
    
    // Update spell selection based on class
    filterSpellsByClass(charClass);
  } else {
    spellSection.style.display = 'none';
  }
  
  // Update character object
  character.class = charClass;
}

// Filter and populate spells based on class
function filterSpellsByClass(characterClass) {
  const spellSelect = document.getElementById('spellSelect');
  spellSelect.innerHTML = '<option value="">Add a spell</option>';
  
  // Define which spells are available to each class
  const classSpells = {
    'Wizard': ['Magic Missile', 'Fireball', 'Shield', 'Mage Armor', 'Detect Magic', 'Fire Bolt', 'Chill Touch'],
    'Cleric': ['Cure Wounds', 'Guiding Bolt', 'Detect Magic', 'Bless', 'Shield', 'Sacred Flame', 'Radiant Lance'],
    'Druid': ['Cure Wounds', 'Detect Magic', 'Chill Touch'],
    'Bard': ['Cure Wounds', 'Detect Magic', 'Healing Word', 'Bless'],
    'Sorcerer': ['Magic Missile', 'Fireball', 'Shield', 'Fire Bolt', 'Chill Touch'],
    'Warlock': ['Eldritch Blast', 'Hex', 'Shield', 'Chill Touch'],
    'Paladin': ['Cure Wounds', 'Bless', 'Shield', 'Guiding Bolt'],
    'Ranger': ['Cure Wounds', 'Hunter\'s Mark']
  };
  
  // Get the spell list for this class
  const spells = classSpells[characterClass] || [];
  
  // Add options for each available spell
  spells.forEach(spellName => {
    const spell = SPELLS_DATA.find(s => s.name === spellName);
    if (spell) {
      const levelText = spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`;
      const option = document.createElement('option');
      option.value = spellName;
      option.textContent = `${spellName} (${levelText})`;
      spellSelect.appendChild(option);
    }
  });
}

// Populate weapon selector with options
function populateWeaponSelect() {
  const weaponSelect = document.getElementById('weaponSelect');
  weaponSelect.innerHTML = '<option value="">Add a weapon</option>';
  
  // Add melee weapons
  const meleeGroup = document.createElement('optgroup');
  meleeGroup.label = 'Melee Weapons';
  Object.keys(WEAPON_PROPERTIES.MELEE).forEach(weaponName => {
    const weapon = WEAPON_PROPERTIES.MELEE[weaponName];
    const option = document.createElement('option');
    option.value = weaponName;
    option.textContent = `${weaponName} (${weapon.damage} ${weapon.damageType})`;
    meleeGroup.appendChild(option);
  });
  weaponSelect.appendChild(meleeGroup);
  
  // Add ranged weapons
  const rangedGroup = document.createElement('optgroup');
  rangedGroup.label = 'Ranged Weapons';
  Object.keys(WEAPON_PROPERTIES.RANGED).forEach(weaponName => {
    const weapon = WEAPON_PROPERTIES.RANGED[weaponName];
    const option = document.createElement('option');
    option.value = weaponName;
    option.textContent = `${weaponName} (${weapon.damage} ${weapon.damageType})`;
    rangedGroup.appendChild(option);
  });
  weaponSelect.appendChild(rangedGroup);
}

// Populate armor selector with options
function populateArmorSelect() {
  const armorSelect = document.getElementById('armorSelect');
  armorSelect.innerHTML = '<option value="">Select Armor</option>';
  
  // Group armor by type
  const armorTypes = {
    'Light': [],
    'Medium': [],
    'Heavy': []
  };
  
  // Categorize armor
  ARMOR_DATA.forEach(armor => {
    armorTypes[armor.type].push(armor);
  });
  
  // Add each armor type group
  Object.keys(armorTypes).forEach(type => {
    const group = document.createElement('optgroup');
    group.label = `${type} Armor`;
    
    armorTypes[type].forEach(armor => {
      const option = document.createElement('option');
      option.value = armor.name;
      option.textContent = `${armor.name} (AC ${armor.armor_class})`;
      group.appendChild(option);
    });
    
    armorSelect.appendChild(group);
  });
}

// Populate spell selector with options
function populateSpellSelect() {
  // Initial population will happen when class is selected
  // This is a placeholder for any additional initialization
}

// Add a weapon to the character
function addWeapon() {
  const weaponSelect = document.getElementById('weaponSelect');
  const weaponName = weaponSelect.value;
  
  if (!weaponName) return;
  
  // Look up the weapon data
  let weaponData;
  if (WEAPON_PROPERTIES.MELEE[weaponName]) {
    weaponData = WEAPON_PROPERTIES.MELEE[weaponName];
  } else if (WEAPON_PROPERTIES.RANGED[weaponName]) {
    weaponData = WEAPON_PROPERTIES.RANGED[weaponName];
  }
  
  if (!weaponData) return;
  
  // Create weapon object
  const weapon = {
    name: weaponName,
    damage: weaponData.damage,
    damageType: weaponData.damageType,
    properties: []
  };
  
  // Add weapon properties
  if (weaponData.isFinesse) weapon.properties.push('finesse');
  if (weaponData.isLight) weapon.properties.push('light');
  if (weaponData.isTwoHanded) weapon.properties.push('two-handed');
  if (weaponData.isVersatile) weapon.properties.push('versatile');
  if (weaponData.range) weapon.range = weaponData.range;
  
  // Add to character
  character.equipment.weapons.push(weapon);
  
  // Update UI
  displaySelectedWeapons();
  
  // Reset select
  weaponSelect.value = '';
}

// Display selected weapons in the UI
function displaySelectedWeapons() {
  const selectedWeapons = document.getElementById('selectedWeapons');
  selectedWeapons.innerHTML = '';
  
  character.equipment.weapons.forEach((weapon, index) => {
    const weaponElement = document.createElement('div');
    weaponElement.className = 'selected-item';
    
    // Create weapon display text
    const propertiesText = weapon.properties.length > 0 ? 
      ` (${weapon.properties.join(', ')})` : '';
    
    weaponElement.innerHTML = `
      <span>${weapon.name}: ${weapon.damage} ${weapon.damageType}${propertiesText}</span>
      <button onclick="removeWeapon(${index})">Remove</button>
    `;
    
    selectedWeapons.appendChild(weaponElement);
  });
  
  // Show message if no weapons
  if (character.equipment.weapons.length === 0) {
    selectedWeapons.innerHTML = '<p class="hint">No weapons selected</p>';
  }
}

// Remove a weapon from the character
function removeWeapon(index) {
  character.equipment.weapons.splice(index, 1);
  displaySelectedWeapons();
}

// Change character's armor
function changeArmor() {
  const armorSelect = document.getElementById('armorSelect');
  const armorName = armorSelect.value;
  
  if (!armorName) {
    character.equipment.armor = null;
    document.getElementById('selectedArmor').innerHTML = '<p class="hint">No armor selected</p>';
    return;
  }
  
  // Find armor data
  const armorData = ARMOR_DATA.find(a => a.name === armorName);
  if (!armorData) return;
  
  // Update character
  character.equipment.armor = {
    name: armorData.name,
    armor_class: armorData.armor_class,
    type: armorData.type
  };
  
  // Update UI
  const selectedArmor = document.getElementById('selectedArmor');
  selectedArmor.innerHTML = `
    <div class="selected-item">
      <span>${armorData.name} (AC ${armorData.armor_class})</span>
      <button onclick="changeArmor('')">Remove</button>
    </div>
  `;
}

// Add a spell to the character
function addSpell() {
  const spellSelect = document.getElementById('spellSelect');
  const spellName = spellSelect.value;
  
  if (!spellName) return;
  
  // Check if spell is already selected
  if (character.spellcasting.known_spells.includes(spellName)) {
    alert('You already know this spell!');
    return;
  }
  
  // Add to character
  character.spellcasting.known_spells.push(spellName);
  
  // Update UI
  displaySelectedSpells();
  
  // Reset select
  spellSelect.value = '';
}

// Display selected spells in the UI
function displaySelectedSpells() {
  const selectedSpells = document.getElementById('selectedSpells');
  selectedSpells.innerHTML = '';
  
  character.spellcasting.known_spells.forEach((spellName, index) => {
    const spell = SPELLS_DATA.find(s => s.name === spellName);
    if (!spell) return;
    
    const spellElement = document.createElement('div');
    spellElement.className = 'selected-item';
    
    // Create spell display text
    const levelText = spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`;
    const damageText = spell.damage ? ` (${spell.damage} ${spell.damageType})` : '';
    
    spellElement.innerHTML = `
      <span>${spell.name} - ${levelText}${damageText}</span>
      <button onclick="removeSpell(${index})">Remove</button>
    `;
    
    selectedSpells.appendChild(spellElement);
  });
  
  // Show message if no spells
  if (character.spellcasting.known_spells.length === 0) {
    selectedSpells.innerHTML = '<p class="hint">No spells known</p>';
  }
}

// Remove a spell from the character
function removeSpell(index) {
  character.spellcasting.known_spells.splice(index, 1);
  displaySelectedSpells();
}

// Set up navigation between steps
function setupStepNavigation() {
  // Get all step elements in the progress bar
  const stepElements = document.querySelectorAll('.step');
  
  // Add click handlers to step elements
  stepElements.forEach(step => {
    step.addEventListener('click', () => {
      const stepNum = parseInt(step.getAttribute('data-step'));
      if (stepNum < currentStep) {
        navigateToStep(stepNum);
      }
    });
  });
  
  // Set initial active step
  document.querySelector(`.step[data-step="1"]`).classList.add('active');
}

// Navigate to a specific step
function navigateToStep(stepNum) {
  // Validate step number
  if (stepNum < 1 || stepNum > 5) return;
  
  // Hide all steps
  document.querySelectorAll('.form-step').forEach(step => {
    step.style.display = 'none';
  });
  
  // Show the selected step
  document.getElementById(`step${stepNum}`).style.display = 'block';
  
  // Update active step in progress bar
  document.querySelectorAll('.step').forEach(step => {
    const stepNumber = parseInt(step.getAttribute('data-step'));
    if (stepNumber <= stepNum) {
      step.classList.add('active');
    } else {
      step.classList.remove('active');
    }
  });
  
  // Update current step
  currentStep = stepNum;
}

// Go to the next step
function nextStep(currentStepNum) {
  // Save data from the current step
  saveStepData(currentStepNum);
  
  // If we're on the last step, finalize character
  if (currentStepNum === 4) {
    finalizeCharacter();
  }
  
  // Navigate to the next step
  navigateToStep(currentStepNum + 1);
}

// Go to the previous step
function prevStep(currentStepNum) {
  navigateToStep(currentStepNum - 1);
}

// Save data from the current form step
function saveStepData(stepNum) {
  switch (stepNum) {
    case 1: // Basic info
      character.name = document.getElementById('charName').value;
      character.race = document.getElementById('charRace').value;
      character.class = document.getElementById('charClass').value;
      character.level = parseInt(document.getElementById('charLevel').value);
      break;
      
    case 2: // Attributes
      character.attributes.strength = parseInt(document.getElementById('attrStr').value);
      character.attributes.dexterity = parseInt(document.getElementById('attrDex').value);
      character.attributes.constitution = parseInt(document.getElementById('attrCon').value);
      character.attributes.intelligence = parseInt(document.getElementById('attrInt').value);
      character.attributes.wisdom = parseInt(document.getElementById('attrWis').value);
      character.attributes.charisma = parseInt(document.getElementById('attrCha').value);
      character.hit_points.max = parseInt(document.getElementById('hitPoints').value);
      character.hit_points.current = character.hit_points.max;
      break;
      
    case 3: // Equipment
      // These are saved when the items are added/removed
      // Check if armor is selected
      const armorSelect = document.getElementById('armorSelect');
      if (armorSelect.value) {
        const armorData = ARMOR_DATA.find(a => a.name === armorSelect.value);
        if (armorData) {
          character.equipment.armor = {
            name: armorData.name,
            armor_class: armorData.armor_class,
            type: armorData.type
          };
        }
      }
      break;
      
    case 4: // Spells
      // These are saved when spells are added/removed
      break;
  }
}

// Finalize the character and generate the JSON and URL
function finalizeCharacter() {
  // Update the character summary
  updateCharacterSummary();
  
  // Generate the JSON and URL
  generateCharacterData();
}

// Update the character summary display
function updateCharacterSummary() {
  // Update basic info
  document.getElementById('summaryName').textContent = character.name || 'Unnamed Character';
  document.getElementById('summaryBasics').textContent = 
    `Level ${character.level} ${character.race} ${character.class}`;
  
  // Update attributes
  const attrSummary = document.getElementById('summaryAttributes');
  attrSummary.innerHTML = '';
  
  Object.entries(character.attributes).forEach(([attr, value]) => {
    const mod = Math.floor((value - 10) / 2);
    const modText = mod >= 0 ? `+${mod}` : mod;
    
    const attrElement = document.createElement('div');
    attrElement.className = 'attribute-item';
    attrElement.innerHTML = `
      <span>${attr.substring(0, 3).toUpperCase()}: ${value}</span>
      <span class="modifier">(${modText})</span>
    `;
    
    attrSummary.appendChild(attrElement);
  });
  
  // Update equipment
  const equipSummary = document.getElementById('summaryEquipment');
  equipSummary.innerHTML = '';
  
  // Add armor
  const armorHtml = character.equipment.armor 
    ? `<p><strong>Armor:</strong> ${character.equipment.armor.name} (AC ${character.equipment.armor.armor_class})</p>`
    : '<p><strong>Armor:</strong> None</p>';
  
  equipSummary.innerHTML += armorHtml;
  
  // Add weapons
  equipSummary.innerHTML += '<p><strong>Weapons:</strong></p>';
  
  if (character.equipment.weapons.length === 0) {
    equipSummary.innerHTML += '<p>No weapons</p>';
  } else {
    const weaponList = document.createElement('ul');
    character.equipment.weapons.forEach(weapon => {
      const propertiesText = weapon.properties.length > 0 ? 
        ` (${weapon.properties.join(', ')})` : '';
      
      const item = document.createElement('li');
      item.textContent = `${weapon.name}: ${weapon.damage} ${weapon.damageType}${propertiesText}`;
      weaponList.appendChild(item);
    });
    equipSummary.appendChild(weaponList);
  }
  
  // Update spells
  const spellsSummary = document.getElementById('summarySpells');
  const spellsSection = document.getElementById('summarySpellsSection');
  
  if (character.spellcasting.known_spells.length === 0) {
    spellsSection.style.display = 'none';
  } else {
    spellsSection.style.display = 'block';
    spellsSummary.innerHTML = '';
    
    const spellList = document.createElement('ul');
    character.spellcasting.known_spells.forEach(spellName => {
      const spell = SPELLS_DATA.find(s => s.name === spellName);
      if (!spell) return;
      
      const levelText = spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`;
      const damageText = spell.damage ? ` (${spell.damage} ${spell.damageType})` : '';
      
      const item = document.createElement('li');
      item.textContent = `${spell.name} - ${levelText}${damageText}`;
      spellList.appendChild(item);
    });
    
    spellsSummary.appendChild(spellList);
  }
}

// Generate character data as JSON and URL
function generateCharacterData() {
  // Create the JSON string
  const characterJson = JSON.stringify(character);
  
  // Create the data URL
  const dataUrl = 'data:text/json;charset=utf-8,' + encodeURIComponent(characterJson);
  
  // Update the UI
  document.getElementById('characterUrl').value = dataUrl;
}

// Download character as JSON file
function downloadCharacter() {
  const dataUrl = document.getElementById('characterUrl').value;
  if (!dataUrl) return;
  
  // Create filename based on character name
  const fileName = (character.name || 'character').replace(/\s+/g, '_').toLowerCase() + '.json';
  
  // Create download link
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Copy character URL to clipboard
function copyCharacterUrl() {
  const urlInput = document.getElementById('characterUrl');
  urlInput.select();
  document.execCommand('copy');
  
  // Show feedback
  alert('Character URL copied to clipboard!');
}

// Reset the form and create a new character
function resetForm() {
  // Reset character object
  character = {
    name: '',
    race: '',
    class: '',
    level: 1,
    attributes: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10
    },
    hit_points: {
      max: 10,
      current: 10
    },
    equipment: {
      weapons: [],
      armor: { name: 'Leather Armor', armor_class: 11 }
    },
    spellcasting: {
      known_spells: []
    }
  };
  
  // Reset form fields
  initializeForm();
  
  // Go back to step 1
  navigateToStep(1);
}

// Show help modal
function showHelp() {
  document.getElementById('helpModal').style.display = 'block';
}

// Close help modal
function closeHelp() {
  document.getElementById('helpModal').style.display = 'none';
}