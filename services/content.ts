// services/content.ts
import { LayoutConfig } from "@/constants/layout";
import api from "./api";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface ScreenLayoutItem {
  value: string;
  label: string;
}

export interface ImageItem {
  imageId: number;
  imageName: string;
  imageurl?: string;
}

export interface DeviceLUTItem {
  deviceId: string;
  deviceName: string;
  displayName: string;
}

export interface ContentLUT {
  imageList: ImageItem[];
  screenLayouts: LayoutConfig[]; 
  deviceList: DeviceLUTItem[];
  imageUrl: string;
}

export interface SendContentRequest {
  title: string;
  description: string;
  imageIds: number[];
  screenLayout: string;
  deviceId: string;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  contentId?: number;
}

export interface LiveDisplay {
  images: any;
  contentId: number;
  deviceId: string;
  deviceName: string;
  displayName: string;
  title: string;
  description?: string;
  imageId: number;
  screenLayout: string;
  status: string;
}

export interface DeviceDisplay {
  id: number;
  title: string;
  description: string;
  screenLayout: string;
  images: {
    imageId: number;
    imageurl: string;
    mimeType: string;
    sortOrder: number;
  }[];
}

// ─── API CALLS ─────────────────────────────────────────────────────────────────

export const getContentLUT = async (): Promise<ContentLUT> => {
  const res = await api.get<ContentLUT>("/content/lut");
  return res.data;
};

export const sendContent = async (data: SendContentRequest): Promise<ApiResponse> => {
  const response = await api.post("/content/send", data);
  return {
    success: true,
    message: response.data?.message || "Content sent successfully",
    contentId: response.data?.contentId
  };
};

export const getDeviceDisplay = async (): Promise<DeviceDisplay> => {
  const res = await api.get<DeviceDisplay>(`/content/device-display`);
  return res.data;
};

export const getLiveDisplay = async (): Promise<LiveDisplay[]> => {
  const res = await api.get(`/content/live-display`);
  return res.data;
};

export const stopContent = async (deviceId: string, contentId: number): Promise<ApiResponse> => {
  const res = await api.post("/content/stop", { deviceId, contentId });
  return {
    success: true,
    message: res.data?.message || "Content stopped successfully"
  };
};