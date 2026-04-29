// BirthdayModal.tsx
// Drop-in modal for AdminLayoutStudio — handles birthday layout selection.
// onConfirm is async: the modal shows a spinner while buildCanvasItems() runs.

import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from "react-native";
import {
  X, Cake, Layers, LayoutGrid, ChevronRight, User,
} from "lucide-react-native";
import { useBirthday, BirthdayItem } from "@/hooks/useBirthday";

// ─── Theme (matches AdminLayoutStudio) ───────────────────────────────────────
const T = {
  bg:           "#F0F4FF",
  surface:      "#FFFFFF",
  surfaceRaised:"#F1F3F9",
  border:       "#E2E8F0",
  accent:       "#1E3A8A",
  accentGhost:  "#EBEDF5",
  success:      "#10B981",
  danger:       "#EF4444",
  text:         "#1E293B",
  textMid:      "#64748B",
  textDim:      "#94A3B8",
  white:        "#FFFFFF",
} as const;

export type BirthdayLayoutType = "single" | "multiple";

interface Props {
  visible: boolean;
  onClose: () => void;
  /**
   * Called once the user confirms a layout choice.
   * Declared async so the modal can show a spinner while
   * buildCanvasItems() makes its API calls.
   */
  onConfirm: (type: BirthdayLayoutType, birthdays: BirthdayItem[]) => Promise<void>;
}

// Pastel card colours cycling per employee
const CARD_PALETTE = [
  { bg: "#FFF7ED", border: "#FDBA74", dot: "#F97316" },
  { bg: "#F0FDF4", border: "#86EFAC", dot: "#22C55E" },
  { bg: "#EFF6FF", border: "#93C5FD", dot: "#3B82F6" },
  { bg: "#FDF4FF", border: "#E879F9", dot: "#A855F7" },
  { bg: "#FFF1F2", border: "#FDA4AF", dot: "#F43F5E" },
  { bg: "#FFFBEB", border: "#FCD34D", dot: "#F59E0B" },
];

// ─── STEP 1: Layout picker ────────────────────────────────────────────────────
const LayoutPicker: React.FC<{
  birthdays: BirthdayItem[];
  onPick: (t: BirthdayLayoutType) => void;
}> = ({ birthdays, onPick }) => (
  <View style={ps.pickerWrap}>
    <View style={ps.iconBadge}>
      <Cake size={22} color={T.accent} />
    </View>
    <Text style={ps.headline}>Birthday Layout</Text>
    <Text style={ps.sub}>
      {birthdays.length} birthday{birthdays.length !== 1 ? "s" : ""} today — choose how to display them
    </Text>

    {/* Option A – Single Loop */}
    <TouchableOpacity style={ps.card} onPress={() => onPick("single")} activeOpacity={0.8}>
      <View style={[ps.cardIcon, { backgroundColor: "#EFF6FF" }]}>
        <Layers size={20} color="#3B82F6" />
      </View>
      <View style={ps.cardBody}>
        <Text style={ps.cardTitle}>Single Loop Layout</Text>
        <Text style={ps.cardDesc}>
          All birthday notes rotate inside{" "}
          <Text style={{ fontWeight: "700" }}>one slot</Text> as a slideshow.
        </Text>
        <View style={ps.tagRow}>
          {birthdays.slice(0, 3).map((b, i) => (
            <View key={i} style={[ps.tag, { backgroundColor: CARD_PALETTE[i % CARD_PALETTE.length].bg }]}>
              <Text style={ps.tagText}>{b.employeeName}</Text>
            </View>
          ))}
          {birthdays.length > 3 && (
            <View style={ps.tag}><Text style={ps.tagText}>+{birthdays.length - 3} more</Text></View>
          )}
        </View>
      </View>
      <ChevronRight size={16} color={T.textDim} />
    </TouchableOpacity>

    {/* Option B – Multiple Separate */}
    <TouchableOpacity style={ps.card} onPress={() => onPick("multiple")} activeOpacity={0.8}>
      <View style={[ps.cardIcon, { backgroundColor: "#F0FDF4" }]}>
        <LayoutGrid size={20} color="#22C55E" />
      </View>
      <View style={ps.cardBody}>
        <Text style={ps.cardTitle}>Multiple Separate Layout</Text>
        <Text style={ps.cardDesc}>
          Each employee gets their{" "}
          <Text style={{ fontWeight: "700" }}>own slot</Text> on the canvas.
        </Text>
        <View style={ps.tagRow}>
          {birthdays.slice(0, 3).map((b, i) => (
            <View
              key={i}
              style={[ps.tag, {
                backgroundColor: CARD_PALETTE[i % CARD_PALETTE.length].bg,
                borderColor:     CARD_PALETTE[i % CARD_PALETTE.length].border,
              }]}
            >
              <View style={[ps.tagDot, { backgroundColor: CARD_PALETTE[i % CARD_PALETTE.length].dot }]} />
              <Text style={ps.tagText}>{b.employeeName}</Text>
            </View>
          ))}
          {birthdays.length > 3 && (
            <View style={ps.tag}><Text style={ps.tagText}>+{birthdays.length - 3} more</Text></View>
          )}
        </View>
      </View>
      <ChevronRight size={16} color={T.textDim} />
    </TouchableOpacity>
  </View>
);

