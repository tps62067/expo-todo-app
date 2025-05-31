import { NotebookDAO } from '../database/notebook-dao';
import { TagDAO } from '../database/tag-dao';
import { EventBus } from '../events/EventBus';
import { NoteRepository } from '../repositories/NoteRepository';
import { ProjectRepository } from '../repositories/ProjectRepository';
import { TaskRepository } from '../repositories/TaskRepository';
import { NewNoteService } from '../services/NewNoteService';
import { NewTaskService } from '../services/NewTaskService';
import { DatabaseService } from '../services/database-service';
import { Container } from './Container';

export function configureServices(container: Container): void {
  // 注册基础设施
  container.register('eventBus', {
    factory: () => new EventBus(),
    singleton: true
  });

  // 注册数据库服务
  container.register('databaseService', {
    factory: () => DatabaseService.getInstance(),
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
    factory: () => new NotebookDAO(),
    singleton: true
  });

  container.register('tagDAO', {
    factory: () => new TagDAO(),
    singleton: true
  });

  container.register('taskTimeLogDAO', {
    factory: (dbService) => dbService.taskTimeLogDAO,
    dependencies: ['databaseService'],
    singleton: true
  });

  // 注册Repository层
  container.register('taskRepository', {
    factory: (taskDAO) => new TaskRepository(taskDAO),
    dependencies: ['taskDAO'],
    singleton: true
  });

  container.register('noteRepository', {
    factory: (noteDAO) => new NoteRepository(noteDAO),
    dependencies: ['noteDAO'],
    singleton: true
  });

  container.register('projectRepository', {
    factory: (projectDAO) => new ProjectRepository(projectDAO),
    dependencies: ['projectDAO'],
    singleton: true
  });

  // 注册Service层
  container.register('taskService', {
    factory: (taskRepository, projectRepository, taskTimeLogDAO, eventBus) => new NewTaskService(taskRepository, projectRepository, taskTimeLogDAO, eventBus),
    dependencies: ['taskRepository', 'projectRepository', 'taskTimeLogDAO', 'eventBus'],
    singleton: true
  });

  container.register('noteService', {
    factory: (noteRepository, tagDAO, eventBus) => new NewNoteService(noteRepository, tagDAO, eventBus),
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

export function createContainer(): Container {
  const container = new Container();
  configureServices(container);
  return container;
} 