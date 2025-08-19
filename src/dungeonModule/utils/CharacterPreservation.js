export class CharacterPreservation {
    constructor() {
        this.characters = new Map();
    }

    preserveCharacter(playerId, characterData) {
        this.characters.set(playerId, {
            data: characterData,
            timestamp: Date.now()
        });
    }

    getCharacterData(playerId) {
        return this.characters.get(playerId)?.data || null;
    }

    clearCharacter(playerId) {
        this.characters.delete(playerId);
    }

    hasValidCharacter(playerId) {
        return this.characters.has(playerId);
    }
}
