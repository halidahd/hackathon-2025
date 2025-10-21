// src/GameState.js
export class GameState {
    constructor() {
        this.map = [];
        this.bombers = new Map();
        this.bombs = new Map();
        this.items = new Map();
        this.chests = new Set();
        this.myBomber = null;
        this.isGameStarted = false;
    }

    updateFromServerData(data) {
        this.map = data.map;

        // Update bombers with all required properties
        this.bombers = new Map(data.bombers.map(b => [b.uid, {
            uid: b.uid,
            x: b.x,
            y: b.y,
            isAlive: b.isAlive ?? true,
            bombCount: b.bombCount ?? 1,
            explosionRange: b.explosionRange ?? 1,
            speed: b.speed ?? 1
        }]));

        // Update bombs with all required properties
        this.bombs = new Map(data.bombs.map(b => [b.id, {
            id: b.id,
            uid: b.uid,
            x: b.x,
            y: b.y,
            isExploded: b.isExploded ?? false,
            bomberPassedThrough: b.bomberPassedThrough ?? true
        }]));

        // Update items with all required properties
        this.items = new Map(data.items.map(i => [`${i.x},${i.y}`, {
            x: i.x,
            y: i.y,
            type: i.type, // 'R' for range, 'B' for bombs, 'S' for speed
            isCollected: i.isCollected ?? false
        }]));

        this.chests = new Set(data.chests.map(c => `${c.x},${c.y}`));

        // Update my bomber
        if (this.myBomber?.uid) {
            this.myBomber = this.bombers.get(this.myBomber.uid);
        }
    }

    isSafePosition(x, y) {
        // Check if position is safe from bombs
        for (const bomb of this.bombs.values()) {
            if (!bomb.isExploded && this.isInExplosionRange(x, y, bomb)) {
                return false;
            }
        }
        return true;
    }

    isInExplosionRange(x, y, bomb) {
        const bomber = this.bombers.get(bomb.uid);
        const range = bomber?.explosionRange || 1;

        return (x === bomb.x && Math.abs(y - bomb.y) <= range) ||
            (y === bomb.y && Math.abs(x - bomb.x) <= range);
    }

    // Helper method to check if a position has a chest
    hasChest(x, y) {
        return this.chests.has(`${x},${y}`);
    }

    // Helper method to get item at position
    getItem(x, y) {
        return this.items.get(`${x},${y}`);
    }
}
