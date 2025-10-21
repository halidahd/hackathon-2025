class Node {
    constructor(x, y, g = 0, h = 0) {
        this.x = x;
        this.y = y;
        this.g = g;
        this.h = h;
        this.f = g + h;
        this.parent = null;
    }
}

export class BotStrategy {
    constructor(gameState, socket) {
        this.gameState = gameState;
        this.socket = socket;
        this.directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        this.lastMove = Date.now();
        this.moveDelay = 17;
        this.lastBomb = Date.now();
        this.bombDelay = 250;
        this.TILE_SIZE = 40;
        this.BOT_SIZE = 35;
        this.HALF_BOT = Math.floor(this.BOT_SIZE / 2);
        this.MARGIN = (this.TILE_SIZE - this.BOT_SIZE) / 2;
    }

    update() {
        if (!this.gameState.isGameStarted || !this.gameState.myBomber?.isAlive) {
            return;
        }

        const now = Date.now();
        if (now - this.lastMove < this.moveDelay) {
            return;
        }

        const pos = this.gameState.myBomber;

        // Priority 1: Escape from danger
        if (this.isInDanger(pos.x, pos.y)) {
            const safeDir = this.findSafeDirection();
            if (safeDir) {
                this.move(safeDir);
                return;
            }
        }

        // Priority 2: Collect nearby power-ups
        const powerUp = this.findBestPowerUp();
        if (powerUp) {
            const dir = this.getDirectionToTarget(pos.x, pos.y, powerUp.x, powerUp.y);
            if (dir) {
                this.move(dir);
                return;
            }
        }

        // Priority 3: Attack enemies or break boxes
        if (this.shouldPlaceBomb()) {
            this.tryPlaceBomb();
            const escapeDir = this.findSafeDirection();
            if (escapeDir) {
                this.move(escapeDir);
                return;
            }
        }

        // Priority 4: Strategic movement
        const target = this.findBestTarget();
        if (target) {
            const dir = this.getDirectionToTarget(pos.x, pos.y, target.x, target.y);
            if (dir) {
                this.move(dir);
                return;
            }
        }

        // Priority 5: Explore safely
        this.moveStrategically();
    }

    isInDanger(x, y) {
        const pixelX = x * this.TILE_SIZE + this.HALF_BOT;
        const pixelY = y * this.TILE_SIZE + this.HALF_BOT;

        for (const [_, bomb] of this.gameState.bombs) {
            if (bomb.isExploded) continue;

            const bombX = bomb.x * this.TILE_SIZE + this.HALF_BOT;
            const bombY = bomb.y * this.TILE_SIZE + this.HALF_BOT;
            const bomber = this.gameState.bombers.get(bomb.uid);
            const range = (bomber?.explosionRange || 1) * this.TILE_SIZE;

            // Check if in explosion range considering pixel coordinates
            if ((Math.abs(pixelX - bombX) < range && Math.abs(pixelY - bombY) < this.BOT_SIZE) ||
                (Math.abs(pixelY - bombY) < range && Math.abs(pixelX - bombX) < this.BOT_SIZE)) {
                return true;
            }
        }
        return false;
    }

    findBestPowerUp() {
        let best = null;
        let bestScore = -Infinity;

        // Check all positions on the map
        for (let y = 0; y < this.gameState.map.length; y++) {
            for (let x = 0; x < this.gameState.map[0].length; x++) {
                const item = this.gameState.getItem(x, y);
                if (!item || item.isCollected) continue;

                const distance = this.calculateDistance(
                    this.gameState.myBomber.x,
                    this.gameState.myBomber.y,
                    x,
                    y
                );

                // Score based on item type and distance
                let score = 1000 - distance;
                if (item.type === 'R') score += 300;      // Range is most valuable
                else if (item.type === 'B') score += 200; // Extra bombs second
                else if (item.type === 'S') score += 100; // Speed third

                if (score > bestScore && this.canReach(x, y)) {
                    bestScore = score;
                    best = item;
                }
            }
        }
        return best;
    }

    shouldPlaceBomb() {
        const { x, y } = this.gameState.myBomber;
        const now = Date.now();

        return now - this.lastBomb >= this.bombDelay &&
            this.gameState.myBomber.bombCount > 0 &&
            this.isTargetInRange(x, y) &&
            this.canSafelyPlaceBomb(x, y);
    }

    canSafelyPlaceBomb(x, y) {
        // Check if there's at least one safe escape route
        for (const dir of this.directions) {
            const newPos = this.getNewPosition(x, y, dir);
            if (this.isValidMove(newPos.x, newPos.y) &&
                this.gameState.isSafePosition(newPos.x, newPos.y)) {
                return true;
            }
        }
        return false;
    }

