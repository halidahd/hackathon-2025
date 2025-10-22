// src/MapManager.js
export class MapManager {
    constructor(rawMap) {
        this.gridSize = 40;
        this.width = 16;
        this.height = 16;
        this.map = rawMap;
        this.walkable = this.buildWalkableGrid(rawMap);
    }

    buildWalkableGrid(rawMap) {
        return rawMap.map(row =>
            row.map(cell => cell === null || cell === 'B' || cell === 'R' || cell === 'S')
        );
    }

    isWalkable(x, y) {
        const col = Math.floor(x / this.gridSize);
        const row = Math.floor(y / this.gridSize);
        return this.walkable[row]?.[col] ?? false;
    }

    toGrid(x, y) {
        return {
            row: Math.floor(y / this.gridSize),
            col: Math.floor(x / this.gridSize)
        };
    }

    toPixel(row, col) {
        return {
            x: col * this.gridSize,
            y: row * this.gridSize
        };
    }
}