// ─── STEP 2: Preview & Confirm ────────────────────────────────────────────────
const PreviewConfirm: React.FC<{
  type:        BirthdayLayoutType;
  birthdays:   BirthdayItem[];
  confirming:  boolean;
  onBack:      () => void;
  onConfirm:   () => void;
}> = ({ type, birthdays, confirming, onBack, onConfirm }) => (
  <View style={pv.wrap}>
    <TouchableOpacity style={pv.backBtn} onPress={onBack} disabled={confirming}>
      <Text style={pv.backText}>← Back</Text>
    </TouchableOpacity>

    <View style={pv.badgeRow}>
      {type === "single"
        ? <Layers size={16} color="#3B82F6" />
        : <LayoutGrid size={16} color="#22C55E" />}
      <Text style={pv.badgeLabel}>
        {type === "single" ? "Single Loop Layout" : "Multiple Separate Layout"}
      </Text>
    </View>

    <Text style={pv.previewTitle}>Preview Birthday Notes</Text>

    <ScrollView style={pv.scroll} showsVerticalScrollIndicator={false}>
      {type === "single" ? (
        <View style={pv.singleFrame}>
          <View style={pv.singleFrameHeader}>
            <Layers size={12} color={T.accent} />
            <Text style={pv.singleFrameHeaderText}>
              1 slot · {birthdays.length} rotating images
            </Text>
          </View>
          {birthdays.map((b, i) => <StickyCard key={i} birthday={b} index={i} />)}
        </View>
      ) : (
        birthdays.map((b, i) => (
          <View key={i} style={pv.multiFrame}>
            <Text style={pv.multiFrameLabel}>Slot {i + 1}</Text>
            <StickyCard birthday={b} index={i} />
          </View>
        ))
      )}
    </ScrollView>

    {/* Confirm button — shows spinner while API calls are running */}
    <TouchableOpacity
      style={[pv.confirmBtn, confirming && { opacity: 0.6 }]}
      onPress={onConfirm}
      activeOpacity={0.85}
      disabled={confirming}
    >
      {confirming ? (
        <>
          <ActivityIndicator size="small" color={T.white} />
          <Text style={pv.confirmText}>Generating sticky images…</Text>
        </>
      ) : (
        <>
          <Cake size={15} color={T.white} />
          <Text style={pv.confirmText}>
            Add to Canvas ({type === "single" ? "1 slot" : `${birthdays.length} slots`})
          </Text>
        </>
      )}
    </TouchableOpacity>
  </View>
);

