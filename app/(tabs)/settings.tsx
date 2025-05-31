import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
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

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  type: 'navigation' | 'switch' | 'info';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  color?: string;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [biometric, setBiometric] = useState(false);

  const accountSettings: SettingItem[] = [
    {
      id: 'profile',
      title: '个人资料',
      subtitle: '编辑个人信息',
      icon: 'account-circle-outline',
      type: 'navigation',
      onPress: () => router.push('/profile'),
    },
    {
      id: 'sync',
      title: '同步设置',
      subtitle: '管理数据同步',
      icon: 'sync',
      type: 'navigation',
      onPress: () => router.push('/sync-settings'),
    },
  ];

  const appSettings: SettingItem[] = [
    {
      id: 'notifications',
      title: '推送通知',
      subtitle: '接收任务提醒和更新',
      icon: 'bell-outline',
      type: 'switch',
      value: notifications,
      onToggle: setNotifications,
    },
    {
      id: 'darkMode',
      title: '深色模式',
      subtitle: '使用深色主题',
      icon: 'theme-light-dark',
      type: 'switch',
      value: darkMode,
      onToggle: setDarkMode,
    },
    {
      id: 'autoSync',
      title: '自动同步',
      subtitle: '自动备份数据到云端',
      icon: 'cloud-sync-outline',
      type: 'switch',
      value: autoSync,
      onToggle: setAutoSync,
    },
    {
      id: 'biometric',
      title: '生物识别',
      subtitle: '使用指纹或面容解锁',
      icon: 'fingerprint',
      type: 'switch',
      value: biometric,
      onToggle: setBiometric,
    },
  ];

  const supportSettings: SettingItem[] = [
    {
      id: 'help',
      title: '帮助中心',
      subtitle: '常见问题和使用指南',
      icon: 'help-circle-outline',
      type: 'navigation',
      onPress: () => Alert.alert('帮助中心', '功能开发中...'),
    },
    {
      id: 'feedback',
      title: '意见反馈',
      subtitle: '告诉我们您的想法',
      icon: 'message-outline',
      type: 'navigation',
      onPress: () => Alert.alert('意见反馈', '功能开发中...'),
    },
    {
      id: 'about',
      title: '关于应用',
      subtitle: '版本 1.0.0',
      icon: 'information-outline',
      type: 'navigation',
      onPress: () => Alert.alert('关于应用', '山记事 v1.0.0\n一个简洁优雅的任务管理应用'),
    },
  ];

  const dangerSettings: SettingItem[] = [
    {
      id: 'logout',
      title: '退出登录',
      icon: 'logout',
      type: 'navigation',
      color: COLORS.danger,
      onPress: () => {
        Alert.alert(
          '退出登录',
          '确定要退出当前账户吗？',
          [
            { text: '取消', style: 'cancel' },
            { text: '退出', style: 'destructive', onPress: () => console.log('Logout') },
          ]
        );
      },
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    return (
      <TouchableOpacity
        key={item.id}
        style={styles.settingItem}
        onPress={item.onPress}
        disabled={item.type === 'switch'}
      >
        <View style={styles.settingLeft}>
          <View style={[styles.iconContainer, item.color && { backgroundColor: `${item.color}15` }]}>
            <MaterialCommunityIcons 
              name={item.icon as any} 
              size={24} 
              color={item.color || COLORS.primary} 
            />
          </View>
          <View style={styles.settingText}>
            <Text style={[styles.settingTitle, item.color && { color: item.color }]}>
              {item.title}
            </Text>
            {item.subtitle && (
              <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
            )}
          </View>
        </View>
        <View style={styles.settingRight}>
          {item.type === 'switch' ? (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{ false: COLORS.gray300, true: `${COLORS.primary}40` }}
              thumbColor={item.value ? COLORS.primary : COLORS.white}
            />
          ) : (
            <MaterialCommunityIcons 
              name="chevron-right" 
              size={24} 
              color={COLORS.gray300} 
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string, items: SettingItem[]) => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionContent}>
          {items.map(renderSettingItem)}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* 顶部栏 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>设置</Text>
        <TouchableOpacity>
          <MaterialCommunityIcons name="dots-vertical" size={24} color={COLORS.gray500} />
        </TouchableOpacity>
      </View>

      {/* 用户信息卡片 */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account" size={32} color={COLORS.white} />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>张三</Text>
          <Text style={styles.userEmail}>zhangsan@example.com</Text>
        </View>
        <TouchableOpacity style={styles.editButton}>
          <MaterialCommunityIcons name="pencil" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* 设置列表 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSection('账户设置', accountSettings)}
        {renderSection('应用设置', appSettings)}
        {renderSection('支持', supportSettings)}
        {renderSection('', dangerSettings)}
        
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textColor,
  },
  userCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 24,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textColor,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray700,
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textColor,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  settingRight: {
    marginLeft: 12,
  },
});