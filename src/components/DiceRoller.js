import React, { useState } from 'react';
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

  const calculateRoll = (formula) => {
    let total = 0;
    const diceRegex = /(\d+)?d(\d+)([+-]\d+)?/g;
    let match;

    while ((match = diceRegex.exec(formula)) !== null) {
      const numDice = parseInt(match[1] || '1');
      const sides = parseInt(match[2]);
      const modifier = parseInt(match[3] || '0');

      for (let i = 0; i < numDice; i++) {
        total += Math.floor(Math.random() * sides) + 1;
      }
      total += modifier;
    }
    return total;
  };

  const roll = () => {
    if (!formula.trim()) return;
    
    try {
      const result = calculateRoll(formula);
      const newRoll = {
        formula,
        result,
        name: name || 'Unnamed Roll',
        timestamp: Date.now()
      };
      setHistory(prev => [newRoll, ...prev].slice(0, 10));
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
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: 20,
      background: 'rgba(0,0,0,0.95)',
      padding: 20,
      borderRadius: 8,
      border: '1px solid #b8860b',
      display: 'grid',
      gridTemplateColumns: '200px 300px',
      gap: 20,
      color: 'gold'
    }}>
      <div style={{ borderRight: '1px solid #b8860b', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
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
            opacity: 1 - (i * 0.1),
            marginBottom: 5,
            fontSize: '14px'
          }}>
            <strong>{roll.name}:</strong> {roll.formula} = {roll.result}
          </div>
        ))}
      </div>

      <div>
        <div style={{ marginBottom: 15 }}>
          <label style={{ color: '#b8860b', display: 'block', marginBottom: 5 }}>
            Roll Description
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Attack roll, Save, etc."
            style={{
              width: '100%',
              marginBottom: 10,
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid #b8860b',
              color: 'gold',
              padding: '5px'
            }}
          />
          
          <label style={{ color: '#b8860b', display: 'block', marginBottom: 5 }}>
            Dice Formula
          </label>
          <input
            value={formula}
            onChange={e => setFormula(e.target.value)}
            onKeyPress={handleFormulaKeyPress}
            placeholder="2d6+3, d20+5, etc."
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid #b8860b',
              color: 'gold',
              padding: '5px'
            }}
          />
        </div>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10
        }}>
          {DICE_TYPES.map(die => (
            <FancyButton
              key={die.sides}
              onClick={() => setFormula(prev => `${prev}d${die.sides}`)}
              style={{
                height: 60,
                fontSize: '18px',
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
