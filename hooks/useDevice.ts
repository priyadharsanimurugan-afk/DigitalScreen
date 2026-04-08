// hooks/useDevices.ts
import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
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

  //
  // 🔥 COMMON ERROR HANDLER
  //
  const handleError = (error: any) => {
    const apiError = error?.response?.data;

    let message = "Something went wrong";

    if (apiError?.errors) {
      return {
        success: false,
        errors: apiError.errors,
        message: "Validation failed",
      };
    } else if (apiError?.message) {
      message = apiError.message;
    } else if (typeof apiError === "string") {
      message = apiError;
    }

    Alert.alert("Error", message);
    return { success: false, message };
  };

  //
  // 📝 CREATE DEVICE
  //
  const addDevice = async (data: CreateDeviceRequest) => {
    try {
      setLoading(true);
      await createDevice(data);
      await fetchDevices();
      await fetchStatusSummary();
      Alert.alert("Success", "Device created successfully");
      return { success: true };
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
      const data = await getDevices();
      setDevices(data);
      return data;
    } catch (error) {
      handleError(error);
      return [];
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
      await updateDevice(deviceId, data);
      await fetchDevices();
      await fetchStatusSummary();
      Alert.alert("Success", "Device updated successfully");
      return { success: true };
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
      await deleteDevice(deviceId);

      // ✅ FIX: filter using deviceId (not id)
      setDevices((prev) => prev.filter((device) => device.deviceId !== deviceId));
      setLiveDevices((prev) => prev.filter((device) => device.deviceId !== deviceId));

      await fetchStatusSummary();
      Alert.alert("Success", "Device deleted successfully");
      return { success: true };
    } catch (error) {
      handleError(error);
      return { success: false };
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
      const data = await getLiveDevices();
      setLiveDevices(data);
      return data;
    } catch (error) {
      handleError(error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  //
  // 📊 GET STATUS SUMMARY
  //
  const fetchStatusSummary = async () => {
    try {
      const data = await getDeviceStatusSummary();
      setStatusSummary(data);
      return data;
    } catch (error) {
      handleError(error);
      return { totalDevices: 0, liveCount: 0, onlineCount: 0, offlineCount: 0 };
    }
  };

  //
  // 🔍 GET SINGLE DEVICE BY ID
  //
  const getDeviceById = useCallback(
    (deviceId: string): Device | undefined => {
      return devices.find((device) => device.deviceId === deviceId); // ✅ FIX: deviceId
    },
    [devices]
  );

  //
  // 📈 GET STATISTICS
  //
  const getStatistics = useCallback(() => {
    const onlineDevices = devices.filter((d) => d.status === "online");
    const offlineDevices = devices.filter((d) => d.status === "offline");
    // ✅ FIX: support both isLive boolean and currentDisplay string from API
    const liveDevicesCount = devices.filter(
      (d) => d.isLive || d.currentDisplay === "yes"
    ).length;

    return {
      total: devices.length,
      online: onlineDevices.length,
      offline: offlineDevices.length,
      live: liveDevicesCount,
      onlinePercentage:
        devices.length > 0 ? (onlineDevices.length / devices.length) * 100 : 0,
      offlinePercentage:
        devices.length > 0 ? (offlineDevices.length / devices.length) * 100 : 0,
      livePercentage:
        devices.length > 0 ? (liveDevicesCount / devices.length) * 100 : 0,
    };
  }, [devices]);

  //
  // 🔄 REFRESH ALL DATA
  //
  const refreshAllData = async () => {
    await Promise.all([fetchDevices(), fetchLiveDevices(), fetchStatusSummary()]);
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