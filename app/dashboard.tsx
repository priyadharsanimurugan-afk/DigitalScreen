// app/index.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, Image, useWindowDimensions,
} from "react-native";
import {
  useFonts, Poppins_400Regular, Poppins_500Medium,
  Poppins_600SemiBold, Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import ResponsiveLayout from "@/components/responsiveLayout";
import { useDashboard } from "@/hooks/useDashboard";
import { useContent } from "@/hooks/useContent";
import { getContentLUT, stopContentCanvas } from "@/services/content";

// ─── THEME ────────────────────────────────────────────────────────────────────
const C = {
  primary:      "#1E3A8A",
  primaryLight: "#3B5FC0",
  primaryGhost: "#EEF2FF",
  primaryDeep:  "#0F2057",
  accent:       "#6366F1",
  accentLight:  "#EEF2FF",
  brownMid:     "#A16207",
  brownLight:   "#FEF3C7",
  bg:           "#F0F4FF",
  surface:      "#FFFFFF",
  surfaceAlt:   "#F8FAFC",
  glass:        "rgba(255,255,255,0.85)",
  text:         "#0F172A",
  textMid:      "#334155",
  textLight:    "#64748B",
  border:       "#E2E8F0",
  borderLight:  "#F1F5F9",
  success:      "#059669",
  successBg:    "#D1FAE5",
  danger:       "#DC2626",
  dangerBg:     "#FEE2E2",
  gold:         "#F59E0B",
  goldBg:       "#FEF3C7",
} as const;

const MAX_W = 1500;
const BP    = { mobile: 480, tablet: 768, desktop: 1024 };

// ─── TYPE HELPERS ─────────────────────────────────────────────────────────────
interface CanvasItem {
  slotIndex: number;
  imageId: number;
  imageUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pinned: boolean;
  zIndex: number;
  resizeMode: string;
}

export interface CanvasLive {
  deviceName: string;
  displayName: string;
  id: number;
  title?: string;
  description?: string;
  screenWidth?: number;
  screenHeight?: number;
  screenLayout?: string;
  deviceId?: string | any;
  items?: CanvasItem[];
}

interface ImageItem {
  imageId: number;
  imageurl?: string;
  images?: string;
  imageName?: string;
  createdAt?: string;
}

// ─── TV MOCKUP COMPONENT ─────────────────────────────────────────────────────
const TVMockup = ({ 
  items, 
  screenWidth = 1920, 
  screenHeight = 1080,
  isMobile 
}: { 
  items: CanvasItem[]; 
  screenWidth?: number; 
  screenHeight?: number;
  isMobile: boolean;
}) => {
  const tvWidth = isMobile ? 200 : 240;
  const tvHeight = tvWidth * 0.65;
  const scale = tvWidth / screenWidth;
  
  const slots = [...new Set(items.map(i => i.slotIndex))].sort((a, b) => a - b);

  return (
    <View style={{
      width: tvWidth,
      height: tvHeight,
      backgroundColor: "#0A0A0A",
      borderRadius: 12,
      borderWidth: 3,
      borderColor: "#1A1A1A",
      position: "relative",
      overflow: "hidden",
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 8,
    }}>
      <View style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.05)",
        borderRadius: 9,
        zIndex: 10,
        pointerEvents: "none",
      }} />
      
      {slots.map((slotIdx) => {
        const slotItem = items.find(i => i.slotIndex === slotIdx);
        if (!slotItem) return null;
        return (
          <View key={slotIdx} style={{
            position: "absolute",
            left: slotItem.x * scale,
            top: slotItem.y * scale,
            width: slotItem.width * scale,
            height: slotItem.height * scale,
            borderWidth: 0.5,
            borderColor: "rgba(255,255,255,0.1)",
          }}>
            {slotItem.imageUrl ? (
              <Image
                source={{ uri: slotItem.imageUrl }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.05)",
                justifyContent: "center",
                alignItems: "center",
              }}>
                <Ionicons name="image-outline" size={12} color="rgba(255,255,255,0.3)" />
              </View>
            )}
          </View>
        );
      })}
      
      <View style={{
        position: "absolute",
        bottom: -8,
        alignSelf: "center",
        width: tvWidth * 0.3,
        height: 6,
        backgroundColor: "#1A1A1A",
        borderBottomLeftRadius: 3,
        borderBottomRightRadius: 3,
      }} />
      
      <View style={{
        position: "absolute",
        bottom: 3,
        right: 8,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#16A34A",
        zIndex: 11,
      }} />
    </View>
  );
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────
const StatCard = ({
  icon, value, label,
  iconBg, iconColor,
  cardBg, textColor, labelColor,
  isMobile,
}: any) => (
  <View style={{
    flex: 1,
    minWidth: isMobile ? "46%" : 120,
    backgroundColor: cardBg ?? C.surface,
    borderRadius: 18,
    padding: isMobile ? 14 : 18,
    borderWidth: 1,
    borderColor: cardBg ? "transparent" : C.border,
    shadowColor: C.primary,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: 12,
    overflow: "hidden",
  }}>
    <View style={{
      position: "absolute", top: -20, right: -20,
      width: 70, height: 70, borderRadius: 35,
      backgroundColor: cardBg ? "rgba(255,255,255,0.08)" : C.primaryGhost,
    }} />
    <View style={{
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: iconBg,
      justifyContent: "center", alignItems: "center",
    }}>
      <Ionicons name={icon} size={19} color={iconColor} />
    </View>
    <View>
      <Text style={{
        fontSize: isMobile ? 26 : 30,
        fontFamily: "Poppins_700Bold",
        color: textColor ?? C.text,
        lineHeight: isMobile ? 30 : 34,
      }}>
        {value}
      </Text>
      <Text style={{
        fontSize: 11, fontFamily: "Poppins_500Medium",
        color: labelColor ?? C.textLight, marginTop: 2,
      }}>
        {label}
      </Text>
    </View>
  </View>
);

