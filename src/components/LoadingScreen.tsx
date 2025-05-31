import { COLORS, FONT_SIZE, SPACING } from '@/constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LoadingScreenProps {
  message?: string;
  showIcon?: boolean;
}

export function LoadingScreen({ 
  message = '正在初始化应用...', 
  showIcon = true 
}: LoadingScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {showIcon && (
          <MaterialCommunityIcons 
            name="triangle" 
            size={96} 
            color={COLORS.primary} 
            style={styles.icon}
          />
        )}
        <Text style={styles.title}>山记事</Text>
        <ActivityIndicator 
          size="large" 
          color={COLORS.primary} 
          style={styles.spinner}
        />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  icon: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xl,
  },
  spinner: {
    marginBottom: SPACING.lg,
  },
  message: {
    fontSize: FONT_SIZE.base,
    color: COLORS.gray600,
    textAlign: 'center',
  },
}); 