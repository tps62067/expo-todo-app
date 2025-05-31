"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appService = exports.AppService = exports.TaskService = exports.NoteService = exports.DatabaseService = void 0;
// 数据库服务 (仍在使用中)
var database_service_1 = require("./database-service");
Object.defineProperty(exports, "DatabaseService", { enumerable: true, get: function () { return database_service_1.DatabaseService; } });
// 业务服务 (已弃用，请使用新架构)
/**
 * @deprecated 请使用新架构的 newAppService.notes 替代
 * 旧服务将在未来版本中移除
 */
var note_service_1 = require("./note-service");
Object.defineProperty(exports, "NoteService", { enumerable: true, get: function () { return note_service_1.NoteService; } });
/**
 * @deprecated 请使用新架构的 newAppService.tasks 替代
 * 旧服务将在未来版本中移除
 */
var task_service_1 = require("./task-service");
Object.defineProperty(exports, "TaskService", { enumerable: true, get: function () { return task_service_1.TaskService; } });
// 应用服务 (已弃用，请使用新架构)
/**
 * @deprecated 请使用新架构的 newAppService 替代
 * 旧服务将在未来版本中移除
 */
var app_service_1 = require("./app-service");
Object.defineProperty(exports, "AppService", { enumerable: true, get: function () { return app_service_1.AppService; } });
Object.defineProperty(exports, "appService", { enumerable: true, get: function () { return app_service_1.appService; } });
