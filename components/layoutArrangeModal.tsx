// components/layoutArrangeModal.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  Modal, View, Text, TouchableOpacity, ScrollView,
  Image, ActivityIndicator, useWindowDimensions, StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "@/app/dashboard.styles";
import { LayoutConfig } from "../constants/layout";
import { LayoutGrid, LayoutMiniPreview, ImageItem } from "./layoutGrid";
import { ImageSelectModal } from "./selectImageModal";

interface Props {
  visible: boolean;
  onClose: () => void;
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
  
  // Responsive calculations
  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const isDesktop = width >= 1024;
  
  const modalW = isMobile ? width - 32 : Math.min(width * 0.9, 680);
  const modalMaxH = isMobile ? height * 0.85 : height * 0.9;
  const previewW = modalW - (isMobile ? 24 : 48);
  const previewH = Math.round((previewW * 9) / 16);
  
  // Layout pagination
  const layoutsPerPage = isMobile ? 3 : isTablet ? 4 : 5;
  const [layoutPage, setLayoutPage] = useState(0);

  const [selectedLayout, setSelectedLayout] = useState<LayoutConfig | null>(null);
  const [slots, setSlots] = useState<number[][]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [localSelectedIds, setLocalSelectedIds] = useState<number[]>(selectedImageIds);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [addTargetSlot, setAddTargetSlot] = useState<number | null>(null);

  const imageScrollRef = useRef<ScrollView>(null);

  // Calculate total layout pages
  const totalLayoutPages = Math.ceil(layouts.length / layoutsPerPage);
  const currentLayouts = layouts.slice(
    layoutPage * layoutsPerPage, 
    (layoutPage + 1) * layoutsPerPage
  );

  useEffect(() => {
    if (layouts && layouts.length > 0 && !selectedLayout) {
      setSelectedLayout(layouts[0]);
      // Set initial page to show selected layout
      const selectedIndex = layouts.findIndex(l => l.value === layouts[0].value);
      setLayoutPage(Math.floor(selectedIndex / layoutsPerPage));
    }
  }, [layouts]);

  useEffect(() => {
    setLocalSelectedIds(selectedImageIds);
  }, [selectedImageIds]);

  useEffect(() => {
    if (!selectedLayout) return;
    const next: number[][] = Array.from({ length: selectedLayout.slots }, () => []);
    localSelectedIds.forEach((id, i) => {
      const slotIdx = i % selectedLayout.slots;
      next[slotIdx].push(id);
    });
    setSlots(next);
    setDraggingId(null);
  }, [selectedLayout, localSelectedIds]);

  const handleSlotPress = (slotIdx: number) => {
    if (draggingId === null) return;
    setSlots((prev) => {
      const next = prev.map((arr) => arr.filter((id) => id !== draggingId));
      next[slotIdx] = [...next[slotIdx], draggingId];
      return next;
    });
    setDraggingId(null);
  };

