// src/BotApp.js
import { io } from "socket.io-client";
import { GameState } from "./GameState.js";
import { BotStrategy } from "./BotStrategy.js";
import { EventHandler } from "./EventHandler.js";

export class BotApp {
    constructor(config) {
        this.config = config;
        this.gameState = new GameState();
        this.socket = io(this.config.SOCKET_SERVER_ADDR, {
            auth: { token: this.config.TOKEN }
        });
        this.strategy = new BotStrategy(this.gameState, this.socket);
        this.eventHandler = null;
    }

    start() {
        this.eventHandler = new EventHandler(this.socket, this.gameState, this.strategy);
        this.eventHandler.setupEventListeners();

        if (this.config.AUTO_START) {
            this.socket.emit('join', {});
        }

        setInterval(() => {
            this.strategy.update();
        }, this.config.LOOP_INTERVAL);
    }

}
