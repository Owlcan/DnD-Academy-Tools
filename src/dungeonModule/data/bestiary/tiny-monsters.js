export const TINY_MONSTERS = [
  {
    "name": "Darkling-Crawler",
    "size": ["T"],
    "type": "abomination",
    "stats": {
      "size": "tiny",
      "challengeRating": 1,
      "hitPoints": 5,
      "armorClass": 12,
      "speed": {
        "walk": 30,
        "climb": 20
      },
      "str": 3,
      "dex": 14,
      "con": 10,
      "int": 2,
      "wis": 8,
      "cha": 3,
      "attacks": [
        {
          "name": "Bite",
          "type": "Melee Weapon Attack",
          "toHit": 4,
          "reach": 5,
          "damage": "1d4",
          "damageType": "piercing"
        }
      ],
      "abilities": [
        {
          "name": "Pack Tactics",
          "description": "The crawler has advantage on an attack roll against a creature if at least one of the crawler's allies is within 5 feet of the creature and the ally isn't incapacitated."
        }
      ]
    },
    "tokenSize": 1
  },
  {
    "name": "Darkling-Ossokin",
    "size": ["T"],
    "type": "abomination",
    "stats": {
      "size": "tiny",
      "challengeRating": 0.125,
      "hitPoints": 1,
      "armorClass": 11,
      "speed": {
        "walk": 30
      },
      "str": 6,
      "dex": 14,
      "con": 6,
      "int": 3,
      "wis": 10,
      "cha": 2,
      "attacks": [
        {
          "name": "Shin Smack",
          "description": "Melee Weapon Attack: +0 to hit, reach 5 ft., one target. Hit: 1 piercing damage."
        }
      ],
      "abilities": []
    },
    "tokenSize": 1
  },
  {
    "name": "Darkling-Hooter",
    "size": ["T"],
    "type": "abomination",
    "stats": {
      "size": "tiny",
      "challengeRating": 0.125,
      "hitPoints": 1,
      "armorClass": 12,
      "speed": {
        "fly": 25
      },
      "str": 4,
      "dex": 16,
      "con": 8,
      "int": 6,
      "wis": 10,
      "cha": 6,
      "attacks": [
        {
          "name": "Peck",
          "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 1d4 piercing damage."
        }
      ],
      "abilities": [
        {
          "name": "Gutwrenching Hootery",
          "description": "As a bonus action, emits an ear-piercing hoot. Any creature within 25 ft. must succeed on a DC 12 Constitution saving throw or lose its reaction until the end of its next turn."
        }
      ]
    },
    "tokenSize": 1
  }
]; // End of TINY_MONSTERS array
// Compare this snippet from src/dungeonModule/data/bestiary/large-monsters.js: