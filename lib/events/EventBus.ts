export interface DomainEvent {
  eventType: string;
  aggregateId: string;
  occurredAt: Date;
  data: any;
}

export interface EventHandler {
  handle(event: DomainEvent): Promise<void>;
}

export class EventBus {
  private handlers = new Map<string, EventHandler[]>();
  
  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }
  
  unsubscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];
    
    await Promise.all(
      handlers.map(handler => handler.handle(event))
    );
  }

  getSubscribedEvents(): string[] {
    return Array.from(this.handlers.keys());
  }

  getHandlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.length || 0;
  }
} 