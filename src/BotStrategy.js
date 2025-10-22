// src/BotStrategy.js
import { MapManager } from './MapManager.js';
import { PathFinder } from './PathFinder.js';

export class BotStrategy {
    constructor(socket, gameState) {
        this.socket = socket;
        this.gameState = gameState;
        this.moveInterval = null;
    }

    tick() {
        const myBomber = this.gameState.myBomber;
        if (!myBomber || !myBomber.isAlive) return;

        if (!this.mapManager) {
            this.mapManager = new MapManager(this.gameState.map);
            this.pathFinder = new PathFinder(this.mapManager);
        }

        // Nếu đang đi theo path → tiếp tục
        if (Array.isArray(this.currentPath) && this.currentPath.length > 0 && this.stepIndex < this.currentPath.length) {
            this.followPath();
        }

        // Nếu không có path → tìm mục tiêu mới
        const target = this.findChestTarget();
        if (!target) return;

        const approachX = target.x;
        const approachY = target.y - 40;

        this.currentPath = this.pathFinder.findPath(myBomber.x, myBomber.y, approachX, approachY);
        this.stepIndex = 0;
        this.lastTargetKey = `${target.x},${target.y}`;
    }

    findChestTarget() {
        const chestList = Array.from(this.gameState.chests).map(key => {
            const [x, y] = key.split(',').map(Number);
            return { x, y };
        });

        // Ưu tiên rương chưa bị phá và có thể tiếp cận
        return chestList.find(c => this.mapManager.isWalkable(c.x, c.y - 40));
    }

    followPath() {
        const myBomber = this.gameState.myBomber;
        const next = this.currentPath[this.stepIndex];
        if (!next) return;

        const dx = next.x - myBomber.x;
        const dy = next.y - myBomber.y;

        let orient = null;
        if (Math.abs(dx) > Math.abs(dy)) {
            orient = dx > 0 ? 'RIGHT' : 'LEFT';
        } else {
            orient = dy > 0 ? 'DOWN' : 'UP';
        }

        console.log('========', orient)
        this.socket.emit('move', { orient });
        this.stepIndex++;

        // Nếu đã đến nơi → đặt bom nếu có rương gần
        if (this.stepIndex >= this.currentPath.length) {
            this.tryPlaceBomb();
        }
    }

    tryPlaceBomb() {
        const myBomber = this.gameState.myBomber;
        const gridX = Math.floor(myBomber.x / 40) * 40;
        const gridY = Math.floor(myBomber.y / 40) * 40;

        const directions = [
            [gridX, gridY + 40],
            [gridX, gridY - 40],
            [gridX + 40, gridY],
            [gridX - 40, gridY]
        ];

        const nearChest = directions.some(([x, y]) => this.gameState.hasChest(x, y));
        if (nearChest) {
            this.socket.emit('place_bomb', {});
        }
    }

    // Các sự kiện từ server → chỉ cần gọi tick()
    onGameStart(data) {
        console.log('🚀 Game started');
        this.tick();
    }
    onGameUpdate() { this.tick(); }
    onMapUpdate() { this.tick(); }
    onItemCollected() { this.tick(); }
    onChestDestroyed() { this.tick(); }
    onBombExploded() { this.tick(); }
    onPlayerDeath() { this.tick(); }

}
