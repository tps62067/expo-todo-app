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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = exports.TaskDAO = exports.TagDAO = exports.ProjectDAO = exports.NotebookDAO = exports.NoteDAO = exports.BaseDAO = exports.DatabaseManager = void 0;
// 数据库管理器
var manager_1 = require("./manager");
Object.defineProperty(exports, "DatabaseManager", { enumerable: true, get: function () { return __importDefault(manager_1).default; } });
// DAO类
var base_dao_1 = require("./base-dao");
Object.defineProperty(exports, "BaseDAO", { enumerable: true, get: function () { return base_dao_1.BaseDAO; } });
var note_dao_1 = require("./note-dao");
Object.defineProperty(exports, "NoteDAO", { enumerable: true, get: function () { return note_dao_1.NoteDAO; } });
var notebook_dao_1 = require("./notebook-dao");
Object.defineProperty(exports, "NotebookDAO", { enumerable: true, get: function () { return notebook_dao_1.NotebookDAO; } });
var project_dao_1 = require("./project-dao");
Object.defineProperty(exports, "ProjectDAO", { enumerable: true, get: function () { return project_dao_1.ProjectDAO; } });
var tag_dao_1 = require("./tag-dao");
Object.defineProperty(exports, "TagDAO", { enumerable: true, get: function () { return tag_dao_1.TagDAO; } });
var task_dao_1 = require("./task-dao");
Object.defineProperty(exports, "TaskDAO", { enumerable: true, get: function () { return task_dao_1.TaskDAO; } });
// 数据库架构
__exportStar(require("./schema"), exports);
// 服务类
var database_service_1 = require("../services/database-service");
Object.defineProperty(exports, "DatabaseService", { enumerable: true, get: function () { return database_service_1.DatabaseService; } });
