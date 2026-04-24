// app/index.tsx
import React, { useState } from "react";
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
import LiveContentEditModal from "@/components/liveContentEdit";
import { getContentLUT } from "@/services/content";

// ─── THEME ────────────────────────────────────────────────────────────────────
const C = {
  primary:      "#1E3A8A",
  primaryLight: "#3B5FC0",
  primaryGhost: "#EEF2FF",
  primaryDeep:  "#0F2057",
  brownMid:     "#A16207",
  brownLight:   "#FEF3C7",
  bg:           "#F0F4FF",
  surface:      "#FFFFFF",
  surfaceAlt:   "#F8FAFC",
  text:         "#0F172A",
  textMid:      "#334155",
  textLight:    "#64748B",
  border:       "#E2E8F0",
  success:      "#059669",
  successBg:    "#D1FAE5",
  danger:       "#DC2626",
  dangerBg:     "#FEE2E2",
} as const;

const MAX_W = 1500;
const BP    = { mobile: 480, tablet: 768, desktop: 1024 };

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
    borderRadius: 16,
    padding: isMobile ? 12 : 16,
    borderWidth: 1,
    borderColor: cardBg ? "transparent" : C.border,
    shadowColor: C.primary,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    gap: 10,
  }}>
    <View style={{
      width: 38, height: 38, borderRadius: 11,
      backgroundColor: iconBg,
      justifyContent: "center", alignItems: "center",
    }}>
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <View>
      <Text style={{
        fontSize: isMobile ? 24 : 28,
        fontFamily: "Poppins_700Bold",
        color: textColor ?? C.text,
        lineHeight: isMobile ? 28 : 32,
      }}>
        {value}
      </Text>
      <Text style={{
        fontSize: 11, fontFamily: "Poppins_500Medium",
        color: labelColor ?? C.textLight, marginTop: 1,
      }}>
        {label}
      </Text>
    </View>
  </View>
);

