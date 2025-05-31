"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskDeletedEvent = exports.TaskCompletedEvent = exports.TaskUpdatedEvent = exports.TaskCreatedEvent = void 0;
class TaskCreatedEvent {
    constructor(aggregateId, data, occurredAt = new Date()) {
        this.aggregateId = aggregateId;
        this.data = data;
        this.occurredAt = occurredAt;
        this.eventType = 'task.created';
    }
}
exports.TaskCreatedEvent = TaskCreatedEvent;
class TaskUpdatedEvent {
    constructor(aggregateId, data, occurredAt = new Date()) {
        this.aggregateId = aggregateId;
        this.data = data;
        this.occurredAt = occurredAt;
        this.eventType = 'task.updated';
    }
}
exports.TaskUpdatedEvent = TaskUpdatedEvent;
class TaskCompletedEvent {
    constructor(aggregateId, data, occurredAt = new Date()) {
        this.aggregateId = aggregateId;
        this.data = data;
        this.occurredAt = occurredAt;
        this.eventType = 'task.completed';
    }
}
exports.TaskCompletedEvent = TaskCompletedEvent;
class TaskDeletedEvent {
    constructor(aggregateId, data, occurredAt = new Date()) {
        this.aggregateId = aggregateId;
        this.data = data;
        this.occurredAt = occurredAt;
        this.eventType = 'task.deleted';
    }
}
exports.TaskDeletedEvent = TaskDeletedEvent;
