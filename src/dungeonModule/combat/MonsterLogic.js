export class MonsterLogic {
    constructor() {
        this.startingPositions = new Map();
    }

    hasLineOfSight(monster, player, dungeon) {
        // Basic line of sight check using Bresenham's line algorithm
        const dx = Math.abs(player.x - monster.x);
        const dy = Math.abs(player.y - monster.y);
        let x = monster.x;
        let y = monster.y;
        let n = 1 + dx + dy;
        const xInc = player.x > monster.x ? 1 : -1;
        const yInc = player.y > monster.y ? 1 : -1;
        const error = dx - dy;
        dx *= 2;
        dy *= 2;

        while (n > 0) {
            if (dungeon[y][x].type === 'wall') return false;
            if (error > 0) {
                x += xInc;
                error -= dy;
            } else {
                y += yInc;
                error += dx;
            }
            n--;
        }
        return true;
    }

    registerStartPosition(monster) {
        this.startingPositions.set(monster.id, { x: monster.x, y: monster.y });
    }

    decideAction(monster, player, dungeon) {
        if (this.hasLineOfSight(monster, player, dungeon)) {
            // Try to approach and attack player
            return {
                type: 'attack',
                target: player
            };
        } else {
            // Return to start or random movement
            const roll = Math.random();
            if (roll < 0.4) return { type: 'pass' };
            if (roll < 0.7) return { type: 'move', distance: 'half' };
            return { type: 'move', distance: 'full' };
        }
    }
}
