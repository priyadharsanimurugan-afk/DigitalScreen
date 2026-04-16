// hooks/useContent.ts
import { useState, useEffect } from "react";
import {
  getDeviceDisplay,
  stopContent,
  DeviceDisplay,
} from "@/services/content";

// ✅ Add this type
export type DeviceDisplayResponse = {
  message: string;
  data: DeviceDisplay | null;
};

export const useContent = () => {
  const [loading, setLoading] = useState(false);

  // ✅ FIXED TYPE
  const [deviceDisplay, setDeviceDisplay] =
    useState<DeviceDisplayResponse | null>(null);

  // ─── Fetch Device Display ─────────────────────────────
  const fetchDeviceDisplay = async (): Promise<DeviceDisplayResponse | null> => {
    try {
      setLoading(true);

      const res = await getDeviceDisplay(); // API call

      // ✅ Ensure correct shape
      const response: DeviceDisplayResponse = {
        message: res?.message ?? "success",
        data: res?.data ?? null,
      };

      setDeviceDisplay(response);
      return response;

    } catch (error) {
      console.error("Failed to fetch device display:", error);

      // ✅ Proper fallback
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
  }, []);

  return {
    loading,
    deviceDisplay,          // ✅ NOW HAS message + data
    fetchDeviceDisplay,
    stopCurrentContent,
  };
};
