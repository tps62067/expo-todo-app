"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = exports.newApp = void 0;
// 数据模型
__exportStar(require("./models/types"), exports);
// 工具函数
__exportStar(require("./utils/date"), exports);
__exportStar(require("./utils/uuid"), exports);
// 数据库层 (保留，但推荐使用Repository)
__exportStar(require("./database"), exports);
// 新架构模块
__exportStar(require("./container/Container"), exports);
__exportStar(require("./container/ServiceRegistry"), exports);
__exportStar(require("./events/EventBus"), exports);
__exportStar(require("./events/NoteEvents"), exports);
__exportStar(require("./events/TaskEvents"), exports);
__exportStar(require("./repositories/interfaces/IBaseRepository"), exports);
__exportStar(require("./repositories/interfaces/INoteRepository"), exports);
__exportStar(require("./repositories/interfaces/ITaskRepository"), exports);
__exportStar(require("./repositories/NoteRepository"), exports);
__exportStar(require("./repositories/TaskRepository"), exports);
__exportStar(require("./services/BaseService"), exports);
__exportStar(require("./services/NewAppService"), exports);
__exportStar(require("./services/NewTaskService"), exports);
// 便捷的全局导出 - 新架构 (推荐使用)
var NewAppService_1 = require("./services/NewAppService");
Object.defineProperty(exports, "newApp", { enumerable: true, get: function () { return NewAppService_1.newAppService; } });
// 旧服务层 (标记为已弃用，仅保留兼容性)
/**
 * @deprecated 请使用新架构的 newAppService 替代
 * 旧架构将在未来版本中移除
 */
__exportStar(require("./services"), exports);
// 便捷的全局导出 - 旧架构 (兼容性，已弃用)
/**
 * @deprecated 请使用 newAppService 替代
 * 旧架构将在未来版本中移除
 */
var app_service_1 = require("./services/app-service");
Object.defineProperty(exports, "app", { enumerable: true, get: function () { return app_service_1.appService; } });
