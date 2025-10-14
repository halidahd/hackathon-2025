import { StrategyBase } from "./StrategyBase.js";
import { findPathAStar } from "./PathFinder.js";
import { TILE_SIZE } from "../utils/PositionUtils.js";

export class AvoidBombStrategy extends StrategyBase {
    constructor(gameState, socket) {
        super(gameState, socket);
        this.safePath = null;
        this.pathIndex = 0;
    }

    execute() {
        if (!this.uid) return false;
        const me = this.gameState.getMyBomber(this.uid);
        if (!me) return false;

        // build map of bomber explosionRange
        const bomberRangeMap = {};
        for (const b of this.gameState.bombers) bomberRangeMap[b.uid] = b.explosionRange || 1;

        // check if current grid is in predicted explosions
        const inDanger = this.gameState.isPositionInPredictedExplosions(me.x, me.y, bomberRangeMap);
        if (!inDanger) return false;

        // BFS to nearest safe cell as in previous implementation but using grid coords
        const start = this.gameState.pixelToGrid(me.x, me.y);
        const rows = this.gameState.map.length;
        const cols = (this.gameState.map[0] || []).length;
        const visited = new Set();
        const q = [{ i: start.i, j: start.j, path: [] }];
        visited.add(`${start.i},${start.j}`);

        const deltas = [
            { di: -1, dj: 0, action: "UP" },
            { di: 1, dj: 0, action: "DOWN" },
            { di: 0, dj: -1, action: "LEFT" },
            { di: 0, dj: 1, action: "RIGHT" }
        ];

        while (q.length) {
            const cur = q.shift();
            const center = this.gameState.gridToPixel(cur.i, cur.j);
            const unsafe = this.gameState.isPositionInPredictedExplosions(center.x, center.y, bomberRangeMap);
            if (!unsafe && this.gameState.canOccupy(cur.i, cur.j, me.size || 35)) {
                if (cur.path.length === 0) return true; // already safe
                // take first action in path
                const action = cur.path[0].action;
                this.socket.send("move", { orient: action });
                return true;
            }

            for (const d of deltas) {
                const ni = cur.i + d.di, nj = cur.j + d.dj;
                if (ni < 0 || nj < 0 || ni >= rows || nj >= cols) continue;
                const key = `${ni},${nj}`;
                if (visited.has(key)) continue;
                visited.add(key);
                if (!this.gameState.canOccupy(ni, nj, me.size || 35)) continue;
                q.push({ i: ni, j: nj, path: cur.path.concat([{ i: ni, j: nj, action: d.action }]) });
            }
        }

        // fallback: move away from nearest bomb (grid-aware)
        if (this.gameState.bombs.length) {
            let nearest = this.gameState.bombs[0];
            let minD = Infinity;
            for (const b of this.gameState.bombs) {
                const d = Math.hypot(me.x - b.x, me.y - b.y);
                if (d < minD) { minD = d; nearest = b; }
            }
            const dx = me.x - nearest.x, dy = me.y - nearest.y;
            const action = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "RIGHT" : "LEFT") : (dy > 0 ? "DOWN" : "UP");
            this.socket.send("move", { orient: action });
            return true;
        }

        return false;
    }
}
