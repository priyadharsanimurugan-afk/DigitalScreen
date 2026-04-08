// app/index.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Image,
  useWindowDimensions,
  Animated,
} from "react-native";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { Ionicons } from "@expo/vector-icons";
import ResponsiveLayout from "@/components/responsiveLayout";
import { useDashboard } from "@/hooks/useDashboard";
import { useContent } from "@/hooks/useContent";
import { styles, C, BREAKPOINTS, dd, mip, sc } from "./dashboard.styles";
import { ImageSelectModal } from "@/components/ImageSelectModal";


// ─── HELPERS ──────────────────────────────────────────────────────────────────

const getDynamicRatioStyle = (ratio: string) => {
  const [w, h] = ratio.split(":").map(Number);
  if (!w || !h) return { width: 36, height: 20 };
  const base = 30;
  if (w > h) return { width: base, height: (base * h) / w };
  return { width: (base * w) / h, height: base };
};

// ─── LAYOUT PREVIEW ──────────────────────────────────────────────────────────

const LayoutPreview = ({ rows, cols, isActive }: { rows: number; cols: number; isActive: boolean }) => (
  <View style={{
    width: 38, height: 38, borderWidth: 1.5,
    borderColor: isActive ? "rgba(255,255,255,0.8)" : C.border,
    borderRadius: 5, overflow: "hidden", flexDirection: "column",
  }}>
    {Array.from({ length: rows }).map((_, r) => (
      <View key={r} style={{ flex: 1, flexDirection: "row" }}>
        {Array.from({ length: cols }).map((_, c) => (
          <View key={c} style={{
            flex: 1, borderWidth: 0.5,
            borderColor: isActive ? "rgba(255,255,255,0.5)" : C.border,
            backgroundColor: isActive ? "rgba(255,255,255,0.15)" : C.surfaceAlt,
          }} />
        ))}
      </View>
    ))}
  </View>
);

// ─── TV NOTICE BOARD LIVE PREVIEW ────────────────────────────────────────────

interface TVPreviewProps {
  selectedImageIds: number[];
  imageList: { imageId: number; imageName: string; imageurl?: string }[];
  selectedLayout: string;
  selectedRatio: string;
  title: string;
}

