import React, { useMemo, useState } from 'react';
import FancyButton from './buttons/FancyButton';

const DICE_TYPES = [
  { sides: 4, label: 'd4' },
  { sides: 6, label: 'd6' },
  { sides: 8, label: 'd8' },
  { sides: 10, label: 'd10' },
  { sides: 12, label: 'd12' },
  { sides: 20, label: 'd20' }
];

const DiceRoller = () => {
  const [history, setHistory] = useState([]);
  const [formula, setFormula] = useState('');
  const [name, setName] = useState('');
  const [adv, setAdv] = useState('normal'); // normal | advantage | disadvantage

  const styledCard = useMemo(() => ({
    background: 'linear-gradient(145deg, rgba(15,15,15,0.95), rgba(30,15,0,0.9))',
    padding: 14,
    borderRadius: 10,
    border: '1px solid #b8860b',
    display: 'grid',
    gridTemplateColumns: '200px 280px',
    gap: 14,
    color: 'gold',
    boxShadow: '0 8px 24px rgba(0,0,0,0.6), inset 0 0 40px rgba(184,134,11,0.08)'
  }), []);

  const calculateRoll = (formula) => {
    let total = 0;
    const breakdown = [];
    const diceRegex = /(\d+)?d(\d+)([+-]\d+)?/g;
    let match;

    while ((match = diceRegex.exec(formula)) !== null) {
      const numDice = parseInt(match[1] || '1');
      const sides = parseInt(match[2]);
      const modifier = parseInt(match[3] || '0');

      const rolls = [];
      for (let i = 0; i < numDice; i++) {
        let r1 = Math.floor(Math.random() * sides) + 1;
        let r2 = Math.floor(Math.random() * sides) + 1;
        const val = adv === 'advantage' ? Math.max(r1, r2) : adv === 'disadvantage' ? Math.min(r1, r2) : r1;
        rolls.push(val);
        total += val;
      }
      total += modifier;
      breakdown.push({ text: `${numDice || 1}d${sides}${modifier ? (modifier>0?`+${modifier}`:modifier) : ''}`, rolls, modifier });
    }
    return { total, breakdown };
  };

  const roll = () => {
    if (!formula.trim()) return;
    try {
      const { total, breakdown } = calculateRoll(formula);
      const newRoll = {
        formula,
        result: total,
        breakdown,
        mode: adv,
        name: name || 'Unnamed Roll',
        timestamp: Date.now()
      };
      setHistory(prev => [newRoll, ...prev].slice(0, 12));
    } catch (err) {
      console.error('Invalid formula');
    }
  };

  const handleFormulaKeyPress = (e) => {
    if (e.key === 'Enter') {
      roll();
    }
  };

  const clearHistory = () => {
    setHistory([]);
    setFormula('');
    setName('');
  };

  return (
    <div style={styledCard}>
      <div style={{ borderRight: '1px solid #b8860b', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h4 style={{ color: '#b8860b', margin: 0 }}>Roll History</h4>
          <FancyButton 
            onClick={clearHistory}
            style={{ padding: '2px 8px', fontSize: '12px' }}
          >
            Clear
          </FancyButton>
        </div>
        {history.map((roll, i) => (
          <div key={i} style={{ 
            opacity: 0.95 - (i * 0.1),
            marginBottom: 8,
            fontSize: '13px',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(184,134,11,0.25)',
            borderRadius: 6,
            padding: '6px 8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{roll.name}</strong>
              <span style={{ color: '#aaa', fontSize: '12px' }}>{new Date(roll.timestamp).toLocaleTimeString()}</span>
            </div>
            <div>
              {roll.formula} {roll.mode !== 'normal' ? `(${roll.mode})` : ''} = <strong style={{ color: '#ffd700' }}>{roll.result}</strong>
            </div>
            {roll.breakdown && roll.breakdown.length > 0 && (
              <div style={{ color: '#c9a44b', fontSize: '12px', marginTop: 3 }}>
                {roll.breakdown.map((b, idx) => (
                  <div key={idx}>
                    {b.text}: [ {b.rolls.join(', ')} ]{b.modifier ? ` ${b.modifier>0?'+':''}${b.modifier}` : ''}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div>
        <div style={{ marginBottom: 10 }}>
          <label style={{ color: '#b8860b', display: 'block', marginBottom: 5 }}>
            Roll Description
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Attack roll, Save, etc."
            style={{ width: '100%', marginBottom: 8, background: 'rgba(0,0,0,0.5)', border: '1px solid #b8860b', color: 'gold', padding: '6px' }}
          />
          
          <label style={{ color: '#b8860b', display: 'block', marginBottom: 5 }}>
            Dice Formula
          </label>
          <input
            value={formula}
            onChange={e => setFormula(e.target.value)}
            onKeyPress={handleFormulaKeyPress}
            placeholder="2d6+3, d20+5, etc."
            style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid #b8860b', color: 'gold', padding: '6px' }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <FancyButton onClick={() => setAdv('normal')} style={{ padding: '2px 6px', opacity: adv==='normal'?1:0.6 }}>Normal</FancyButton>
            <FancyButton onClick={() => setAdv('advantage')} style={{ padding: '2px 6px', opacity: adv==='advantage'?1:0.6 }}>Adv</FancyButton>
            <FancyButton onClick={() => setAdv('disadvantage')} style={{ padding: '2px 6px', opacity: adv==='disadvantage'?1:0.6 }}>Dis</FancyButton>
          </div>
        </div>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8
        }}>
          {DICE_TYPES.map(die => (
            <FancyButton
              key={die.sides}
              onClick={() => setFormula(prev => `${prev}${prev && /\d$/.test(prev) ? '+' : ''}1d${die.sides}`)}
              style={{
                height: 44,
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {die.label}
            </FancyButton>
          ))}
        </div>

        <FancyButton
          onClick={roll}
          style={{ width: '100%', marginTop: 10 }}
        >
          Roll
        </FancyButton>
      </div>
    </div>
  );
};

export default DiceRoller;
