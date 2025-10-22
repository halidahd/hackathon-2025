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

        // Cập nhật danh sách bomber
        this.bombers = new Map(data.bombers.map(b => [b.uid, {
            uid: b.uid,
            x: b.x,
            y: b.y,
            isAlive: b.isAlive ?? true,
            bombCount: b.bombCount ?? 1,
            explosionRange: b.explosionRange ?? 1,
            speed: b.speed ?? 1,
            name: b.name
        }]));

        // Cập nhật danh sách bom
        this.bombs = new Map(data.bombs.map(b => [b.id, {
            id: b.id,
            uid: b.uid,
            x: b.x,
            y: b.y,
            isExploded: b.isExploded ?? false,
            bomberPassedThrough: b.bomberPassedThrough ?? true
        }]));

        // Cập nhật danh sách vật phẩm
        this.items = new Map(data.items.map(i => [`${i.x},${i.y}`, {
            x: i.x,
            y: i.y,
            type: i.type,
            isCollected: i.isCollected ?? false
        }]));

        // Cập nhật danh sách rương
        this.chests = new Set(data.chests.map(c => `${c.x},${c.y}`));

        // Xác định bot của mình
        const myBot = data.bombers.find(b => b.name === 'VuaMin');
        if (myBot) {
            this.myBomber = this.bombers.get(myBot.uid);
        }
    }

    isSafePosition(x, y) {
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
        const bx = Math.floor(bomb.x / 40);
        const by = Math.floor(bomb.y / 40);
        const px = Math.floor(x / 40);
        const py = Math.floor(y / 40);

        return (px === bx && Math.abs(py - by) <= range) ||
            (py === by && Math.abs(px - bx) <= range);
    }

    getItem(x, y) {
        return this.items.get(`${x},${y}`);
    }

    hasChest(x, y) {
        return this.chests.has(`${x},${y}`);
    }
}
