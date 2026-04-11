// app/index.tsx
import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, RefreshControl, Modal, Image,
  useWindowDimensions,
} from "react-native";
import {
  useFonts, Poppins_400Regular, Poppins_500Medium,
  Poppins_600SemiBold, Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { Ionicons } from "@expo/vector-icons";
import ResponsiveLayout from "@/components/responsiveLayout";
import { useDashboard } from "@/hooks/useDashboard";
import { useContent } from "@/hooks/useContent";
import { styles, C, BREAKPOINTS, dd } from "./dashboard.styles";
import { ImageSelectModal } from "@/components/selectImageModal";
import { LayoutArrangeModal } from "@/components/layoutArrangeModal";
import { getLayoutConfig } from "@/constants/layout";
import { StatCard, SummaryRow, ModalRow, StepBadge, TVNoticeBoard } from "@/components/dashboardAtoms";

// ─── DROPDOWN ─────────────────────────────────────────────────────────────────

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
        <TouchableOpacity
          style={[dd.trigger, open && dd.triggerOpen]}
          onPress={() => setOpen(!open)}
          activeOpacity={0.8}
        >
          <Ionicons name={icon} size={16} color={selected ? C.primary : C.textLight} />
          <View style={{ flex: 1 }}>
            <Text style={[dd.triggerText, !selected && { color: C.textLight }]} numberOfLines={1}>
              {sel?.label || placeholder}
            </Text>
            {sel?.subtitle && <Text style={dd.triggerSub} numberOfLines={1}>{sel.subtitle}</Text>}
          </View>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={C.textLight} />
        </TouchableOpacity>
        {open && (
          <View style={[dd.menu, { position: "absolute", top: "100%", left: 0, right: 0, zIndex: 9999 }]}>
            <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {options.map((opt, idx) => {
                const isSelected = opt.value === selected;
                return (
                  <TouchableOpacity
                    key={String(opt.value)}
                    style={[dd.item, isSelected && dd.itemActive, idx < options.length - 1 && dd.itemBorder]}
                    onPress={() => { onSelect(opt.value); setOpen(false); }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[dd.itemText, isSelected && dd.itemTextActive]}>{opt.label}</Text>
                      {opt.subtitle && (
                        <Text style={[dd.itemSub, isSelected && { color: C.primaryLight }]}>{opt.subtitle}</Text>
                      )}
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={18} color={C.primary} />}
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

// ─── LIVE CONTENT EDIT MODAL ──────────────────────────────────────────────────

const LiveContentEditModal = ({ visible, onClose, content, imageList, layouts, deviceId, onSend }: {
  visible: boolean;
  onClose: () => void;
  content: any;
  imageList: any[];
  layouts: any[];
  deviceId: string;
  onSend: (payload: {
    title: string; description: string;
    imageIds: number[]; screenLayout: string; deviceId: string;
  }) => Promise<void>;
}) => {
  const [selectedLayout, setSelectedLayout] = useState("");
  const [slotAssignment, setSlotAssignment] = useState<(number | null)[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [layoutModalVisible, setLayoutModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<number[]>([]);

  useEffect(() => {
    if (content) {
      setTitle(content.title || "");
      setDescription(content.description || "");
      setSelectedLayout(content.screenLayout || "");
      const imageIds = content.images?.map((img: any) => img.imageId) || [];
      setSelectedImageIds(imageIds);
      const layoutConfig = getLayoutConfig(content.screenLayout);
      if (layoutConfig) {
        const assignment = new Array(layoutConfig.slots).fill(null);
        content.images?.forEach((img: any, idx: number) => {
          if (idx < assignment.length) assignment[idx] = img.imageId;
        });
        setSlotAssignment(assignment);
      }
    }
  }, [content]);

  const handleLayoutConfirm = (layout: string, assignment: (number | null)[]) => {
    setSelectedLayout(layout);
    setSlotAssignment(assignment);
    setLayoutModalVisible(false);
  };

  const toggleImage = (id: number) =>
    setSelectedImageIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert("Required", "Please enter a title"); return; }
    if (!selectedLayout) { Alert.alert("Required", "Please select a layout"); return; }
    const imageIds = slotAssignment.filter((id): id is number => id !== null);
    if (!imageIds.length) { Alert.alert("Required", "Please arrange images"); return; }

    setSaving(true);
    await onSend({ title, description, imageIds, screenLayout: selectedLayout, deviceId });
    setSaving(false);
    onClose();
  };

  if (!content) return null;
  const layoutLabel = getLayoutConfig(selectedLayout)?.label || selectedLayout;

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { width: "92%", maxWidth: 500, maxHeight: "90%" }]}>
            <View style={styles.modalHeader}>
              <Ionicons name="create-outline" size={22} color={C.primary} />
              <Text style={styles.modalTitle}>Edit Live Content</Text>
              <TouchableOpacity onPress={onClose} style={{ marginLeft: "auto" }}>
                <Ionicons name="close" size={22} color={C.textLight} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>
              {/* Images */}
              <View style={{ marginBottom: 18 }}>
                <Text style={styles.fieldLabel}>Images ({selectedImageIds.length} selected)</Text>
                {selectedImageIds.length > 0 && (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    {selectedImageIds.map((id, idx) => {
                      const img = imageList.find(i => i.imageId === id);
                      return (
                        <View key={id} style={{ width: 60, borderRadius: 8, overflow: "hidden", backgroundColor: C.surfaceAlt, borderWidth: 1.5, borderColor: C.border }}>
                          {img?.imageurl
                            ? <Image source={{ uri: img.imageurl }} style={{ width: "100%", height: 48 }} resizeMode="cover" />
                            : <View style={{ height: 48, justifyContent: "center", alignItems: "center", backgroundColor: C.surfaceAlt }}>
                                <Ionicons name="image-outline" size={16} color={C.textLight} />
                              </View>
                          }
                          <View style={{ position: "absolute", top: 4, left: 4, backgroundColor: C.primary, borderRadius: 99, width: 16, height: 16, justifyContent: "center", alignItems: "center" }}>
                            <Text style={{ fontSize: 8, color: "#fff", fontFamily: "Poppins_700Bold" }}>{idx + 1}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
                <TouchableOpacity style={styles.editButton} onPress={() => setImageModalVisible(true)}>
                  <Ionicons name="images-outline" size={16} color={C.primary} />
                  <Text style={styles.editButtonText}>Change Images</Text>
                </TouchableOpacity>
              </View>

              {/* Layout */}
              <View style={{ marginBottom: 18 }}>
                <Text style={styles.fieldLabel}>Layout</Text>
                {selectedLayout && (
                  <View style={styles.layoutPreview}>
                    <Ionicons name="grid-outline" size={14} color={C.success} />
                    <Text style={styles.layoutPreviewText}>{layoutLabel}</Text>
                    <Text style={styles.layoutPreviewSub}>{slotAssignment.filter(Boolean).length} placed</Text>
                  </View>
                )}
                <TouchableOpacity style={styles.editButton} onPress={() => setLayoutModalVisible(true)}>
                  <Ionicons name="grid-outline" size={16} color={C.primary} />
                  <Text style={styles.editButtonText}>Change Layout</Text>
                </TouchableOpacity>
              </View>

              {/* Title */}
              <View style={{ marginBottom: 14 }}>
                <Text style={styles.fieldLabel}>Title *</Text>
                <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Enter title" placeholderTextColor={C.textLight} />
              </View>

              {/* Description */}
              <View style={{ marginBottom: 18 }}>
                <Text style={styles.fieldLabel}>Description</Text>
                <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Optional description" placeholderTextColor={C.textLight} multiline numberOfLines={3} textAlignVertical="top" />
              </View>

              {/* Preview */}
              <View style={{ marginBottom: 8, alignItems: "center" }}>
                <Text style={[styles.fieldLabel, { alignSelf: "flex-start" }]}>Preview</Text>
                <TVNoticeBoard slotAssignment={slotAssignment} imageList={imageList} selectedLayout={selectedLayout} title={title} />
              </View>
            </ScrollView>

            <View style={[styles.modalActions, { marginTop: 16 }]}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirmBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <><Ionicons name="send" size={15} color="#fff" /><Text style={styles.modalConfirmText}>Send to TV</Text></>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ImageSelectModal visible={imageModalVisible} onClose={() => setImageModalVisible(false)} options={imageList} selected={selectedImageIds} onToggle={toggleImage} maxSelect={6} />
      <LayoutArrangeModal visible={layoutModalVisible} onClose={() => setLayoutModalVisible(false)} onConfirm={handleLayoutConfirm} imageList={imageList} selectedImageIds={selectedImageIds} layouts={layouts} />
    </>
  );
};

// ─── SECTION HEADER ───────────────────────────────────────────────────────────

const SectionHeader = ({ icon, title, badge, badgeColor = C.primary }: {
  icon: any; title: string; badge?: string | number; badgeColor?: string;
}) => (
  <View style={styles.cardTitleRow}>
    <Ionicons name={icon} size={16} color={C.primary} />
    <Text style={styles.cardTitle}>{title}</Text>
    {badge !== undefined && (
      <View style={{ backgroundColor: C.primaryGhost, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}>
        <Text style={{ fontSize: 11, fontFamily: "Poppins_600SemiBold", color: badgeColor }}>{badge}</Text>
      </View>
    )}
  </View>
);

// ─── IMAGE THUMBNAIL STRIP ────────────────────────────────────────────────────

const ImageStrip = ({ ids, imageList, onRemove }: {
  ids: number[]; imageList: any[]; onRemove?: (id: number) => void;
}) => {
  if (!ids.length) return null;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
      {ids.map((id, idx) => {
        const img = imageList.find(i => i.imageId === id);
        return (
          <View key={id} style={{ width: 60, borderRadius: 8, overflow: "hidden", backgroundColor: C.surfaceAlt, borderWidth: 1.5, borderColor: C.border }}>
            {img?.imageurl
              ? <Image source={{ uri: img.imageurl }} style={{ width: "100%", height: 48 }} resizeMode="cover" />
              : <View style={{ height: 48, justifyContent: "center", alignItems: "center" }}>
                  <Ionicons name="image-outline" size={16} color={C.textLight} />
                </View>
            }
            <View style={{ position: "absolute", top: 3, left: 3, backgroundColor: C.primary, borderRadius: 99, width: 15, height: 15, justifyContent: "center", alignItems: "center" }}>
              <Text style={{ fontSize: 7, color: "#fff", fontFamily: "Poppins_700Bold" }}>{idx + 1}</Text>
            </View>
            {onRemove && (
              <TouchableOpacity onPress={() => onRemove(id)} style={{ position: "absolute", top: 2, right: 2 }}>
                <Ionicons name="close-circle" size={14} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const [loaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });

  const { recentImages, loading: dashLoading, refreshAllData: refreshDash, getStatistics } = useDashboard();
  const {
    lutData, liveDisplays, loading: contentLoading,
    sendContentToDevice, stopCurrentContent,
    refreshAllData: refreshContent,
  } = useContent();

  const [refreshing, setRefreshing] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [sending, setSending] = useState(false);
  const [stopConfirmVisible, setStopConfirmVisible] = useState(false);
  const [selectedStopContentId, setSelectedStopContentId] = useState<number | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [layoutModalVisible, setLayoutModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedLiveContent, setSelectedLiveContent] = useState<any>(null);

  // New content form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedImageIds, setSelectedImageIds] = useState<number[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<string>("");
  const [slotAssignment, setSlotAssignment] = useState<(number | null)[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  const isMobile = screenWidth < BREAKPOINTS.mobile;
  const isLoading = dashLoading || contentLoading;

  useEffect(() => {
    if (lutData.deviceList.length > 0 && !selectedDeviceId)
      setSelectedDeviceId(lutData.deviceList[0].deviceId);
  }, [lutData]);

  const toggleImage = (id: number) =>
    setSelectedImageIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshDash(), refreshContent()]);
    setRefreshing(false);
  };

  const stats = getStatistics();
  const selectedDevice = lutData.deviceList.find(d => d.deviceId === selectedDeviceId);
  const selectedLayoutLabel = getLayoutConfig(selectedLayout)?.label || selectedLayout;
  const deviceOptions = lutData.deviceList.map(d => ({ label: d.displayName, value: d.deviceId, subtitle: d.deviceName }));

  const step1Done = selectedImageIds.length > 0;
  const step2Done = !!selectedLayout && slotAssignment.filter(Boolean).length > 0;
  const step3Done = step2Done && !!title.trim() && !!selectedDeviceId;

  // ── NEW CONTENT flow ─────────────────────────────────────────────────────────
  const handleSendPress = () => {
    if (!title.trim()) { Alert.alert("Required", "Please enter a title"); return; }
    if (!slotAssignment.filter(Boolean).length) { Alert.alert("Required", "Please arrange images into a layout"); return; }
    if (!selectedLayout) { Alert.alert("Required", "Please choose a layout"); return; }
    if (!selectedDeviceId) { Alert.alert("Required", "Please select a device"); return; }
    setConfirmVisible(true);
  };

  const handleConfirmSend = async () => {
    setConfirmVisible(false);
    setSending(true);
    const imageIds = slotAssignment.filter((id): id is number => id !== null);
    const result = await sendContentToDevice({ title, description, imageIds, screenLayout: selectedLayout, deviceId: selectedDeviceId });
    setSending(false);
    if (result.success) {
      await refreshDash();
      setTitle(""); setDescription(""); setSelectedImageIds([]); setSelectedLayout(""); setSlotAssignment([]);
    }
  };

  // ── EDIT LIVE CONTENT flow ───────────────────────────────────────────────────
  const handleSendEditedContent = async (payload: {
    title: string; description: string;
    imageIds: number[]; screenLayout: string; deviceId: string;
  }) => {
    const result = await sendContentToDevice(payload);
    if (result.success) await refreshDash();
  };

  const handleStop = (contentId: number) => { setSelectedStopContentId(contentId); setStopConfirmVisible(true); };

  const handleConfirmStop = async () => {
    if (selectedStopContentId && selectedDeviceId) {
      setStopConfirmVisible(false);
      await stopCurrentContent(selectedDeviceId, selectedStopContentId);
      setSelectedStopContentId(null);
      await refreshDash();
    }
  };

  const handleEditLiveContent = (content: any) => { setSelectedLiveContent(content); setEditModalVisible(true); };

  if (!loaded) return null;

  const gap = isMobile ? 12 : 16;
  const cp  = isMobile ? 14 : 20;

  return (
    <ResponsiveLayout>
      <View style={styles.container}>
        <ImageSelectModal visible={imageModalVisible} onClose={() => setImageModalVisible(false)} options={lutData.imageList} selected={selectedImageIds} onToggle={toggleImage} maxSelect={6} />
        <LayoutArrangeModal
          visible={layoutModalVisible} onClose={() => setLayoutModalVisible(false)}
          onConfirm={(layout, assignment) => { setSelectedLayout(layout); setSlotAssignment(assignment); setLayoutModalVisible(false); }}
          imageList={lutData.imageList} selectedImageIds={selectedImageIds} layouts={lutData.screenLayouts || []}
        />

        {/* Edit modal */}
        <LiveContentEditModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          content={selectedLiveContent}
          imageList={lutData.imageList}
          layouts={lutData.screenLayouts || []}
          deviceId={selectedLiveContent?.deviceId || selectedDeviceId}
          onSend={handleSendEditedContent}
        />

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View style={[styles.content, { padding: isMobile ? 12 : 20, paddingTop: isMobile ? 16 : 24, gap }]}>

            {/* HEADER */}
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

            {/* STATS */}
            <View style={[styles.statsRow, { gap: isMobile ? 8 : 10 }]}>
              <StatCard icon="radio-outline" num={stats.liveScreens} label="Live Screens" iconBg="rgba(255,255,255,0.2)" iconColor="#fff" bg={C.primary} textColor="#fff" labelColor="rgba(255,255,255,0.7)" />
              <StatCard icon="checkmark-circle-outline" num={stats.onlineDevices} label="Online" iconBg={C.successBg} iconColor={C.success} />
              <StatCard icon="close-circle-outline" num={stats.offlineDevices} label="Offline" iconBg={C.dangerBg} iconColor={C.danger} />
              {!isMobile && <StatCard icon="tv-outline" num={stats.totalDevices} label="Total Devices" iconBg={C.brownLight} iconColor={C.brownMid} />}
            </View>

            {/* LIVE DISPLAYS */}
            {liveDisplays.length > 0 && (
              <View style={[styles.card, { padding: cp }]}>
                <View style={styles.cardTitleRow}>
                  <View style={styles.livePulse} />
                  <Text style={styles.cardTitle}>Live Displays</Text>
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeText}>{liveDisplays.length} LIVE</Text>
                  </View>
                </View>
                {liveDisplays.map((live) => (
                  <View key={live.contentId} style={styles.liveCard}>
                    <View style={styles.liveCardLeft}>
                      <Text style={styles.liveDeviceName}>{live.displayName || live.deviceName}</Text>
                      <Text style={styles.liveTitle}>"{live.title}"</Text>
                      <View style={styles.liveTagRow}>
                        <View style={styles.liveTag}>
                          <Ionicons name="grid-outline" size={10} color={C.primary} />
                          <Text style={styles.liveTagText}>{live.screenLayout}</Text>
                        </View>
                        <View style={[styles.liveTag, { backgroundColor: C.successBg }]}>
                          <View style={[styles.liveDot, { backgroundColor: C.success }]} />
                          <Text style={[styles.liveTagText, { color: C.success }]}>{live.status}</Text>
                        </View>
                      </View>
                      <View style={styles.liveImagePreview}>
                        {live.images?.slice(0, 4).map((img: any, idx: number) => {
                          const imageData = lutData.imageList.find(i => i.imageId === img.imageId);
                          return (
                            <View key={idx} style={styles.liveThumbWrapper}>
                              {imageData?.imageurl
                                ? <Image source={{ uri: imageData.imageurl }} style={styles.liveThumb} resizeMode="cover" />
                                : <View style={[styles.liveThumb, styles.liveThumbPlaceholder]}><Ionicons name="image-outline" size={12} color={C.textLight} /></View>
                              }
                            </View>
                          );
                        })}
                        {live.images?.length > 4 && (
                          <View style={styles.liveThumbMore}>
                            <Text style={styles.liveThumbMoreText}>+{live.images.length - 4}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.liveCardActions}>
                      <TouchableOpacity style={styles.editLiveBtn} onPress={() => handleEditLiveContent(live)}>
                        <Ionicons name="create-outline" size={13} color={C.primary} />
                        <Text style={styles.editLiveBtnText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.stopBtn} onPress={() => handleStop(live.contentId)}>
                        <Ionicons name="stop" size={13} color="#fff" />
                        <Text style={styles.stopBtnText}>Stop</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* STEPS */}
            <View style={styles.stepsRow}>
              <StepBadge num={1} label="Images" done={step1Done} />
              <View style={styles.stepLine} />
              <StepBadge num={2} label="Layout" done={step2Done} />
              <View style={styles.stepLine} />
              <StepBadge num={3} label="Deploy" done={step3Done} />
            </View>

            {/* MAIN GRID - ALWAYS SHOW ALL SECTIONS */}
            <View style={[styles.mainGrid, { flexDirection: isMobile ? "column" : "row", gap: isMobile ? gap : 20, alignItems: "flex-start" }]}>

              {/* LEFT COLUMN */}
              <View style={[styles.leftCol, { flex: isMobile ? undefined : 3, gap, overflow: "visible", width: isMobile ? "100%" : undefined }]}>

                {/* Step 1 - ALWAYS VISIBLE */}
                <View style={[styles.card, { padding: cp, width: "100%" }]}>
                  <View style={styles.cardTitleRow}>
                    <View style={styles.stepNumSmall}><Text style={styles.stepNumSmallText}>1</Text></View>
                    <Ionicons name="images-outline" size={16} color={C.primary} />
                    <Text style={styles.cardTitle}>Select Images</Text>
                    {selectedImageIds.length > 0 && (
                      <View style={styles.cardBadgeBlue}><Text style={styles.cardBadgeBlueText}>{selectedImageIds.length} selected</Text></View>
                    )}
                  </View>
                  <ImageStrip ids={selectedImageIds} imageList={lutData.imageList} onRemove={toggleImage} />
                  <TouchableOpacity
                    style={{ 
                      flexDirection: "row", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      gap: 8, 
                      paddingVertical: 13, 
                      borderRadius: 10, 
                      borderWidth: 1.5, 
                      borderStyle: "dashed", 
                      borderColor: selectedImageIds.length > 0 ? C.primary : C.border, 
                      backgroundColor: selectedImageIds.length > 0 ? C.primaryGhost : "transparent",
                      width: "100%"
                    }}
                    onPress={() => setImageModalVisible(true)}
                  >
                    <Ionicons name="add-circle-outline" size={18} color={selectedImageIds.length > 0 ? C.primary : C.textLight} />
                    <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 14, color: selectedImageIds.length > 0 ? C.primary : C.textLight }}>
                      {selectedImageIds.length > 0 ? `Edit Selection (${selectedImageIds.length})` : "Browse & Select Images"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Step 2 - ALWAYS VISIBLE */}
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
                      <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 12, color: C.success, flex: 1 }}>
                        "{selectedLayoutLabel}" — {slotAssignment.filter(Boolean).length} image(s) placed
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={{ 
                      flexDirection: "row", 
                      alignItems: "center", 
                      justifyContent: "center", 
                      gap: 8, 
                      paddingVertical: 13, 
                      borderRadius: 10, 
                      backgroundColor: C.primary,
                      width: "100%",
                      opacity: selectedImageIds.length > 0 ? 1 : 0.5
                    }}
                    onPress={() => {
                      if (selectedImageIds.length > 0) {
                        setLayoutModalVisible(true);
                      } else {
                        Alert.alert("Select Images First", "Please select at least one image before arranging the layout.");
                      }
                    }}
                  >
                    <Ionicons name="grid" size={18} color="#fff" />
                    <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#fff" }}>
                      {selectedLayout ? "Change Layout / Rearrange" : "Choose Layout & Arrange"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Step 3 - ALWAYS VISIBLE */}
                <View style={[styles.card, { padding: cp, width: "100%" }]}>
                  <View style={styles.cardTitleRow}>
                    <View style={styles.stepNumSmall}><Text style={styles.stepNumSmallText}>3</Text></View>
                    <Ionicons name="create-outline" size={16} color={C.primary} />
                    <Text style={styles.cardTitle}>Content Details</Text>
                  </View>
                  <Text style={styles.fieldLabel}>Title *</Text>
                  <TextInput 
                    style={[styles.input, { width: "100%" }]} 
                    value={title} 
                    onChangeText={setTitle} 
                    placeholder="e.g. Summer Promo 2025" 
                    placeholderTextColor={C.textLight} 
                  />
                  <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Description</Text>
                  <TextInput 
                    style={[styles.input, styles.textArea, { width: "100%" }]} 
                    value={description} 
                    onChangeText={setDescription} 
                    placeholder="Optional description" 
                    placeholderTextColor={C.textLight} 
                    multiline 
                    numberOfLines={3} 
                    textAlignVertical="top" 
                  />
                </View>
              </View>

              {/* RIGHT COLUMN */}
              <View style={[styles.rightCol, { flex: isMobile ? undefined : 2, gap, width: isMobile ? "100%" : undefined }]}>

                {/* Device */}
                <View style={[styles.card, { zIndex: 9999, padding: cp, overflow: "visible", position: "relative", width: "100%" }]}>
                  <SectionHeader icon="tv-outline" title="Target Device" />
                  {lutData.deviceList.length === 0 && !contentLoading
                    ? <Text style={styles.emptyHint}>No devices available</Text>
                    : <Dropdown label="SELECT DEVICE" icon="tv-outline" placeholder="Choose a device…" options={deviceOptions} selected={selectedDeviceId} onSelect={setSelectedDeviceId} />
                  }
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

                {/* Preview - ALWAYS VISIBLE */}
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

                {/* Deploy */}
                <View style={[styles.card, styles.deployCard, { padding: cp, width: "100%" }]}>
                  <View style={styles.deployHeader}>
                    <Text style={styles.deployHeading}>🚀 Ready to Deploy</Text>
                    <Text style={styles.deploySub}>Review before sending to TV.</Text>
                  </View>
                  <View style={styles.summaryList}>
                    <SummaryRow icon="text-outline" label="Title" value={title || "—"} />
                    <SummaryRow icon="images-outline" label="Images" value={slotAssignment.filter(Boolean).length > 0 ? `${slotAssignment.filter(Boolean).length} placed` : "—"} />
                    <SummaryRow icon="grid-outline" label="Layout" value={selectedLayoutLabel || "—"} />
                    <SummaryRow icon="tv-outline" label="Device" value={selectedDevice?.displayName || "—"} />
                  </View>
                  <TouchableOpacity 
                    style={[styles.deployBtn, sending && { opacity: 0.6 }, { width: "100%" }]} 
                    onPress={handleSendPress} 
                    disabled={sending}
                  >
                    {sending
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <><Ionicons name="send" size={16} color="#fff" /><Text style={styles.deployBtnText}>Send to TV</Text></>
                    }
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* RECENT UPLOADS */}
            {recentImages.length > 0 && (
              <View style={[styles.card, { padding: cp }]}>
                <View style={styles.cardTitleRow}>
                  <Ionicons name="time-outline" size={16} color={C.primary} />
                  <Text style={styles.cardTitle}>Recent Uploads</Text>
                  <Text style={styles.cardBadge}>{recentImages.length}</Text>
                </View>
                <View style={styles.recentGrid}>
                  {recentImages.slice(0, 6).map((img) => (
                    <View key={img.imageId} style={styles.recentCard}>
                      <Image source={{ uri: img.imageurl }} style={styles.recentThumb} resizeMode="cover" />
                      <View style={styles.recentPin}><Ionicons name="pin" size={10} color={C.accent} /></View>
                      <View style={styles.recentInfo}>
                        <Text style={styles.recentName} numberOfLines={1}>{img.imageName}</Text>
                        <Text style={styles.recentDate}>{new Date(img.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* CONFIRM SEND (new content only) */}
        <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { width: isMobile ? "92%" : "100%", maxWidth: 440 }]}>
              <View style={styles.modalHeader}>
                <Ionicons name="send-outline" size={22} color={C.primary} />
                <Text style={styles.modalTitle}>Confirm Deployment</Text>
              </View>
              <Text style={styles.modalSub}>Sending content to TV — please confirm:</Text>
              <View style={styles.modalSummary}>
                <ModalRow label="Device" value={selectedDevice?.displayName || "—"} />
                <ModalRow label="Images" value={`${slotAssignment.filter(Boolean).length} placed`} />
                <ModalRow label="Title" value={title} />
                <ModalRow label="Layout" value={selectedLayoutLabel} />
                {description ? <ModalRow label="Description" value={description} /> : null}
              </View>
              <View style={[styles.modalActions, { flexDirection: isMobile ? "column" : "row" }]}>
                <TouchableOpacity style={[styles.modalCancelBtn, isMobile && { width: "100%" }]} onPress={() => setConfirmVisible(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalConfirmBtn, isMobile && { width: "100%" }]} onPress={handleConfirmSend}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={styles.modalConfirmText}>Confirm & Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* STOP MODAL */}
        <Modal visible={stopConfirmVisible} transparent animationType="fade" onRequestClose={() => setStopConfirmVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { width: isMobile ? "92%" : "100%", maxWidth: 380 }]}>
              <View style={styles.modalHeader}>
                <Ionicons name="stop-circle-outline" size={22} color={C.danger} />
                <Text style={[styles.modalTitle, { color: C.danger }]}>Stop Content</Text>
              </View>
              <Text style={styles.modalSub}>Are you sure you want to stop this live content?</Text>
              <View style={[styles.modalActions, { flexDirection: isMobile ? "column" : "row" }]}>
                <TouchableOpacity style={[styles.modalCancelBtn, isMobile && { width: "100%" }]} onPress={() => setStopConfirmVisible(false)}>
                  <Text style={styles.modalCancelText}>No, Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: C.danger }, isMobile && { width: "100%" }]} onPress={handleConfirmStop}>
                  <Ionicons name="stop" size={16} color="#fff" />
                  <Text style={styles.modalConfirmText}>Yes, Stop</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ResponsiveLayout>
  );
}