import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
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
// 导入类型定义和服务
import { CreateTaskForm, Priority, Project, TaskStatus } from '../../lib/models/types';
// 新架构相关导入
import { useNewApp } from '@/contexts/NewAppContext';
import { useNewTaskService } from '@/hooks/useNewTaskService';
import { newAppService } from '../../lib/services/NewAppService';

interface TaskFormData {
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: Date;
  reminder: boolean;
  projectId: string;
}

const priorities = [
  { key: 'high' as Priority, label: '高优先级', color: COLORS.highPriority, icon: 'flag' },
  { key: 'medium' as Priority, label: '中优先级', color: COLORS.mediumPriority, icon: 'flag-outline' },
  { key: 'low' as Priority, label: '低优先级', color: COLORS.lowPriority, icon: 'flag-outline' },
];

const statuses = [
  { key: 'not_started' as TaskStatus, label: '未开始', color: COLORS.gray500, icon: 'clock-outline' },
  { key: 'in_progress' as TaskStatus, label: '进行中', color: COLORS.primary, icon: 'play-circle-outline' },
];

// Web兼容的时间选择器组件
const WebDateTimePicker = ({ 
  mode, 
  value, 
  onDateChange 
}: { 
  mode: 'date' | 'time'; 
  value: Date; 
  onDateChange: (date: Date) => void; 
}) => {
  if (Platform.OS !== 'web') return null;

  const handleChange = (event: any) => {
    const inputValue = event.target.value;
    console.log(`Web ${mode} picker changed:`, inputValue);
    if (!inputValue) return;

    if (mode === 'date') {
      const newDate = new Date(inputValue);
      // 保持现有时间
      newDate.setHours(value.getHours());
      newDate.setMinutes(value.getMinutes());
      newDate.setSeconds(value.getSeconds());
      newDate.setMilliseconds(value.getMilliseconds());
      console.log('Web date picker - new date:', newDate);
      onDateChange(newDate);
    } else if (mode === 'time') {
      const [hours, minutes] = inputValue.split(':').map(Number);
      const newDate = new Date(value);
      newDate.setHours(hours);
      newDate.setMinutes(minutes);
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      console.log('Web time picker - new date:', newDate);
      onDateChange(newDate);
    }
  };

  const formatValue = () => {
    if (mode === 'date') {
      return value.toISOString().split('T')[0];
    } else {
      const hours = value.getHours().toString().padStart(2, '0');
      const minutes = value.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  };

  return (
    <input
      type={mode}
      value={formatValue()}
      onChange={handleChange}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0,
        cursor: 'pointer',
        zIndex: 1
      }}
    />
  );
};

export default function CreateTaskScreen() {
  const insets = useSafeAreaInsets();
  
  // 新架构Hooks
  const { isInitialized: newArchInitialized, initError: newArchError } = useNewApp();
  const newTaskService = useNewTaskService();
  
  // 设置默认截止时间为今天下午6点
  const getDefaultDueDate = () => {
    const date = new Date();
    date.setHours(18, 0, 0, 0); // 设置为下午6点
    return date;
  };
  
  const [form, setForm] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'not_started',
    dueDate: getDefaultDueDate(),
    reminder: false,
    projectId: 'default-project', // 默认项目
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [projectSearchText, setProjectSearchText] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);

  // 加载项目列表
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projectList = await newAppService.database.projectDAO.findAllProjects();
        setProjects(projectList);
        setFilteredProjects(projectList);
        
        // 如果有项目，设置第一个为默认
        if (projectList.length > 0) {
          setForm(prev => ({ ...prev, projectId: projectList[0].id }));
        }
      } catch (error) {
        console.error('加载项目列表失败:', error);
        Alert.alert('错误', '加载项目列表失败');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  // 项目搜索过滤
  useEffect(() => {
    if (!projectSearchText.trim()) {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project =>
        project.name.toLowerCase().includes(projectSearchText.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
  }, [projectSearchText, projects]);

  const updateForm = (field: keyof TaskFormData, value: any) => {
    console.log(`Updating form field: ${field}`, value);
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      console.log('Updated form state:', updated);
      return updated;
    });
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      Alert.alert('提示', '请输入任务标题');
      return;
    }

    setSaving(true);
    try {
      // 准备创建任务的数据
      const createTaskData: CreateTaskForm = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        status: form.status,
        due_date: form.dueDate,
        reminder: form.reminder,
        category: form.projectId, // 将项目ID作为分类
      };

      console.log('🚀 使用新架构创建任务');
      const newTask = await newTaskService.createTask(createTaskData);
      
      if (newTask) {
        // 修改：直接导航，然后提示
        router.replace('/(tabs)'); // 修改导航目标并移出Alert
        Alert.alert('成功', '任务创建成功'); // 提示可以保留，或后续根据UI/UX调整
      }

    } catch (error) {
      console.error('创建任务失败:', error);
      Alert.alert('错误', '创建任务失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return '今天';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '明天';
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
        weekday: 'short'
      });
    }
  };

  const formatTime = (date: Date) => {
    console.log('Formatting time for date:', date);
    const formattedTime = date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    console.log('Formatted time:', formattedTime);
    return formattedTime;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* 顶部栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} disabled={saving}>
          <MaterialCommunityIcons name="close" size={24} color={COLORS.gray500} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>新建任务</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving || !form.title.trim()}>
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={[
              styles.saveButton,
              (!form.title.trim()) && styles.saveButtonDisabled
            ]}>
              保存
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 任务标题 */}
        <View style={styles.section}>
          <TextInput
            style={styles.titleInput}
            placeholder="输入任务标题..."
            value={form.title}
            onChangeText={(text) => updateForm('title', text)}
            placeholderTextColor={COLORS.gray500}
            multiline
            editable={!saving}
          />
        </View>

        {/* 任务描述 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>描述</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="添加任务描述..."
            value={form.description}
            onChangeText={(text) => updateForm('description', text)}
            placeholderTextColor={COLORS.gray500}
            multiline
            numberOfLines={4}
            editable={!saving}
          />
        </View>

        {/* 优先级 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>优先级</Text>
          <View style={styles.priorityContainer}>
            {priorities.map((priority) => (
              <TouchableOpacity
                key={priority.key}
                style={[
                  styles.priorityItem,
                  form.priority === priority.key && styles.selectedPriorityItem
                ]}
                onPress={() => updateForm('priority', priority.key)}
                disabled={saving}
              >
                <MaterialCommunityIcons
                  name={priority.icon as any}
                  size={20}
                  color={form.priority === priority.key ? COLORS.white : priority.color}
                />
                <Text style={[
                  styles.priorityText,
                  form.priority === priority.key && styles.selectedPriorityText
                ]}>
                  {priority.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 状态 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>状态</Text>
          <View style={styles.statusContainer}>
            {statuses.map((status) => (
              <TouchableOpacity
                key={status.key}
                style={[
                  styles.statusItem,
                  form.status === status.key && styles.selectedStatusItem
                ]}
                onPress={() => updateForm('status', status.key)}
                disabled={saving}
              >
                <MaterialCommunityIcons
                  name={status.icon as any}
                  size={20}
                  color={form.status === status.key ? COLORS.white : status.color}
                />
                <Text style={[
                  styles.statusText,
                  form.status === status.key && styles.selectedStatusText
                ]}>
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 项目分类 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>项目</Text>
            {projects.length > 0 && (
              <Text style={styles.projectCount}>共 {projects.length} 个项目</Text>
            )}
          </View>
          
          {/* 当前选中的项目显示 */}
          {form.projectId && (
            <View style={styles.selectedProjectDisplay}>
              <Text style={styles.selectedProjectLabel}>已选择:</Text>
              {(() => {
                const selectedProject = projects.find(p => p.id === form.projectId);
                return selectedProject ? (
                  <View style={styles.selectedProjectChip}>
                    <MaterialCommunityIcons
                      name={(selectedProject.icon as any) || 'folder-outline'}
                      size={16}
                      color={COLORS.primary}
                    />
                    <Text style={styles.selectedProjectName}>{selectedProject.name}</Text>
                  </View>
                ) : (
                  <Text style={styles.selectedProjectName}>默认项目</Text>
                );
              })()}
            </View>
          )}
          
          {/* 新建项目输入框 */}
          {showNewProjectInput && (
            <View style={styles.newProjectContainer}>
              <View style={styles.newProjectInputRow}>
                <TextInput
                  style={styles.newProjectInput}
                  placeholder="输入新项目名称..."
                  value={newProjectName}
                  onChangeText={setNewProjectName}
                  placeholderTextColor={COLORS.gray500}
                  editable={!saving}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.newProjectCancel}
                  onPress={() => {
                    setShowNewProjectInput(false);
                    setNewProjectName('');
                  }}
                  disabled={saving}
                >
                  <MaterialCommunityIcons name="close" size={18} color={COLORS.gray600} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.newProjectConfirm,
                    !newProjectName.trim() && styles.newProjectConfirmDisabled
                  ]}
                  onPress={async () => {
                    if (!newProjectName.trim()) return;
                    
                    try {
                      const newProject = await newAppService.database.projectDAO.createProject({
                        name: newProjectName.trim(),
                        sort_order: projects.length,
                        is_shared: 0
                      });
                      
                      setProjects(prev => [...prev, newProject]);
                      updateForm('projectId', newProject.id);
                      setShowNewProjectInput(false);
                      setNewProjectName('');
                    } catch (error) {
                      console.error('创建项目失败:', error);
                      Alert.alert('错误', '创建项目失败，请重试');
                    }
                  }}
                  disabled={saving || !newProjectName.trim()}
                >
                  <MaterialCommunityIcons name="check" size={18} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* 项目选择区域 */}
          <View style={styles.projectSelectionArea}>
            {/* 当项目数量较少时显示水平滚动选择 */}
            {projects.length <= 10 ? (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                style={styles.projectScrollView}
                contentContainerStyle={styles.projectScrollContent}
              >
                {/* 现有项目列表 */}
                {filteredProjects.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={[
                      styles.projectChip,
                      form.projectId === project.id && styles.projectChipSelected
                    ]}
                    onPress={() => updateForm('projectId', project.id)}
                    disabled={saving}
                  >
                    <MaterialCommunityIcons
                      name={(project.icon as any) || 'folder-outline'}
                      size={16}
                      color={form.projectId === project.id ? COLORS.white : COLORS.primary}
                    />
                    <Text style={[
                      styles.projectChipText,
                      form.projectId === project.id && styles.projectChipTextSelected
                    ]}>
                      {project.name}
                    </Text>
                  </TouchableOpacity>
                ))}
                
                {/* 新建项目按钮 */}
                <TouchableOpacity
                  style={[
                    styles.projectChip,
                    styles.addProjectChip,
                    showNewProjectInput && styles.addProjectChipActive
                  ]}
                  onPress={() => setShowNewProjectInput(true)}
                  disabled={saving || showNewProjectInput}
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={16}
                    color={showNewProjectInput ? COLORS.white : COLORS.primary}
                  />
                  <Text style={[
                    styles.projectChipText,
                    styles.addProjectChipText,
                    showNewProjectInput && styles.addProjectChipTextActive
                  ]}>新建项目</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              /* 当项目数量较多时显示选择器按钮 */
              <View style={styles.projectPickerContainer}>
                <TouchableOpacity
                  style={styles.projectPickerButton}
                  onPress={() => setShowProjectPicker(true)}
                  disabled={saving}
                >
                  <MaterialCommunityIcons name="folder-search" size={20} color={COLORS.primary} />
                  <Text style={styles.projectPickerButtonText}>选择项目</Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.gray500} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.projectChip,
                    styles.addProjectChip,
                    showNewProjectInput && styles.addProjectChipActive
                  ]}
                  onPress={() => setShowNewProjectInput(true)}
                  disabled={saving || showNewProjectInput}
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={16}
                    color={showNewProjectInput ? COLORS.white : COLORS.primary}
                  />
                  <Text style={[
                    styles.projectChipText,
                    styles.addProjectChipText,
                    showNewProjectInput && styles.addProjectChipTextActive
                  ]}>新建项目</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* 截止时间 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>截止时间</Text>
          <View style={styles.dateTimeContainer}>
            <TouchableOpacity
              style={[
                styles.dateTimeItem,
                showDatePicker && styles.dateTimeItemActive
              ]}
              onPress={() => {
                console.log('Date picker button pressed');
                if (Platform.OS !== 'web') {
                  setShowDatePicker(true);
                }
              }}
              disabled={saving}
            >
              <MaterialCommunityIcons name="calendar" size={20} color={COLORS.primary} />
              <Text style={[
                styles.dateTimeText,
                showDatePicker && { color: COLORS.white }
              ]}>{formatDate(form.dueDate)}</Text>
              
              {/* Web平台的隐藏日期选择器 */}
              {Platform.OS === 'web' && (
                <WebDateTimePicker
                  mode="date"
                  value={form.dueDate}
                  onDateChange={(date) => updateForm('dueDate', date)}
                />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.dateTimeItem,
                showTimePicker && styles.dateTimeItemActive
              ]}
              onPress={() => {
                console.log('Time picker button pressed, current dueDate:', form.dueDate);
                if (Platform.OS !== 'web') {
                  setShowTimePicker(true);
                }
              }}
              disabled={saving}
            >
              <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.primary} />
              <Text style={[
                styles.dateTimeText,
                showTimePicker && { color: COLORS.white }
              ]}>{formatTime(form.dueDate)}</Text>
              
              {/* Web平台的隐藏时间选择器 */}
              {Platform.OS === 'web' && (
                <WebDateTimePicker
                  mode="time"
                  value={form.dueDate}
                  onDateChange={(date) => updateForm('dueDate', date)}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 提醒设置 */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.reminderItem}
            onPress={() => updateForm('reminder', !form.reminder)}
            disabled={saving}
          >
            <View style={styles.reminderLeft}>
              <MaterialCommunityIcons
                name="bell-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.reminderText}>设置提醒</Text>
            </View>
            <View style={[
              styles.reminderToggle,
              form.reminder && styles.reminderToggleActive
            ]}>
              {form.reminder && (
                <MaterialCommunityIcons name="check" size={16} color={COLORS.white} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* 底部空间 */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 日期选择器 - 仅在非Web平台显示 */}
      {Platform.OS !== 'web' && showDatePicker && (
        <DateTimePicker
          value={form.dueDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            console.log('Date picker onChange:', { event, selectedDate });
            setShowDatePicker(false);
            if (selectedDate && event.type === 'set') {
              // 保持现有的时间，只更新日期
              const updatedDate = new Date(selectedDate);
              updatedDate.setHours(form.dueDate.getHours());
              updatedDate.setMinutes(form.dueDate.getMinutes());
              updatedDate.setSeconds(form.dueDate.getSeconds());
              updatedDate.setMilliseconds(form.dueDate.getMilliseconds());
              console.log('Updated date with preserved time:', updatedDate);
              updateForm('dueDate', updatedDate);
            }
          }}
        />
      )}

      {/* 时间选择器 - 仅在非Web平台显示 */}
      {Platform.OS !== 'web' && showTimePicker && (
        <DateTimePicker
          value={form.dueDate}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            console.log('Time picker onChange:', { event, selectedTime });
            setShowTimePicker(false);
            if (selectedTime && event.type === 'set') {
              // 正确处理时间更新：保持原日期，只更新时间
              const updatedDate = new Date(form.dueDate);
              updatedDate.setHours(selectedTime.getHours());
              updatedDate.setMinutes(selectedTime.getMinutes());
              updatedDate.setSeconds(0);
              updatedDate.setMilliseconds(0);
              console.log('Original date:', form.dueDate);
              console.log('Selected time:', selectedTime);
              console.log('Updated date with new time:', updatedDate);
              updateForm('dueDate', updatedDate);
            }
          }}
        />
      )}

      {/* 项目选择器模态 */}
      {showProjectPicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择项目</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowProjectPicker(false);
                  setProjectSearchText('');
                }}
              >
                <MaterialCommunityIcons name="close" size={24} color={COLORS.gray600} />
              </TouchableOpacity>
            </View>
            
            {/* 搜索框 */}
            <View style={styles.searchContainer}>
              <MaterialCommunityIcons name="magnify" size={20} color={COLORS.gray500} />
              <TextInput
                style={styles.searchInput}
                placeholder="搜索项目..."
                value={projectSearchText}
                onChangeText={setProjectSearchText}
                placeholderTextColor={COLORS.gray500}
              />
              {projectSearchText.length > 0 && (
                <TouchableOpacity
                  style={styles.searchClearButton}
                  onPress={() => setProjectSearchText('')}
                >
                  <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.gray500} />
                </TouchableOpacity>
              )}
            </View>
            
            {/* 项目列表 */}
            <ScrollView style={styles.projectListContainer}>
              {filteredProjects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={[
                    styles.projectListItem,
                    form.projectId === project.id && styles.projectListItemSelected
                  ]}
                  onPress={() => {
                    updateForm('projectId', project.id);
                    setShowProjectPicker(false);
                    setProjectSearchText('');
                  }}
                >
                  <MaterialCommunityIcons
                    name={(project.icon as any) || 'folder-outline'}
                    size={24}
                    color={form.projectId === project.id ? COLORS.white : COLORS.primary}
                  />
                  <Text style={[
                    styles.projectListItemText,
                    form.projectId === project.id && styles.projectListItemTextSelected
                  ]}>
                    {project.name}
                  </Text>
                  {form.projectId === project.id && (
                    <MaterialCommunityIcons name="check" size={20} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              ))}
              
              {filteredProjects.length === 0 && projectSearchText.length > 0 && (
                <View style={styles.noResultsContainer}>
                  <MaterialCommunityIcons name="folder-search" size={48} color={COLORS.gray300} />
                  <Text style={styles.noResultsText}>未找到匹配的项目</Text>
                  <Text style={styles.noResultsSubtext}>尝试修改搜索关键词</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgColor,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray500,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
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
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  saveButtonDisabled: {
    color: COLORS.gray400,
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  section: {
    backgroundColor: COLORS.white,
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textColor,
    marginBottom: 12,
  },
  projectCount: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray500,
  },
  selectedProjectDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedProjectLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textColor,
    marginRight: 8,
  },
  selectedProjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    borderRadius: 8,
  },
  selectedProjectName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textColor,
    marginLeft: 6,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textColor,
    textAlignVertical: 'top',
    minHeight: 50,
  },
  descriptionInput: {
    fontSize: 16,
    color: COLORS.textColor,
    textAlignVertical: 'top',
    minHeight: 80,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    borderRadius: 8,
    padding: 12,
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  selectedPriorityItem: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textColor,
    marginLeft: 6,
  },
  selectedPriorityText: {
    color: COLORS.white,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  selectedStatusItem: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textColor,
    marginLeft: 6,
  },
  selectedStatusText: {
    color: COLORS.white,
  },
  projectSelectionArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectScrollView: {
    flex: 1,
  },
  projectScrollContent: {
    paddingRight: 24,
  },
  projectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  projectChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  projectChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textColor,
    marginLeft: 6,
  },
  projectChipTextSelected: {
    color: COLORS.white,
  },
  addProjectChip: {
    borderStyle: 'dashed',
    backgroundColor: COLORS.white,
  },
  addProjectChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  addProjectChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
    marginLeft: 6,
  },
  addProjectChipTextActive: {
    color: COLORS.white,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateTimeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray100,
  },
  dateTimeText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textColor,
    marginLeft: 8,
  },
  dateTimeItemActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  reminderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textColor,
    marginLeft: 8,
  },
  reminderToggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderToggleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  newProjectContainer: {
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  newProjectInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newProjectInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textColor,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    paddingBottom: 4,
  },
  newProjectCancel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: 6,
    marginRight: 8,
  },
  newProjectConfirm: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 6,
  },
  newProjectConfirmDisabled: {
    backgroundColor: COLORS.gray200,
    borderColor: COLORS.gray200,
  },
  projectPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  projectPickerButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textColor,
    marginLeft: 8,
    flex: 1,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textColor,
  },
  modalCloseButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray100,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textColor,
    marginLeft: 8,
  },
  searchClearButton: {
    padding: 8,
  },
  projectListContainer: {
    flex: 1,
  },
  projectListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    borderRadius: 8,
    marginBottom: 4,
  },
  projectListItemSelected: {
    backgroundColor: COLORS.primary,
    borderBottomColor: COLORS.primary,
  },
  projectListItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textColor,
    marginLeft: 12,
  },
  projectListItemTextSelected: {
    color: COLORS.white,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textColor,
    marginTop: 12,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.gray500,
    marginTop: 4,
    textAlign: 'center',
  },
});