// components/layoutGrid.tsx
//
// ✦ Added "single_col" layout value: N images → N slots stacked vertically,
//   one image per slot (used for PDF-style sequential viewing)

import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
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
  const cellBg = isActive ? "rgba(255,255,255,0.15)" : C.surfaceAlt;
  const cellBorder = isActive ? "rgba(255,255,255,0.35)" : C.border;

  const gap = 2;

  const box = (key: string) => (
    <View
      key={key}
      style={{
        flex: 1,
        borderWidth: 0.5,
        borderColor: cellBorder,
        backgroundColor: cellBg,
        borderRadius: 2,
      }}
    />
  );

  const wrap = (children: React.ReactNode) => (
    <View
      style={{
        width: size,
        height: size,
        borderWidth: 1.5,
        borderColor,
        borderRadius: 5,
        overflow: "hidden",
      }}
    >
      {children}
    </View>
  );

  /* ───────────────────────────────
     SINGLE COLUMN (sequential/PDF)
  ─────────────────────────────── */
  if (config.type === "single_col") {
    const rows = config.slots ?? 4;
    return wrap(
      <View style={{ flex: 1, flexDirection: "column", gap }}>
        {Array.from({ length: rows }).map((_, r) => box(`sc-${r}`))}
      </View>
    );
  }

  /* ───────────────────────────────
     GRID (EQUAL CELLS)
  ─────────────────────────────── */
  if (config.type === "grid" && config.rows && config.cols) {
    return wrap(
      <View style={{ flex: 1, flexDirection: "column", gap }}>
        {Array.from({ length: config.rows }).map((_, r) => (
          <View key={r} style={{ flex: 1, flexDirection: "row", gap }}>
            {Array.from({ length: config.cols }).map((_, c) =>
              box(`${r}-${c}`)
            )}
          </View>
        ))}
      </View>
    );
  }

  /* ───────────────────────────────
     CUSTOM (ALWAYS EQUAL WEIGHTS)
  ─────────────────────────────── */
  if (config.type === "custom") {
    const v = config.value;

    // f2 → left + stacked right
    if (v === "f2") {
      return wrap(
        <View style={{ flex: 1, flexDirection: "row", gap }}>
          <View style={{ flex: 1 }}>{box("0")}</View>
          <View style={{ flex: 1, flexDirection: "column", gap }}>
            {box("1")}
            {box("2")}
          </View>
        </View>
      );
    }

    // 2f → stacked left + right
    if (v === "2f") {
      return wrap(
        <View style={{ flex: 1, flexDirection: "row", gap }}>
          <View style={{ flex: 1, flexDirection: "column", gap }}>
            {box("0")}
            {box("1")}
          </View>
          <View style={{ flex: 1 }}>{box("2")}</View>
        </View>
      );
    }

    // ft → top + bottom split
    if (v === "ft") {
      return wrap(
        <View style={{ flex: 1, flexDirection: "column", gap }}>
          <View style={{ flex: 1 }}>{box("0")}</View>
          <View style={{ flex: 1, flexDirection: "row", gap }}>
            {box("1")}
            {box("2")}
          </View>
        </View>
      );
    }

    // fb → bottom big (still equal visual slots)
    if (v === "fb") {
      return wrap(
        <View style={{ flex: 1, flexDirection: "column", gap }}>
          <View style={{ flex: 1, flexDirection: "row", gap }}>
            {box("0")}
            {box("1")}
          </View>
          <View style={{ flex: 1 }}>{box("2")}</View>
        </View>
      );
    }
  }

  return null;
};

// ─── SLOT COMPONENT — supports multiple imageIds ──────────────────────────────

interface SlotProps {
  slotIdx: number;
  imageIds: number[];
  imageList: ImageItem[];
  orientations?: Map<number, Orientation>;
  onPress?: (idx: number) => void;
  onRemove?: (idx: number, imageId: number) => void;
  onAdd?: (idx: number) => void;
  onReorder?: (slotIdx: number, newOrder: number[]) => void;
  isTarget?: boolean;
  compact?: boolean;
}

// In layoutGrid.tsx, update the Slot component:

