export class PlayerLogic {
    constructor(gameState) {
        this.gameState = gameState;
        this.activePlayer = null;
        this.turnComplete = false;
    }

    handleCharacterUpload(playerId, characterData) {
        // Preserve uploaded character data
        this.gameState.characterPreservation.saveCharacter(playerId, characterData);
        return true;
    }

    startPlayerTurn(player) {
        // Ensure we have valid character data
        if (!this.gameState.characterPreservation.hasValidCharacter(player.id)) {
            console.log("Cannot start turn - missing character data");
            this.passTurn();
            return;
        }
        this.activePlayer = player;
        this.turnComplete = false;
        this.highlightMovementOptions();
        this.highlightActivePlayer();
    }

    highlightMovementOptions() {
        const speed = this.activePlayer.properties.speed;
        const x = this.activePlayer.x;
        const y = this.activePlayer.y;
        const validMoves = [];
        
        // Check each position within movement range
        for (let dx = -speed; dx <= speed; dx++) {
            for (let dy = -speed; dy <= speed; dy++) {
                if (Math.abs(dx) + Math.abs(dy) <= speed) {
                    const newX = x + dx;
                    const newY = y + dy;
                    if (this.gameState.dungeon.isValidMove(newX, newY)) {
                        validMoves.push({x: newX, y: newY});
                    }
                }
            }
        }
        
        return validMoves;
    }

    handleMovement(newX, newY) {
        if (!this.activePlayer || this.turnComplete) return false;
        
        const validMoves = this.highlightMovementOptions();
        const isValidMove = validMoves.some(move => move.x === newX && move.y === newY);
        
        if (!isValidMove) return false;
        
        this.activePlayer.x = newX;
        this.activePlayer.y = newY;
        this.turnComplete = true;
        return true;
    }

    handleAttack(target) {
        if (!this.activePlayer || this.turnComplete) return false;
        
        const distance = Math.abs(target.x - this.activePlayer.x) + 
                        Math.abs(target.y - this.activePlayer.y);
                        
        // Check if target is within range (melee = 1, ranged weapons could be different)
        const attackRange = this.activePlayer.properties.characterData?.attackRange || 1;
        
        if (distance > attackRange) return false;
        
        // Handle attack logic here
        const hitRoll = Math.floor(Math.random() * 20) + 1 + this.activePlayer.properties.attackBonus;
        
        if (hitRoll >= target.properties.ac) {
            const damage = this.calculateDamage();
            target.properties.hp -= damage;
            console.log(`${this.activePlayer.properties.name} hits ${target.properties.name} for ${damage} damage!`);
            
            if (target.properties.hp <= 0) {
                this.gameState.combatResolution.recordDefeat(target);
            }
        } else {
            console.log(`${this.activePlayer.properties.name} misses ${target.properties.name}!`);
        }
        
        this.turnComplete = true;
        return true;
    }

    calculateDamage() {
        const weapon = this.activePlayer.properties.characterData?.equipment?.weapons?.[0];
        if (!weapon) return 1 + Math.floor((this.activePlayer.properties.strength - 10) / 2);
        
        const damageRoll = Math.floor(Math.random() * weapon.damageDice) + 1;
        return damageRoll + this.activePlayer.properties.damageBonus;
    }

    handleChestInteraction(chest) {
        if (!this.activePlayer || this.turnComplete) return false;
        
        const distance = Math.abs(chest.x - this.activePlayer.x) + 
                        Math.abs(chest.y - this.activePlayer.y);
                        
        if (distance <= 1) {
            this.gameState.combatResolution.recordDefeat(chest);
            this.turnComplete = true;
            return true;
        }
        
        return false;
    }

    passTurn() {
        if (!this.activePlayer || this.turnComplete) return false;
        this.turnComplete = true;
        return true;
    }

    highlightActivePlayer() {
        // Remove previous highlights
        document.querySelectorAll('.active-player').forEach(el => 
            el.classList.remove('active-player')
        );
        
        // Add highlight to current player
        const playerElement = document.querySelector(`[data-entity-id="${this.activePlayer.id}"]`);
        if (playerElement) {
            playerElement.classList.add('active-player');
        }
    }
}
