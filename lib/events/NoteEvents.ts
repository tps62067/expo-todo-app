import { Note } from '../models/types';
import { DomainEvent } from './EventBus';

export class NoteCreatedEvent implements DomainEvent {
  eventType = 'note.created';
  
  constructor(
    public aggregateId: string,
    public data: { note: Note },
    public occurredAt: Date = new Date()
  ) {}
}

export class NoteUpdatedEvent implements DomainEvent {
  eventType = 'note.updated';
  
  constructor(
    public aggregateId: string,
    public data: { note: Note; changes: Partial<Note> },
    public occurredAt: Date = new Date()
  ) {}
}

export class NoteDeletedEvent implements DomainEvent {
  eventType = 'note.deleted';
  
  constructor(
    public aggregateId: string,
    public data: { noteId: string },
    public occurredAt: Date = new Date()
  ) {}
}

export class NoteTagAddedEvent implements DomainEvent {
  eventType = 'note.tag.added';
  
  constructor(
    public aggregateId: string,
    public data: { noteId: string; tagId: string },
    public occurredAt: Date = new Date()
  ) {}
}

export class NoteTagRemovedEvent implements DomainEvent {
  eventType = 'note.tag.removed';
  
  constructor(
    public aggregateId: string,
    public data: { noteId: string; tagId: string },
    public occurredAt: Date = new Date()
  ) {}
} 