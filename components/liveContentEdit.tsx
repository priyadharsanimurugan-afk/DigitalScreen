// components/liveContentEdit.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, Modal, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Image, PanResponder, Animated,
  useWindowDimensions, StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ImageSelectModal } from "@/components/selectImageModal";
import { LayoutArrangeModal } from "@/components/layoutArrangeModal";
import { TVNoticeBoard } from "@/components/dashboardAtoms";
import { getLayoutConfig } from "@/constants/layout";
import { C } from "@/app/dashboard.styles";

// ─── DRAGGABLE SLOT ───────────────────────────────────────────────────────────
const DraggableSlot = ({ slotIndex, imageId, imageList, totalSlots, slotSize, onSwap, onRemove }: {
  slotIndex: number; imageId: number | null; imageList: any[];
  totalSlots: number; slotSize: number;
  onSwap: (from: number, to: number) => void; onRemove: (idx: number) => void;
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const img = imageId ? imageList.find((i) => i.imageId === imageId) : null;
  const cols = Math.min(totalSlots, 3);

  const pr = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !!imageId,
    onMoveShouldSetPanResponder: () => !!imageId,
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
    <Animated.View {...pr.panHandlers}
      style={{ transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale }], width: slotSize, height: slotSize, borderRadius: 10, overflow: "hidden", backgroundColor: C.surfaceAlt, borderWidth: imageId ? 0 : 1.5, borderStyle: "dashed", borderColor: C.border, justifyContent: "center", alignItems: "center", zIndex: 1 }}>
      {img?.imageurl ? (
        <>
          <Image source={{ uri: img.imageurl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          <View style={{ position: "absolute", top: 4, left: 4, backgroundColor: C.primary, borderRadius: 99, width: 18, height: 18, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontSize: 9, color: "#fff", fontFamily: "Poppins_700Bold" }}>{slotIndex + 1}</Text>
          </View>
          <View style={{ position: "absolute", bottom: 4, right: 4, backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 4, padding: 3 }}>
            <Ionicons name="move" size={10} color="#fff" />
          </View>
          <TouchableOpacity onPress={() => onRemove(slotIndex)} style={{ position: "absolute", top: 4, right: 4, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 99, width: 18, height: 18, justifyContent: "center", alignItems: "center" }} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Ionicons name="close" size={10} color="#fff" />
          </TouchableOpacity>
        </>
      ) : (
        <View style={{ alignItems: "center", gap: 4 }}>
          <Ionicons name="image-outline" size={18} color={C.textLight} />
          <Text style={{ fontSize: 9, color: C.textLight, fontFamily: "Poppins_500Medium" }}>Slot {slotIndex + 1}</Text>
        </View>
      )}
    </Animated.View>
  );
};

// ─── MAIN MODAL ───────────────────────────────────────────────────────────────
export interface EditContentPayload {
  title: string; description: string;
  imageIds: number[]; screenLayout: string; deviceId: string;
}

interface Props {
  visible: boolean; onClose: () => void; content: any;
  imageList: any[]; layouts: any[]; deviceId: string;
  onSend: (payload: EditContentPayload) => Promise<void>;
}

