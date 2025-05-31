import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CompletedTaskFilters } from '../../lib/database/task-dao';
import { Priority } from '../../lib/models/types';
import {
    getPastDaysRange,
    getPastMonthsRange,
    getThisMonthRange,
    getThisWeekRange,
    getTodayRange
} from '../../lib/utils/date';

// 时间范围筛选选项
export interface TimeRangeFilter {
  key: string;
  label: string;
  getRange: () => { start: Date; end: Date };
}

export const timeRangeOptions: TimeRangeFilter[] = [
  { key: 'today', label: '今天', getRange: getTodayRange },
  { key: 'thisWeek', label: '本周', getRange: getThisWeekRange },
  { key: 'thisMonth', label: '本月', getRange: getThisMonthRange },
  { key: 'last7Days', label: '过去7天', getRange: () => getPastDaysRange(7) },
  { key: 'last30Days', label: '过去30天', getRange: () => getPastDaysRange(30) },
  { key: 'last3Months', label: '过去3个月', getRange: () => getPastMonthsRange(3) },
];

// 优先级选项
export const priorityOptions: { key: Priority; label: string; color: string }[] = [
  { key: 'high', label: '高', color: '#F44336' },
  { key: 'medium', label: '中', color: '#FF9800' },
  { key: 'low', label: '低', color: '#4CAF50' },
];

interface Project {
  id: string;
  name: string;
}

interface CompletedTasksFiltersProps {
  filters: CompletedTaskFilters;
  onFiltersChange: (filters: CompletedTaskFilters) => void;
  projects: Project[];
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export const CompletedTasksFiltersComponent: React.FC<CompletedTasksFiltersProps> = ({
  filters,
  onFiltersChange,
  projects,
  isExpanded,
  onToggleExpanded,
}) => {
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery || '');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<string[]>(filters.projectIds || []);
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>(filters.priorityFilter || []);

  // 更新搜索查询（防抖）
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({
        ...filters,
        searchQuery: searchQuery.trim() || undefined,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 处理时间范围选择
  const handleTimeRangeSelect = (timeRangeKey: string) => {
    const option = timeRangeOptions.find(opt => opt.key === timeRangeKey);
    if (option) {
      const range = option.getRange();
      setSelectedTimeRange(timeRangeKey);
      onFiltersChange({
        ...filters,
        dateRange: range,
      });
    }
  };

  // 处理项目筛选
  const handleProjectToggle = (projectId: string) => {
    const newSelected = selectedProjects.includes(projectId)
      ? selectedProjects.filter(id => id !== projectId)
      : [...selectedProjects, projectId];
    
    setSelectedProjects(newSelected);
    onFiltersChange({
      ...filters,
      projectIds: newSelected.length > 0 ? newSelected : undefined,
    });
  };

  // 处理优先级筛选
  const handlePriorityToggle = (priority: Priority) => {
    const newSelected = selectedPriorities.includes(priority)
      ? selectedPriorities.filter(p => p !== priority)
      : [...selectedPriorities, priority];
    
    setSelectedPriorities(newSelected);
    onFiltersChange({
      ...filters,
      priorityFilter: newSelected.length > 0 ? newSelected : undefined,
    });
  };

  // 清除所有筛选条件
  const handleClearAll = () => {
    setSearchQuery('');
    setSelectedTimeRange(null);
    setSelectedProjects([]);
    setSelectedPriorities([]);
    onFiltersChange({});
  };

  // 计算激活的筛选条件数量
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (filters.dateRange) count++;
    if (filters.projectIds && filters.projectIds.length > 0) count++;
    if (filters.priorityFilter && filters.priorityFilter.length > 0) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <View style={styles.container}>
      {/* 筛选器头部 */}
      <TouchableOpacity style={styles.header} onPress={onToggleExpanded}>
        <View style={styles.headerLeft}>
          <Ionicons name="filter" size={20} color="#666" />
          <Text style={styles.headerTitle}>筛选器</Text>
          {activeFiltersCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </View>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#666" 
        />
      </TouchableOpacity>

      {/* 筛选器内容 */}
      {isExpanded && (
        <View style={styles.content}>
          {/* 搜索框 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>搜索</Text>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={16} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="搜索任务标题或描述..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
            </View>
          </View>

          {/* 时间范围选择 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>时间范围</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.optionsContainer}>
                {timeRangeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.optionChip,
                      selectedTimeRange === option.key && styles.optionChipSelected,
                    ]}
                    onPress={() => handleTimeRangeSelect(option.key)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        selectedTimeRange === option.key && styles.optionChipTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* 项目筛选 */}
          {projects.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>项目</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.optionsContainer}>
                  {projects.map((project) => (
                    <TouchableOpacity
                      key={project.id}
                      style={[
                        styles.optionChip,
                        selectedProjects.includes(project.id) && styles.optionChipSelected,
                      ]}
                      onPress={() => handleProjectToggle(project.id)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          selectedProjects.includes(project.id) && styles.optionChipTextSelected,
                        ]}
                      >
                        {project.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* 优先级筛选 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>优先级</Text>
            <View style={styles.optionsContainer}>
              {priorityOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionChip,
                    styles.priorityChip,
                    selectedPriorities.includes(option.key) && [
                      styles.optionChipSelected,
                      { backgroundColor: option.color + '20', borderColor: option.color }
                    ],
                  ]}
                  onPress={() => handlePriorityToggle(option.key)}
                >
                  <View style={[styles.priorityDot, { backgroundColor: option.color }]} />
                  <Text
                    style={[
                      styles.optionChipText,
                      selectedPriorities.includes(option.key) && { color: option.color },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 清除按钮 */}
          {activeFiltersCount > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
              <Ionicons name="close-circle" size={16} color="#666" />
              <Text style={styles.clearButtonText}>清除所有筛选</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  badge: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionChipSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  optionChipText: {
    fontSize: 12,
    color: '#666',
  },
  optionChipTextSelected: {
    color: '#2196F3',
    fontWeight: '600',
  },
  priorityChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginTop: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
}); 