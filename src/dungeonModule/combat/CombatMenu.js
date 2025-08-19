export class CombatMenu {
    constructor(gameState, container) {
        if (!gameState) {
            console.error('CombatMenu: Missing gameState');
            return;
        }
        
        this.gameState = gameState;
        this.container = container || document.getElementById('combat-menu-container') || document.body;
        this.setupStyles();
        this.createMenu();
    }

    setupStyles() {
        const style = document.createElement('style');
        style.textContent = this.getCombatStyles();
        document.head.appendChild(style);
    }
    
    getCombatStyles() {
        return `
            .combat-menu {
                background: rgba(0, 0, 0, 0.8);
                padding: 10px;
                border-radius: 5px;
                margin-bottom: 10px;
                color: white;
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
                flex-wrap: wrap;
                align-items: center;
                gap: 10px;
            }
            .combat-status {
                background: rgba(0, 0, 0, 0.6);
                padding: 8px;
                border-radius: 4px;
                margin-top: 10px;
                color: white;
                font-weight: bold;
                min-width: 200px;
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
            
            .next-turn-btn {
                background: #4CAF50;
                color: white;
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: all 0.3s ease;
                display: none;
            }
            
            .next-turn-btn:hover {
                background: #45a049;
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            }
            
            .combat-active .next-turn-btn {
                display: inline-block;
            }
            
            .end-turn-btn {
                background: #ff9800;
                color: white;
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: all 0.3s ease;
                display: none;
            }
            
            .end-turn-btn:hover {
                background: #f57c00;
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            }
            
            .player-turn-active .end-turn-btn {
                display: inline-block;
            }
            
            .player-turn-controls {
                margin-top: 10px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .spell-list {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                margin-top: 5px;
            }
            
            .spell-button {
                background: #673ab7;
                color: white;
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            }
            
            .spell-button:hover {
                background: #5e35b1;
                transform: translateY(-1px);
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
        startButton.onclick = () => {
            console.log("Combat button clicked!");
            startButton.disabled = true;
            this.updateStatus('Initializing combat...');
            
            try {
                if (typeof this.gameState.startCombat === 'function') {
                    this.gameState.startCombat().then(success => {
                        if (success) {
                            menu.classList.add('combat-active');
                            this.updateStatus('Combat Started!');
                        } else {
                            startButton.disabled = false;
                            this.updateStatus('Failed to start combat');
                        }
                    }).catch(error => {
                        console.error('Error during combat start:', error);
                        startButton.disabled = false;
                        this.updateStatus('Error starting combat');
                    });
                } else {
                    console.error("Invalid gameState.startCombat function");
                    this.updateStatus('Combat system not ready');
                    startButton.disabled = false;
                }
            } catch (error) {
                console.error('Error starting combat:', error);
                startButton.disabled = false;
                this.updateStatus('Error starting combat');
            }
        };

        const nextTurnButton = document.createElement('button');
        nextTurnButton.className = 'next-turn-btn';
        nextTurnButton.innerHTML = '⏭️ Next Turn';
        nextTurnButton.onclick = () => {
            try {
                if (this.gameState && typeof this.gameState.nextTurn === 'function') {
                    this.gameState.nextTurn();
                }
            } catch (error) {
                console.error('Error handling next turn:', error);
                this.updateStatus('Error advancing turn');
            }
        };
        
        const statusDiv = document.createElement('div');
        statusDiv.className = 'combat-status';
        statusDiv.textContent = 'Ready';
        this.statusDiv = statusDiv;
        
        controlsDiv.appendChild(startButton);
        controlsDiv.appendChild(nextTurnButton);
        controlsDiv.appendChild(statusDiv);
        menu.appendChild(controlsDiv);
        
        // Add turn counter
        const turnCounter = document.createElement('div');
        turnCounter.className = 'turn-counter';
        this.turnCounter = turnCounter;
        menu.appendChild(turnCounter);
        
        // Add player turn controls
        const playerTurnControls = document.createElement('div');
        playerTurnControls.className = 'player-turn-controls';
        
        // Add End Turn button
        const endTurnButton = document.createElement('button');
        endTurnButton.className = 'end-turn-btn';
        endTurnButton.innerHTML = '⏩ End Turn';
        endTurnButton.onclick = () => {
            try {
                if (this.gameState && typeof this.gameState.endTurn === 'function') {
                    this.gameState.endTurn();
                    menu.classList.remove('player-turn-active');
                }
            } catch (error) {
                console.error('Error ending turn:', error);
            }
        };
        
        // Add spell list container
        const spellListContainer = document.createElement('div');
        spellListContainer.className = 'spell-list';
        this.spellListContainer = spellListContainer;
        
        playerTurnControls.appendChild(endTurnButton);
        playerTurnControls.appendChild(spellListContainer);
        menu.appendChild(playerTurnControls);
        
        // Store references
        this.menu = menu;
        this.startButton = startButton;
        this.nextTurnButton = nextTurnButton;
        this.endTurnButton = endTurnButton;
        this.playerTurnControls = playerTurnControls;

        // Append to container
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
    
    activatePlayerTurn(player) {
        if (!player || !this.menu) return;
        
        try {
            this.menu.classList.add('player-turn-active');
            this.updateStatus(`${player.properties?.name || 'Player'}'s turn`);
            
            // Clear previous spell buttons
            if (this.spellListContainer) {
                this.spellListContainer.innerHTML = '';
            
                // Add spell buttons if player has spells
                if (player.properties?.classAbilities && Array.isArray(player.properties.classAbilities)) {
                    player.properties.classAbilities.forEach(spell => {
                        if ((spell.charges > 0 || spell.isCantrip) && this.gameState && this.gameState.castSpell) {
                            const spellButton = document.createElement('button');
                            spellButton.className = 'spell-button';
                            spellButton.innerHTML = `${spell.name} ${spell.isCantrip ? '(∞)' : `(${spell.charges})`}`;
                            spellButton.onclick = () => {
                                this.gameState.castSpell(player, spell);
                            };
                            this.spellListContainer.appendChild(spellButton);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error activating player turn UI:', error);
        }
    }
    
    deactivatePlayerTurn() {
        if (this.menu) {
            this.menu.classList.remove('player-turn-active');
        }
    }
}