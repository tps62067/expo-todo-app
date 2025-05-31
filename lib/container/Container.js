"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Container = void 0;
class Container {
    constructor() {
        this.services = new Map();
        this.instances = new Map();
    }
    register(name, definition) {
        this.services.set(name, definition);
    }
    resolve(name) {
        if (this.instances.has(name)) {
            return this.instances.get(name);
        }
        const definition = this.services.get(name);
        if (!definition) {
            throw new Error(`Service ${name} not found`);
        }
        const dependencies = definition.dependencies?.map(dep => this.resolve(dep)) || [];
        const instance = definition.factory(...dependencies);
        if (definition.singleton !== false) {
            this.instances.set(name, instance);
        }
        return instance;
    }
    has(name) {
        return this.services.has(name);
    }
    clear() {
        this.instances.clear();
        this.services.clear();
    }
    getRegisteredServices() {
        return Array.from(this.services.keys());
    }
}
exports.Container = Container;
