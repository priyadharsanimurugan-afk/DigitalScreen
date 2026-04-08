// services/dashboard.ts
import api from "./api";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  // API returns camelCase — match exactly
  liveScreenCount: number;
  onlineDeviceCount: number;
  offlineDeviceCount: number;
}

export interface LatestLiveContent {
  deviceId: string;
  deviceName: string;
  displayName: string;
  title: string;
  description: string;
  imageId: number;
  screenRatio: string;
  screenLayout: string;
  status: string;
  contentId: number;
}

export interface RecentImage {
  imageId: number;
  imageName: string;
  imageurl: string;
  createdAt: string;
}

// ─── API CALLS ─────────────────────────────────────────────────────────────────

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const res = await api.get<DashboardSummary>("/dashboard/summary");
  return res.data;
};

export const getLatestLiveContent = async (): Promise<LatestLiveContent[]> => {
  const res = await api.get<LatestLiveContent[]>("/dashboard/latest-live-content");
  return res.data;
};

export const getRecentImages = async (): Promise<RecentImage[]> => {
  const res = await api.get<RecentImage[]>("/dashboard/recent-images");
  return res.data;
};