const TVNoticeBoard = ({ selectedImageIds, imageList, selectedLayout, selectedRatio, title }: TVPreviewProps) => {
  const [w, h] = selectedRatio ? selectedRatio.split(":").map(Number) : [16, 9];
  const safeW = w || 16;
  const safeH = h || 9;

  // TV frame dimensions — fixed container width
  const TV_W = 320;
  const TV_H = Math.round((TV_W * safeH) / safeW);

  const getImages = () => selectedImageIds.map(id => imageList.find(img => img.imageId === id)).filter(Boolean) as any[];
  const images = getImages();

  const parseLayout = (layout: string) => {
    const [r, c] = layout.split("x").map(Number);
    return { rows: r || 1, cols: c || 1 };
  };
  const { rows, cols } = parseLayout(selectedLayout);
  const totalSlots = rows * cols;

  const renderSlot = (index: number) => {
    const img = images[index];
    return (
      <View key={index} style={{
        flex: 1,
        margin: 1,
        backgroundColor: "#0A1628",
        borderRadius: 3,
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
        minHeight: 20,
      }}>
        {img?.imageurl ? (
          <Image source={{ uri: img.imageurl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        ) : (
          <View style={{ alignItems: "center", gap: 4 }}>
            <View style={{
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: "rgba(59,95,192,0.3)",
              justifyContent: "center", alignItems: "center",
              borderWidth: 1, borderColor: "rgba(59,95,192,0.5)",
            }}>
              <Ionicons name="image-outline" size={13} color="rgba(148,163,184,0.8)" />
            </View>
            <Text style={{ fontSize: 8, color: "rgba(100,116,139,0.8)", fontFamily: "Poppins_400Regular" }}>
              Slot {index + 1}
            </Text>
          </View>
        )}
        {/* Pin dot */}
        <View style={{
          position: "absolute", top: 4, left: 0, right: 0,
          alignItems: "center",
        }}>
          <View style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: img ? C.accent : "rgba(148,163,184,0.3)",
            shadowColor: img ? C.accent : "transparent",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 4,
            elevation: img ? 4 : 0,
          }} />
        </View>
      </View>
    );
  };

  return (
    <View style={{ alignItems: "center" }}>
      {/* TV Body */}
      <View style={{
        backgroundColor: "#0D1B2A",
        borderRadius: 16,
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 12,
        borderWidth: 2,
        borderColor: "#1E2D3D",
        width: TV_W + 24,
      }}>
        {/* Screen bezel */}
        <View style={{
          backgroundColor: "#060E18",
          borderRadius: 10,
          padding: 3,
          borderWidth: 1,
          borderColor: "#1A2840",
        }}>
          {/* Notice board screen */}
          <View style={{
            width: TV_W,
            height: TV_H,
            backgroundColor: "#0B1829",
            borderRadius: 8,
            overflow: "hidden",
            position: "relative",
          }}>
            {/* Cork texture background */}
            <View style={{
              position: "absolute", inset: 0,
              backgroundColor: "#0F2044",
              opacity: 0.6,
            }} />
            {/* Grid lines subtle */}
            <View style={{ position: "absolute", inset: 0, opacity: 0.05 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <View key={i} style={{
                  position: "absolute", left: 0, right: 0,
                  top: (TV_H / 8) * i, height: 1, backgroundColor: "#fff",
                }} />
              ))}
            </View>

            {/* Content area */}
            <View style={{ flex: 1, padding: 6 }}>
              {/* Title bar */}
              {title ? (
                <View style={{
                  flexDirection: "row", alignItems: "center", gap: 6,
                  marginBottom: 6, paddingHorizontal: 2,
                }}>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.accent }} />
                  <Text style={{
                    fontSize: 9, fontFamily: "Poppins_600SemiBold",
                    color: "rgba(255,255,255,0.9)", flex: 1,
                  }} numberOfLines={1}>{title}</Text>
                </View>
              ) : null}

              {/* Image grid slots */}
              <View style={{ flex: 1 }}>
                {Array.from({ length: rows }).map((_, rowIndex) => (
                  <View key={rowIndex} style={{ flex: 1, flexDirection: "row" }}>
                    {Array.from({ length: cols }).map((_, colIndex) => {
                      const slotIndex = rowIndex * cols + colIndex;
                      return slotIndex < totalSlots ? renderSlot(slotIndex) : null;
                    })}
                  </View>
                ))}
              </View>
            </View>

            {/* Live indicator overlay */}
            <View style={{
              position: "absolute", top: 6, right: 6,
              flexDirection: "row", alignItems: "center", gap: 3,
              backgroundColor: "rgba(239,68,68,0.2)",
              paddingHorizontal: 6, paddingVertical: 2,
              borderRadius: 99, borderWidth: 1, borderColor: "rgba(239,68,68,0.4)",
            }}>
              <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.live }} />
              <Text style={{ fontSize: 7, fontFamily: "Poppins_700Bold", color: C.live }}>LIVE</Text>
            </View>
          </View>
        </View>

        {/* TV stand details */}
        <View style={{ alignItems: "center", marginTop: 8, gap: 2 }}>
          <View style={{ width: 60, height: 4, backgroundColor: "#1A2840", borderRadius: 2 }} />
          <View style={{ width: 10, height: 8, backgroundColor: "#1A2840", borderRadius: 2 }} />
          <View style={{ width: 44, height: 3, backgroundColor: "#141F2E", borderRadius: 2 }} />
        </View>
      </View>

      {/* Labels */}
      <View style={{ flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {selectedRatio ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.primaryGhost, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
            <Ionicons name="scan-outline" size={10} color={C.primary} />
            <Text style={{ fontSize: 10, fontFamily: "Poppins_600SemiBold", color: C.primary }}>{selectedRatio}</Text>
          </View>
        ) : null}
        {selectedLayout ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.accentBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
            <Ionicons name="grid-outline" size={10} color={C.accent} />
            <Text style={{ fontSize: 10, fontFamily: "Poppins_600SemiBold", color: "#92400E" }}>{selectedLayout}</Text>
          </View>
        ) : null}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.successBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
          <Ionicons name="images-outline" size={10} color={C.success} />
          <Text style={{ fontSize: 10, fontFamily: "Poppins_600SemiBold", color: C.success }}>{selectedImageIds.length} img</Text>
        </View>
      </View>
    </View>
  );
};

// ─── IMAGE SELECT DROPDOWN ────────────────────────────────────────────────────

interface ImageSelectDropdownProps {
  options: { imageId: number; imageName: string; imageurl?: string }[];
  selected: number[];
  onToggle: (id: number) => void;
  maxSelect: number;
}