    isSafePosition(x, y) {
        // Fix: this.bombs was incorrect, should use gameState
        for (const [_, bomb] of this.gameState.bombs) {
            if (!bomb.isExploded && this.isInExplosionRange(x, y, bomb)) {
                return false;
            }
        }


        return true;
    }
    isInExplosionRange(x, y, bomb) {
        const bomber = this.gameState.bombers.get(bomb.uid);
        const range = (bomber?.explosionRange || 1) * this.TILE_SIZE;

        const pixelX = x * this.TILE_SIZE + this.HALF_BOT;
        const pixelY = y * this.TILE_SIZE + this.HALF_BOT;
        const bombX = bomb.x * this.TILE_SIZE + this.HALF_BOT;
        const bombY = bomb.y * this.TILE_SIZE + this.HALF_BOT;

        return (Math.abs(pixelX - bombX) < range && Math.abs(pixelY - bombY) < this.BOT_SIZE) ||
            (Math.abs(pixelY - bombY) < range && Math.abs(pixelX - bombX) < this.BOT_SIZE);
    }

    findBestTarget() {
        const pos = this.gameState.myBomber;
        let bestTarget = null;
        let bestScore = -Infinity;

        // Score boxes and enemies
        for (let y = 0; y < this.gameState.map.length; y++) {
            for (let x = 0; x < this.gameState.map[y].length; x++) {
                if (this.isBox(x, y) || this.isEnemyAt(x, y)) {
                    const distance = this.calculateDistance(pos.x, pos.y, x, y);
                    let score = 1000 - distance;

                    // Enemies are higher priority than boxes
                    if (this.isEnemyAt(x, y)) score += 500;

                    if (score > bestScore && this.canReach(x, y)) {
                        bestScore = score;
                        bestTarget = { x, y };
                    }
                }
            }
        }
        return bestTarget;
    }

    isBox(x, y) {
        return this.gameState.map[y]?.[x] === 'C' || this.gameState.hasChest(x, y);
    }

    getDirectionToTarget(fromX, fromY, toX, toY) {
        // Prioritize horizontal or vertical based on distance
        const dx = toX - fromX;
        const dy = toY - fromY;

        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0 && this.isValidMove(fromX + 1, fromY)) return 'RIGHT';
            if (dx < 0 && this.isValidMove(fromX - 1, fromY)) return 'LEFT';
            if (dy > 0 && this.isValidMove(fromX, fromY + 1)) return 'DOWN';
            if (dy < 0 && this.isValidMove(fromX, fromY - 1)) return 'UP';
        } else {
            if (dy > 0 && this.isValidMove(fromX, fromY + 1)) return 'DOWN';
            if (dy < 0 && this.isValidMove(fromX, fromY - 1)) return 'UP';
            if (dx > 0 && this.isValidMove(fromX + 1, fromY)) return 'RIGHT';
            if (dx < 0 && this.isValidMove(fromX - 1, fromY)) return 'LEFT';
        }

        return null;
    }

    moveStrategically() {
        const pos = this.gameState.myBomber;
        const safeDirections = this.directions.filter(dir => {
            const newPos = this.getNewPosition(pos.x, pos.y, dir);
            return this.isValidMove(newPos.x, newPos.y) &&
                !this.isInDanger(newPos.x, newPos.y);
        });

        if (safeDirections.length > 0) {
            const randomDir = safeDirections[Math.floor(Math.random() * safeDirections.length)];
            this.move(randomDir);
        }
    }

    canReach(targetX, targetY) {
        return this.findPath(
            this.gameState.myBomber.x,
            this.gameState.myBomber.y,
            targetX,
            targetY
        ) !== null;
    }

    calculateDistance(x1, y1, x2, y2) {
        const dx = (x2 * this.TILE_SIZE + this.HALF_BOT) - (x1 * this.TILE_SIZE + this.HALF_BOT);
        const dy = (y2 * this.TILE_SIZE + this.HALF_BOT) - (y1 * this.TILE_SIZE + this.HALF_BOT);
        return Math.sqrt(dx * dx + dy * dy);
    }

    isValidMove(x, y) {
        if (x < 0 || y < 0 || y >= this.gameState.map.length || x >= this.gameState.map[0].length) {
            return false;
        }

        // Convert to pixel coordinates for precise collision detection
        const pixelX = x * this.TILE_SIZE + this.MARGIN;
        const pixelY = y * this.TILE_SIZE + this.MARGIN;

        // Check cell content and chests
        const cell = this.gameState.map[y][x];
        if (cell === 'W' || cell === 'C' || this.gameState.hasChest(x, y)) return false;

        // Check bomb collisions
        for (const [_, bomb] of this.gameState.bombs) {
            if (bomb.bomberPassedThrough) continue;

            const bombX = bomb.x * this.TILE_SIZE;
            const bombY = bomb.y * this.TILE_SIZE;

            if (Math.abs(bombX - pixelX) < this.BOT_SIZE &&
                Math.abs(bombY - pixelY) < this.BOT_SIZE) {
                return false;
            }
        }

        return true;
    }


    // Keep existing helper methods with minor adjustments...
    move(direction) {
        const now = Date.now();
        if (now - this.lastMove >= this.moveDelay) {
            this.socket.emit('move', { orient: direction });
            this.lastMove = now;
            return true;
        }
        return false;
    }

    tryPlaceBomb() {
        const now = Date.now();
        if (now - this.lastBomb >= this.bombDelay) {
            this.socket.emit('place_bomb', {}); // Fixed event name
            this.lastBomb = now;
            return true;
        }
        return false;
    }
    findPath(startX, startY, goalX, goalY) {
        const openSet = new Set();
        const closedSet = new Set();
        const startNode = new Node(startX, startY);
        startNode.h = this.calculateHeuristic(startX, startY, goalX, goalY);
        openSet.add(startNode);

        while (openSet.size > 0) {
            // Find node with lowest f cost
            let current = Array.from(openSet).reduce((min, node) =>
                node.f < min.f ? node : min
            );

            if (current.x === goalX && current.y === goalY) {
                return this.reconstructPath(current);
            }

            openSet.delete(current);
            closedSet.add(current);

            // Check neighbors
            for (const direction of this.directions) {
                const neighbor = this.getNewPosition(current.x, current.y, direction);

                if (!this.isValidMove(neighbor.x, neighbor.y) ||
                    !this.gameState.isSafePosition(neighbor.x, neighbor.y)) {
                    continue;
                }

                const neighborNode = new Node(neighbor.x, neighbor.y);
                if (this.isInSet(closedSet, neighborNode)) {
                    continue;
                }

                const tentativeG = current.g + 1;

                if (!this.isInSet(openSet, neighborNode)) {
                    openSet.add(neighborNode);
                } else if (tentativeG >= neighborNode.g) {
                    continue;
                }

                neighborNode.parent = current;
                neighborNode.g = tentativeG;
                neighborNode.h = this.calculateHeuristic(neighbor.x, neighbor.y, goalX, goalY);
                neighborNode.f = neighborNode.g + neighborNode.h;
            }
        }

        return null; // No path found
    }

