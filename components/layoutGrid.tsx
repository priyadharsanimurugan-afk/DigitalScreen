//componenets/layoutGrid.tsx


import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "@/app/dashboard.styles";
import { Orientation } from "@/hooks/useImageOreantation";

export interface ImageItem {
  imageId: number;
  imageName: string;
  imageurl?: string;
}

// ─── LAYOUT MINI PREVIEW ─────────────────────────────────────────────────────

import { LayoutConfig } from "../constants/layout";

export const LayoutMiniPreview = ({
  config,
  isActive,
  size = 44,
}: {
  config: LayoutConfig;
  isActive: boolean;
  size?: number;
}) => {
  const borderColor = isActive ? "rgba(255,255,255,0.8)" : C.border;
  const cellBg      = isActive ? "rgba(255,255,255,0.15)" : C.surfaceAlt;
  const cellBorder  = isActive ? "rgba(255,255,255,0.35)" : C.border;

  const cell = (key: number | string, flex = 1) => (
    <View key={key} style={{ flex, borderWidth: 0.5, borderColor: cellBorder, backgroundColor: cellBg }} />
  );

  const renderCustom = () => {
    switch (config.value) {
      case "f2":  return (<View style={{ flex: 1, flexDirection: "row" }}>{cell("a", 2)}<View style={{ flex: 1 }}>{cell("b")}{cell("c")}</View></View>);
      case "2f":  return (<View style={{ flex: 1, flexDirection: "row" }}><View style={{ flex: 1 }}>{cell("a")}{cell("b")}</View>{cell("c", 2)}</View>);
      case "ft":  return (<View style={{ flex: 1 }}>{cell("a", 2)}<View style={{ flex: 1, flexDirection: "row" }}>{cell("b")}{cell("c")}</View></View>);
      case "fb":  return (<View style={{ flex: 1 }}><View style={{ flex: 1, flexDirection: "row" }}>{cell("a")}{cell("b")}</View>{cell("c", 2)}</View>);
      case "t2b1":return (<View style={{ flex: 1 }}><View style={{ flex: 1, flexDirection: "row" }}>{cell("a")}{cell("b")}</View>{cell("c", 1)}</View>);
      case "t1b2":return (<View style={{ flex: 1 }}>{cell("a", 1)}<View style={{ flex: 1, flexDirection: "row" }}>{cell("b")}{cell("c")}</View></View>);
      default: return null;
    }
  };

  const isCustom = ["f2","2f","ft","fb","t2b1","t1b2"].includes(config.value);

  return (
    <View style={{ width: size, height: size, borderWidth: 1.5, borderColor, borderRadius: 5, overflow: "hidden", flexDirection: "column" }}>
      {isCustom ? renderCustom() : (
        Array.from({ length: config.rows }).map((_, r) => (
          <View key={r} style={{ flex: 1, flexDirection: "row" }}>
            {Array.from({ length: config.cols }).map((_, c) => cell(`${r}-${c}`))}
          </View>
        ))
      )}
    </View>
  );
};

// ─── SLOT COMPONENT ──────────────────────────────────────────────────────────

interface SlotProps {
  slotIdx: number;
  imageId: number | null;
  imageList: ImageItem[];
  orientations?: Map<number, Orientation>;
  onPress?: (idx: number) => void;
  onRemove?: (idx: number) => void;
  isTarget?: boolean;
  compact?: boolean;
  // When true the image fills the slot (cover); when false it fits (contain)
  cover?: boolean;
}

