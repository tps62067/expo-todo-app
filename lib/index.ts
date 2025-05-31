// 数据模型
export * from './models/types';

// 工具函数
export * from './utils/date';
export * from './utils/uuid';

// 数据库层 (保留，但推荐使用Repository)
export * from './database';

// 新架构模块
export * from './container/Container';
export * from './container/ServiceRegistry';
export * from './events/EventBus';
export * from './events/NoteEvents';
export * from './events/TaskEvents';
export * from './repositories/interfaces/IBaseRepository';
export * from './repositories/interfaces/INoteRepository';
export * from './repositories/interfaces/ITaskRepository';
export * from './repositories/NoteRepository';
export * from './repositories/TaskRepository';
export * from './services/BaseService';
export * from './services/NewAppService';
export * from './services/NewTaskService';

// 便捷的全局导出 - 新架构 (推荐使用)
export { newAppService as newApp } from './services/NewAppService';

// 旧服务层 (标记为已弃用，仅保留兼容性)
/**
 * @deprecated 请使用新架构的 newAppService 替代
 * 旧架构将在未来版本中移除
 */
export * from './services';

// 便捷的全局导出 - 旧架构 (兼容性，已弃用)
/**
 * @deprecated 请使用 newAppService 替代
 * 旧架构将在未来版本中移除
 */
export { appService as app } from './services/app-service';

