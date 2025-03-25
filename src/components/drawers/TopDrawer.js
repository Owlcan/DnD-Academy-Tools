import React, { useState } from 'react';
import FancyButton from '../buttons/FancyButton';

const WEATHER_INFO = {
  clearSkies: {
    title: "Clear Skies",
    effect: "Perfect visibility and normal conditions",
    mechanics: "No mechanical effect"
  },
  rain: {
    title: "Rain",
    effect: "Limited visibility, wet surfaces, and difficult hearing",
    mechanics: "Disadvantage on Perception checks that rely on sight or hearing beyond 100 feet. Disadvantage on tracking checks. Fire damage reduced by 2."
  },
  heavyRain: {
    title: "Heavy Rain",
    effect: "Severely limited visibility, slick surfaces, and heavily muffled sounds",
    mechanics: "Disadvantage on all ranged attacks. Disadvantage on Perception checks beyond 50 feet. Fire damage reduced by 5. Difficult terrain."
  },
  thunderstorm: {
    title: "Thunderstorm",
    effect: "As heavy rain, with periodic thunder and lightning",
    mechanics: "As heavy rain. On initiative count 20, 50% chance of lightning strike within 100 feet of a random creature. DC 13 DEX save or take 2d10 lightning damage."
  },
  snow: {
    title: "Snow",
    effect: "Reduced visibility, cold exposure, and accumulating snow",
    mechanics: "Disadvantage on Perception beyond 100 feet. Constitution save (DC 10) every hour or gain one level of exhaustion. Ground becomes difficult terrain after 4 hours."
  },
  blizzard: {
    title: "Blizzard",
    effect: "Severely limited visibility, dangerous cold, and heavy snow",
    mechanics: "As snow, but Constitution save DC 15 every 30 minutes. Disadvantage on ranged attacks. Visibility limited to 30 feet."
  },
  fog: {
    title: "Fog",
    effect: "Heavily obscured areas and muffled sounds",
    mechanics: "Visibility limited to 60 feet. Disadvantage on Perception checks relying on sight. Advantage on Stealth checks."
  },
  heavyFog: {
    title: "Heavy Fog",
    effect: "Nearly impossible to see through, sounds extremely muffled",
    mechanics: "Visibility limited to 15 feet. Creatures more than 15 feet away are heavily obscured. Disadvantage on all ranged attacks."
  },
  sandstorm: {
    title: "Sandstorm",
    effect: "Stinging sand reduces visibility and causes irritation",
    mechanics: "As heavy fog, plus 1d4 slashing damage per hour of exposure. Constitution save (DC 12) or be blinded for 1 minute."
  }
};

const statusDescriptions = {
  blinded: "A blinded creature can't see and automatically fails any ability check that requires sight. Attack rolls against the creature have advantage, and the creature's attack rolls have disadvantage.",
  charmed: "A charmed creature can't attack the charmer or target them with harmful abilities or magical effects. The charmer has advantage on ability checks to interact socially with the creature.",
  deafened: "A deafened creature can't hear and automatically fails any ability check that requires hearing.",
  frightened: "A frightened creature has disadvantage on ability checks and attack rolls while the source of its fear is within line of sight. The creature can't willingly move closer to the source of its fear.",
  grappled: "A grappled creature's speed becomes 0, and it can't benefit from any bonus to its speed. The condition ends if the grappler is incapacitated or if an effect removes the grappled creature from the reach of the grappler.",
  incapacitated: "An incapacitated creature can't take actions or reactions.",
  invisible: "An invisible creature is impossible to see without special means. Attack rolls against the creature have disadvantage, and the creature's attack rolls have advantage.",
  paralyzed: "A paralyzed creature is incapacitated and can't move or speak. It automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage, and any attack that hits the creature is a critical hit if the attacker is within 5 feet.",
  petrified: "A petrified creature is transformed into stone and is incapacitated. It weighs ten times its normal weight, ages don't pass, and it is immune to all damage unless it breaks the stone form.",
  poisoned: "A poisoned creature has disadvantage on attack rolls and ability checks.",
  prone: "A prone creature can only crawl or use abilities to stand up. The creature has disadvantage on attack rolls. Attack rolls against the creature have advantage if within 5 feet, disadvantage if farther away.",
  restrained: "A restrained creature's speed becomes 0. Attack rolls against the creature have advantage, and the creature's attack rolls have disadvantage. The creature has disadvantage on Dexterity saving throws.",
  stunned: "A stunned creature is incapacitated, can't move, and can speak only falteringly. The creature automatically fails Strength and Dexterity saving throws. Attack rolls against the creature have advantage.",
  unconscious: "An unconscious creature is incapacitated, can't move or speak, and is unaware of its surroundings. The creature drops what it's holding and falls prone. Attack rolls against the creature have advantage, and any attack that hits the creature is a critical hit if the attacker is within 5 feet.",
  cursed: "A cursed creature is affected by a magical affliction. The specific effects vary based on the curse type but commonly include penalties to rolls, inability to heal naturally, or other detrimental effects.",
  blessed: "A blessed creature gains divine favor, typically granting bonuses to saving throws, attack rolls, or other benefits as specified by the blessing effect.",
  hasted: "A hasted creature's speed is doubled, gains +2 to AC, has advantage on Dexterity saving throws, and gains an additional action. When the effect ends, the creature can't move or take actions until after its next turn.",
  confused: "A confused creature acts randomly on their turn, potentially attacking allies or moving in random directions. The creature cannot take reactions or bonus actions while confused.",
  marked: "A marked creature is designated as a priority target. The specific effects depend on what marked the creature, but typically involves penalties when attacking creatures other than the marker or bonuses for the marker when attacking the marked creature.",
  concentrated: "The creature is maintaining concentration on a spell or effect. Taking damage requires a Constitution saving throw to maintain concentration. DC equals 10 or half the damage taken, whichever is higher.",
};

