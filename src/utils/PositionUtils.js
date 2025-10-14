// src/utils/PositionUtils.js
export const TILE_SIZE = 40;

export function pixelToGridCoord(x, y) {
    return {
        i: Math.floor(y / TILE_SIZE),
        j: Math.floor(x / TILE_SIZE)
    };
}

export function gridToPixelCenter(i, j) {
    return {
        x: j * TILE_SIZE + TILE_SIZE / 2,
        y: i * TILE_SIZE + TILE_SIZE / 2
    };
}

export function pixelDistance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.hypot(dx, dy);
}

// return signed grid delta from a to b
export function gridDelta(a, b) {
    const ga = pixelToGridCoord(a.x, a.y);
    const gb = pixelToGridCoord(b.x, b.y);
    return { di: gb.i - ga.i, dj: gb.j - ga.j };
}
