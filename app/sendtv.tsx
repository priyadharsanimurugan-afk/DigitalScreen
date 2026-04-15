// app/send-to-tv.tsx
import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Image, useWindowDimensions,
} from "react-native";
import {
  useFonts, Poppins_400Regular, Poppins_500Medium,
  Poppins_600SemiBold, Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import ResponsiveLayout from "@/components/responsiveLayout";
import { useContent } from "@/hooks/useContent";
import { useDashboard } from "@/hooks/useDashboard";
import { styles, C, BREAKPOINTS, dd } from "./dashboard.styles";
import { LayoutArrangeModal } from "@/components/layoutArrangeModal"; // Add this import
import { getLayoutConfig } from "@/constants/layout";
import { StepBadge, SummaryRow, TVNoticeBoard } from "@/components/dashboardAtoms";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/constants/toastConfig"; 

// ─── DROPDOWN ────────────────────────────────────────────────────────────────
const Dropdown = ({
  label, icon, placeholder, options, selected, onSelect,
}: {
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
          activeOpacity={0.8}>
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
                  <TouchableOpacity
                    key={String(opt.value)}
                    style={[dd.item, isSel && dd.itemActive, idx < options.length - 1 && dd.itemBorder]}
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
            {img?.imageurl
              ? <Image source={{ uri: img.imageurl }} style={{ width: "100%", height: 48 }} resizeMode="cover" />
              : <View style={{ height: 48, justifyContent: "center", alignItems: "center" }}><Ionicons name="image-outline" size={16} color={C.textLight} /></View>}
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

// ─── SEND TO TV SCREEN ────────────────────────────────────────────────────────
export default function SendToTVScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  const [loaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });

  const { refreshAllData: refreshDash } = useDashboard();
  const { lutData, loading: contentLoading, sendContentToDevice } = useContent();

  const [sending, setSending] = useState(false);
  const [layoutModalVisible, setLayoutModalVisible] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedImageIds, setSelectedImageIds] = useState<number[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<string>("");
  const [slotAssignment, setSlotAssignment] = useState<number[][]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  const isMobile = screenWidth < BREAKPOINTS.mobile;
  const isDesktop = screenWidth >= 1024;
  const gap = isMobile ? 12 : 16;
  const cp = isMobile ? 14 : 20;

  const selectedDevice = lutData.deviceList.find((d) => d.deviceId === selectedDeviceId);
  const selectedLayoutLabel = getLayoutConfig(selectedLayout)?.label || selectedLayout;
  const deviceOptions = lutData.deviceList.map((d) => ({ label: d.displayName, value: d.deviceId, subtitle: d.deviceName }));

  const step1Done = selectedImageIds.length > 0;
  const step2Done = !!selectedLayout && slotAssignment.filter(Boolean).length > 0;
  const step3Done = step2Done && !!title.trim() && !!selectedDeviceId;

  const handleLayoutButtonPress = () => {
    setLayoutModalVisible(true);
  };

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
        setTitle("");
        setDescription("");
        setSelectedImageIds([]);
        setSelectedLayout("");
        setSlotAssignment([]);
        setSelectedDeviceId(null);
        await refreshDash();
        Toast.show({ type: "success", text1: "Success", text2: `Content sent to ${selectedDevice?.displayName || "device"} successfully`, visibilityTime: 2000 });
      } else {
        Toast.show({ type: "error", text1: "Error", text2: result.error || "Failed to send content", visibilityTime: 2000 });
      }
    } catch {
      Toast.show({ type: "error", text1: "Error", text2: "An unexpected error occurred", visibilityTime: 2000 });
    } finally {
      setSending(false);
    }
  };

  if (!loaded) return null;

  return (
    <ResponsiveLayout>
      <View style={styles.container}>
        {/* Layout Arrange Modal */}
        <LayoutArrangeModal
          visible={layoutModalVisible}
          onClose={() => setLayoutModalVisible(false)}
          onConfirm={(layout: string, slotsArray: number[][]) => {
            setSelectedLayout(layout);
            setSlotAssignment(slotsArray);
            // Extract all selected image IDs from the slots array with proper typing
            const allImageIds = slotsArray.flat().filter((id): id is number => id !== null && id !== undefined);
            setSelectedImageIds([...new Set(allImageIds)]);
            setLayoutModalVisible(false);
          }}
          imageList={lutData.imageList}
          selectedImageIds={selectedImageIds}
          layouts={lutData.screenLayouts || []}
        />

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}>
          <View style={[styles.content, { padding: isMobile ? 12 : 20, paddingTop: isMobile ? 16 : 24, gap }]}>

            {/* ── Header ── */}
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
              
                <View style={styles.headerBadge}>
                  <Ionicons name="send" size={12} color={C.brownMid} />
                  <Text style={styles.headerBadgeText}>Content Deploy</Text>
                </View>
                <Text style={[styles.pageTitle, { fontSize: isMobile ? 22 : 28 }]}>Send to TV</Text>
                <Text style={styles.pageSubtitle}>Select images, arrange layout & deploy</Text>
              </View>
              <View style={styles.headerRight}>
                {contentLoading && <ActivityIndicator color={C.primary} size="small" />}
              </View>
            </View>

            {/* ── Steps ── */}
            <View style={styles.stepsRow}>
              <StepBadge num={1} label="Images" done={step1Done} />
              <View style={styles.stepLine} />
              <StepBadge num={2} label="Layout" done={step2Done} />
              <View style={styles.stepLine} />
              <StepBadge num={3} label="Deploy" done={step3Done} />
            </View>

            {/* ── Main Grid ── */}
            <View style={[styles.mainGrid, { flexDirection: isMobile ? "column" : "row", gap: isMobile ? gap : 20, alignItems: "flex-start" }]}>

              {/* Left column */}
              <View style={[styles.leftCol, { flex: isMobile ? undefined : 3, gap, overflow: "visible", width: isMobile ? "100%" : undefined }]}>

                {/* Step 1 – Selected Images Summary */}
                {selectedImageIds.length > 0 && (
                  <View style={[styles.card, { padding: cp, width: "100%" }]}>
                    <View style={styles.cardTitleRow}>
                      <View style={styles.stepNumSmall}><Text style={styles.stepNumSmallText}>1</Text></View>
                      <Ionicons name="images-outline" size={16} color={C.primary} />
                      <Text style={styles.cardTitle}>Selected Images</Text>
                      <View style={styles.cardBadgeBlue}>
                        <Text style={styles.cardBadgeBlueText}>{selectedImageIds.length}</Text>
                      </View>
                    </View>
                    <ImageStrip 
                      ids={selectedImageIds} 
                      imageList={lutData.imageList}
                      onRemove={(id) => setSelectedImageIds(prev => prev.filter(i => i !== id))}
                    />
                    <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 11, color: C.textLight, marginTop: 4 }}>
                      Images are managed through the layout arrangement modal
                    </Text>
                  </View>
                )}

                {/* Step 2 – Arrange Layout */}
                <View style={[styles.card, { padding: cp, width: "100%" }]}>
                  <View style={styles.cardTitleRow}>
                    <View style={styles.stepNumSmall}><Text style={styles.stepNumSmallText}>2</Text></View>
                    <Ionicons name="grid-outline" size={16} color={C.primary} />
                    <Text style={styles.cardTitle}>Arrange Layout</Text>
                    {selectedLayout && (
                      <View style={styles.cardBadgeBlue}>
                        <Text style={styles.cardBadgeBlueText}>{selectedLayoutLabel}</Text>
                      </View>
                    )}
                  </View>
                  {selectedLayout && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, backgroundColor: C.successBg, borderRadius: 10, padding: 10 }}>
                      <Ionicons name="checkmark-circle" size={15} color={C.success} />
                      <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 12, color: C.success, flex: 1 }}>
                        "{selectedLayoutLabel}" — {slotAssignment.filter(Boolean).length} slot(s) filled
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 10, backgroundColor: C.primary, width: "100%" }}
                    onPress={handleLayoutButtonPress}>
                    <Ionicons name="grid" size={18} color="#fff" />
                    <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#fff" }}>
                      {selectedLayout ? "Change Layout / Rearrange" : "Choose Layout & Arrange Images"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Step 3 – Content Details */}
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

              {/* Right column */}
              <View style={[styles.rightCol, { flex: isMobile ? undefined : 2, gap, width: isMobile ? "100%" : undefined }]}>

                {/* Target Device */}
                <View style={[styles.card, { zIndex: 9999, padding: cp, overflow: "visible", position: "relative", width: "100%" }]}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="tv-outline" size={16} color={C.primary} />
                    <Text style={styles.cardTitle}>Target Device</Text>
                  </View>
                  {lutData.deviceList.length === 0 && !contentLoading
                    ? <Text style={styles.emptyHint}>No devices available</Text>
                    : (
                      <Dropdown
                        label="SELECT DEVICE"
                        icon="tv-outline"
                        placeholder="Choose a device…"
                        options={deviceOptions}
                        selected={selectedDeviceId}
                        onSelect={setSelectedDeviceId}
                      />
                    )}
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

                {/* Live Preview */}
                <View style={[styles.card, { padding: cp, alignItems: "center", width: "100%" }]}>
                  <View style={[styles.cardTitleRow, { width: "100%" }]}>
                    <Ionicons name="eye-outline" size={16} color={C.primary} />
                    <Text style={styles.cardTitle}>Live Preview</Text>
                    <View style={styles.previewLiveBadge}>
                      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.brownMid }} />
                      <Text style={styles.previewLiveText}>PREVIEW</Text>
                    </View>
                  </View>
                  <TVNoticeBoard
                    slotAssignment={slotAssignment}
                    imageList={lutData.imageList}
                    selectedLayout={selectedLayout}
                    title={title}
                  />
                </View>
              </View>
            </View>

            {/* ── Deploy – full row ── */}
            <View style={[styles.card, styles.deployCard, { padding: cp, width: "100%" }]}>
              <View style={{ flexDirection: isDesktop ? "row" : "column", alignItems: isDesktop ? "center" : "flex-start", gap: 16 }}>
                <View style={{ flex: isDesktop ? 1 : undefined }}>
                  <Text style={styles.deployHeading}>🚀 Ready to Deploy</Text>
                  <Text style={styles.deploySub}>Review your content before sending to TV.</Text>
                  <View style={[styles.summaryList, isDesktop && { flexDirection: "row", flexWrap: "wrap", gap: 8 }]}>
                    {[
                      { icon: "text-outline", label: "Title", value: title || "—" },
                      { icon: "images-outline", label: "Total Images", value: selectedImageIds.length > 0 ? `${selectedImageIds.length}` : "—" },
                      { icon: "grid-outline", label: "Layout", value: selectedLayoutLabel || "—" },
                      { icon: "tv-outline", label: "Device", value: selectedDevice?.displayName || "—" },
                    ].map((row) => (
                      <View key={row.label} style={isDesktop ? { flex: 1, minWidth: 140, backgroundColor: "rgba(255,255,255,0.6)", borderRadius: 10, padding: 10 } : undefined}>
                        <SummaryRow icon={row.icon as any} label={row.label} value={row.value} />
                      </View>
                    ))}
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.deployBtn, sending && { opacity: 0.6 }, { width: isDesktop ? 200 : "100%", paddingVertical: 16 }]}
                  onPress={handleSendPress}
                  disabled={sending}>
                  {sending
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <><Ionicons name="send" size={18} color="#fff" /><Text style={[styles.deployBtnText, { fontSize: 15 }]}>Send to TV</Text></>}
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </ScrollView>
          <Toast config={toastConfig} />
      </View>
    </ResponsiveLayout>
  );
}