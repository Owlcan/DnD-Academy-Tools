export const MEDIUM_MONSTERS = [
  {
    "name": "Darkling-Nightshade Elemental",
    "size": ["M"],
    "type": "elemental",
    "stats": {
      "size": "medium",
      "challengeRating": 2,
      "hitPoints": 24,
      "armorClass": 14,
      "speed": {
        "walk": 30
      },
      "str": 14,
      "dex": 16,
      "con": 14,
      "int": 6,
      "wis": 12,
      "cha": 8,
      "attacks": [
        {
          "name": "Shadow Swipe",
          "type": "Melee Weapon Attack",
          "toHit": 4,
          "reach": 5,
          "damage": "2d6+2",
          "damageType": "necrotic",
          "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 2d6+2 necrotic damage."
        }
      ],
      "abilities": [
        {
          "name": "Eerie Brown Note",
          "description": "Any creature within 25 ft. that witnesses it channel its shadow energy must succeed on a DC 14 Constitution saving throw or lose their reaction until the end of their next turn."
        }
      ]
    },
    "tokenSize": 1
  },
  {
    "name": "Darkforme-Ossokin-Aegisite",
    "size": ["M"],
    "type": "abomination",
    "stats": {
      "size": "medium",
      "challengeRating": 3,
      "hitPoints": 101,
      "armorClass": 16,
      "speed": {
        "walk": 30
      },
      "str": 15,
      "dex": 10,
      "con": 16,
      "int": 6,
      "wis": 12,
      "cha": 6,
      "attacks": [
        {
          "name": "Bone Slam",
          "type": "Melee Weapon Attack",
          "toHit": 4,
          "reach": 5,
          "damage": "1d8+2",
          "damageType": "bludgeoning",
          "description": "A fierce slam using its bony mass."
        }
      ],
      "abilities": [
        {
          "name": "Bony Bulwark",
          "description": "Grants itself temporary hit points equal to its proficiency bonus. Also, one adjacent ally receives +2 AC until its next turn."
        }
      ]
    },
    "tokenSize": 1
  },
  {
    "name": "The Darkformless",
    "size": ["M"],
    "type": "abomination elemental mage",
    "stats": {
      "size": "medium",
      "challengeRating": 4,
      "hitPoints": 36,
      "armorClass": 15,
      "speed": {
        "walk": 30
      },
      "str": 10,
      "dex": 14,
      "con": 14,
      "int": 16,
      "wis": 12,
      "cha": 14,
      "attacks": [
        {
          "name": "Shadow Bolt",
          "type": "Ranged Spell Attack",
          "toHit": 5,
          "range": "60",
          "damage": "2d8",
          "damageType": "necrotic",
          "description": "Ranged Spell Attack: +5 to hit, range 60 ft., one target. Hit: 2d8 necrotic damage."
        },
        {
          "name": "Umbral Blast",
          "description": "Releases a burst of dark energy; each creature within 10 ft. must succeed on a DC 14 Dexterity saving throw or take 1d8 necrotic damage."
        }
      ],
      "abilities": [
        {
          "name": "Unsettling Brown Note",
          "description": "Any creature within 25 ft. that witnesses its dark magic must succeed on a DC 14 Constitution saving throw or lose their reaction until the end of their next turn."
        },
        {
          "name": "Umbral Empowerment",
          "description": "As a bonus action, it can grant an allied darkling within 30 ft. temporary hit points equal to its Intelligence modifier (minimum 1) or add +2 to that ally's next attack roll until the start of its next turn."
        }
      ]
    },
    "tokenSize": 1
  },
  {
    "name": "Darkforme-Cactine Spinebearer",
    "size": ["M"],
    "type": "abomination",
    "stats": {
      "size": "medium",
      "challengeRating": 3,
      "hitPoints": 40,
      "armorClass": 15,
      "speed": {
        "walk": 30
      },
      "str": 16,
      "dex": 12,
      "con": 14,
      "int": 8,
      "wis": 12,
      "cha": 8,
      "attacks": [
        {
          "name": "Spike Jab",
          "type": "Melee Weapon Attack",
          "toHit": 5,
          "reach": 5,
          "damage": "1d8+3",
          "damageType": "piercing"
        },
        {
          "name": "Spine Barrage",
          "type": "Ranged Weapon Attack",
          "toHit": 5,
          "range": "30/60",
          "damage": "2d6+1",
          "damageType": "piercing",
          "description": "The Spinebearer launches spines at up to two targets within range."
        }
      ],
      "abilities": [
        {
          "name": "Thorned Defense",
          "description": "When a creature within 5 ft. hits the Spinebearer with a melee attack, the attacker takes 1d6 piercing damage."
        },
        {
          "name": "Reinforced Grapple",
          "description": "While grappling a creature, the Spinebearer may use a bonus action to deal an extra 2d6 piercing damage."
        }
      ]
    },
    "tokenSize": 1
  },
  {
    "name": "Darkforme-Nightpinyon",
    "size": ["M"],
    "type": "abomination",
    "stats": {
      "size": "medium",
      "challengeRating": 2,
      "hitPoints": 20,
      "armorClass": 14,
      "speed": {
        "fly": 45
      },
      "str": 12,
      "dex": 16,
      "con": 12,
      "int": 8,
      "wis": 14,
      "cha": 8,
      "attacks": [
        {
          "name": "Debilitating Peck",
          "type": "Melee Weapon Attack",
          "toHit": 5,
          "reach": 5,
          "damage": "1d8+2",
          "damageType": "piercing",
          "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 1d8+2 piercing damage. The target is overwhelmed by a brown note effect and loses its reaction until the end of its next turn."
        }
      ],
      "abilities": []
    },
    "tokenSize": 1
  }
];