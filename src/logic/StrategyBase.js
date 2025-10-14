// src/logic/StrategyBase.js
export class StrategyBase {
    constructor(gameState, socket, uid) {
        this.gameState = gameState;
        this.socket = socket;
        this.uid = uid; // our bot uid assigned later
    }

    setUid(uid) { this.uid = uid; }
    execute() { throw new Error("execute() must be implemented"); }
}
