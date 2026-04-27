// hooks/useContent.ts

import { useState, useEffect } from "react";
import {
  getDeviceDisplay,
  getDeviceCanvas, // ✅ added
  stopContent,
  DeviceDisplay,
  DeviceCanvasResponse, // ✅ import from service
} from "@/services/content";

// ✅ Response type for /content/device-display
export type DeviceDisplayResponse = {
  message: string;
  data: DeviceDisplay | null;
};

export const useContent = () => {
  const [loading, setLoading] = useState(false);

  // ✅ normal content display
  const [deviceDisplay, setDeviceDisplay] =
    useState<DeviceDisplayResponse | null>(null);

  // ✅ canvas display
  const [deviceCanvas, setDeviceCanvas] =
    useState<DeviceCanvasResponse | null>(null);

  // ─── Fetch Device Display ─────────────────────────────
  const fetchDeviceDisplay = async (): Promise<DeviceDisplayResponse | null> => {
    try {
      setLoading(true);

      const res = await getDeviceDisplay();

      const response: DeviceDisplayResponse = {
        message: res?.message ?? "success",
        data: res?.data ?? null,
      };

      setDeviceDisplay(response);
      return response;
    } catch (error) {
      console.error("Failed to fetch device display:", error);

      const fallback: DeviceDisplayResponse = {
        message: "error",
        data: null,
      };

      setDeviceDisplay(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  };

  // ─── Fetch Device Canvas ─────────────────────────────
  const fetchDeviceCanvas = async (): Promise<DeviceCanvasResponse | null> => {
    try {
      setLoading(true);

      // ✅ use service function instead of fetch()
      const res = await getDeviceCanvas();

      const response: DeviceCanvasResponse = {
        message: res?.message ?? "success",
        data: res?.data ?? null,
      };

      setDeviceCanvas(response);
      return response;
    } catch (error) {
      console.error("Failed to fetch device canvas:", error);

      const fallback: DeviceCanvasResponse = {
        message: "error",
        data: null,
      };

      setDeviceCanvas(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  };

  // ─── Stop Current Content ─────────────────────────────
  const stopCurrentContent = async (
    deviceId: string,
    contentId: number
  ) => {
    try {
      setLoading(true);

      const response = await stopContent(deviceId, contentId);

      if (response?.success) {
        console.log("✅ Content stopped");
        return { success: true };
      }

      console.log("❌ Failed to stop content");
      return { success: false };
    } catch (error) {
      console.error("Stop content error:", error);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // ─── Initial Load ────────────────────────────────────
  useEffect(() => {
    fetchDeviceDisplay();
    fetchDeviceCanvas();
  }, []);

  return {
    loading,

    // normal display
    deviceDisplay,
    fetchDeviceDisplay,

    // canvas display
    deviceCanvas,
    fetchDeviceCanvas,

    stopCurrentContent,
  };
};
