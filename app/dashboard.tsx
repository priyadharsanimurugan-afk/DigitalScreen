// app/index.tsx
import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, RefreshControl, Modal, Image, useWindowDimensions,
} from "react-native";
import {
  useFonts, Poppins_400Regular, Poppins_500Medium,
  Poppins_600SemiBold, Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import ResponsiveLayout from "@/components/responsiveLayout";
import { useDashboard } from "@/hooks/useDashboard";
import { useContent } from "@/hooks/useContent";
import { styles, C, BREAKPOINTS, dd } from "./dashboard.styles";
import { ImageSelectModal } from "@/components/selectImageModal";
import { LayoutArrangeModal } from "@/components/layoutArrangeModal";
import { getLayoutConfig } from "@/constants/layout";
import { StatCard, SummaryRow, StepBadge, TVNoticeBoard } from "@/components/dashboardAtoms";
import LiveContentEditModal from "@/components/liveContentEdit";

// Custom toast helper


// ... (Keep all the component definitions: Dropdown, ImageStrip, LiveDisplayCard, StopModal, ImageFullView - they remain exactly the same)
// ─── DROPDOWN ────────────────────────────────────────────────────────────────
const Dropdown = ({ label, icon, placeholder, options, selected, onSelect }: {
  label: string; icon: any; placeholder: string;
  options: { label: string; value: string | number; subtitle?: string }[];
  selected: string | number | null; onSelect: (v: any) => void;
}) => {
  const [open, setOpen] = useState(false);
  const sel = options.find((o) => o.value === selected);
  return (
    <View style={{ zIndex: open ? 9999 : 1 }}>
      <Text style={dd.label}>{label}</Text>
      <View style={{ position: "relative", zIndex: open ? 9999 : 1 }}>
        <TouchableOpacity style={[dd.trigger, open && dd.triggerOpen]} onPress={() => setOpen(!open)} activeOpacity={0.8}>
          <Ionicons name={icon} size={16} color={selected ? C.primary : C.textLight} />
          <View style={{ flex: 1 }}>
            <Text style={[dd.triggerText, !selected && { color: C.textLight }]} numberOfLines={1}>{sel?.label || placeholder}</Text>
            {sel?.subtitle && <Text style={dd.triggerSub} numberOfLines={1}>{sel.subtitle}</Text>}
          </View>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={C.textLight} />
        </TouchableOpacity>
        {open && (
          <View style={[dd.menu, { position: "absolute", top: "100%", left: 0, right: 0, zIndex: 9999 }]}>
            <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {options.map((opt, idx) => {
                const isSel = opt.value === selected;
                return (
                  <TouchableOpacity key={String(opt.value)} style={[dd.item, isSel && dd.itemActive, idx < options.length - 1 && dd.itemBorder]}
                    onPress={() => { onSelect(opt.value); setOpen(false); }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[dd.itemText, isSel && dd.itemTextActive]}>{opt.label}</Text>
                      {opt.subtitle && <Text style={[dd.itemSub, isSel && { color: C.primaryLight }]}>{opt.subtitle}</Text>}
                    </View>
                    {isSel && <Ionicons name="checkmark-circle" size={18} color={C.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
};

// ─── IMAGE STRIP ─────────────────────────────────────────────────────────────
const ImageStrip = ({ ids, imageList, onRemove }: { ids: number[]; imageList: any[]; onRemove?: (id: number) => void }) => {
  if (!ids.length) return null;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
      {ids.map((id, idx) => {
        const img = imageList.find((i) => i.imageId === id);
        return (
          <View key={id} style={{ width: 60, borderRadius: 8, overflow: "hidden", backgroundColor: C.surfaceAlt, borderWidth: 1.5, borderColor: C.border }}>
            {img?.imageurl ? <Image source={{ uri: img.imageurl }} style={{ width: "100%", height: 48 }} resizeMode="cover" />
              : <View style={{ height: 48, justifyContent: "center", alignItems: "center" }}><Ionicons name="image-outline" size={16} color={C.textLight} /></View>}
            <View style={{ position: "absolute", top: 3, left: 3, backgroundColor: C.primary, borderRadius: 99, width: 15, height: 15, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ fontSize: 7, color: "#fff", fontFamily: "Poppins_700Bold" }}>{idx + 1}</Text>
            </View>
            {onRemove && <TouchableOpacity onPress={() => onRemove(id)} style={{ position: "absolute", top: 2, right: 2 }}><Ionicons name="close-circle" size={14} color="#fff" /></TouchableOpacity>}
          </View>
        );
      })}
    </View>
  );
};

// ─── LIVE DISPLAY CARD ───────────────────────────────────────────────────────
const LiveDisplayCard = ({ live, imageList, onEdit, onStop }: { live: any; imageList: any[]; onEdit: (l: any) => void; onStop: (id: number) => void }) => (
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
            {d?.imageurl ? <Image source={{ uri: d.imageurl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              : <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><Ionicons name="image-outline" size={12} color={C.textLight} /></View>}
          </View>
        );
      })}
      {live.images?.length > 4 && <View style={{ width: 40, height: 32, borderRadius: 6, backgroundColor: C.surfaceAlt, justifyContent: "center", alignItems: "center" }}><Text style={{ fontSize: 10, fontFamily: "Poppins_600SemiBold", color: C.textLight }}>+{live.images.length - 4}</Text></View>}
    </View>
    <View style={{ flexDirection: "row", gap: 8 }}>
      <TouchableOpacity onPress={() => onEdit(live)} style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, borderRadius: 9, borderWidth: 1.5, borderColor: C.primary, backgroundColor: C.primaryGhost }}>
        <Ionicons name="create-outline" size={13} color={C.primary} /><Text style={{ fontSize: 12, fontFamily: "Poppins_600SemiBold", color: C.primary }}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onStop(live.contentId)} style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, borderRadius: 9, backgroundColor: "#FEE2E2" }}>
        <Ionicons name="stop" size={13} color="#DC2626" /><Text style={{ fontSize: 12, fontFamily: "Poppins_600SemiBold", color: "#DC2626" }}>Stop</Text>
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
            <Ionicons name="stop" size={14} color="#fff" /><Text style={{ fontSize: 14, fontFamily: "Poppins_600SemiBold", color: "#fff" }}>Yes, Stop</Text>
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

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const [loaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });

  const { recentImages, loading: dashLoading, refreshAllData: refreshDash, getStatistics } = useDashboard();
  const { lutData, liveDisplays, loading: contentLoading, error, success, setError, setSuccess, sendContentToDevice, stopCurrentContent, refreshAllData: refreshContent } = useContent();

  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [stopVisible, setStopVisible] = useState(false);
  const [stopContentId, setStopContentId] = useState<number | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [layoutModalVisible, setLayoutModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedLiveContent, setSelectedLiveContent] = useState<any>(null);
  const [fullViewImage, setFullViewImage] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedImageIds, setSelectedImageIds] = useState<number[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<string>("");
const [slotAssignment, setSlotAssignment] = useState<number[][]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null | any>(null);


  const isMobile = screenWidth < BREAKPOINTS.mobile;
  const isDesktop = screenWidth >= 1024;
  const isLoading = dashLoading || contentLoading;

  // Show toast for errors and success from useContent
// In your DashboardScreen component


  const toggleImage = (id: number) =>
    setSelectedImageIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshDash(), refreshContent()]);
    setRefreshing(false);

      Toast.show({
      type: 'info',
      text1: 'Refreshed',
      text2: 'Dashboard data updated',
      visibilityTime: 2000,
    });
  };

  const stats = getStatistics();
  const selectedDevice = lutData.deviceList.find((d) => d.deviceId === selectedDeviceId);
  const selectedLayoutLabel = getLayoutConfig(selectedLayout)?.label || selectedLayout;
  const deviceOptions = lutData.deviceList.map((d) => ({ label: d.displayName, value: d.deviceId, subtitle: d.deviceName }));

  const step1Done = selectedImageIds.length > 0;
  const step2Done = !!selectedLayout && slotAssignment.filter(Boolean).length > 0;
  const step3Done = step2Done && !!title.trim() && !!selectedDeviceId;

