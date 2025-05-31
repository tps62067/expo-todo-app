import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
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
import { CreateNoteForm } from '../../lib/models/types';

interface NoteFormData {
  title: string;
  content: string;
  category: string;
  color: string;
  tags: string[];
}

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

const formatTools = [
  { key: 'bold', icon: 'format-bold', label: '粗体' },
  { key: 'italic', icon: 'format-italic', label: '斜体' },
  { key: 'underline', icon: 'format-underline', label: '下划线' },
  { key: 'list', icon: 'format-list-bulleted', label: '列表' },
  { key: 'quote', icon: 'format-quote-close', label: '引用' },
  { key: 'link', icon: 'link', label: '链接' },
];

export default function CreateNoteScreen() {
  const insets = useSafeAreaInsets();
  const { isInitialized } = useNewApp();
  const newNoteService = useNewNoteService();
  
  const [form, setForm] = useState<NoteFormData>({
    title: '',
    content: '',
    category: 'work',
    color: noteColors[0],
    tags: [],
  });
  const [newTag, setNewTag] = useState('');
  const [showFormatBar, setShowFormatBar] = useState(false);
  const [saving, setSaving] = useState(false);

  const updateForm = (field: keyof NoteFormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim())) {
      updateForm('tags', [...form.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateForm('tags', form.tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert('提示', '请输入笔记标题');
      return;
    }

    if (!form.content.trim()) {
      Alert.alert('提示', '请输入笔记内容');
      return;
    }

    if (!isInitialized) {
      Alert.alert('错误', '应用未初始化，请稍后重试');
      return;
    }

    try {
      setSaving(true);
      console.log('[CreateNote] 创建笔记:', form);

      // 构建创建笔记的表单数据
      const createForm: CreateNoteForm = {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        color: form.color,
        tags: form.tags,
        is_pinned: false,
        is_archived: false,
      };

      const createdNote = await newNoteService.createNote(createForm);
      
      if (createdNote) {
        console.log('[CreateNote] 笔记创建成功:', createdNote.id);
        Alert.alert('成功', '笔记创建成功', [
          { 
            text: '确定', 
            onPress: () => {
              // 返回到笔记列表页面
              router.back();
            }
          }
        ]);
      } else {
        Alert.alert('错误', '创建笔记失败，请重试');
      }
    } catch (error) {
      console.error('[CreateNote] 创建笔记失败:', error);
      Alert.alert('错误', '创建笔记失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const insertFormat = (format: string) => {
    // 这里可以实现富文本格式化功能
    console.log('插入格式:', format);
    setShowFormatBar(false);
  };

  if (!isInitialized) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>初始化中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={24} color={COLORS.textColor} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>新建笔记</Text>
        
        <TouchableOpacity 
          onPress={handleSave}
          style={styles.saveButton}
          disabled={saving || !form.title.trim()}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Text style={[
              styles.saveButtonText,
              (!form.title.trim()) && styles.saveButtonTextDisabled
            ]}>保存</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 格式工具栏 */}
      {showFormatBar && (
        <View style={styles.formatBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.formatTools}>
              {formatTools.map((tool) => (
                <TouchableOpacity
                  key={tool.key}
                  style={styles.formatTool}
                  onPress={() => insertFormat(tool.key)}
                >
                  <MaterialCommunityIcons
                    name={tool.icon as any}
                    size={20}
                    color={COLORS.gray600}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity
            onPress={() => setShowFormatBar(false)}
            style={styles.closeFormatBar}
          >
            <MaterialCommunityIcons name="close" size={20} color={COLORS.gray500} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 笔记标题 */}
        <View style={[styles.section, { backgroundColor: form.color }]}>
          <TextInput
            style={styles.titleInput}
            placeholder="输入笔记标题..."
            value={form.title}
            onChangeText={(text) => updateForm('title', text)}
            placeholderTextColor={COLORS.gray500}
            multiline
          />
        </View>

        {/* 笔记内容 */}
        <View style={styles.section}>
          <View style={styles.contentHeader}>
            <TouchableOpacity
              onPress={() => setShowFormatBar(!showFormatBar)}
              style={styles.formatButton}
            >
              <MaterialCommunityIcons 
                name="format-text" 
                size={20} 
                color={showFormatBar ? COLORS.primary : COLORS.gray500} 
              />
              <Text style={[
                styles.formatButtonText,
                showFormatBar && styles.formatButtonTextActive
              ]}>格式</Text>
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.contentInput}
            placeholder="开始写下你的想法..."
            value={form.content}
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
                    form.category === category.key && styles.selectedCategoryItem
                  ]}
                  onPress={() => updateForm('category', category.key)}
                >
                  <MaterialCommunityIcons
                    name={category.icon as any}
                    size={20}
                    color={form.category === category.key ? COLORS.white : COLORS.primary}
                  />
                  <Text style={[
                    styles.categoryText,
                    form.category === category.key && styles.selectedCategoryText
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
                  form.color === color && styles.selectedColorItem
                ]}
                onPress={() => updateForm('color', color)}
              >
                {form.color === color && (
                  <MaterialCommunityIcons name="check" size={16} color={COLORS.gray700} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 标签 */}
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
            {form.tags.map((tag) => (
              <View key={tag} style={styles.tagItem}>
                <Text style={styles.tagText}>{tag}</Text>
                <TouchableOpacity onPress={() => removeTag(tag)}>
                  <MaterialCommunityIcons name="close" size={16} color={COLORS.gray500} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textColor,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  saveButtonTextDisabled: {
    color: COLORS.gray400,
  },
  formatBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  formatTools: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formatTool: {
    padding: 8,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: COLORS.gray50,
  },
  closeFormatBar: {
    padding: 8,
    marginLeft: 'auto',
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
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  formatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
  },
  formatButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: COLORS.gray500,
  },
  formatButtonTextActive: {
    color: COLORS.primary,
  },
  contentInput: {
    fontSize: 16,
    color: COLORS.textColor,
    minHeight: 200,
    textAlignVertical: 'top',
    lineHeight: 24,
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
});