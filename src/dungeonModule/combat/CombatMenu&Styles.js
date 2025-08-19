export class CombatMenu {
    constructor(gameState, container) {
        if (!gameState || typeof gameState.startCombat !== 'function') {
            console.error('CombatMenu: Invalid gameState provided');
            return;
        }
        
        this.gameState = gameState;
        this.container = container || document.body;
        this.setupStyles();
        this.createMenu();
        
        this.gameState.combatMenu = this;
    }

    setupStyles() {
        const style = document.createElement('style');
        style.textContent = this.getCombatStyles();
        document.head.appendChild(style);
    }
    
    getCombatStyles() {
        return `
            .combat-menu {
                position: relative;
                background: rgba(0, 0, 0, 0.8);
                padding: 10px;
                border-radius: 5px;
                margin-bottom: 10px;
            }
            .start-combat-btn {
                background: #ff4444;
                color: white;
                padding: 12px 24px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                margin-right: 10px;
                font-size: 16px;
                font-weight: bold;
                text-transform: uppercase;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                transition: all 0.3s ease;
            }
            .start-combat-btn:hover {
                background: #ff6666;
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            }
            .start-combat-btn:active {
                transform: translateY(0);
                box-shadow: 0 1px 2px rgba(0,0,0,0.2);
            }
            .start-combat-btn:disabled {
                background: #666;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }
            .combat-active .start-combat-btn {
                display: none;
            }
            .combat-controls {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .combat-status {
                background: rgba(0, 0, 0, 0.6);
                padding: 8px;
                border-radius: 4px;
                margin-top: 10px;
                display: none;
                color: white;
                font-weight: bold;
                min-width: 200px;
            }
            .combat-active .combat-status {
                display: block;
            }
            .turn-indicator {
                color: white;
                margin-top: 10px;
            }
            .turn-counter {
                color: #fff;
                font-size: 14px;
                margin-top: 10px;
                text-align: center;
            }
            .active-player {
                background: rgba(0, 255, 0, 0.2);
                border: 2px solid #4CAF50;
            }
        `;
    }

    createMenu() {
        const menu = document.createElement('div');
        menu.className = 'combat-menu';
        
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'combat-controls';
        
        const startButton = document.createElement('button');
        startButton.className = 'start-combat-btn';
        startButton.innerHTML = '⚔️ START COMBAT';
        startButton.onclick = async () => {
            if (!this.gameState.dungeon) {
                this.updateStatus('No active dungeon');
                return;
            }

            startButton.disabled = true;
            this.updateStatus('Initializing combat...');
            
            try {
                const success = await this.gameState.startCombat();
                if (success) {
                    menu.classList.add('combat-active');
                    this.updateStatus('Combat Started!');
                    this.updateTurnDisplay(1, 0, this.gameState.dungeon.getPlayers().length + 
                                               this.gameState.dungeon.getMonsters().length);
                } else {
                    startButton.disabled = false;
                    this.updateStatus('Failed to start combat');
                }
            } catch (error) {
                console.error('Error starting combat:', error);
                startButton.disabled = false;
                this.updateStatus('Error starting combat');
            }
        };
        
        const statusDiv = document.createElement('div');
        statusDiv.className = 'combat-status';
        this.statusDiv = statusDiv;
        
        controlsDiv.appendChild(startButton);
        controlsDiv.appendChild(statusDiv);
        menu.appendChild(controlsDiv);
        
        const turnCounter = document.createElement('div');
        turnCounter.className = 'turn-counter';
        this.turnCounter = turnCounter;
        menu.appendChild(turnCounter);

        this.container.appendChild(menu);
    }

    updateTurnDisplay(round, currentTurn, totalEntities) {
        if (this.turnCounter) {
            this.turnCounter.textContent = `Round: ${round} | Turn: ${currentTurn + 1}/${totalEntities}`;
        }
    }

    updateStatus(text) {
        if (this.statusDiv) {
            this.statusDiv.textContent = text;
        }
    }
}