  const handleSlotRemove = (slotIdx: number, imageId: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = next[slotIdx].filter((id) => id !== imageId);
      return next;
    });
  };

  const handleSlotAdd = (slotIdx: number) => {
    setAddTargetSlot(slotIdx);
    setShowImagePicker(true);
  };

  const handleImageToggle = (id: number) => {
    if (addTargetSlot !== null) {
      setSlots((prev) => {
        const next = [...prev];
        const slotImages = next[addTargetSlot];
        if (slotImages.includes(id)) {
          next[addTargetSlot] = slotImages.filter((x) => x !== id);
        } else {
          next[addTargetSlot] = [...slotImages, id];
        }
        return next;
      });
    } else {
      setLocalSelectedIds((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        return [...prev, id];
      });
    }
  };

  const handleLayoutSelect = (cfg: LayoutConfig) => {
    setSelectedLayout(cfg);
    const selectedIndex = layouts.findIndex(l => l.value === cfg.value);
    setLayoutPage(Math.floor(selectedIndex / layoutsPerPage));
  };

  const scrollImageTray = (direction: 'left' | 'right') => {
    if (imageScrollRef.current) {
      const scrollAmount = 100;
      imageScrollRef.current.scrollTo({ 
        x: direction === 'left' 
          ? Math.max(0, (imageScrollRef.current as any)?._scrollView?.contentOffset?.x - scrollAmount || 0) 
          : (imageScrollRef.current as any)?._scrollView?.contentOffset?.x + scrollAmount || 0,
        animated: true 
      });
    }
  };

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
          <View style={[s.modalBox, { 
            width: modalW, 
            maxHeight: modalMaxH,
          }]}>

            {/* Header */}
            <View style={[s.header, { paddingHorizontal: isMobile ? 12 : 20, paddingVertical: isMobile ? 12 : 16 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[s.headerTitle, { fontSize: isMobile ? 15 : 17 }]}>Arrange Layout</Text>
                <Text style={[s.headerSub, { fontSize: isMobile ? 10 : 12 }]}>
                  Tap image → tap slot to place, or use + to add multiple
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: isMobile ? 6 : 10 }}>
                <View style={{ backgroundColor: C.successBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
                  <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: isMobile ? 10 : 12, color: C.success }}>
                    {totalSlotsFilled}/{selectedLayout.slots}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={[s.closeBtn, { width: isMobile ? 28 : 32, height: isMobile ? 28 : 32 }]}>
                  <Ionicons name="close" size={isMobile ? 18 : 20} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={{ 
                padding: isMobile ? 12 : 16, 
                gap: isMobile ? 12 : 16 
              }}
            >

              {/* Layout chips with arrows */}
              <View>
                <Text style={[s.sectionLabel, { fontSize: isMobile ? 9 : 10 }]}>CHOOSE LAYOUT</Text>
                <View style={{ position: "relative", marginTop: 8 }}>
                  {/* Left Arrow */}
                  {layoutPage > 0 && (
                    <TouchableOpacity
                      onPress={() => setLayoutPage(prev => prev - 1)}
                      style={[s.layoutNavArrow, s.leftLayoutArrow, {
                        width: isMobile ? 28 : 32,
                        height: isMobile ? 28 : 32,
                      }]}
                    >
                      <Ionicons name="chevron-back" size={isMobile ? 16 : 18} color={C.primary} />
                    </TouchableOpacity>
                  )}

                 <ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={s.layoutGrid}
