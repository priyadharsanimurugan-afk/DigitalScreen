// hooks/useDashboard.ts
import { useState, useEffect, useCallback } from "react";
import {
  getDashboardSummary,
  getLatestLiveContent,
  getRecentImages,
  DashboardSummary,
  LatestLiveContent,
  RecentImage,
} from "@/services/dashboard";

export const useDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary>({
    liveScreenCount: 0,
    onlineDeviceCount: 0,
    offlineDeviceCount: 0,
  });
  const [latestLiveContent, setLatestLiveContent] = useState<LatestLiveContent[]>([]);
  const [recentImages, setRecentImages] = useState<RecentImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      const data = await getDashboardSummary();
      setSummary(data);
      return data;
    } catch (error) {
      return null;
    }
  };

  const fetchLatestLiveContent = async () => {
    try {
      const data = await getLatestLiveContent();
      setLatestLiveContent(Array.isArray(data) ? data : data ? [data as any] : []);
      return data;
    } catch (error) {
      setLatestLiveContent([]);
      return [];
    }
  };

  const fetchRecentImages = async () => {
    try {
      const data = await getRecentImages();
     setRecentImages(Array.isArray(data) ? data : []);

      return data;
    } catch (error) {
      setRecentImages([]);
      return [];
    }
  };

  const refreshAllData = async () => {
    setLoading(true);
    await Promise.all([fetchSummary(), fetchLatestLiveContent(), fetchRecentImages()]);
    setLoading(false);
  };

  const getStatistics = useCallback(() => {
    const totalDevices = summary.onlineDeviceCount + summary.offlineDeviceCount;
    return {
      liveScreens: summary.liveScreenCount,
      onlineDevices: summary.onlineDeviceCount,
      offlineDevices: summary.offlineDeviceCount,
      totalDevices,
    };
  }, [summary]);

  useEffect(() => {
    refreshAllData();
  }, []);

  return {
    loading,
    summary,
    latestLiveContent,
    recentImages,
    error,
    setError,
    fetchSummary,
    fetchLatestLiveContent,
    fetchRecentImages,
    refreshAllData,
    getStatistics,
  };
};