const ImageSelectDropdown = ({ options, selected, onToggle, maxSelect }: ImageSelectDropdownProps) => {
  const [open, setOpen] = useState(false);
  const previewSelected = options.filter(o => selected.includes(o.imageId));

  return (
    <View style={{ zIndex: 100 }}>
      {/* Trigger */}
      <TouchableOpacity
        style={[mip.trigger, open && mip.triggerOpen]}
        onPress={() => setOpen(!open)}
        activeOpacity={0.85}
      >
        <Ionicons name="images-outline" size={16} color={C.primary} />
        <View style={{ flex: 1 }}>
          {previewSelected.length > 0 ? (
            <Text style={mip.triggerText} numberOfLines={1}>
              {previewSelected.map(i => i.imageName).join(", ")}
            </Text>
          ) : (
            <Text style={mip.triggerPlaceholder}>Tap to select images…</Text>
          )}
        </View>
        <View style={mip.countBadge}>
          <Text style={mip.countText}>{selected.length}/{maxSelect}</Text>
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={C.textLight} />
      </TouchableOpacity>

      {/* Dropdown list */}
      {open && (
        <View style={mip.dropMenu}>
          <View style={mip.dropHeader}>
            <Text style={mip.dropHeaderText}>Select up to {maxSelect} image(s) — tap in order</Text>
          </View>
          <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
            {options.map((img, idx) => {
              const isSelected = selected.includes(img.imageId);
              const orderIndex = selected.indexOf(img.imageId);
              const atMax = !isSelected && selected.length >= maxSelect;

              return (
                <TouchableOpacity
                  key={img.imageId}
                  style={[
                    mip.dropItem,
                    isSelected && mip.dropItemActive,
                    atMax && mip.dropItemDisabled,
                    idx < options.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border },
                  ]}
                  onPress={() => {
                    if (!atMax) onToggle(img.imageId);
                  }}
                  activeOpacity={0.75}
                >
                  {/* Thumbnail */}
                  <View style={[mip.dropThumb, isSelected && { backgroundColor: C.primary }]}>
                    {img.imageurl ? (
                      <Image source={{ uri: img.imageurl }} style={{ width: "100%", height: "100%", borderRadius: 8 }} resizeMode="cover" />
                    ) : (
                      <Ionicons name={isSelected ? "checkmark" : "image-outline"} size={16} color={isSelected ? "#fff" : atMax ? C.border : C.textLight} />
                    )}
                    {isSelected && (
                      <View style={mip.orderBadge}>
                        <Text style={mip.orderBadgeText}>{orderIndex + 1}</Text>
                      </View>
                    )}
                  </View>

                  {/* Name */}
                  <Text style={[mip.dropItemName, isSelected && { color: C.primary }, atMax && { color: C.border }]} numberOfLines={1}>
                    {img.imageName}
                  </Text>

                  {isSelected && <Ionicons name="checkmark-circle" size={18} color={C.primary} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Done button */}
          <TouchableOpacity style={mip.doneBtn} onPress={() => setOpen(false)}>
            <Ionicons name="checkmark-done" size={16} color="#fff" />
            <Text style={mip.doneBtnText}>Done — {selected.length} selected</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Selected image pills below */}
     {previewSelected.length > 0 && (
  <View style={{
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  }}>
    {previewSelected.map((img, idx) => (
      <View key={img.imageId} style={{
        width: 70,
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: "#0F172A",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
      }}>
        
        {/* IMAGE */}
        {img.imageurl ? (
          <Image
            source={{ uri: img.imageurl }}
            style={{ width: "100%", height: 60 }}
            resizeMode="cover"
          />
        ) : (
          <View style={{
            height: 60,
            justifyContent: "center",
            alignItems: "center",
          }}>
            <Ionicons name="image-outline" size={16} color="#94A3B8" />
          </View>
        )}

        {/* ORDER BADGE */}
        <View style={{
          position: "absolute",
          top: 4,
          left: 4,
          backgroundColor: C.primary,
          borderRadius: 10,
          paddingHorizontal: 5,
        }}>
          <Text style={{ fontSize: 9, color: "#fff" }}>
            {idx + 1}
          </Text>
        </View>

        {/* REMOVE BUTTON */}
        <TouchableOpacity
          onPress={() => onToggle(img.imageId)}
          style={{
            position: "absolute",
            top: 4,
            right: 4,
          }}
        >
          <Ionicons name="close-circle" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    ))}
  </View>
)}

    </View>
  );
};

// ─── DROPDOWN ─────────────────────────────────────────────────────────────────

// ─── DROPDOWN ─────────────────────────────────────────────────────────────────

interface DropdownOption { label: string; value: string | number; subtitle?: string }
interface DropdownProps {
  label: string; icon: any; placeholder: string;
  options: DropdownOption[]; selected: string | number | null; onSelect: (v: any) => void;
}

const Dropdown = ({ label, icon, placeholder, options, selected, onSelect }: DropdownProps) => {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === selected)?.label || placeholder;
  const selectedSub = options.find((o) => o.value === selected)?.subtitle;

  return (
    <View style={{ zIndex: open ? 9999 : 1 }}>
      <Text style={dd.label}>{label}</Text>
      <View style={{ position: 'relative', zIndex: open ? 9999 : 1 }}>
        <TouchableOpacity 
          style={[dd.trigger, open && dd.triggerOpen]} 
          onPress={() => setOpen(!open)} 
          activeOpacity={0.8}
        >
          <Ionicons name={icon} size={16} color={selected ? C.primary : C.textLight} />
          <View style={{ flex: 1 }}>
            <Text style={[dd.triggerText, !selected && { color: C.textLight }]} numberOfLines={1}>{selectedLabel}</Text>
            {selectedSub && <Text style={dd.triggerSub} numberOfLines={1}>{selectedSub}</Text>}
          </View>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={C.textLight} />
        </TouchableOpacity>
        
        {open && (
          <View style={[dd.menu, { position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999 }]}>
            <ScrollView 
              style={{ maxHeight: 220 }} 
              nestedScrollEnabled 
              showsVerticalScrollIndicator={false}
            >
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
                      {opt.subtitle && <Text style={[dd.itemSub, isSelected && { color: C.primaryLight }]}>{opt.subtitle}</Text>}
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

// ─── STAT CARD ────────────────────────────────────────────────────────────────

const StatCard = ({ icon, num, label, iconBg, iconColor, bg, textColor, labelColor }: any) => (
  <View style={[sc.card, { backgroundColor: bg || C.surface }]}>
    <View style={[sc.iconBox, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <Text style={[sc.num, { color: textColor || C.text }]}>{num}</Text>
    <Text style={[sc.label, { color: labelColor || C.textLight }]}>{label}</Text>
  </View>
);

// ─── SUMMARY ROW ─────────────────────────────────────────────────────────────

const SummaryRow = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
  <View style={styles.summaryRow}>
    <Ionicons name={icon} size={13} color={C.textLight} />
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue} numberOfLines={1}>{value || "—"}</Text>
  </View>
);

const ModalRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.modalRow}>
    <Text style={styles.modalRowLabel}>{label}</Text>
    <Text style={styles.modalRowValue}>{value}</Text>
  </View>
);

// ─── STEP BADGE ──────────────────────────────────────────────────────────────

const StepBadge = ({ num, label, done }: { num: number; label: string; done: boolean }) => (
  <View style={styles.stepBadge}>
    <View style={[styles.stepNum, done && styles.stepNumDone]}>
      {done ? <Ionicons name="checkmark" size={12} color="#fff" /> : <Text style={styles.stepNumText}>{num}</Text>}
    </View>
    <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{label}</Text>
  </View>
);

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const [loaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });

  const { recentImages, loading: dashLoading, refreshAllData: refreshDash, getStatistics } = useDashboard();
  const { lutData, liveDisplays, loading: contentLoading, sendContentToDevice, stopCurrentContent, refreshAllData: refreshContent } = useContent();

  const [refreshing, setRefreshing] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [sending, setSending] = useState(false);
  const [stopConfirmVisible, setStopConfirmVisible] = useState(false);
  const [selectedStopContentId, setSelectedStopContentId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedImageIds, setSelectedImageIds] = useState<number[]>([]);
  const [selectedRatio, setSelectedRatio] = useState<string>("");
  const [selectedLayout, setSelectedLayout] = useState<string>("");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  const isMobile = screenWidth < BREAKPOINTS.mobile;
  const isTablet = screenWidth >= BREAKPOINTS.mobile && screenWidth < BREAKPOINTS.tablet;

  // Slots from layout — allow multiple images even in 1x1 (full screen cycles)
  const getMaxImages = (layout: string) => {
    const [r, c] = layout.split("x").map(Number);
    if (!r || !c) return 4;
    return r * c;
  };
  const maxImages = selectedLayout ? getMaxImages(selectedLayout) : 4;

  useEffect(() => {
    if (lutData.screenRatio.length > 0 && !selectedRatio) setSelectedRatio(lutData.screenRatio[0].value);
    if (lutData.screenLayout.length > 0 && !selectedLayout) setSelectedLayout(lutData.screenLayout[0].value);
    if (lutData.deviceList.length > 0 && !selectedDeviceId) setSelectedDeviceId(lutData.deviceList[0].deviceId);
  }, [lutData]);

  useEffect(() => {
    setSelectedImageIds((prev) => prev.slice(0, maxImages));
  }, [selectedLayout]);

  const toggleImage = (id: number) => {
    setSelectedImageIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= maxImages) {
        Alert.alert("Limit reached", `Up to ${maxImages} image(s) for this layout.`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshDash(), refreshContent()]);
    setRefreshing(false);
  };

  const stats = getStatistics();
  const selectedDevice = lutData.deviceList.find((d) => d.deviceId === selectedDeviceId);
  const selectedLayoutLabel = lutData.screenLayout.find((l) => l.value === selectedLayout)?.label || selectedLayout;
  const selectedRatioLabel = lutData.screenRatio.find((r) => r.value === selectedRatio)?.label || selectedRatio;
  const selectedImageNames = selectedImageIds
    .map((id) => lutData.imageList.find((img) => img.imageId === id)?.imageName || "").filter(Boolean).join(", ");

  const handleSendPress = () => {
    if (!title.trim()) { Alert.alert("Required", "Please enter a title"); return; }
    if (selectedImageIds.length === 0) { Alert.alert("Required", "Please select at least one image"); return; }
    if (!selectedRatio) { Alert.alert("Required", "Please select a screen ratio"); return; }
    if (!selectedLayout) { Alert.alert("Required", "Please select a screen layout"); return; }
    if (!selectedDeviceId) { Alert.alert("Required", "Please select a device"); return; }
    setConfirmVisible(true);
  };

  const handleConfirmSend = async () => {
    setConfirmVisible(false);
    setSending(true);
    const result = await sendContentToDevice({ title, description, imageIds: selectedImageIds, screenRatio: selectedRatio, screenLayout: selectedLayout, deviceId: selectedDeviceId });
    setSending(false);
    if (result.success) await refreshDash();
  };

  const handleStop = (contentId: number) => { setSelectedStopContentId(contentId); setStopConfirmVisible(true); };

  const handleConfirmStop = async () => {
    if (selectedStopContentId && selectedDeviceId) {
      setStopConfirmVisible(false);
      await stopCurrentContent(selectedDeviceId, selectedStopContentId);
      setSelectedStopContentId(null);
    }
  };

  if (!loaded) return null;
  const isLoading = dashLoading || contentLoading;

  const deviceOptions = lutData.deviceList.map((d) => ({ label: d.displayName, value: d.deviceId, subtitle: d.deviceName }));

  const ds = {
    p: isMobile ? 12 : 20,
    pt: isMobile ? 16 : 24,
    gap: isMobile ? 12 : 16,
    statsGap: isMobile ? 6 : 10,
    cp: isMobile ? 14 : 18,
    titleSize: isMobile ? 22 : 26,
    gridDir: isMobile ? "column" : "row" as any,
    gridGap: isMobile ? 16 : 20,
    leftFlex: isMobile ? undefined : 3,
    rightFlex: isMobile ? undefined : 2,
  };

  // Steps progress
  const step1Done = !!selectedRatio && !!selectedLayout;
  const step2Done = step1Done && selectedImageIds.length > 0;
  const step3Done = step2Done && !!title.trim() && !!selectedDeviceId;

  return (
    <ResponsiveLayout>
      <View style={styles.container}>
        <ScrollView 
  style={styles.scroll} 
  showsVerticalScrollIndicator={false}
  refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
  // Add this prop to prevent clipping
  contentContainerStyle={{ flexGrow: 1 }}
>

           <View style={[styles.content, { padding: ds.p, paddingTop: ds.pt, gap: ds.gap, position: 'relative' }]}>

            {/* ── HEADER ── */}
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <View style={styles.headerBadge}>
                  <Ionicons name="tv" size={14} color={C.primary} />
                  <Text style={styles.headerBadgeText}>Signage Control</Text>
                </View>
                <Text style={[styles.pageTitle, { fontSize: ds.titleSize }]}>Dashboard</Text>
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

            {/* ── STAT CARDS ── */}
            <View style={[styles.statsRow, { gap: ds.statsGap }]}>
              <StatCard icon="radio-outline" num={stats.liveScreens} label="Live Screens"
                iconBg="rgba(255,255,255,0.2)" iconColor="#fff" bg={C.primary} textColor="#fff" labelColor="rgba(255,255,255,0.75)" />
              <StatCard icon="checkmark-circle-outline" num={stats.onlineDevices} label="Online"
                iconBg={C.successBg} iconColor={C.success} />
              <StatCard icon="close-circle-outline" num={stats.offlineDevices} label="Offline"
                iconBg={C.dangerBg} iconColor={C.danger} />
              {!isMobile && (
                <StatCard icon="tv-outline" num={stats.totalDevices} label="Total Devices"
                  iconBg={C.accentBg} iconColor={C.accent} />
              )}
            </View>

            {/* ── LIVE DISPLAYS ── */}
            {liveDisplays.length > 0 && (
              <View style={[styles.card, { padding: ds.cp }]}>
                <View style={styles.cardTitleRow}>
                  <View style={styles.livePulse} />
                  <Text style={styles.cardTitle}>Live Displays</Text>
                  <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>{liveDisplays.length} LIVE</Text></View>
                </View>
                {liveDisplays.map((live) => (
                  <View key={live.contentId} style={styles.liveCard}>
                    <View style={styles.liveCardLeft}>
                      <Text style={styles.liveDeviceName}>{live.displayName || live.deviceName}</Text>
                      <Text style={styles.liveTitle}>"{live.title}"</Text>
                      <View style={styles.liveTagRow}>
                        <View style={styles.liveTag}><Ionicons name="scan-outline" size={10} color={C.primary} /><Text style={styles.liveTagText}>{live.screenRatio}</Text></View>
                        <View style={styles.liveTag}><Ionicons name="grid-outline" size={10} color={C.primary} /><Text style={styles.liveTagText}>{live.screenLayout}</Text></View>
                        <View style={[styles.liveTag, { backgroundColor: C.successBg }]}>
                          <View style={[styles.liveDot, { backgroundColor: C.success }]} />
                          <Text style={[styles.liveTagText, { color: C.success }]}>{live.status}</Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.stopBtn} onPress={() => handleStop(live.contentId)}>
                      <Ionicons name="stop" size={14} color="#fff" />
                      <Text style={styles.stopBtnText}>Stop</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* ── FLOW STEPS ── */}
            <View style={styles.stepsRow}>
              <StepBadge num={1} label="Screen Setup" done={step1Done} />
              <View style={styles.stepLine} />
              <StepBadge num={2} label="Pick Images" done={step2Done} />
              <View style={styles.stepLine} />
              <StepBadge num={3} label="Deploy" done={step3Done} />
            </View>

            {/* ── MAIN GRID ── */}
            <View style={[styles.mainGrid, { flexDirection: ds.gridDir, gap: ds.gridGap }]}>

              {/* ── LEFT COLUMN ── */}
              <View style={[
  styles.leftCol,
  {
    flex: ds.leftFlex,
    gap: ds.gap,
    zIndex: 50,
    overflow: 'visible', // 👈 Add this
  }
]}>


                {/* STEP 1 — Screen Ratio */}
                <View style={[styles.card, { padding: ds.cp }]}>
                  <View style={styles.cardTitleRow}>
                    <View style={styles.stepNumSmall}><Text style={styles.stepNumSmallText}>1</Text></View>
                    <Ionicons name="scan-outline" size={17} color={C.primary} />
                    <Text style={styles.cardTitle}>Screen Ratio</Text>
                  </View>
                  <View style={styles.chipRow}>
                    {lutData.screenRatio.map((r) => {
                      const isActive = selectedRatio === r.value;
                      const ratioStyle = getDynamicRatioStyle(r.value);
                      return (
                        <TouchableOpacity key={r.value} style={[styles.ratioChip, isActive && styles.ratioChipActive]} onPress={() => setSelectedRatio(r.value)}>
                          <View style={[styles.ratioVisual, ratioStyle, { borderColor: isActive ? C.primary : C.border, backgroundColor: isActive ? C.primaryGhost : "transparent" }]} />
                          <Text style={[styles.chipValue, isActive && styles.chipValueActive]}>{r.value}</Text>
                          <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]} numberOfLines={2}>{r.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* STEP 1b — Screen Layout */}
                <View style={[styles.card, { padding: ds.cp }]}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons name="grid-outline" size={17} color={C.primary} />
                    <Text style={styles.cardTitle}>Screen Layout</Text>
                    {selectedLayout && (
                      <View style={styles.cardBadgeBlue}>
                        <Text style={styles.cardBadgeBlueText}>{maxImages} slot{maxImages > 1 ? "s" : ""}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.layoutRow}>
                    {lutData.screenLayout.map((l) => {
                      const isActive = selectedLayout === l.value;
                      const [rows, cols] = l.value.split("x").map(Number);
                      return (
                        <TouchableOpacity key={l.value} style={[styles.layoutCard, isActive && styles.layoutCardActive]} onPress={() => setSelectedLayout(l.value)}>
                          <LayoutPreview rows={rows || 1} cols={cols || 1} isActive={isActive} />
                          <Text style={[styles.layoutCardTitle, isActive && { color: "#fff" }]}>{l.value}</Text>
                          <Text style={[styles.layoutCardSub, isActive && { color: "#C7D7FF" }]}>{(rows || 1) * (cols || 1)} slot{(rows || 1) * (cols || 1) > 1 ? "s" : ""}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* STEP 2 — Select Images (only after ratio+layout) */}
                {step1Done && (
                  <View style={[styles.card, { padding: ds.cp }]}>
                    <View style={styles.cardTitleRow}>
                      <View style={styles.stepNumSmall}><Text style={styles.stepNumSmallText}>2</Text></View>
                      <Ionicons name="images-outline" size={17} color={C.primary} />
                      <Text style={styles.cardTitle}>Select Images</Text>
                      <View style={styles.cardBadgeBlue}>
                        <Text style={styles.cardBadgeBlueText}>{selectedImageIds.length}/{maxImages}</Text>
                      </View>
                    </View>
                    <Text style={styles.layoutHint}>
                      Layout <Text style={{ fontFamily: "Poppins_600SemiBold", color: C.primary }}>{selectedLayout}</Text> — select up to {maxImages} image(s) in display order.
                    </Text>
                    {lutData.imageList.length === 0 ? (
                      <Text style={styles.emptyHint}>No images available. Upload images first.</Text>
                    ) : (
                     <ImageSelectModal
  options={lutData.imageList}
  selected={selectedImageIds}
  onToggle={toggleImage}
  maxSelect={maxImages}
/>
                    )}
                  </View>
                )}

                {/* STEP 3 — Content Details (after images selected) */}
                {step2Done && (
                  <View style={[styles.card, { padding: ds.cp }]}>
                    <View style={styles.cardTitleRow}>
                      <View style={styles.stepNumSmall}><Text style={styles.stepNumSmallText}>3</Text></View>
                      <Ionicons name="create-outline" size={17} color={C.primary} />
                      <Text style={styles.cardTitle}>Content Details</Text>
                    </View>

                    <Text style={styles.fieldLabel}>TITLE *</Text>
                    <TextInput style={styles.input} value={title} onChangeText={setTitle}
                      placeholder="e.g. Summer Promo 2025" placeholderTextColor={C.textLight} />

                    <Text style={[styles.fieldLabel, { marginTop: 10 }]}>DESCRIPTION</Text>
                    <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription}
                      placeholder="Optional — short description" placeholderTextColor={C.textLight}
                      multiline numberOfLines={3} textAlignVertical="top" />
                  </View>
                )}
              </View>

              {/* ── RIGHT COLUMN ── */}
              <View style={[styles.rightCol, { flex: ds.rightFlex, gap: ds.gap }]}>

                {/* Device Select */}
           <View style={[styles.card, { 
  zIndex: 9999,  // Maximum z-index
  padding: ds.cp,
  overflow: 'visible',  // Critical for dropdown visibility
  position: 'relative',
}]}>
  <View style={styles.cardTitleRow}>
    <Ionicons name="tv-outline" size={17} color={C.primary} />
    <Text style={styles.cardTitle}>Target Device</Text>
  </View>
  {lutData.deviceList.length === 0 && !contentLoading ? (
    <Text style={styles.emptyHint}>No devices available</Text>
  ) : (
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
                      <View style={styles.devicePreviewIcon}><Ionicons name="tv" size={20} color={C.primary} /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.devicePreviewName}>{selectedDevice.displayName}</Text>
                        <Text style={styles.devicePreviewSub}>{selectedDevice.deviceName}</Text>
                        <Text style={styles.devicePreviewId} numberOfLines={1}>ID: {selectedDevice.deviceId.slice(0, 16)}…</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* TV Live Preview — shows after ratio+layout+images selected */}
                {step2Done && (
                  <View style={[styles.card, { padding: ds.cp, alignItems: "center" }]}>
                    <View style={[styles.cardTitleRow, { width: "100%" }]}>
                      <Ionicons name="eye-outline" size={17} color={C.primary} />
                      <Text style={styles.cardTitle}>Live Preview</Text>
                      <View style={styles.previewLiveBadge}>
                        <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.live }} />
                        <Text style={styles.previewLiveText}>PREVIEW</Text>
                      </View>
                    </View>
                    <TVNoticeBoard
                      selectedImageIds={selectedImageIds}
                      imageList={lutData.imageList}
                      selectedLayout={selectedLayout}
                      selectedRatio={selectedRatio}
                      title={title}
                    />
                  </View>
                )}

                {/* Deploy Summary */}
                <View style={[styles.card, styles.deployCard, { padding: ds.cp }]}>
                  <View style={styles.deployHeader}>
                    <Text style={styles.deployHeading}>🚀 Ready to Deploy</Text>
                    <Text style={styles.deploySub}>Review before sending to TV.</Text>
                  </View>

                  <View style={styles.summaryList}>
                    <SummaryRow icon="text-outline" label="Title" value={title || "—"} />
                    <SummaryRow icon="images-outline" label="Images" value={selectedImageNames || "—"} />
                    <SummaryRow icon="scan-outline" label="Ratio" value={selectedRatioLabel || "—"} />
                    <SummaryRow icon="grid-outline" label="Layout" value={selectedLayoutLabel || "—"} />
                    <SummaryRow icon="tv-outline" label="Device" value={selectedDevice?.displayName || "—"} />
                  </View>

                  <TouchableOpacity style={[styles.deployBtn, sending && { opacity: 0.6 }]} onPress={handleSendPress} disabled={sending}>
                    {sending ? <ActivityIndicator color="#fff" size="small" /> : (
                      <><Ionicons name="send" size={16} color="#fff" /><Text style={styles.deployBtnText}>Send to TV</Text></>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Recent Uploads — bottom of right col */}
               
              </View>
            </View>
             {recentImages.length > 0 && (
                  <View style={[styles.card, { padding: ds.cp }]}>
                    <View style={styles.cardTitleRow}>
                      <Ionicons name="time-outline" size={17} color={C.primary} />
                      <Text style={styles.cardTitle}>Recent Uploads</Text>
                      <Text style={styles.cardBadge}>{recentImages.length}</Text>
                    </View>
                    <View style={styles.recentGrid}>
                      {recentImages.slice(0, 6).map((img) => (
                        <View key={img.imageId} style={styles.recentCard}>
                          <Image source={{ uri: img.imageurl }} style={styles.recentThumb} resizeMode="cover" />
                          <View style={styles.recentPin}>
                            <Ionicons name="pin" size={10} color={C.accent} />
                          </View>
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

        {/* ── CONFIRM MODAL ── */}
        <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { width: isMobile ? "92%" : "100%", maxWidth: 440 }]}>
              <View style={styles.modalHeader}>
                <Ionicons name="send-outline" size={24} color={C.primary} />
                <Text style={styles.modalTitle}>Confirm Deployment</Text>
              </View>
              <Text style={styles.modalSub}>Sending content to TV — please confirm:</Text>
              <View style={styles.modalSummary}>
                <ModalRow label="Device" value={selectedDevice?.displayName || "—"} />
                <ModalRow label="Images" value={selectedImageNames || "—"} />
                <ModalRow label="Title" value={title} />
                <ModalRow label="Ratio" value={selectedRatioLabel} />
                <ModalRow label="Layout" value={selectedLayoutLabel} />
                {description ? <ModalRow label="Description" value={description} /> : null}
              </View>
              <View style={[styles.modalActions, { flexDirection: isMobile ? "column" : "row", gap: isMobile ? 8 : 12 }]}>
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

        {/* ── STOP MODAL ── */}
        <Modal visible={stopConfirmVisible} transparent animationType="fade" onRequestClose={() => setStopConfirmVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalBox, { width: isMobile ? "92%" : "100%", maxWidth: 380 }]}>
              <View style={styles.modalHeader}>
                <Ionicons name="stop-circle-outline" size={24} color={C.danger} />
                <Text style={[styles.modalTitle, { color: C.danger }]}>Stop Content</Text>
              </View>
              <Text style={styles.modalSub}>Are you sure you want to stop this live content?</Text>
              <View style={[styles.modalActions, { flexDirection: isMobile ? "column" : "row", gap: isMobile ? 8 : 12, marginTop: 8 }]}>
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