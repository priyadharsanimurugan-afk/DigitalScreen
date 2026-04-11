import React, { useState, useEffect } from "react";
import {
  Modal, View, Text, TouchableOpacity,
  ScrollView, Image, Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "@/app/dashboard.styles";
import { LayoutConfig } from "../constants/layout";
import { LayoutGrid, LayoutMiniPreview, ImageItem } from "../components/layoutGrid";

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (layout: string, slots: (number | null)[]) => void;
  imageList: ImageItem[];
  selectedImageIds: number[];
  layouts: LayoutConfig[];
}

export const LayoutArrangeModal = ({
  visible, onClose, onConfirm, imageList, selectedImageIds, layouts = [],
}: Props) => {
  const [selectedLayout, setSelectedLayout] = useState<LayoutConfig | null>(null);
  const [slots, setSlots] = useState<(number | null)[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const screenW = Dimensions.get("window").width;
  const previewW = Math.min(screenW - 48, 580);
  const previewH = Math.round((previewW * 9) / 16);

  // Set first layout when layouts arrive
  useEffect(() => {
    if (layouts && layouts.length > 0 && !selectedLayout) {
      setSelectedLayout(layouts[0]);
    }
  }, [layouts]);

  // Auto-fill slots when layout or images change
  useEffect(() => {
    if (!selectedLayout) return;
    const next: (number | null)[] = Array(selectedLayout.slots).fill(null);
    selectedImageIds.forEach((id, i) => {
      if (i < selectedLayout.slots) next[i] = id;
    });
    setSlots(next);
    setDraggingId(null);
  }, [selectedLayout, selectedImageIds]);

  const handleSlotPress = (slotIdx: number) => {
    if (draggingId === null) return;
    setSlots((prev) => {
      const next = [...prev];
      const oldIdx = next.indexOf(draggingId);
      if (oldIdx !== -1) next[oldIdx] = null;
      next[slotIdx] = draggingId;
      return next;
    });
    setDraggingId(null);
  };

  const handleSlotRemove = (slotIdx: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = null;
      return next;
    });
  };

  // Show loading state if layouts aren't ready
  if (!visible) return null;
  
  if (!layouts || layouts.length === 0) {
    return (
      <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
        <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={{ marginTop: 16, fontFamily: "Poppins_500Medium", color: C.textLight }}>
            Loading layouts...
          </Text>
          <TouchableOpacity 
            onPress={onClose} 
            style={{ marginTop: 24, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: C.surface, borderRadius: 8 }}
          >
            <Text style={{ color: C.primary, fontFamily: "Poppins_600SemiBold" }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  if (!selectedLayout) return null;

  const placedCount = slots.filter(Boolean).length;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>

        {/* Header */}
        <View style={{
          flexDirection: "row", alignItems: "center",
          paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14,
          borderBottomWidth: 1, borderBottomColor: C.border,
          backgroundColor: C.surface, gap: 10,
        }}>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 16, color: C.text }}>
              Arrange Layout
            </Text>
            <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 12, color: C.textLight }}>
              Pick layout → tap image → tap slot
            </Text>
          </View>
          <View style={{ backgroundColor: C.successBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}>
            <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 12, color: C.success }}>
              {placedCount}/{selectedLayout.slots}
            </Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>

          {/* Layout chips */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 }}>
            <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 11, color: C.textLight, letterSpacing: 0.8, marginBottom: 10 }}>
              CHOOSE LAYOUT
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {layouts.map((cfg) => {
                  const isActive = selectedLayout.value === cfg.value;
                  return (
                    <TouchableOpacity
                      key={cfg.value}
                      onPress={() => setSelectedLayout(cfg)}
                      style={{
                        alignItems: "center", gap: 5,
                        paddingHorizontal: 10, paddingVertical: 10,
                        borderRadius: 10,
                        backgroundColor: isActive ? C.primary : C.surface,
                        borderWidth: 1, borderColor: isActive ? C.primary : C.border,
                      }}
                    >
                      <LayoutMiniPreview config={cfg} isActive={isActive} size={42} />
                      <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 10, color: isActive ? "#fff" : C.textLight }}>
                        {cfg.label}
                      </Text>
                      <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 9, color: isActive ? "rgba(255,255,255,0.65)" : C.textLight }}>
                        {cfg.slots} slot{cfg.slots > 1 ? "s" : ""}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Screen preview */}
          <View style={{ alignItems: "center", paddingVertical: 16, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10, alignSelf: "flex-start" }}>
              <Ionicons name="eye-outline" size={14} color={C.primary} />
              <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 11, color: C.textLight, letterSpacing: 0.8 }}>
                SCREEN PREVIEW
              </Text>
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
              backgroundColor: "#08111E", borderRadius: 8,
              overflow: "hidden", padding: 4,
              borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
            }}>
              <LayoutGrid
                layoutValue={selectedLayout.value}
                slots={slots}
                imageList={imageList}
                onSlotPress={handleSlotPress}
                onSlotRemove={handleSlotRemove}
                activeTarget={draggingId !== null}
                rows={selectedLayout.rows}
                cols={selectedLayout.cols}
              />
            </View>

            <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 11, color: C.textLight, marginTop: 8 }}>
              {placedCount}/{selectedLayout.slots} slots filled
            </Text>
          </View>

          {/* Image tray */}
          <View style={{ paddingHorizontal: 16 }}>
            <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 11, color: C.textLight, letterSpacing: 0.8, marginBottom: 10 }}>
              YOUR IMAGES — tap to pick, then tap a slot above
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {selectedImageIds.map((id) => {
                const img = imageList.find((i) => i.imageId === id);
                const isPlaced = slots.includes(id);
                const isDragging = draggingId === id;
                return (
                  <TouchableOpacity
                    key={id}
                    onPress={() => setDraggingId(isDragging ? null : id)}
                    style={{
                      width: 82, borderRadius: 8, overflow: "hidden",
                      borderWidth: isDragging ? 2.5 : 1,
                      borderColor: isDragging ? C.primary : isPlaced ? C.success : C.border,
                      opacity: isPlaced && !isDragging ? 0.45 : 1,
                      backgroundColor: C.surface,
                    }}
                  >
                    {img?.imageurl ? (
                      <Image source={{ uri: img.imageurl }} style={{ width: "100%" }} resizeMode="contain" />
                    ) : (
                      <View style={{ height: 62, justifyContent: "center", alignItems: "center", backgroundColor: C.surfaceAlt }}>
                        <Ionicons name="image-outline" size={20} color={C.textLight} />
                      </View>
                    )}
                    <View style={{ paddingHorizontal: 5, paddingVertical: 4 }}>
                      <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 9, color: isPlaced ? C.success : C.textLight }} numberOfLines={1}>
                        {isPlaced ? "✓ Placed" : (img?.imageName || "Image")}
                      </Text>
                    </View>
                    {isDragging && (
                      <View style={{
                        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: "rgba(59,95,192,0.25)",
                        justifyContent: "center", alignItems: "center",
                      }}>
                        <Ionicons name="move-outline" size={18} color={C.primary} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Hint */}
            <View style={{
              flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 14,
              backgroundColor: C.primaryGhost, borderRadius: 10, padding: 12,
            }}>
              <Ionicons name="information-circle-outline" size={15} color={C.primary} />
              <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 12, color: C.primary, flex: 1, lineHeight: 18 }}>
                Tap an image to select it (glows blue), then tap any slot in the preview to place it. Tap × on a filled slot to remove.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Confirm button */}
        <View style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          paddingHorizontal: 16, paddingBottom: 34, paddingTop: 12,
          backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border,
        }}>
          <TouchableOpacity
            style={{
              backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14,
              alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8,
            }}
            onPress={() => onConfirm(selectedLayout.value, slots)}
          >
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 15, color: "#fff" }}>
              Confirm Layout
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </Modal>
  );
};