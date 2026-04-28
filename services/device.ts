// services/devices.ts
import api from "./api";

//
// ✅ TYPES
//

export interface CreateDeviceRequest {
  displayName: string;
  deviceName: string;
  password: string;
}

export interface Device {
  deviceId: string;
  displayName: string;
  deviceName: string;
  status: "online" | "offline";
  currentDisplay: string; // "yes" | "no"
  isLive: boolean;
}

export interface DeviceStatusSummary {
  totalDevices: number;
  liveCount: number;
  onlineCount: number;
  offlineCount: number;
}

//
// ✅ HELPER — maps raw API response to Device
// Actual API returns: { deviceId, displayName, deviceName, status, currentDisplay }
//

const mapDevice = (d: any): Device => ({
  deviceId: d.deviceId,
  displayName: d.displayName,
  deviceName: d.deviceName,
  status: d.status,
  currentDisplay: d.currentDisplay,
  isLive: d.currentDisplay === "yes",
});

//
// ✅ API CALLS
//

// 1️⃣ Create Device
export const createDevice = async (data: CreateDeviceRequest): Promise<any> => {
  const res = await api.post("/devices/create", data);
  return res.data;
};

// 2️⃣ Get All Devices
export const getDevices = async (): Promise<Device[]> => {
  const res = await api.get("/devices");
  return res.data.map(mapDevice);
};

export const getCanvasDevices = async (): Promise<Device[]> => {
  const res = await api.get("/devices/all-canvas");
  return res.data.map(mapDevice);
};

// 3️⃣ Update Device
export const updateDevice = async (
  deviceId: string,
  data: Partial<CreateDeviceRequest>
): Promise<any> => {
  const res = await api.post(`/devices/update/${deviceId}`, data);
  return res.data;
};

// 4️⃣ Delete Device
export const deleteDevice = async (deviceId: string): Promise<any> => {
  const res = await api.post(`/devices/delete/${deviceId}`);
  return res.data;
};

// 5️⃣ Get Live Devices
export const getLiveDevices = async (): Promise<Device[]> => {
  const res = await api.get("/devices/live");
  return res.data.map(mapDevice);
};

export const getLiveCanvasDevices = async (): Promise<Device[]> => {
  const res = await api.get("/devices/live-canvas");
  return res.data.map(mapDevice);
};

// 6️⃣ Get Status Summary
export const getDeviceStatusSummary = async (): Promise<DeviceStatusSummary> => {
  const res = await api.get("/devices/status-summary");
  const d = res.data;
  return {
    totalDevices: d.totalDevices ?? d.total_devices ?? 0,
    liveCount: d.liveCount ?? d.live_count ?? 0,
    onlineCount: d.onlineCount ?? d.online_count ?? 0,
    offlineCount: d.offlineCount ?? d.offline_count ?? 0,
  };

  
};

export const getDeviceStatusSummaryCanvas = async (): Promise<DeviceStatusSummary> => {
  const res = await api.get("/devices/canvas-status-summary");
  const d = res.data;
  return {
    totalDevices: d.totalDevices ?? d.total_devices ?? 0,
    liveCount: d.liveCount ?? d.live_count ?? 0,
    onlineCount: d.onlineCount ?? d.online_count ?? 0,
    offlineCount: d.offlineCount ?? d.offline_count ?? 0,
  };

  
};