const ATTRIBUTION = {
  text: "Weather system inspired by KibblesTasty's Advanced Weather System",
  link: "https://www.patreon.com/KibblesTasty"
};

const TopDrawer = ({ isOpen, onToggle, scale }) => {
  const [activeTab, setActiveTab] = useState('weather');

  return (
    <div style={{
      position: 'fixed',
      top: isOpen ? '0' : '-80vh',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '80%',
      maxWidth: '1200px',
      background: 'rgba(0,0,0,0.95)',
      border: '1px solid #b8860b',
      borderRadius: '0 0 8px 8px',
      padding: '20px',
      transition: 'top 0.3s ease-in-out',
      zIndex: 1000,
      color: 'gold',
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <FancyButton 
          onClick={() => setActiveTab('weather')}
          style={{ 
            opacity: activeTab === 'weather' ? 1 : 0.7,
            fontSize: '14px'
          }}
        >
          Weather Effects
        </FancyButton>
        <FancyButton 
          onClick={() => setActiveTab('status')}
          style={{ 
            opacity: activeTab === 'status' ? 1 : 0.7,
            fontSize: '14px'
          }}
        >
          Status Conditions
        </FancyButton>
      </div>

      {activeTab === 'weather' && (
        <div>
          <div style={{ marginBottom: '20px', fontSize: '12px', textAlign: 'right' }}>
            <a href={ATTRIBUTION.link} target="_blank" rel="noopener noreferrer" style={{ color: '#b8860b' }}>
              {ATTRIBUTION.text}
            </a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {Object.entries(WEATHER_INFO).map(([key, info]) => (
              <div key={key} style={{ 
                background: 'rgba(0,0,0,0.3)', 
                padding: '15px', 
                borderRadius: '8px',
                border: '1px solid rgba(184, 134, 11, 0.3)'
              }}>
                <h3 style={{ color: '#b8860b', marginBottom: '10px' }}>{info.title}</h3>
                <p>{info.effect}</p>
                <p style={{ color: '#aaa', fontSize: '14px' }}>{info.mechanics}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'status' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {Object.entries(statusDescriptions).map(([key, description]) => (
            <div key={key} style={{ 
              background: 'rgba(0,0,0,0.3)', 
              padding: '15px', 
              borderRadius: '8px',
              border: '1px solid rgba(184, 134, 11, 0.3)'
            }}>
              <h3 style={{ color: '#b8860b', marginBottom: '10px' }}>{key.charAt(0).toUpperCase() + key.slice(1)}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      )}

      <FancyButton 
        onClick={onToggle}
        style={{
          position: 'absolute',
          bottom: '-40px',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      >
        {isOpen ? 'Close' : 'Open'}
      </FancyButton>
    </div>
  );
};

export default TopDrawer;
