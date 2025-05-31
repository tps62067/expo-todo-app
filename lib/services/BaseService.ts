import { DomainEvent, EventBus } from '../events/EventBus';

export abstract class BaseService {
  constructor(
    protected eventBus: EventBus
  ) {}
  
  protected async publishEvent(event: DomainEvent): Promise<void> {
    await this.eventBus.publish(event);
  }

  protected validateRequired(value: any, fieldName: string): void {
    if (value === null || value === undefined || value === '') {
      throw new ValidationError(`${fieldName} 不能为空`);
    }
  }

  protected validateLength(value: string, maxLength: number, fieldName: string): void {
    if (value && value.length > maxLength) {
      throw new ValidationError(`${fieldName} 不能超过 ${maxLength} 个字符`);
    }
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessError';
  }
} 