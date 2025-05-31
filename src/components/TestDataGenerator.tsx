import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { newAppService } from '../../lib/services/NewAppService';
import { cleanupTestTasks, createTestTasks } from '../../scripts/create-test-tasks';
import { useNewTaskService } from '../hooks/useNewTaskService';

interface TestDataGeneratorProps {
  onTasksCreated?: () => void;
  onTasksCleared?: () => void;
}

export const TestDataGenerator: React.FC<TestDataGeneratorProps> = ({
  onTasksCreated,
  onTasksCleared,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<string>('');
  const newTaskService = useNewTaskService();

  const performCreateTestTasks = async () => {
    setIsCreating(true);
    try {
      console.log('[TestDataGenerator] Starting createTestTasks(100)...');
      await createTestTasks(100);
      console.log('[TestDataGenerator] createTestTasks(100) completed.');
      Alert.alert('成功', '已创建100个测试任务！', [
        { 
          text: '确定',
          onPress: () => onTasksCreated?.()
        }
      ]);
    } catch (error) {
      console.error('[TestDataGenerator] 创建测试任务失败:', error);
      Alert.alert('错误', '创建测试任务失败，请查看控制台日志。');
    } finally {
      setIsCreating(false);
      console.log('[TestDataGenerator] setIsCreating(false).');
    }
  };

  const handleCreateTestTasks = () => {
    Alert.alert(
      '创建测试数据',
      '确定要创建100个测试任务吗？这将会添加大量数据用于测试功能。',
      [
        { text: '取消', style: 'cancel', onPress: () => console.log('[TestDataGenerator] User cancelled task creation.') },
        { 
          text: '创建', 
          onPress: performCreateTestTasks // 调用新的包装函数
        }
      ]
    );
  };

  const handleClearTestTasks = async () => {
    Alert.alert(
      '清理测试数据',
      '确定要清理所有测试任务吗？这将删除所有以"test_"开头的任务。',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '清理', 
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              await cleanupTestTasks();
              Alert.alert('成功', '已清理所有测试数据！', [
                { 
                  text: '确定',
                  onPress: () => onTasksCleared?.()
                }
              ]);
            } catch (error) {
              console.error('清理测试数据失败:', error);
              Alert.alert('错误', '清理测试数据失败，请查看控制台日志');
            } finally {
              setIsClearing(false);
            }
          }
        }
      ]
    );
  };

  // 新增诊断功能
  const runDiagnostic = async () => {
    setIsDiagnosing(true);
    const results: string[] = [];
    
    try {
      results.push('=== 新架构诊断结果 ===');
      
      // 检查新架构初始化状态
      results.push(`新架构初始化状态: ${newAppService.isInitialized()}`);
      
      if (newAppService.isInitialized()) {
        // 检查数据库统计
        try {
          const stats = await newAppService.database.getStatistics();
          results.push(`数据库统计:`);
          results.push(`  任务: ${stats.tasks.total} (活跃: ${stats.tasks.active}, 已完成: ${stats.tasks.completed})`);
          results.push(`  笔记: ${stats.notes.total} (草稿: ${stats.notes.drafts})`);
          results.push(`  项目: ${stats.projects.total}`);
        } catch (error) {
          results.push(`数据库统计获取失败: ${error}`);
        }
        
        // 检查服务是否可用
        try {
          const todayTasks = await newTaskService.getTodayTasks();
          results.push(`今天任务加载测试: 成功 (${todayTasks.length}项)`);
        } catch (error) {
          results.push(`今天任务加载测试: 失败 - ${error}`);
        }
        
        try {
          const allTasks = await newTaskService.getActiveTasks();
          results.push(`全部任务加载测试: 成功 (${allTasks.length}项)`);
        } catch (error) {
          results.push(`全部任务加载测试: 失败 - ${error}`);
        }
        
        try {
          const allNotes = await newAppService.notes.getAllNotes();
          results.push(`笔记加载测试: 成功 (${allNotes.length}项)`);
        } catch (error) {
          results.push(`笔记加载测试: 失败 - ${error}`);
        }
        
        // 检查数据库表结构
        try {
          const dbManager = newAppService.database.databaseManager;
          const taskCount = await dbManager.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM tasks WHERE is_deleted_locally = 0');
          const noteCount = await dbManager.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM notes WHERE is_deleted_locally = 0');
          results.push(`数据库直接查询:`);
          results.push(`  任务表记录数: ${taskCount?.count || 0}`);
          results.push(`  笔记表记录数: ${noteCount?.count || 0}`);
        } catch (error) {
          results.push(`数据库直接查询失败: ${error}`);
        }
      }
      
      results.push('=== 诊断完成 ===');
      setDiagnosticResults(results.join('\n'));
      Alert.alert('诊断完成', '诊断结果已显示在下方，请检查控制台获取详细信息');
    } catch (error) {
      results.push(`诊断过程出错: ${error}`);
      setDiagnosticResults(results.join('\n'));
      Alert.alert('诊断失败', `诊断过程中出现错误: ${error}`);
    } finally {
      setIsDiagnosing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>测试数据管理</Text>
      <Text style={styles.subtitle}>用于测试已完成任务功能的测试数据生成器</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.diagnosticButton]}
          onPress={runDiagnostic}
          disabled={isDiagnosing || isCreating || isClearing}
        >
          <Ionicons 
            name={isDiagnosing ? "hourglass" : "medical"} 
            size={20} 
            color="#fff" 
          />
          <Text style={styles.buttonText}>
            {isDiagnosing ? '诊断中...' : '系统诊断'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.createButton]}
          onPress={handleCreateTestTasks}
          disabled={isCreating || isClearing}
        >
          <Ionicons 
            name={isCreating ? "hourglass" : "add-circle"} 
            size={20} 
            color="#fff" 
          />
          <Text style={styles.buttonText}>
            {isCreating ? '创建中...' : '创建100个测试任务'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={handleClearTestTasks}
          disabled={isCreating || isClearing}
        >
          <Ionicons 
            name={isClearing ? "hourglass" : "trash"} 
            size={20} 
            color="#fff" 
          />
          <Text style={styles.buttonText}>
            {isClearing ? '清理中...' : '清理测试数据'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>测试数据包含：</Text>
        <Text style={styles.infoItem}>• 7个不同类型的项目</Text>
        <Text style={styles.infoItem}>• 100个已完成任务</Text>
        <Text style={styles.infoItem}>• 过去90天的时间分布</Text>
        <Text style={styles.infoItem}>• 随机优先级和完成时间</Text>
        <Text style={styles.infoItem}>• 实际任务用时数据</Text>
      </View>

      {/* 诊断结果显示区域 */}
      {diagnosticResults && (
        <View style={styles.diagnosticContainer}>
          <Text style={styles.diagnosticTitle}>诊断结果：</Text>
          <Text style={styles.diagnosticText}>{diagnosticResults}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  createButton: {
    backgroundColor: '#4CAF50',
  },
  clearButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoItem: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    paddingLeft: 8,
  },
  diagnosticButton: {
    backgroundColor: '#2196F3',
  },
  diagnosticContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    marginTop: 20,
  },
  diagnosticTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  diagnosticText: {
    fontSize: 13,
    color: '#666',
  },
}); 