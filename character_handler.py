# Add a function to convert spells to attacks
def convert_spells_to_attacks(self, character):
    """
    Converts a character's known spells into attack options
    Returns a list of attacks created from spells
    """
    spell_attacks = []
    
    if hasattr(character, 'known_spells') and character.known_spells:
        for spell in character.known_spells:
            # Create a simple attack object from the spell
            attack = {
                'name': spell,
                'is_spell': True,
                # Default values - these could be expanded later
                'damage': '1d8',
                'damage_type': 'radiant',  # Default damage type
                'to_hit': character.proficiency_bonus + self.get_ability_modifier(character, 'intelligence')
            }
            spell_attacks.append(attack)
    
    return spell_attacks

# Add a method to handle spell attack selection
def display_spell_attacks(self, character):
    """
    Displays available spell attacks for selection
    """
    spell_attacks = self.convert_spells_to_attacks(character)
    
    if not spell_attacks:
        print(f"{character.name} has no spells.")
        return
    
    print(f"\n{character.name}'s Spell Attacks:")
    for i, attack in enumerate(spell_attacks):
        print(f"{i}: {attack['name']} - {attack['damage']} {attack['damage_type']} damage")
    
    # Here you could add input handling for spell selection
    # For example: choice = input("Select a spell to cast (number): ")

# In your key handling or main game loop, add code to respond to 'Z' key press:
# ... existing code ...

# Add this to wherever your key press events are handled
def handle_key_press(self, key, character):
    # ... existing code ...
    
    if key == 'z' or key == 'Z':
        self.display_spell_attacks(character)
    
    # ... existing code ...