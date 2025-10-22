// src/EventHandler.js
export class EventHandler {
    constructor(socket, gameState, strategy) {
        this.socket = socket;
        this.gameState = gameState;
        this.strategy = strategy;
    }

    setupEventListeners() {
        this.socket.on('user', (data) => {
            this.gameState.updateFromServerData(data);
            if (typeof this.strategy?.onGameUpdate === 'function') {
                this.strategy.onGameUpdate(data);
                this.strategy.onGameStart(data);
            }
        });

        this.socket.on('start', (data) => {
            this.gameState.isGameStarted = true;
            if (typeof this.strategy?.onGameStart === 'function') {
                this.strategy.onGameStart(data);
            }
        });

        this.socket.on('bomb_exploded', (data) => {
            if (typeof this.strategy?.onBombExploded === 'function') {
                this.strategy.onBombExploded(data);
            }
        });

        this.socket.on('map_update', (data) => {
            if (typeof this.strategy?.onMapUpdate === 'function') {
                this.strategy.onMapUpdate(data);
            }
        });

        this.socket.on('item_collected', (data) => {
            if (typeof this.strategy?.onItemCollected === 'function') {
                this.strategy.onItemCollected(data);
            }
        });

        this.socket.on('chest_destroyed', (data) => {
            if (typeof this.strategy?.onChestDestroyed === 'function') {
                this.strategy.onChestDestroyed(data);
            }
        });

        this.socket.on('user_die_update', (data) => {
            if (typeof this.strategy?.onPlayerDeath === 'function') {
                this.strategy.onPlayerDeath(data);
            }
        });

        this.socket.on('finish', (data) => {
            this.gameState.isGameStarted = false;
            if (typeof this.strategy?.onGameEnd === 'function') {
                this.strategy.onGameEnd(data);
            }
        });
    }
}
