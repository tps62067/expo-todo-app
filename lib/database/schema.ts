// 数据库表结构定义
export const DATABASE_VERSION = 1;
export const DATABASE_NAME = 'mountain_notes.db';

// 任务表
export const CREATE_TASKS_TABLE = `
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    priority INTEGER DEFAULT 0,
    due_date TEXT,
    completed_at TEXT,
    status TEXT DEFAULT 'not_started',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    project_id TEXT,
    parent_task_id TEXT,
    depends_on_task_id TEXT,
    estimated_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    is_recurring INTEGER NOT NULL DEFAULT 0,
    recurrence_rule TEXT,
    sort_order INTEGER DEFAULT 0,
    sync_status INTEGER DEFAULT 0,
    last_synced_at TEXT,
    local_version INTEGER NOT NULL DEFAULT 1,
    remote_version_token TEXT,
    is_deleted_locally INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (parent_task_id) REFERENCES tasks(id),
    FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id)
  );
`;

// 项目表
export const CREATE_PROJECTS_TABLE = `
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_shared INTEGER NOT NULL DEFAULT 0,
    share_config TEXT,
    sync_status INTEGER DEFAULT 0,
    last_synced_at TEXT,
    local_version INTEGER NOT NULL DEFAULT 1,
    remote_version_token TEXT,
    is_deleted_locally INTEGER NOT NULL DEFAULT 0
  );
`;

// 笔记表
export const CREATE_NOTES_TABLE = `
  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    content_type TEXT DEFAULT 'plain',
    is_draft INTEGER NOT NULL DEFAULT 0,
    category TEXT,
    color TEXT,
    is_pinned INTEGER NOT NULL DEFAULT 0,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    notebook_id TEXT,
    sync_status INTEGER DEFAULT 0,
    last_synced_at TEXT,
    local_version INTEGER NOT NULL DEFAULT 1,
    remote_version_token TEXT,
    is_deleted_locally INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (notebook_id) REFERENCES notebooks(id)
  );
`;

// 笔记本表
export const CREATE_NOTEBOOKS_TABLE = `
  CREATE TABLE IF NOT EXISTS notebooks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    parent_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_shared INTEGER NOT NULL DEFAULT 0,
    share_config TEXT,
    sync_status INTEGER DEFAULT 0,
    last_synced_at TEXT,
    local_version INTEGER NOT NULL DEFAULT 1,
    remote_version_token TEXT,
    is_deleted_locally INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (parent_id) REFERENCES notebooks(id)
  );
`;

// 标签表
export const CREATE_TAGS_TABLE = `
  CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    color TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    sync_status INTEGER DEFAULT 0,
    last_synced_at TEXT,
    local_version INTEGER NOT NULL DEFAULT 1,
    remote_version_token TEXT,
    is_deleted_locally INTEGER NOT NULL DEFAULT 0
  );
`;

// 笔记标签关联表
export const CREATE_NOTE_TAGS_TABLE = `
  CREATE TABLE IF NOT EXISTS note_tags (
    note_id TEXT,
    tag_id TEXT,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
  );
`;

// 笔记版本历史表
export const CREATE_NOTE_VERSIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS note_versions (
    id TEXT PRIMARY KEY,
    note_id TEXT NOT NULL,
    content TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
  );
`;

// 任务时间日志表
export const CREATE_TASK_TIME_LOGS_TABLE = `
  CREATE TABLE IF NOT EXISTS task_time_logs (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    sync_status INTEGER DEFAULT 0,
    last_synced_at TEXT,
    local_version INTEGER NOT NULL DEFAULT 1,
    remote_version_token TEXT,
    is_deleted_locally INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
  );
`;

// 附件表
export const CREATE_ATTACHMENTS_TABLE = `
  CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    owner_type TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    local_uri TEXT,
    remote_url TEXT,
    mime_type TEXT,
    size_bytes INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    sync_status INTEGER DEFAULT 0,
    last_synced_at TEXT,
    local_version INTEGER NOT NULL DEFAULT 1,
    remote_version_token TEXT,
    is_deleted_locally INTEGER NOT NULL DEFAULT 0
  );
