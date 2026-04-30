// BirthdayModal.tsx
// Drop-in modal for AdminLayoutStudio — handles birthday layout selection.
// onConfirm is async: the modal shows a spinner while buildCanvasItems() runs.

import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from "react-native";
import { X, Cake, Layers, LayoutGrid } from "lucide-react-native";
import { useBirthday, BirthdayItem } from "@/hooks/useBirthday";

// ─── Theme (matches AdminLayoutStudio) ───────────────────────────────────────
const T = {
  bg: "#F0F4FF",
  surface: "#FFFFFF",
  surfaceRaised: "#F1F3F9",
  border: "#E2E8F0",
  accent: "#1E3A8A",
  accentGhost: "#EBEDF5",
  success: "#10B981",
  text: "#1E293B",
  textMid: "#64748B",
  textDim: "#94A3B8",
  white: "#FFFFFF",
} as const;

export type BirthdayLayoutType = "single" | "multiple";

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (type: BirthdayLayoutType, birthdays: BirthdayItem[]) => Promise<void>;
}

export const BirthdayModal: React.FC<Props> = ({ visible, onClose, onConfirm }) => {
  const { birthdays, loading, fetchBirthdays } = useBirthday();
  const [layoutType, setLayoutType] = useState<BirthdayLayoutType>("single");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (visible) {
      setConfirming(false);
      fetchBirthdays();
    }
  }, [visible]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm(layoutType, birthdays);
      onClose();
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={confirming ? undefined : onClose}>
        <Pressable style={s.sheet} onPress={e => e.stopPropagation()}>

          {/* Header */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <Cake size={18} color={T.accent} />
              <Text style={s.headerTitle}>Add Birthday</Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={confirming}
              hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}>
              <X size={18} color={T.textMid} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          {loading ? (
            <View style={s.centerBox}>
              <ActivityIndicator size="large" color={T.accent} />
              <Text style={s.centerText}>Fetching today's birthdays…</Text>
            </View>
          ) : birthdays.length === 0 ? (
            <View style={s.centerBox}>
              <Cake size={32} color={T.textDim} />
              <Text style={s.emptyTitle}>No Birthdays Today</Text>
              <Text style={s.emptySub}>There are no employee birthdays scheduled for today.</Text>
            </View>
          ) : (
            <View style={s.body}>
              <View style={s.iconBadge}>
                <Cake size={22} color={T.accent} />
              </View>
              <Text style={s.headline}>Birthday Layout</Text>
              <Text style={s.sub}>
                {birthdays.length} birthday{birthdays.length !== 1 ? "s" : ""} today — choose layout
              </Text>

              {/* Single Loop */}
              <TouchableOpacity
                style={[s.card, layoutType === "single" && s.cardActive]}
                onPress={() => setLayoutType("single")}
                activeOpacity={0.8}
              >
                <View style={[s.cardIcon, { backgroundColor: "#EFF6FF" }]}>
                  <Layers size={20} color="#3B82F6" />
                </View>
                <View style={s.cardBody}>
                  <Text style={s.cardTitle}>Single Loop</Text>
                  <Text style={s.cardDesc}>
                    All notes rotate in <Text style={{ fontWeight: "700" }}>one slot</Text>
                  </Text>
                </View>
                {layoutType === "single" && <View style={s.check}><Text style={s.checkText}>✓</Text></View>}
              </TouchableOpacity>

              {/* Multiple Separate */}
              <TouchableOpacity
                style={[s.card, layoutType === "multiple" && s.cardActive]}
                onPress={() => setLayoutType("multiple")}
                activeOpacity={0.8}
              >
                <View style={[s.cardIcon, { backgroundColor: "#F0FDF4" }]}>
                  <LayoutGrid size={20} color="#22C55E" />
                </View>
                <View style={s.cardBody}>
                  <Text style={s.cardTitle}>Multiple Separate</Text>
                  <Text style={s.cardDesc}>
                    Each person gets <Text style={{ fontWeight: "700" }}>their own slot</Text>
                  </Text>
                </View>
                {layoutType === "multiple" && <View style={s.check}><Text style={s.checkText}>✓</Text></View>}
              </TouchableOpacity>

              {/* Confirm button */}
              <TouchableOpacity
                style={[s.confirmBtn, confirming && { opacity: 0.6 }]}
                onPress={handleConfirm}
                activeOpacity={0.85}
                disabled={confirming}
              >
                {confirming ? (
                  <>
                    <ActivityIndicator size="small" color={T.white} />
                    <Text style={s.confirmText}>Generating sticky images…</Text>
                  </>
                ) : (
                  <>
                    <Cake size={15} color={T.white} />
                    <Text style={s.confirmText}>
                      Add to Canvas ({layoutType === "single" ? "1 slot" : `${birthdays.length} slots`})
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center", alignItems: "center",
  },
  sheet: {
    width: "92%", maxWidth: 420, backgroundColor: T.surface,
    borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: T.border,
  },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: T.border,
    backgroundColor: T.accentGhost,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 15, fontWeight: "700", color: T.accent },

  centerBox: {
    alignItems: "center", justifyContent: "center",
    paddingVertical: 52, gap: 14, paddingHorizontal: 24,
  },
  centerText: { fontSize: 13, color: T.textMid },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: T.text },
  emptySub: { fontSize: 12, color: T.textMid, textAlign: "center", lineHeight: 18 },

  body: { padding: 20 },
  iconBadge: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: T.accentGhost, alignItems: "center", justifyContent: "center",
    alignSelf: "center", marginBottom: 10,
  },
  headline: { fontSize: 17, fontWeight: "800", color: T.text, textAlign: "center" },
  sub: { fontSize: 12, color: T.textMid, textAlign: "center", marginTop: 4, marginBottom: 20 },

  card: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 2, borderColor: T.border, borderRadius: 12,
    padding: 14, marginBottom: 10, backgroundColor: T.surface,
  },
  cardActive: {
    borderColor: T.accent,
    backgroundColor: T.accentGhost,
  },
  cardIcon: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: T.text, marginBottom: 2 },
  cardDesc: { fontSize: 11, color: T.textMid, lineHeight: 16 },
  check: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: T.accent, alignItems: "center", justifyContent: "center",
  },
  checkText: { color: T.white, fontSize: 13, fontWeight: "700" },

  confirmBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: T.accent, borderRadius: 10, paddingVertical: 13,
    marginTop: 6,
  },
  confirmText: { color: T.white, fontWeight: "700", fontSize: 14 },
});