// src/EventHandler.js
export class EventHandler {
    constructor(socket, gameState, strategy) {
        this.socket = socket;
        this.gameState = gameState;
        this.strategy = strategy;
    }

    setupEventListeners() {
        this.socket.on('user', (data) => {
            console.log('Received user data:', data); // Add this log
            this.gameState.updateFromServerData(data);
            console.log('My bomber:', this.gameState.myBomber); // Add this log
        });

        this.socket.on('start', (data) => {
            this.gameState.isGameStarted = true;
            this.strategy.onGameStart(data);
        });

        this.socket.on('bomb_explode', (data) => {
            this.strategy.onBombExplode(data);
        });

        this.socket.on('user_die_update', (data) => {
            this.strategy.onPlayerDeath(data);
        });

        this.socket.on('finish', (data) => {
            this.gameState.isGameStarted = false;
            this.strategy.onGameEnd(data);
        });
    }
}