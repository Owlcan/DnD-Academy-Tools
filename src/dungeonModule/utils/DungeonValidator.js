export class DungeonValidator {
    constructor() {
        this.validationTimeout = 6000; // 6 seconds
    }

    async validateDungeonGeneration() {
        const startTime = Date.now();
        
        while (Date.now() - startTime < this.validationTimeout) {
            const chatMessages = document.querySelector('.chat-messages');
            if (!chatMessages) {
                await new Promise(resolve => setTimeout(resolve, 100));
                continue;
            }

            const messages = chatMessages.textContent;
            
            if (messages.includes('Error generating dungeon:')) {
                return false;
            }
            
            if (messages.includes('Dungeon generated with')) {
                return true;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return false; // Timeout reached
    }
}
