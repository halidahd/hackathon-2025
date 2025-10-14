// src/BotApp.js
import { EventBus } from "./core/EventBus.js";
import { GameSocket } from "./core/GameSocket.js";
import { GameState } from "./core/GameState.js";
import { Logger } from "./utils/Logger.js";

import { CollectItemStrategy } from "./logic/CollectItemStrategy.js";
import { AvoidBombStrategy } from "./logic/AvoidBombStrategy.js";
import { AttackStrategy } from "./logic/AttackStrategy.js";

export class BotApp {
    constructor(cfg = {}) {
        this.config = {
            SOCKET_SERVER_ADDR: process.env.SOCKET_SERVER_ADDR,
            TOKEN: process.env.TOKEN,
            BOT_NAME: process.env.BOT_NAME || "VuaMin",
            AUTO_START: process.env.AUTO_START === "true",
            LOOP_INTERVAL: parseInt(process.env.BOT_LOOP_INTERVAL || "100", 10),
            ...cfg
        };

        this.eventBus = new EventBus();
        this.gameState = new GameState();
        this.socket = new GameSocket(this.config.SOCKET_SERVER_ADDR, this.eventBus, {
            token: this.config.TOKEN,
            autoStart: this.config.AUTO_START,
            sendIntervalMs: this.config.LOOP_INTERVAL >= 17 ? 17 : this.config.LOOP_INTERVAL
        });

        this.loopTimer = null;
        this.isRunning = false;

        // strategies are instantiated with (gameState, socket)
        this.collectStrategy = new CollectItemStrategy(this.gameState, this.socket);
        this.avoidStrategy = new AvoidBombStrategy(this.gameState, this.socket);
        this.attackStrategy = new AttackStrategy(this.gameState, this.socket);

        this._bindEvents();
    }

    start() {
        Logger.info("BotApp starting...");
        this.socket.connect();
        this.socket.send('join', {})

    }

    _bindEvents() {
        this.eventBus.on("connect", () => Logger.info("Connected to game socket"));
        this.eventBus.on("disconnect", () => {
            Logger.warn("Disconnected, stopping loop");
            this._stopLoop();
        });
        this.eventBus.on("connect_error", (err) => Logger.error("Connect error", err && err.message));

        this.eventBus.on("user", (data) => {
            Logger.info("Received user payload");
            this.gameState.updateFromUser(data);

            // find our uid by BOT_NAME if present
            const me = this.gameState.bombers.find(b => b.name === this.config.BOT_NAME);
            if (me) {
                this.uid = me.uid;
                this.collectStrategy.setUid(this.uid);
                this.avoidStrategy.setUid(this.uid);
                this.attackStrategy.setUid(this.uid);
            } else if (!this.uid && this.gameState.bombers.length) {
                this.uid = this.gameState.bombers[0].uid;
                this.collectStrategy.setUid(this.uid);
                this.avoidStrategy.setUid(this.uid);
                this.attackStrategy.setUid(this.uid);
            }

            // if AUTO_START false, wait for server 'start', else synthetic start event emitted by GameSocket will run _onStart
        });

        this.eventBus.on("start", (data) => {
            Logger.info("Start event received -> start main loop");
            this._startLoop();
        });

        this.eventBus.on("map_update", (data) => this.gameState.updateMap(data));
        this.eventBus.on("new_bomb", (data) => this.gameState.updateBomb(data));
        this.eventBus.on("bomb_explode", (data) => this.gameState.removeBomb(data.id));
        this.eventBus.on("item_collected", (data) => {
            // server may send bomber/item updates; best to refresh from server events (map_update or user)
            // simple local update: remove item if present
            if (data?.item) {
                this.gameState.items = (this.gameState.items || []).filter(it => !(it.x === data.item.x && it.y === data.item.y));
            }
        });

        this.eventBus.on("player_move", (data) => {
            if (data?.uid) this.gameState.updateBomberPosition(data);
        });

        this.eventBus.on("new_enemy", (data) => {
            // new_enemy may contain bomber or list
            if (data?.bombers) {
                for (const b of data.bombers) this.gameState.updateBomberPosition(b);
            } else if (data?.bomber) this.gameState.updateBomberPosition(data.bomber);
        });

        this.eventBus.on("user_disconnect", (data) => {
            // remove bomber if sent
            if (data?.uid) this.gameState.bombers = this.gameState.bombers.filter(b => b.uid !== data.uid);
        });

        this.eventBus.on("finish", () => {
            Logger.info("Game finished");
            this._stopLoop();
        });
    }

    _startLoop() {
        if (this.loopTimer) return;
        this.isRunning = true;
        const interval = Math.max(17, this.config.LOOP_INTERVAL || 100);
        Logger.info(`Starting main loop with interval ${interval}ms`);
        this.loopTimer = setInterval(() => this._tick(), interval);
    }

    _stopLoop() {
        if (this.loopTimer) clearInterval(this.loopTimer);
        this.loopTimer = null;
        this.isRunning = false;
    }

    _tick() {
        if (!this.isRunning) return;
        if (!this.uid) return;

        // priority 1: avoid bombs
        try {
            const avoided = this.avoidStrategy.execute();
            if (avoided) return;
        } catch (e) { Logger.error("Avoid strategy error", e); }

        // priority 2: attack (place bomb) when adjacent to chest or enemy
        try {
            const attacked = this.attackStrategy.execute();
            if (attacked) return;
        } catch (e) { Logger.error("Attack strategy error", e); }

        // priority 3: collect items
        try {
            const collected = this.collectStrategy.execute();
            if (collected) return;
        } catch (e) { Logger.error("Collect strategy error", e); }

        // fallback: small random move to keep alive / reposition
        const dirs = ["UP","DOWN","LEFT","RIGHT"];
        const r = dirs[Math.floor(Math.random() * dirs.length)];
        this.socket.send("move", { orient: r });
    }
}
