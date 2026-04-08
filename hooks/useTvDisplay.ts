// hooks/useContent.ts
import { useState, useEffect } from "react";
import { getDeviceDisplay, DeviceDisplay } from "@/services/content";

export const useContent = () => {
  const [loading, setLoading] = useState(false);
  const [deviceDisplay, setDeviceDisplay] = useState<DeviceDisplay | null>(null);

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

  // Initial fetch
  useEffect(() => {
    fetchDeviceDisplay();
  }, []);

  return {
    loading,
    deviceDisplay,
    fetchDeviceDisplay,
  };
};