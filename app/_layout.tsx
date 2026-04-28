import { Stack } from 'expo-router';
import { ThemeProvider } from './ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="article" />
      </Stack>
    </ThemeProvider>
  );
}