// components/layoutArrangeModal.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  Modal, View, Text, TouchableOpacity, ScrollView,
  Image, ActivityIndicator, useWindowDimensions, StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "@/app/dashboard.styles";
import { LayoutConfig } from "../constants/layout";
import { LayoutGrid, LayoutMiniPreview, ImageItem } from "../components/layoutGrid";
import { ImageSelectModal } from "./selectImageModal";

interface Props {
  visible: boolean;
  onClose: () => void;
  // slots is now number[][] — each slot holds an ordered list of imageIds
  onConfirm: (layout: string, slots: number[][]) => void;
  imageList: ImageItem[];
  selectedImageIds: number[];
  layouts: LayoutConfig[];
}

export const LayoutArrangeModal = ({
  visible, onClose, onConfirm,
  imageList, selectedImageIds, layouts = [],
}: Props) => {
  const { width, height } = useWindowDimensions();
  const modalW = Math.min(width - 32, 680);
  const previewW = modalW - 48;
  const previewH = Math.round((previewW * 9) / 16);

  const [selectedLayout, setSelectedLayout] = useState<LayoutConfig | null>(null);
  // slots[i] = array of imageIds for slot i
  const [slots, setSlots] = useState<number[][]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [localSelectedIds, setLocalSelectedIds] = useState<number[]>(selectedImageIds);
  const [showImagePicker, setShowImagePicker] = useState(false);
  // Which slot index the "Add" button was pressed for
  const [addTargetSlot, setAddTargetSlot] = useState<number | null>(null);

  const layoutScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!selectedLayout || !layouts.length) return;
    const idx = layouts.findIndex((l) => l.value === selectedLayout.value);
    if (idx > 0 && layoutScrollRef.current) {
      layoutScrollRef.current.scrollTo({ x: idx * 98, animated: true });
    }
  }, [selectedLayout]);

  useEffect(() => {
    if (layouts && layouts.length > 0 && !selectedLayout) {
      setSelectedLayout(layouts[0]);
    }
  }, [layouts]);

  useEffect(() => {
    setLocalSelectedIds(selectedImageIds);
  }, [selectedImageIds]);

  // Re-initialize slots when layout changes
  useEffect(() => {
    if (!selectedLayout) return;
    const next: number[][] = Array.from({ length: selectedLayout.slots }, () => []);
    localSelectedIds.forEach((id, i) => {
      if (i < selectedLayout.slots) next[i] = [id];
    });
    setSlots(next);
    setDraggingId(null);
  }, [selectedLayout, localSelectedIds]);

  // Place dragging image into a slot
  const handleSlotPress = (slotIdx: number) => {
    if (draggingId === null) return;
    setSlots((prev) => {
      const next = prev.map((arr) => arr.filter((id) => id !== draggingId));
      next[slotIdx] = [...next[slotIdx], draggingId];
      return next;
    });
    setDraggingId(null);
  };

  // Remove a specific imageId from a slot
  const handleSlotRemove = (slotIdx: number, imageId: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = next[slotIdx].filter((id) => id !== imageId);
      return next;
    });
  };

  // Add button pressed on a slot — open picker scoped to that slot
  const handleSlotAdd = (slotIdx: number) => {
    setAddTargetSlot(slotIdx);
    setShowImagePicker(true);
  };

  // When image is toggled from picker
  const handleImageToggle = (id: number) => {
    if (addTargetSlot !== null) {
      // Add/remove from that specific slot
      setSlots((prev) => {
        const next = [...prev];
        const slotImages = next[addTargetSlot];
        if (slotImages.includes(id)) {
          next[addTargetSlot] = slotImages.filter((x) => x !== id);
        } else {
          next[addTargetSlot] = [...slotImages, id];
        }
        // Sync localSelectedIds to include all images across all slots
        return next;
      });
    } else {
      setLocalSelectedIds((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        if (prev.length >= (selectedLayout?.slots ?? 6)) return prev;
        return [...prev, id];
      });
    }
  };

  // All imageIds currently placed across all slots
  const allPlacedIds = slots.flat();



  if (!visible) return null;

  if (!layouts || layouts.length === 0) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={s.overlay}>
          <View style={[s.modalBox, { width: modalW, padding: 32, alignItems: "center" }]}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={{ marginTop: 16, fontFamily: "Poppins_500Medium", color: C.textLight }}>
              Loading layouts...
            </Text>
            <TouchableOpacity onPress={onClose} style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: C.primaryGhost, borderRadius: 10 }}>
              <Text style={{ color: C.primary, fontFamily: "Poppins_600SemiBold" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  if (!selectedLayout) return null;

  const totalSlotsFilled = slots.filter((s) => s.length > 0).length;

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={s.overlay}>
          <View style={[s.modalBox, { width: modalW, maxHeight: height * 0.92 }]}>

            {/* ── Header ── */}
            <View style={s.header}>
              <View>
                <Text style={s.headerTitle}>Arrange Layout</Text>
                <Text style={s.headerSub}>Tap image → tap slot to place, or use + to add</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ backgroundColor: C.successBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}>
                  <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 12, color: C.success }}>
                    {totalSlotsFilled}/{selectedLayout.slots}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>

              {/* ── Layout chips ── */}
              <View>
                <Text style={s.sectionLabel}>CHOOSE LAYOUT</Text>
                <ScrollView
                  ref={layoutScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  snapToInterval={98}
                  snapToAlignment="start"
                  contentContainerStyle={{ gap: 8, paddingRight: 8 }}
                >
                  {layouts.map((cfg) => {
                    const isActive = selectedLayout.value === cfg.value;
                    return (
                      <TouchableOpacity
                        key={cfg.value}
                        onPress={() => setSelectedLayout(cfg)}
                        style={{
                          alignItems: "center", gap: 4,
                          paddingHorizontal: 10, paddingVertical: 8,
                          borderRadius: 10,
                          backgroundColor: isActive ? C.primary : "#F8FAFC",
                          borderWidth: 1,
                          borderColor: isActive ? C.primary : "#E2E8F0",
                          minWidth: 82,
                        }}
                      >
                        <LayoutMiniPreview config={cfg} isActive={isActive} size={40} />
                        <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 10, color: isActive ? "#fff" : C.textLight }}>
                          {cfg.label}
                        </Text>
                        <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 9, color: isActive ? "rgba(255,255,255,0.65)" : C.textLight }}>
                          {cfg.slots} slot{cfg.slots > 1 ? "s" : ""}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* ── Screen preview ── */}
              <View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Ionicons name="eye-outline" size={14} color={C.primary} />
                  <Text style={s.sectionLabel}>SCREEN PREVIEW</Text>
                  {draggingId !== null && (
                    <View style={{ backgroundColor: C.primaryGhost, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}>
                      <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 10, color: C.primary }}>
                        Tap a slot to place
                      </Text>
                    </View>
                  )}
                </View>
                <View style={{
                  width: previewW, height: previewH,
                  backgroundColor: "#08111E", borderRadius: 8, overflow: "hidden",
                  padding: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
                  alignSelf: "center",
                }}>
                  <LayoutGrid
                    layoutValue={selectedLayout.value}
                    slots={slots}
                    imageList={imageList}
                    onSlotPress={handleSlotPress}
                    onSlotRemove={handleSlotRemove}
                    onSlotAdd={handleSlotAdd}
                    activeTarget={draggingId !== null}
                    rows={selectedLayout.rows}
                    cols={selectedLayout.cols}
                  />
                </View>
                <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 11, color: C.textLight, marginTop: 6, textAlign: "center" }}>
                  {totalSlotsFilled}/{selectedLayout.slots} slots filled · {allPlacedIds.length} images placed
                </Text>
              </View>

              {/* ── Image tray ── */}
              <View>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={s.sectionLabel}>YOUR IMAGES — tap to pick, tap slot to place</Text>
                  <TouchableOpacity
                    onPress={() => { setAddTargetSlot(null); setShowImagePicker(true); }}
                    style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.primaryGhost, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}
                  >
                    <Ionicons name="pencil-outline" size={12} color={C.primary} />
                    <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 11, color: C.primary }}>Edit</Text>
                  </TouchableOpacity>
                </View>

                {localSelectedIds.length === 0 ? (
                  <TouchableOpacity
                    onPress={() => { setAddTargetSlot(null); setShowImagePicker(true); }}
                    style={{ borderWidth: 1.5, borderColor: "#E2E8F0", borderStyle: "dashed", borderRadius: 12, paddingVertical: 24, alignItems: "center", gap: 8 }}
                  >
                    <Ionicons name="images-outline" size={28} color={C.textLight} />
                    <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 13, color: C.textLight }}>Tap to select images</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {localSelectedIds.map((id) => {
                      const img = imageList.find((i) => i.imageId === id);
                      const isPlaced = allPlacedIds.includes(id);
                      const isDragging = draggingId === id;
                      return (
                        <TouchableOpacity
                          key={id}
                          onPress={() => setDraggingId(isDragging ? null : id)}
                          style={{
                            width: 80, borderRadius: 8, overflow: "hidden",
                            borderWidth: isDragging ? 2.5 : 1.5,
                            borderColor: isDragging ? C.primary : isPlaced ? C.success : C.border,
                            opacity: isPlaced && !isDragging ? 0.5 : 1,
                            backgroundColor: "#F8FAFC",
                          }}
                        >
                          {img?.imageurl ? (
                            <Image source={{ uri: img.imageurl }} style={{ width: "100%", height: 60 }} resizeMode="cover" />
                          ) : (
                            <View style={{ height: 60, justifyContent: "center", alignItems: "center", backgroundColor: C.surfaceAlt }}>
                              <Ionicons name="image-outline" size={20} color={C.textLight} />
                            </View>
                          )}
                          <View style={{ paddingHorizontal: 5, paddingVertical: 4 }}>
                            <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 9, color: isPlaced ? C.success : C.textLight }} numberOfLines={1}>
                              {isPlaced ? "✓ Placed" : img?.imageName || "Image"}
                            </Text>
                          </View>
                          {isDragging && (
                            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(59,95,192,0.2)", justifyContent: "center", alignItems: "center" }}>
                              <Ionicons name="move-outline" size={18} color={C.primary} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 12, backgroundColor: C.primaryGhost, borderRadius: 10, padding: 10 }}>
                  <Ionicons name="information-circle-outline" size={15} color={C.primary} />
                  <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 12, color: C.primary, flex: 1, lineHeight: 18 }}>
                    Tap an image then tap a slot to place it. Press{" "}
                    <Text style={{ fontFamily: "Poppins_600SemiBold" }}>+</Text>{" "}
                    on any slot to add multiple images to that slot. Use{" "}
                    <Text style={{ fontFamily: "Poppins_600SemiBold" }}>Edit</Text>{" "}
                    to change your image pool.
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* ── Footer ── */}
            <View style={s.footer}>
              <TouchableOpacity onPress={onClose} style={s.cancelBtn}>
                <Text style={{ fontSize: 14, fontFamily: "Poppins_600SemiBold", color: "#6B7280" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onConfirm(selectedLayout.value, slots)}
                style={s.confirmBtn}
              >
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={{ fontSize: 14, fontFamily: "Poppins_600SemiBold", color: "#fff" }}>Confirm Layout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ImageSelectModal
        visible={showImagePicker}
        onClose={() => { setShowImagePicker(false); setAddTargetSlot(null); }}
        options={imageList.map((img) => ({
          imageId: img.imageId,
          imageName: img.imageName,
          imageurl: img.imageurl,
        }))}
        selected={
          addTargetSlot !== null
            ? slots[addTargetSlot] ?? []
            : localSelectedIds
        }
        onToggle={handleImageToggle}
        maxSelect={addTargetSlot !== null ? 999 : selectedLayout.slots}
      />
    </>
  );
};

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", padding: 16 },
  modalBox: { backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, elevation: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#111" },
  headerSub: { fontSize: 12, color: "#64748B", marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 99, backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center" },
  sectionLabel: { fontFamily: "Poppins_600SemiBold", fontSize: 10, color: C.textLight, letterSpacing: 0.8 },
  footer: { flexDirection: "row", gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  confirmBtn: { flex: 2, paddingVertical: 12, borderRadius: 12, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
});