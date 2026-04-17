// services/api.ts
import axios from "axios";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export const API_BASE_URL = "https://digisignapi.lemeniz.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// In-memory tokens
let accessToken: string | null = null;
let refreshToken: string | null = null;

export const initializeTokens = async () => {
  if (Platform.OS === "web") {
    accessToken = localStorage.getItem("accessToken");
    refreshToken = localStorage.getItem("refreshToken");
  } else {
    accessToken = await SecureStore.getItemAsync("accessToken");
    refreshToken = await SecureStore.getItemAsync("refreshToken");
  }
};

export const setTokens = async (
  token: string,
  refresh: string,
  roles?: string[]
) => {
  accessToken = token;
  refreshToken = refresh;

  if (Platform.OS === "web") {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("refreshToken", refresh);
    if (roles) localStorage.setItem("roles", JSON.stringify(roles));
  } else {
    await SecureStore.setItemAsync("accessToken", token);
    await SecureStore.setItemAsync("refreshToken", refresh);
    if (roles) await SecureStore.setItemAsync("roles", JSON.stringify(roles));
  }
};

export const clearTokens = async () => {
  accessToken = null;
  refreshToken = null;

  if (Platform.OS === "web") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("roles");
  } else {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    await SecureStore.deleteItemAsync("roles");
  }
};

// ======================
// REQUEST INTERCEPTOR
// ======================
api.interceptors.request.use(async (config) => {
  // NEVER add token to login or refresh endpoints
  if (
    config.url?.includes("/auth/login") ||
    config.url?.includes("/auth/refresh-token") ||
    config.url?.includes("/auth/revoke")
  ) {
    return config;
  }

  if (!accessToken) {
    await initializeTokens();
  }

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// ======================
// RESPONSE INTERCEPTOR (Refresh Logic)
// ======================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip auth endpoints
    if (originalRequest?.url?.includes("/auth/")) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (!refreshToken) {
          await initializeTokens();
        }

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Use plain axios + make sure NO Authorization header is sent
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken },           // ← send in body
          {
            headers: {
              "Content-Type": "application/json",
              // Do NOT send Authorization header here
            },
          }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data;

        await setTokens(newAccessToken, newRefreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError: any) {
        console.error("Refresh token failed:", refreshError.response?.data || refreshError);
        await clearTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;