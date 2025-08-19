export const HUGE_MONSTERS = [
  {
    "name": "Darkaconda",
    "size": ["H"],
    "type": "abomination",
    "stats": {
      "size": "huge",
      "challengeRating": 4,
      "hitPoints": 96,
      "armorClass": 16,
      "speed": {
        "walk": 30,
        "swim": 30
      },
      "str": 20,
      "dex": 14,
      "con": 16,
      "int": 4,
      "wis": 12,
      "cha": 8,
      "attacks": [
        {
          "name": "Shadow Lunge",
          "description": "Melee Weapon Attack: +7 to hit, reach 15 ft., one target. Hit: 2d8+4 piercing damage."
        },
        {
          "name": "Crushing Coil",
          "description": "Melee Weapon Attack: +7 to hit, reach 5 ft., one target. Hit: 2d6+4 bludgeoning damage."
        }
      ],
      "abilities": [
        {
          "name": "Serpent-Lance Lunge",
          "description": "If the Darkaconda has not moved on its previous turn, it may spend that turn coiling. On the following turn, it can extend up to 60 ft. in any direction and make one attack using any available action. Recharges on a 5–6 roll at the start of its turn."
        },
        {
          "name": "Swallow",
          "description": "When the Darkaconda grapples a creature, it can attempt to swallow it. A swallowed creature takes 2d8 piercing damage at the start of each of its turns and is restrained. The creature can attempt to escape by succeeding on a DC 15 Strength (Athletics) or Dexterity (Acrobatics) check."
        }
      ]
    },
    "tokenSize": 3
  },
  {
    "name": "Darkforme-Ossuarian",
    "size": ["H"],
    "type": "abomination",
    "stats": {
      "size": "huge",
      "challengeRating": 7,
      "hitPoints": 135,
      "armorClass": 17,
      "speed": {
        "walk": 20
      },
      "str": 20,
      "dex": 8,
      "con": 18,
      "int": 6,
      "wis": 14,
      "cha": 6,
      "attacks": [
        {
          "name": "Multiattack",
          "description": "The Darkforme-Ossuarian makes two Bone Slam attacks and one Bone Rake attack."
        },
        {
          "name": "Bone Slam",
          "type": "Melee Weapon Attack",
          "toHit": 8,
          "reach": 10,
          "damage": "2d8+5",
          "damageType": "bludgeoning"
        },
        {
          "name": "Bone Rake",
          "type": "Melee Weapon Attack",
          "toHit": 8,
          "reach": 10,
          "damage": "1d8+5",
          "damageType": "slashing",
          "description": "On a hit, if the target is already grappled, it becomes restrained until the end of its next turn."
        }
      ],
      "abilities": [
        {
          "name": "Pants-Crapping Fear Presence",
          "description": "Any creature within 30 ft. that can see the Darkforme-Ossuarian must succeed on a DC 16 Wisdom saving throw or become frightened for 1 minute—and experience disarray in their clothing."
        },
        {
          "name": "Living Ossuary Spellcasting",
          "description": "The Darkforme-Ossuarian is a 7th-level spellcaster (Wisdom, spell save DC 15, +7 to hit with spells) with spells prepared: Toll the Dead and Spare the Dying at will; Inflict Wounds and Guiding Bolt (1st level, 4 slots); Spiritual Weapon, Hold Person, Blindness/Deafness (2nd level, 3 slots); Animate Dead, Blight, Bestow Curse (3rd level, 2 slots)."
        }
      ]
    },
    "tokenSize": 3
  }
];  // End of HUGE_MONSTERS array