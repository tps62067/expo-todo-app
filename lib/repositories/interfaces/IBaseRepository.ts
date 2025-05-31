export interface QueryOptions {
  page?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface IBaseRepository<T, TCreate = Omit<T, 'id' | 'created_at' | 'updated_at'>> {
  findById(id: string): Promise<T | null>;
  findAll(options?: QueryOptions): Promise<T[]>;
  create(data: TCreate): Promise<T>;
  update(id: string, data: Partial<TCreate>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
  count(filters?: Record<string, any>): Promise<number>;
} 