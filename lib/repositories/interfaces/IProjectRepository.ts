import { Project } from '../../models/types';
import { IBaseRepository, QueryOptions } from './IBaseRepository';

export interface ProjectFilters {
  isShared?: boolean;
  searchQuery?: string;
}

export interface ProjectQueryOptions extends QueryOptions {
  filters?: ProjectFilters;
}

export interface CreateProjectData {
  name: string;
  color?: string;
  icon?: string;
  sort_order: number;
  is_shared: number;
  share_config?: string;
}

export interface UpdateProjectData {
  name?: string;
  color?: string;
  icon?: string;
  sort_order?: number;
  is_shared?: number;
  share_config?: string;
}

export interface IProjectRepository extends IBaseRepository<Project, CreateProjectData> {
  findShared(): Promise<Project[]>;
  findByName(name: string): Promise<Project[]>;
  search(query: string): Promise<Project[]>;
  getTaskCount(projectId: string): Promise<number>;
  reorder(orderedIds: string[]): Promise<boolean>;
} 