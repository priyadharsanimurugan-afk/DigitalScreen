// components/liveContentEdit.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, Modal, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Image, PanResponder, Animated,
  useWindowDimensions, StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LayoutArrangeModal } from "@/components/layoutArrangeModal";
import { TVNoticeBoard } from "@/components/dashboardAtoms";
import { getLayoutConfig } from "@/constants/layout";
import { C } from "@/app/dashboard.styles";

// ─── DRAGGABLE SLOT ───────────────────────────────────────────────────────────
const DraggableSlot = ({ slotIndex, imageIds, imageList, totalSlots, slotSize, onSwap, onRemove }: {
  slotIndex: number; imageIds: number[]; imageList: any[];
  totalSlots: number; slotSize: number;
  onSwap: (from: number, to: number) => void; onRemove: (idx: number, imageId?: number) => void;
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const cols = Math.min(totalSlots, 3);
  
  const primaryImageId = imageIds[0];
  const img = primaryImageId ? imageList.find((i) => i.imageId === primaryImageId) : null;

  const pr = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => imageIds.length > 0,
    onMoveShouldSetPanResponder: () => imageIds.length > 0,
    onPanResponderGrant: () => { Animated.spring(scale, { toValue: 1.1, useNativeDriver: true }).start(); },
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: (_, gs) => {
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
      const dc = Math.round(gs.dx / (slotSize + 8));
      const dr = Math.round(gs.dy / (slotSize + 8));
      const target = slotIndex + dr * cols + dc;
      if ((dc !== 0 || dr !== 0) && target >= 0 && target < totalSlots) onSwap(slotIndex, target);
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    },
    onPanResponderTerminate: () => {
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    },
  })).current;

  return (
    <Animated.View {...pr.panHandlers} style={[
      s.slot,
      { width: slotSize, height: slotSize, transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale }] }
    ]}>
      {img?.imageurl ? (
        <>
          <Image source={{ uri: img.imageurl }} style={s.slotImage} resizeMode="cover" />
          <View style={s.slotBadge}>
            <Text style={s.slotBadgeText}>{slotIndex + 1}</Text>
          </View>
          {imageIds.length > 1 && (
            <View style={s.multiBadge}>
              <Text style={s.multiBadgeText}>+{imageIds.length - 1}</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => onRemove(slotIndex)} style={s.slotRemove} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Ionicons name="close" size={10} color="#fff" />
          </TouchableOpacity>
        </>
      ) : (
        <View style={s.slotEmpty}>
          <Ionicons name="image-outline" size={18} color={C.textLight} />
          <Text style={s.slotEmptyText}>Slot {slotIndex + 1}</Text>
        </View>
      )}
    </Animated.View>
  );
};

// ─── MAIN MODAL ───────────────────────────────────────────────────────────────
export interface EditContentPayload {
  title: string;
  description: string;
  slots: { slotIndex: number; imageIds: number[] }[];
  screenLayout: string;
  deviceId: string;
}

interface Props {
  visible: boolean; onClose: () => void; content: any;
  imageList: any[]; layouts: any[]; deviceId: string;
  onSend: (payload: EditContentPayload) => Promise<void>;
}

