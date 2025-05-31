import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 导入设计系统常量
import { COLORS } from '@/constants';
// 导入新架构相关
import { useNewApp } from '@/contexts/NewAppContext';
import { useNewNoteService } from '@/hooks/useNewNoteService';
import { NoteDTO } from '../../lib/models/types';
// 导入清理Hook
import { useResourceCleanup } from '@/hooks/useCleanup';
// 导入数据同步相关
import { useTaskDataSync } from '@/contexts/DataSyncContext';

// 优化的笔记卡片组件
const NoteCard = React.memo<{
  note: NoteDTO;
  viewMode: 'grid' | 'list';
  onPress: (id: string) => void;
  onLongPress?: (id: string) => void;
}>(({ note, viewMode, onPress, onLongPress }) => {
  const handlePress = useCallback(() => {
    onPress(note.id);
  }, [note.id, onPress]);

  const handleLongPress = useCallback(() => {
    onLongPress?.(note.id);
  }, [note.id, onLongPress]);

  const cardStyle = useMemo(() => 
    viewMode === 'grid' 
      ? [styles.noteCardGrid, { backgroundColor: note.color || COLORS.noteBlue }]
      : styles.noteCardList,
    [viewMode, note.color]
  );

  const formattedDate = useMemo(() => {
    const date = new Date(note.updated_at);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }, [note.updated_at]);

  if (viewMode === 'grid') {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={handlePress}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
      >
        <View style={styles.noteHeader}>
          {note.is_pinned && (
            <MaterialCommunityIcons name="pin" size={16} color={COLORS.gray600} />
          )}
        </View>
        <Text style={styles.noteTitle} numberOfLines={2}>
          {note.title}
        </Text>
        <Text style={styles.noteContent} numberOfLines={4}>
          {note.content || ''}
        </Text>
        <View style={styles.noteFooter}>
          <Text style={styles.noteDate}>{formattedDate}</Text>
          {note.category && (
            <View style={styles.noteCategory}>
              <Text style={styles.noteCategoryText}>{note.category}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={cardStyle}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      <View style={[styles.noteColorIndicator, { backgroundColor: note.color || COLORS.noteBlue }]} />
      <View style={styles.noteListContent}>
        <View style={styles.noteHeader}>
          <Text style={styles.noteTitleList} numberOfLines={1}>
            {note.title}
          </Text>
          {note.is_pinned && (
            <MaterialCommunityIcons name="pin" size={16} color={COLORS.gray500} />
          )}
        </View>
        <Text style={styles.noteContentList} numberOfLines={2}>
          {note.content || ''}
        </Text>
        <View style={styles.noteMetaList}>
          <Text style={styles.noteDateList}>{formattedDate}</Text>
          {note.category && (
            <>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.noteCategoryList}>{note.category}</Text>
            </>
          )}
          {note.tags.length > 0 && (
            <>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.noteCategoryList}>{note.tags.slice(0, 2).join(', ')}</Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

// 优化的分类选项卡组件
const CategoryChip = React.memo<{
  category: string;
  isSelected: boolean;
  onPress: (category: string) => void;
}>(({ category, isSelected, onPress }) => {
  const handlePress = useCallback(() => {
    onPress(category);
  }, [category, onPress]);

  const chipStyle = useMemo(() => [
    styles.categoryChip,
    isSelected && styles.activeCategoryChip
  ], [isSelected]);

  const textStyle = useMemo(() => [
    styles.categoryText,
    isSelected && styles.activeCategoryText
  ], [isSelected]);

  return (
    <TouchableOpacity
      style={chipStyle}
      onPress={handlePress}
    >
      <Text style={textStyle}>
        {category}
      </Text>
    </TouchableOpacity>
  );
});

// 空状态组件
const EmptyState = React.memo<{ searchText?: string }>(({ searchText }) => (
  <View style={styles.emptyState}>
    <MaterialCommunityIcons 
      name={searchText ? "magnify" : "note-outline"} 
      size={64} 
      color={COLORS.gray300} 
    />
    <Text style={styles.emptyText}>
      {searchText ? '未找到相关笔记' : '暂无笔记'}
    </Text>
    <Text style={styles.emptySubtext}>
      {searchText ? '尝试其他关键词搜索' : '点击右下角按钮创建第一篇笔记'}
    </Text>
  </View>
));

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  
  // 新架构相关状态
  const { isInitialized: newArchInitialized, initError, isLoading: newArchLoading } = useNewApp();
  const newNoteService = useNewNoteService();
  
  // 数据同步Hook
  const { isTasksDataDirty, clearTasksDataDirty } = useTaskDataSync();
  
  // 组件状态
  const [notes, setNotes] = useState<NoteDTO[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<NoteDTO[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<string[]>(['全部']);
  
  // 定时器引用
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // 使用内存清理Hook
  useResourceCleanup({
    timers: [searchTimer, debounceTimer],
  });

  // 加载笔记数据
  const loadNotes = useCallback(async (forceRefresh = false) => {
    try {
      console.log(`[NotesList] 开始加载笔记数据, forceRefresh: ${forceRefresh}`);
      setLoading(true);
      
      if (!newArchInitialized) {
        console.log('⚠️ 新架构未初始化，等待初始化完成');
        return;
      }

      console.log('🚀 使用新架构加载笔记数据');
      const notesList = await newNoteService.getAllNotes();
      console.log(`[NotesList] 新架构笔记加载完成，数量: ${notesList.length}`);
      
      setNotes(notesList);
      
      // 提取分类信息
      const uniqueCategories = ['全部', ...new Set(
        notesList
          .filter(note => note.category && note.category.trim())
          .map(note => note.category!)
      )];
      setCategories(uniqueCategories);
      
    } catch (error) {
      console.error('[NotesList] 加载笔记失败:', error);
      Alert.alert('错误', '加载笔记数据失败，请重试');
      setNotes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [newArchInitialized, newNoteService]);

  // 筛选和搜索笔记
  const filterNotes = useCallback(() => {
    let filtered = notes;
    
    // 分类筛选
    if (selectedCategory !== '全部') {
      filtered = filtered.filter(note => note.category === selectedCategory);
    }
    
    // 搜索筛选
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(searchLower) ||
        (note.content && note.content.toLowerCase().includes(searchLower)) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // 排序：置顶在前，然后按更新时间倒序
    filtered.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    
    setFilteredNotes(filtered);
  }, [notes, selectedCategory, searchText]);

  // 组件挂载时加载数据
  useEffect(() => {
    if (newArchInitialized) {
      loadNotes();
    }
  }, [newArchInitialized, loadNotes]);

  // 当筛选条件变化时，重新筛选
  useEffect(() => {
    filterNotes();
  }, [filterNotes]);

  // 页面焦点时重新加载数据
  useFocusEffect(
    useCallback(() => {
      console.log('[NotesScreen] Focus effect triggered');
      if (newArchInitialized) {
        loadNotes(true);
      }
    }, [newArchInitialized, loadNotes])
  );

  // 使用useCallback优化事件处理器
  const handleNotePress = useCallback((id: string) => {
    router.push(`/note/${id}`);
  }, []);

  const handleNoteLongPress = useCallback((id: string) => {
    Alert.alert(
      '笔记操作',
      '选择要执行的操作',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '编辑', 
          onPress: () => router.push(`/note/${id}`) 
        },
        { 
          text: '删除', 
          style: 'destructive',
          onPress: () => handleDeleteNote(id)
        },
      ]
    );
  }, []);

  const handleDeleteNote = useCallback(async (id: string) => {
    Alert.alert(
      '确认删除',
      '确定要删除这篇笔记吗？此操作无法撤销。',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '删除', 
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await newNoteService.deleteNote(id);
              if (success) {
                Alert.alert('成功', '笔记已删除');
                await loadNotes(true);
              }
            } catch (error) {
              console.error('删除笔记失败:', error);
            }
          }
        },
      ]
    );
  }, [newNoteService, loadNotes]);

  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const handleSearchTextChange = useCallback((text: string) => {
    setSearchText(text);
    
    // 清除之前的定时器
    if (searchTimer) {
      clearTimeout(searchTimer);
    }
    
    // 设置新的防抖定时器
    const newTimer = setTimeout(() => {
      console.log('Search executed:', text);
    }, 300);
    
    setSearchTimer(newTimer);
  }, [searchTimer]);

  const handleViewModeToggle = useCallback(() => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchText('');
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotes(true);
  }, [loadNotes]);

  // 渲染笔记网格容器样式
  const contentContainerStyle = useMemo(() => 
    viewMode === 'grid' ? styles.gridContainer : styles.listContainer,
    [viewMode]
  );

  // 加载状态
  if (newArchLoading || (loading && !newArchInitialized)) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>初始化笔记模块...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 初始化错误状态
  if (initError) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color={COLORS.danger} />
          <Text style={styles.errorText}>初始化失败</Text>
          <Text style={styles.errorSubtext}>{initError}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => loadNotes(true)}
          >
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>加载笔记中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* 顶部栏 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>笔记</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleViewModeToggle}>
            <MaterialCommunityIcons 
              name={viewMode === 'grid' ? 'view-list' : 'view-grid'} 
              size={24} 
              color={COLORS.gray500} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/search')} style={styles.headerAction}>
            <MaterialCommunityIcons name="magnify" size={24} color={COLORS.gray500} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRefresh} disabled={refreshing} style={styles.headerAction}>
            <MaterialCommunityIcons 
              name="refresh" 
              size={24} 
              color={refreshing ? COLORS.primary : COLORS.gray500} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.gray500} />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索笔记..."
            value={searchText}
            onChangeText={handleSearchTextChange}
            placeholderTextColor={COLORS.gray500}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <MaterialCommunityIcons name="close" size={20} color={COLORS.gray500} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 分类选项卡 */}
      <View style={styles.categoryContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryContent}
          style={styles.categoryScrollView}
        >
          {categories.map(category => (
            <CategoryChip
              key={category}
              category={category}
              isSelected={selectedCategory === category}
              onPress={handleCategorySelect}
            />
          ))}
        </ScrollView>
      </View>

      {/* 笔记列表容器 */}
      <View style={styles.notesContainer}> 
        <ScrollView 
          style={styles.notesScrollView}
          contentContainerStyle={contentContainerStyle}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          {filteredNotes.length > 0 ? (
            filteredNotes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                viewMode={viewMode}
                onPress={handleNotePress}
                onLongPress={handleNoteLongPress}
              />
            ))
          ) : (
            <EmptyState searchText={searchText} />
          )}
        </ScrollView>
      </View>

      {/* 浮动操作按钮 */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 80 }]}
        onPress={() => router.push('/note/create')}
      >
        <MaterialCommunityIcons name="plus" size={24} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgColor,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textColor,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAction: {
    marginLeft: 16,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.textColor,
  },
  categoryContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    paddingVertical: 10,
  },
  categoryScrollView: {
    flexGrow: 0,
  },
  categoryContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  categoryChip: {
    backgroundColor: COLORS.gray100,
    borderRadius: 14,
    paddingHorizontal: 12, 
    paddingVertical: 6,
    marginRight: 8,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  activeCategoryChip: {
    backgroundColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  categoryText: {
    fontSize: 14,
    color: COLORS.gray500,
    fontWeight: '500',
  },
  activeCategoryText: {
    color: COLORS.white,
  },
  notesContainer: {
    flex: 1,
  },
  notesScrollView: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 100,
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 100,
  },
  noteCardGrid: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  noteCardList: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteColorIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
  },
  noteListContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textColor,
    marginBottom: 8,
    lineHeight: 22,
  },
  noteTitleList: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textColor,
    flex: 1,
    marginRight: 8,
  },
  noteContent: {
    fontSize: 14,
    color: COLORS.gray700,
    lineHeight: 20,
    marginBottom: 12,
  },
  noteContentList: {
    fontSize: 14,
    color: COLORS.gray700,
    lineHeight: 20,
    marginBottom: 8,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteMetaList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteDate: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  noteDateList: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  separator: {
    fontSize: 12,
    color: COLORS.gray500,
    marginHorizontal: 4,
  },
  noteCategory: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  noteCategoryText: {
    fontSize: 10,
    color: COLORS.gray700,
    fontWeight: '500',
  },
  noteCategoryList: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    minHeight: 200,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.gray500,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray500,
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray500,
    marginTop: 12,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.danger,
    marginTop: 16,
  },
  errorSubtext: {
    fontSize: 14,
    color: COLORS.gray500,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
});