export const SMALL_MONSTERS = [
    {
      "name": "Darkling-Brackling",
      "size": ["S"],
      "type": "abomination",
      "stats": {
        "size": "small",
        "challengeRating": 1,
        "hitPoints": 20,
        "armorClass": 12,
        "speed": {
          "walk": 10,
          "fly": 15,
          "swim": 30
        },
        "str": 12,
        "dex": 14,
        "con": 14,
        "int": 8,
        "wis": 10,
        "cha": 6,
        "attacks": [
          {
            "name": "Tendril Lash",
            "description": "Melee Weapon Attack: +4 to hit, reach 10 ft., one target. Hit: 10 (2d8+2) slashing damage."
          },
          {
            "name": "Bite",
            "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (1d8+1) piercing damage."
          }
        ],
        "abilities": [
          {
            "name": "Amphibious",
            "description": "Can breathe both air and water."
          },
          {
            "name": "Ink Jet Dash",
            "description": "While airborne, may use a dash action propelled by a burst of dark, brackish ink."
          },
          {
            "name": "Obscuring Ink Spray",
            "description": "Ejects a 15-foot cone of ink (Recharge 5–6); DC 12 Con save or be blinded until end of next turn."
          }
        ]
      },
      "tokenSize": 1
    },
    {
      "name": "Darkling-Lurker",
      "size": ["S"],
      "type": "abomination",
      "stats": {
        "size": "small",
        "challengeRating": 0.5,
        "hitPoints": 4,
        "armorClass": 13,
        "speed": {
          "walk": 35
        },
        "str": 10,
        "dex": 16,
        "con": 10,
        "int": 10,
        "wis": 10,
        "cha": 10,
        "attacks": [
          {
            "name": "Tendril Lash",
            "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 1d6+3 (average 6) damage."
          }
        ],
        "abilities": []
      },
      "tokenSize": 1
    },
    {
      "name": "Darkling-Slurper",
      "size": ["S"],
      "type": "abomination",
      "stats": {
        "size": "small",
        "challengeRating": 0.5,
        "hitPoints": 8,
        "armorClass": 13,
        "speed": {
          "walk": 30
        },
        "str": 10,
        "dex": 14,
        "con": 10,
        "int": 8,
        "wis": 10,
        "cha": 6,
        "attacks": [
          {
            "name": "Slurp",
            "description": "Grapple Attack: +4 to hit, reach 10 ft., one target. Hit: 6 piercing damage."
          },
          {
            "name": "Shuddering Pound",
            "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (1d10+3) bludgeoning damage."
          }
        ],
        "abilities": []
      },
      "tokenSize": 1
    },
    {
      "name": "Darkling-Ossokin-Proselyte",
      "size": ["S"],
      "type": "abomination",
      "stats": {
        "size": "small",
        "challengeRating": 1,
        "hitPoints": 12,
        "armorClass": 12,
        "speed": {
          "walk": 30
        },
        "str": 10,
        "dex": 14,
        "con": 12,
        "int": 6,
        "wis": 16,
        "cha": 6,
        "attacks": [
          {
            "name": "Bone Tap",
            "description": "Melee Weapon Attack: +2 to hit, reach 5 ft., one target. Hit: 1d4+1 bludgeoning damage."
          }
        ],
        "abilities": [
          {
            "name": "Divine Spellcasting",
            "description": "2nd-level spellcaster with spells: Bless, Cure Wounds, Lesser Restoration, Aid."
          },
          {
            "name": "Ossuaries' Boon",
            "description": "Once per short rest, grants an allied bonus to saving throws equal to its Wisdom modifier (minimum +1) within 5 ft."
          }
        ]
      },
      "tokenSize": 1
    },
    {
      "name": "Darkling-Paralurker",
      "size": ["S"],
      "type": "abomination",
      "stats": {
        "size": "small",
        "challengeRating": 0.5,
        "hitPoints": 6,
        "armorClass": 13,
        "speed": {
          "walk": 35
        },
        "str": 10,
        "dex": 16,
        "con": 10,
        "int": 10,
        "wis": 10,
        "cha": 10,
        "attacks": [
          {
            "name": "Talon Kick",
            "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 7 (2d4+2) slashing damage."
          }
        ],
        "abilities": []
      },
      "tokenSize": 1
    },
    {
      "name": "Weirdling-Paralurker",
      "size": ["S"],
      "type": "abomination",
      "stats": {
        "size": "small",
        "challengeRating": 0.5,
        "hitPoints": 8,
        "armorClass": 13,
        "speed": {
          "walk": 35
        },
        "str": 10,
        "dex": 16,
        "con": 10,
        "int": 8,
        "wis": 10,
        "cha": 8,
        "attacks": [
          {
            "name": "Talon Kick",
            "description": "Melee Weapon Attack: +5 to hit, reach 5 ft., one target. Hit: 8 (2d4+3) slashing damage."
          }
        ],
        "abilities": [
          {
            "name": "Unsettling Reconfiguration",
            "description": "When reduced to 0 HP, transforms back into a Darkling-Paralurker; nearby creatures must succeed on a DC 14 Con save or lose their reaction until the end of their next turn."
          }
        ]
      },
      "tokenSize": 1
    },
    {
      "name": "Darkling-Cactine-Biggo-Boy",
      "size": ["S"],
      "type": "abomination",
      "stats": {
        "size": "small",
        "challengeRating": 1,
        "hitPoints": 16,
        "armorClass": 14,
        "speed": {
          "walk": 35
        },
        "str": 12,
        "dex": 16,
        "con": 12,
        "int": 3,
        "wis": 12,
        "cha": 6,
        "attacks": [
          {
            "name": "Spiny Jab",
            "description": "Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 1d6+1 piercing damage."
          }
        ],
        "abilities": [
          {
            "name": "Relentless Backup",
            "description": "Calls for reinforcements at the end of its turn; reinforcements arrive in 1d2 rounds."
          },
          {
            "name": "Painful Embrace",
            "description": "When grappling, may use a bonus action to deal an extra 1d6 piercing damage; target must succeed on a DC 12 save or be restrained until the end of its next turn."
          }
        ]
      },
      "tokenSize": 1
    },
    {
      "name": "Darkling-Slitherscale",
      "size": ["S"],
      "type": "abomination",
      "stats": {
        "size": "small",
        "challengeRating": 0.5,
        "hitPoints": 6,
        "armorClass": 12,
        "speed": {
          "walk": 30
        },
        "str": 8,
        "dex": 14,
        "con": 10,
        "int": 6,
        "wis": 12,
        "cha": 6,
        "attacks": [
          {
            "name": "Bite",
            "description": "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 1d4+2 piercing damage."
          }
        ],
        "abilities": [
          {
            "name": "Slithering Escape",
            "description": "Once per turn, may disengage without provoking opportunity attacks."
          }
        ]
      },
      "tokenSize": 1
    }
];