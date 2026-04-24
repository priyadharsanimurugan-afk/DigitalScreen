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
  mimeType?: string;
}

export interface SlotItem {
  slotIndex: number;
  imageIds: number[];
}

export interface SendContentRequest {
  title: string;
  description: string;
  screenLayout: string;
  deviceId: string | any;
  slots: SlotItem[];
}

export interface DeviceLUTItem {
  deviceId: string;
  deviceName: string;
  displayName: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ContentLUT {
  imageList: ImageItem[];
  screenLayouts: LayoutConfig[];
  deviceList: DeviceLUTItem[];
  imageUrl: string;
  pagination?: PaginationMeta;   // ← optional (API may not always return it)
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
  data: null;
  message: string;
  slots: never[];
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

// ─── API CALLS ────────────────────────────────────────────────────────────────

/**
 * Fetch LUT data. Pass `page` to load a specific image page (default 1).
 * screenLayouts and deviceList are only returned on page 1 by the API,
 * so callers should preserve them from the first fetch.
 */
export const getContentLUT = async (page = 1, pageSize = 10): Promise<ContentLUT> => {
  const res = await api.get<ContentLUT>("/content/lut", {
    params: { page, pageSize },
  });
  return res.data;
};

export const sendContent = async (data: SendContentRequest): Promise<ApiResponse> => {
  const response = await api.post("/content/send", data);
  return {
    success: true,
    message: response.data?.message || "Content sent successfully",
    contentId: response.data?.contentId,
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

export const stopContent = async (
  deviceId: string,
  contentId: number
): Promise<ApiResponse> => {
  const res = await api.post("/content/stop", { deviceId, contentId });
  return {
    success: true,
    message: res.data?.message || "Content stopped successfully",
  };
};