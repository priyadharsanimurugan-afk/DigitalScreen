// components/layoutArrangeModal.tsx — CORRECTED VERSION (PDFs allowed in slots)

import React, { useState, useEffect, useRef } from "react";
import {
  Modal, View, Text, TouchableOpacity, ScrollView, Image,
  ActivityIndicator, useWindowDimensions, StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "@/app/dashboard.styles";
import { LayoutConfig } from "../constants/layout";
import { LayoutGrid, LayoutMiniPreview, ImageItem } from "./layoutGrid";
import { ImageSelectModal, SelectableImage, isPdf } from "./selectImageModal";

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (layout: string, slots: number[][]) => void;
  imageList: SelectableImage[];
  selectedImageIds: number[];
  layouts: LayoutConfig[];
  initialSlotAssignment?: number[][];
  initialLayout?: string;
}

function autoFillSlots(imageIds: number[], slotCount: number): number[][] {
  const result = Array.from({ length: slotCount }, (_, i) =>
    imageIds[i] !== undefined ? [imageIds[i]] : []
  );
  console.log("[autoFillSlots] ids:", imageIds, "slotCount:", slotCount, "result:", JSON.stringify(result));
  return result;
}

export const LayoutArrangeModal = ({
  visible, onClose, onConfirm, imageList, selectedImageIds,
  layouts = [], initialSlotAssignment = [], initialLayout = "",
}: Props) => {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const modalW = isMobile ? width - 32 : Math.min(width * 0.9, 680);
  const modalMaxH = isMobile ? height * 0.85 : height * 0.9;
  const previewW = modalW - (isMobile ? 24 : 48);
  const previewH = Math.round((previewW * 9) / 16);
  const layoutsPerPage = isMobile ? 3 : isTablet ? 4 : 5;

  const [layoutPage, setLayoutPage] = useState(0);
  const [selectedLayout, setSelectedLayout] = useState<LayoutConfig | null>(null);
  const [slots, setSlots] = useState<number[][]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [localSelectedIds, setLocalSelectedIds] = useState<number[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [addTargetSlot, setAddTargetSlot] = useState<number | null>(null);
  const [pickerDraft, setPickerDraft] = useState<number[]>([]);
  const imageScrollRef = useRef<ScrollView>(null);

  const totalLayoutPages = Math.ceil(layouts.length / layoutsPerPage);
  const currentLayouts = layouts.slice(layoutPage * layoutsPerPage, (layoutPage + 1) * layoutsPerPage);

  // ✦ CHANGED: Allow all valid images (including PDFs)
  const allValidIds = (ids: number[]) => {
    const result = ids.filter((id) => {
      const img = imageList.find((i) => i.imageId === id);
      console.log(`  [allValidIds] id=${id} name="${img?.imageName}" mimeType="${img?.mimeType}" url="${img?.imageurl?.slice(0,80)}" → valid=${!!img}`);
      return !!img; // ✅ Allow PDFs
    });
    console.log("[allValidIds] INPUT:", ids, "OUTPUT:", result);
    return result;
  };

  const effectiveSlotCount = (layout: LayoutConfig, ids: number[]) =>
    layout.value === "single_col" ? Math.max(1, ids.length) : layout.slots;

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    console.log("=== [INIT] modal opened ===");
    console.log("[INIT] imageList count:", imageList.length);
    imageList.forEach(img => {
      console.log(`  img id=${img.imageId} name="${img.imageName}" mimeType="${img.mimeType}" url="${img.imageurl?.slice(0,80)}" isPdf=${isPdf(img)}`);
    });
    console.log("[INIT] selectedImageIds:", selectedImageIds);
    console.log("[INIT] initialLayout:", initialLayout);
    console.log("[INIT] initialSlotAssignment:", JSON.stringify(initialSlotAssignment));

    if (initialSlotAssignment?.length > 0 && initialLayout) {
      const layoutCfg = layouts.find((l) => l.value === initialLayout);
      if (layoutCfg) {
        console.log("[INIT] restoring existing layout:", initialLayout);
        setSelectedLayout(layoutCfg);
        setSlots(initialSlotAssignment.map((slot) => [...slot]));
        const allIds = allValidIds(initialSlotAssignment.flat());
        setLocalSelectedIds([...new Set(allIds)]);
        setLayoutPage(Math.floor(layouts.findIndex((l) => l.value === initialLayout) / layoutsPerPage));
        return;
      }
    }

    if (layouts?.length > 0) {
      const firstLayout = layouts[0];
      console.log("[INIT] fresh open, layout:", firstLayout.value);
      const cleanIds = allValidIds(selectedImageIds);
      console.log("[INIT] cleanIds:", cleanIds);
      setSelectedLayout(firstLayout);
      setLocalSelectedIds(cleanIds);
      const sc = effectiveSlotCount(firstLayout, cleanIds);
      setSlots(autoFillSlots(cleanIds, sc));
    }
  }, [visible]);

  // ── Layout change → refill ─────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedLayout) return;
    console.log("[LAYOUT CHANGE] layout:", selectedLayout.value, "localSelectedIds:", localSelectedIds);
    if (initialSlotAssignment?.length > 0 && initialLayout === selectedLayout.value) {
      setSlots(initialSlotAssignment.map((slot) => [...slot]));
      return;
    }
    const sc = effectiveSlotCount(selectedLayout, localSelectedIds);
    setSlots(autoFillSlots(localSelectedIds, sc));
    setDraggingId(null);
  }, [selectedLayout]);

  // ── localSelectedIds change → refill ──────────────────────────────────────
  useEffect(() => {
    if (!selectedLayout) return;
    console.log("[LOCAL IDS CHANGE] localSelectedIds:", localSelectedIds);
    const sc = effectiveSlotCount(selectedLayout, localSelectedIds);
    setSlots(autoFillSlots(localSelectedIds, sc));
  }, [localSelectedIds]);

  // ── Watch slots ────────────────────────────────────────────────────────────
  useEffect(() => {
    console.log("[SLOTS UPDATED]", JSON.stringify(slots));
    slots.forEach((slot, i) => {
      slot.forEach(id => {
        const img = imageList.find(x => x.imageId === id);
        console.log(`  slot[${i}] id=${id} → name="${img?.imageName}" url="${img?.imageurl?.slice(0,60)}" isPdf=${img ? isPdf(img) : false}`);
      });
    });
  }, [slots]);

  // ── Open picker ────────────────────────────────────────────────────────────
  const openPicker = (targetSlot: number | null) => {
    const seed = targetSlot !== null ? (slots[targetSlot] ?? []) : localSelectedIds;
    console.log("[openPicker] targetSlot:", targetSlot, "draft seed:", seed);
    setAddTargetSlot(targetSlot);
    setPickerDraft([...seed]);
    setShowImagePicker(true);
  };

  // ── Toggle in picker ───────────────────────────────────────────────────────
  // ✦ CHANGED: Allow PDFs to be toggled
  const handlePickerToggle = (id: number) => {
    const img = imageList.find((i) => i.imageId === id);
    console.log("[PICKER TOGGLE] id:", id, "name:", img?.imageName, "isPdf:", img ? isPdf(img) : false);
    if (!img) {
      console.warn("[PICKER TOGGLE] SKIPPED — image not found");
      return;
    }
    // ✅ PDFs are now allowed!
    setPickerDraft((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      console.log("[PICKER TOGGLE] draft:", prev, "→", next);
      return next;
    });
  };

  // ── Done ───────────────────────────────────────────────────────────────────
  const handlePickerDone = () => {
    console.log("=== [DONE PRESSED] ===");
    console.log("[DONE] pickerDraft:", pickerDraft);
    console.log("[DONE] addTargetSlot:", addTargetSlot);
    if (addTargetSlot !== null) {
      setSlots((prev) => {
        const next = [...prev];
        next[addTargetSlot] = [...pickerDraft];
        console.log("[DONE] slot assignment result:", JSON.stringify(next));
        return next;
      });
    } else {
      console.log("[DONE] setting localSelectedIds to:", pickerDraft);
      setLocalSelectedIds([...pickerDraft]);
    }
    setShowImagePicker(false);
    setAddTargetSlot(null);
  };

  const handleSlotPress = (slotIdx: number) => {
    if (draggingId === null) return;
    console.log("[SLOT PRESS] slotIdx:", slotIdx, "draggingId:", draggingId);
    setSlots((prev) => {
      const next = prev.map((arr) => arr.filter((id) => id !== draggingId));
      next[slotIdx] = [...next[slotIdx], draggingId];
      return next;
    });
    setDraggingId(null);
  };

  const handleSlotRemove = (slotIdx: number, imageId: number) => {
    console.log("[SLOT REMOVE] slotIdx:", slotIdx, "imageId:", imageId);
    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = next[slotIdx].filter((id) => id !== imageId);
      return next;
    });
  };

  const handleLayoutSelect = (cfg: LayoutConfig) => {
    console.log("[LAYOUT SELECT]", cfg.value);
    setSelectedLayout(cfg);
    setLayoutPage(Math.floor(layouts.findIndex((l) => l.value === cfg.value) / layoutsPerPage));
  };

  const allPlacedIds = slots.flat();

  // ✦ Helper to get display URL (handles PDFs)
  const getImageDisplayUrl = (img: SelectableImage | undefined) => {
    if (!img?.imageurl) return null;
    // Return the URL directly - PDFs will show as preview in Image component
    // For better PDF display, you could use thumbnailUrl if available
    return (img as any).thumbnailUrl || img.imageurl;
  };

  if (!visible) return null;
  if (!layouts || layouts.length === 0) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={s.overlay}>
          <View style={[s.modalBox, { width: modalW, padding: 32, alignItems: "center" }]}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={{ marginTop: 16, fontFamily: "Poppins_500Medium", color: C.textLight }}>Loading layouts…</Text>
            <TouchableOpacity onPress={onClose} style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: C.primaryGhost, borderRadius: 10 }}>
              <Text style={{ color: C.primary, fontFamily: "Poppins_600SemiBold" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }
  if (!selectedLayout) return null;

  const currentSlotCount = effectiveSlotCount(selectedLayout, localSelectedIds);
  const totalSlotsFilled = slots.filter((sl) => sl.length > 0).length;

  console.log("[RENDER] layout:", selectedLayout.value, "localSelectedIds:", localSelectedIds, "slots:", JSON.stringify(slots));

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={s.overlay}>
          <View style={[s.modalBox, { width: modalW, maxHeight: modalMaxH }]}>
            {/* Header */}
            <View style={[s.header, { paddingHorizontal: isMobile ? 12 : 20, paddingVertical: isMobile ? 12 : 16 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[s.headerTitle, { fontSize: isMobile ? 15 : 17 }]}>Arrange Layout</Text>
                <Text style={[s.headerSub, { fontSize: isMobile ? 10 : 12 }]}>Images fill slots in order · tap to reposition</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: isMobile ? 6 : 10 }}>
                <View style={{ backgroundColor: C.successBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
                  <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: isMobile ? 10 : 12, color: C.success }}>{totalSlotsFilled}/{currentSlotCount}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={[s.closeBtn, { width: isMobile ? 28 : 32, height: isMobile ? 28 : 32 }]}>
                  <Ionicons name="close" size={isMobile ? 18 : 20} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: isMobile ? 12 : 16, gap: isMobile ? 12 : 16 }}>
              {/* Layout chips */}
              <View>
                <Text style={[s.sectionLabel, { fontSize: isMobile ? 9 : 10 }]}>CHOOSE LAYOUT</Text>
                <View style={{ position: "relative", marginTop: 8 }}>
                  {layoutPage > 0 && (
                    <TouchableOpacity onPress={() => setLayoutPage((p) => p - 1)} style={[s.layoutNavArrow, s.leftLayoutArrow, { width: isMobile ? 28 : 32, height: isMobile ? 28 : 32 }]}>
                      <Ionicons name="chevron-back" size={isMobile ? 16 : 18} color={C.primary} />
                    </TouchableOpacity>
                  )}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.layoutGrid}>
                    {currentLayouts.map((cfg) => {
                      const isActive = selectedLayout.value === cfg.value;
                      return (
                        <TouchableOpacity key={cfg.value} onPress={() => handleLayoutSelect(cfg)}
                          style={[s.layoutCard, isActive && s.layoutCardActive, { width: isMobile ? 75 : 82, paddingHorizontal: isMobile ? 6 : 10, paddingVertical: isMobile ? 6 : 8 }]}>
                          <LayoutMiniPreview config={cfg} isActive={isActive} size={isMobile ? 35 : 40} />
                          <Text style={{ fontFamily: "Poppins_500Medium", fontSize: isMobile ? 9 : 10, color: isActive ? "#fff" : C.textLight, textAlign: "center", marginTop: 2 }}>{cfg.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  {layoutPage < totalLayoutPages - 1 && (
                    <TouchableOpacity onPress={() => setLayoutPage((p) => p + 1)} style={[s.layoutNavArrow, s.rightLayoutArrow, { width: isMobile ? 28 : 32, height: isMobile ? 28 : 32 }]}>
                      <Ionicons name="chevron-forward" size={isMobile ? 16 : 18} color={C.primary} />
                    </TouchableOpacity>
                  )}
                  {totalLayoutPages > 1 && (
                    <View style={s.pageIndicator}>
                      {Array.from({ length: totalLayoutPages }).map((_, idx) => (
                        <View key={idx} style={[s.pageDot, idx === layoutPage && s.pageDotActive]} />
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Preview */}
              <View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Ionicons name="eye-outline" size={isMobile ? 12 : 14} color={C.primary} />
                  <Text style={[s.sectionLabel, { fontSize: isMobile ? 9 : 10 }]}>SCREEN PREVIEW</Text>
                  {draggingId !== null && (
                    <View style={{ backgroundColor: C.primaryGhost, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}>
                      <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 10, color: C.primary }}>Tap a slot to place</Text>
                    </View>
                  )}
                </View>
                <View style={{ width: previewW, height: previewH, backgroundColor: "#08111E", borderRadius: 8, overflow: "hidden", padding: isMobile ? 2 : 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", alignSelf: "center" }}>
                  <LayoutGrid
                    layoutValue={selectedLayout.value}
                    slots={slots}
                    imageList={imageList as ImageItem[]}
                    onSlotPress={handleSlotPress}
                    onSlotRemove={handleSlotRemove}
                    onSlotAdd={(slotIdx) => openPicker(slotIdx)}
                    activeTarget={draggingId !== null}
                    rows={selectedLayout.rows}
                    cols={selectedLayout.cols}
                  />
                </View>
                <Text style={{ fontFamily: "Poppins_400Regular", fontSize: isMobile ? 10 : 11, color: C.textLight, marginTop: 6, textAlign: "center" }}>
                  {totalSlotsFilled}/{currentSlotCount} slots filled{selectedLayout.value === "single_col" ? " · 1 image per row" : ""}
                </Text>
              </View>

              {/* Image tray */}
              <View>
                <View style={{ flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", marginBottom: 8, gap: isMobile ? 8 : 0 }}>
                  <Text style={[s.sectionLabel, { fontSize: isMobile ? 9 : 10 }]}>YOUR IMAGES</Text>
                  <TouchableOpacity onPress={() => openPicker(null)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.primaryGhost, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: isMobile ? "flex-end" : "auto" }}>
                    <Ionicons name="pencil-outline" size={12} color={C.primary} />
                    <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 11, color: C.primary }}>Edit</Text>
                  </TouchableOpacity>
                </View>
                {localSelectedIds.length === 0 ? (
                  <TouchableOpacity onPress={() => openPicker(null)}
                    style={{ borderWidth: 1.5, borderColor: "#E2E8F0", borderStyle: "dashed", borderRadius: 12, paddingVertical: isMobile ? 16 : 24, alignItems: "center", gap: 8 }}>
                    <Ionicons name="images-outline" size={isMobile ? 24 : 28} color={C.textLight} />
                    <Text style={{ fontFamily: "Poppins_500Medium", fontSize: isMobile ? 12 : 13, color: C.textLight }}>Tap to select images</Text>
                  </TouchableOpacity>
                ) : (
                  <ScrollView ref={imageScrollRef} horizontal showsHorizontalScrollIndicator contentContainerStyle={{ gap: 8, paddingVertical: 4 }} style={{ maxHeight: isMobile ? 80 : 100 }}>
                    {localSelectedIds.map((id, index) => {
                      const img = imageList.find((i) => i.imageId === id);
                      const isPlaced = allPlacedIds.includes(id);
                      const isDragging = draggingId === id;
                      const displayUrl = getImageDisplayUrl(img);
                      const isPdfItem = img ? isPdf(img) : false;
                      
                      return (
                        <TouchableOpacity key={id} onPress={() => setDraggingId(isDragging ? null : id)}
                          style={{ 
                            width: isMobile ? 70 : 80, 
                            borderRadius: 8, 
                            overflow: "hidden", 
                            borderWidth: isDragging ? 2.5 : 1.5, 
                            borderColor: isDragging ? C.primary : isPlaced ? C.success : (isPdfItem ? "#F59E0B" : C.border), 
                            opacity: isPlaced && !isDragging ? 0.6 : 1, 
                            backgroundColor: "#F8FAFC" 
                          }}>
                          {displayUrl ? (
                            <Image source={{ uri: displayUrl }} style={{ width: "100%", height: isMobile ? 50 : 60 }} resizeMode="cover" />
                          ) : (
                            <View style={{ height: isMobile ? 50 : 60, justifyContent: "center", alignItems: "center", backgroundColor: C.surfaceAlt }}>
                              <Ionicons name={isPdfItem ? "document-text-outline" : "image-outline"} size={isMobile ? 16 : 20} color={isPdfItem ? "#F59E0B" : C.textLight} />
                            </View>
                          )}
                          {isPdfItem && (
                            <View style={{ position: "absolute", top: 3, right: 3, backgroundColor: "#F59E0B", borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
                              <Text style={{ color: "#fff", fontSize: 7, fontWeight: "700" }}>PDF</Text>
                            </View>
                          )}
                          <View style={{ position: "absolute", top: 3, left: 3, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 }}>
                            <Text style={{ color: "#fff", fontSize: 9, fontWeight: "700" }}>#{index + 1}</Text>
                          </View>
                          <View style={{ paddingHorizontal: 5, paddingVertical: 4 }}>
                            <Text style={{ fontFamily: "Poppins_400Regular", fontSize: isMobile ? 8 : 9, color: isPlaced ? C.success : C.textLight }} numberOfLines={1}>
                              {isPlaced ? "✓ Slot " + (allPlacedIds.indexOf(id) + 1) : img?.imageName || "Image"}
                            </Text>
                          </View>
                          {isDragging && (
                            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(59,95,192,0.2)", justifyContent: "center", alignItems: "center" }}>
                              <Ionicons name="move-outline" size={isMobile ? 16 : 18} color={C.primary} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 12, backgroundColor: C.primaryGhost, borderRadius: 10, padding: isMobile ? 8 : 10 }}>
                  <Ionicons name="information-circle-outline" size={isMobile ? 13 : 15} color={C.primary} />
                  <Text style={{ fontFamily: "Poppins_400Regular", fontSize: isMobile ? 11 : 12, color: C.primary, flex: 1, lineHeight: isMobile ? 16 : 18 }}>
                    {selectedLayout.value === "single_col" 
                      ? "Each image gets its own full-width slot. PDFs work too!" 
                      : "Images fill slots in order. Tap an image then tap a slot to reposition. PDFs are supported!"}
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={[s.footer, { padding: isMobile ? 12 : 16, gap: isMobile ? 8 : 10 }]}>
              <TouchableOpacity onPress={onClose} style={[s.cancelBtn, { paddingVertical: isMobile ? 10 : 12 }]}>
                <Text style={{ fontSize: isMobile ? 13 : 14, fontFamily: "Poppins_600SemiBold", color: "#6B7280" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  console.log("=== [CONFIRM] layout:", selectedLayout.value, "slots:", JSON.stringify(slots), "===");
                  onConfirm(selectedLayout.value, slots);
                }}
                style={[s.confirmBtn, { paddingVertical: isMobile ? 10 : 12 }]}>
                <Ionicons name="checkmark-circle" size={isMobile ? 14 : 16} color="#fff" />
                <Text style={{ fontSize: isMobile ? 13 : 14, fontFamily: "Poppins_600SemiBold", color: "#fff" }}>Confirm Layout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ImageSelectModal
        visible={showImagePicker}
        onClose={handlePickerDone}
        options={imageList}
        selected={pickerDraft}
        onToggle={handlePickerToggle}
        maxSelect={addTargetSlot !== null ? 999 : currentSlotCount}
      />
    </>
  );
};

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", padding: 16 },
  modalBox: { backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, elevation: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  headerTitle: { fontWeight: "700", color: "#111" },
  headerSub: { color: "#64748B", marginTop: 2 },
  closeBtn: { borderRadius: 99, backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center" },
  sectionLabel: { fontFamily: "Poppins_600SemiBold", color: C.textLight, letterSpacing: 0.8 },
  layoutGrid: { flexDirection: "row", justifyContent: "center", gap: 8, paddingHorizontal: 40 },
  layoutCard: { alignItems: "center", borderRadius: 10, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0" },
  layoutCardActive: { backgroundColor: C.primary, borderColor: C.primary },
  layoutNavArrow: { position: "absolute", top: "50%", transform: [{ translateY: -16 }], zIndex: 10, backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 16, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  leftLayoutArrow: { left: 0 },
  rightLayoutArrow: { right: 0 },
  pageIndicator: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 12 },
  pageDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#E2E8F0" },
  pageDotActive: { backgroundColor: C.primary, width: 16 },
  footer: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  cancelBtn: { flex: 1, borderRadius: 12, borderWidth: 1.5, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  confirmBtn: { flex: 2, borderRadius: 12, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
});