const LiveContentEditModal: React.FC<Props> = ({ visible, onClose, content, imageList, layouts, deviceId, onSend }) => {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 640;
  const modalW = Math.min(width - 32, isMobile ? width - 16 : 680);
  const slotSize = Math.min(isMobile ? 55 : 65, (modalW - 48) / 3);

  const [selectedLayout, setSelectedLayout] = useState("");
  const [slotAssignment, setSlotAssignment] = useState<number[][]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [layoutModalVisible, setLayoutModalVisible] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<number[]>([]);

  useEffect(() => {
    if (content && visible) {
      setTitle(content.title || "");
      setDescription(content.description || "");
      setSelectedLayout(content.screenLayout || "");

      const cfg = getLayoutConfig(content.screenLayout);
      
      // Handle slots-based structure (supports multiple images per slot)
      if (content.slots && Array.isArray(content.slots)) {
        const allImageIds = content.slots.flatMap((s: any) => s.imageIds || []);
        setSelectedImageIds([...new Set(allImageIds)]);
        
        if (cfg) {
          const asgn: number[][] = Array.from({ length: cfg.slots }, () => []);
          content.slots.forEach((slot: any) => {
            if (slot.slotIndex < asgn.length && slot.imageIds?.length > 0) {
              asgn[slot.slotIndex] = slot.imageIds;
            }
          });
          setSlotAssignment(asgn);
        } else {
          setSlotAssignment([]);
        }
      } 
      // Fallback for old structure
      else if (content.images && Array.isArray(content.images)) {
        const imageIds = content.images.map((img: any) => img.imageId);
        setSelectedImageIds(imageIds);
        
        if (cfg) {
          const asgn: number[][] = Array.from({ length: cfg.slots }, () => []);
          content.images.forEach((img: any, idx: number) => {
            if (idx < asgn.length) asgn[idx] = [img.imageId];
          });
          setSlotAssignment(asgn);
        } else {
          setSlotAssignment([]);
        }
      } else if (cfg) {
        setSlotAssignment(Array.from({ length: cfg.slots }, () => []));
      }
    }
  }, [content, visible]);

  const handleSwap = (from: number, to: number) => {
    setSlotAssignment((prev) => {
      const next = [...prev];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  };

  const handleRemoveSlot = (idx: number) => {
    setSlotAssignment((prev) => {
      const next = [...prev];
      next[idx] = [];
      return next;
    });
  };

  const handleSave = async () => {
    const slots = slotAssignment.map((imageIds, index) => ({ 
      slotIndex: index, 
      imageIds: imageIds 
    }));
    setSaving(true);
    await onSend({ title, description, screenLayout: selectedLayout, deviceId, slots });
    setSaving(false);
    onClose();
  };

  if (!content) return null;

  const layoutLabel = getLayoutConfig(selectedLayout)?.label || selectedLayout;
  const placedCount = slotAssignment.filter(ids => ids.length > 0).length;
  const totalImages = slotAssignment.flat().length;

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={s.overlay}>
          <View style={[s.modalBox, { width: modalW, maxHeight: height * 0.90 }]}>
            
            {/* Header */}
            <View style={[s.header, { paddingHorizontal: isMobile ? 12 : 18, paddingVertical: isMobile ? 10 : 14 }]}>
              <View style={s.headerIcon}>
                <Ionicons name="create-outline" size={isMobile ? 16 : 18} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.headerTitle, { fontSize: isMobile ? 14 : 15 }]}>Edit Live Content</Text>
                <Text style={[s.headerSub, { fontSize: isMobile ? 10 : 11 }]} numberOfLines={1}>
                  {content.displayName || content.deviceName}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                <Ionicons name="close" size={isMobile ? 16 : 18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={{ padding: isMobile ? 10 : 16, paddingBottom: isMobile ? 80 : 16 }}
            >
              <View style={{ flexDirection: isMobile ? "column" : "row", gap: 16 }}>
                
                {/* Left Column - Editor */}
                <View style={{ flex: 1, gap: 12 }}>
                  
                  {/* Layout Section */}
                  <View style={[s.section, { padding: isMobile ? 10 : 12 }]}>
                    <View style={s.sectionHeader}>
                      <Text style={[s.sectionLabel, { fontSize: isMobile ? 9 : 10 }]}>LAYOUT</Text>
                      {selectedLayout && (
                        <View style={s.layoutBadge}>
                          <Text style={s.layoutBadgeText}>{placedCount}/{slotAssignment.length}</Text>
                        </View>
                      )}
                    </View>
                    
                    {selectedLayout && (
                      <View style={s.layoutInfo}>
                        <Ionicons name="grid-outline" size={13} color={C.primary} />
                        <Text style={s.layoutInfoText}>{layoutLabel}</Text>
                        <Text style={s.layoutInfoSub}>({totalImages} image{totalImages !== 1 ? 's' : ''})</Text>
                      </View>
                    )}
                    
                    <TouchableOpacity onPress={() => setLayoutModalVisible(true)} style={s.editBtn}>
                      <Ionicons name="grid-outline" size={14} color={C.primary} />
                      <Text style={s.editBtnText}>
                        {selectedLayout ? "Change Layout & Images" : "Choose Layout & Images"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Slots Section */}
                  {slotAssignment.length > 0 && (
                    <View style={[s.section, { padding: isMobile ? 10 : 12 }]}>
                      <Text style={[s.sectionLabel, { fontSize: isMobile ? 9 : 10, marginBottom: 8 }]}>
                        SLOTS ({placedCount} filled)
                      </Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                        {slotAssignment.map((imageIds, idx) => (
                          <DraggableSlot 
                            key={idx} 
                            slotIndex={idx} 
                            imageIds={imageIds} 
                            imageList={imageList}
                            totalSlots={slotAssignment.length} 
                            slotSize={slotSize}
                            onSwap={handleSwap} 
                            onRemove={handleRemoveSlot} 
                          />
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Title & Description */}
                  <View style={[s.section, { padding: isMobile ? 10 : 12 }]}>
                    <Text style={[s.sectionLabel, { fontSize: isMobile ? 9 : 10 }]}>TITLE *</Text>
                    <TextInput 
                      style={[s.input, { fontSize: isMobile ? 12 : 13 }]} 
                      value={title} 
                      onChangeText={setTitle} 
                      placeholder="Enter content title" 
                      placeholderTextColor={C.textLight} 
                    />
                    
                    <Text style={[s.sectionLabel, { marginTop: 12, fontSize: isMobile ? 9 : 10 }]}>DESCRIPTION</Text>
                    <TextInput 
                      style={[s.input, s.textArea, { fontSize: isMobile ? 12 : 13 }]} 
                      value={description} 
                      onChangeText={setDescription} 
                      placeholder="Optional description" 
                      placeholderTextColor={C.textLight} 
                      multiline 
                      numberOfLines={3} 
                    />
                  </View>
                </View>

                {/* Right Column - Preview */}
                <View style={{ flex: 1 }}>
                  <View style={[s.section, { padding: isMobile ? 10 : 12 }]}>
                    <Text style={[s.sectionLabel, { fontSize: isMobile ? 9 : 10, marginBottom: 8 }]}>LIVE PREVIEW</Text>
                    <TVNoticeBoard 
                      slotAssignment={slotAssignment} 
                      imageList={imageList} 
                      selectedLayout={selectedLayout} 
                      title={title} 
                    />
                    
                    {/* Summary */}
                    <View style={s.summary}>
                      {[
                        { icon: "text-outline", label: "Title", val: title || "—" },
                        { icon: "grid-outline", label: "Layout", val: layoutLabel || "—" },
                        { icon: "images-outline", label: "Images", val: `${totalImages} total` },
                        { icon: "albums-outline", label: "Slots", val: `${placedCount}/${slotAssignment.length}` },
                      ].map((r) => (
                        <View key={r.label} style={s.summaryRow}>
                          <Ionicons name={r.icon as any} size={12} color={C.textLight} />
                          <Text style={s.summaryLabel}>{r.label}</Text>
                          <Text style={s.summaryValue} numberOfLines={1}>{r.val}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={[s.footer, { padding: isMobile ? 10 : 14, gap: isMobile ? 8 : 10 }]}>
              <TouchableOpacity onPress={onClose} style={[s.cancelBtn, { paddingVertical: isMobile ? 10 : 12 }]}>
                <Text style={[s.cancelBtnText, { fontSize: isMobile ? 13 : 14 }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSave} 
                disabled={saving || !title.trim() || totalImages === 0} 
                style={[
                  s.sendBtn, 
                  (saving || !title.trim() || totalImages === 0) && { opacity: 0.5 }, 
                  { paddingVertical: isMobile ? 10 : 12 }
                ]}
              >
                {saving ? <ActivityIndicator color="#fff" size="small" /> : (
                  <>
                    <Ionicons name="send" size={isMobile ? 14 : 15} color="#fff" />
                    <Text style={[s.sendBtnText, { fontSize: isMobile ? 13 : 14 }]}>Send to TV</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <LayoutArrangeModal
        visible={layoutModalVisible}
        onClose={() => setLayoutModalVisible(false)}
        onConfirm={(layout, asgn) => {
          setSelectedLayout(layout);
          setSlotAssignment(asgn);
          const allImageIds = asgn.flat().filter((id): id is number => id !== null && id !== undefined);
          setSelectedImageIds([...new Set(allImageIds)]);
          setLayoutModalVisible(false);
        }}
        imageList={imageList}
        selectedImageIds={selectedImageIds}
        layouts={layouts}
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
    padding: 12 
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
    gap: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: "#F3F4F6" 
  },
  headerIcon: { 
    width: 34, 
    height: 34, 
    borderRadius: 9, 
    backgroundColor: C.primaryGhost, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  headerTitle: { 
    fontFamily: "Poppins_700Bold", 
    color: "#111" 
  },
  headerSub: { 
    fontFamily: "Poppins_400Regular", 
    color: C.textLight 
  },
  closeBtn: { 
    width: 30, 
    height: 30, 
    borderRadius: 99, 
    backgroundColor: "#F3F4F6", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  
  section: { 
    backgroundColor: "#F9FAFB", 
    borderRadius: 12 
  },
  sectionHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    marginBottom: 8 
  },
  sectionLabel: { 
    fontFamily: "Poppins_600SemiBold", 
    color: C.textLight, 
    letterSpacing: 0.5 
  },
  
  layoutBadge: { 
    backgroundColor: C.primary, 
    borderRadius: 99, 
    paddingHorizontal: 7, 
    paddingVertical: 2 
  },
  layoutBadgeText: { 
    fontSize: 9, 
    color: "#fff", 
    fontFamily: "Poppins_600SemiBold" 
  },
  layoutInfo: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#EFF6FF", 
    borderRadius: 8, 
    padding: 8, 
    marginBottom: 8, 
    gap: 6 
  },
  layoutInfoText: { 
    flex: 1, 
    fontSize: 12, 
    fontFamily: "Poppins_600SemiBold", 
    color: C.primary 
  },
  layoutInfoSub: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    color: C.textLight,
  },
  
  editBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 6, 
    paddingVertical: 10, 
    borderRadius: 9, 
    borderWidth: 1.5, 
    borderColor: C.primary, 
    backgroundColor: C.primaryGhost 
  },
  editBtnText: { 
    fontSize: 13, 
    fontFamily: "Poppins_600SemiBold", 
    color: C.primary 
  },
  
  input: { 
    backgroundColor: "#fff", 
    borderRadius: 9, 
    borderWidth: 1, 
    borderColor: "#E5E7EB", 
    paddingHorizontal: 12, 
    paddingVertical: 9, 
    fontFamily: "Poppins_400Regular", 
    color: "#111" 
  },
  textArea: { 
    minHeight: 72, 
    textAlignVertical: "top" 
  },
  
  slot: { 
    borderRadius: 10, 
    overflow: "hidden", 
    backgroundColor: C.surfaceAlt, 
    borderWidth: 1.5, 
    borderStyle: "dashed", 
    borderColor: C.border, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  slotImage: { 
    width: "100%", 
    height: "100%" 
  },
  slotBadge: { 
    position: "absolute", 
    top: 4, 
    left: 4, 
    backgroundColor: C.primary, 
    borderRadius: 99, 
    width: 18, 
    height: 18, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  slotBadgeText: { 
    fontSize: 9, 
    color: "#fff", 
    fontFamily: "Poppins_700Bold" 
  },
  multiBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 99,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  multiBadgeText: {
    fontSize: 8,
    color: "#fff",
    fontFamily: "Poppins_600SemiBold",
  },
  slotRemove: { 
    position: "absolute", 
    top: 4, 
    right: 4, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    borderRadius: 99, 
    width: 18, 
    height: 18, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  slotEmpty: { 
    alignItems: "center", 
    gap: 4 
  },
  slotEmptyText: { 
    fontSize: 9, 
    color: C.textLight, 
    fontFamily: "Poppins_500Medium" 
  },
  
  summary: { 
    width: "100%", 
    backgroundColor: "#fff", 
    borderRadius: 10, 
    padding: 12, 
    marginTop: 12, 
    gap: 6, 
    borderWidth: 1, 
    borderColor: "#E5E7EB" 
  },
  summaryRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8 
  },
  summaryLabel: { 
    fontSize: 11, 
    fontFamily: "Poppins_500Medium", 
    color: C.textLight, 
    width: 48 
  },
  summaryValue: { 
    fontSize: 12, 
    fontFamily: "Poppins_600SemiBold", 
    color: "#111", 
    flex: 1 
  },
  
  footer: { 
    flexDirection: "row", 
    borderTopWidth: 1, 
    borderTopColor: "#F3F4F6",
    backgroundColor: "#fff",
  },
  cancelBtn: { 
    flex: 1, 
    borderRadius: 12, 
    borderWidth: 1.5, 
    borderColor: "#E5E7EB", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  cancelBtnText: { 
    fontFamily: "Poppins_600SemiBold", 
    color: "#6B7280" 
  },
  sendBtn: { 
    flex: 2, 
    borderRadius: 12, 
    backgroundColor: C.primary, 
    alignItems: "center", 
    justifyContent: "center", 
    flexDirection: "row", 
    gap: 8 
  },
  sendBtnText: { 
    fontFamily: "Poppins_700Bold", 
    color: "#fff" 
  },
});

export default LiveContentEditModal;