// src/core/GameSocket.js
import { io } from "socket.io-client";
import { Logger } from "../utils/Logger.js";

/**
 * Facade for socket.io client with:
 * - auth via token
 * - onAny -> re-emit to EventBus
 * - send queue + rate limit (sendIntervalMs), default 17ms
 */
export class GameSocket {
    constructor(url, eventBus, opts = {}) {
        this.url = url;
        this.eventBus = eventBus;
        this.token = opts.token || null;
        this.autoStart = !!opts.autoStart;
        this.sendIntervalMs = opts.sendIntervalMs || 17;
        this.socket = null;
        this.connected = false;

        this.sendQueue = [];
        this._flusher = null;
    }

    connect() {
        if (!this.url) throw new Error("GameSocket: missing url");
        const auth = this.token ? { token: this.token } : undefined;
        Logger.info("GameSocket connecting to", this.url);
        this.socket = io(this.url, {
            auth,
            transports: ["websocket"],
            autoConnect: true,
            reconnectionAttempts: Infinity,
            reconnectionDelayMax: 30000
        });

        this.socket.on("connect", () => {
            this.connected = true;
            Logger.info("GameSocket connected id=", this.socket.id);
            this.eventBus.emit("connect", { id: this.socket.id });
            this._startFlusher();
            this._flushQueue();
        });

        this.socket.on("disconnect", (reason) => {
            this.connected = false;
            Logger.warn("GameSocket disconnected:", reason);
            this.eventBus.emit("disconnect", reason);
            this._stopFlusher();
        });

        this.socket.on("connect_error", (err) => {
            Logger.error("GameSocket connect_error:", err && err.message);
            this.eventBus.emit("connect_error", err);
        });

        // forward all server events to eventBus
        this.socket.onAny((event, ...args) => {
            const payload = args.length > 0 ? args[0] : undefined;
            this.eventBus.emit(event, payload);

            // if autoStart (testing), simulate start when 'user' received
            if (this.autoStart && event === "user") {
                setTimeout(() => {
                    Logger.info("GameSocket: AUTO_START -> emitting internal 'start'");
                    this.eventBus.emit("start", { synthetic: true });
                }, 150);
            }
        });
    }

    send(event, data = {}, ack) {
        // queue if not connected
        if (!this.socket || !this.connected) {
            Logger.debug("GameSocket.send queued:", event);
            this.sendQueue.push({ event, data, ack });
            return;
        }
        try {
            if (ack && typeof ack === "function") {
                this.socket.emit(event, data, ack);
            } else {
                this.socket.emit(event, data);
            }
        } catch (e) {
            Logger.error("GameSocket.send error, requeueing:", e.message);
            this.sendQueue.push({ event, data, ack });
        }
    }

    _startFlusher() {
        if (this._flusher) return;
        this._flusher = setInterval(() => this._flushQueueStep(), this.sendIntervalMs);
    }

    _stopFlusher() {
        if (this._flusher) {
            clearInterval(this._flusher);
            this._flusher = null;
        }
    }

    _flushQueue() {
        // flush all but respecting sendInterval is handled by _flushQueueStep repeatedly
        // here we just ensure flusher is running
        this._startFlusher();
    }

    _flushQueueStep() {
        if (!this.connected) return;
        const item = this.sendQueue.shift();
        if (!item) return;
        try {
            if (item.ack && typeof item.ack === "function") this.socket.emit(item.event, item.data, item.ack);
            else this.socket.emit(item.event, item.data);
        } catch (e) {
            Logger.error("Flush emit failed, requeue:", e.message);
            this.sendQueue.unshift(item);
        }
    }

    close() {
        try { this.socket?.close(); } catch (e) {}
        this._stopFlusher();
    }
}