// Add these missing methods to the BotStrategy class

    calculateHeuristic(x1, y1, x2, y2) {
        // Manhattan distance for A* pathfinding
        return Math.abs(x2 - x1) + Math.abs(y2 - y1);
    }

    isInSet(set, node) {
        return Array.from(set).some(n => n.x === node.x && n.y === node.y);
    }

    reconstructPath(node) {
        const path = [];
        let current = node;

        while (current.parent) {
            path.unshift({
                x: current.x,
                y: current.y
            });
            current = current.parent;
        }

        return path;
    }

    getNewPosition(x, y, direction) {
        switch (direction) {
            case 'UP': return { x, y: y - 1 };
            case 'DOWN': return { x, y: y + 1 };
            case 'LEFT': return { x: x - 1, y };
            case 'RIGHT': return { x: x + 1, y };
            default: return { x, y };
        }
    }

    isEnemyAt(x, y) {
        for (const [_, bomber] of this.gameState.bombers) {
            if (bomber.uid !== this.gameState.myBomber.uid &&
                bomber.isAlive &&
                bomber.x === x &&
                bomber.y === y) {
                return true;
            }
        }
        return false;
    }

    isTargetInRange(x, y) {
        const range = this.gameState.myBomber.explosionRange;

        // Check for boxes or enemies in bombing range
        for (let i = -range; i <= range; i++) {
            // Horizontal check
            if (this.isBox(x + i, y) ||
                this.gameState.hasChest(x + i, y) ||
                this.isEnemyAt(x + i, y)) return true;
            // Vertical check
            if (this.isBox(x, y + i) ||
                this.gameState.hasChest(x, y + i) ||
                this.isEnemyAt(x, y + i)) return true;
        }
        return false;
    }


    findSafeDirection() {
        const { x, y } = this.gameState.myBomber;
        const safeDirections = [];

        for (const dir of this.directions) {
            const newPos = this.getNewPosition(x, y, dir);
            if (this.isValidMove(newPos.x, newPos.y) &&
                !this.isInDanger(newPos.x, newPos.y)) {
                safeDirections.push(dir);
            }
        }

        return safeDirections.length > 0 ? safeDirections[0] : null;
    }

}
