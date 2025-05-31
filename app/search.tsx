import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
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

interface SearchResult {
  id: string;
  type: 'task' | 'note';
  title: string;
  content: string;
  date: string;
  category?: string;
  priority?: string;
}

const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    type: 'task',
    title: '完成山记事App原型设计',
    content: '需要完成所有页面的原型设计，包括任务管理、笔记编辑等功能',
    date: '今天 14:00',
    category: '工作',
    priority: 'high',
  },
  {
    id: '2',
    type: 'note',
    title: '项目会议记录',
    content: '今天的会议讨论了新功能的开发计划，需要在下周完成原型设计...',
    date: '2024-01-15',
    category: '工作',
  },
  {
    id: '3',
    type: 'task',
    title: '准备项目演示文稿',
    content: '为下周的项目演示准备PPT，包括功能介绍和技术架构',
    date: '今天 16:30',
    category: '工作',
    priority: 'medium',
  },
  {
    id: '4',
    type: 'note',
    title: 'UI设计灵感',
    content: '看到一个很棒的卡片设计，使用了渐变色和阴影效果，可以应用到我们的项目中...',
    date: '2024-01-12',
    category: '设计',
  },
];

const recentSearches = [
  '项目设计',
  '会议记录',
  '任务管理',
  'UI设计',
  '原型',
];

const quickFilters = [
  { key: 'all', label: '全部', icon: 'magnify' },
  { key: 'task', label: '任务', icon: 'checkbox-marked-outline' },
  { key: 'note', label: '笔记', icon: 'notebook-outline' },
  { key: 'today', label: '今天', icon: 'calendar-today' },
  { key: 'high', label: '高优先级', icon: 'flag' },
];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchText.trim()) {
      setIsSearching(true);
      // 模拟搜索延迟
      const timer = setTimeout(() => {
        const filtered = mockSearchResults.filter(item => {
          const matchesText = item.title.toLowerCase().includes(searchText.toLowerCase()) ||
                             item.content.toLowerCase().includes(searchText.toLowerCase());
          
          if (activeFilter === 'all') return matchesText;
          if (activeFilter === 'task') return matchesText && item.type === 'task';
          if (activeFilter === 'note') return matchesText && item.type === 'note';
          if (activeFilter === 'today') return matchesText && item.date.includes('今天');
          if (activeFilter === 'high') return matchesText && item.priority === 'high';
          
          return matchesText;
        });
        setSearchResults(filtered);
        setIsSearching(false);
      }, 300);
      
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchText, activeFilter]);

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => {
      if (part.toLowerCase() === query.toLowerCase()) {
        return (
          <Text key={index} style={styles.highlightText}>
            {part}
          </Text>
        );
      }
      return part;
    });
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => {
    const isTask = item.type === 'task';
    
    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => router.push(`/${item.type}/${item.id}`)}
      >
        <View style={styles.resultHeader}>
          <View style={styles.resultType}>
            <MaterialCommunityIcons
              name={isTask ? 'checkbox-marked-outline' : 'notebook-outline'}
              size={16}
              color={isTask ? COLORS.primary : COLORS.accent}
            />
            <Text style={[styles.resultTypeText, { color: isTask ? COLORS.primary : COLORS.accent }]}>
              {isTask ? '任务' : '笔记'}
            </Text>
          </View>
          {item.priority && (
            <View style={[styles.priorityBadge, {
              backgroundColor: item.priority === 'high' ? COLORS.highPriority : COLORS.mediumPriority
            }]}>
              <Text style={styles.priorityText}>
                {item.priority === 'high' ? '高' : '中'}
              </Text>
            </View>
          )}
        </View>
        
        <Text style={styles.resultTitle}>
          {highlightText(item.title, searchText)}
        </Text>
        
        <Text style={styles.resultContent} numberOfLines={2}>
          {highlightText(item.content, searchText)}
        </Text>
        
        <View style={styles.resultFooter}>
          <Text style={styles.resultDate}>{item.date}</Text>
          {item.category && (
            <>
              <Text style={styles.separator}>·</Text>
              <Text style={styles.resultCategory}>{item.category}</Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (searchText.trim() && !isSearching) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="magnify" size={64} color={COLORS.gray300} />
          <Text style={styles.emptyText}>未找到相关内容</Text>
          <Text style={styles.emptySubtext}>尝试使用其他关键词搜索</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.defaultState}>
        {/* 最近搜索 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>最近搜索</Text>
          <View style={styles.recentSearches}>
            {recentSearches.map((search, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentSearchItem}
                onPress={() => setSearchText(search)}
              >
                <MaterialCommunityIcons name="history" size={16} color={COLORS.gray500} />
                <Text style={styles.recentSearchText}>{search}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* 快速筛选 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>快速筛选</Text>
          <View style={styles.quickFilters}>
            {quickFilters.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={styles.quickFilterItem}
                onPress={() => {
                  setActiveFilter(filter.key);
                  if (searchText.trim()) {
                    // 触发搜索
                  }
                }}
              >
                <MaterialCommunityIcons
                  name={filter.icon as any}
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.quickFilterText}>{filter.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* 搜索栏 */}
      <View style={styles.searchHeader}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.gray500} />
        </TouchableOpacity>
        
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.gray500} />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索任务和笔记..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={COLORS.gray500}
            autoFocus
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <MaterialCommunityIcons name="close" size={20} color={COLORS.gray500} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 筛选器 */}
      {searchText.trim() && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {quickFilters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                activeFilter === filter.key && styles.activeFilterChip
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <MaterialCommunityIcons
                name={filter.icon as any}
                size={16}
                color={activeFilter === filter.key ? COLORS.white : COLORS.primary}
              />
              <Text style={[
                styles.filterText,
                activeFilter === filter.key && styles.activeFilterText
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* 搜索结果 */}
      <View style={styles.content}>
        {isSearching ? (
          <View style={styles.loadingState}>
            <MaterialCommunityIcons name="loading" size={32} color={COLORS.primary} />
            <Text style={styles.loadingText}>搜索中...</Text>
          </View>
        ) : searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.resultsList}
          />
        ) : (
          renderEmptyState()
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgColor,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.textColor,
  },
  filterContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  filterContent: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray100,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 4,
  },
  activeFilterText: {
    color: COLORS.white,
  },
  content: {
    flex: 1,
  },
  defaultState: {
    flex: 1,
    paddingTop: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textColor,
    marginBottom: 16,
    marginHorizontal: 24,
  },
  recentSearches: {
    paddingHorizontal: 24,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  recentSearchText: {
    fontSize: 16,
    color: COLORS.textColor,
    marginLeft: 12,
  },
  quickFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
  },
  quickFilterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickFilterText: {
    fontSize: 14,
    color: COLORS.textColor,
    fontWeight: '500',
    marginLeft: 8,
  },
  resultsList: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  resultItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultTypeText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  priorityBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  priorityText: {
    fontSize: 10,
    color: COLORS.white,
    fontWeight: '500',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textColor,
    marginBottom: 4,
  },
  resultContent: {
    fontSize: 14,
    color: COLORS.gray700,
    lineHeight: 20,
    marginBottom: 8,
  },
  resultFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultDate: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  separator: {
    fontSize: 12,
    color: COLORS.gray500,
    marginHorizontal: 4,
  },
  resultCategory: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  highlightText: {
    backgroundColor: COLORS.warning + '30', // 添加透明度
    color: COLORS.textColor,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
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
  loadingState: {
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