import { StrategyBase } from "./StrategyBase.js";
import { TILE_SIZE } from "../utils/PositionUtils.js";

export class AttackStrategy extends StrategyBase {
    execute() {
        if (!this.uid) return false;
        const me = this.gameState.getMyBomber(this.uid);
        if (!me) return false;

        // place bomb if adjacent to chest (within one tile)
        for (const c of this.gameState.chests || []) {
            const d = Math.hypot(me.x - c.x, me.y - c.y);
            if (d < TILE_SIZE * 1.2) {
                this.socket.send("place_bomb", {});
                return true;
            }
        }

        // try to place bomb if enemy is in nearby tile
        for (const e of this.gameState.bombers || []) {
            if (e.uid === this.uid || !e.isAlive) continue;
            const d = Math.hypot(me.x - e.x, me.y - e.y);
            if (d < TILE_SIZE * 1.2) {
                this.socket.send("place_bomb", {});
                return true;
            }
        }

        return false;
    }
}
