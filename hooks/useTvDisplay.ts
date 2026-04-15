// hooks/useContent.ts
import { useState, useEffect } from "react";
import {
  getDeviceDisplay,
  stopContent, // ✅ IMPORT THIS
  DeviceDisplay,
} from "@/services/content";

export const useContent = () => {
  const [loading, setLoading] = useState(false);
  const [deviceDisplay, setDeviceDisplay] = useState<DeviceDisplay | null>(null);

  // ─── Fetch Device Display ─────────────────────────────
  const fetchDeviceDisplay = async (): Promise<DeviceDisplay | null> => {
    try {
      setLoading(true);
      const data = await getDeviceDisplay();
      setDeviceDisplay(data);
      return data;
    } catch (error) {
      console.error("Failed to fetch device display:", error);
      setDeviceDisplay(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ─── Stop Current Content (SIMPLIFIED ✅) ─────────────
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
    deviceDisplay,
    fetchDeviceDisplay,
    stopCurrentContent, // ✅ EXPORT THIS
  };
};
