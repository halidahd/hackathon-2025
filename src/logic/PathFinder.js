// src/logic/PathFinder.js
// A* pathfinder on grid using GameState.canOccupy for walkability.
// Returns array of steps [{i,j,action}] or null

function heuristic(a, b) {
    return Math.abs(a.i - b.i) + Math.abs(a.j - b.j);
}

export function findPathAStar(gameState, startGrid, goalGrid, bomberSize) {
    const rows = gameState.map.length;
    const cols = (gameState.map[0] || []).length;
    const key = (i,j) => `${i},${j}`;

    const open = new Map(); // key -> node
    const closed = new Set();

    const startKey = key(startGrid.i, startGrid.j);
    open.set(startKey, {
        i: startGrid.i, j: startGrid.j,
        g: 0, f: heuristic(startGrid, goalGrid), parent: null, action: null
    });

    const dirList = [
        { di: -1, dj: 0, action: "UP" },
        { di: 1, dj: 0, action: "DOWN" },
        { di: 0, dj: -1, action: "LEFT" },
        { di: 0, dj: 1, action: "RIGHT" }
    ];

    while (open.size > 0) {
        // pick lowest f
        let currentKey = null;
        let currentNode = null;
        for (const [k, node] of open) {
            if (!currentNode || node.f < currentNode.f) { currentNode = node; currentKey = k; }
        }

        open.delete(currentKey);
        closed.add(currentKey);

        if (currentNode.i === goalGrid.i && currentNode.j === goalGrid.j) {
            // reconstruct path
            const path = [];
            let cur = currentNode;
            while (cur.parent) {
                path.push({ i: cur.i, j: cur.j, action: cur.action });
                cur = cur.parent;
            }
            path.reverse();
            return path;
        }

        for (const d of dirList) {
            const ni = currentNode.i + d.di;
            const nj = currentNode.j + d.dj;
            const nk = key(ni, nj);
            if (ni < 0 || nj < 0 || ni >= rows || nj >= cols) continue;
            if (closed.has(nk)) continue;
            if (!gameState.canOccupy(ni, nj, bomberSize)) continue;

            const g = currentNode.g + 1;
            const h = heuristic({ i: ni, j: nj }, goalGrid);
            const f = g + h;

            const existing = open.get(nk);
            if (!existing || g < existing.g) {
                open.set(nk, {
                    i: ni, j: nj, g, f, parent: currentNode, action: d.action
                });
            }
        }
    }

    return null;
}
