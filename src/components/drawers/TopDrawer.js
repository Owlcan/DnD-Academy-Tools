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

  const ArenaballTab = () => {
    const [subTab, setSubTab] = useState('rules');
    // Inline-scoped styles so the Arenaball look stays inside the drawer tab only
    const css = `
      @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=Source+Sans+Pro:wght@400;600&display=swap');
      .arenaball-tab {
        position: relative;
        background-color: #04280A;
        background-image: repeating-linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.02) 0px,
            rgba(255, 255, 255, 0.02) 2px,
            transparent 2px,
            transparent 40px
        ),
        repeating-linear-gradient(
            rgba(255, 255, 255, 0.015) 0px,
            rgba(255, 255, 255, 0.015) 2px,
            transparent 2px,
            transparent 40px
        );
        background-size: 40px 40px;
        color: #f4f4f4;
        font-family: 'Source Sans Pro', 'Segoe UI', sans-serif;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
        padding: 1em 2em;
        margin: 0;
        border-radius: 8px;
        box-shadow: inset 0 0 0 1px rgba(223, 255, 170, 0.15);
        overflow: hidden;
      }
      .arenaball-tab::before {
        content: "";
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        pointer-events: none;
        background: radial-gradient(circle, rgba(0,0,0,0) 75%, rgba(0,0,0,0.5) 100%);
        z-index: 0;
      }
      .arenaball-tab * { position: relative; z-index: 1; }
      .arenaball-tab .container { max-width: 900px; margin: auto; }
      .arenaball-tab img.cover-image {
        width: 100%;
        max-width: 600px;
        display: block;
        margin: 1em auto 2em auto;
        border: 4px solid #dfffaa;
        border-radius: 8px;
      }
      .arenaball-tab h1, .arenaball-tab h2, .arenaball-tab h3, .arenaball-tab h4, .arenaball-tab h5 {
        font-family: 'Oswald', 'Impact', sans-serif;
        text-transform: uppercase;
        color: #dfffaa;
        border-bottom: 2px solid #dfffaa;
        padding-bottom: 0.2em;
        margin-top: 1.5em;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
      }
      .arenaball-tab h1 { text-align: center; font-size: 2.5em; border-bottom-width: 4px; }
      .arenaball-tab h2 { font-size: 2em; }
      .arenaball-tab h3 { font-size: 1.5em; color: #a8ffbe; border-bottom-style: dashed; }
      .arenaball-tab table {
        width: 100%;
        border-collapse: collapse;
        background-color: rgba(0, 0, 0, 0.5);
        color: #f4f4f4;
        margin-top: 1.5em;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
      }
      .arenaball-tab table th {
        background-color: #146b29;
        color: #ffffff;
        padding: 0.6em;
        text-align: left;
      }
      .arenaball-tab table td {
        border: 1px solid #2f8f47;
        padding: 0.5em 0.7em;
      }
      .arenaball-tab table td:first-child { font-weight: 600; }
      .arenaball-tab ul { list-style-type: none; padding-left: 0; }
      .arenaball-tab ul li { padding-left: 1.5em; position: relative; margin-bottom: 0.5em; }
      .arenaball-tab ul li::before { content: '●'; color: #dfffaa; position: absolute; left: 0; top: 0; }
      .arenaball-tab strong { color: #a8ffbe; }
      .arenaball-tab .tabs { display: flex; border-bottom: 2px solid #dfffaa; margin-top: 2em; }
      .arenaball-tab .tab-button {
        padding: 0.8em 1.5em; cursor: pointer; background-color: transparent; border: none; color: #f4f4f4;
        font-family: 'Oswald', sans-serif; text-transform: uppercase; font-size: 1.1em; transition: background-color 0.3s;
        border-bottom: 3px solid transparent; margin-bottom: -2px;
      }
      .arenaball-tab .tab-button.active { background-color: rgba(223, 255, 170, 0.1); border-bottom: 3px solid #a8ffbe; color: #a8ffbe; }
      .arenaball-tab .tab-content { display: none; padding: 1.5em 0; border-top: none; }
      .arenaball-tab .tab-content.active { display: block; }
      .arenaball-tab .table-container { display: flex; flex-wrap: wrap; gap: 2em; }
      .arenaball-tab .table-container > div { flex: 1; min-width: 300px; }
    `;

    const handleCoverError = (e) => {
      e.currentTarget.onerror = null;
      e.currentTarget.src = 'https://placehold.co/600x400/04280A/dfffaa?text=Arenaball';
    };

    return (
      <div className="arenaball-tab">
        <style>{css}</style>
        <div className="container">
          <img
            src="https://ik.imagekit.io/owlcan/arenabol.webp"
            alt="Arenaball promotional image"
            className="cover-image"
            onError={handleCoverError}
          />

          <h1>Arenaball: Quick Play Guide</h1>

          <div className="tabs">
            <button
              className={`tab-button ${subTab === 'rules' ? 'active' : ''}`}
              onClick={() => setSubTab('rules')}
            >
              Quick Rules
            </button>
            <button
              className={`tab-button ${subTab === 'mechanics' ? 'active' : ''}`}
              onClick={() => setSubTab('mechanics')}
            >
              Mechanics & Tables
            </button>
          </div>

          {subTab === 'rules' && (
          <div id="rules" className="tab-content active">
            <h2>I. Introduction</h2>
            <p>
              Arenaball is a high-energy, low-gravity sport that has become the premier athletic event at the Scholia Diaspros. Combining elements of soccer, handball, and magical combat, it's a game of skill, strategy, and spectacular, padded collisions.
            </p>

            <h2>II. The Field of Play</h2>
            <ul>
              <li>
                <strong>Low-Gravity Arena:</strong> The game is played in a large, enclosed arena under a permanent low-gravity enchantment, allowing for incredible leaps and dynamic, three-dimensional plays. The floor is made of magically cushioned turf to soften landings.
              </li>
              <li>
                <strong>Field Size:</strong> The standard Arenaball field is approximately 300ft long.
              </li>
              <li>
                <strong>Goal Gates:</strong> At each end of the field are three upright, gate-like goal zones. Scoring is as follows:
                <ul>
                  <li><strong>Outer Gate (20ft diameter):</strong> 1 point.</li>
                  <li><strong>Middle Gate (10ft diameter):</strong> 3 points.</li>
                  <li><strong>Inner Gate (5ft diameter):</strong> 5 points.</li>
                  <li><strong>Trifecta Score:</strong> Passing the ball through all three gates in a single play is worth <strong>10 points</strong>.</li>
                </ul>
              </li>
            </ul>

            <h2>III. Equipment</h2>
            <ul>
              <li>
                <strong>The Arenaball:</strong> A magically reinforced sphere, about the size of a soccer ball. It glows softly and is highly durable. For combat purposes, it is a finesse weapon (d4 damage) with a range of 120/300.
              </li>
              <li>
                <strong>Sword-Sticks:</strong> Non-sharp sticks used to bat, push, and guide the ball. They come in Short (dagger/shortsword), Long (longsword), and Great (greatsword) sizes.
              </li>
              <li>
                <strong>Diapers:</strong> A mandatory piece of the uniform and safety equipment, these thick, padded diapers cushion the numerous falls and collisions that occur in the low-gravity environment.
              </li>
            </ul>

            <h2>IV. Gameplay & Fouls</h2>
            <ul>
              <li>
                <strong>Objective:</strong> Score points by getting the Arenaball through the opposing team's gates.
              </li>
              <li>
                <strong>Handling the Ball:</strong> Players can use their feet, hands (hold for one turn/three steps), padded butts, and sword-sticks to manipulate the ball.
              </li>
              <li>
                <strong>Magic Fouls:</strong> Using a spell of <strong>3rd level or higher</strong> results in a foul.
              </li>
              <li>
                <strong>Physical Fouls:</strong> Intentionally trying to injure another player is a foul. This includes targeting a player to knock them out by striking them more than once in three turns with a damaging effect.
              </li>
              <li>
                <strong>Diaper Fouls:</strong> If a player's diaper becomes "full," they must report to the "Penalty Changing Box" for 2 rounds, creating a power play for the opposing team.
              </li>
            </ul>
          </div>
          )}

          {subTab === 'mechanics' && (
          <div id="mechanics" className="tab-content active">
            <h2>V. D20 Mechanics</h2>
            <h3>Table D: Gameplay Details</h3>
            <table>
              <thead>
                <tr>
                  <th>Aspect</th>
                  <th>Rule</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><strong>Team Size</strong></td><td>Seven players per side.</td></tr>
                <tr><td><strong>Team Initiative</strong></td><td>Each team makes a single group Dexterity (Acrobatics) check at the start and after each goal. The winner decides who acts first.</td></tr>
                <tr><td><strong>Turns</strong></td><td>All players on one team take their turns, then the opposing team takes their turn. This completes one round.</td></tr>
                <tr><td><strong>Move</strong></td><td>Move up to your character's speed. Low gravity may allow for longer jumps at DM's discretion.</td></tr>
                <tr><td><strong>Use Spell/Class Feature</strong></td><td>As per the spell or feature's description. Remember the 2nd level spell limit.</td></tr>
                <tr><td><strong>Hold Ball</strong></td><td>You can hold the ball for one turn or for up to three steps while moving.</td></tr>
                <tr><td><strong>Drop Ball</strong></td><td>You can drop the ball at any time during your turn as a free action.</td></tr>
              </tbody>
            </table>

            <div className="table-container">
              <div>
                <h3>Table A: Shooting on Goal</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Target Gate</th>
                      <th>Base DC</th>
                      <th>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td><strong>Outer Gate</strong></td><td>14</td><td>1</td></tr>
                    <tr><td><strong>Middle Gate</strong></td><td>18</td><td>3</td></tr>
                    <tr><td><strong>Inner Gate</strong></td><td>22</td><td>5</td></tr>
                    <tr><td><strong>Trifecta</strong></td><td>28</td><td>10</td></tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h3>Table B: Shot Modifiers</h3>
                <table>
                  <thead>
                    <tr><th>Condition</th><th>DC Modifier</th></tr>
                  </thead>
                  <tbody>
                    <tr><td><strong>Short Range</strong> (&lt; 30 ft)</td><td>-2</td></tr>
                    <tr><td><strong>Medium Range</strong> (30-60 ft)</td><td>+0</td></tr>
                    <tr><td><strong>Long Range</strong> (60+ ft)</td><td>+4</td></tr>
                    <tr><td><strong>Defender</strong> within 5 ft</td><td>+3</td></tr>
                    <tr><td>Player is <strong>Prone/Restrained</strong></td><td>+5</td></tr>
                    <tr><td><strong>Diaper Butt Shot</strong></td><td>+3</td></tr>
                    <tr><td>Ally used <strong>Help</strong> action</td><td>-3</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h3>Table C: Field Actions & Checks</h3>
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Cost</th>
                  <th>Skill Check</th>
                  <th>Base DC / Contest</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><strong>Short Pass</strong> (&lt; 30ft)</td><td>Action</td><td>Dex (Sleight of Hand)</td><td>12</td><td>+2 DC if defender is within 5 ft.</td></tr>
                <tr><td><strong>Long Pass</strong> (&gt; 30ft)</td><td>Action</td><td>Str (Athletics)</td><td>16</td><td>+3 DC if defender is within 5 ft.</td></tr>
                <tr><td><strong>Intercept Pass/Shot</strong></td><td>Reaction</td><td>Dex (Acrobatics)</td><td>Contested</td><td>Opposes the pass/shot check total.</td></tr>
                <tr><td><strong>Tackle Opponent</strong></td><td>Action</td><td>Str (Athletics)</td><td>Contested</td><td>Opposes target's Athletics or Acrobatics.</td></tr>
                <tr><td><strong>Juke/Deceive Defender</strong></td><td>Action</td><td>Dex (Acrobatics) or Cha (Deception)</td><td>Contested</td><td>Opposed by defender's Wis (Insight).</td></tr>
                <tr><td><strong>Diaper Butt Punt</strong></td><td>Action</td><td>Str (Athletics)</td><td>14</td><td>Success sends ball 40 ft. +2 DC for every extra 10 ft.</td></tr>
                <tr><td><strong>Catch a Pass</strong></td><td>-</td><td>Dex (Sleight of Hand)</td><td>13</td><td>+2 DC if pass was Long Range.</td></tr>
                <tr><td><strong>Block an Opponent</strong></td><td>Action</td><td>Str (Athletics)</td><td>Contested</td><td>Opposes target's Athletics to push past.</td></tr>
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
    );
  };

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
  zIndex: 2500,
      color: 'gold',
      maxHeight: '80vh',
      overflowY: 'auto'
    }}>
      {/* Move the open/close button to the top-right of the drawer to avoid overlapping center controls */}
      <div style={{ position: 'absolute', top: '8px', right: '12px' }}>
        <FancyButton onClick={onToggle} style={{ padding: '4px 10px', fontSize: '12px' }}>
          {isOpen ? 'Close' : 'Open'}
        </FancyButton>
      </div>
  {/* Tab content area (buttons moved to bottom to avoid overlap with app top controls) */}

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

      {activeTab === 'arenaball' && (
        <div>
          <ArenaballTab />
        </div>
      )}

      {/* Bottom-aligned tab controls to keep the top of the drawer clean */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        background: 'rgba(0,0,0,0.85)',
        borderTop: '1px solid #b8860b',
        marginTop: '20px',
        padding: '10px',
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <FancyButton 
          onClick={() => setActiveTab('weather')}
          style={{ opacity: activeTab === 'weather' ? 1 : 0.7, fontSize: '14px' }}
        >
          Weather Effects
        </FancyButton>
        <FancyButton 
          onClick={() => setActiveTab('status')}
          style={{ opacity: activeTab === 'status' ? 1 : 0.7, fontSize: '14px' }}
        >
          Status Conditions
        </FancyButton>
        <FancyButton 
          onClick={() => setActiveTab('arenaball')}
          style={{ opacity: activeTab === 'arenaball' ? 1 : 0.7, fontSize: '14px' }}
        >
          Arenaball
        </FancyButton>
      </div>

    </div>
  );
};

export default TopDrawer;