`;

// 同步元数据表
export const CREATE_SYNC_METADATA_TABLE = `
  CREATE TABLE IF NOT EXISTS sync_metadata (
    id TEXT PRIMARY KEY,
    service_type TEXT NOT NULL,
    account_identifier TEXT,
    config_data TEXT,
    last_sync_time TEXT,
    sync_status TEXT,
    error_message TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`;

// 索引定义
export const CREATE_INDEXES = [
  // 任务相关索引
  'CREATE INDEX IF NOT EXISTS idx_task_priority ON tasks(priority);',
  'CREATE INDEX IF NOT EXISTS idx_task_due_date ON tasks(due_date);',
  'CREATE INDEX IF NOT EXISTS idx_task_completed_at ON tasks(completed_at);',
  'CREATE INDEX IF NOT EXISTS idx_task_status ON tasks(status);',
  'CREATE INDEX IF NOT EXISTS idx_task_project_id ON tasks(project_id);',
  'CREATE INDEX IF NOT EXISTS idx_task_parent_task_id ON tasks(parent_task_id);',
  'CREATE INDEX IF NOT EXISTS idx_task_depends_on_task_id ON tasks(depends_on_task_id);',
  'CREATE INDEX IF NOT EXISTS idx_task_is_recurring ON tasks(is_recurring);',
  'CREATE INDEX IF NOT EXISTS idx_task_sort_order ON tasks(sort_order);',
  'CREATE INDEX IF NOT EXISTS idx_task_sync_status ON tasks(sync_status);',
  'CREATE INDEX IF NOT EXISTS idx_task_is_deleted_locally ON tasks(is_deleted_locally);',
  
  // 已完成任务增强功能专用索引
  'CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at DESC) WHERE status = \'completed\';',
  'CREATE INDEX IF NOT EXISTS idx_tasks_completed_project ON tasks(project_id, completed_at DESC) WHERE status = \'completed\';',
  'CREATE INDEX IF NOT EXISTS idx_tasks_completed_search ON tasks(title, description) WHERE status = \'completed\';',
  
  // 评审建议的复合索引 - 优化搜索和筛选性能
  'CREATE INDEX IF NOT EXISTS idx_task_search ON tasks(title, description);',
  'CREATE INDEX IF NOT EXISTS idx_task_due_date_status ON tasks(due_date, status);',
  'CREATE INDEX IF NOT EXISTS idx_task_priority_status ON tasks(priority, status);',
  'CREATE INDEX IF NOT EXISTS idx_task_project_status ON tasks(project_id, status);',
  'CREATE INDEX IF NOT EXISTS idx_task_status_deleted ON tasks(status, is_deleted_locally);',
  'CREATE INDEX IF NOT EXISTS idx_task_created_status ON tasks(created_at, status);',
  
  // 项目相关索引
  'CREATE INDEX IF NOT EXISTS idx_project_name ON projects(name);',
  'CREATE INDEX IF NOT EXISTS idx_project_sort_order ON projects(sort_order);',
  'CREATE INDEX IF NOT EXISTS idx_project_is_shared ON projects(is_shared);',
  'CREATE INDEX IF NOT EXISTS idx_project_sync_status ON projects(sync_status);',
  'CREATE INDEX IF NOT EXISTS idx_project_is_deleted_locally ON projects(is_deleted_locally);',
  
  // 笔记相关索引
  'CREATE INDEX IF NOT EXISTS idx_note_notebook_id ON notes(notebook_id);',
  'CREATE INDEX IF NOT EXISTS idx_note_is_draft ON notes(is_draft);',
  'CREATE INDEX IF NOT EXISTS idx_note_category ON notes(category);',
  'CREATE INDEX IF NOT EXISTS idx_note_is_pinned ON notes(is_pinned);',
  'CREATE INDEX IF NOT EXISTS idx_note_is_archived ON notes(is_archived);',
  'CREATE INDEX IF NOT EXISTS idx_note_sync_status ON notes(sync_status);',
  'CREATE INDEX IF NOT EXISTS idx_note_is_deleted_locally ON notes(is_deleted_locally);',
  
  // 评审建议的笔记复合索引
  'CREATE INDEX IF NOT EXISTS idx_note_search ON notes(title, content);',
  'CREATE INDEX IF NOT EXISTS idx_note_notebook_status ON notes(notebook_id, is_deleted_locally);',
  'CREATE INDEX IF NOT EXISTS idx_note_created_status ON notes(created_at, is_deleted_locally);',
  
  // 笔记本相关索引
  'CREATE INDEX IF NOT EXISTS idx_notebook_name ON notebooks(name);',
  'CREATE INDEX IF NOT EXISTS idx_notebook_parent_id ON notebooks(parent_id);',
  'CREATE INDEX IF NOT EXISTS idx_notebook_sort_order ON notebooks(sort_order);',
  'CREATE INDEX IF NOT EXISTS idx_notebook_is_shared ON notebooks(is_shared);',
  'CREATE INDEX IF NOT EXISTS idx_notebook_sync_status ON notebooks(sync_status);',
  'CREATE INDEX IF NOT EXISTS idx_notebook_is_deleted_locally ON notebooks(is_deleted_locally);',
  
  // 标签相关索引
  'CREATE INDEX IF NOT EXISTS idx_tag_name ON tags(name);',
  'CREATE INDEX IF NOT EXISTS idx_tag_sync_status ON tags(sync_status);',
  'CREATE INDEX IF NOT EXISTS idx_tag_is_deleted_locally ON tags(is_deleted_locally);',
  
  // 笔记标签关联索引
  'CREATE INDEX IF NOT EXISTS idx_nt_note_id ON note_tags(note_id);',
  'CREATE INDEX IF NOT EXISTS idx_nt_tag_id ON note_tags(tag_id);',
  
  // 笔记版本历史索引
  'CREATE INDEX IF NOT EXISTS idx_nv_note_id ON note_versions(note_id);',
  'CREATE INDEX IF NOT EXISTS idx_nv_note_version ON note_versions(note_id, version_number);',
  
  // 任务时间日志索引
  'CREATE INDEX IF NOT EXISTS idx_ttl_task_id ON task_time_logs(task_id);',
  'CREATE INDEX IF NOT EXISTS idx_ttl_start_time ON task_time_logs(start_time);',
  
  // 附件相关索引
  'CREATE INDEX IF NOT EXISTS idx_att_owner_type ON attachments(owner_type);',
  'CREATE INDEX IF NOT EXISTS idx_att_owner_id ON attachments(owner_id);',
  'CREATE INDEX IF NOT EXISTS idx_att_owner_type_id ON attachments(owner_type, owner_id);',
  'CREATE INDEX IF NOT EXISTS idx_att_sync_status ON attachments(sync_status);',
  'CREATE INDEX IF NOT EXISTS idx_att_is_deleted_locally ON attachments(is_deleted_locally);',
  
  // 同步元数据索引
  'CREATE INDEX IF NOT EXISTS idx_sync_service_type ON sync_metadata(service_type);',
  'CREATE INDEX IF NOT EXISTS idx_sync_status ON sync_metadata(sync_status);',
];

// 所有建表语句
export const CREATE_TABLES = [
  CREATE_PROJECTS_TABLE,
  CREATE_NOTEBOOKS_TABLE,
  CREATE_TASKS_TABLE,
  CREATE_NOTES_TABLE,
  CREATE_TAGS_TABLE,
  CREATE_NOTE_TAGS_TABLE,
  CREATE_NOTE_VERSIONS_TABLE,
  CREATE_TASK_TIME_LOGS_TABLE,
  CREATE_ATTACHMENTS_TABLE,
  CREATE_SYNC_METADATA_TABLE,
];

// 初始化数据
export const INSERT_DEFAULT_DATA = [
  // 默认项目
  `INSERT OR IGNORE INTO projects (id, name, color, icon, created_at, updated_at, sort_order) 
   VALUES ('default-project', '默认清单', '#2196F3', 'folder-outline', datetime('now'), datetime('now'), 0);`,
  
  // 默认笔记本
  `INSERT OR IGNORE INTO notebooks (id, name, color, icon, created_at, updated_at, sort_order) 
   VALUES ('default-notebook', '默认笔记本', '#4CAF50', 'notebook-outline', datetime('now'), datetime('now'), 0);`,
   
  // 一些预设标签
  `INSERT OR IGNORE INTO tags (id, name, color, created_at, updated_at) 
   VALUES ('tag-work', '工作', '#FF9800', datetime('now'), datetime('now'));`,
   
  `INSERT OR IGNORE INTO tags (id, name, color, created_at, updated_at) 
   VALUES ('tag-study', '学习', '#9C27B0', datetime('now'), datetime('now'));`,
   
  `INSERT OR IGNORE INTO tags (id, name, color, created_at, updated_at) 
   VALUES ('tag-life', '生活', '#E91E63', datetime('now'), datetime('now'));`,
]; 