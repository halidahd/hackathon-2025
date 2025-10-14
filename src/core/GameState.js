import { Logger } from "../utils/Logger.js";

export class GameState {
    constructor() {
        this.map = [];
        this.width = 0;
        this.height = 0;
        this.tileSize = 40; // Mỗi ô vuông là 40px
        this.bombers = [];
        this.bombs = [];
        this.items = [];
    }

    updateMap(mapData) {
        if (!mapData) return;
        this.map = mapData.map || mapData;
        this.width = mapData.width || (this.map[0]?.length || 0);
        this.height = mapData.height || this.map.length;
        Logger.debug("Map updated", { width: this.width, height: this.height });
    }

    updateFromUser(userData) {
        if (!userData) return;
        if (Array.isArray(userData.bombers)) this.bombers = userData.bombers;
        if (Array.isArray(userData.items)) this.items = userData.items;
        if (Array.isArray(userData.bombs)) this.bombs = userData.bombs;
    }

    updateBomberPosition(data) {
        if (!data?.uid) return;
        const existing = this.bombers.find(b => b.uid === data.uid);
        if (existing) {
            existing.x = data.x;
            existing.y = data.y;
            existing.orient = data.orient;
        } else {
            this.bombers.push(data);
        }
    }

    updateBomb(bombData) {
        if (!bombData) return;
        const existing = this.bombs.find(b => b.id === bombData.id);
        if (existing) {
            Object.assign(existing, bombData);
        } else {
            this.bombs.push(bombData);
        }
    }

    removeBomb(bombId) {
        this.bombs = this.bombs.filter(b => b.id !== bombId);
    }

    // ✅ Convert pixel to tile coordinate
    toTile(x, y) {
        return {
            tx: Math.floor(x / this.tileSize),
            ty: Math.floor(y / this.tileSize)
        };
    }

    // ✅ Convert tile back to pixel
    toPixel(tx, ty) {
        return {
            x: tx * this.tileSize + this.tileSize / 2,
            y: ty * this.tileSize + this.tileSize / 2
        };
    }

    getMyBomber(uid) {
        return this.bombers.find(b => b.uid === uid);
    }

    // ✅ Kiểm tra ô có thể đi qua không
    isWalkable(tx, ty) {
        if (ty < 0 || ty >= this.height || tx < 0 || tx >= this.width) return false;

        const cell = this.map[ty][tx];
        // 0 = đường trống, 1 = tường, 2 = box
        if (cell === 1 || cell === 2) return false;

        // Nếu có bomb đang nổ hoặc vừa đặt tại ô này => không đi qua
        const bombHere = this.bombs.some(b => {
            const { tx: bx, ty: by } = this.toTile(b.x, b.y);
            return bx === tx && by === ty;
        });
        if (bombHere) return false;

        return true;
    }

    // ✅ Tìm đường đơn giản (BFS)
    findPath(start, goal) {
        if (!start || !goal) return null;

        const startTile = this.toTile(start.x, start.y);
        const goalTile = this.toTile(goal.x, goal.y);
        const queue = [startTile];
        const visited = new Set();
        const parent = {};
        const key = (x, y) => `${x},${y}`;
        visited.add(key(startTile.tx, startTile.ty));

        const dirs = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 },
        ];

        while (queue.length > 0) {
            const cur = queue.shift();
            if (cur.tx === goalTile.tx && cur.ty === goalTile.ty) {
                // reconstruct path
                const path = [];
                let node = key(cur.tx, cur.ty);
                while (node) {
                    const [x, y] = node.split(",").map(Number);
                    path.unshift({ tx: x, ty: y });
                    node = parent[node];
                }
                return path;
            }

            for (const d of dirs) {
                const nx = cur.tx + d.dx;
                const ny = cur.ty + d.dy;
                const k = key(nx, ny);
                if (!visited.has(k) && this.isWalkable(nx, ny)) {
                    visited.add(k);
                    parent[k] = key(cur.tx, cur.ty);
                    queue.push({ tx: nx, ty: ny });
                }
            }
        }

        return null;
    }

    // ✅ Lấy danh sách item gần nhất để thu thập
    findNearestItem(myBomber) {
        if (!myBomber || !this.items.length) return null;

        const start = this.toTile(myBomber.x, myBomber.y);
        let minDist = Infinity;
        let nearest = null;

        for (const it of this.items) {
            const itemTile = this.toTile(it.x, it.y);
            const dx = itemTile.tx - start.tx;
            const dy = itemTile.ty - start.ty;
            const dist = Math.abs(dx) + Math.abs(dy);
            if (dist < minDist && this.isWalkable(itemTile.tx, itemTile.ty)) {
                minDist = dist;
                nearest = it;
            }
        }

        return nearest;
    }
}
