"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessError = exports.ValidationError = exports.BaseService = void 0;
class BaseService {
    constructor(eventBus) {
        this.eventBus = eventBus;
    }
    async publishEvent(event) {
        await this.eventBus.publish(event);
    }
    validateRequired(value, fieldName) {
        if (value === null || value === undefined || value === '') {
            throw new ValidationError(`${fieldName} 不能为空`);
        }
    }
    validateLength(value, maxLength, fieldName) {
        if (value && value.length > maxLength) {
            throw new ValidationError(`${fieldName} 不能超过 ${maxLength} 个字符`);
        }
    }
}
exports.BaseService = BaseService;
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class BusinessError extends Error {
    constructor(message) {
        super(message);
        this.name = 'BusinessError';
    }
}
exports.BusinessError = BusinessError;
