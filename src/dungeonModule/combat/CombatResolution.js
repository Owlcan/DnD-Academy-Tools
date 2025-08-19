export class CombatResolution {
    constructor() {
        this.monstersDefeated = new Map();
        this.chestsLooted = 0;
        this.combatStartTime = null;
    }

    startCombat() {
        this.combatStartTime = Date.now();
        this.monstersDefeated.clear();
        this.chestsLooted = 0;
    }

    recordDefeat(entity) {
        if (entity.type === 'monster') {
            const count = this.monstersDefeated.get(entity.properties.name) || 0;
            this.monstersDefeated.set(entity.properties.name, count + 1);
        } else if (entity.type === 'chest') {
            this.chestsLooted++;
        }
    }

    generateCombatReport() {
        let report = "Combat CONCLUDED\n";
        report += "-----------------\n";
        
        if (this.monstersDefeated.size > 0) {
            report += "Monsters defeated:\n";
            this.monstersDefeated.forEach((count, name) => {
                report += `- ${name}: ${count}\n`;
            });
        }

        if (this.chestsLooted > 0) {
            report += `\nChests looted: ${this.chestsLooted}`;
        }

        return report;
    }
}
