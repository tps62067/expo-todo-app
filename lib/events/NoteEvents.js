"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteTagRemovedEvent = exports.NoteTagAddedEvent = exports.NoteDeletedEvent = exports.NoteUpdatedEvent = exports.NoteCreatedEvent = void 0;
class NoteCreatedEvent {
    constructor(aggregateId, data, occurredAt = new Date()) {
        this.aggregateId = aggregateId;
        this.data = data;
        this.occurredAt = occurredAt;
        this.eventType = 'note.created';
    }
}
exports.NoteCreatedEvent = NoteCreatedEvent;
class NoteUpdatedEvent {
    constructor(aggregateId, data, occurredAt = new Date()) {
        this.aggregateId = aggregateId;
        this.data = data;
        this.occurredAt = occurredAt;
        this.eventType = 'note.updated';
    }
}
exports.NoteUpdatedEvent = NoteUpdatedEvent;
class NoteDeletedEvent {
    constructor(aggregateId, data, occurredAt = new Date()) {
        this.aggregateId = aggregateId;
        this.data = data;
        this.occurredAt = occurredAt;
        this.eventType = 'note.deleted';
    }
}
exports.NoteDeletedEvent = NoteDeletedEvent;
class NoteTagAddedEvent {
    constructor(aggregateId, data, occurredAt = new Date()) {
        this.aggregateId = aggregateId;
        this.data = data;
        this.occurredAt = occurredAt;
        this.eventType = 'note.tag.added';
    }
}
exports.NoteTagAddedEvent = NoteTagAddedEvent;
class NoteTagRemovedEvent {
    constructor(aggregateId, data, occurredAt = new Date()) {
        this.aggregateId = aggregateId;
        this.data = data;
        this.occurredAt = occurredAt;
        this.eventType = 'note.tag.removed';
    }
}
exports.NoteTagRemovedEvent = NoteTagRemovedEvent;