// ─── LIVE DISPLAY CARD ────────────────────────────────────────────────────────
const LiveDisplayCard = ({
  live, imageList, isMobile, onEdit, onStop,
}: {
  live: any;
  imageList: any[];
  isMobile: boolean;
  onEdit: (l: any) => void;
  onStop: (id: number, deviceId: string, deviceName: string) => void;
}) => {
  // Unique images across all slots — purely from API response
  const allImages: any[] = (live.slots ?? []).flatMap((s: any) => s.images ?? []);
  const uniqueImages = allImages.filter(
    (img, i, arr) => arr.findIndex((x) => x.imageId === img.imageId) === i,
  );

  return (
    <View style={{
      backgroundColor: C.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: C.border,
      overflow: "hidden",
      shadowColor: C.primary,
      shadowOpacity: 0.07,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    }}>
      {/* accent bar */}
      <View style={{ height: 4, backgroundColor: C.primary }} />

      <View style={{ padding: isMobile ? 14 : 16, gap: 14 }}>

        {/* Display name + LIVE badge */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ fontSize: 15, fontFamily: "Poppins_700Bold", color: C.text }} numberOfLines={1}>
              {live.displayName || live.deviceName}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
              <Ionicons name="hardware-chip-outline" size={11} color={C.textLight} />
              <Text style={{ fontSize: 11, fontFamily: "Poppins_400Regular", color: C.textLight }}>
                {live.deviceName}
              </Text>
              <Text style={{ fontSize: 11, color: C.border }}>·</Text>
              <Ionicons name="document-text-outline" size={11} color={C.textLight} />
              <Text style={{ fontSize: 11, fontFamily: "Poppins_400Regular", color: C.textLight }} numberOfLines={1}>
                {live.title}
              </Text>
            </View>
          </View>
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 5,
            backgroundColor: "#DCFCE7", paddingHorizontal: 9, paddingVertical: 5,
            borderRadius: 99, borderWidth: 1, borderColor: "#BBF7D0",
          }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#16A34A" }} />
            <Text style={{ fontSize: 10, fontFamily: "Poppins_700Bold", color: "#15803D", letterSpacing: 0.6 }}>
              LIVE
            </Text>
          </View>
        </View>

        {/* Layout key + slot breakdown — 100% from API */}
        <View style={{
          flexDirection: "row", alignItems: "center", gap: 10,
          backgroundColor: C.surfaceAlt, borderRadius: 10, padding: 10,
          borderWidth: 1, borderColor: C.border,
        }}>
          <View style={{
            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
            backgroundColor: C.primaryGhost, borderWidth: 1, borderColor: C.primary + "30",
          }}>
            <Text style={{ fontSize: 13, fontFamily: "Poppins_700Bold", color: C.primary }}>
              {live.screenLayout}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 11, fontFamily: "Poppins_600SemiBold", color: C.textMid }}>
              {(live.slots ?? []).length} Slot{(live.slots ?? []).length !== 1 ? "s" : ""}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>
              {(live.slots ?? []).map((slot: any, si: number) => (
                <View key={si} style={{
                  flexDirection: "row", alignItems: "center", gap: 4,
                  backgroundColor: C.surface, paddingHorizontal: 7, paddingVertical: 3,
                  borderRadius: 6, borderWidth: 1, borderColor: C.border,
                }}>
                  <Text style={{ fontSize: 10, fontFamily: "Poppins_700Bold", color: C.primary }}>
                    S{si + 1}
                  </Text>
                  <Text style={{ fontSize: 10, fontFamily: "Poppins_400Regular", color: C.textLight }}>
                    {slot.images?.length ?? 0} img
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Image thumbnails — resolved from imageList by imageId */}
        {uniqueImages.length > 0 && (
          <View style={{ gap: 7 }}>
            <Text style={{
              fontSize: 10, fontFamily: "Poppins_600SemiBold", color: C.textLight,
              textTransform: "uppercase", letterSpacing: 1,
            }}>
              Images · {uniqueImages.length}
            </Text>
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
              {uniqueImages.slice(0, 7).map((img: any, idx: number) => {
                const data = imageList.find((i) => i.imageId === img.imageId);
                return (
                  <View key={idx} style={{
                    width: 52, height: 40, borderRadius: 8, overflow: "hidden",
                    backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border,
                  }}>
                    {data?.imageurl ? (
                      <Image
                        source={{ uri: data.imageurl }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <Ionicons name="image-outline" size={14} color={C.textLight} />
                      </View>
                    )}
                  </View>
                );
              })}
              {uniqueImages.length > 7 && (
                <View style={{
                  width: 52, height: 40, borderRadius: 8,
                  backgroundColor: C.primaryGhost, borderWidth: 1, borderColor: C.border,
                  justifyContent: "center", alignItems: "center",
                }}>
                  <Text style={{ fontSize: 11, fontFamily: "Poppins_700Bold", color: C.primary }}>
                    +{uniqueImages.length - 7}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Edit + Stop */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={() => onEdit(live)}
            activeOpacity={0.8}
            style={{
              flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
              gap: 6, paddingVertical: 11, borderRadius: 11,
              borderWidth: 1.5, borderColor: C.primary, backgroundColor: C.primaryGhost,
            }}>
            <Ionicons name="create-outline" size={15} color={C.primary} />
            <Text style={{ fontSize: 13, fontFamily: "Poppins_600SemiBold", color: C.primary }}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onStop(live.contentId, live.deviceId, live.displayName || live.deviceName)}
            activeOpacity={0.8}
            style={{
              flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
              gap: 6, paddingVertical: 11, borderRadius: 11,
              borderWidth: 1.5, borderColor: "#FECACA", backgroundColor: "#FEF2F2",
            }}>
            <Ionicons name="stop-circle-outline" size={15} color={C.danger} />
            <Text style={{ fontSize: 13, fontFamily: "Poppins_600SemiBold", color: C.danger }}>Stop</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ─── STOP CONFIRM MODAL ───────────────────────────────────────────────────────
const StopModal = ({ visible, onCancel, onConfirm }: {
  visible: boolean; onCancel: () => void; onConfirm: () => void;
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", padding: 20 }}>
      <View style={{ backgroundColor: C.surface, borderRadius: 22, padding: 26, width: "100%", maxWidth: 360 }}>
        <View style={{ alignItems: "center", marginBottom: 18 }}>
          <View style={{
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: "#FEF2F2", justifyContent: "center", alignItems: "center", marginBottom: 14,
          }}>
            <Ionicons name="stop-circle-outline" size={30} color={C.danger} />
          </View>
          <Text style={{ fontSize: 17, fontFamily: "Poppins_700Bold", color: C.text }}>Stop Live Content?</Text>
          <Text style={{ fontSize: 13, fontFamily: "Poppins_400Regular", color: C.textLight, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
            The TV screen will go blank immediately.{"\n"}This cannot be undone automatically.
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity onPress={onCancel} style={{
            flex: 1, paddingVertical: 13, borderRadius: 12,
            borderWidth: 1.5, borderColor: C.border, alignItems: "center",
          }}>
            <Text style={{ fontSize: 14, fontFamily: "Poppins_600SemiBold", color: C.textMid }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onConfirm} style={{
            flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: C.danger,
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <Ionicons name="stop" size={14} color="#fff" />
            <Text style={{ fontSize: 14, fontFamily: "Poppins_600SemiBold", color: "#fff" }}>Yes, Stop</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// ─── IMAGE LIGHTBOX ───────────────────────────────────────────────────────────
const ImageLightbox = ({ image, onClose }: { image: any; onClose: () => void }) => (
  <Modal visible={!!image} transparent animationType="fade" onRequestClose={onClose}>
    <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.94)", justifyContent: "center", alignItems: "center" }}>
      <TouchableOpacity onPress={onClose} style={{
        position: "absolute", top: 48, right: 20, zIndex: 10,
        backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 99, padding: 10,
      }}>
        <Ionicons name="close" size={22} color="#fff" />
      </TouchableOpacity>
      {image?.imageurl && (
        <Image source={{ uri: image.imageurl }} style={{ width: "92%", height: "70%" }} resizeMode="contain" />
      )}
      {image?.imageName && (
        <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="image-outline" size={13} color="rgba(255,255,255,0.5)" />
          <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: "rgba(255,255,255,0.65)" }}>
            {image.imageName}
          </Text>
        </View>
      )}
    </View>
  </Modal>
);

// ─── DASHBOARD SCREEN ─────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { width: sw } = useWindowDimensions();
  const router = useRouter();
  const [loaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });

  const { recentImages, loading: dashLoading, refreshAllData: refreshDash, getStatistics } = useDashboard();
  const {
    lutData, liveDisplays, loading: contentLoading,
    sendContentToDevice, stopCurrentContent, refreshAllData: refreshContent,
  } = useContent();

  const [refreshing,    setRefreshing]    = useState(false);
  const [stopVisible,   setStopVisible]   = useState(false);
  const [stopPayload,   setStopPayload]   = useState<{ contentId: number; deviceId: string; deviceName: string } | null>(null);
  const [editVisible,   setEditVisible]   = useState(false);
  const [editContent,   setEditContent]   = useState<any>(null);
  const [lightboxImg,   setLightboxImg]   = useState<any>(null);

  const isMobile  = sw < BP.mobile;
  const isTablet  = sw >= BP.mobile && sw < BP.desktop;
  const isDesktop = sw >= BP.desktop;
  const isLoading = dashLoading || contentLoading;

  // Live display grid: 2-col on desktop, 1-col otherwise
  const liveCols = isDesktop ? 2 : 1;
  // Recent uploads grid columns — fills the row evenly
  const uploadCols = isMobile ? 3 : isTablet ? 4 : 6;

  const pad = isMobile ? 14 : isTablet ? 18 : 24;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshDash(), refreshContent()]);
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
      const r = await stopCurrentContent(deviceId, contentId);
      if (r.success) {
        setStopPayload(null);
        Toast.show({ type: "success", text1: "Stopped", text2: deviceName, visibilityTime: 2000 });
      } else {
        Toast.show({ type: "error", text1: "Error", text2: r.error || "Failed", visibilityTime: 2000 });
      }
    } catch {
      Toast.show({ type: "error", text1: "Error", text2: "Failed to stop", visibilityTime: 2000 });
    }
  };

  const handleSendEdit = async (payload: any) => {
    try {
      const r = await sendContentToDevice(payload);
      if (r.success) {
        setEditVisible(false);
        setEditContent(null);
        Toast.show({ type: "success", text1: "Updated!", visibilityTime: 2000 });
      } else {
        Toast.show({ type: "error", text1: "Error", text2: r.error || "Failed", visibilityTime: 2000 });
      }
    } catch {
      Toast.show({ type: "error", text1: "Error", text2: "Failed to update", visibilityTime: 2000 });
    }
  };

  const stats = getStatistics();

  if (!loaded) return null;

  return (
    <ResponsiveLayout>
      <View style={{ flex: 1, backgroundColor: C.bg }}>

        {/* ── Modals ─────────────────────────────────────────────────────── */}
      <LiveContentEditModal
  visible={editVisible}
  onClose={() => setEditVisible(false)}
  content={editContent}
  imageList={lutData.imageList}
  layouts={lutData.screenLayouts || []}
  deviceId={editContent?.deviceId}
  onSend={handleSendEdit}
  // Add these two props 👇
  onFetchImages={async (page) => {
    const data = await getContentLUT(page, 10);
    return {
      imageList: data.imageList,
      pagination: data.pagination ?? {
        page,
        pageSize: 10,
        totalCount: 0,
        totalPages: 1,
      },
    };
  }}
  imagePagination={lutData.pagination ? {
    page: lutData.pagination.page,
    totalPages: lutData.pagination.totalPages,
    totalCount: lutData.pagination.totalCount,
  } : undefined}
/>
        <StopModal
          visible={stopVisible}
          onCancel={() => setStopVisible(false)}
          onConfirm={handleConfirmStop}
        />
        <ImageLightbox image={lightboxImg} onClose={() => setLightboxImg(null)} />

        {/* ── Scroll ─────────────────────────────────────────────────────── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
          contentContainerStyle={{ flexGrow: 1 }}>

          <View style={{
            maxWidth: MAX_W, width: "100%", alignSelf: "center",
            padding: pad, paddingTop: isMobile ? 16 : 26,
            gap: isMobile ? 14 : 20,
          }}>

            {/* ══════════════════════════════════════════════════════════════
                HEADER
            ══════════════════════════════════════════════════════════════ */}
            <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>

              {/* Left */}
              <View style={{ flex: 1, gap: 3 }}>
                <View style={{
                  flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start",
                  backgroundColor: C.brownLight, paddingHorizontal: 10, paddingVertical: 4,
                  borderRadius: 99, marginBottom: 4,   borderWidth: 1,
                      borderColor: C.brownMid + "44",
                }}>
                  <Ionicons name="tv" size={11} color={C.brownMid} />
                  <Text style={{ fontSize: 10, fontFamily: "Poppins_600SemiBold", color: C.brownMid, letterSpacing: 0.5 ,textTransform:"uppercase",}}>
                    Signage Control
                  </Text>
                </View>
                <Text style={{
                  fontSize: isMobile ? 22 : 28, fontFamily: "Poppins_700Bold", color: C.text,
                  lineHeight: isMobile ? 28 : 36,
                }}>
                  Dashboard
                </Text>
                <Text style={{ fontSize: 12, fontFamily: "Poppins_400Regular", color: C.textLight }}>
                  Digital Notice Board Management
                </Text>
              </View>

              {/* Right — Send to TV + status */}
              <View style={{ alignItems: "flex-end", gap: 8 }}>
                <TouchableOpacity
                  onPress={() => router.push("/sendtv")}
                  activeOpacity={0.85}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 7,
                    paddingVertical: isMobile ? 9 : 11,
                    paddingHorizontal: isMobile ? 12 : 18,
                    borderRadius: 12, backgroundColor: C.primary,
                    shadowColor: C.primary, shadowOpacity: 0.28, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
                    elevation: 5,
                  }}>
                  <Ionicons name="tv" size={15} color="#fff" />
                  {!isMobile && (
                    <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 13, color: "#fff" }}>
                      Send to TV
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

            {/* ══════════════════════════════════════════════════════════════
                STAT CARDS
            ══════════════════════════════════════════════════════════════ */}
            <View style={{ flexDirection: "row", flexWrap: isMobile ? "wrap" : "nowrap", gap: isMobile ? 8 : 12 }}>
              <StatCard
                icon="radio-outline" value={stats.liveScreens} label="Live Screens"
                iconBg="rgba(255,255,255,0.18)" iconColor="#fff"
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

            {/* ══════════════════════════════════════════════════════════════
                LIVE DISPLAYS
            ══════════════════════════════════════════════════════════════ */}
            <View style={section}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: C.danger }} />
                <Text style={{ fontSize: 15, fontFamily: "Poppins_700Bold", color: C.text, flex: 1 }}>
                  Live Displays
                </Text>
                <View style={{
                  backgroundColor: "#FEF2F2", paddingHorizontal: 10, paddingVertical: 4,
                  borderRadius: 99, borderWidth: 1, borderColor: "#FECACA",
                }}>
                  <Text style={{ fontSize: 11, fontFamily: "Poppins_700Bold", color: C.danger, letterSpacing: 0.5 }}>
                    {liveDisplays.length} LIVE
                  </Text>
                </View>
              </View>

              {liveDisplays.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 36, gap: 10 }}>
                  <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: C.surfaceAlt, justifyContent: "center", alignItems: "center" }}>
                    <Ionicons name="tv-outline" size={30} color={C.textLight} />
                  </View>
                  <Text style={{ fontSize: 14, fontFamily: "Poppins_600SemiBold", color: C.textLight }}>No live content right now</Text>
                  <Text style={{ fontSize: 12, fontFamily: "Poppins_400Regular", color: C.textLight, opacity: 0.7 }}>
                    Send content to a TV to get started
                  </Text>
                </View>
              ) : (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: isMobile ? 12 : 16 }}>
                  {liveDisplays.map((live) => (
                    <View
                      key={live.contentId}
                      style={{
                        width: liveCols === 2 ? "48%" : "100%",
                        flexGrow: 1,
                        flexShrink: 1,
                        minWidth: isMobile ? "100%" : 280,
                      }}>
                      <LiveDisplayCard
                        live={live}
                        imageList={lutData.imageList}
                        isMobile={isMobile}
                        onEdit={(c) => { setEditContent(c); setEditVisible(true); }}
                        onStop={handleStop}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* ══════════════════════════════════════════════════════════════
                RECENT UPLOADS
            ══════════════════════════════════════════════════════════════ */}
            {recentImages.length > 0 && (
              <View style={section}>
                {/* Header */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <View style={{
                    width: 30, height: 30, borderRadius: 9,
                    backgroundColor: C.primaryGhost, justifyContent: "center", alignItems: "center",
                  }}>
                    <Ionicons name="cloud-upload-outline" size={15} color={C.primary} />
                  </View>
                  <Text style={{ fontSize: 15, fontFamily: "Poppins_700Bold", color: C.text, flex: 1 }}>
                    Recent Uploads
                  </Text>
                  <View style={{
                    backgroundColor: C.primaryGhost, paddingHorizontal: 10, paddingVertical: 3,
                    borderRadius: 99, borderWidth: 1, borderColor: C.primary + "30",
                  }}>
                    <Text style={{ fontSize: 11, fontFamily: "Poppins_700Bold", color: C.primary }}>
                      {recentImages.length}
                    </Text>
                  </View>
                </View>

                {/*
                  Full-row responsive grid:
                  Each card is exactly 1/uploadCols of the available width.
                  We use percentage widths so they always fill the row perfectly.
                  aspectRatio on the thumb keeps images uniform.
                */}
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: isMobile ? 8 : 12 }}>
                  {recentImages.map((img) => {
                    // percentage width = 1/cols, minus a fraction of the gap
                    const colPct = (100 / uploadCols).toFixed(3) + "%";
                    return (
                      <TouchableOpacity
                        key={img.imageId}
                        onPress={() => setLightboxImg(img)}
                        activeOpacity={0.82}
                        style={{
                          width: colPct as any,
                          flexGrow: 1,
                          flexShrink: 0,
                          borderRadius: 12,
                          overflow: "hidden",
                          backgroundColor: C.surfaceAlt,
                          borderWidth: 1,
                          borderColor: C.border,
                        }}>
                        {/* Thumb — consistent 4:3 ratio */}
                        <View style={{ width: "100%", aspectRatio: 4 / 3 }}>
                          <Image
                            source={{ uri: img.imageurl }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                        </View>
                        {/* Label */}
                        <View style={{ padding: isMobile ? 6 : 8, gap: 2 }}>
                          <Text
                            style={{ fontSize: isMobile ? 10 : 11, fontFamily: "Poppins_600SemiBold", color: C.text }}
                            numberOfLines={1}>
                            {img.imageName}
                          </Text>
                          <Text style={{ fontSize: 9, fontFamily: "Poppins_400Regular", color: C.textLight }}>
                            {new Date(img.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={{ height: isMobile ? 24 : 10 }} />
          </View>
        </ScrollView>
      </View>
    </ResponsiveLayout>
  );
}

// ─── SHARED SECTION CARD STYLE ────────────────────────────────────────────────
const section = {
  backgroundColor: C.surface,
  borderRadius: 20,
  padding: 18,
  borderWidth: 1,
  borderColor: C.border,
  shadowColor: C.primary,
  shadowOpacity: 0.05,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;