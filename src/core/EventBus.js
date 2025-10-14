// src/core/EventBus.js
export class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(event, cb) {
        if (!this.listeners.has(event)) this.listeners.set(event, []);
        this.listeners.get(event).push(cb);
    }

    emit(event, data) {
        const arr = this.listeners.get(event);
        if (!arr) return;
        for (const cb of arr) {
            try { cb(data); } catch (e) { /* swallow */ }
        }
    }

    off(event, cb) {
        const arr = this.listeners.get(event);
        if (!arr) return;
        this.listeners.set(event, arr.filter(x => x !== cb));
    }
}
