import React, { useState, useEffect } from 'react';
import FancyButton from '../buttons/FancyButton';
import { getAvailableSpells } from '../../dungeonModule/utils/spellSystem';

// Load all spells directly
let allSpells = [];
try {
  allSpells = require('../../dungeonModule/data/Spells/spells.json');
  
  // Add custom spells that might not be in the spells.json file
  allSpells = [
    ...allSpells,
    {
      Spell: "Shocking Touch",
      Level: "Cantrip",
      School: "Evocation",
      Classes: ["Sorcerer", "Wizard", "Warlock"]
    },
    {
      Spell: "Warlock Blast",
      Level: "Cantrip",
      School: "Evocation",
      Classes: ["Warlock"]
    },
    {
      Spell: "Burning Cone",
      Level: "1",
      School: "Evocation",
      Classes: ["Sorcerer", "Wizard"]
    },
    {
      Spell: "Warlock Bolt",
      Level: "1",
      School: "Necromancy",
      Classes: ["Warlock"]
    }
  ];
} catch (error) {
  console.error('Failed to load spells:', error);
  // Fallback to at least the custom spells if the import fails
  allSpells = [
    {
      Spell: "Shocking Grasp",
      Level: "Cantrip",
      School: "Evocation",
      Classes: ["Sorcerer", "Wizard", "Warlock"]
    },
    {
      Spell: "Eldritch Blast",
      Level: "Cantrip",
      School: "Evocation",
      Classes: ["Warlock"]
    },
    {
      Spell: "Burning Hands",
      Level: "1",
      School: "Evocation",
      Classes: ["Sorcerer", "Wizard", "Rogue"]
    },
    {
      Spell: "Warlock Bolt",
      Level: "1",
      School: "Necromancy",
      Classes: ["Warlock", "Rogue"]
    }
  ];
}

// Character sheet tabs for organization
const TABS = {
  BASIC: 'Basic Stats',
  COMBAT: 'Combat & Skills',
  SPELLS: 'Spellcasting',
  INVENTORY: 'Equipment & Items'
};

