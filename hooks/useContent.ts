// hooks/useContent.ts
import { useState, useEffect, useCallback } from "react";
import {
  getContentLUT,
  sendContent,
  getLiveDisplay,
  getDeviceDisplay,
  stopContent,
  ContentLUT,
  SendContentRequest,
  LiveDisplay,
  DeviceDisplay,
} from "@/services/content";

export const useContent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

const [lutData, setLutData] = useState<ContentLUT>({
  imageList: [],
  screenLayouts: [],
  deviceList: [],
  imageUrl: "",
  pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 1 }, // ← safe default
});
 

  const [deviceDisplay, setDeviceDisplay] = useState<DeviceDisplay | null>(null);
  const [liveDisplays, setLiveDisplays] = useState<LiveDisplay[]>([]);

  // Auto-clear messages after 5 seconds
  const clearMessages = () => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  };

  // Parse backend validation errors
  const parseError = (err: any): string => {
    const apiError = err?.response?.data;

    if (apiError?.errors) {
      return Object.entries(apiError.errors)
        .map(([key, value]: [string, any]) => `${key}: ${Array.isArray(value) ? value[0] : value}`)
        .join("\n");
    }

    return (
      apiError?.message ||
      apiError?.title ||
      err?.message ||
      "Something went wrong"
    );
  };

  // Fetch LUT Data
const fetchLUTData = async () => {
  try {
    setLoading(true);

    const data = await getContentLUT(1, 10);

    setLutData({
      imageList: data.imageList || [],
      screenLayouts: data.screenLayouts || [],
      deviceList: data.deviceList || [],
      imageUrl: data.imageUrl || "",
      pagination:
        data.pagination ?? {
          page: 1,
          pageSize: 10,
          totalCount: 0,
          totalPages: 1,
        },
    });

    return data;
  } catch (err) {
    console.error("Error fetching LUT data:", err);
    setError(parseError(err));
    clearMessages();
    return null;
  } finally {
    setLoading(false);
  }
};


  // Fetch Live Display
  const fetchLiveDisplay = async () => {
    try {
      const data = await getLiveDisplay();
      const liveData = Array.isArray(data) ? data : [];
      setLiveDisplays(liveData);
      return liveData;
    } catch (err) {
      console.error('Error fetching live displays:', err);
      setLiveDisplays([]);
      return [];
    }
  };

  // Send Content to Device
  const sendContentToDevice = async (data: SendContentRequest) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await sendContent(data);

      if (response.success) {
        setSuccess(response.message || "Content sent successfully!");
        
        // IMPORTANT: Wait for both to complete
        await Promise.all([
          fetchLiveDisplay(),
          fetchLUTData(),
        ]);
        
        clearMessages();
        return { success: true, data: response };
      }

      const errorMsg = response.message || "Failed to send content";
      setError(errorMsg);
      clearMessages();
      return { success: false, error: errorMsg };
    } catch (err: any) {
      const errorMsg = parseError(err);
      setError(errorMsg);
      clearMessages();
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Stop Current Content
  const stopCurrentContent = async (deviceId: string, contentId: number) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await stopContent(deviceId, contentId);

      if (response.success) {
        setSuccess(response.message || "Content stopped successfully");
        
        // IMPORTANT: Wait for both to complete
        await Promise.all([
          fetchLiveDisplay(),
          fetchLUTData(),
        ]);
        
        clearMessages();
        return { success: true, data: response };
      }

      const errorMsg = response.message || "Failed to stop content";
      setError(errorMsg);
      clearMessages();
      return { success: false, error: errorMsg };
    } catch (err) {
      const errorMsg = parseError(err);
      setError(errorMsg);
      clearMessages();
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Refresh All Data
  const refreshAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchLUTData(), fetchLiveDisplay()]);
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get Screen Layout Label
  const getScreenLayoutLabel = useCallback(
    (value: string) =>
      lutData.screenLayouts.find((l) => l.value === value)?.label || value,
    [lutData.screenLayouts]
  );

  useEffect(() => {
    refreshAllData();
  }, []);

  return {
    loading,
    error,
    success,
    lutData,
    deviceDisplay,
    liveDisplays,
    fetchLUTData,
    fetchLiveDisplay,
    sendContentToDevice,
    stopCurrentContent,
    refreshAllData,
    getScreenLayoutLabel,
    setError,
    setSuccess,
  };
};