// ─── LIVE DISPLAY CARD ────────────────────────────────────────────────────────
const LiveDisplayCard = ({
  live,
  isMobile,
  onEdit,
  onStop,
}: {
  live: CanvasLive;
  imageList: ImageItem[];
  isMobile: boolean;
  onEdit: (l: CanvasLive) => void;
  onStop: (id: number, deviceId: string, deviceName: string) => void;
}) => {
  const allItems: CanvasItem[] = live.items ?? [];

  const uniqueImageIds = [
    ...new Set(allItems.map((item) => item.imageId)),
  ];

  const slotCount = [
    ...new Set(allItems.map((item) => item.slotIndex)),
  ].length;

  return (
    <View
      style={{
        backgroundColor: C.surface,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: C.border,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 5,
      }}
    >
      {/* Top Accent Line */}
      <View
        style={{
          height: 5,
          backgroundColor: C.primary,
        }}
      />

      <View
        style={{
          padding: isMobile ? 14 : 18,
          gap: 16,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          {/* Left Info */}
          <View style={{ flex: 1 }}>
            {/* Display Name */}
            <Text
              numberOfLines={1}
              style={{
                fontSize: isMobile ? 15 : 17,
                fontFamily: "Poppins_700Bold",
                color: C.text,
              }}
            >
              {live.displayName || "Canvas Display"}
            </Text>

            {/* Device Name */}
            <Text
              numberOfLines={1}
              style={{
                fontSize: 12,
                fontFamily: "Poppins_500Medium",
                color: C.primary,
                marginTop: 3,
              }}
            >
              {live.deviceName || "Unknown Device"}
            </Text>

            {/* Summary */}
            <Text
              style={{
                fontSize: 11,
                fontFamily: "Poppins_400Regular",
                color: C.textLight,
                marginTop: 6,
                lineHeight: 18,
              }}
            >
              {slotCount} Slots • {uniqueImageIds.length} Images •{" "}
              {live.screenWidth || 1920} × {live.screenHeight || 1080}
            </Text>
          </View>

          {/* LIVE Badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: "#DCFCE7",
              borderColor: "#BBF7D0",
              borderWidth: 1,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 999,
            }}
          >
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 10,
                backgroundColor: "#16A34A",
              }}
            />
            <Text
              style={{
                fontSize: 10,
                fontFamily: "Poppins_700Bold",
                color: "#15803D",
              }}
            >
              LIVE
            </Text>
          </View>
        </View>

        {/* TV Preview */}
{/* TV Preview */}
{allItems.length > 0 ? (
  <View
    style={{
      alignItems: "center",
      paddingVertical: 8,
      marginTop: 4,
    }}
  >
    {/* Full TV Design */}
    <View
      style={{
        alignItems: "center",
      }}
    >
      {/* TV Screen */}
      <View
        style={{
          backgroundColor: "#0A0A0A",
          borderRadius: 18,
          padding: 8,
          borderWidth: 3,
          borderColor: "#1A1A1A",
          shadowColor: "#000",
          shadowOpacity: 0.28,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        }}
      >
        <TVMockup
          items={allItems}
          screenWidth={live.screenWidth || 1920}
          screenHeight={live.screenHeight || 1080}
          isMobile={isMobile}
        />
      </View>

      {/* TV Stand Neck */}
      <View
        style={{
          width: 24,
          height: 20,
          backgroundColor: "#111827",
          marginTop: -2,
          borderBottomLeftRadius: 6,
          borderBottomRightRadius: 6,
        }}
      />

      {/* TV Bottom Base */}
      <View
        style={{
          width: isMobile ? 90 : 120,
          height: 10,
          backgroundColor: "#111827",
          borderRadius: 20,
          marginTop: 4,
          shadowColor: "#000",
          shadowOpacity: 0.18,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
          elevation: 4,
        }}
      />

      {/* Reflection Shadow */}
      <View
        style={{
          width: isMobile ? 130 : 180,
          height: 14,
          backgroundColor: "rgba(0,0,0,0.05)",
          borderRadius: 50,
          marginTop: 6,
        }}
      />
    </View>
  </View>
) : (
  <View
    style={{
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 24,
      backgroundColor: C.surfaceAlt,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.border,
    }}
  >
    <Ionicons
      name="tv-outline"
      size={34}
      color={C.textLight}
    />

    <Text
      style={{
        marginTop: 10,
        fontSize: 12,
        fontFamily: "Poppins_500Medium",
        color: C.textLight,
      }}
    >
      No content assigned yet
    </Text>
  </View>
)}


        {/* Divider */}
        <View
          style={{
            height: 1,
            backgroundColor: C.border,
          }}
        />

        {/* Action Buttons */}
        <View
          style={{
            flexDirection: "row",
            gap: 10,
          }}
        >
          {/* Edit Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onEdit(live)}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 12,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: C.primary,
              backgroundColor: C.primaryGhost,
            }}
          >
            <Ionicons
              name="create-outline"
              size={16}
              color={C.primary}
            />

            <Text
              style={{
                fontSize: 12,
                fontFamily: "Poppins_600SemiBold",
                color: C.primary,
              }}
            >
              Edit Layout
            </Text>
          </TouchableOpacity>

          {/* Stop Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              onStop(
                live.id,
                live.deviceId ?? "canvas",
                live.displayName ?? "Canvas Display"
              )
            }
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 12,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: "#FECACA",
              backgroundColor: "#FEF2F2",
            }}
          >
            <Ionicons
              name="stop-circle-outline"
              size={16}
              color={C.danger}
            />

            <Text
              style={{
                fontSize: 12,
                fontFamily: "Poppins_600SemiBold",
                color: C.danger,
              }}
            >
              Stop Display
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};


// ─── STOP CONFIRM MODAL ───────────────────────────────────────────────────────
const StopModal = ({
  visible, onCancel, onConfirm, deviceName,
}: {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  deviceName?: string;
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 }}>
      <View style={{
        backgroundColor: C.surface, borderRadius: 24, padding: 28,
        width: "100%", maxWidth: 370,
        shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 30, elevation: 20,
      }}>
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <View style={{
            width: 62, height: 62, borderRadius: 31,
            backgroundColor: "#FEF2F2", justifyContent: "center", alignItems: "center", marginBottom: 14,
            borderWidth: 2, borderColor: "#FECACA",
          }}>
            <Ionicons name="stop-circle-outline" size={32} color={C.danger} />
          </View>
          <Text style={{ fontSize: 18, fontFamily: "Poppins_700Bold", color: C.text }}>
            Stop Canvas Content?
          </Text>
          {deviceName && (
            <Text style={{ fontSize: 12, fontFamily: "Poppins_600SemiBold", color: C.primary, marginTop: 4 }}>
              {deviceName}
            </Text>
          )}
          <Text style={{ fontSize: 13, fontFamily: "Poppins_400Regular", color: C.textLight, textAlign: "center", marginTop: 10, lineHeight: 21 }}>
            This will clear the canvas display.{"\n"}This action cannot be undone.
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity onPress={onCancel} style={{
            flex: 1, paddingVertical: 14, borderRadius: 13,
            borderWidth: 1.5, borderColor: C.border, alignItems: "center",
            backgroundColor: C.surfaceAlt,
          }}>
            <Text style={{ fontSize: 14, fontFamily: "Poppins_600SemiBold", color: C.textMid }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onConfirm} style={{
            flex: 1, paddingVertical: 14, borderRadius: 13,
            backgroundColor: C.danger,
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
            shadowColor: C.danger, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
          }}>
            <Ionicons name="stop" size={15} color="#fff" />
            <Text style={{ fontSize: 14, fontFamily: "Poppins_700Bold", color: "#fff" }}>Yes, Stop</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// ─── IMAGE LIGHTBOX ───────────────────────────────────────────────────────────
const ImageLightbox = ({ image, onClose }: { image: ImageItem | null; onClose: () => void }) => {
  const imgUrl = image?.imageurl ?? image?.images ?? null;
  return (
    <Modal visible={!!image} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", alignItems: "center" }}>
        <TouchableOpacity onPress={onClose} style={{
          position: "absolute", top: 48, right: 20, zIndex: 10,
          backgroundColor: "rgba(255,255,255,0.14)", borderRadius: 99, padding: 12,
          borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
        }}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>
        {imgUrl && (
          <Image source={{ uri: imgUrl }} style={{ width: "92%", height: "70%" }} resizeMode="contain" />
        )}
        {image?.imageName && (
          <View style={{ marginTop: 18, flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="image-outline" size={13} color="rgba(255,255,255,0.4)" />
            <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: "rgba(255,255,255,0.6)" }}>
              {image.imageName}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

// ─── DASHBOARD SCREEN ─────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { width: sw } = useWindowDimensions();
  const router = useRouter();
  const [loaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });

  const { recentImages, loading: dashLoading, refreshAllData: refreshDash, getStatistics } = useDashboard();
  const {
    deviceCanvas,
    deviceDisplay,
    loading: contentLoading,
    // stopCurrentContent,
    fetchDeviceCanvas,
  } = useContent();

  const [refreshing, setRefreshing] = useState(false);
  const [stopVisible, setStopVisible] = useState(false);
  const [stopPayload, setStopPayload] = useState<{ contentId: number; deviceId: string; deviceName: string } | null>(null);
  const [lightboxImg, setLightboxImg] = useState<ImageItem | null>(null);

  const isMobile = sw < BP.mobile;
  const isTablet = sw >= BP.mobile && sw < BP.desktop;
  const isDesktop = sw >= BP.desktop;
  const isLoading = dashLoading || contentLoading;

  const liveDisplays = useMemo<CanvasLive[]>(() => {
    return Array.isArray(deviceCanvas)
      ? deviceCanvas.filter(item => (item.items?.length ?? 0) > 0)
      : [];
  }, [deviceCanvas]);

  const imageList: ImageItem[] = useMemo(() => {
    const display = deviceDisplay as any;
    if (Array.isArray(display?.data?.images)) return display.data.images;
    if (Array.isArray(display?.data?.imageList)) return display.data.imageList;
    if (Array.isArray(display?.images)) return display.images;
    return [];
  }, [deviceDisplay]);

  const liveCols = isDesktop ? 2 : 1;
  const uploadCols = isMobile ? 3 : isTablet ? 4 : 6;
  const pad = isMobile ? 14 : isTablet ? 18 : 24;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshDash(), fetchDeviceCanvas()]);
    setRefreshing(false);
    Toast.show({ type: "info", text1: "Refreshed", visibilityTime: 1800 });
  };

  const handleStop = (contentId: number, deviceId: string, deviceName: string) => {
    setStopPayload({ contentId, deviceId, deviceName });
    setStopVisible(true);
  };

  const handleConfirmStop = async () => {
    if (!stopPayload) return;
    setStopVisible(false);
    const { deviceId, contentId, deviceName } = stopPayload;
    try {
      const r = await stopContentCanvas(deviceId, contentId);
      if (r.success) {
        setStopPayload(null);
        await fetchDeviceCanvas();
        Toast.show({ type: "success", text1: "Stopped", text2: deviceName, visibilityTime: 2000 });
      } else {
        Toast.show({ type: "error", text1: "Error", text2: (r as any).error || "Failed", visibilityTime: 2000 });
      }
    } catch {
      Toast.show({ type: "error", text1: "Error", text2: "Failed to stop", visibilityTime: 2000 });
    }
  };

  const handleEdit = (live: CanvasLive) => {
    // Navigate to layout studio with content data
    router.push({
      pathname: "/layout-studio",
      params: {
        editMode: "true",
        contentId: live.id,
        deviceId: live.deviceId,
        title: live.title || "Canvas Display",
        screenWidth: live.screenWidth || 1920,
        screenHeight: live.screenHeight || 1080,
        items: JSON.stringify(live.items || [])
      }
    });
  };

  const stats = getStatistics();

  if (!loaded) return null;

  return (
    <ResponsiveLayout>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <StopModal
          visible={stopVisible}
          onCancel={() => setStopVisible(false)}
          onConfirm={handleConfirmStop}
          deviceName={stopPayload?.deviceName}
        />
        <ImageLightbox image={lightboxImg} onClose={() => setLightboxImg(null)} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
          contentContainerStyle={{ flexGrow: 1 }}>

          <View style={{
            maxWidth: MAX_W, width: "100%", alignSelf: "center",
            padding: pad, paddingTop: isMobile ? 16 : 26,
            gap: isMobile ? 14 : 20,
          }}>

            {/* HEADER */}
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <View style={{ flex: 1, gap: 3 }}>
                <View style={{
                  flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start",
                  backgroundColor: C.brownLight, paddingHorizontal: 10, paddingVertical: 4,
                  borderRadius: 99, marginBottom: 4, borderWidth: 1, borderColor: C.brownMid + "44",
                }}>
                  <Ionicons name="tv" size={11} color={C.brownMid} />
                  <Text style={{ fontSize: 10, fontFamily: "Poppins_600SemiBold", color: C.brownMid, letterSpacing: 0.5, textTransform: "uppercase" }}>
                    Signage Control
                  </Text>
                </View>
                <Text style={{ fontSize: isMobile ? 24 : 30, fontFamily: "Poppins_700Bold", color: C.text, lineHeight: isMobile ? 30 : 38 }}>
                  Dashboard
                </Text>
                <Text style={{ fontSize: 12, fontFamily: "Poppins_400Regular", color: C.textLight }}>
                  Digital Notice Board Management
                </Text>
              </View>

              <View style={{ alignItems: "flex-end", gap: 8 }}>
                <TouchableOpacity
                  onPress={() => router.push("/layout-studio")}
                  activeOpacity={0.85}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 7,
                    paddingVertical: isMobile ? 10 : 12,
                    paddingHorizontal: isMobile ? 14 : 20,
                    borderRadius: 14, backgroundColor: C.primary,
                    shadowColor: C.primary, shadowOpacity: 0.3, shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 }, elevation: 6,
                  }}>
                  <Ionicons name="add-circle" size={16} color="#fff" />
                  {!isMobile && (
                    <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 13, color: "#fff" }}>
                     Send to Tv
                    </Text>
                  )}
                  <Ionicons name="arrow-forward" size={13} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  {isLoading && <ActivityIndicator color={C.primary} size="small" />}
                  <View style={{
                    flexDirection: "row", alignItems: "center", gap: 5,
                    backgroundColor: "#DCFCE7", paddingHorizontal: 8, paddingVertical: 4,
                    borderRadius: 99, borderWidth: 1, borderColor: "#BBF7D0",
                  }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#16A34A" }} />
                    <Text style={{ fontSize: 10, fontFamily: "Poppins_700Bold", color: "#15803D" }}>System Live</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* STAT CARDS */}
            <View style={{ flexDirection: "row", flexWrap: isMobile ? "wrap" : "nowrap", gap: isMobile ? 8 : 12 }}>
              <StatCard
                icon="radio-outline" value={liveDisplays.length} label="Live Canvas"
                iconBg="rgba(255,255,255,0.2)" iconColor="#fff"
                cardBg={C.primary} textColor="#fff" labelColor="rgba(255,255,255,0.75)"
                isMobile={isMobile}
              />
              <StatCard
                icon="checkmark-circle-outline" value={stats.onlineDevices} label="Online"
                iconBg={C.successBg} iconColor={C.success}
                isMobile={isMobile}
              />
              <StatCard
                icon="close-circle-outline" value={stats.offlineDevices} label="Offline"
                iconBg={C.dangerBg} iconColor={C.danger}
                isMobile={isMobile}
              />
              {!isMobile && (
                <StatCard
                  icon="tv-outline" value={stats.totalDevices} label="Total Devices"
                  iconBg={C.brownLight} iconColor={C.brownMid}
                  isMobile={false}
                />
              )}
            </View>

            {/* CANVAS LIVE DISPLAYS */}
            <View style={section}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <View style={{
                  width: 34, height: 34, borderRadius: 10,
                  backgroundColor: "#FEF2F2", justifyContent: "center", alignItems: "center",
                  borderWidth: 1, borderColor: "#FECACA",
                }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.danger }} />
                </View>
                <Text style={{ fontSize: 16, fontFamily: "Poppins_700Bold", color: C.text, flex: 1 }}>
                  Canvas Displays
                </Text>
                <View style={{
                  backgroundColor: "#FEF2F2", paddingHorizontal: 12, paddingVertical: 5,
                  borderRadius: 99, borderWidth: 1, borderColor: "#FECACA",
                }}>
                  <Text style={{ fontSize: 11, fontFamily: "Poppins_700Bold", color: C.danger, letterSpacing: 0.5 }}>
                    {liveDisplays.length} LIVE
                  </Text>
                </View>
              </View>

              {liveDisplays.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 48, gap: 12 }}>
                  <View style={{
                    width: 72, height: 72, borderRadius: 22,
                    backgroundColor: C.surfaceAlt, justifyContent: "center", alignItems: "center",
                    borderWidth: 1, borderColor: C.border,
                  }}>
                    <Ionicons name="tv-outline" size={34} color={C.textLight} />
                  </View>
                  <Text style={{ fontSize: 15, fontFamily: "Poppins_600SemiBold", color: C.textLight }}>
                    No canvas content right now
                  </Text>
                  <Text style={{ fontSize: 12, fontFamily: "Poppins_400Regular", color: C.textLight, opacity: 0.7 }}>
                    Create a new canvas to get started
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/layout-studio")}
                    style={{
                      marginTop: 6, flexDirection: "row", alignItems: "center", gap: 7,
                      paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12,
                      backgroundColor: C.primary,
                    }}>
                    <Ionicons name="add-circle-outline" size={14} color="#fff" />
                    <Text style={{ fontSize: 13, fontFamily: "Poppins_600SemiBold", color: "#fff" }}>New Canvas</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: isMobile ? 14 : 18 }}>
                  {liveDisplays.map((live: CanvasLive) => (
                    <View
                      key={live.id}
                      style={{
                        width: liveCols === 2 ? "48%" : "100%",
                        flexGrow: 1,
                        flexShrink: 1,
                        minWidth: isMobile ? "100%" : 340,
                      }}>
                      <LiveDisplayCard
                        live={live}
                        imageList={imageList}
                        isMobile={isMobile}
                        onEdit={handleEdit}
                        onStop={handleStop}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* RECENT UPLOADS */}
            {recentImages.length > 0 && (
              <View style={section}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <View style={{
                    width: 34, height: 34, borderRadius: 10,
                    backgroundColor: C.primaryGhost, justifyContent: "center", alignItems: "center",
                    borderWidth: 1, borderColor: C.primary + "30",
                  }}>
                    <Ionicons name="cloud-upload-outline" size={17} color={C.primary} />
                  </View>
                  <Text style={{ fontSize: 16, fontFamily: "Poppins_700Bold", color: C.text, flex: 1 }}>
                    Recent Uploads
                  </Text>
                  <View style={{
                    backgroundColor: C.primaryGhost, paddingHorizontal: 10, paddingVertical: 4,
                    borderRadius: 99, borderWidth: 1, borderColor: C.primary + "30",
                  }}>
                    <Text style={{ fontSize: 11, fontFamily: "Poppins_700Bold", color: C.primary }}>
                      {recentImages.length}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: isMobile ? 8 : 12 }}>
                  {recentImages.map((img: ImageItem) => {
                    const imgUrl = img.imageurl ?? img.images ?? null;
                    return (
                      <TouchableOpacity
                        key={img.imageId}
                        onPress={() => setLightboxImg(img)}
                        activeOpacity={0.82}
                        style={{
                          width: `${(100 / uploadCols).toFixed(2)}%` as any,
                          flexGrow: 1,
                          flexShrink: 0,
                          borderRadius: 14,
                          overflow: "hidden",
                          backgroundColor: C.surfaceAlt,
                          borderWidth: 1,
                          borderColor: C.border,
                          shadowColor: C.primary,
                          shadowOpacity: 0.06,
                          shadowRadius: 8,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: 2,
                        }}>
                        <View style={{ width: "100%", aspectRatio: 4 / 3 }}>
                          {imgUrl ? (
                            <Image
                              source={{ uri: imgUrl }}
                              style={{ width: "100%", height: "100%" }}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.primaryGhost }}>
                              <Ionicons name="image-outline" size={24} color={C.primary} />
                            </View>
                          )}
                        </View>
                        <View style={{ padding: isMobile ? 7 : 9, gap: 2 }}>
                          <Text
                            style={{ fontSize: isMobile ? 10 : 11, fontFamily: "Poppins_600SemiBold", color: C.text }}
                            numberOfLines={1}>
                            {img.imageName ?? "Image"}
                          </Text>
                          <Text style={{ fontSize: 9, fontFamily: "Poppins_400Regular", color: C.textLight }}>
                            {img.createdAt
                              ? new Date(img.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                              : "—"}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={{ height: isMobile ? 28 : 12 }} />
          </View>
        </ScrollView>
      </View>
    </ResponsiveLayout>
  );
}

// ─── SECTION CARD STYLE ───────────────────────────────────────────────────────
const section = {
  backgroundColor: C.surface,
  borderRadius: 22,
  padding: 20,
  borderWidth: 1,
  borderColor: C.border,
  shadowColor: C.primary,
  shadowOpacity: 0.06,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;