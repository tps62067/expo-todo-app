# 山记事 App - API接口设计文档

**版本:** 1.0
**日期:** 2025-01-27
**基于:** 架构设计文档 v2.0, 数据模型与存储设计文档 v1.0
**技术栈:** Expo + React Native + TypeScript

## 目录
1.  [引言](#1-引言)
    1.1. [文档目的](#11-文档目的)
    1.2. [核心原则](#12-核心原则)
2.  [数据访问层 (Repository) 接口](#2-数据访问层-repository-接口)
    2.1. [通用Repository操作](#21-通用repository操作)
    2.2. [ITaskRepository](#22-itaskrepository)
    2.3. [IProjectRepository](#23-iprojectrepository)
    2.4. [INoteRepository](#24-inoterepository)
    2.5. [INotebookRepository](#25-inotebookrepository)
    2.6. [ITagRepository](#26-itagrepository)
    2.7. [INoteVersionRepository](#27-inoteversionrepository)
    2.8. [ISyncMetadataRepository](#28-isyncmetadatarepository)
3.  [应用层 (Use Case / Service) 接口](#3-应用层-use-case--service-接口)
    3.1. [任务管理用例 (TaskUseCases)](#31-任务管理用例-taskusecases)
    3.2. [笔记管理用例 (NoteUseCases)](#32-笔记管理用例-noteusecases)
    3.3. [数据同步用例 (SyncUseCases)](#33-数据同步用例-syncusecases)
4.  [数据同步适配器接口 (ISyncAdapter)](#4-数据同步适配器接口-isyncadapter)
    4.1. [核心接口定义](#41-核心接口定义)
    4.2. [数据结构 (LocalChange, RemoteChange)](#42-数据结构-localchange-remotechange)
    4.3. [云服务API交互考量](#43-云服务api交互考量)
5.  [导入/导出数据格式定义](#5-导入导出数据格式定义)
    5.1. [JSON格式](#51-json格式)
    5.2. [CSV格式 (任务)](#52-csv格式-任务)
    5.3. [iCalendar (.ics) 格式 (任务)](#53-icalendar-ics-格式-任务)
    5.4. [Markdown (笔记导出)](#54-markdown-笔记导出)
    5.5. [Evernote (.enex) 格式 (笔记导入)](#55-evernote-enex-格式-笔记导入)

---

## 1. 引言

### 1.1. 文档目的
本文档旨在定义"山记事"App内部各层之间以及与外部服务交互的接口规范。它包括数据访问层接口、应用层用例接口、数据同步适配器接口，以及数据导入/导出所支持的格式。

### 1.2. 核心原则
*   **清晰性:** 接口定义明确，易于理解和使用。
*   **依赖倒置:** 高层模块不依赖低层模块，两者都依赖于抽象（接口）。
*   **关注点分离:** 接口设计应促进各模块职责的独立性。
*   **稳定性:** 接口一旦定义，应尽量保持稳定，变更需谨慎并有版本控制。
*   **数据封装:** 接口应暴露必要的数据和操作，隐藏内部实现细节。

## 2. 数据访问层 (Repository) 接口

Repositories 负责封装数据持久化和检索的逻辑，为应用层提供统一的数据操作接口。所有接口方法都应是异步的 (`Promise<T>`)。

**领域实体 (Domain Entities):**
(此处引用或简述在 `数据模型与存储设计.md` 中定义的 `Task`, `Project`, `Note`, `Notebook`, `Tag` 等实体结构)

**数据传输对象 (DTOs):**
DTOs 可能用于在层间传递数据，特别是当展示层需要的数据结构与领域实体不完全一致时。

### 2.1. 通用Repository操作
可以定义一个通用的基础Repository接口，包含CRUD操作：

```typescript
interface IBaseRepository<T, TID> {
  findById(id: TID): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(entity: Partial<T>): Promise<T>; // Partial<T> for creation, returns full T
  update(id: TID, updates: Partial<T>): Promise<T | null>;
  delete(id: TID): Promise<boolean>; // true if successful
  exists(id: TID): Promise<boolean>;
}
```

### 2.2. `ITaskRepository`

```typescript
import { Task, Project } from './domain-entities'; // Adjust path

interface TaskFilters {
  isCompleted?: boolean;
  projectId?: string;
  dueDateBefore?: Date;
  dueDateAfter?: Date;
  priority?: number;
}

interface ITaskRepository extends IBaseRepository<Task, string> {
  // Specific Task methods
  findByFilters(filters: TaskFilters): Promise<Task[]>;
  findByProjectId(projectId: string): Promise<Task[]>;
  markAsCompleted(id: string, completedAt: Date): Promise<Task | null>;
  markAsIncomplete(id: string): Promise<Task | null>;
  getTasksForToday(): Promise<Task[]>;
  getUpcomingTasks(days: number): Promise<Task[]>;
  // Methods for sync
  getUnsyncedTasks(): Promise<Task[]>;
  updateSyncStatus(id: string, syncStatus: number, lastSyncedAt?: Date, remoteVersionToken?: string): Promise<Task | null>;
  updateLocalVersion(id: string, localVersion: number): Promise<Task | null>;
  softDelete(id: string): Promise<Task | null>; // Mark as is_deleted_locally
  getLocallyDeletedTasks(): Promise<Task[]>; // Get tasks marked for remote deletion
  hardDelete(id: string): Promise<boolean>; // Actually remove from local DB
}
```

### 2.3. `IProjectRepository`

```typescript
import { Project } from './domain-entities';

interface IProjectRepository extends IBaseRepository<Project, string> {
  findByName(name: string): Promise<Project | null>;
  // Methods for sync
  getUnsyncedProjects(): Promise<Project[]>;
  updateSyncStatus(id: string, syncStatus: number): Promise<Project | null>;
  softDelete(id: string): Promise<Project | null>;
  getLocallyDeletedProjects(): Promise<Project[]>;
  hardDelete(id: string): Promise<boolean>;
}
```

### 2.4. `INoteRepository`

```typescript
import { Note, Notebook, Tag } from './domain-entities';

interface NoteFilters {
  notebookId?: string;
  tags?: string[]; // Array of tag IDs
  keywords?: string; // For full-text search
}

interface INoteRepository extends IBaseRepository<Note, string> {
  findByFilters(filters: NoteFilters): Promise<Note[]>;
  findByNotebookId(notebookId: string): Promise<Note[]>;
  searchNotes(query: string): Promise<Note[]>; // Full-text search on title and content
  addTagToNote(noteId: string, tagId: string): Promise<boolean>; 
  removeTagFromNote(noteId: string, tagId: string): Promise<boolean>;
  getTagsForNote(noteId: string): Promise<Tag[]>;
  // Methods for sync
  getUnsyncedNotes(): Promise<Note[]>;
  updateSyncStatus(id: string, syncStatus: number, lastSyncedAt?: Date, remoteVersionToken?: string): Promise<Note | null>;
  updateLocalVersion(id: string, localVersion: number): Promise<Note | null>;
  softDelete(id: string): Promise<Note | null>;
  getLocallyDeletedNotes(): Promise<Note[]>;
  hardDelete(id: string): Promise<boolean>;
}
```

### 2.5. `INotebookRepository`

```typescript
import { Notebook } from './domain-entities';

interface INotebookRepository extends IBaseRepository<Notebook, string> {
  findByName(name: string, parentId?: string): Promise<Notebook | null>;
  findByParentId(parentId: string | null): Promise<Notebook[]>; // null for root notebooks
  // Methods for sync
  getUnsyncedNotebooks(): Promise<Notebook[]>;
  updateSyncStatus(id: string, syncStatus: number): Promise<Notebook | null>;
  softDelete(id: string): Promise<Notebook | null>;
  getLocallyDeletedNotebooks(): Promise<Notebook[]>;
  hardDelete(id: string): Promise<boolean>;
}
```

### 2.6. `ITagRepository`

```typescript
import { Tag } from './domain-entities';

interface ITagRepository extends IBaseRepository<Tag, string> {
  findByName(name: string): Promise<Tag | null>;
  findOrCreate(name: string, color?: string): Promise<Tag>; // Finds by name or creates if not exists
  getUnsyncedTags(): Promise<Tag[]>;
  softDelete(id: string): Promise<Tag | null>;
  getLocallyDeletedTags(): Promise<Tag[]>;
  hardDelete(id: string): Promise<boolean>;
}
```

### 2.7. `INoteVersionRepository` (可选)

```typescript
import { NoteVersion } from './domain-entities';

interface INoteVersionRepository extends IBaseRepository<NoteVersion, string> {
  findByNoteId(noteId: string): Promise<NoteVersion[]>;
  getLatestVersion(noteId: string): Promise<NoteVersion | null>;
  revertToVersion(noteId: string, versionId: string): Promise<Note | null>; // Returns the updated Note
}
```

### 2.8. `ISyncMetadataRepository`

```typescript
import { SyncMetadata } from './domain-entities';

interface ISyncMetadataRepository {
  getSyncMetadata(serviceType: string, accountIdentifier?: string): Promise<SyncMetadata | null>;
  saveSyncMetadata(metadata: SyncMetadata): Promise<SyncMetadata>;
  deleteSyncMetadata(serviceType: string, accountIdentifier?: string): Promise<boolean>;
  getAllSyncMetadata(): Promise<SyncMetadata[]>;
}
```

## 3. 应用层 (Use Case / Service) 接口

Use Cases 编排 Repository 调用以完成具体业务操作。它们是表现层的主要入口。

### 3.1. 任务管理用例 (TaskUseCases)

```typescript
interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: number;
  dueDate?: Date;
  projectId?: string;
}

interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  priority?: number;
  dueDate?: Date;
  projectId?: string;
  isCompleted?: boolean;
}

class TaskUseCases {
  constructor(private taskRepo: ITaskRepository, private projectRepo: IProjectRepository) {}

  async createTask(input: CreateTaskInput): Promise<Task>;
  async getTaskById(id: string): Promise<Task | null>;
  async getAllTasks(filters?: TaskFilters): Promise<Task[]>;
  async updateTask(input: UpdateTaskInput): Promise<Task | null>;
  async deleteTask(id: string): Promise<boolean>;
  async toggleTaskCompletion(id: string): Promise<Task | null>;
  // ... other task related use cases like getTasksForProject, etc.
}
```

### 3.2. 笔记管理用例 (NoteUseCases)

```typescript
interface CreateNoteInput {
  title: string;
  content?: string;
  contentType?: 'plain' | 'markdown' | 'rich';
  notebookId?: string;
  tagNames?: string[]; // Names of tags to associate
}

interface UpdateNoteInput extends Partial<CreateNoteInput> {
  id: string;
}

class NoteUseCases {
  constructor(private noteRepo: INoteRepository, private notebookRepo: INotebookRepository, private tagRepo: ITagRepository) {}

  async createNote(input: CreateNoteInput): Promise<Note>;
  async getNoteById(id: string): Promise<Note | null>;
  async getAllNotes(filters?: NoteFilters): Promise<Note[]>;
  async updateNote(input: UpdateNoteInput): Promise<Note | null>;
  async deleteNote(id: string): Promise<boolean>;
  async addTagToNoteByName(noteId: string, tagName: string): Promise<boolean>;
  // ... other note related use cases
}
```

### 3.3. 数据同步用例 (SyncUseCases)

```typescript
class SyncUseCases {
  constructor(
    private syncEngine: ISyncEngine, // ISyncEngine orchestrates different adapters
    private syncMetadataRepo: ISyncMetadataRepository
  ) {}

  async triggerSync(serviceType: string, accountIdentifier?: string): Promise<void>;
  async getSyncStatus(serviceType: string, accountIdentifier?: string): Promise<SyncStatusInfo>;
  async registerSyncService(config: SyncServiceConfig): Promise<boolean>;
  async unregisterSyncService(serviceType: string, accountIdentifier?: string): Promise<boolean>;
  // ... conflict resolution use cases if manual intervention is needed
}
```

## 4. 数据同步适配器接口 (`ISyncAdapter`)

此接口定义了与特定云同步服务交互的契约。同步引擎将使用这些适配器的实现。

### 4.1. 核心接口定义

```typescript
interface AuthResult {
  success: boolean;
  credentials?: any; // Service-specific credentials (e.g., access token, refresh token)
  error?: string;
}

interface SyncResult {
  success: boolean;
  newChangesFetched: number;
  changesPushed: number;
  conflictsResolved?: number;
  error?: string;
  lastSyncToken?: string; // Token for next incremental sync
}

interface ISyncAdapter {
  readonly serviceType: string; // e.g., 'google_drive', 'dropbox', 'webdav'

  // Authenticate with the service. May involve opening a browser.
  authenticate(interactive: boolean): Promise<AuthResult>; 
  isAuthenticated(): Promise<boolean>;
  revokeAuth(): Promise<boolean>;

  // Fetch changes from the remote service since the last sync point.
  // `lastSyncToken` is a service-specific token indicating the last known state.
  fetchRemoteChanges(lastSyncToken?: string): Promise<{ changes: RemoteChange[], nextSyncToken?: string, error?: string }>;

  // Apply local changes (creations, updates, deletions) to the remote service.
  applyLocalChanges(changes: LocalChange[]): Promise<{ results: ApplyChangeResult[], error?: string }>;

  // (Optional) Resolve a specific conflict. Default might be 'last-write-wins' or manual.
  // resolveConflict?(localItem: any, remoteItem: any): Promise<ResolvedConflict>; 

  // Get user info from the service if available
  getUserInfo?(): Promise<{ userId: string, email?: string, name?: string } | null>;
}
```

### 4.2. 数据结构 (`LocalChange`, `RemoteChange`)

```typescript
// Represents a change made locally that needs to be sent to the server
interface LocalChange {
  entityType: 'task' | 'note' | 'project' | 'notebook' | 'tag';
  entityId: string;
  changeType: 'create' | 'update' | 'delete';
  data?: any; // Full entity for create, partial for update
  localVersion?: number;
}

// Represents a change fetched from the server
interface RemoteChange {
  entityType: 'task' | 'note' | 'project' | 'notebook' | 'tag';
  entityId: string; // Remote ID for the entity
  changeType: 'create' | 'update' | 'delete';
  data?: any; // Full entity data from remote
  remoteVersionToken?: string; // Version token from remote (e.g., ETag)
  modifiedAt?: Date; // Last modified timestamp from remote
}

interface ApplyChangeResult {
  entityId: string;
  success: boolean;
  error?: string;
  newRemoteVersionToken?: string; // If update/create was successful
}
```

### 4.3. 云服务API交互考量
*   **Google Drive:** Use Google APIs (Drive API v3). Store files in a dedicated app folder. Use `expo-auth-session` for OAuth2.
*   **Dropbox:** Use Dropbox API v2. Store files in a dedicated app folder. Use `expo-auth-session` for OAuth2.
*   **OneDrive:** Use Microsoft Graph API. Store files in a dedicated app folder. Use `expo-auth-session` for OAuth2.
*   **WebDAV:** Use a WebDAV client library (e.g., `rn-webdav`). Handle basic authentication or other methods as configured by user.
*   **iCloud:** Potentially use `expo-document-picker` and `expo-file-system` to interact with iCloud Drive documents if a direct API is not feasible or desired via Expo.

## 5. 导入/导出数据格式定义

### 5.1. JSON格式
Universal format for full backup/restore.

```json
{
  "version": "1.0",
  "exportedAt": "2025-01-27T10:00:00Z",
  "data": {
    "projects": [
      { "id": "uuid", "name": "Work", "color": "#RRGGBB", /* ... */ }
    ],
    "tasks": [
      { "id": "uuid", "title": "Task 1", "projectId": "uuid", /* ... */ }
    ],
    "notebooks": [
      { "id": "uuid", "name": "Personal Notes", "parentId": null, /* ... */ }
    ],
    "notes": [
      { "id": "uuid", "title": "My Idea", "content": "...", "notebookId": "uuid", /* ... */ }
    ],
    "tags": [
      { "id": "uuid", "name": "Urgent" }
    ],
    "note_tags": [
      { "note_id": "uuid", "tag_id": "uuid" }
    ]
    // No sync_metadata or note_versions typically in user export
  }
}
```

### 5.2. CSV格式 (任务)
For exporting tasks to spreadsheets.

**Columns:**
`ID`, `Title`, `Description`, `Priority (0-2)`, `Due Date (YYYY-MM-DD HH:MM)`, `Is Completed (true/false)`, `Completed At (YYYY-MM-DD HH:MM)`, `Project Name`, `Created At`, `Updated At`

### 5.3. iCalendar (`.ics`) 格式 (任务)
For exporting tasks to calendar applications.

**Key VEVENT properties:**
*   `UID`: Task ID
*   `SUMMARY`: Task Title
*   `DESCRIPTION`: Task Description
*   `DTSTART`: Due Date (if only date, make it all-day event)
*   `DTEND`: Due Date + duration (e.g., 1 hour) or same as DTSTART for all-day
*   `DUE`: Due Date
*   `COMPLETED`: Completed At (if completed)
*   `STATUS`: `NEEDS-ACTION` or `COMPLETED`
*   `PRIORITY`: Map 0-2 to iCalendar priority (0=low, 5=medium, 1=high)
*   `CATEGORIES`: Project Name

### 5.4. Markdown (笔记导出)
*   **Single file per note:** `<note_title>.md`
*   **Content:** Note content directly as Markdown.
*   **Metadata (optional):** YAML Front Matter at the beginning of the file.
    ```markdown
    ---
    title: My Idea
    created_at: 2025-01-20T14:30:00Z
    updated_at: 2025-01-21T10:15:00Z
    notebook: Personal Notes
    tags: [idea, quick]
    ---

    This is the actual note content in Markdown.
    ```

### 5.5. Evernote (`.enex`) 格式 (笔记导入)
This is an XML-based format. Parsing will involve an XML parser.

*   **Key elements to extract:**
    *   `<title>`: Note title
    *   `<content>`: Note content (HTML, needs sanitization and conversion to app's format, ideally Markdown)
    *   `<created>`: Creation date
    *   `<updated>`: Update date
    *   `<tag>`: Tags
    *   `<note-attributes><notebook-guid>` (if available) to map to notebooks.
*   Attachments (`<resource>`) need to be handled: extract data, save to file system, link to note.

--- 