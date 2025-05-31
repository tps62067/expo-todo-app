// 数据库服务 (仍在使用中)
export { DatabaseService } from './database-service';

// 业务服务 (已弃用，请使用新架构)
/**
 * @deprecated 请使用新架构的 newAppService.notes 替代
 * 旧服务将在未来版本中移除
 */
export { NoteService } from './note-service';

/**
 * @deprecated 请使用新架构的 newAppService.tasks 替代
 * 旧服务将在未来版本中移除
 */
export { TaskService } from './task-service';

// 应用服务 (已弃用，请使用新架构)
/**
 * @deprecated 请使用新架构的 newAppService 替代
 * 旧服务将在未来版本中移除
 */
export { AppService, appService } from './app-service';
