import { Stack } from 'expo-router';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet } from 'react-native';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import { useDayTheme } from '@/theme/useDayTheme';

const fallbackInsets = { top: 0, left: 0, right: 0, bottom: 0 };

export default function RootLayout() {
  const { colors } = useDayTheme();
  const isDark = colors.scheme === 'dark';

  return (
    <SafeAreaProvider
      style={[styles.root, { backgroundColor: colors.bg }]}
      initialMetrics={initialWindowMetrics ?? undefined}
      initialSafeAreaInsets={initialWindowMetrics?.insets ?? fallbackInsets}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {Platform.OS === 'android' ? (
        <NavigationBar style={isDark ? 'light' : 'dark'} />
      ) : null}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { flex: 1, backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
