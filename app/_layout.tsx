// app/_layout.tsx

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';



export default function RootLayout() {
 

  return (
    <ThemeProvider value={DarkTheme}>
      
      <Stack>
        {/* ✅ ONLY LOGIN */}
        <Stack.Screen name="login" options={{ headerShown: false }} />

        {/* ✅ Your routes */}
        <Stack.Screen name="(admin)/dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="(tv)/display" options={{ headerShown: false }} />

       <Stack.Screen name="dashboard" options={{ headerShown: false }} />
       <Stack.Screen name="device" options={{ headerShown: false }} />
       <Stack.Screen name="media" options={{ headerShown: false }} />

     
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

