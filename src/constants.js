export const availableMaps = [
  {
    name: 'Bottletop Hill',
    url: 'https://i.postimg.cc/85TTD1VJ/bottletop-hill.jpg',
    thumb: 'https://i.postimg.cc/85TTD1VJ/bottletop-hill.jpg',
    description: 'A hilltop battlefield'
  },
  {
    name: 'Class-Battle',
    url: 'https://i.postimg.cc/2yWBYBvN/Class-Battle.png',
    thumb: 'https://i.postimg.cc/2yWBYBvN/Class-Battle.png',
    description: 'A classroom turned battlefield'
  },
  {
    name: 'Fields-of-Battle',
    url: 'https://i.postimg.cc/ydkZfG8d/Fields-of-Battle.jpg',
    thumb: 'https://i.postimg.cc/ydkZfG8d/Fields-of-Battle.jpg',
    description: 'Open field battlefield'
  },
  {
    name: 'Frozen-Fighting-Foray',
    url: 'https://i.postimg.cc/bNZpqC4T/Frozen-Fighting-Foray.jpg',
    thumb: 'https://i.postimg.cc/bNZpqC4T/Frozen-Fighting-Foray.jpg',
    description: 'A frozen battlefield'
  },
  {
    name: 'Isle-of-Dawn',
    url: 'https://i.postimg.cc/pr6vDz5z/Isle-of-Dawn.jpg',
    thumb: 'https://i.postimg.cc/pr6vDz5z/Isle-of-Dawn.jpg',
    description: 'An island battlefield at dawn'
  },
  {
    name: 'Land-Sea-Cliff-and-Sky',
    url: 'https://i.postimg.cc/26MBgx1x/Land-Sea-Cliff-and-Sky.png',
    thumb: 'https://i.postimg.cc/26MBgx1x/Land-Sea-Cliff-and-Sky.png',
    description: 'A coastal cliff battlefield'
  },
  {
    name: 'Seafaring-Strike',
    url: 'https://i.postimg.cc/05W9RRXj/Seafaring-Strike.jpg',
    thumb: 'https://i.postimg.cc/05W9RRXj/Seafaring-Strike.jpg',
    description: 'A naval battlefield'
  },
  {
    name: 'Trap-Dungeon',
    url: 'https://i.postimg.cc/VN7tWw1p/Trap-Dungeon.png',
    thumb: 'https://i.postimg.cc/VN7tWw1p/Trap-Dungeon.png',
    description: 'A dungeon battlefield with traps'
  },
  {
    name: 'Abandonton',
    url: '/assets/maps/battlefields/Abandonton.jpg',
    thumb: '/assets/maps/battlefields/Abandonton.jpg',
    description: 'A derelict town abandoned to time'
  },
  {
    name: 'Desert-Worship',
    url: '/assets/maps/battlefields/Desert Worship.jpg',
    thumb: '/assets/maps/battlefields/Desert Worship.jpg',
    description: 'An ancient temple lost to the sands'
  }
];

export const monsterImageMappingManual = {
  "Darkform Enforcer": "https://i.postimg.cc/15fLxnLn/Darkform-Enforcer.png",
  "Darkforme Overwatch": "https://i.postimg.cc/MZshrbrJ/Darkforme-Overwatch.png",
  "Darkforme-Cavesweller": "https://i.postimg.cc/jdmBRqb8/Darkforme-Cavesweller.png",
};

export const conditionSymbols = {
  poison: { symbol: "☣", color: "green" },
  rage: { symbol: "🔥", color: "red" },
  confusion: { symbol: "❓", color: "yellow" },
  fear: { symbol: "😱", color: "yellow" },
  sleeping: { symbol: "Z", color: "purple" },
  death: { symbol: "☠", color: "grey" },
};

export const weatherOptions = [
  { id: 'rain', label: 'Rain' },
  { id: 'snow', label: 'Snow & Cold' },
  { id: 'miasma', label: 'Miasma' },
  { id: 'timeMagic', label: 'Time Magic' },
  { id: 'heat', label: 'Heat Wave' },
  { id: 'night', label: 'Night' },
  { id: 'fog', label: 'Fog' },
];

export const defaultPlayerTokens = {
  femme: [
    { type: 'Adventurer', count: 20 },
    { type: 'Warrior', count: 20 },
    { type: 'Rogue', count: 20 },
    { type: 'Mage', count: 20 }
  ],
  masc: [
    { type: 'Adventurer', count: 20 },
    { type: 'Warrior', count: 20 },
    { type: 'Rogue', count: 20 },
    { type: 'Mage', count: 20 }
  ]
};
