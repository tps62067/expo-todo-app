// 数据模型类型定义
export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled' | 'postponed' | 'paused' | 'waiting';
export type Priority = 'high' | 'medium' | 'low';
export type ContentType = 'plain' | 'markdown' | 'rich';
export type SyncStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0:未同步, 1:待同步, 2:同步中, 3:已同步, 4:冲突, 5:错误, 6:等待验证

// 基础实体接口
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
  last_synced_at?: string;
  local_version: number;
  remote_version_token?: string;
  is_deleted_locally: number; // 0:未删除, 1:已删除
}

// 任务实体
export interface Task extends BaseEntity {
  title: string;
  description?: string;
  priority: Priority;
  due_date?: string;
  completed_at?: string;
  status: TaskStatus;
  project_id?: string;
  parent_task_id?: string;
  depends_on_task_id?: string;
  estimated_duration_minutes?: number;
  actual_duration_minutes?: number;
  is_recurring: number; // 0:否, 1:是
  recurrence_rule?: string;
  sort_order: number;
}

// 项目/清单实体
export interface Project extends BaseEntity {
  name: string;
  color?: string;
  icon?: string;
  sort_order: number;
  is_shared: number; // 0:否, 1:是
  share_config?: string; // JSON
}

// 笔记实体
export interface Note extends BaseEntity {
  title: string;
  content?: string;
  content_type: ContentType;
  is_draft: number; // 0:否, 1:是
  notebook_id?: string;
  category?: string; // 分类
  color?: string; // 笔记颜色
  is_pinned: number; // 0:否, 1:是
  is_archived: number; // 0:否, 1:是
}

// 笔记本/文件夹实体
export interface Notebook extends BaseEntity {
  name: string;
  color?: string;
  icon?: string;
  parent_id?: string;
  sort_order: number;
  is_shared: number; // 0:否, 1:是
  share_config?: string; // JSON
}

// 标签实体
export interface Tag extends BaseEntity {
  name: string;
  color?: string;
}

// 笔记标签关联
export interface NoteTag {
  note_id: string;
  tag_id: string;
}

// 笔记版本历史
export interface NoteVersion {
  id: string;
  note_id: string;
  content: string;
  version_number: number;
  created_at: string;
}

// 任务时间日志
export interface TaskTimeLog extends BaseEntity {
  task_id: string;
  start_time: string;
  end_time?: string;
  description?: string;
}

// 附件
export interface Attachment extends BaseEntity {
  owner_type: 'note' | 'task';
  owner_id: string;
  file_name: string;
  local_uri?: string;
  remote_url?: string;
  mime_type?: string;
  size_bytes?: number;
}

// 同步元数据
export interface SyncMetadata {
  id: string;
  service_type: string;
  account_identifier?: string;
  config_data?: string; // JSON
  last_sync_time?: string;
  sync_status?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// 数据传输对象 (DTO) - 用于UI层
export interface TaskDTO {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  due_date?: Date;
  completed_at?: Date;
  time?: string; // 格式化后的时间显示
  completed: boolean; // 向后兼容
  project?: Project;
  parent_task?: Task;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface NoteDTO {
  id: string;
  title: string;
  content?: string;
  category?: string; // 分类名称
  tags: string[]; // 标签数组
  color?: string; // 笔记颜色
  is_pinned: boolean; // 是否置顶
  is_archived: boolean; // 是否归档
  created_at: Date | string;
  updated_at: Date | string;
}

// 创建表单数据类型
export interface CreateTaskForm {
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  due_date?: Date;
  reminder: boolean;
  category: string; // 项目ID或名称
}

export interface UpdateTaskForm {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: TaskStatus;
  due_date?: Date;
  reminder?: boolean;
  category?: string; // 项目ID或名称
}

export interface CreateNoteForm {
  title: string;
  content?: string;
  category?: string; // 分类名称
  color?: string;
  tags?: string[];
  is_pinned?: boolean;
  is_archived?: boolean;
}

export interface UpdateNoteForm {
  title?: string;
  content?: string;
  category?: string; // 分类名称
  color?: string;
  tags?: string[];
  is_pinned?: boolean;
  is_archived?: boolean;
} 