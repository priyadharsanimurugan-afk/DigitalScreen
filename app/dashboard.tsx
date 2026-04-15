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
import { styles, C, BREAKPOINTS } from "./dashboard.styles";
import { StatCard } from "@/components/dashboardAtoms";
import LiveContentEditModal from "@/components/liveContentEdit";

// ─── LIVE DISPLAY CARD ───────────────────────────────────────────────────────
const LiveDisplayCard = ({
  live, imageList, onEdit, onStop,
}: { live: any; imageList: any[]; onEdit: (l: any) => void; onStop: (id: number, deviceId: string, deviceName: string) => void }) => (
  <View style={{ backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#E5E7EB", padding: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 }}>
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontFamily: "Poppins_700Bold", color: "#111" }} numberOfLines={1}>{live.displayName || live.deviceName}</Text>
        <Text style={{ fontSize: 12, fontFamily: "Poppins_400Regular", color: C.textLight }} numberOfLines={1}>"{live.title}"</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#DCFCE7", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, marginLeft: 8 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#16A34A" }} />
        <Text style={{ fontSize: 10, fontFamily: "Poppins_600SemiBold", color: "#15803D" }}>{live.status || "LIVE"}</Text>
      </View>
    </View>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 10 }}>
      <Ionicons name="grid-outline" size={11} color={C.primary} />
      <Text style={{ fontSize: 11, fontFamily: "Poppins_500Medium", color: C.primary }}>{live.screenLayout}</Text>
    </View>
    <View style={{ flexDirection: "row", gap: 5, marginBottom: 12 }}>
      {live.images?.slice(0, 4).map((img: any, idx: number) => {
        const d = imageList.find((i) => i.imageId === img.imageId);
        return (
          <View key={idx} style={{ width: 40, height: 32, borderRadius: 6, overflow: "hidden", backgroundColor: C.surfaceAlt }}>
            {d?.imageurl
              ? <Image source={{ uri: d.imageurl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              : <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><Ionicons name="image-outline" size={12} color={C.textLight} /></View>}
          </View>
        );
      })}
      {live.images?.length > 4 && (
        <View style={{ width: 40, height: 32, borderRadius: 6, backgroundColor: C.surfaceAlt, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 10, fontFamily: "Poppins_600SemiBold", color: C.textLight }}>+{live.images.length - 4}</Text>
        </View>
      )}
    </View>
    <View style={{ flexDirection: "row", gap: 8 }}>
      <TouchableOpacity
        onPress={() => onEdit(live)}
        style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, borderRadius: 9, borderWidth: 1.5, borderColor: C.primary, backgroundColor: C.primaryGhost }}>
        <Ionicons name="create-outline" size={13} color={C.primary} />
        <Text style={{ fontSize: 12, fontFamily: "Poppins_600SemiBold", color: C.primary }}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onStop(live.contentId, live.deviceId, live.displayName || live.deviceName)}
        style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, borderRadius: 9, backgroundColor: "#FEE2E2" }}>
        <Ionicons name="stop" size={13} color="#DC2626" />
        <Text style={{ fontSize: 12, fontFamily: "Poppins_600SemiBold", color: "#DC2626" }}>Stop</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─── STOP MODAL ───────────────────────────────────────────────────────────────
const StopModal = ({ visible, onCancel, onConfirm }: { visible: boolean; onCancel: () => void; onConfirm: () => void }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 }}>
      <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 24, width: "100%", maxWidth: 360 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Ionicons name="stop-circle-outline" size={22} color="#DC2626" />
          <Text style={{ fontSize: 16, fontFamily: "Poppins_700Bold", color: "#DC2626" }}>Stop Content</Text>
        </View>
        <Text style={{ fontSize: 14, fontFamily: "Poppins_400Regular", color: "#6B7280", marginBottom: 20, lineHeight: 20 }}>
          Are you sure you want to stop this live content? The TV screen will go blank.
        </Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity onPress={onCancel} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: "#E5E7EB", alignItems: "center" }}>
            <Text style={{ fontSize: 14, fontFamily: "Poppins_600SemiBold", color: "#6B7280" }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onConfirm} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: "#DC2626", alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 }}>
            <Ionicons name="stop" size={14} color="#fff" />
            <Text style={{ fontSize: 14, fontFamily: "Poppins_600SemiBold", color: "#fff" }}>Yes, Stop</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// ─── IMAGE FULL VIEW ──────────────────────────────────────────────────────────
