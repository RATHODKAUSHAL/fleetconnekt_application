import '../global.css';

import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AppKeyboardProvider, AppKeyboardToolbar } from '@/components/keyboard-controller';
import { AuthProvider } from '@/context/auth';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 500, fade: true });

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <AppKeyboardProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" options={{ animation: 'fade' }} />
          <Stack.Screen name="register" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="verify-otp" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="home" options={{ animation: 'fade' }} />
          <Stack.Screen name="bookings" options={{ animation: 'fade' }} />
          <Stack.Screen name="booking/[uid]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="booking-form" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="customers" options={{ animation: 'fade' }} />
          <Stack.Screen name="customer-form" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="vendors" options={{ animation: 'fade' }} />
          <Stack.Screen name="vendor-form" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="verify-vehicle" options={{ animation: 'fade' }} />
          <Stack.Screen name="new-lr" options={{ animation: 'fade' }} />
          <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="profile-edit" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="booking-prefix" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="teams" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="team-form" options={{ animation: 'slide_from_right' }} />
        </Stack>
        <AppKeyboardToolbar />
      </AppKeyboardProvider>
    </AuthProvider>
  );
}