>

                    {currentLayouts.map((cfg) => {
                      const isActive = selectedLayout.value === cfg.value;
                      return (
                        <TouchableOpacity
                          key={cfg.value}
                          onPress={() => handleLayoutSelect(cfg)}
                          style={[
                            s.layoutCard,
                            isActive && s.layoutCardActive,
                            { 
                              width: isMobile ? 75 : 82,
                              paddingHorizontal: isMobile ? 6 : 10,
                              paddingVertical: isMobile ? 6 : 8,
                            }
                          ]}
                        >
                          <LayoutMiniPreview 
                            config={cfg} 
                            isActive={isActive} 
                            size={isMobile ? 35 : 40} 
                          />
                          <Text style={{ 
                            fontFamily: "Poppins_500Medium", 
                            fontSize: isMobile ? 9 : 10, 
                            color: isActive ? "#fff" : C.textLight,
                            textAlign: "center",
                            marginTop: 2,
                          }}>
                            {cfg.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Right Arrow */}
                  {layoutPage < totalLayoutPages - 1 && (
                    <TouchableOpacity
                      onPress={() => setLayoutPage(prev => prev + 1)}
                      style={[s.layoutNavArrow, s.rightLayoutArrow, {
                        width: isMobile ? 28 : 32,
                        height: isMobile ? 28 : 32,
                      }]}
                    >
                      <Ionicons name="chevron-forward" size={isMobile ? 16 : 18} color={C.primary} />
                    </TouchableOpacity>
                  )}

                  {/* Page indicator */}
                  {totalLayoutPages > 1 && (
                    <View style={s.pageIndicator}>
                      {Array.from({ length: totalLayoutPages }).map((_, idx) => (
                        <View
                          key={idx}
                          style={[
                            s.pageDot,
                            idx === layoutPage && s.pageDotActive
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Screen preview */}
              <View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Ionicons name="eye-outline" size={isMobile ? 12 : 14} color={C.primary} />
                  <Text style={[s.sectionLabel, { fontSize: isMobile ? 9 : 10 }]}>SCREEN PREVIEW</Text>
                  {draggingId !== null && (
                    <View style={{ backgroundColor: C.primaryGhost, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 }}>
                      <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 10, color: C.primary }}>
                        Tap a slot to place
                      </Text>
                    </View>
                  )}
                </View>
                <View style={{
                  width: previewW,
                  height: previewH,
                  backgroundColor: "#08111E",
                  borderRadius: 8,
                  overflow: "hidden",
                  padding: isMobile ? 2 : 4,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
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
                <Text style={{ 
                  fontFamily: "Poppins_400Regular", 
                  fontSize: isMobile ? 10 : 11, 
                  color: C.textLight, 
                  marginTop: 6, 
                  textAlign: "center" 
                }}>
                  {totalSlotsFilled}/{selectedLayout.slots} slots with {allPlacedIds.length} images
                </Text>
              </View>

              {/* Image tray */}
              <View>
                <View style={{ 
                  flexDirection: isMobile ? "column" : "row", 
                  alignItems: isMobile ? "flex-start" : "center", 
                  justifyContent: "space-between", 
                  marginBottom: 8,
                  gap: isMobile ? 8 : 0,
                }}>
                  <Text style={[s.sectionLabel, { fontSize: isMobile ? 9 : 10 }]}>
                    YOUR IMAGES — tap to pick, tap slot to place
                  </Text>
                  <TouchableOpacity
                    onPress={() => { setAddTargetSlot(null); setShowImagePicker(true); }}
                    style={{ 
                      flexDirection: "row", 
                      alignItems: "center", 
                      gap: 4, 
                      backgroundColor: C.primaryGhost, 
                      paddingHorizontal: 10, 
                      paddingVertical: 5, 
                      borderRadius: 8,
                      alignSelf: isMobile ? "flex-end" : "auto",
                    }}
                  >
                    <Ionicons name="pencil-outline" size={12} color={C.primary} />
                    <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 11, color: C.primary }}>Edit</Text>
                  </TouchableOpacity>
                </View>

                {localSelectedIds.length === 0 ? (
                  <TouchableOpacity
                    onPress={() => { setAddTargetSlot(null); setShowImagePicker(true); }}
                    style={{ 
                      borderWidth: 1.5, 
                      borderColor: "#E2E8F0", 
                      borderStyle: "dashed", 
                      borderRadius: 12, 
                      paddingVertical: isMobile ? 16 : 24, 
                      alignItems: "center", 
                      gap: 8 
                    }}
                  >
                    <Ionicons name="images-outline" size={isMobile ? 24 : 28} color={C.textLight} />
                    <Text style={{ fontFamily: "Poppins_500Medium", fontSize: isMobile ? 12 : 13, color: C.textLight }}>
                      Tap to select images
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ position: "relative" }}>
                    {/* Left Arrow */}
                    {localSelectedIds.length > 3 && (
                      <TouchableOpacity
                        onPress={() => scrollImageTray('left')}
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "50%",
                          transform: [{ translateY: -16 }],
                          zIndex: 10,
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: "rgba(255,255,255,0.95)",
                          justifyContent: "center",
                          alignItems: "center",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 3,
                        }}
                      >
                        <Ionicons name="chevron-back" size={20} color={C.primary} />
                      </TouchableOpacity>
                    )}

                    <ScrollView 
                      ref={imageScrollRef}
                      horizontal 
                      showsHorizontalScrollIndicator={true}
                      contentContainerStyle={{ 
                        gap: 8, 
                        paddingVertical: 4, 
                        paddingHorizontal: localSelectedIds.length > 3 ? 40 : 0 
                      }}
                      style={{ maxHeight: isMobile ? 80 : 100 }}
                    >
                      {localSelectedIds.map((id) => {
                        const img = imageList.find((i) => i.imageId === id);
                        const isPlaced = allPlacedIds.includes(id);
                        const isDragging = draggingId === id;
                        return (
                          <TouchableOpacity
                            key={id}
                            onPress={() => setDraggingId(isDragging ? null : id)}
                            style={{
                              width: isMobile ? 70 : 80,
                              borderRadius: 8,
                              overflow: "hidden",
                              borderWidth: isDragging ? 2.5 : 1.5,
                              borderColor: isDragging ? C.primary : isPlaced ? C.success : C.border,
                              opacity: isPlaced && !isDragging ? 0.6 : 1,
                              backgroundColor: "#F8FAFC",
                            }}
                          >
                            {img?.imageurl ? (
                              <Image 
                                source={{ uri: img.imageurl }} 
                                style={{ width: "100%", height: isMobile ? 50 : 60 }} 
                                resizeMode="cover" 
                              />
                            ) : (
                              <View style={{ 
                                height: isMobile ? 50 : 60, 
                                justifyContent: "center", 
                                alignItems: "center", 
                                backgroundColor: C.surfaceAlt 
                              }}>
                                <Ionicons name="image-outline" size={isMobile ? 16 : 20} color={C.textLight} />
                              </View>
                            )}
                            <View style={{ paddingHorizontal: 5, paddingVertical: 4 }}>
                              <Text style={{ 
                                fontFamily: "Poppins_400Regular", 
                                fontSize: isMobile ? 8 : 9, 
                                color: isPlaced ? C.success : C.textLight 
                              }} numberOfLines={1}>
                                {isPlaced ? "✓ Placed" : img?.imageName || "Image"}
                              </Text>
                            </View>
                            {isDragging && (
                              <View style={{ 
                                position: "absolute", 
                                top: 0, 
                                left: 0, 
                                right: 0, 
                                bottom: 0, 
                                backgroundColor: "rgba(59,95,192,0.2)", 
                                justifyContent: "center", 
                                alignItems: "center" 
                              }}>
                                <Ionicons name="move-outline" size={isMobile ? 16 : 18} color={C.primary} />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    {/* Right Arrow */}
                    {localSelectedIds.length > 3 && (
                      <TouchableOpacity
                        onPress={() => scrollImageTray('right')}
                        style={{
                          position: "absolute",
                          right: 0,
                          top: "50%",
                          transform: [{ translateY: -16 }],
                          zIndex: 10,
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: "rgba(255,255,255,0.95)",
                          justifyContent: "center",
                          alignItems: "center",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 3,
                        }}
                      >
                        <Ionicons name="chevron-forward" size={20} color={C.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <View style={{ 
                  flexDirection: "row", 
                  alignItems: "flex-start", 
                  gap: 8, 
                  marginTop: 12, 
                  backgroundColor: C.primaryGhost, 
                  borderRadius: 10, 
                  padding: isMobile ? 8 : 10 
                }}>
                  <Ionicons name="information-circle-outline" size={isMobile ? 13 : 15} color={C.primary} />
                  <Text style={{ 
                    fontFamily: "Poppins_400Regular", 
                    fontSize: isMobile ? 11 : 12, 
                    color: C.primary, 
                    flex: 1, 
                    lineHeight: isMobile ? 16 : 18 
                  }}>
                    Tap an image then tap a slot to place it. Press{" "}
                    <Text style={{ fontFamily: "Poppins_600SemiBold" }}>+</Text>{" "}
                    on any slot to add multiple images to that slot.
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
                onPress={() => onConfirm(selectedLayout.value, slots)}
                style={[s.confirmBtn, { paddingVertical: isMobile ? 10 : 12 }]}
              >
                <Ionicons name="checkmark-circle" size={isMobile ? 14 : 16} color="#fff" />
                <Text style={{ fontSize: isMobile ? 13 : 14, fontFamily: "Poppins_600SemiBold", color: "#fff" }}>
                  Confirm Layout
                </Text>
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
  overlay: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.55)", 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 16 
  },
  modalBox: { 
    backgroundColor: "#fff", 
    borderRadius: 20, 
    overflow: "hidden", 
    shadowColor: "#000", 
    shadowOpacity: 0.2, 
    shadowRadius: 20, 
    elevation: 20 
  },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    borderBottomWidth: 1, 
    borderBottomColor: "#F1F5F9" 
  },
  headerTitle: { fontWeight: "700", color: "#111" },
  headerSub: { color: "#64748B", marginTop: 2 },
  closeBtn: { 
    borderRadius: 99, 
    backgroundColor: "#F1F5F9", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  sectionLabel: { 
    fontFamily: "Poppins_600SemiBold", 
    color: C.textLight, 
    letterSpacing: 0.8 
  },
  layoutGrid: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 40,
  },
  layoutCard: {
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  layoutCardActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  layoutNavArrow: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -16 }],
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leftLayoutArrow: {
    left: 0,
  },
  rightLayoutArrow: {
    right: 0,
  },
  pageIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  pageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E2E8F0",
  },
  pageDotActive: {
    backgroundColor: C.primary,
    width: 16,
  },
  footer: { 
    flexDirection: "row", 
    borderTopWidth: 1, 
    borderTopColor: "#F1F5F9" 
  },
  cancelBtn: { 
    flex: 1, 
    borderRadius: 12, 
    borderWidth: 1.5, 
    borderColor: "#E5E7EB", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  confirmBtn: { 
    flex: 2, 
    borderRadius: 12, 
    backgroundColor: C.primary, 
    alignItems: "center", 
    justifyContent: "center", 
    flexDirection: "row", 
    gap: 6 
  },
});