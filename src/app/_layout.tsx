import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppShell } from '@/components/app-shell';
import { Palette } from '@/constants/design';
import { AcademyProvider } from '@/context/academy-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AcademyProvider>
        <StatusBar style="dark" />
        <AppShell>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Palette.cream },
              animation: 'fade',
            }}
          />
        </AppShell>
      </AcademyProvider>
    </SafeAreaProvider>
  );
}
