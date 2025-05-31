"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBus = void 0;
class EventBus {
    constructor() {
        this.handlers = new Map();
    }
    subscribe(eventType, handler) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }
        this.handlers.get(eventType).push(handler);
    }
    unsubscribe(eventType, handler) {
        const handlers = this.handlers.get(eventType);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
    }
    async publish(event) {
        const handlers = this.handlers.get(event.eventType) || [];
        await Promise.all(handlers.map(handler => handler.handle(event)));
    }
    getSubscribedEvents() {
        return Array.from(this.handlers.keys());
    }
    getHandlerCount(eventType) {
        return this.handlers.get(eventType)?.length || 0;
    }
}
exports.EventBus = EventBus;
