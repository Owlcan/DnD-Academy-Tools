export class InitiativeHandler {
    constructor() {
        this.combatOrder = [];
        this.currentTurn = 0;
        this.round = 1;
    }

    rollInitiative(entity) {
        const dexMod = Math.floor((entity.properties?.dexterity || 10) - 10) / 2;
        const roll = Math.floor(Math.random() * 20) + 1;
        
        // Add proficiency if applicable
        let profBonus = 0;
        if (entity.type === 'player') {
            const hasInitiativeProf = ['rogue', 'fighter', 'sorcerer'].some(
                cls => entity.properties?.characterData?.class?.toLowerCase().includes(cls)
            );
            if (hasInitiativeProf) {
                profBonus = Math.floor((entity.properties.level + 7) / 4);
            }
        } else if (entity.properties?.dexterity >= 14) {
            profBonus = 2;
        }

        return roll + dexMod + profBonus;
    }

    startCombat(entities) {
        this.combatOrder = entities.map(entity => ({
            entity,
            initiative: this.rollInitiative(entity)
        }));

        // Sort by initiative, highest first
        this.combatOrder.sort((a, b) => b.initiative - a.initiative);
        this.currentTurn = 0;
        this.round = 1;
        
        return this.combatOrder;
    }

    nextTurn() {
        this.currentTurn++;
        if (this.currentTurn >= this.combatOrder.length) {
            this.currentTurn = 0;
            this.round++;
        }
        return this.getCurrentTurn();
    }

    getCurrentTurn() {
        return this.combatOrder[this.currentTurn];
    }

    getCurrentRound() {
        return this.round;
    }
}
