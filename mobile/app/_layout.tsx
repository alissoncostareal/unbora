import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import {
  initialWindowMetrics,
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import { useDayTheme } from '@/theme/useDayTheme';

const fallbackInsets = { top: 0, left: 0, right: 0, bottom: 0 };

export default function RootLayout() {
  const { colors } = useDayTheme();

  return (
    <SafeAreaProvider
      style={[styles.root, { backgroundColor: colors.bg }]}
      initialMetrics={initialWindowMetrics ?? undefined}
      initialSafeAreaInsets={initialWindowMetrics?.insets ?? fallbackInsets}
    >
      <StatusBar style={colors.scheme === 'dark' ? 'light' : 'dark'} />
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
