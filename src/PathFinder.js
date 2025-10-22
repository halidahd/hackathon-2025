// src/PathFinder.js
export class PathFinder {
    constructor(mapManager) {
        this.mapManager = mapManager;
    }

    findPath(startX, startY, targetX, targetY) {
        if (!this.mapManager.isWalkable(startX, startY) || !this.mapManager.isWalkable(targetX, targetY)) {
            return [];
        }

        const start = this.mapManager.toGrid(startX, startY);
        const target = this.mapManager.toGrid(targetX, targetY);

        const openSet = [start];
        const openSetKeys = new Set([`${start.row},${start.col}`]);
        const cameFrom = {};
        const gScore = {};
        const fScore = {};

        const key = ({ row, col }) => `${row},${col}`;
        gScore[key(start)] = 0;
        fScore[key(start)] = this.heuristic(start, target);

        while (openSet.length > 0) {
            openSet.sort((a, b) => (fScore[key(a)] ?? Infinity) - (fScore[key(b)] ?? Infinity));
            const current = openSet.shift();
            openSetKeys.delete(key(current));

            if (current.row === target.row && current.col === target.col) {
                return this.reconstructPath(cameFrom, current);
            }

            for (const neighbor of this.getNeighbors(current)) {
                const tentativeG = gScore[key(current)] + 1;
                const neighborKey = key(neighbor);
                if (tentativeG < (gScore[neighborKey] ?? Infinity)) {
                    cameFrom[neighborKey] = current;
                    gScore[neighborKey] = tentativeG;
                    fScore[neighborKey] = tentativeG + this.heuristic(neighbor, target);
                    if (!openSetKeys.has(neighborKey)) {
                        openSet.push(neighbor);
                        openSetKeys.add(neighborKey);
                    }
                }
            }
        }

        return [];
    }


    heuristic(a, b) {
        return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
    }

    getNeighbors({ row, col }) {
        const directions = [
            { row: row - 1, col },
            { row: row + 1, col },
            { row, col: col - 1 },
            { row, col: col + 1 }
        ];
        return directions.filter(({ row, col }) =>
            row >= 0 && row < this.mapManager.height &&
            col >= 0 && col < this.mapManager.width &&
            this.mapManager.walkable[row][col]
        );
    }

    reconstructPath(cameFrom, current) {
        const path = [current];
        const key = ({ row, col }) => `${row},${col}`;
        while (cameFrom[key(current)]) {
            current = cameFrom[key(current)];
            path.unshift(current);
        }
        return path.map(p => this.mapManager.toPixel(p.row, p.col));
    }
}