const handleSendPress = async () => {
  setSending(true);
  
  try {
     const slots = slotAssignment.map((ids, index) => ({
      slotIndex: index,
      imageIds: Array.isArray(ids) ? ids : (ids !== null ? [ids] : []),
    }));
    const result = await sendContentToDevice({ 
         title,
      description,
      screenLayout: selectedLayout,
      deviceId: selectedDeviceId,
      slots,
    });
    
    if (result.success) {
      // Reset form
      setTitle("");
      setDescription("");
      setSelectedImageIds([]);
      setSelectedLayout("");
      setSlotAssignment([]);
      setSelectedDeviceId(null);
      
      // Refresh dashboard data to update stats
      await refreshDash();
      
      // Show success toast
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Content sent to ${selectedDevice?.displayName || 'device'} successfully`,
        visibilityTime: 2000,
      });
    } else {
      // Show error toast if failed
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: result.error || 'Failed to send content',
        visibilityTime: 2000,
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: 'An unexpected error occurred',
      visibilityTime: 2000,
    });
  } finally {
    setSending(false);
  }
};

const handleSendEditedContent = async (payload: any) => {
  try {
    const result = await sendContentToDevice(payload);
    
    if (result.success) {
      setEditModalVisible(false);
      setSelectedLiveContent(null);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Content updated successfully',
        visibilityTime: 2000,
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: result.error || 'Failed to update content',
        visibilityTime: 2000,
      });
    }
  } catch (error) {
    console.error('Error editing content:', error);
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: 'Failed to update content',
      visibilityTime: 2000,
    });
  }
};

const handleConfirmStop = async () => {
  if (!stopPayload) return;
  
  setStopVisible(false);
  const { deviceId, contentId, deviceName } = stopPayload;
  
  try {
    const result = await stopCurrentContent(deviceId, contentId);
    
    if (result.success) {
      setStopPayload(null);
      
      Toast.show({
        type: 'success',
        text1: 'Content Stopped',
        text2: `Successfully stopped ${deviceName}`,
        visibilityTime: 2000,
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: result.error || 'Failed to stop content',
        visibilityTime: 2000,
      });
    }
  } catch (error) {
    console.error('Error stopping content:', error);
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: 'Failed to stop content',
      visibilityTime: 2000,
    });
  }
};

  const [stopPayload, setStopPayload] = useState<{ contentId: number; deviceId: string; deviceName: string } | null>(null);

  const handleStop = (contentId: number, deviceId: string, deviceName: string) => {
    setStopPayload({ contentId, deviceId, deviceName });
    setStopVisible(true);
  };



  const handleLayoutButtonPress = () => {
    if (selectedImageIds.length > 0) {
      setLayoutModalVisible(true);
    } else {
    
          Toast.show({
      type: 'error',
      text1: 'Images Required',
      text2: 'Please select at least one image first',
      visibilityTime: 2000,
    });
  
    }
  };

  if (!loaded) return null;
  const gap = isMobile ? 12 : 16;
  const cp = isMobile ? 14 : 20;

  return (
    <ResponsiveLayout>
      <View style={styles.container}>
        <ImageSelectModal visible={imageModalVisible} onClose={() => setImageModalVisible(false)} options={lutData.imageList} selected={selectedImageIds} onToggle={toggleImage} maxSelect={6} />
        <LayoutArrangeModal visible={layoutModalVisible} onClose={() => setLayoutModalVisible(false)}
         onConfirm={(layout, slotsArray) => {
    setSelectedLayout(layout);
    // slotsArray is number[][] from the modal, store as-is
    setSlotAssignment(slotsArray);
    setLayoutModalVisible(false);
  }}
          imageList={lutData.imageList} selectedImageIds={selectedImageIds} layouts={lutData.screenLayouts || []} />
        <LiveContentEditModal visible={editModalVisible} onClose={() => setEditModalVisible(false)}
          content={selectedLiveContent} imageList={lutData.imageList} layouts={lutData.screenLayouts || []}
          deviceId={selectedLiveContent?.deviceId || selectedDeviceId} onSend={handleSendEditedContent} />
        <StopModal visible={stopVisible} onCancel={() => setStopVisible(false)} onConfirm={handleConfirmStop} />
        <ImageFullView image={fullViewImage} onClose={() => setFullViewImage(null)} />

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
          contentContainerStyle={{ flexGrow: 1 }}>
          <View style={[styles.content, { padding: isMobile ? 12 : 20, paddingTop: isMobile ? 16 : 24, gap }]}>

            {/* Header */}
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
                <View style={styles.onlineStatus}><View style={styles.onlineDot} /><Text style={styles.onlineText}>Live</Text></View>
              </View>
            </View>

            {/* Stats */}
            <View style={[styles.statsRow, { gap: isMobile ? 8 : 10 }]}>
              <StatCard icon="radio-outline" num={stats.liveScreens} label="Live Screens" iconBg="rgba(255,255,255,0.2)" iconColor="#fff" bg={C.primary} textColor="#fff" labelColor="rgba(255,255,255,0.7)" />
              <StatCard icon="checkmark-circle-outline" num={stats.onlineDevices} label="Online" iconBg={C.successBg} iconColor={C.success} />
              <StatCard icon="close-circle-outline" num={stats.offlineDevices} label="Offline" iconBg={C.dangerBg} iconColor={C.danger} />
              {!isMobile && <StatCard icon="tv-outline" num={stats.totalDevices} label="Total Devices" iconBg={C.brownLight} iconColor={C.brownMid} />}
            </View>

            {/* Steps */}
            <View style={styles.stepsRow}>
              <StepBadge num={1} label="Images" done={step1Done} />
              <View style={styles.stepLine} />
              <StepBadge num={2} label="Layout" done={step2Done} />
              <View style={styles.stepLine} />
              <StepBadge num={3} label="Deploy" done={step3Done} />
            </View>

            {/* Main Grid */}
            <View style={[styles.mainGrid, { flexDirection: isMobile ? "column" : "row", gap: isMobile ? gap : 20, alignItems: "flex-start" }]}>
              {/* Left */}
              <View style={[styles.leftCol, { flex: isMobile ? undefined : 3, gap, overflow: "visible", width: isMobile ? "100%" : undefined }]}>

                <View style={[styles.card, { padding: cp, width: "100%" }]}>
                  <View style={styles.cardTitleRow}>
                    <View style={styles.stepNumSmall}><Text style={styles.stepNumSmallText}>1</Text></View>
                    <Ionicons name="images-outline" size={16} color={C.primary} />
                    <Text style={styles.cardTitle}>Select Images</Text>
                    {selectedImageIds.length > 0 && <View style={styles.cardBadgeBlue}><Text style={styles.cardBadgeBlueText}>{selectedImageIds.length} selected</Text></View>}
                  </View>
                  <ImageStrip ids={selectedImageIds} imageList={lutData.imageList} onRemove={toggleImage} />
                  <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 10, borderWidth: 1.5, borderStyle: "dashed", borderColor: selectedImageIds.length > 0 ? C.primary : C.border, backgroundColor: selectedImageIds.length > 0 ? C.primaryGhost : "transparent", width: "100%" }}
                    onPress={() => setImageModalVisible(true)}>
                    <Ionicons name="add-circle-outline" size={18} color={selectedImageIds.length > 0 ? C.primary : C.textLight} />
                    <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 14, color: selectedImageIds.length > 0 ? C.primary : C.textLight }}>
                      {selectedImageIds.length > 0 ? `Edit Selection (${selectedImageIds.length})` : "Browse & Select Images"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.card, { padding: cp, width: "100%" }]}>
                  <View style={styles.cardTitleRow}>
                    <View style={styles.stepNumSmall}><Text style={styles.stepNumSmallText}>2</Text></View>
                    <Ionicons name="grid-outline" size={16} color={C.primary} />
                    <Text style={styles.cardTitle}>Arrange Layout</Text>
                    {selectedLayout && <View style={styles.cardBadgeBlue}><Text style={styles.cardBadgeBlueText}>{selectedLayoutLabel}</Text></View>}
                  </View>
                  {selectedLayout && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, backgroundColor: C.successBg, borderRadius: 10, padding: 10 }}>
                      <Ionicons name="checkmark-circle" size={15} color={C.success} />
                      <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 12, color: C.success, flex: 1 }}>"{selectedLayoutLabel}" — {slotAssignment.filter(Boolean).length} image(s) placed</Text>
                    </View>
                  )}
                  <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 10, backgroundColor: C.primary, width: "100%", opacity: selectedImageIds.length > 0 ? 1 : 0.45 }}
                    onPress={handleLayoutButtonPress}>
                    <Ionicons name="grid" size={18} color="#fff" />
                    <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#fff" }}>{selectedLayout ? "Change Layout / Rearrange" : "Choose Layout & Arrange"}</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.card, { padding: cp, width: "100%" }]}>
                  <View style={styles.cardTitleRow}>
                    <View style={styles.stepNumSmall}><Text style={styles.stepNumSmallText}>3</Text></View>
                    <Ionicons name="create-outline" size={16} color={C.primary} />
                    <Text style={styles.cardTitle}>Content Details</Text>
                  </View>
                  <Text style={styles.fieldLabel}>Title *</Text>
                  <TextInput style={[styles.input, { width: "100%" }]} value={title} onChangeText={setTitle} placeholder="e.g. Summer Promo 2025" placeholderTextColor={C.textLight} />
                  <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Description</Text>
                  <TextInput style={[styles.input, styles.textArea, { width: "100%" }]} value={description} onChangeText={setDescription} placeholder="Optional description" placeholderTextColor={C.textLight} multiline numberOfLines={3} textAlignVertical="top" />
                </View>
              </View>

              {/* Right */}
              <View style={[styles.rightCol, { flex: isMobile ? undefined : 2, gap, width: isMobile ? "100%" : undefined }]}>
                <View style={[styles.card, { zIndex: 9999, padding: cp, overflow: "visible", position: "relative", width: "100%" }]}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="tv-outline" size={16} color={C.primary} />
                    <Text style={styles.cardTitle}>Target Device</Text>
                  </View>
                  {lutData.deviceList.length === 0 && !contentLoading
                    ? <Text style={styles.emptyHint}>No devices available</Text>
                    : <Dropdown label="SELECT DEVICE" icon="tv-outline" placeholder="Choose a device…" options={deviceOptions} selected={selectedDeviceId} onSelect={setSelectedDeviceId} />}
                  {selectedDevice && (
                    <View style={styles.devicePreview}>
                      <View style={styles.devicePreviewIcon}><Ionicons name="tv" size={20} color={C.brownMid} /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.devicePreviewName}>{selectedDevice.displayName}</Text>
                        <Text style={styles.devicePreviewSub}>{selectedDevice.deviceName}</Text>
                        <Text style={styles.devicePreviewId} numberOfLines={1}>ID: {selectedDevice.deviceId.slice(0, 16)}…</Text>
                      </View>
                    </View>
                  )}
                </View>

                <View style={[styles.card, { padding: cp, alignItems: "center", width: "100%" }]}>
                  <View style={[styles.cardTitleRow, { width: "100%" }]}>
                    <Ionicons name="eye-outline" size={16} color={C.primary} />
                    <Text style={styles.cardTitle}>Live Preview</Text>
                    <View style={styles.previewLiveBadge}>
                      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.brownMid }} />
                      <Text style={styles.previewLiveText}>PREVIEW</Text>
                    </View>
                  </View>
                  <TVNoticeBoard slotAssignment={slotAssignment} imageList={lutData.imageList} selectedLayout={selectedLayout} title={title} />
                </View>
              </View>
            </View>

            {/* Deploy – full row */}
            <View style={[styles.card, styles.deployCard, { padding: cp, width: "100%" }]}>
              <View style={{ flexDirection: isDesktop ? "row" : "column", alignItems: isDesktop ? "center" : "flex-start", gap: 16 }}>
                <View style={{ flex: isDesktop ? 1 : undefined }}>
                  <Text style={styles.deployHeading}>🚀 Ready to Deploy</Text>
                  <Text style={styles.deploySub}>Review your content before sending to TV.</Text>
                  <View style={[styles.summaryList, isDesktop && { flexDirection: "row", flexWrap: "wrap", gap: 8 }]}>
                    {[
                      { icon: "text-outline", label: "Title", value: title || "—" },
                      { icon: "images-outline", label: "Images", value: slotAssignment.filter(Boolean).length > 0 ? `${slotAssignment.filter(Boolean).length} placed` : "—" },
                      { icon: "grid-outline", label: "Layout", value: selectedLayoutLabel || "—" },
                      { icon: "tv-outline", label: "Device", value: selectedDevice?.displayName || "—" },
                    ].map((row) => (
                      <View key={row.label} style={isDesktop ? { flex: 1, minWidth: 140, backgroundColor: "rgba(255,255,255,0.6)", borderRadius: 10, padding: 10 } : undefined}>
                        <SummaryRow icon={row.icon as any} label={row.label} value={row.value} />
                      </View>
                    ))}
                  </View>
                </View>
                <TouchableOpacity style={[styles.deployBtn, sending && { opacity: 0.6 }, { width: isDesktop ? 200 : "100%", paddingVertical: 16 }]} onPress={handleSendPress} disabled={sending}>
                  {sending ? <ActivityIndicator color="#fff" size="small" />
                    : <><Ionicons name="send" size={18} color="#fff" /><Text style={[styles.deployBtnText, { fontSize: 15 }]}>Send to TV</Text></>}
                </TouchableOpacity>
              </View>
            </View>

            {/* Live Displays – always visible, 2-col on desktop */}
            <View style={[styles.card, { padding: cp }]}>
              <View style={styles.cardTitleRow}>
                <View style={styles.livePulse} />
                <Text style={styles.cardTitle}>Live Displays</Text>
                <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>{liveDisplays.length} LIVE</Text></View>
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
                        onEdit={(c) => { 
                          setSelectedLiveContent(c); 
                          setEditModalVisible(true); 
                        }}
                        onStop={() => handleStop(live.contentId, live.deviceId, live.displayName || live.deviceName)}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Recent Uploads – tap for full view */}
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