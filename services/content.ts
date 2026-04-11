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

// Multi-image support: imageIds is an array
export interface SendContentRequest {
  title: string;
  description: string;
  imageIds: number[];   // array for multi-select
  screenLayout: string;
  deviceId: string;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
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



// ─── API CALLS ─────────────────────────────────────────────────────────────────

export const getContentLUT = async (): Promise<ContentLUT> => {
  const res = await api.get<ContentLUT>("/content/lut");
  return res.data;
};

export const sendContent = async (data: SendContentRequest): Promise<ApiResponse> => {
  const res = await api.post<ApiResponse>("/content/send", data);
  return res.data;
};

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



// ✅ 1. TV DEVICE DISPLAY (NO ID)
export const getDeviceDisplay = async (): Promise<DeviceDisplay> => {
  const res = await api.get<DeviceDisplay>(`/content/device-display`);
  return res.data;
};

// ✅ 2. ADMIN LIVE DISPLAY
export const getLiveDisplay = async (): Promise<LiveDisplay[]> => {
  const res = await api.get(`/content/live-display`);
  return res.data;
};

// services/content.ts

export const stopContent = async (
  deviceId: string,
  contentId: number
): Promise<ApiResponse> => {
  const res = await api.post<ApiResponse>("/content/stop", {
    deviceId,
    contentId,
  });

  return res.data;
};
