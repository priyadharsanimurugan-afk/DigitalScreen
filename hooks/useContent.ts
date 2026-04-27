import { useState, useEffect, useCallback } from "react";
import {
  getContentLUT,
  sendContent,
  // getLiveDisplay,
  getDeviceDisplay,
  stopContent,
  getDeviceCanvas,
  sendCanvasContent,
  ContentLUT,
  SendContentRequest,
  LiveDisplay,
  DeviceDisplay,
  SendCanvasRequest,
  DeviceCanvasResponse,
  getDeviceCanvasAdmin,
  stopContentCanvas,
} from "@/services/content";
import { CanvasLive } from "@/app/dashboard";

// Normal content display response
export type DeviceDisplayResponse = {
  message: string;
  data: DeviceDisplay | null;
};

export const useContent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // LUT data
  const [lutData, setLutData] = useState<ContentLUT>({
    imageList: [],
    screenLayouts: [],
    deviceList: [],
    imageUrl: "",
    pagination: {
      page: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 1,
    },
  });

  // Live display list
  const [liveDisplays, setLiveDisplays] = useState<LiveDisplay[]>([]);

  // Normal content display
  const [deviceDisplay, setDeviceDisplay] =
    useState<DeviceDisplayResponse | null>(null);

  // Canvas display
const [deviceCanvas, setDeviceCanvas] = useState<CanvasLive[]>([]);

  // Auto-clear success/error messages
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
        .map(
          ([key, value]: [string, any]) =>
            `${key}: ${Array.isArray(value) ? value[0] : value}`
        )
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
  // const fetchLiveDisplay = async () => {
  //   try {
  //     const data = await getLiveDisplay();
  //     const liveData = Array.isArray(data) ? data : [];
  //     setLiveDisplays(liveData);
  //     return liveData;
  //   } catch (err) {
  //     console.error("Error fetching live displays:", err);
  //     setLiveDisplays([]);
  //     return [];
  //   }
  // };

  // Fetch Device Display

  // Fetch Device Canvas
const fetchDeviceCanvas = async (): Promise<CanvasLive[]> => {
  try {
    setLoading(true);

    const canvasData = await getDeviceCanvasAdmin();



    setDeviceCanvas(canvasData);
    return canvasData;
  } catch (error) {
    console.error("fetchDeviceCanvas ERROR:", error);
    setDeviceCanvas([]);
    return [];
  } finally {
    setLoading(false);
  }
};



  // Send normal content
  const sendContentToDevice = async (data: SendContentRequest) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await sendContent(data);

      if (response.success) {
        setSuccess(response.message || "Content sent successfully!");

        await Promise.all([
          // fetchLiveDisplay(),
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

  // Send canvas content
  const sendCanvasToDevice = async (data: SendCanvasRequest) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await sendCanvasContent(data);

      if (response.success) {
        setSuccess(response.message || "Canvas sent successfully!");

        await Promise.all([
          // fetchLiveDisplay(),
          fetchLUTData(),
          fetchDeviceCanvas(),
        ]);

        clearMessages();
        return { success: true, data: response };
      }

      const errorMsg = response.message || "Failed to send canvas";
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

  // Stop current content
  const stopCurrentContent = async (
    deviceId: string,
    contentId: number
  ) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await stopContent(deviceId, contentId);

      if (response?.success) {
        setSuccess(response.message || "Content stopped successfully");

        await Promise.all([
          // fetchLiveDisplay(),
          fetchLUTData(),
        
          fetchDeviceCanvas(),
        ]);

        clearMessages();
        return { success: true, data: response };
      }

      const errorMsg = response?.message || "Failed to stop content";
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

    const stopCurrentContentCanvas = async (
    deviceId: string,
    contentId: number
  ) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await stopContentCanvas(deviceId, contentId);

      if (response?.success) {
        setSuccess(response.message || "Content stopped successfully");

        await Promise.all([
          // fetchLiveDisplay(),
          fetchLUTData(),
        
          fetchDeviceCanvas(),
        ]);

        clearMessages();
        return { success: true, data: response };
      }

      const errorMsg = response?.message || "Failed to stop content";
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
  // Refresh all data
  const refreshAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchLUTData(),
        // fetchLiveDisplay(),

        fetchDeviceCanvas(),
      ]);
    } catch (err) {
      console.error("Error refreshing data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Screen layout label helper
  const getScreenLayoutLabel = useCallback(
    (value: string) =>
      lutData.screenLayouts.find((l) => l.value === value)?.label || value,
    [lutData.screenLayouts]
  );

  // Initial load
  useEffect(() => {
    refreshAllData();
  }, []);

  return {
    loading,
    error,
    success,

    lutData,
    liveDisplays,

    // Normal content display
    deviceDisplay,
  

    // Canvas display
    deviceCanvas,
    fetchDeviceCanvas,

    fetchLUTData,
    // fetchLiveDisplay,
    refreshAllData,
    
    sendContentToDevice,
    sendCanvasToDevice,
    // stopCurrentContent,
   stopCurrentContentCanvas,
    getScreenLayoutLabel,

    setError,
    setSuccess,
  };
};
