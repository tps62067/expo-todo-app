"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureServices = configureServices;
exports.createContainer = createContainer;
const notebook_dao_1 = require("../database/notebook-dao");
const tag_dao_1 = require("../database/tag-dao");
const EventBus_1 = require("../events/EventBus");
const NoteRepository_1 = require("../repositories/NoteRepository");
const ProjectRepository_1 = require("../repositories/ProjectRepository");
const TaskRepository_1 = require("../repositories/TaskRepository");
const NewNoteService_1 = require("../services/NewNoteService");
const NewTaskService_1 = require("../services/NewTaskService");
const database_service_1 = require("../services/database-service");
const Container_1 = require("./Container");
function configureServices(container) {
    // 注册基础设施
    container.register('eventBus', {
        factory: () => new EventBus_1.EventBus(),
        singleton: true
    });
    // 注册数据库服务
    container.register('databaseService', {
        factory: () => database_service_1.DatabaseService.getInstance(),
        singleton: true
    });
    // 注册DAO层
    container.register('taskDAO', {
        factory: (dbService) => dbService.taskDAO,
        dependencies: ['databaseService'],
        singleton: true
    });
    container.register('noteDAO', {
        factory: (dbService) => dbService.noteDAO,
        dependencies: ['databaseService'],
        singleton: true
    });
    container.register('projectDAO', {
        factory: (dbService) => dbService.projectDAO,
        dependencies: ['databaseService'],
        singleton: true
    });
    container.register('notebookDAO', {
        factory: () => new notebook_dao_1.NotebookDAO(),
        singleton: true
    });
    container.register('tagDAO', {
        factory: () => new tag_dao_1.TagDAO(),
        singleton: true
    });
    container.register('taskTimeLogDAO', {
        factory: (dbService) => dbService.taskTimeLogDAO,
        dependencies: ['databaseService'],
        singleton: true
    });
    // 注册Repository层
    container.register('taskRepository', {
        factory: (taskDAO) => new TaskRepository_1.TaskRepository(taskDAO),
        dependencies: ['taskDAO'],
        singleton: true
    });
    container.register('noteRepository', {
        factory: (noteDAO) => new NoteRepository_1.NoteRepository(noteDAO),
        dependencies: ['noteDAO'],
        singleton: true
    });
    container.register('projectRepository', {
        factory: (projectDAO) => new ProjectRepository_1.ProjectRepository(projectDAO),
        dependencies: ['projectDAO'],
        singleton: true
    });
    // 注册Service层
    container.register('taskService', {
        factory: (taskRepository, projectRepository, taskTimeLogDAO, eventBus) => new NewTaskService_1.NewTaskService(taskRepository, projectRepository, taskTimeLogDAO, eventBus),
        dependencies: ['taskRepository', 'projectRepository', 'taskTimeLogDAO', 'eventBus'],
        singleton: true
    });
    container.register('noteService', {
        factory: (noteRepository, tagDAO, eventBus) => new NewNoteService_1.NewNoteService(noteRepository, tagDAO, eventBus),
        dependencies: ['noteRepository', 'tagDAO', 'eventBus'],
        singleton: true
    });
    // 注册事件处理器可以在这里添加
    // container.register('statisticsHandler', {
    //   factory: (statisticsService) => new StatisticsHandler(statisticsService),
    //   dependencies: ['statisticsService'],
    //   singleton: true
    // });
}
function createContainer() {
    const container = new Container_1.Container();
    configureServices(container);
    return container;
}
