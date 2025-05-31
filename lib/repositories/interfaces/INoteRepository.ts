import { ContentType, Note, Tag } from '../../models/types';
import { IBaseRepository, QueryOptions } from './IBaseRepository';

export interface NoteFilters {
  notebookId?: string;
  contentType?: ContentType;
  isDraft?: boolean;
  tagIds?: string[];
  searchQuery?: string;
  category?: string;
  isPinned?: boolean;
  isArchived?: boolean;
}

export interface NoteQueryOptions extends QueryOptions {
  filters?: NoteFilters;
}

export interface CreateNoteData {
  title: string;
  content?: string;
  content_type?: ContentType;
  is_draft?: number;
  notebook_id?: string;
  category?: string;
  tags?: string[];
  color?: string;
  is_pinned?: boolean;
  is_archived?: boolean;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  content_type?: ContentType;
  is_draft?: number;
  notebook_id?: string;
  category?: string;
  tags?: string[];
  color?: string;
  is_pinned?: boolean;
  is_archived?: boolean;
}

export interface INoteRepository extends IBaseRepository<Note, CreateNoteData> {
  findByNotebook(notebookId: string): Promise<Note[]>;
  findByContentType(contentType: ContentType): Promise<Note[]>;
  findDrafts(): Promise<Note[]>;
  findByTag(tagId: string): Promise<Note[]>;
  findByTags(tagIds: string[]): Promise<Note[]>;
  search(query: string, options?: NoteQueryOptions): Promise<Note[]>;
  findRecent(limit?: number): Promise<Note[]>;
  addTag(noteId: string, tagId: string): Promise<boolean>;
  removeTag(noteId: string, tagId: string): Promise<boolean>;
  getTags(noteId: string): Promise<Tag[]>;
  getStatsByNotebook(): Promise<Array<{ notebookId: string; count: number }>>;
  getStatsByContentType(): Promise<Array<{ contentType: ContentType; count: number }>>;
  findByCategory(category: string): Promise<Note[]>;
  searchByContent(query: string): Promise<Note[]>;
  findPinned(): Promise<Note[]>;
  findArchived(): Promise<Note[]>;
  findByTagName(tagName: string): Promise<Note[]>;
} 