const CharacterSheet = ({ characterData, onDataChange, onImportJSON }) => {
  const [activeTab, setActiveTab] = useState(TABS.BASIC);
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [selectedSpell, setSelectedSpell] = useState(null);

  // Process character data to ensure proper formatting and token representation
  const processCharacterData = (data) => {
    if (!data) return data;
    
    // Create a copy to avoid direct mutation
    const processedData = {...data};
    
    // If the character name exists, ensure proper token display
    if (processedData.name) {
      // Store the correct token identifier (first character of name) in a dedicated field
      processedData.tokenIdentifier = processedData.name.charAt(0).toUpperCase();
      
      // Make sure the name is not hardcoded to "Alaric" in any components
      if (processedData.name.toLowerCase() === 'alaric') {
        console.log('Character name is Alaric - ensuring proper token display');
      }
    }
    
    return processedData;
  };

  // Use the processed data throughout the component
  const displayData = processCharacterData(characterData);

  // Helper to update nested character properties
  const updateNestedProperty = (path, value) => {
    const pathArray = path.split('.');
    const newData = { ...characterData };
    let current = newData;
    
    // Navigate to the nested property
    for (let i = 0; i < pathArray.length - 1; i++) {
      // Create the object path if it doesn't exist
      if (!current[pathArray[i]]) {
        current[pathArray[i]] = {};
      }
      current = current[pathArray[i]];
    }
    
    current[pathArray[pathArray.length - 1]] = value;
    onDataChange(newData);
  };

  const handleImportJSON = () => {
    try {
      // First try to parse the JSON input
      const importedData = JSON.parse(jsonInput);
      
      // Check if this is a DNDBeyond character export format
      if (importedData.data && importedData.data.name) {
        // This is likely a DNDBeyond export, so let's extract and transform the relevant data
        const dndbCharacter = importedData.data;
        
        // Create a simplified character object that matches our app's format
        const transformedData = {
          name: dndbCharacter.name,
          race: dndbCharacter.race ? dndbCharacter.race.fullName : '',
          class: dndbCharacter.classes ? 
            dndbCharacter.classes.map(c => `${c.definition.name} ${c.level}`).join(', ') : '',
          background: dndbCharacter.background?.definition?.name || '',
          alignment: dndbCharacter.alignmentId ? convertAlignmentIdToString(dndbCharacter.alignmentId) : '',
          gender: dndbCharacter.gender || '',
          attributes: extractAttributes(dndbCharacter.stats),
          hit_points: {
            max: dndbCharacter.baseHitPoints || 0,
            current: dndbCharacter.baseHitPoints - (dndbCharacter.removedHitPoints || 0),
            temporary: dndbCharacter.temporaryHitPoints || 0
          },
          saving_throws: extractSavingThrows(dndbCharacter),
          skills: extractSkills(dndbCharacter),
          equipment: {
            armor: extractArmor(dndbCharacter.inventory),
            weapons: extractWeapons(dndbCharacter.inventory),
            items: extractItems(dndbCharacter.inventory),
          },
          features_traits: extractFeatures(dndbCharacter),
          languages: extractLanguages(dndbCharacter),
          proficiencies: extractProficiencies(dndbCharacter),
          speed: extractSpeed(dndbCharacter),
          spellcasting: extractSpellcasting(dndbCharacter)
        };
        
        onImportJSON(transformedData);
      } else {
        // Regular JSON import, pass directly to parent component
        onImportJSON(importedData);
      }
      
      setShowJsonImport(false);
      setJsonInput('');
    } catch (error) {
      console.error("JSON import error:", error);
      alert('Invalid JSON format. Please check your input.');
    }
  };

  // Helper functions to extract data from DNDBeyond format
  const convertAlignmentIdToString = (alignmentId) => {
    const alignments = {
      1: 'Lawful Good',
      2: 'Neutral Good',
      3: 'Chaotic Good',
      4: 'Lawful Neutral',
      5: 'Neutral',
      6: 'Chaotic Neutral',
      7: 'Lawful Evil',
      8: 'Neutral Evil',
      9: 'Chaotic Evil'
    };
    return alignments[alignmentId] || '';
  };

  const extractAttributes = (stats) => {
    if (!stats || !Array.isArray(stats)) return {};
    
    const attributes = {};
    const attrNames = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    
    stats.forEach((stat, index) => {
      if (index < attrNames.length) {
        attributes[attrNames[index]] = stat.value || 10;
      }
    });
    
    return attributes;
  };

  const extractSavingThrows = (character) => {
    // In a real implementation, we would calculate this from proficiencies and stat bonuses
    return {
      strength: Math.floor((character.stats?.[0]?.value || 10) / 2) - 5,
      dexterity: Math.floor((character.stats?.[1]?.value || 10) / 2) - 5,
      constitution: Math.floor((character.stats?.[2]?.value || 10) / 2) - 5,
      intelligence: Math.floor((character.stats?.[3]?.value || 10) / 2) - 5,
      wisdom: Math.floor((character.stats?.[4]?.value || 10) / 2) - 5,
      charisma: Math.floor((character.stats?.[5]?.value || 10) / 2) - 5
    };
  };

  const extractSkills = (character) => {
    // Basic skills mapping
    return {
      acrobatics: 0,
      animal_handling: 0,
      arcana: 0,
      athletics: 0,
      deception: 0,
      history: 0,
      insight: 0,
      intimidation: 0,
      investigation: 0,
      medicine: 0,
      nature: 0,
      perception: 0,
      performance: 0,
      persuasion: 0,
      religion: 0,
      sleight_of_hand: 0,
      stealth: 0,
      survival: 0
    };
  };

  const extractArmor = (inventory) => {
    if (!inventory || !Array.isArray(inventory)) return {};
    
    const armor = inventory.find(item => 
      item.definition?.type === 'Heavy Armor' || 
      item.definition?.type === 'Medium Armor' || 
      item.definition?.type === 'Light Armor'
    );
    
    if (armor) {
      return {
        name: armor.definition.name,
        armor_class: armor.definition.armorClass || 10
      };
    }
    
    return { name: '', armor_class: 10 };
  };

  const extractWeapons = (inventory) => {
    if (!inventory || !Array.isArray(inventory)) return [];
    
    return inventory
      .filter(item => item.definition?.filterType === 'Weapon')
      .map(weapon => ({
        name: weapon.definition.name,
        attack_bonus: '+0', // Would need to calculate based on proficiency and stats
        damage: weapon.definition.damage?.diceString || ''
      }));
  };

  const extractItems = (inventory) => {
    if (!inventory || !Array.isArray(inventory)) return [];
    
    return inventory
      .filter(item => 
        item.definition?.filterType !== 'Weapon' && 
        item.definition?.type !== 'Heavy Armor' && 
        item.definition?.type !== 'Medium Armor' && 
        item.definition?.type !== 'Light Armor' &&
        item.definition?.type !== 'Shield'
      )
      .map(item => item.definition.name);
  };

  const extractFeatures = (character) => {
    // For simplicity, we'll just return class features
    const features = [];
    
    if (character.classes) {
      character.classes.forEach(cls => {
        if (cls.classFeatures) {
          cls.classFeatures.forEach(feature => {
            if (feature.definition && feature.definition.name) {
              features.push(feature.definition.name);
            }
          });
        }
      });
    }
    
    return features;
  };

  const extractLanguages = (character) => {
    // This is simplified - in a real implementation we would extract this from modifiers
    return ['Common'];
  };

  const extractProficiencies = (character) => {
    // Simplified proficiencies
    const proficiencies = [];
    
    if (character.modifiers?.class) {
      character.modifiers.class.forEach(mod => {
        if (mod.type === 'proficiency' && mod.friendlySubtypeName) {
          proficiencies.push(mod.friendlySubtypeName);
        }
      });
    }
    
    return proficiencies;
  };

  const extractSpeed = (character) => {
    return character.race?.weightSpeeds?.normal?.walk 
      ? `${character.race.weightSpeeds.normal.walk} ft.` 
      : '30 ft.';
  };

  const extractSpellcasting = (character) => {
    return {
      spell_slots: {
        level_1: 0,
        level_2: 0,
        level_3: 0
      },
      known_spells: character.spells?.class
        ?.filter(spell => spell.definition?.name)
        ?.map(spell => spell.definition.name) || []
    };
  };

  // Render attributes section
  const renderAttributes = () => {
    const attributes = displayData?.attributes || {};
    return (
      <div style={styles.attributesContainer}>
        {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map(attr => (
          <div key={attr} style={styles.attributeBox}>
            <label style={styles.attributeLabel}>{attr.charAt(0).toUpperCase() + attr.slice(1)}</label>
            <input
              type="number"
              value={attributes[attr] || ''}
              onChange={(e) => updateNestedProperty(`attributes.${attr}`, parseInt(e.target.value) || 0)}
              style={styles.attributeInput}
              min="1"
              max="30"
            />
            <div style={styles.attributeMod}>
              {Math.floor((attributes[attr] || 10) / 2) - 5 >= 0 ? '+' : ''}
              {Math.floor((attributes[attr] || 10) / 2) - 5}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render basic info tab
  const renderBasicTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.row}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Character Name</label>
          <input
            type="text"
            value={displayData?.name || ''}
            onChange={(e) => updateNestedProperty('name', e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Class & Level</label>
          <input
            type="text"
            value={displayData?.class || ''}
            onChange={(e) => updateNestedProperty('class', e.target.value)}
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.row}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Race</label>
          <input
            type="text"
            value={displayData?.race || ''}
            onChange={(e) => updateNestedProperty('race', e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Background</label>
          <input
            type="text"
            value={displayData?.background || ''}
            onChange={(e) => updateNestedProperty('background', e.target.value)}
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.row}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Alignment</label>
          <input
            type="text"
            value={displayData?.alignment || ''}
            onChange={(e) => updateNestedProperty('alignment', e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label style={styles.label}>Gender</label>
          <input
            type="text"
            value={displayData?.gender || ''}
            onChange={(e) => updateNestedProperty('gender', e.target.value)}
            style={styles.input}
          />
        </div>
      </div>

      <h3 style={styles.sectionTitle}>Attributes</h3>
      {renderAttributes()}

      <h3 style={styles.sectionTitle}>Languages</h3>
      <textarea
        value={(displayData?.languages || []).join(', ')}
        onChange={(e) => updateNestedProperty('languages', e.target.value.split(',').map(lang => lang.trim()))}
        style={styles.textarea}
        placeholder="Common, Elvish, Dwarvish..."
      />
    </div>
  );

  // Render combat & skills tab
  const renderCombatTab = () => {
    const savingThrows = displayData?.saving_throws || {};
    const skills = displayData?.skills || {};
    const hitPoints = displayData?.hit_points || {};
    
    return (
      <div style={styles.tabContent}>
        <h3 style={styles.sectionTitle}>Hit Points</h3>
        <div style={styles.row}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Max HP</label>
            <input
              type="number"
              value={hitPoints.max || ''}
              onChange={(e) => updateNestedProperty('hit_points.max', parseInt(e.target.value) || 0)}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Current HP</label>
            <input
              type="number"
              value={hitPoints.current || ''}
              onChange={(e) => updateNestedProperty('hit_points.current', parseInt(e.target.value) || 0)}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Temporary HP</label>
            <input
              type="number"
              value={hitPoints.temporary || ''}
              onChange={(e) => updateNestedProperty('hit_points.temporary', parseInt(e.target.value) || 0)}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Armor Class</label>
            <input
              type="number"
              value={displayData?.equipment?.armor?.armor_class || ''}
              onChange={(e) => updateNestedProperty('equipment.armor.armor_class', parseInt(e.target.value) || 0)}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Speed</label>
            <input
              type="text"
              value={displayData?.speed || ''}
              onChange={(e) => updateNestedProperty('speed', e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        <h3 style={styles.sectionTitle}>Combat Bonuses</h3>
        <div style={styles.row}>
          <div style={styles.formGroup}>
            <label style={styles.label}>To Hit Bonus</label>
            <input
              type="number"
              value={displayData?.combat_bonuses?.to_hit || ''}
              onChange={(e) => updateNestedProperty('combat_bonuses.to_hit', parseInt(e.target.value) || 0)}
              style={{...styles.input, ...styles.bonusInput}}
              placeholder="Global bonus to attack rolls"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Damage Bonus</label>
            <input
              type="number"
              value={displayData?.combat_bonuses?.damage || ''}
              onChange={(e) => updateNestedProperty('combat_bonuses.damage', parseInt(e.target.value) || 0)}
              style={{...styles.input, ...styles.bonusInput}}
              placeholder="Global bonus to damage"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Spell Attack Bonus</label>
            <input
              type="number"
              value={displayData?.combat_bonuses?.spell_attack || ''}
              onChange={(e) => updateNestedProperty('combat_bonuses.spell_attack', parseInt(e.target.value) || 0)}
              style={{...styles.input, ...styles.bonusInput}}
              placeholder="Bonus to spell attacks"
            />
          </div>
        </div>

        <h3 style={styles.sectionTitle}>Saving Throws</h3>
        <div style={styles.gridContainer}>
          {['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].map(attr => (
            <div key={attr} style={styles.gridItem}>
              <label style={styles.skillLabel}>{attr.substring(0, 3).toUpperCase()}</label>
              <input
                type="number"
                value={savingThrows[attr] || ''}
                onChange={(e) => updateNestedProperty(`saving_throws.${attr}`, parseInt(e.target.value) || 0)}
                style={styles.skillInput}
              />
            </div>
          ))}
        </div>

        <h3 style={styles.sectionTitle}>Skills</h3>
        <div style={styles.gridContainer}>
          {Object.keys(skills).map(skill => (
            <div key={skill} style={styles.gridItem}>
              <label style={styles.skillLabel}>{skill.replace('_', ' ')}</label>
              <input
                type="number"
                value={skills[skill] || ''}
                onChange={(e) => updateNestedProperty(`skills.${skill}`, parseInt(e.target.value) || 0)}
                style={styles.skillInput}
              />
            </div>
          ))}
        </div>

        <h3 style={styles.sectionTitle}>Proficiencies</h3>
        <textarea
          value={(displayData?.proficiencies || []).join(', ')}
          onChange={(e) => updateNestedProperty('proficiencies', e.target.value.split(',').map(prof => prof.trim()))}
          style={styles.textarea}
          placeholder="Light Armor, Simple Weapons..."
        />
      </div>
    );
  };

  // Render spells tab
  const renderSpellsTab = () => {
    const spellcasting = displayData?.spellcasting || {};
    
    return (
      <div style={styles.tabContent}>
        <h3 style={styles.sectionTitle}>Spell Slots</h3>
        <div style={styles.row}>
          {Object.entries(spellcasting.spell_slots || {}).map(([level, slots]) => (
            <div key={level} style={styles.formGroup}>
              <label style={styles.label}>{level.replace('_', ' ').toUpperCase()}</label>
              <input
                type="number"
                value={slots || ''}
                onChange={(e) => updateNestedProperty(`spellcasting.spell_slots.${level}`, parseInt(e.target.value) || 0)}
                style={styles.input}
              />
            </div>
          ))}
        </div>

        <h3 style={styles.sectionTitle}>Known Spells</h3>
        <textarea
          value={(spellcasting.known_spells || []).join('\n')}
          onChange={(e) => updateNestedProperty('spellcasting.known_spells', e.target.value.split('\n').map(spell => spell.trim()).filter(spell => spell))}
          style={{...styles.textarea, height: '180px'}}
          placeholder="Enter one spell per line..."
        />

        <h3 style={styles.sectionTitle}>Select Spells</h3>
        <div style={styles.row}>
          <select
            onChange={(e) => {
              const selectedSpell = allSpells.find(spell => spell.Spell === e.target.value);
              if (selectedSpell) {
                // Store the selected spell in component state instead of immediately adding it
                setSelectedSpell(selectedSpell);
              }
            }}
            style={{...styles.input, flex: 3}}
          >
            <option value="">Select a spell...</option>
            {allSpells.map((spell, index) => (
              <option key={index} value={spell.Spell}>
                {spell.Spell} ({spell.Level})
              </option>
            ))}
          </select>
          <FancyButton
            onClick={() => {
              if (selectedSpell) {
                // Add the selected spell to the character's known spells list
                updateNestedProperty('spellcasting.known_spells', [...(spellcasting.known_spells || []), selectedSpell.Spell]);
                // Clear the selected spell
                setSelectedSpell(null);
              }
            }}
            style={{...styles.smallButton, flex: 1, marginLeft: '10px'}}
          >
            Add Spell
          </FancyButton>
        </div>

        <h3 style={styles.sectionTitle}>Features & Traits</h3>
        <textarea
          value={(displayData?.features_traits || []).join('\n')}
          onChange={(e) => updateNestedProperty('features_traits', e.target.value.split('\n').map(feature => feature.trim()).filter(feature => feature))}
          style={{...styles.textarea, height: '180px'}}
          placeholder="Enter one feature per line..."
        />
      </div>
    );
  };

  // Render inventory tab
  const renderInventoryTab = () => {
    const weapons = displayData?.equipment?.weapons || [];
    
    return (
      <div style={styles.tabContent}>
        <h3 style={styles.sectionTitle}>Weapons</h3>
        <div style={styles.weaponsContainer}>
          {weapons.map((weapon, index) => (
            <div key={index} style={styles.weaponItem}>
              <div style={styles.row}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Weapon Name</label>
                  <input
                    type="text"
                    value={weapon.name || ''}
                    onChange={(e) => {
                      const newWeapons = [...weapons];
                      newWeapons[index] = {...newWeapons[index], name: e.target.value};
                      updateNestedProperty('equipment.weapons', newWeapons);
                    }}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Attack Bonus</label>
                  <input
                    type="text"
                    value={weapon.attack_bonus || ''}
                    onChange={(e) => {
                      const newWeapons = [...weapons];
                      newWeapons[index] = {...newWeapons[index], attack_bonus: e.target.value};
                      updateNestedProperty('equipment.weapons', newWeapons);
                    }}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Damage</label>
                  <input
                    type="text"
                    value={weapon.damage || ''}
                    onChange={(e) => {
                      const newWeapons = [...weapons];
                      newWeapons[index] = {...newWeapons[index], damage: e.target.value};
                      updateNestedProperty('equipment.weapons', newWeapons);
                    }}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <FancyButton
          onClick={() => {
            const newWeapons = [...weapons, { name: '', attack_bonus: '', damage: '' }];
            updateNestedProperty('equipment.weapons', newWeapons);
          }}
          style={styles.smallButton}
        >
          Add Weapon
        </FancyButton>

        <h3 style={styles.sectionTitle}>Armor</h3>
        <div style={styles.row}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Armor Name</label>
            <input
              type="text"
              value={displayData?.equipment?.armor?.name || ''}
              onChange={(e) => updateNestedProperty('equipment.armor.name', e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Armor Class</label>
            <input
              type="number"
              value={displayData?.equipment?.armor?.armor_class || ''}
              onChange={(e) => updateNestedProperty('equipment.armor.armor_class', parseInt(e.target.value) || 0)}
              style={styles.input}
            />
          </div>
        </div>

        <h3 style={styles.sectionTitle}>Items & Equipment</h3>
        <textarea
          value={(displayData?.equipment?.items || []).join('\n')}
          onChange={(e) => updateNestedProperty('equipment.items', e.target.value.split('\n').map(item => item.trim()).filter(item => item))}
          style={{...styles.textarea, height: '180px'}}
          placeholder="Enter one item per line..."
        />
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Character Sheet</h2>
        <div style={styles.actions}>
          <FancyButton 
            onClick={() => setShowJsonImport(!showJsonImport)}
            style={styles.smallButton}
          >
            {showJsonImport ? 'Cancel Import' : 'Import JSON'}
          </FancyButton>
        </div>
      </div>

      {showJsonImport ? (
        <div style={styles.jsonImport}>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            style={{...styles.textarea, height: '200px'}}
            placeholder="Paste your character JSON data here..."
          />
          <div style={styles.importActions}>
            <FancyButton onClick={handleImportJSON} style={styles.smallButton}>
              Import
            </FancyButton>
            <FancyButton onClick={() => setShowJsonImport(false)} style={styles.smallButton}>
              Cancel
            </FancyButton>
          </div>
        </div>
      ) : (
        <>
          <div style={styles.tabs}>
            {Object.entries(TABS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(label)}
                style={{
                  ...styles.tabButton,
                  ...(activeTab === label ? styles.activeTab : {})
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={styles.tabPanel}>
            {activeTab === TABS.BASIC && renderBasicTab()}
            {activeTab === TABS.COMBAT && renderCombatTab()}
            {activeTab === TABS.SPELLS && renderSpellsTab()}
            {activeTab === TABS.INVENTORY && renderInventoryTab()}
          </div>
        </>
      )}
    </div>
  );
};

// Styles with dark theme
const styles = {
  container: {
    background: '#1a1a1a',
    color: '#e1e1e1',
    borderRadius: '8px',
    border: '1px solid #3a0000',
    padding: '15px',
    maxHeight: '450px',
    width: '100%',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    borderBottom: '1px solid #3a0000',
    paddingBottom: '10px',
  },
  title: {
    margin: 0,
    color: '#c41e3a', // dark red
    fontFamily: "'Cinzel', serif",
    fontSize: '1.5rem',
  },
  actions: {
    display: 'flex',
    gap: '10px',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #3a0000',
    marginBottom: '15px',
  },
  tabButton: {
    background: 'transparent',
    border: 'none',
    color: '#e1e1e1',
    padding: '8px 15px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: "'Cinzel', serif",
    transition: 'all 0.2s',
    borderBottom: '2px solid transparent',
  },
  activeTab: {
    color: '#c41e3a',
    borderBottom: '2px solid #c41e3a',
    fontWeight: 'bold',
  },
  tabPanel: {
    overflowY: 'auto',
    maxHeight: '350px',
    padding: '0 5px',
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  row: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap',
  },
  formGroup: {
    flex: 1,
    minWidth: '120px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontSize: '14px',
    color: '#c41e3a',
  },
  input: {
    width: '100%',
    padding: '8px',
    background: '#2a2a2a',
    border: '1px solid #3a0000',
    borderRadius: '4px',
    color: '#e1e1e1',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '8px',
    background: '#2a2a2a',
    border: '1px solid #3a0000',
    borderRadius: '4px',
    color: '#e1e1e1',
    minHeight: '80px',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  sectionTitle: {
    color: '#c41e3a',
    fontSize: '16px',
    marginBottom: '5px',
    marginTop: '10px',
    borderBottom: '1px solid #3a0000',
    paddingBottom: '5px',
  },
  attributesContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
    justifyContent: 'space-between',
  },
  attributeBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '80px',
    background: '#2a2a2a',
    border: '1px solid #3a0000',
    borderRadius: '5px',
    padding: '8px',
  },
  attributeLabel: {
    textTransform: 'uppercase',
    fontSize: '12px',
    color: '#c41e3a',
    marginBottom: '5px',
  },
  attributeInput: {
    width: '50px',
    textAlign: 'center',
    padding: '5px',
    background: '#222',
    border: '1px solid #3a0000',
    borderRadius: '3px',
    color: '#e1e1e1',
    marginBottom: '5px',
  },
  attributeMod: {
    width: '30px',
    height: '30px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#3a0000',
    borderRadius: '50%',
    color: '#e1e1e1',
    fontWeight: 'bold',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '10px',
  },
  gridItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  skillLabel: {
    fontSize: '12px',
    color: '#c41e3a',
    marginBottom: '3px',
    textTransform: 'capitalize',
  },
  skillInput: {
    padding: '5px',
    background: '#2a2a2a',
    border: '1px solid #3a0000',
    borderRadius: '3px',
    color: '#e1e1e1',
  },
  jsonImport: {
    marginTop: '15px',
  },
  importActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
    justifyContent: 'flex-end',
  },
  smallButton: {
    fontSize: '12px',
    padding: '5px 10px',
  },
  weaponsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  weaponItem: {
    background: '#2a2a2a',
    border: '1px solid #3a0000',
    borderRadius: '5px',
    padding: '10px',
  },
  bonusInput: {
    textAlign: 'center',
  },
};

export default CharacterSheet;