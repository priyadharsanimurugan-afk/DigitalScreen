import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
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

 const [lutData, setLutData] = useState<ContentLUT>({
  imageList: [],
  screenLayouts: [],
  deviceList: [],
  imageUrl: "",   // ← add whatever the type requires
});
  // ✅ NEW
  const [deviceDisplay, setDeviceDisplay] = useState<DeviceDisplay | null>(null);

  const [liveDisplays, setLiveDisplays] = useState<LiveDisplay[]>([]);

  // ================= ERROR HANDLER =================
  const handleError = (error: any) => {
    const apiError = error?.response?.data;

    if (apiError?.errors) {
      const firstKey = Object.keys(apiError.errors)[0];
      Alert.alert("Validation Error", apiError.errors[firstKey][0]);
      return { success: false };
    }

    const msg =
      apiError?.message ||
      apiError?.title ||
      error?.message ||
      "Something went wrong";

    Alert.alert("Error", msg);
    return { success: false };
  };

  // ================= LUT =================
// In useContent hook, update fetchLUTData:
const fetchLUTData = async () => {
  try {
    setLoading(true);
    const data = await getContentLUT();

    setLutData({
      imageList: data.imageList || [],
      screenLayouts: data.screenLayouts || [],  // ✅ FIX HERE
      deviceList: data.deviceList || [],
      imageUrl: data.imageUrl || "",
    });

    return data;
  } catch (error) {
    handleError(error);
    return null;
  } finally {
    setLoading(false);
  }
};

  // ================= DEVICE DISPLAY (TV) =================
  const fetchDeviceDisplay = async () => {
    try {
      const data = await getDeviceDisplay();
      setDeviceDisplay(data);
      return data;
    } catch (error) {
      setDeviceDisplay(null);
      return null;
    }
  };

  // ================= LIVE DISPLAY (ADMIN) =================
  const fetchLiveDisplay = async () => {
    try {
      const data = await getLiveDisplay();
      setLiveDisplays(Array.isArray(data) ? data : []);
      return data;
    } catch {
      setLiveDisplays([]);
      return [];
    }
  };

  // ================= SEND =================
  const sendContentToDevice = async (data: SendContentRequest) => {
    try {
      setLoading(true);
      const response = await sendContent(data);

      if (response.success) {
        Alert.alert("✅ Success", response.message || "Content sent!");
        await fetchLiveDisplay();
        return { success: true };
      }

      Alert.alert("Failed", response.message || "Failed to send");
      return { success: false };
    } catch (error: any) {
      return handleError(error);
    } finally {
      setLoading(false);
    }
  };

  // ================= STOP =================
  const stopCurrentContent = async (
    deviceId: string,
    contentId: number
  ) => {
    try {
      setLoading(true);

      const response = await stopContent(deviceId, contentId);

      if (response.success) {
        Alert.alert("⏹ Stopped", response.message || "Stopped");
        await fetchLiveDisplay();
        return { success: true };
      }

      return { success: false };
    } catch (error) {
      return handleError(error);
    } finally {
      setLoading(false);
    }
  };

  // ================= REFRESH =================
  const refreshAllData = async () => {
    await Promise.all([
      fetchLUTData(),
      fetchLiveDisplay(),
      fetchDeviceDisplay(), // ✅ added
    ]);
  };

  // ================= LABEL HELPERS =================
  const getScreenLayoutLabel = useCallback(
    (value: string) =>
      lutData.screenLayouts.find((l) => l.value === value)?.label || value,
    [lutData.screenLayouts]
  );

  // ================= INIT =================
  useEffect(() => {
    refreshAllData();
  }, []);

  return {
    loading,

    lutData,

    // ✅ NEW
    deviceDisplay,

    liveDisplays,

    fetchLUTData,
    fetchLiveDisplay,
    fetchDeviceDisplay,

    sendContentToDevice,
    stopCurrentContent,
    refreshAllData,

    getScreenLayoutLabel,
  };
};