import { InitiativeHandler } from './InitiativeHandler';
import { PlayerLogic } from './PlayerLogic';
import { MonsterLogic } from './MonsterLogic';
import { CombatResolution } from './CombatResolution';
import { CharacterPreservation } from '../utils/CharacterPreservation';
import { CombatMenu } from './CombatMenuStyles';  // Fixed import path

export class GameLogic {
    constructor(dungeon) {
        this.dungeon = dungeon;
        this.initiativeHandler = new InitiativeHandler();
        this.playerLogic = new PlayerLogic(this);
        this.monsterLogic = new MonsterLogic();
        this.combatResolution = new CombatResolution();
        this.inCombat = false;
        this.entities = new Map();
        this.characterPreservation = new CharacterPreservation();
        this.combatMenu = new CombatMenu(this);
    }

    async startCombat() {
        if (this.inCombat) return false;

        // Check if dungeon is valid first
        const dungeonValid = await this.validateExistingDungeon();
        if (!dungeonValid) {
            this.combatMenu.updateStatus("Invalid dungeon state");
            return false;
        }

        // Verify all players have valid character data
        const players = this.dungeon.getPlayers();
        const allPlayersValid = players.every(player => 
            this.characterPreservation.hasValidCharacter(player.id)
        );

        if (!allPlayersValid) {
            this.combatMenu.updateStatus("Missing player character data");
            return false;
        }

        // Initialize combat
        this.inCombat = true;
        this.combatResolution.startCombat();
        
        // Update display
        this.combatMenu.updateStatus("Combat started!");
        return true;
    }

    async validateExistingDungeon() {
        // Only validate if dungeon is in invalid state
        const hasPlayers = this.dungeon.getPlayers().length > 0;
        const hasMonsters = this.dungeon.getMonsters().length > 0;
        
        if (!hasPlayers || !hasMonsters) {
            return await this.dungeonValidator.validateDungeonGeneration();
        }
        
        return true;
    }

    processTurn() {
        if (!this.inCombat) return;

        const currentTurn = this.initiativeHandler.getCurrentTurn();
        if (!currentTurn) return;

        const entity = currentTurn.entity;
        
        if (entity.type === 'player') {
            this.playerLogic.startPlayerTurn(entity);
        } else if (entity.type === 'monster') {
            this.processMonsterTurn(entity);
        }
    }

    processMonsterTurn(monster) {
        const player = this.dungeon.getPlayers()[0]; // For now, target first player
        const action = this.monsterLogic.decideAction(monster, player, this.dungeon);
        
        switch(action.type) {
            case 'attack':
                const distance = Math.abs(monster.x - player.x) + Math.abs(monster.y - player.y);
                if (distance <= 1) { // Adjacent squares only
                    const hitRoll = Math.floor(Math.random() * 20) + 1 + monster.properties.attackBonus;
                    if (hitRoll >= player.properties.ac) {
                        // Calculate damage
                        const damage = Math.floor(Math.random() * monster.properties.damageDice) + monster.properties.damageBonus;
                        player.properties.hp -= damage;
                        console.log(`${monster.properties.name} hits ${player.properties.name} for ${damage} damage!`);
                        
                        if (player.properties.hp <= 0) {
                            this.combatResolution.recordDefeat(player);
                        }
                    } else {
                        console.log(`${monster.properties.name} misses ${player.properties.name}!`);
                    }
                } else {
                    // Move towards player if can't attack
                    this.moveMonsterTowardsTarget(monster, player);
                }
                break;
                
            case 'move':
                const moveDistance = action.distance === 'half' ? 
                    Math.floor(monster.properties.speed / 2) : 
                    monster.properties.speed;
                this.moveMonsterTowardsTarget(monster, player, moveDistance);
                break;
        }
        
        this.nextTurn();
    }

    moveMonsterTowardsTarget(monster, target, maxDistance = monster.properties.speed) {
        const dx = target.x - monster.x;
        const dy = target.y - monster.y;
        
        // Simple A* or pathfinding could be implemented here
        // For now, just move in the direction of the target
        const moveX = Math.sign(dx);
        const moveY = Math.sign(dy);
        
        let moved = 0;
        while (moved < maxDistance) {
            const newX = monster.x + moveX;
            const newY = monster.y + moveY;
            
            // Check if movement is valid (not through walls, etc)
            if (this.dungeon.isValidMove(newX, newY)) {
                monster.x = newX;
                monster.y = newY;
                moved += 1;
            } else {
                break;
            }
        }
    }

    nextTurn() {
        if (!this.inCombat) return;
        
        if (this.checkCombatEnd()) {
            this.endCombat();
            return;
        }

        this.initiativeHandler.nextTurn();
        this.processTurn();
    }

    checkCombatEnd() {
        const monstersDefeated = !this.dungeon.getMonsters().length;
        const chestsLooted = !this.dungeon.getChests().length;
        const playersDefeated = !this.dungeon.getAlivePlayers().length;
        
        return monstersDefeated && chestsLooted || playersDefeated;
    }

    endCombat() {
        this.inCombat = false;
        const report = this.combatResolution.generateCombatReport();
        console.log(report);
        // Clean up combat state
        this.initiativeHandler = new InitiativeHandler();
        this.entities.clear();
    }
}