const ImageFullView = ({ image, onClose }: { image: any; onClose: () => void }) => (
  <Modal visible={!!image} transparent animationType="fade" onRequestClose={onClose}>
    <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.92)", justifyContent: "center", alignItems: "center" }}>
      <TouchableOpacity onPress={onClose} style={{ position: "absolute", top: 48, right: 20, zIndex: 10, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 99, padding: 8 }}>
        <Ionicons name="close" size={22} color="#fff" />
      </TouchableOpacity>
      {image?.imageurl && <Image source={{ uri: image.imageurl }} style={{ width: "92%", height: "70%" }} resizeMode="contain" />}
      {image?.imageName && <Text style={{ marginTop: 16, fontSize: 13, fontFamily: "Poppins_500Medium", color: "rgba(255,255,255,0.7)" }}>{image.imageName}</Text>}
    </View>
  </Modal>
);

// ─── MAIN DASHBOARD SCREEN ────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  const [loaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });

  const { recentImages, loading: dashLoading, refreshAllData: refreshDash, getStatistics } = useDashboard();
  const { lutData, liveDisplays, loading: contentLoading, sendContentToDevice, stopCurrentContent, refreshAllData: refreshContent } = useContent();

  const [refreshing, setRefreshing] = useState(false);
  const [stopVisible, setStopVisible] = useState(false);
  const [stopPayload, setStopPayload] = useState<{ contentId: number; deviceId: string; deviceName: string } | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedLiveContent, setSelectedLiveContent] = useState<any>(null);
  const [fullViewImage, setFullViewImage] = useState<any>(null);

  const isMobile = screenWidth < BREAKPOINTS.mobile;
  const isDesktop = screenWidth >= 1024;
  const isLoading = dashLoading || contentLoading;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshDash(), refreshContent()]);
    setRefreshing(false);
    Toast.show({ type: "info", text1: "Refreshed", text2: "Dashboard data updated", visibilityTime: 2000 });
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
      const result = await stopCurrentContent(deviceId, contentId);
      if (result.success) {
        setStopPayload(null);
        Toast.show({ type: "success", text1: "Content Stopped", text2: `Successfully stopped ${deviceName}`, visibilityTime: 2000 });
      } else {
        Toast.show({ type: "error", text1: "Error", text2: result.error || "Failed to stop content", visibilityTime: 2000 });
      }
    } catch {
      Toast.show({ type: "error", text1: "Error", text2: "Failed to stop content", visibilityTime: 2000 });
    }
  };

  const handleSendEditedContent = async (payload: any) => {
    try {
      const result = await sendContentToDevice(payload);
      if (result.success) {
        setEditModalVisible(false);
        setSelectedLiveContent(null);
        Toast.show({ type: "success", text1: "Success", text2: "Content updated successfully", visibilityTime: 2000 });
      } else {
        Toast.show({ type: "error", text1: "Error", text2: result.error || "Failed to update content", visibilityTime: 2000 });
      }
    } catch {
      Toast.show({ type: "error", text1: "Error", text2: "Failed to update content", visibilityTime: 2000 });
    }
  };

  const stats = getStatistics();
  const gap = isMobile ? 12 : 16;
  const cp = isMobile ? 14 : 20;

  if (!loaded) return null;

  return (
    <ResponsiveLayout>
      <View style={styles.container}>
        {/* Modals */}
        <LiveContentEditModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          content={selectedLiveContent}
          imageList={lutData.imageList}
          layouts={lutData.screenLayouts || []}
          deviceId={selectedLiveContent?.deviceId}
          onSend={handleSendEditedContent}
        />
        <StopModal visible={stopVisible} onCancel={() => setStopVisible(false)} onConfirm={handleConfirmStop} />
        <ImageFullView image={fullViewImage} onClose={() => setFullViewImage(null)} />

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
          contentContainerStyle={{ flexGrow: 1 }}>
          <View style={[styles.content, { padding: isMobile ? 12 : 20, paddingTop: isMobile ? 16 : 24, gap }]}>

            {/* ── Header ── */}
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <View style={styles.headerBadge}>
                  <Ionicons name="tv" size={12} color={C.brownMid} />
                  <Text style={styles.headerBadgeText}>Signage Control</Text>
                </View>
                <Text style={[styles.pageTitle, { fontSize: isMobile ? 22 : 28 }]}>Dashboard</Text>
                <Text style={styles.pageSubtitle}>Digital Notice Board Management</Text>
              </View>
              <View style={styles.headerRight}>
                {isLoading && <ActivityIndicator color={C.primary} size="small" />}
                <View style={styles.onlineStatus}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>Live</Text>
                </View>
              </View>
            </View>

            {/* ── Stats ── */}
            <View style={[styles.statsRow, { gap: isMobile ? 8 : 10 }]}>
              <StatCard icon="radio-outline" num={stats.liveScreens} label="Live Screens" iconBg="rgba(255,255,255,0.2)" iconColor="#fff" bg={C.primary} textColor="#fff" labelColor="rgba(255,255,255,0.7)" />
              <StatCard icon="checkmark-circle-outline" num={stats.onlineDevices} label="Online" iconBg={C.successBg} iconColor={C.success} />
              <StatCard icon="close-circle-outline" num={stats.offlineDevices} label="Offline" iconBg={C.dangerBg} iconColor={C.danger} />
              {!isMobile && <StatCard icon="tv-outline" num={stats.totalDevices} label="Total Devices" iconBg={C.brownLight} iconColor={C.brownMid} />}
            </View>

            {/* ── Send to TV shortcut ── */}
            <TouchableOpacity
              onPress={() => router.push("/sendtv")}
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, borderRadius: 14, backgroundColor: C.primary }}>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={{ fontFamily: "Poppins_700Bold", fontSize: 15, color: "#fff" }}>Send Content to TV</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>

            {/* ── Live Displays ── */}
            <View style={[styles.card, { padding: cp }]}>
              <View style={styles.cardTitleRow}>
                <View style={styles.livePulse} />
                <Text style={styles.cardTitle}>Live Displays</Text>
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>{liveDisplays.length} LIVE</Text>
                </View>
              </View>
              {liveDisplays.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 24, gap: 8 }}>
                  <Ionicons name="tv-outline" size={32} color={C.textLight} />
                  <Text style={{ fontSize: 13, fontFamily: "Poppins_500Medium", color: C.textLight }}>No live content right now</Text>
                </View>
              ) : (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 4 }}>
                  {liveDisplays.map((live) => (
                    <View key={live.contentId} style={{ width: isMobile ? "100%" : isDesktop ? "48%" : "100%", flexShrink: 1 }}>
                      <LiveDisplayCard
                        live={live}
                        imageList={lutData.imageList}
                        onEdit={(c) => { setSelectedLiveContent(c); setEditModalVisible(true); }}
                        onStop={handleStop}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* ── Recent Uploads ── */}
            {recentImages.length > 0 && (
              <View style={[styles.card, { padding: cp }]}>
                <View style={styles.cardTitleRow}>
                  <Ionicons name="time-outline" size={16} color={C.primary} />
                  <Text style={styles.cardTitle}>Recent Uploads</Text>
                  <Text style={styles.cardBadge}>{recentImages.length}</Text>
                </View>
                <View style={styles.recentGrid}>
                  {recentImages.slice(0, 6).map((img) => (
                    <TouchableOpacity key={img.imageId} style={styles.recentCard} onPress={() => setFullViewImage(img)} activeOpacity={0.85}>
                      <Image source={{ uri: img.imageurl }} style={styles.recentThumb} resizeMode="cover" />
                      <View style={styles.recentPin}><Ionicons name="pin" size={10} color={C.accent} /></View>
                      <View style={styles.recentInfo}>
                        <Text style={styles.recentName} numberOfLines={1}>{img.imageName}</Text>
                        <Text style={styles.recentDate}>{new Date(img.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

          </View>
        </ScrollView>
      </View>
    </ResponsiveLayout>
  );
}