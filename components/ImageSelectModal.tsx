import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "@/app/dashboard.styles";

const { width } = Dimensions.get("window");

interface Props {
  options: { imageId: number; imageName: string; imageurl?: string }[];
  selected: number[];
  onToggle: (id: number) => void;
  maxSelect: number;
}

export const ImageSelectModal = ({
  options,
  selected,
  onToggle,
  maxSelect,
}: Props) => {
  const [open, setOpen] = useState(false);

  const previewSelected = options.filter((o) => selected.includes(o.imageId));

  const renderItem = ({ item }: any) => {
    const isSelected = selected.includes(item.imageId);
    const orderIndex = selected.indexOf(item.imageId);
    const atMax = !isSelected && selected.length >= maxSelect;

    return (
      <TouchableOpacity
        onPress={() => {
          if (!atMax) onToggle(item.imageId);
        }}
        activeOpacity={0.85}
        style={[
          styles.imageCard,
          {
            borderColor: isSelected ? C.primary : "#E2E8F0",
            opacity: atMax ? 0.45 : 1,
          },
        ]}
      >
        <View style={styles.imageContainer}>
          {item.imageurl ? (
            <Image
              source={{ uri: item.imageurl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="image-outline" size={50} color="#94A3B8" />
            </View>
          )}
        </View>

        {isSelected && <View style={styles.selectedOverlay} />}

        {isSelected && (
          <View style={styles.checkbox}>
            <Ionicons name="checkmark-circle" size={28} color={C.primary} />
          </View>
        )}

        {isSelected && (
          <View style={styles.orderBadge}>
            <Text style={styles.orderText}>{orderIndex + 1}</Text>
          </View>
        )}

        <Text style={styles.imageName} numberOfLines={1}>
          {item.imageName}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      {/* Trigger Button */}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={styles.triggerButton}
      >
        <View style={styles.triggerContent}>
          {previewSelected.length > 0 ? (
            <Text style={styles.selectedText}>
              {previewSelected.map((i) => i.imageName).join(", ")}
            </Text>
          ) : (
            <Text style={styles.placeholderText}>Tap to select images…</Text>
          )}
        </View>
        <Text style={styles.counter}>
          {selected.length}/{maxSelect}
        </Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Select Images</Text>
              <Text style={styles.headerSubtitle}>
                {selected.length}/{maxSelect} selected
              </Text>

              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Grid */}
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.imageId)}
              renderItem={renderItem}
              numColumns={3}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.gridContainer}
              columnWrapperStyle={styles.columnWrapper}
            />

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={styles.doneButton}
              >
                <Text style={styles.doneText}>
                  Done ({selected.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  triggerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  triggerContent: { flex: 1 },
  selectedText: { fontSize: 15, color: C.primary, fontWeight: "600" },
  placeholderText: { fontSize: 15, color: "#94A3B8" },
  counter: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F2557",
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  // Modal
  modalOverlay: {
    flex: 1,
     backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: "90%",
    paddingTop: 20,
    maxWidth: 1200,           // ← Desktop max width
    alignSelf: "center",      // Center on large screens
    width: "100%",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F2557",        // Navy
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "500",
  },
  closeButton: { padding: 4 },

  // Grid
  gridContainer: { padding: 16 },
  columnWrapper: { justifyContent: "space-between" },

  imageCard: {
    width: (width > 1200 ? 1200 - 48 : width - 48) / 3,
    marginBottom: 18,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
    borderWidth: 3,
  },

  imageContainer: {
    width: "100%",
    height: 168,
    backgroundColor: "#fffdfc",     // Light Brown background
    justifyContent: "center",
    alignItems: "center",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  placeholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(190, 192, 196, 0.28)", // Blue overlay
  },

  checkbox: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "white",
    borderRadius: 50,
  },

  orderBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#A0522D",        // Brown accent
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  orderText: {
    color: "white",
    fontSize: 13,
    fontWeight: "bold",
  },

  imageName: {
    fontSize: 13.5,
    textAlign: "center",
    paddingVertical: 10,
    color: "#334155",
    fontWeight: "500",
  },

  // Footer
  footer: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  doneButton: {
    backgroundColor: C.primary,        // Blue
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  doneText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },
});