import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 本地定义统计数据接口
interface CompletedTasksStatistics {
  totalCompleted: number;
  todayCompleted: number;
  weekCompleted: number;
  monthCompleted: number;
  completionTrend: Array<{ date: string; count: number }>;
  topProjects: Array<{ projectName: string; count: number }>;
  averageCompletionTime: number;
}

interface CompletedTasksStatsProps {
  statistics: CompletedTasksStatistics | null;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

// 简单的趋势图组件
const TrendChart: React.FC<{ 
  data: Array<{ date: string; count: number }>;
  maxValue: number;
}> = ({ data, maxValue }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyChartText}>暂无数据</Text>
      </View>
    );
  }

  return (
    <View style={styles.chartContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chart}>
          {data.map((item, index) => {
            const height = maxValue > 0 ? (item.count / maxValue) * 60 : 0;
            const date = new Date(item.date);
            const dayOfMonth = date.getDate();
            
            return (
              <View key={index} style={styles.chartBar}>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar, 
                      { height: Math.max(height, 2) }
                    ]} 
                  />
                </View>
                <Text style={styles.barLabel}>{dayOfMonth}</Text>
                <Text style={styles.barValue}>{item.count}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export const CompletedTasksStatsComponent: React.FC<CompletedTasksStatsProps> = ({
  statistics,
  isExpanded,
  onToggleExpanded,
  onRefresh,
  isLoading = false,
}) => {
  const getPercentageChange = (current: number, previous: number): string => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const maxTrendValue = statistics?.completionTrend 
    ? Math.max(...statistics.completionTrend.map(item => item.count), 1)
    : 1;

  return (
    <View style={styles.container}>
      {/* 统计信息头部 */}
      <TouchableOpacity style={styles.header} onPress={onToggleExpanded}>
        <View style={styles.headerLeft}>
          <Ionicons name="analytics" size={20} color="#666" />
          <Text style={styles.headerTitle}>完成统计</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={onRefresh}
            disabled={isLoading}
          >
            <Ionicons 
              name="refresh" 
              size={18} 
              color="#666" 
              style={isLoading ? styles.rotating : undefined}
            />
          </TouchableOpacity>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#666" 
          />
        </View>
      </TouchableOpacity>

      {/* 基础统计卡片 - 总是显示 */}
      {statistics ? (
        <View style={styles.basicStats}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{statistics.totalCompleted || 0}</Text>
            <Text style={styles.statLabel}>总完成</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, styles.todayNumber]}>
              {statistics.todayCompleted || 0}
            </Text>
            <Text style={styles.statLabel}>今日</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{statistics.weekCompleted || 0}</Text>
            <Text style={styles.statLabel}>本周</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{statistics.monthCompleted || 0}</Text>
            <Text style={styles.statLabel}>本月</Text>
          </View>
        </View>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载统计数据中...</Text>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无统计数据</Text>
        </View>
      )}

      {/* 详细统计内容 */}
      {isExpanded && statistics && (
        <View style={styles.detailedStats}>
          {/* 完成趋势图表 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>完成趋势（过去30天）</Text>
            <TrendChart 
              data={statistics.completionTrend} 
              maxValue={maxTrendValue}
            />
          </View>

          {/* 热门项目排行 */}
          {statistics.topProjects && statistics.topProjects.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>热门项目</Text>
              <View style={styles.projectList}>
                {statistics.topProjects.map((project, index) => (
                  <View key={index} style={styles.projectItem}>
                    <View style={styles.projectInfo}>
                      <View style={[styles.projectRank, getRankStyle(index)]}>
                        <Text style={[styles.projectRankText, getRankTextStyle(index)]}>
                          {index + 1}
                        </Text>
                      </View>
                      <Text style={styles.projectName} numberOfLines={1}>
                        {project.projectName}
                      </Text>
                    </View>
                    <View style={styles.projectStats}>
                      <Text style={styles.projectCount}>{project.count}</Text>
                      <Text style={styles.projectCountLabel}>个任务</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 效率指标 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>效率指标</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {statistics.weekCompleted > 0 
                    ? (statistics.weekCompleted / 7).toFixed(1)
                    : '0'
                  }
                </Text>
                <Text style={styles.metricLabel}>日均完成</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {statistics.monthCompleted > 0 
                    ? (statistics.monthCompleted / 30).toFixed(1)
                    : '0'
                  }
                </Text>
                <Text style={styles.metricLabel}>月均完成</Text>
              </View>
              {statistics.averageCompletionTime && (
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>
                    {statistics.averageCompletionTime.toFixed(0)}
                  </Text>
                  <Text style={styles.metricLabel}>平均用时(分)</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

// 获取排名样式
const getRankStyle = (index: number) => {
  switch (index) {
    case 0: return { backgroundColor: '#FFD700' }; // 金色
    case 1: return { backgroundColor: '#C0C0C0' }; // 银色
    case 2: return { backgroundColor: '#CD7F32' }; // 铜色
    default: return { backgroundColor: '#E0E0E0' }; // 默认灰色
  }
};

const getRankTextStyle = (index: number) => {
  return index < 3 ? { color: '#fff', fontWeight: 'bold' as const } : { color: '#666' };
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 4,
    marginRight: 8,
  },
  rotating: {
    transform: [{ rotate: '360deg' }],
  },
  basicStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  todayNumber: {
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  detailedStats: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  chartContainer: {
    height: 100,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 80,
    paddingHorizontal: 4,
  },
  chartBar: {
    alignItems: 'center',
    marginHorizontal: 2,
    minWidth: 24,
  },
  barContainer: {
    height: 60,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 12,
    backgroundColor: '#2196F3',
    borderRadius: 2,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  barValue: {
    fontSize: 8,
    color: '#999',
    marginTop: 2,
  },
  emptyChart: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    color: '#999',
    fontSize: 14,
  },
  projectList: {
    gap: 8,
  },
  projectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  projectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  projectRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  projectRankText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  projectName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  projectStats: {
    alignItems: 'flex-end',
  },
  projectCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  projectCountLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  metricLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
}); 