const Slot = ({
  slotIdx, imageId, imageList, orientations,
  onPress, onRemove, isTarget, compact, cover = false,
}: SlotProps) => {
  const img = imageId !== null ? imageList.find((i) => i.imageId === imageId) : null;

  // Decide resizeMode based on orientation vs slot shape
  const orientation = imageId !== null ? orientations?.get(imageId) : undefined;
  const resizeMode = orientation === "portrait" ? "contain" : "cover";

  return (
    <TouchableOpacity
      style={{
        flex: 1,
        margin: compact ? 1 : 2,
        backgroundColor: "#0A1628",
        borderRadius: compact ? 3 : 5,
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: isTarget ? 1.5 : 0.5,
        borderColor: isTarget ? C.primary : "rgba(255,255,255,0.1)",
        borderStyle: isTarget ? "dashed" : "solid",
        minHeight: compact ? 0 : 40,
      }}
      onPress={() => onPress?.(slotIdx)}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {img?.imageurl ? (
        <Image
          source={{ uri: img.imageurl }}
          style={{ width: "100%", height: "100%" }}
          resizeMode={resizeMode}
        />
      ) : (
        <View style={{ alignItems: "center", gap: 2 }}>
          <Ionicons
            name={isTarget ? "add-circle-outline" : "image-outline"}
            size={compact ? 10 : 18}
            color={isTarget ? C.primary : "rgba(148,163,184,0.4)"}
          />
          {!compact && (
            <Text style={{ fontSize: 9, color: "rgba(148,163,184,0.5)", fontFamily: "Poppins_400Regular" }}>
              {isTarget ? "Tap to place" : `Slot ${slotIdx + 1}`}
            </Text>
          )}
        </View>
      )}
      {img && onRemove && (
        <TouchableOpacity
          style={{ position: "absolute", top: 3, right: 3, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 99 }}
          onPress={() => onRemove(slotIdx)}
        >
          <Ionicons name="close-circle" size={15} color="#fff" />
        </TouchableOpacity>
      )}
      {!compact && (
        <View style={{ position: "absolute", bottom: 3, left: 3, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 }}>
          <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.7)", fontFamily: "Poppins_500Medium" }}>{slotIdx + 1}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── ORIENTATION-AWARE SLOT BUILDER ──────────────────────────────────────────
//
// Key rule (no hardcoding):
//   A "column with 2 rows" slot appears in: f2 (slots 1+2), 2f (slots 0+1),
//   t2b1 (slots 0+1 in top row), t1b2 (slots 1+2 in bottom row), and any
//   regular grid column.
//
//   If BOTH images assigned to the two rows of a column are PORTRAIT
//     → keep 2 separate portrait slots (they fill the column naturally)
//   If either image is LANDSCAPE (or unknown)
//     → the landscape image gets flex:2 (spans both rows) and the other slot
//       is hidden / skipped — the caller adjusts slot assignment accordingly.
//
//   This is purely a rendering decision. The slot index array from the parent
//   is always the source of truth for WHICH image goes WHERE.

// ─── LAYOUT GRID ─────────────────────────────────────────────────────────────

export interface LayoutGridProps {
  layoutValue: string;
  slots: (number | null)[];
  imageList: ImageItem[];
  orientations?: Map<number, Orientation>;
  onSlotPress?: (idx: number) => void;
  onSlotRemove?: (idx: number) => void;
  activeTarget?: boolean;
  compact?: boolean;
  rows?: number;
  cols?: number;
}

export const LayoutGrid = ({
  layoutValue, slots, imageList, orientations,
  onSlotPress, onSlotRemove, activeTarget, compact,
  rows = 1, cols = 1,
}: LayoutGridProps) => {

  // Helper — builds a Slot element
  const S = (idx: number) => (
    <Slot
      key={idx}
      slotIdx={idx}
      imageId={slots[idx] ?? null}
      imageList={imageList}
      orientations={orientations}
      onPress={onSlotPress}
      onRemove={onSlotRemove}
      isTarget={activeTarget}
      compact={compact}
    />
  );

  // ── Orientation helpers ──────────────────────────────────────────────────
  const getOrientation = (slotIdx: number): Orientation | undefined => {
    const id = slots[slotIdx];
    if (id == null) return undefined;
    return orientations?.get(id);
  };

  // For a two-row column (slotA = top, slotB = bottom):
  // Returns whether we should collapse them into one spanning slot.
  // Rule: if slotA has a landscape image → it spans (hide slotB)
  //       if slotB has a landscape image → it spans (hide slotA)
  //       if both portrait → show both separately
  //       if either is empty → show both (let user fill freely)
  const shouldSpan = (slotA: number, slotB: number): "A" | "B" | "both" => {
    const oA = getOrientation(slotA);
    const oB = getOrientation(slotB);
    // Both filled
    if (slots[slotA] !== null && slots[slotB] !== null) {
      if (oA === "landscape") return "A";
      if (oB === "landscape") return "B";
      return "both"; // both portrait → show two rows
    }
    // Only A filled
    if (slots[slotA] !== null && slots[slotB] === null) {
      if (oA === "landscape") return "A";
      return "both";
    }
    // Only B filled
    if (slots[slotA] === null && slots[slotB] !== null) {
      if (oB === "landscape") return "B";
      return "both";
    }
    return "both"; // both empty
  };

  // ── Render a two-row column orientation-aware ─────────────────────────────
  const TwoRowCol = ({ idxA, idxB }: { idxA: number; idxB: number }) => {
    const span = shouldSpan(idxA, idxB);
    if (span === "A") {
      // Landscape image A spans full column height
      return (
        <View style={{ flex: 1 }}>
          {S(idxA)}
          {/* show empty slot B below so user can still place an image */}
          {slots[idxB] === null && (
            <Slot
              slotIdx={idxB}
              imageId={null}
              imageList={imageList}
              orientations={orientations}
              onPress={onSlotPress}
              onRemove={onSlotRemove}
              isTarget={activeTarget}
              compact={compact}
            />
          )}
        </View>
      );
    }
    if (span === "B") {
      return (
        <View style={{ flex: 1 }}>
          {slots[idxA] === null && (
            <Slot
              slotIdx={idxA}
              imageId={null}
              imageList={imageList}
              orientations={orientations}
              onPress={onSlotPress}
              onRemove={onSlotRemove}
              isTarget={activeTarget}
              compact={compact}
            />
          )}
          {S(idxB)}
        </View>
      );
    }
    // "both" — two portrait images (or empty slots), each takes half
    return (
      <View style={{ flex: 1 }}>
        {S(idxA)}
        {S(idxB)}
      </View>
    );
  };

  // ── Layout switch ─────────────────────────────────────────────────────────
  switch (layoutValue) {
    // Feature Left: slot 0 = big feature (left), slots 1+2 = right column (2 rows)
    case "f2":
      return (
        <View style={{ flex: 1, flexDirection: "row" }}>
          {S(0)}
          <TwoRowCol idxA={1} idxB={2} />
        </View>
      );

    // Feature Right: slots 0+1 = left column (2 rows), slot 2 = big feature (right)
    case "2f":
      return (
        <View style={{ flex: 1, flexDirection: "row" }}>
          <TwoRowCol idxA={0} idxB={1} />
          {S(2)}
        </View>
      );

    // Feature Top: slot 0 = big feature (top row), slots 1+2 = bottom row (2 cols)
    case "ft":
      return (
        <View style={{ flex: 1 }}>
          {S(0)}
          <View style={{ flex: 1, flexDirection: "row" }}>
            {S(1)}
            {S(2)}
          </View>
        </View>
      );

    // Feature Bottom: slots 0+1 = top row (2 cols), slot 2 = big feature (bottom)
    case "fb":
      return (
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, flexDirection: "row" }}>
            {S(0)}
            {S(1)}
          </View>
          {S(2)}
        </View>
      );

    // Top 2 Bottom 1
    case "t2b1":
      return (
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, flexDirection: "row" }}>
            {S(0)}
            {S(1)}
          </View>
          {S(2)}
        </View>
      );

    // Top 1 Bottom 2
    case "t1b2":
      return (
        <View style={{ flex: 1 }}>
          {S(0)}
          <View style={{ flex: 1, flexDirection: "row" }}>
            {S(1)}
            {S(2)}
          </View>
        </View>
      );

    // Default: regular grid (rows × cols) — orientation-aware per column
    default:
      return (
        <>
          {Array.from({ length: rows }).map((_, r) => (
            <View key={r} style={{ flex: 1, flexDirection: "row" }}>
              {Array.from({ length: cols }).map((_, c) => S(r * cols + c))}
            </View>
          ))}
        </>
      );
  }
};