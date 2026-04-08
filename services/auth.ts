// services/auth.ts
import api, { setTokens, API_BASE_URL } from "./api";
import axios from "axios";

export interface LoginRequest {
  loginId: string;
  password: string;
}

interface LoginApiResponse {
  accessToken: string;
  refreshToken: string;
  role: string[];
  deviceId: string;
  deviceName: string | null;
  loginId: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  role: string;
  deviceId: string;
  deviceName: string | null;
  loginId: string;
}

export const loginApi = async (data: LoginRequest): Promise<LoginResponse> => {
  // Use direct axios instance for login to avoid interceptor issues
  const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  const res = await axiosInstance.post<LoginApiResponse>("/auth/login", data);
  const d = res.data;

  // Save tokens after successful login
  await setTokens(d.accessToken, d.refreshToken, d.role);

  return {
    token: d.accessToken,
    refreshToken: d.refreshToken,
    role: d.role?.[0]?.toLowerCase() || "user",
    deviceId: d.deviceId,
    deviceName: d.deviceName,
    loginId: d.loginId,
  };
};

export interface RefreshTokenRequest {
  refreshToken: string;
}

interface RefreshTokenApiResponse {
  accessToken: string;
  refreshToken: string;
}

export const refreshTokenApi = async (data: RefreshTokenRequest) => {
  // Use direct axios to avoid interceptor loop
  const response = await axios.post(
    `${API_BASE_URL}/auth/refresh-token`,
    data
  );
  return response.data;
};

export interface RevokeTokenRequest {
  refreshToken: string;
}

export const revokeRefreshTokenApi = async (data: RevokeTokenRequest) => {
  const response = await api.post<{ message: string }>("/auth/revoke-refresh-token", data);
  return response.data.message;
};