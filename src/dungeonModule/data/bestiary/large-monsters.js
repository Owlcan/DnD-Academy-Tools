export const LARGE_MONSTERS = [
    {
        "name": "Darkform Enforcer",
        "size": ["L"],
        "type": "abomination",
        "stats": {
          "size": "large",
          "challengeRating": 5,
          "hitPoints": 96,
          "armorClass": 16,
          "speed": {
            "walk": 30
          },
          "str": 22,
          "dex": 14,
          "con": 16,
          "int": 14,
          "wis": 12,
          "cha": 12,
          "attacks": [
            {
              "name": "Tendril Barrage",
              "type": "Melee Weapon Attack",
              "toHit": 8,
              "reach": 15,
              "damage": "1d8+6",
              "damageType": "slashing",
              "description": "The Enforcer makes three tendril attacks, targeting up to 3 creatures."
            },
            {
              "name": "Pound",
              "type": "Melee Weapon Attack",
              "toHit": 8,
              "reach": 5,
              "damage": "3d10+6",
              "damageType": "bludgeoning",
              "description": "A devastating close-range attack."
            }
          ],
          "abilities": [
            {
              "name": "Degenerate Regenerator",
              "description": "Restores 1d8 HP per turn if it has not taken damage in the last round."
            },
            {
              "name": "Pack Tactician",
              "description": "Telepathically coordinates allied Darklings within 100 ft. to grant them +1 to actions."
            }
          ]
        },
        "tokenSize": 2
      },
   {
    "name": "Darkform Overwatch",
    "size": ["L"],
    "type": "abomination",
    "stats": {
      "size": "large",
      "challengeRating": 6,
      "hitPoints": 150,
      "armorClass": 15,
      "speed": {
        "walk": 30,
        "climb": 20
      },
      "str": 18,
      "dex": 14,
      "con": 16,
      "int": 12,
      "wis": 14,
      "cha": 10,
      "attacks": [
        {
          "name": "Multiattack",
          "description": "The Overwatch makes two claw attacks and one bite attack."
        },
        {
          "name": "Claw",
          "type": "Melee Weapon Attack",
          "toHit": 7,
          "reach": 10,
          "damage": "2d6+4",
          "damageType": "slashing"
        },
        {
          "name": "Bite",
          "type": "Melee Weapon Attack",
          "toHit": 7,
          "reach": 5,
          "damage": "2d8+4",
          "damageType": "piercing"
        }
      ],
      "abilities": [
        {
          "name": "Darkvision",
          "description": "The Overwatch can see in darkness up to 120 feet."
        },
        {
          "name": "Watchful",
          "description": "The Overwatch has advantage on Wisdom (Perception) checks."
        }
      ]
    },
    "tokenSize": 2
  },
  {
    "name": "Darkform Sleek-Lurker Pack Alpha",
    "size": ["L"],
    "type": "abomination",
    "stats": {
      "size": "large",
      "challengeRating": 5,
      "hitPoints": 135,
      "armorClass": 14,
      "speed": {
        "walk": 40,
        "swim": 30
      },
      "str": 17,
      "dex": 16,
      "con": 15,
      "int": 10,
      "wis": 14,
      "cha": 12,
      "attacks": [
        {
          "name": "Multiattack",
          "description": "The Pack Alpha makes three rending claw attacks."
        },
        {
          "name": "Rending Claw",
          "type": "Melee Weapon Attack",
          "toHit": 6,
          "reach": 5,
          "damage": "2d6+3",
          "damageType": "slashing"
        },
        {
          "name": "Pack Tactics",
          "type": "Special Attack",
          "description": "The Pack Alpha has advantage on attack rolls against a creature if at least one of the alpha's allies is within 5 feet of the creature."
        }
      ],
      "abilities": [
        {
          "name": "Pack Leader",
          "description": "Allied darklings within 30 feet have advantage on saving throws against being frightened."
        }
      ]
    },
    "tokenSize": 2
  },
  {
    "name": "Darkling-Bellowbelly",
    "size": ["L"],
    "type": "abomination",
    "stats": {
      "size": "large",
      "challengeRating": 6,
      "hitPoints": 145,
      "armorClass": 15,
      "speed": {
        "walk": 30
      },
      "str": 19,
      "dex": 12,
      "con": 18,
      "int": 10,
      "wis": 13,
      "cha": 11,
      "attacks": [
        {
          "name": "Multiattack",
          "description": "The Bellowbelly makes two slam attacks."
        },
        {
          "name": "Slam",
          "type": "Melee Weapon Attack",
          "toHit": 8,
          "reach": 10,
          "damage": "2d8+4",
          "damageType": "bludgeoning"
        }
      ],
      "abilities": [
        {
          "name": "Roar",
          "description": "The Bellowbelly emits a thunderous roar. All creatures within 30 feet must succeed on a DC 14 Constitution saving throw or be stunned until the end of their next turn."
        }
      ]
    },
    "tokenSize": 2
  },
  {
    "name": "Darkform-Hungore",
    "size": ["L"],
    "type": "abomination",
    "stats": {
      "size": "large",
      "challengeRating": 5,
      "hitPoints": 140,
      "armorClass": 14,
      "speed": {
        "walk": 30
      },
      "str": 18,
      "dex": 13,
      "con": 16,
      "int": 11,
      "wis": 12,
      "cha": 10,
      "attacks": [
        {
          "name": "Multiattack",
          "description": "The Hungore makes two bite attacks."
        },
        {
          "name": "Bite",
          "type": "Melee Weapon Attack",
          "toHit": 7,
          "reach": 5,
          "damage": "2d10+4",
          "damageType": "piercing"
        }
      ],
      "abilities": [
        {
          "name": "Voracious",
          "description": "The Hungore regains hit points equal to half the damage dealt by its bite attack."
        }
      ]
    },
    "tokenSize": 2
  },
  {
    "name": "Darkform-Shark",
    "size": ["L"],
    "type": "abomination",
    "stats": {
      "size": "large",
      "challengeRating": 5,
      "hitPoints": 100,
      "armorClass": 14,
      "speed": {
        "walk": 50
      },
      "str": 20,
      "dex": 12,
      "con": 15,
      "int": 8,
      "wis": 10,
      "cha": 9,
      "attacks": [
        {
          "name": "Multiattack",
          "description": "The Shark makes two bite attacks."
        },
        {
          "name": "Bite",
          "type": "Melee Weapon Attack",
          "toHit": 6,
          "reach": 5,
          "damage": "2d10+5",
          "damageType": "piercing"
        }
      ],
      "abilities": [
        {
          "name": "Blood Frenzy",
          "description": "The Shark has advantage on melee attack rolls against any creature that doesn't have all its hit points."
        }
      ]
    },
    "tokenSize": 2
  },
  {
    "name": "Darkling-Ossuite Charger",
    "size": ["L"],
    "type": "abomination",
    "stats": {
      "size": "large",
      "challengeRating": 6,
      "hitPoints": 155,
      "armorClass": 15,
      "speed": {
        "walk": 40
      },
      "str": 19,
      "dex": 14,
      "con": 17,
      "int": 10,
      "wis": 12,
      "cha": 11,
      "attacks": [
        {
          "name": "Multiattack",
          "description": "The Charger makes two gore attacks."
        },
        {
          "name": "Gore",
          "type": "Melee Weapon Attack",
          "toHit": 8,
          "reach": 10,
          "damage": "2d8+4",
          "damageType": "piercing"
        }
      ],
      "abilities": [
        {
          "name": "Charge",
          "description": "If the Charger moves at least 20 feet straight toward a target and then hits it with a gore attack on the same turn, the target takes an extra 2d8 piercing damage."
        }
      ]
    },
    "tokenSize": 2
  },
  {
    "name": "Darkling-Ossuite Charger Omega",
    "size": ["L"],
    "type": "abomination",
    "stats": {
      "size": "large",
      "challengeRating": 7,
      "hitPoints": 165,
      "armorClass": 16,
      "speed": {
        "walk": 40
      },
      "str": 20,
      "dex": 14,
      "con": 18,
      "int": 11,
      "wis": 13,
      "cha": 12,
      "attacks": [
        {
          "name": "Multiattack",
          "description": "The Charger Omega makes two gore attacks and one stomp attack."
        },
        {
          "name": "Gore",
          "type": "Melee Weapon Attack",
          "toHit": 9,
          "reach": 10,
          "damage": "2d8+5",
          "damageType": "piercing"
        },
        {
          "name": "Stomp",
          "type": "Melee Weapon Attack",
          "toHit": 9,
          "reach": 5,
          "damage": "2d10+5",
          "damageType": "bludgeoning"
        }
      ],
      "abilities": [
        {
          "name": "Omega Charge",
          "description": "If the Charger Omega moves at least 20 feet straight toward a target and then hits it with a gore attack on the same turn, the target takes an extra 3d8 piercing damage and must succeed on a DC 16 Strength saving throw or be knocked prone."
        }
      ]
    },
    "tokenSize": 2
  }
];