import { useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { newAppService } from '../../lib';
import { CreateNoteForm, NoteDTO, UpdateNoteForm } from '../../lib/models/types';
import { useNewApp } from '../contexts/NewAppContext';

export function useNewNoteService() {
  const { isInitialized } = useNewApp();

  const ensureInitialized = useCallback(() => {
    if (!isInitialized) {
      throw new Error('新架构应用未初始化');
    }
  }, [isInitialized]);

  const createNote = useCallback(async (formData: CreateNoteForm): Promise<NoteDTO | null> => {
    try {
      ensureInitialized();
      return await newAppService.notes.createNote(formData);
    } catch (error) {
      console.error('创建笔记失败:', error);
      Alert.alert('错误', '创建笔记失败，请重试');
      return null;
    }
  }, [ensureInitialized]);

  const updateNote = useCallback(async (id: string, formData: UpdateNoteForm): Promise<NoteDTO | null> => {
    try {
      ensureInitialized();
      return await newAppService.notes.updateNote(id, formData);
    } catch (error) {
      console.error('更新笔记失败:', error);
      Alert.alert('错误', '更新笔记失败，请重试');
      return null;
    }
  }, [ensureInitialized]);

  const deleteNote = useCallback(async (id: string): Promise<boolean> => {
    try {
      ensureInitialized();
      return await newAppService.notes.deleteNote(id);
    } catch (error) {
      console.error('删除笔记失败:', error);
      Alert.alert('错误', '删除笔记失败，请重试');
      return false;
    }
  }, [ensureInitialized]);

  const getNoteById = useCallback(async (id: string): Promise<NoteDTO | null> => {
    try {
      ensureInitialized();
      return await newAppService.notes.getNoteById(id);
    } catch (error) {
      console.error('获取笔记失败:', error);
      return null;
    }
  }, [ensureInitialized]);

  const getAllNotes = useCallback(async (): Promise<NoteDTO[]> => {
    try {
      ensureInitialized();
      return await newAppService.notes.getAllNotes();
    } catch (error) {
      console.error('获取所有笔记失败:', error);
      return [];
    }
  }, [ensureInitialized]);

  const getNotesByCategory = useCallback(async (category: string): Promise<NoteDTO[]> => {
    try {
      ensureInitialized();
      return await newAppService.notes.getNotesByCategory(category);
    } catch (error) {
      console.error('按分类获取笔记失败:', error);
      return [];
    }
  }, [ensureInitialized]);

  const searchNotes = useCallback(async (query: string): Promise<NoteDTO[]> => {
    try {
      ensureInitialized();
      return await newAppService.notes.searchNotes(query);
    } catch (error) {
      console.error('搜索笔记失败:', error);
      return [];
    }
  }, [ensureInitialized]);

  const getNotesByTag = useCallback(async (tag: string): Promise<NoteDTO[]> => {
    try {
      ensureInitialized();
      return await newAppService.notes.getNotesByTag(tag);
    } catch (error) {
      console.error('按标签获取笔记失败:', error);
      return [];
    }
  }, [ensureInitialized]);

  const togglePin = useCallback(async (id: string): Promise<NoteDTO | null> => {
    try {
      ensureInitialized();
      return await newAppService.notes.togglePin(id);
    } catch (error) {
      console.error('切换置顶状态失败:', error);
      Alert.alert('错误', '切换置顶状态失败，请重试');
      return null;
    }
  }, [ensureInitialized]);

  const toggleArchive = useCallback(async (id: string): Promise<NoteDTO | null> => {
    try {
      ensureInitialized();
      return await newAppService.notes.toggleArchive(id);
    } catch (error) {
      console.error('切换归档状态失败:', error);
      Alert.alert('错误', '切换归档状态失败，请重试');
      return null;
    }
  }, [ensureInitialized]);

  // 使用useMemo缓存返回的对象，避免每次渲染都创建新的引用
  return useMemo(() => ({
    createNote,
    updateNote,
    deleteNote,
    getNoteById,
    getAllNotes,
    getNotesByCategory,
    searchNotes,
    getNotesByTag,
    togglePin,
    toggleArchive,
    isInitialized,
  }), [
    createNote,
    updateNote,
    deleteNote,
    getNoteById,
    getAllNotes,
    getNotesByCategory,
    searchNotes,
    getNotesByTag,
    togglePin,
    toggleArchive,
    isInitialized,
  ]);
} 