const LiveContentEditModal: React.FC<Props> = ({ visible, onClose, content, imageList, layouts, deviceId, onSend }) => {
  const { width, height } = useWindowDimensions();
  const modalW = Math.min(width - 32, 680);
  const slotSize = Math.min(65, (modalW - 48 - 24) / 3);

  const [selectedLayout, setSelectedLayout] = useState("");
  const [slotAssignment, setSlotAssignment] = useState<(number | null)[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [layoutModalVisible, setLayoutModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageIds, setSelectedImageIds] = useState<number[]>([]);

  useEffect(() => {
    if (content && visible) {
      setTitle(content.title || "");
      setDescription(content.description || "");
      setSelectedLayout(content.screenLayout || "");
      const imageIds = content.images?.map((img: any) => img.imageId) || [];
      setSelectedImageIds(imageIds);
      const cfg = getLayoutConfig(content.screenLayout);
      if (cfg) {
        const asgn = new Array(cfg.slots).fill(null);
        content.images?.forEach((img: any, idx: number) => { if (idx < asgn.length) asgn[idx] = img.imageId; });
        setSlotAssignment(asgn);
      } else {
        setSlotAssignment(imageIds.map((id: number) => id));
      }
    }
  }, [content, visible]);

  // Sync slots when images change
  useEffect(() => {
    if (!selectedLayout) return;
    const cfg = getLayoutConfig(selectedLayout);
    if (!cfg) return;
    setSlotAssignment((prev) => {
      const next = new Array(cfg.slots).fill(null);
      prev.forEach((id, idx) => { if (idx < next.length) next[idx] = id; });
      selectedImageIds.forEach((id) => {
        if (!next.includes(id)) {
          const empty = next.findIndex((v) => v === null);
          if (empty !== -1) next[empty] = id;
        }
      });
      return next.map((id) => (id !== null && selectedImageIds.includes(id) ? id : null));
    });
  }, [selectedImageIds, selectedLayout]);

  const handleSwap = (from: number, to: number) => {
    setSlotAssignment((prev) => {
      const next = [...prev];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  };

  const handleRemoveSlot = (idx: number) => {
    setSlotAssignment((prev) => { const next = [...prev]; next[idx] = null; return next; });
  };

  const handleSave = async () => {
    const imageIds = slotAssignment.filter((id): id is number => id !== null);
    setSaving(true);
    await onSend({ title, description, imageIds, screenLayout: selectedLayout, deviceId });
    setSaving(false);
    onClose();
  };

  if (!content) return null;
  const layoutLabel = getLayoutConfig(selectedLayout)?.label || selectedLayout;
  const placedCount = slotAssignment.filter(Boolean).length;

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={s.overlay}>
          <View style={[s.modalBox, { width: modalW, maxHeight: height * 0.9 }]}>
            {/* Header */}
            <View style={s.header}>
              <View style={s.headerIcon}><Ionicons name="create-outline" size={18} color={C.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.headerTitle}>Edit Live Content</Text>
                <Text style={s.headerSub}>{content.displayName || content.deviceName}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={s.closeBtn}><Ionicons name="close" size={18} color="#6B7280" /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 16 }}>
              {/* Combined View: Left - Editor, Right - Preview */}
              <View style={{ flexDirection: "row", gap: 16 }}>
                {/* Left Column - Editor */}
                <View style={{ flex: 1, gap: 12 }}>
                  {/* Images Section */}
                  <View style={s.section}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <Text style={s.sectionLabel}>IMAGES</Text>
                      <TouchableOpacity onPress={() => setImageModalVisible(true)} style={s.editChip}>
                        <Ionicons name="add" size={13} color={C.primary} />
                        <Text style={s.editChipText}>{selectedImageIds.length > 0 ? `${selectedImageIds.length} selected` : "Select"}</Text>
                      </TouchableOpacity>
                    </View>
                    {slotAssignment.length > 0 ? (
                      <>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 }}>
                          <Ionicons name="move" size={11} color={C.textLight} />
                          <Text style={{ fontSize: 10, fontFamily: "Poppins_400Regular", color: C.textLight }}>Drag to reorder slots</Text>
                        </View>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                          {slotAssignment.map((id, idx) => (
                            <DraggableSlot key={idx} slotIndex={idx} imageId={id} imageList={imageList}
                              totalSlots={slotAssignment.length} slotSize={slotSize}
                              onSwap={handleSwap} onRemove={handleRemoveSlot} />
                          ))}
                        </View>
                      </>
                    ) : (
                      <TouchableOpacity onPress={() => setImageModalVisible(true)} style={{ height: 72, borderRadius: 10, borderWidth: 1.5, borderStyle: "dashed", borderColor: C.border, justifyContent: "center", alignItems: "center", gap: 6 }}>
                        <Ionicons name="images-outline" size={20} color={C.textLight} />
                        <Text style={{ fontSize: 12, fontFamily: "Poppins_500Medium", color: C.textLight }}>Tap to select images</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Layout Section */}
                  <View style={s.section}>
                    <Text style={s.sectionLabel}>LAYOUT</Text>
                    {selectedLayout && (
                      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#EFF6FF", borderRadius: 8, padding: 8, marginBottom: 8, gap: 6 }}>
                        <Ionicons name="grid-outline" size={13} color={C.primary} />
                        <Text style={{ flex: 1, fontSize: 12, fontFamily: "Poppins_600SemiBold", color: C.primary }}>{layoutLabel}</Text>
                        <View style={{ backgroundColor: C.primary, borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 }}>
                          <Text style={{ fontSize: 9, color: "#fff", fontFamily: "Poppins_600SemiBold" }}>{placedCount} placed</Text>
                        </View>
                      </View>
                    )}
                    <TouchableOpacity onPress={() => setLayoutModalVisible(true)} style={s.editBtn}>
                      <Ionicons name="grid-outline" size={14} color={C.primary} />
                      <Text style={s.editBtnText}>{selectedLayout ? "Change Layout" : "Choose Layout"}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Title & Description */}
                  <View style={s.section}>
                    <Text style={s.sectionLabel}>TITLE *</Text>
                    <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Enter content title" placeholderTextColor={C.textLight} />
                    <Text style={[s.sectionLabel, { marginTop: 12 }]}>DESCRIPTION (OPTIONAL)</Text>
                    <TextInput style={[s.input, { minHeight: 72, textAlignVertical: "top" }]} value={description} onChangeText={setDescription} placeholder="Optional description" placeholderTextColor={C.textLight} multiline numberOfLines={3} />
                  </View>
                </View>

                {/* Right Column - Live Preview */}
                <View style={{ flex: 1 }}>
                  <View style={[s.section, { height: "100%" }]}>
                    <Text style={s.sectionLabel}>LIVE PREVIEW</Text>
                    <Text style={{ fontSize: 10, fontFamily: "Poppins_400Regular", color: C.textLight, marginBottom: 12 }}>How it appears on the TV screen</Text>
                    <TVNoticeBoard slotAssignment={slotAssignment} imageList={imageList} selectedLayout={selectedLayout} title={title} />
                    
                    {/* Preview Info Card */}
                    <View style={{ width: "100%", backgroundColor: "#fff", borderRadius: 10, padding: 12, marginTop: 12, gap: 6, borderWidth: 1, borderColor: "#E5E7EB" }}>
                      {[
                        { icon: "text-outline", label: "Title", val: title || "—" },
                        { icon: "grid-outline", label: "Layout", val: layoutLabel || "—" },
                        { icon: "images-outline", label: "Images", val: `${placedCount} placed` },
                      ].map((r) => (
                        <View key={r.label} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <Ionicons name={r.icon as any} size={13} color={C.textLight} />
                          <Text style={{ fontSize: 11, fontFamily: "Poppins_500Medium", color: C.textLight, width: 48 }}>{r.label}</Text>
                          <Text style={{ fontSize: 12, fontFamily: "Poppins_600SemiBold", color: "#111", flex: 1 }} numberOfLines={1}>{r.val}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={s.footer}>
              <TouchableOpacity onPress={onClose} style={s.cancelBtn}>
                <Text style={{ fontSize: 14, fontFamily: "Poppins_600SemiBold", color: "#6B7280" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={saving} style={[s.sendBtn, saving && { opacity: 0.6 }]}>
                {saving ? <ActivityIndicator color="#fff" size="small" />
                  : <><Ionicons name="send" size={15} color="#fff" /><Text style={{ fontSize: 14, fontFamily: "Poppins_700Bold", color: "#fff" }}>Send to TV</Text></>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ImageSelectModal visible={imageModalVisible} onClose={() => setImageModalVisible(false)} options={imageList} selected={selectedImageIds} onToggle={(id) => setSelectedImageIds((p) => p.includes(id) ? p.filter((i) => i !== id) : [...p, id])} maxSelect={6} />
      <LayoutArrangeModal visible={layoutModalVisible} onClose={() => setLayoutModalVisible(false)}
        onConfirm={(layout, asgn) => { setSelectedLayout(layout); setSlotAssignment(asgn); setLayoutModalVisible(false); }}
        imageList={imageList} selectedImageIds={selectedImageIds} layouts={layouts} />
    </>
  );
};

export default LiveContentEditModal;

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", padding: 16 },
  modalBox: { backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, elevation: 20 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  headerIcon: { width: 34, height: 34, borderRadius: 9, backgroundColor: C.primaryGhost, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 15, fontFamily: "Poppins_700Bold", color: "#111" } as any,
  headerSub: { fontSize: 11, fontFamily: "Poppins_400Regular", color: C.textLight } as any,
  closeBtn: { width: 30, height: 30, borderRadius: 99, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center" },
  section: { backgroundColor: "#F9FAFB", borderRadius: 12, padding: 12 },
  sectionLabel: { fontSize: 10, fontFamily: "Poppins_600SemiBold", color: C.textLight, letterSpacing: 0.5, marginBottom: 8 } as any,
  editChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.primaryGhost, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  editChipText: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: C.primary } as any,
  editBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 9, borderWidth: 1.5, borderColor: C.primary, backgroundColor: C.primaryGhost },
  editBtnText: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: C.primary } as any,
  input: { backgroundColor: "#fff", borderRadius: 9, borderWidth: 1, borderColor: "#E5E7EB", paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, fontFamily: "Poppins_400Regular", color: "#111" } as any,
  footer: { flexDirection: "row", gap: 10, padding: 14, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  sendBtn: { flex: 2, paddingVertical: 12, borderRadius: 12, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
});