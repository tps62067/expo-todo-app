import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 导入设计系统常量
import { COLORS } from '@/constants';

interface SyncStatus {
  lastSync: string;
  status: 'synced' | 'syncing' | 'error' | 'offline';
  totalItems: number;
  syncedItems: number;
}

export default function SyncSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [autoSync, setAutoSync] = useState(true);
  const [syncOnWiFiOnly, setSyncOnWiFiOnly] = useState(true);
  const [syncTasks, setSyncTasks] = useState(true);
  const [syncNotes, setSyncNotes] = useState(true);
  const [syncSettings, setSyncSettings] = useState(true);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  
  const [syncStatus] = useState<SyncStatus>({
    lastSync: '2024-01-15 14:30',
    status: 'synced',
    totalItems: 156,
    syncedItems: 156,
  });

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    
    // 模拟同步过程
    setTimeout(() => {
      setIsManualSyncing(false);
      Alert.alert('同步完成', '所有数据已成功同步到云端');
    }, 2000);
  };

  const handleResetSync = () => {
    Alert.alert(
      '重置同步数据',
      '这将清除本地缓存并重新从云端下载所有数据，确定要继续吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '重置', 
          style: 'destructive', 
          onPress: () => {
            Alert.alert('重置完成', '同步数据已重置');
          }
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced':
        return COLORS.success;
      case 'syncing':
        return COLORS.warning;
      case 'error':
        return COLORS.danger;
      case 'offline':
        return COLORS.gray500;
      default:
        return COLORS.gray500;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'synced':
        return '已同步';
      case 'syncing':
        return '同步中';
      case 'error':
        return '同步失败';
      case 'offline':
        return '离线';
      default:
        return '未知';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return 'check-circle';
      case 'syncing':
        return 'sync';
      case 'error':
        return 'alert-circle';
      case 'offline':
        return 'wifi-off';
      default:
        return 'help-circle';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* 顶部栏 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.gray500} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>同步设置</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 同步状态卡片 */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusLeft}>
              <MaterialCommunityIcons
                name={getStatusIcon(syncStatus.status)}
                size={24}
                color={getStatusColor(syncStatus.status)}
              />
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>同步状态</Text>
                <Text style={[styles.statusText, { color: getStatusColor(syncStatus.status) }]}>
                  {getStatusText(syncStatus.status)}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.syncButton, isManualSyncing && styles.syncButtonDisabled]}
              onPress={handleManualSync}
              disabled={isManualSyncing}
            >
              {isManualSyncing ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <MaterialCommunityIcons name="sync" size={20} color={COLORS.white} />
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.statusDetails}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>最后同步</Text>
              <Text style={styles.statusValue}>{syncStatus.lastSync}</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>同步项目</Text>
              <Text style={styles.statusValue}>
                {syncStatus.syncedItems}/{syncStatus.totalItems}
              </Text>
            </View>
          </View>
        </View>

        {/* 自动同步设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>自动同步</Text>
          <View style={styles.sectionContent}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons name="sync" size={20} color={COLORS.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>启用自动同步</Text>
                  <Text style={styles.settingSubtitle}>数据变更时自动同步到云端</Text>
                </View>
              </View>
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: COLORS.gray300, true: `${COLORS.primary}40` }}
                thumbColor={autoSync ? COLORS.primary : COLORS.white}
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons name="wifi" size={20} color={COLORS.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>仅在WiFi下同步</Text>
                  <Text style={styles.settingSubtitle}>避免消耗移动数据流量</Text>
                </View>
              </View>
              <Switch
                value={syncOnWiFiOnly}
                onValueChange={setSyncOnWiFiOnly}
                trackColor={{ false: COLORS.gray300, true: `${COLORS.primary}40` }}
                thumbColor={syncOnWiFiOnly ? COLORS.primary : COLORS.white}
              />
            </View>
          </View>
        </View>

        {/* 同步内容设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>同步内容</Text>
          <View style={styles.sectionContent}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons name="checkbox-marked-outline" size={20} color={COLORS.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>任务数据</Text>
                  <Text style={styles.settingSubtitle}>同步所有任务和待办事项</Text>
                </View>
              </View>
              <Switch
                value={syncTasks}
                onValueChange={setSyncTasks}
                trackColor={{ false: COLORS.gray300, true: `${COLORS.primary}40` }}
                thumbColor={syncTasks ? COLORS.primary : COLORS.white}
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons name="notebook-outline" size={20} color={COLORS.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>笔记数据</Text>
                  <Text style={styles.settingSubtitle}>同步所有笔记和附件</Text>
                </View>
              </View>
              <Switch
                value={syncNotes}
                onValueChange={setSyncNotes}
                trackColor={{ false: COLORS.gray300, true: `${COLORS.primary}40` }}
                thumbColor={syncNotes ? COLORS.primary : COLORS.white}
              />
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <MaterialCommunityIcons name="cog-outline" size={20} color={COLORS.primary} />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>应用设置</Text>
                  <Text style={styles.settingSubtitle}>同步个人偏好和配置</Text>
                </View>
              </View>
              <Switch
                value={syncSettings}
                onValueChange={setSyncSettings}
                trackColor={{ false: COLORS.gray300, true: `${COLORS.primary}40` }}
                thumbColor={syncSettings ? COLORS.primary : COLORS.white}
              />
            </View>
          </View>
        </View>

        {/* 高级选项 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>高级选项</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionLeft}>
                <MaterialCommunityIcons name="download" size={20} color={COLORS.primary} />
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>导出数据</Text>
                  <Text style={styles.actionSubtitle}>将数据导出为备份文件</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.gray300} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionLeft}>
                <MaterialCommunityIcons name="upload" size={20} color={COLORS.primary} />
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>导入数据</Text>
                  <Text style={styles.actionSubtitle}>从备份文件恢复数据</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.gray300} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem} onPress={handleResetSync}>
              <View style={styles.actionLeft}>
                <MaterialCommunityIcons name="refresh" size={20} color={COLORS.warning} />
                <View style={styles.actionText}>
                  <Text style={[styles.actionTitle, { color: COLORS.warning }]}>重置同步</Text>
                  <Text style={styles.actionSubtitle}>清除本地缓存并重新同步</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.gray300} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 存储信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>存储信息</Text>
          <View style={styles.storageCard}>
            <View style={styles.storageHeader}>
              <MaterialCommunityIcons name="cloud-outline" size={24} color={COLORS.primary} />
              <Text style={styles.storageTitle}>云端存储</Text>
            </View>
            <View style={styles.storageProgress}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '35%' }]} />
              </View>
              <Text style={styles.storageText}>已使用 3.5GB / 10GB</Text>
            </View>
          </View>
        </View>

        {/* 底部空间 */}
        <View style={{ height: 40 }} />
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
  content: {
    flex: 1,
    paddingTop: 16,
  },
  statusCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusInfo: {
    marginLeft: 12,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textColor,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  syncButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  statusDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    color: COLORS.gray500,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textColor,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textColor,
    marginBottom: 12,
    marginHorizontal: 24,
  },
  sectionContent: {
    backgroundColor: COLORS.white,
    marginHorizontal: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textColor,
  },
  settingSubtitle: {
    fontSize: 14,
    color: COLORS.gray500,
    marginTop: 2,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionText: {
    marginLeft: 12,
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textColor,
  },
  actionSubtitle: {
    fontSize: 14,
    color: COLORS.gray500,
    marginTop: 2,
  },
  storageCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 16,
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  storageTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textColor,
    marginLeft: 8,
  },
  storageProgress: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.gray100,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  storageText: {
    fontSize: 14,
    color: COLORS.gray500,
  },
});