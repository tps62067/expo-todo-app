import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 导入设计系统常量
import { COLORS } from '@/constants';
// 导入新架构相关
import { useNewApp } from '@/contexts/NewAppContext';
import { useNewNoteService } from '@/hooks/useNewNoteService';
import { NoteDTO, UpdateNoteForm } from '../../lib/models/types';

const categories = [
  { key: 'work', label: '工作', icon: 'briefcase-outline' },
  { key: 'study', label: '学习', icon: 'book-outline' },
  { key: 'life', label: '生活', icon: 'home-outline' },
  { key: 'design', label: '设计', icon: 'palette-outline' },
  { key: 'idea', label: '想法', icon: 'lightbulb-outline' },
  { key: 'other', label: '其他', icon: 'dots-horizontal' },
];

const noteColors = [
  COLORS.notePink,    // 浅粉色
  COLORS.noteBlue,    // 浅蓝色
  COLORS.notePurple,  // 浅紫色
  COLORS.noteGreen,   // 浅绿色
  COLORS.noteOrange,  // 浅橙色
  COLORS.noteGray,    // 浅灰色
  COLORS.noteSkyBlue, // 天蓝色
  COLORS.noteRose,    // 玫瑰色
];

export default function NoteDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isInitialized } = useNewApp();
  const newNoteService = useNewNoteService();

  // 组件状态
  const [note, setNote] = useState<NoteDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // 编辑表单状态
  const [editForm, setEditForm] = useState<UpdateNoteForm>({
    title: '',
    content: '',
    category: '',
    color: '',
    tags: [],
    is_pinned: false,
    is_archived: false,
  });
  const [newTag, setNewTag] = useState('');

  // 加载笔记数据
  const loadNote = useCallback(async () => {
    if (!id || !isInitialized) return;
    
    try {
      setLoading(true);
      console.log('[NoteDetail] 加载笔记:', id);
      
      const noteData = await newNoteService.getNoteById(id);
      if (noteData) {
        setNote(noteData);
        // 初始化编辑表单
        setEditForm({
          title: noteData.title,
          content: noteData.content || '',
          category: noteData.category || '',
          color: noteData.color || COLORS.noteBlue,
          tags: [...noteData.tags],
          is_pinned: noteData.is_pinned,
          is_archived: noteData.is_archived,
        });
      } else {
        Alert.alert('错误', '笔记不存在', [
          { text: '确定', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('[NoteDetail] 加载笔记失败:', error);
      Alert.alert('错误', '加载笔记失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [id, isInitialized, newNoteService]);

  // 初始加载
  useEffect(() => {
    loadNote();
  }, [loadNote]);

  // 更新表单字段
  const updateForm = useCallback((field: keyof UpdateNoteForm, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // 添加标签
  const addTag = useCallback(() => {
    if (newTag.trim() && !editForm.tags?.includes(newTag.trim())) {
      updateForm('tags', [...(editForm.tags || []), newTag.trim()]);
      setNewTag('');
    }
  }, [newTag, editForm.tags, updateForm]);

  // 移除标签
  const removeTag = useCallback((tagToRemove: string) => {
    updateForm('tags', editForm.tags?.filter(tag => tag !== tagToRemove) || []);
  }, [editForm.tags, updateForm]);

  // 保存笔记
  const handleSave = useCallback(async () => {
    if (!note?.id || !editForm.title.trim()) {
      Alert.alert('提示', '请输入笔记标题');
      return;
    }

    try {
      setSaving(true);
      console.log('[NoteDetail] 保存笔记:', note.id, editForm);
      
      const updatedNote = await newNoteService.updateNote(note.id, editForm);
      if (updatedNote) {
        setNote(updatedNote);
        setIsEditing(false);
        Alert.alert('成功', '笔记已保存');
      }
    } catch (error) {
      console.error('[NoteDetail] 保存笔记失败:', error);
      Alert.alert('错误', '保存笔记失败，请重试');
    } finally {
      setSaving(false);
    }
  }, [note?.id, editForm, newNoteService]);

  // 删除笔记
  const handleDelete = useCallback(async () => {
    if (!note?.id) return;

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
              const success = await newNoteService.deleteNote(note.id);
              if (success) {
                Alert.alert('成功', '笔记已删除', [
                  { text: '确定', onPress: () => router.back() }
                ]);
              }
            } catch (error) {
              console.error('[NoteDetail] 删除笔记失败:', error);
              Alert.alert('错误', '删除笔记失败，请重试');
            }
          }
        },
      ]
    );
  }, [note?.id, newNoteService]);

  // 切换置顶状态
  const handleTogglePin = useCallback(async () => {
    if (!note?.id) return;

    try {
      const updatedNote = await newNoteService.togglePin(note.id);
      if (updatedNote) {
        setNote(updatedNote);
        setEditForm(prev => ({ ...prev, is_pinned: updatedNote.is_pinned }));
      }
    } catch (error) {
      console.error('[NoteDetail] 切换置顶状态失败:', error);
    }
  }, [note?.id, newNoteService]);

  // 取消编辑
  const handleCancelEdit = useCallback(() => {
    if (!note) return;
    
    // 恢复原始数据
    setEditForm({
      title: note.title,
      content: note.content || '',
      category: note.category || '',
      color: note.color || COLORS.noteBlue,
      tags: [...note.tags],
      is_pinned: note.is_pinned,
      is_archived: note.is_archived,
    });
    setIsEditing(false);
  }, [note]);

  const formatDate = useCallback((dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

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

  if (!note) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons name="note-off" size={64} color={COLORS.gray300} />
          <Text style={styles.emptyText}>笔记不存在</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>返回</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textColor} />
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleTogglePin}>
            <MaterialCommunityIcons 
              name={note.is_pinned ? "pin" : "pin-outline"} 
              size={24} 
              color={note.is_pinned ? COLORS.primary : COLORS.gray500} 
            />
          </TouchableOpacity>
          
          {isEditing ? (
            <View style={styles.editActions}>
              <TouchableOpacity 
                onPress={handleCancelEdit}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSave}
                style={styles.saveButton}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.saveButtonText}>保存</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.viewActions}>
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <MaterialCommunityIcons name="pencil" size={24} color={COLORS.gray500} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.deleteAction}>
                <MaterialCommunityIcons name="delete" size={24} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isEditing ? (
          <>
            {/* 编辑模式 */}
            {/* 笔记标题 */}
            <View style={[styles.section, { backgroundColor: editForm.color }]}>
              <TextInput
                style={styles.titleInput}
                placeholder="输入笔记标题..."
                value={editForm.title}
                onChangeText={(text) => updateForm('title', text)}
                placeholderTextColor={COLORS.gray500}
                multiline
              />
            </View>

            {/* 笔记内容 */}
            <View style={styles.section}>
              <TextInput
                style={styles.contentInput}
                placeholder="编辑笔记内容..."
                value={editForm.content}
                onChangeText={(text) => updateForm('content', text)}
                placeholderTextColor={COLORS.gray500}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* 分类选择 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>分类</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryContainer}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.key}
                      style={[
                        styles.categoryItem,
                        editForm.category === category.key && styles.selectedCategoryItem
                      ]}
                      onPress={() => updateForm('category', category.key)}
                    >
                      <MaterialCommunityIcons
                        name={category.icon as any}
                        size={20}
                        color={editForm.category === category.key ? COLORS.white : COLORS.primary}
                      />
                      <Text style={[
                        styles.categoryText,
                        editForm.category === category.key && styles.selectedCategoryText
                      ]}>
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* 颜色选择 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>背景颜色</Text>
              <View style={styles.colorContainer}>
                {noteColors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorItem,
                      { backgroundColor: color },
                      editForm.color === color && styles.selectedColorItem
                    ]}
                    onPress={() => updateForm('color', color)}
                  >
                    {editForm.color === color && (
                      <MaterialCommunityIcons name="check" size={16} color={COLORS.gray700} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 标签管理 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>标签</Text>
              
              {/* 标签输入 */}
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  placeholder="添加标签"
                  value={newTag}
                  onChangeText={setNewTag}
                  placeholderTextColor={COLORS.gray500}
                  onSubmitEditing={addTag}
                />
                <TouchableOpacity onPress={addTag} style={styles.addTagButton}>
                  <MaterialCommunityIcons name="plus" size={20} color={COLORS.white} />
                </TouchableOpacity>
              </View>
              
              {/* 标签列表 */}
              <View style={styles.tagContainer}>
                {editForm.tags?.map((tag) => (
                  <View key={tag} style={styles.tagItem}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <TouchableOpacity onPress={() => removeTag(tag)}>
                      <MaterialCommunityIcons name="close" size={16} color={COLORS.gray500} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : (
          <>
            {/* 查看模式 */}
            {/* 笔记标题区域 */}
            <View style={[styles.viewSection, { backgroundColor: note.color || COLORS.noteBlue }]}>
              <Text style={styles.viewTitle}>{note.title}</Text>
              <View style={styles.noteMeta}>
                <Text style={styles.metaText}>
                  创建于 {formatDate(note.created_at)}
                </Text>
                {note.updated_at !== note.created_at && (
                  <Text style={styles.metaText}>
                    更新于 {formatDate(note.updated_at)}
                  </Text>
                )}
              </View>
            </View>

            {/* 笔记内容 */}
            {note.content && (
              <View style={styles.viewSection}>
                <Text style={styles.viewContent}>{note.content}</Text>
              </View>
            )}

            {/* 分类信息 */}
            {note.category && (
              <View style={styles.viewSection}>
                <Text style={styles.sectionTitle}>分类</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{note.category}</Text>
                </View>
              </View>
            )}

            {/* 标签信息 */}
            {note.tags.length > 0 && (
              <View style={styles.viewSection}>
                <Text style={styles.sectionTitle}>标签</Text>
                <View style={styles.tagContainer}>
                  {note.tags.map((tag) => (
                    <View key={tag} style={styles.viewTagItem}>
                      <Text style={styles.viewTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
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
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  viewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  deleteAction: {
    marginLeft: 16,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.gray200,
    borderRadius: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    color: COLORS.gray600,
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  viewSection: {
    margin: 16,
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textColor,
    marginBottom: 12,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.textColor,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  contentInput: {
    fontSize: 16,
    color: COLORS.textColor,
    minHeight: 200,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  viewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textColor,
    marginBottom: 12,
    lineHeight: 32,
  },
  viewContent: {
    fontSize: 16,
    color: COLORS.textColor,
    lineHeight: 24,
  },
  noteMeta: {
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.gray600,
    marginBottom: 2,
  },
  categoryContainer: {
    flexDirection: 'row',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    marginRight: 8,
  },
  selectedCategoryItem: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 4,
  },
  selectedCategoryText: {
    color: COLORS.white,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  colorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  colorItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorItem: {
    borderColor: COLORS.gray700,
  },
  tagInputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.textColor,
  },
  addTagButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.gray600,
    marginRight: 4,
  },
  viewTagItem: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  viewTagText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
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
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.gray500,
    marginTop: 16,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '500',
  },
}); 