import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppShell } from '@/components/app-shell';
import { BrandMark } from '@/components/brand-mark';
import { Palette } from '@/constants/design';
import { AcademyProvider } from '@/context/academy-context';
import { AcademyDataProvider } from '@/context/academy-data-context';
import { AuthProvider, useAuth } from '@/context/auth-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AcademyProvider>
          <AcademyDataProvider>
            <RootNavigator />
          </AcademyDataProvider>
        </AcademyProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <View style={styles.loadingScreen}>
        <BrandMark />
        <ActivityIndicator color={Palette.forest} size="small" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <AppShell>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Palette.cream },
            animation: 'fade',
          }}>
          <Stack.Screen name="index" />

          <Stack.Protected guard={!isAuthenticated}>
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
          </Stack.Protected>

          <Stack.Protected guard={isAuthenticated}>
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="lernreisen" />
            <Stack.Screen name="kalender" />
            <Stack.Screen name="islam-pass" />
            <Stack.Screen name="kinder" />
            <Stack.Screen name="mitteilungen" />
            <Stack.Screen name="curriculum" />
            <Stack.Screen name="lektionen" />
            <Stack.Screen name="lektion-neu" />
            <Stack.Screen name="gruppen" />
            <Stack.Screen name="medien" />
            <Stack.Screen name="abzeichen" />
            <Stack.Screen name="account" />
          </Stack.Protected>
        </Stack>
      </AppShell>
    </>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    backgroundColor: Palette.cream,
  },
});
