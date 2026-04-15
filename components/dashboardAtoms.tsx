// components/dashboardAtoms.tsx
import React from "react";
import { View, Text, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C, styles, sc } from "@/app/dashboard.styles";
import { LayoutGrid, ImageItem } from "@/components/layoutGrid";

// ─── STAT CARD ────────────────────────────────────────────────────────────────

export const StatCard = ({
  icon, num, label, iconBg, iconColor, bg, textColor, labelColor,
}: any) => (
  <View style={[sc.card, { backgroundColor: bg || C.surface }]}>
    <View style={[sc.iconBox, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <Text style={[sc.num, { color: textColor || C.text }]}>{num}</Text>
    <Text style={[sc.label, { color: labelColor || C.textLight }]}>{label}</Text>
  </View>
);

// ─── SUMMARY ROW ──────────────────────────────────────────────────────────────

export const SummaryRow = ({
  icon, label, value,
}: { icon: any; label: string; value: string }) => (
  <View style={styles.summaryRow}>
    <Ionicons name={icon} size={13} color={C.textLight} />
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue} numberOfLines={1}>{value || "—"}</Text>
  </View>
);

// ─── MODAL ROW ────────────────────────────────────────────────────────────────

export const ModalRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.modalRow}>
    <Text style={styles.modalRowLabel}>{label}</Text>
    <Text style={styles.modalRowValue}>{value}</Text>
  </View>
);

// ─── STEP BADGE ──────────────────────────────────────────────────────────────

export const StepBadge = ({ num, label, done }: { num: number; label: string; done: boolean }) => (
  <View style={styles.stepBadge}>
    <View style={[styles.stepNum, done && styles.stepNumDone]}>
      {done
        ? <Ionicons name="checkmark" size={13} color="#fff" />
        : <Text style={styles.stepNumText}>{num}</Text>}
    </View>
    <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{label}</Text>
  </View>
);

// ─── TV NOTICE BOARD PREVIEW ──────────────────────────────────────────────────

interface TVProps {
  slotAssignment: (number | null)[] | any;
  imageList: ImageItem[];
  selectedLayout: string;
  title: string;
}

export const TVNoticeBoard = ({ slotAssignment, imageList, selectedLayout, title }: TVProps) => {
  const TV_W = 300;
  const TV_H = Math.round((TV_W * 9) / 16);
  const parts = selectedLayout.split("x").map(Number);
  const rows = parts[0] || 1;
  const cols = parts[1] || 1;
  const placedCount = slotAssignment.filter(Boolean).length;

  return (
    <View style={{ alignItems: "center" }}>

      {/* TV Frame */}
      <View style={{
        backgroundColor: "#111827",
        borderRadius: 16,
        padding: 10,
        borderWidth: 3,
        borderColor: "#1F2937",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
        width: TV_W + 28,
      }}>

        {/* Bezel */}
        <View style={{
          backgroundColor: "#0D1117",
          borderRadius: 10,
          padding: 3,
          borderWidth: 1,
          borderColor: "#374151",
        }}>

          {/* Screen */}
          <View style={{
            width: TV_W,
            height: TV_H,
            backgroundColor: "#060D1A",
            borderRadius: 8,
            overflow: "hidden",
          }}>

            {/* Content area */}
            <View style={{ flex: 1, padding: 6 }}>
              {/* Title bar */}
              {title ? (
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  marginBottom: 5,
                  paddingBottom: 4,
                  borderBottomWidth: 1,
                  borderBottomColor: "rgba(255,255,255,0.08)",
                }}>
                  <View style={{ width: 3, height: 10, borderRadius: 2, backgroundColor: C.accent }} />
                  <Text
                    style={{ fontSize: 7.5, fontFamily: "Poppins_600SemiBold", color: "rgba(255,255,255,0.85)", flex: 1 }}
                    numberOfLines={1}
                  >
                    {title}
                  </Text>
                  {/* Live dot */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.live }} />
                    <Text style={{ fontSize: 5.5, fontFamily: "Poppins_700Bold", color: C.live }}>LIVE</Text>
                  </View>
                </View>
              ) : (
                // No title — LIVE badge top-right
                <View style={{ position: "absolute", top: 6, right: 6, zIndex: 10, flexDirection: "row", alignItems: "center", gap: 2, backgroundColor: "rgba(220,38,38,0.18)", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 99 }}>
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.live }} />
                  <Text style={{ fontSize: 5.5, fontFamily: "Poppins_700Bold", color: C.live }}>LIVE</Text>
                </View>
              )}

              {/* Layout grid */}
              <View style={{ flex: 1 }}>
                <LayoutGrid
                  layoutValue={selectedLayout}
                  slots={slotAssignment}
                  imageList={imageList}
                  compact
                  rows={rows}
                  cols={cols}
                />
              </View>
            </View>

            {/* Screen reflection */}
            <View style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              height: TV_H * 0.3,
              backgroundColor: "rgba(255,255,255,0.02)",
              borderBottomLeftRadius: 40,
              borderBottomRightRadius: 40,
            }} />
          </View>
        </View>

        {/* TV chin / brand bar */}
        <View style={{ alignItems: "center", paddingTop: 6, gap: 1 }}>
          <View style={{ width: 24, height: 3, borderRadius: 2, backgroundColor: "#1F2937" }} />
          <View style={{ width: 8, height: 5, backgroundColor: "#1F2937", borderRadius: 2 }} />
          <View style={{ width: 40, height: 2, backgroundColor: "#111827", borderRadius: 2 }} />
        </View>
      </View>

      {/* Info pills below TV */}
      <View style={{ flexDirection: "row", gap: 6, marginTop: 12, flexWrap: "wrap", justifyContent: "center" }}>
        {selectedLayout ? (
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 4,
            backgroundColor: C.brownLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99,
          }}>
            <Ionicons name="grid-outline" size={10} color={C.brownMid} />
            <Text style={{ fontSize: 10, fontFamily: "Poppins_600SemiBold", color: C.brownMid }}>{selectedLayout}</Text>
          </View>
        ) : null}
        <View style={{
          flexDirection: "row", alignItems: "center", gap: 4,
          backgroundColor: C.successBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99,
        }}>
          <Ionicons name="images-outline" size={10} color={C.success} />
          <Text style={{ fontSize: 10, fontFamily: "Poppins_600SemiBold", color: C.success }}>
            {placedCount} image{placedCount !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>
    </View>
  );
};