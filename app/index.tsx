import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 导入设计系统常量
import { COLORS } from '@/constants';

export default function SplashScreen() {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // 模拟启动延迟，实际项目中可以在这里进行初始化操作
    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <MaterialCommunityIcons 
          name="triangle" 
          size={96} 
          color={COLORS.primary} 
          style={styles.icon}
        />
        <Text style={styles.title}>山记事</Text>
        <Text style={styles.subtitle}>简单记录，自在生活</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
});
