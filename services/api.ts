// services/api.ts
import axios from "axios";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { getRefreshToken as getStoredRefreshToken } from "../utils/tokenStorage";

export const API_BASE_URL = "https://digisignapi.lemeniz.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Token storage (in-memory cache for performance)
let accessToken: string | null = null;
let refreshToken: string | null = null;

// Initialize tokens from storage
export const initializeTokens = async () => {
  if (Platform.OS === "web") {
    accessToken = localStorage.getItem("accessToken");
    refreshToken = localStorage.getItem("refreshToken");
  } else {
    accessToken = await SecureStore.getItemAsync("accessToken");
    refreshToken = await SecureStore.getItemAsync("refreshToken");
  }
};

export const setTokens = async (token: string, refresh: string, roles?: string[]) => {
  accessToken = token;
  refreshToken = refresh;
  
  // Persist to storage
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

// Request interceptor - SKIP for auth endpoints
api.interceptors.request.use(async (config) => {
  // Skip token attachment for auth endpoints
  if (config.url?.includes('/auth/')) {
    return config;
  }
  
  // Try to get token from memory first, then from storage
  if (!accessToken) {
    await initializeTokens();
  }
  
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor for 401 handling
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string | null) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // 🔥 CRITICAL FIX: Don't try to refresh for auth endpoints
    if (originalRequest.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const currentRefreshToken = refreshToken || await getStoredRefreshToken();
        
        if (!currentRefreshToken) {
          // No refresh token - must login again
          await clearTokens();
          return Promise.reject(new Error("Session expired. Please login again."));
        }

        // Call refresh endpoint
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken: currentRefreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        // Update tokens
        await setTokens(newAccessToken, newRefreshToken);
        
        // Update in-memory tokens
        accessToken = newAccessToken;
        refreshToken = newRefreshToken;

        processQueue(null, newAccessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (err) {
        processQueue(err, null);
        
        // Clear all tokens on refresh failure
        await clearTokens();
        
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;