// ─── Sticky note preview card (modal only — not the canvas image) ─────────────
const StickyCard: React.FC<{ birthday: BirthdayItem; index: number }> = ({ birthday, index }) => {
  const palette = CARD_PALETTE[index % CARD_PALETTE.length];
  return (
    <View style={[sc.card, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <View style={sc.topRow}>
        <View style={[sc.avatar, { backgroundColor: palette.border }]}>
          <User size={13} color={palette.dot} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={sc.name}>{birthday.employeeName}</Text>
        </View>
        <View style={[sc.cakeBadge, { backgroundColor: palette.dot }]}>
          <Cake size={10} color="#fff" />
        </View>
      </View>
      <View style={[sc.divider, { backgroundColor: palette.border }]} />
      <Text style={sc.message}>{birthday.message}</Text>
    </View>
  );
};

// ─── MAIN MODAL ───────────────────────────────────────────────────────────────
export const BirthdayModal: React.FC<Props> = ({ visible, onClose, onConfirm }) => {
  const { birthdays, loading, fetchBirthdays } = useBirthday();
  const [step, setStep]             = useState<"pick" | "preview">("pick");
  const [layoutType, setLayoutType] = useState<BirthdayLayoutType>("single");
  const [confirming, setConfirming] = useState(false);

  // Fetch when modal opens
  useEffect(() => {
    if (visible) {
      setStep("pick");
      setConfirming(false);
      fetchBirthdays();
    }
  }, [visible]);

  const handlePick = (type: BirthdayLayoutType) => {
    setLayoutType(type);
    setStep("preview");
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      // onConfirm is async — awaits buildCanvasItems() which calls the API
      await onConfirm(layoutType, birthdays);
      onClose();
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={ms.overlay} onPress={confirming ? undefined : onClose}>
        <Pressable style={ms.sheet} onPress={e => e.stopPropagation()}>

          {/* Header */}
          <View style={ms.header}>
            <View style={ms.headerLeft}>
              <Cake size={17} color={T.accent} />
              <Text style={ms.headerTitle}>Add Birthday</Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={confirming}
              hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}>
              <X size={18} color={T.textMid} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          {loading ? (
            <View style={ms.loadingBox}>
              <ActivityIndicator size="large" color={T.accent} />
              <Text style={ms.loadingText}>Fetching today's birthdays…</Text>
            </View>
          ) : birthdays.length === 0 ? (
            <View style={ms.emptyBox}>
              <Cake size={32} color={T.textDim} />
              <Text style={ms.emptyTitle}>No Birthdays Today</Text>
              <Text style={ms.emptySub}>There are no employee birthdays scheduled for today.</Text>
            </View>
          ) : step === "pick" ? (
            <LayoutPicker birthdays={birthdays} onPick={handlePick} />
          ) : (
            <PreviewConfirm
              type={layoutType}
              birthdays={birthdays}
              confirming={confirming}
              onBack={() => setStep("pick")}
              onConfirm={handleConfirm}
            />
          )}

        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const ms = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center", alignItems: "center",
  },
  sheet: {
    width: "92%", maxWidth: 460, backgroundColor: T.surface,
    borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: T.border, maxHeight: "88%",
  },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: T.border,
    backgroundColor: T.accentGhost,
  },
  headerLeft:  { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 15, fontWeight: "700", color: T.accent },
  loadingBox:  { alignItems: "center", justifyContent: "center", paddingVertical: 52, gap: 14 },
  loadingText: { fontSize: 13, color: T.textMid },
  emptyBox:    { alignItems: "center", paddingVertical: 44, gap: 10, paddingHorizontal: 24 },
  emptyTitle:  { fontSize: 16, fontWeight: "700", color: T.text },
  emptySub:    { fontSize: 12, color: T.textMid, textAlign: "center", lineHeight: 18 },
});

const ps = StyleSheet.create({
  pickerWrap: { padding: 18 },
  iconBadge: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: T.accentGhost, alignItems: "center", justifyContent: "center",
    alignSelf: "center", marginBottom: 10,
  },
  headline: { fontSize: 17, fontWeight: "800", color: T.text, textAlign: "center" },
  sub: { fontSize: 12, color: T.textMid, textAlign: "center", marginTop: 4, marginBottom: 18 },
  card: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    borderWidth: 1.5, borderColor: T.border, borderRadius: 12,
    padding: 14, marginBottom: 12, backgroundColor: T.surface,
  },
  cardIcon: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  cardBody:  { flex: 1 },
  cardTitle: { fontSize: 13, fontWeight: "700", color: T.text, marginBottom: 3 },
  cardDesc:  { fontSize: 11, color: T.textMid, lineHeight: 16, marginBottom: 8 },
  tagRow:    { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  tag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1, borderColor: T.border,
    backgroundColor: T.surfaceRaised,
  },
  tagDot:  { width: 5, height: 5, borderRadius: 3 },
  tagText: { fontSize: 9, fontWeight: "600", color: T.textMid },
});

const pv = StyleSheet.create({
  wrap:       { padding: 18, flex: 1 },
  backBtn:    { marginBottom: 10 },
  backText:   { fontSize: 12, color: T.accent, fontWeight: "600" },
  badgeRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: T.accentGhost, alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 10,
  },
  badgeLabel:    { fontSize: 11, fontWeight: "700", color: T.accent },
  previewTitle:  { fontSize: 14, fontWeight: "700", color: T.text, marginBottom: 10 },
  scroll:        { flex: 1, marginBottom: 14 },
  singleFrame: {
    borderWidth: 1.5, borderColor: T.accent + "60", borderRadius: 10,
    padding: 10, backgroundColor: T.accentGhost,
  },
  singleFrameHeader: {
    flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8,
  },
  singleFrameHeaderText: { fontSize: 10, color: T.accent, fontWeight: "700" },
  multiFrame:      { marginBottom: 10 },
  multiFrameLabel: {
    fontSize: 10, fontWeight: "700", color: T.textDim,
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4,
  },
  confirmBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: T.accent, borderRadius: 10, paddingVertical: 13,
  },
  confirmText: { color: T.white, fontWeight: "700", fontSize: 14 },
});

const sc = StyleSheet.create({
  card:    { borderWidth: 1.5, borderRadius: 10, padding: 12, marginBottom: 8 },
  topRow:  { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  avatar:  { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  name:    { fontSize: 12, fontWeight: "700", color: T.text },
  cakeBadge: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  divider: { height: 1, marginBottom: 8 },
  message: { fontSize: 11, color: T.textMid, lineHeight: 16, fontStyle: "italic" },
});