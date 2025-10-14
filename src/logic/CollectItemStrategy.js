import { StrategyBase } from "./StrategyBase.js";
import { findPathAStar } from "./PathFinder.js";
import { TILE_SIZE, pixelToGridCoord, gridToPixelCenter, pixelDistance, gridDelta } from "../utils/PositionUtils.js";
// if you used different exports, adjust the import path accordingly

export class CollectItemStrategy extends StrategyBase {
    constructor(gameState, socket) {
        super(gameState, socket);
        this.currentPath = null;
        this.pathIndex = 0;
    }

    execute() {
        if (!this.uid) return false;
        const me = this.gameState.getMyBomber(this.uid);
        if (!me) return false;

        const target = this.gameState.nearestItemTo(this.uid);
        if (!target) return false;

        // convert positions to grid coords (i,j)
        const start = this.gameState.pixelToGrid(me.x, me.y);
        const goal = this.gameState.pixelToGrid(target.x, target.y);
        const bomberSize = me.size || 35;

        const path = findPathAStar(this.gameState, start, goal, bomberSize);
        if (!path) {
            // try adjacent cells around goal as fallback
            const deltas = [[-1,0],[1,0],[0,-1],[0,1]];
            for (const d of deltas) {
                const gi = goal.i + d[0], gj = goal.j + d[1];
                if (gi < 0 || gj < 0) continue;
                if (!this.gameState.canOccupy(gi, gj, bomberSize)) continue;
                const p2 = findPathAStar(this.gameState, start, { i: gi, j: gj }, bomberSize);
                if (p2) { this.currentPath = p2; this.pathIndex = 0; break; }
            }
            if (!this.currentPath) return false;
        } else {
            this.currentPath = path;
            this.pathIndex = 0;
        }

        // follow path one step per execute call
        if (this.currentPath && this.pathIndex < this.currentPath.length) {
            const step = this.currentPath[this.pathIndex];
            this.socket.send("move", { orient: step.action });
            this.pathIndex += 1;
            return true;
        }

        // arrived (no path left)
        return false;
    }
}
