import { Task } from '../models/types';
import { DomainEvent } from './EventBus';

export class TaskCreatedEvent implements DomainEvent {
  eventType = 'task.created';
  
  constructor(
    public aggregateId: string,
    public data: { task: Task },
    public occurredAt: Date = new Date()
  ) {}
}

export class TaskUpdatedEvent implements DomainEvent {
  eventType = 'task.updated';
  
  constructor(
    public aggregateId: string,
    public data: { task: Task; changes: Partial<Task> },
    public occurredAt: Date = new Date()
  ) {}
}

export class TaskCompletedEvent implements DomainEvent {
  eventType = 'task.completed';
  
  constructor(
    public aggregateId: string,
    public data: { task: Task; completedAt: Date },
    public occurredAt: Date = new Date()
  ) {}
}

export class TaskDeletedEvent implements DomainEvent {
  eventType = 'task.deleted';
  
  constructor(
    public aggregateId: string,
    public data: { taskId: string },
    public occurredAt: Date = new Date()
  ) {}
} 