const Slot = ({
  slotIdx,
  imageIds,
  imageList,
  orientations,
  onPress,
  onRemove,
  onAdd,
  onReorder,
  isTarget,
  compact,
}: SlotProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = imageIds
    .map((id) => imageList.find((i) => i.imageId === id))
    .filter(Boolean) as ImageItem[];

  const currentImage = images[currentImageIndex];
  const hasMultipleImages = images.length > 1;

  const handleNext = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  React.useEffect(() => {
    if (currentImageIndex >= images.length) {
      setCurrentImageIndex(Math.max(0, images.length - 1));
    }
  }, [images.length]);

  return (
    <TouchableOpacity
      style={[
        styles.slotContainer,
        compact && styles.compactSlot,
        isTarget && styles.targetSlot,
      ]}
      onPress={() => onPress?.(slotIdx)}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* ✦ ADDED: Slot order number */}
      <View style={styles.slotOrderBadge}>
        <Text style={styles.slotOrderText}>{slotIdx + 1}</Text>
      </View>

      {currentImage?.imageurl ? (
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: currentImage.imageurl }}
            style={styles.slotImage}
            resizeMode="contain"
          />

          {hasMultipleImages && (
            <>
              {currentImageIndex > 0 && (
                <TouchableOpacity
                  style={[styles.navArrow, styles.leftArrow]}
                  onPress={handlePrevious}
                >
                  <Ionicons name="chevron-back" size={18} color="#fff" />
                </TouchableOpacity>
              )}
              {currentImageIndex < images.length - 1 && (
                <TouchableOpacity
                  style={[styles.navArrow, styles.rightArrow]}
                  onPress={handleNext}
                >
                  <Ionicons name="chevron-forward" size={18} color="#fff" />
                </TouchableOpacity>
              )}
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {currentImageIndex + 1}/{images.length}
                </Text>
              </View>
            </>
          )}

          {onRemove && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemove(slotIdx, currentImage.imageId)}
            >
              <Ionicons name="close-circle" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.emptySlot}>
          <Ionicons
            name={isTarget ? "add-circle-outline" : "image-outline"}
            size={compact ? 16 : 32}
            color={isTarget ? C.primary : "rgba(148,163,184,0.4)"}
          />
          {!compact && (
            <Text style={styles.emptySlotText}>
              {isTarget ? "Tap to place" : "Empty slot"}
            </Text>
          )}
        </View>
      )}

      {onAdd && !compact && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => onAdd(slotIdx)}
        >
          <Ionicons name="add" size={16} color="#fff" />
        </TouchableOpacity>
      )}

      {hasMultipleImages && !compact && (
        <View style={styles.multipleIndicator}>
          <Ionicons name="images-outline" size={12} color="#fff" />
          <Text style={styles.multipleIndicatorText}>{images.length}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── LAYOUT GRID ─────────────────────────────────────────────────────────────

export interface LayoutGridProps {
  layoutValue: string;
  slots: number[][];
  imageList: ImageItem[];
  orientations?: Map<number, Orientation>;
  onSlotPress?: (idx: number) => void;
  onSlotRemove?: (idx: number, imageId: number) => void;
  onSlotAdd?: (idx: number) => void;
  onSlotReorder?: (slotIdx: number, newOrder: number[]) => void;
  activeTarget?: boolean;
  compact?: boolean;
  rows?: number;
  cols?: number;
}

export const LayoutGrid = ({
  layoutValue,
  slots,
  imageList,
  orientations,
  onSlotPress,
  onSlotRemove,
  onSlotAdd,
  onSlotReorder,
  activeTarget,
  compact,
  rows = 1,
  cols = 1,
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
      onReorder={onSlotReorder}
      isTarget={activeTarget}
      compact={compact}
    />
  );

  // ✦ SINGLE COLUMN — each slot is its own full-width row (sequential/PDF style)
  // Slot count is driven by however many slots[] entries exist
  if (layoutValue === "single_col") {
    return (
      <View style={{ flex: 1, flexDirection: "column" }}>
        {slots.map((_, idx) => (
          <View key={idx} style={{ flex: 1 }}>
            {S(idx)}
          </View>
        ))}
      </View>
    );
  }

  // 🔥 FEATURE LEFT
  if (layoutValue === "f2") {
    return (
      <View style={{ flex: 1, flexDirection: "row" }}>
        <View style={{ flex: 1 }}>{S(0)}</View>
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>{S(1)}</View>
          <View style={{ flex: 1 }}>{S(2)}</View>
        </View>
      </View>
    );
  }

  // 🔥 FEATURE RIGHT
  if (layoutValue === "2f") {
    return (
      <View style={{ flex: 1, flexDirection: "row" }}>
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>{S(0)}</View>
          <View style={{ flex: 1 }}>{S(1)}</View>
        </View>
        <View style={{ flex: 1 }}>{S(2)}</View>
      </View>
    );
  }

  // 🔥 FEATURE TOP
  if (layoutValue === "ft") {
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>{S(0)}</View>
        <View style={{ flex: 1, flexDirection: "row" }}>
          <View style={{ flex: 1 }}>{S(1)}</View>
          <View style={{ flex: 1 }}>{S(2)}</View>
        </View>
      </View>
    );
  }

  // 🔥 FEATURE BOTTOM
  if (layoutValue === "fb") {
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, flexDirection: "row" }}>
          <View style={{ flex: 1 }}>{S(0)}</View>
          <View style={{ flex: 1 }}>{S(1)}</View>
        </View>
        <View style={{ flex: 1 }}>{S(2)}</View>
      </View>
    );
  }

  // ✅ DEFAULT GRID
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <View key={r} style={{ flex: 1, flexDirection: "row" }}>
          {Array.from({ length: cols }).map((_, c) => S(r * cols + c))}
        </View>
      ))}
    </>
  );
};

// ─── STYLES ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  slotContainer: {
    flex: 1,
    margin: 2,
    backgroundColor: "#0A1628",
    borderRadius: 5,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
    minHeight: 40,
  },
  compactSlot: {
    margin: 1,
    borderRadius: 3,
    minHeight: 0,
  },
  targetSlot: {
    borderWidth: 2,
    borderColor: C.primary,
    borderStyle: "dashed",
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
    position: "relative",
    backgroundColor: "#0A1628",
  },
    slotOrderBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 6,
  },
  slotOrderText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
  },
  slotImage: {
    width: "100%",
    height: "100%",
  },
  emptySlot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  emptySlotText: {
    fontSize: 10,
    color: "rgba(148,163,184,0.5)",
    fontFamily: "Poppins_400Regular",
  },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 99,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  addButton: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: C.primary,
    borderRadius: 99,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  navArrow: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -16 }],
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 99,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  leftArrow: {
    left: 4,
  },
  rightArrow: {
    right: 4,
  },
  imageCounter: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 5,
  },
  imageCounterText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
  },
  multipleIndicator: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    zIndex: 5,
  },
  multipleIndicatorText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
  },
});