// hooks/useDevices.ts
import { useState, useEffect, useCallback } from "react";
import {
  createDevice,
  getDevices,
  updateDevice,
  deleteDevice,
  getLiveDevices,
  getDeviceStatusSummary,
  Device,
  CreateDeviceRequest,
  DeviceStatusSummary,
} from "@/services/device";

export const useDevices = () => {
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [liveDevices, setLiveDevices] = useState<Device[]>([]);
  const [statusSummary, setStatusSummary] = useState<DeviceStatusSummary>({
    totalDevices: 0,
    liveCount: 0,
    onlineCount: 0,
    offlineCount: 0,
  });
  const [error, setError] = useState<string | null>(null);

  //
  // 🔥 COMMON ERROR HANDLER (No Alerts)
  //
  const handleError = (error: any) => {
    const apiError = error?.response?.data;

    let message = "Something went wrong";
    let errors = null;

    if (apiError?.errors) {
      errors = apiError.errors;
      message = "Validation failed";
    } else if (apiError?.message) {
      message = apiError.message;
    } else if (typeof apiError === "string") {
      message = apiError;
    } else if (error?.message) {
      message = error.message;
    }

    setError(message);
    
    return {
      success: false,
      message,
      errors,
    };
  };

  //
  // Clear error
  //
  const clearError = () => {
    setError(null);
  };

  //
  // 📝 CREATE DEVICE
  //
  const addDevice = async (data: CreateDeviceRequest) => {
    try {
      setLoading(true);
      setError(null);
     const newDevice = await createDevice(data);

setDevices(prev => [newDevice, ...prev]); // 🔥 instant update
await fetchStatusSummary();

      await fetchStatusSummary();
      return { 
        success: true, 
        message: "Device created successfully" 
      };
    } catch (error: any) {
      return handleError(error);
    } finally {
      setLoading(false);
    }
  };

  //
  // 📥 GET ALL DEVICES
  //
  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDevices();
      // Ensure data is an array and filter out any null values
      const safeData = Array.isArray(data) ? data.filter(device => device !== null && device !== undefined) : [];
      setDevices(safeData);
      return { success: true, data: safeData };
    } catch (error) {
      const errorResult = handleError(error);
      setDevices([]);
      return errorResult;
    } finally {
      setLoading(false);
    }
  };

  //
  // ✏️ UPDATE DEVICE
  //
  const editDevice = async (deviceId: string, data: Partial<CreateDeviceRequest>) => {
    try {
      setLoading(true);
      setError(null);
    const updated = await updateDevice(deviceId, data);

setDevices(prev =>
  prev.map(d =>
    d.deviceId === deviceId ? { ...d, ...data } : d
  )
);

await fetchStatusSummary();

      await fetchStatusSummary();
      return { 
        success: true, 
        message: "Device updated successfully" 
      };
    } catch (error) {
      return handleError(error);
    } finally {
      setLoading(false);
    }
  };

  //
  // 🗑️ DELETE DEVICE
  //
  const removeDevice = async (deviceId: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteDevice(deviceId);

      // Filter using deviceId
      setDevices((prev) => prev.filter((device) => device.deviceId !== deviceId));
      setLiveDevices((prev) => prev.filter((device) => device.deviceId !== deviceId));

      await fetchStatusSummary();
      return { 
        success: true, 
        message: "Device deleted successfully" 
      };
    } catch (error) {
      return handleError(error);
    } finally {
      setLoading(false);
    }
  };

  //
  // 🔴 GET LIVE DEVICES
  //
  const fetchLiveDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLiveDevices();
      const safeData = Array.isArray(data) ? data.filter(device => device !== null && device !== undefined) : [];
      setLiveDevices(safeData);
      return { success: true, data: safeData };
    } catch (error) {
      const errorResult = handleError(error);
      setLiveDevices([]);
      return errorResult;
    } finally {
      setLoading(false);
    }
  };

  //
  // 📊 GET STATUS SUMMARY
  //
  const fetchStatusSummary = async () => {
    try {
      setError(null);
      const data = await getDeviceStatusSummary();
      const safeData = data || { totalDevices: 0, liveCount: 0, onlineCount: 0, offlineCount: 0 };
      setStatusSummary(safeData);
      return { success: true, data: safeData };
    } catch (error) {
      const errorResult = handleError(error);
      const defaultSummary = { totalDevices: 0, liveCount: 0, onlineCount: 0, offlineCount: 0 };
      setStatusSummary(defaultSummary);
      return { ...errorResult, data: defaultSummary };
    }
  };

  //
  // 🔍 GET SINGLE DEVICE BY ID
  //
  const getDeviceById = useCallback(
    (deviceId: string): Device | undefined => {
      if (!devices || !Array.isArray(devices)) return undefined;
      return devices.find((device) => device?.deviceId === deviceId);
    },
    [devices]
  );

  //
  // 📈 GET STATISTICS (Fixed - No null errors)
  //
  const getStatistics = useCallback(() => {
    // Guard against null/undefined devices
    if (!devices || !Array.isArray(devices)) {
      return {
        total: 0,
        online: 0,
        offline: 0,
        live: 0,
        onlinePercentage: 0,
        offlinePercentage: 0,
        livePercentage: 0,
      };
    }

    // Filter out any null/undefined devices
    const validDevices = devices.filter(device => device !== null && device !== undefined);
    
    const onlineDevices = validDevices.filter((d) => d?.status === "online");
    const offlineDevices = validDevices.filter((d) => d?.status === "offline");
    
    // Support both isLive boolean and currentDisplay string from API
    const liveDevicesCount = validDevices.filter(
      (d) => d?.isLive === true || d?.currentDisplay === "yes"
    ).length;

    return {
      total: validDevices.length,
      online: onlineDevices.length,
      offline: offlineDevices.length,
      live: liveDevicesCount,
      onlinePercentage: validDevices.length > 0 ? (onlineDevices.length / validDevices.length) * 100 : 0,
      offlinePercentage: validDevices.length > 0 ? (offlineDevices.length / validDevices.length) * 100 : 0,
      livePercentage: validDevices.length > 0 ? (liveDevicesCount / validDevices.length) * 100 : 0,
    };
  }, [devices]);

  //
  // 🔄 REFRESH ALL DATA
  //
  const refreshAllData = async () => {
    setError(null);
    const results = await Promise.all([
      fetchDevices(),
      fetchLiveDevices(),
      fetchStatusSummary()
    ]);
    
    // Check if any request failed
    const hasError = results.some(result => !result.success);
    if (hasError) {
      return { success: false, message: "Some data failed to load" };
    }
    
    return { success: true, message: "Data refreshed successfully" };
  };

  //
  // 🎯 INITIAL LOAD
  //
  useEffect(() => {
    refreshAllData();
  }, []);

  return {
    devices,
    liveDevices,
    statusSummary,
    loading,
    error,
    clearError,
    addDevice,
    fetchDevices,
    editDevice,
    removeDevice,
    fetchLiveDevices,
    fetchStatusSummary,
    getDeviceById,
    getStatistics,
    refreshAllData,
  };
};