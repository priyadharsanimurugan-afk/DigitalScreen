// components/layoutGrid.tsx

import React from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "@/app/dashboard.styles";
import { Orientation } from "@/hooks/useImageOreantation";
import { LayoutConfig } from "../constants/layout";

export interface ImageItem {
  imageId: number;
  imageName: string;
  imageurl?: string;
}

// ─── LAYOUT MINI PREVIEW ─────────────────────────────────────────────────────

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

// ─── SLOT COMPONENT — supports multiple imageIds ──────────────────────────────

interface SlotProps {
  slotIdx: number;
  imageIds: number[];           // ← array now, not single id
  imageList: ImageItem[];
  orientations?: Map<number, Orientation>;
  onPress?: (idx: number) => void;        // place dragging image
  onRemove?: (idx: number, imageId: number) => void;  // remove specific image
  onAdd?: (idx: number) => void;          // open picker for this slot
  isTarget?: boolean;
  compact?: boolean;
}

const Slot = ({
  slotIdx, imageIds, imageList, orientations,
  onPress, onRemove, onAdd, isTarget, compact,
}: SlotProps) => {
  const images = imageIds
    .map((id) => imageList.find((i) => i.imageId === id))
    .filter(Boolean) as ImageItem[];

  const primaryImg = images[0];
  const extraCount = images.length - 1;

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
      {primaryImg?.imageurl ? (
        <Image
          source={{ uri: primaryImg.imageurl }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
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

      {/* Extra image count badge (e.g. +2) */}
      {extraCount > 0 && !compact && (
        <View style={{
          position: "absolute", bottom: 18, right: 3,
          backgroundColor: "rgba(0,0,0,0.75)", borderRadius: 99,
          paddingHorizontal: 5, paddingVertical: 2,
        }}>
          <Text style={{ fontSize: 8, color: "#fff", fontFamily: "Poppins_600SemiBold" }}>
            +{extraCount}
          </Text>
        </View>
      )}

      {/* Remove primary image button */}
      {primaryImg && onRemove && (
        <TouchableOpacity
          style={{ position: "absolute", top: 3, right: 3, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 99 }}
          onPress={() => onRemove(slotIdx, primaryImg.imageId)}
        >
          <Ionicons name="close-circle" size={15} color="#fff" />
        </TouchableOpacity>
      )}

      {/* ADD button — always visible on slot, bottom left */}
      {onAdd && !compact && (
        <TouchableOpacity
          style={{
            position: "absolute",
            bottom: 3,
            right: 3,
            backgroundColor: C.primary,
            borderRadius: 99,
            width: 18,
            height: 18,
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => onAdd(slotIdx)}
        >
          <Ionicons name="add" size={13} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Slot number */}
      {!compact && (
        <View style={{ position: "absolute", bottom: 3, left: 3, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 }}>
          <Text style={{ fontSize: 8, color: "rgba(255,255,255,0.7)", fontFamily: "Poppins_500Medium" }}>{slotIdx + 1}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── LAYOUT GRID ─────────────────────────────────────────────────────────────

export interface LayoutGridProps {
  layoutValue: string;
  // slots is now an array of imageId arrays — one per slot
  slots: number[][];
  imageList: ImageItem[];
  orientations?: Map<number, Orientation>;
  onSlotPress?: (idx: number) => void;
  onSlotRemove?: (idx: number, imageId: number) => void;
  onSlotAdd?: (idx: number) => void;
  activeTarget?: boolean;
  compact?: boolean;
  rows?: number;
  cols?: number;
}

export const LayoutGrid = ({
  layoutValue, slots, imageList, orientations,
  onSlotPress, onSlotRemove, onSlotAdd, activeTarget, compact,
  rows = 1, cols = 1,
}: LayoutGridProps) => {

  const S = (idx: number) => (
    <Slot
      key={idx}
      slotIdx={idx}
      imageIds={slots[idx] ?? []}
      imageList={imageList}
      orientations={orientations}
      onPress={onSlotPress}
      onRemove={onSlotRemove}
      onAdd={onSlotAdd}
      isTarget={activeTarget}
      compact={compact}
    />
  );

  switch (layoutValue) {
    case "f2":
      return (
        <View style={{ flex: 1, flexDirection: "row" }}>
          {S(0)}
          <View style={{ flex: 1 }}>{S(1)}{S(2)}</View>
        </View>
      );
    case "2f":
      return (
        <View style={{ flex: 1, flexDirection: "row" }}>
          <View style={{ flex: 1 }}>{S(0)}{S(1)}</View>
          {S(2)}
        </View>
      );
    case "ft":
      return (
        <View style={{ flex: 1 }}>
          {S(0)}
          <View style={{ flex: 1, flexDirection: "row" }}>{S(1)}{S(2)}</View>
        </View>
      );
    case "fb":
      return (
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, flexDirection: "row" }}>{S(0)}{S(1)}</View>
          {S(2)}
        </View>
      );
    case "t2b1":
      return (
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1, flexDirection: "row" }}>{S(0)}{S(1)}</View>
          {S(2)}
        </View>
      );
    case "t1b2":
      return (
        <View style={{ flex: 1 }}>
          {S(0)}
          <View style={{ flex: 1, flexDirection: "row" }}>{S(1)}{S(2)}</View>
        </View>
      );
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