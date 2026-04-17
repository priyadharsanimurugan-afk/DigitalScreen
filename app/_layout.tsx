import { toastConfig } from "@/constants/toastConfig";
import { initializeTokens } from "@/services/api";
import { subscribeAuth } from "@/utils/authEvents";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";


export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  const router = useRouter();
  const segments = useSegments();

  // 🔥 LOAD AUTH
  const loadAuth = async () => {
    await initializeTokens();

    let token = null;
    let storedRole = null;

    if (Platform.OS === "web") {
      token = localStorage.getItem("accessToken");
      const roles = localStorage.getItem("roles");
      storedRole = roles ? JSON.parse(roles)[0] : null;
    } else {
      token = await SecureStore.getItemAsync("accessToken");
      const roles = await SecureStore.getItemAsync("roles");
      storedRole = roles ? JSON.parse(roles)[0] : null;
    }

    setIsAuthenticated(!!token);
    setRole(storedRole?.toLowerCase() || null);
    setIsReady(true);
  };

  useEffect(() => {
    loadAuth();
  }, []);
useEffect(() => {
  const reload = () => loadAuth();
  subscribeAuth(reload);
}, []);

useEffect(() => {
  if (!isReady) return;

  const inLogin = segments[0] === "login";
  const inDashboard = segments[0] === "dashboard";
  const inTv = segments[0] === "(tv)";
  const isPublicRoute = segments[0] === "privacyPolicy";

  // ✅ Allow public page
  if (isPublicRoute) return;

  // ❌ Not logged in
  if (!isAuthenticated) {
    if (!inLogin) router.replace("/login");
    return;
  }

  // ✅ Logged in → block login page
  if (isAuthenticated && inLogin) {
    if (role === "admin") {
      router.replace("/dashboard");
    } else {
      router.replace("/(tv)/display");
    }
    return;
  }

  // 🔥 Role protection
  if (role === "admin" && inTv) {
    router.replace("/dashboard");
  }

  if (role !== "admin" && inDashboard) {
    router.replace("/(tv)/display");
  }

}, [isAuthenticated, role, segments, isReady]);


  if (!isReady) return null;

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="sendtv" />
        <Stack.Screen name="privacyPolicy" />


        <Stack.Screen name="(tv)" />
      </Stack>

      <Toast config={toastConfig} />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
