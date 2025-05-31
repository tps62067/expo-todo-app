import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DataSyncProvider } from '@/contexts/DataSyncContext';
import { NewAppProvider } from '@/contexts/NewAppContext';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <NewAppProvider>
          <DataSyncProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="task/create" />
              <Stack.Screen name="task/[id]" />
              <Stack.Screen name="note/create" />
              <Stack.Screen name="note/[id]" />
              <Stack.Screen name="search" />
              <Stack.Screen name="sync-settings" />
            </Stack>
          </DataSyncProvider>
        </NewAppProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
