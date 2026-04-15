// components/selectImageModal.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  FlatList,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "@/app/dashboard.styles";

interface Props {
  visible: boolean;
  onClose: () => void;
  options: { imageId: number; imageName: string; imageurl?: string }[];
  selected: number[];
  onToggle: (id: number) => void;
  maxSelect: number;
}

export const ImageSelectModal = ({
  visible,
  onClose,
  options,
  selected,
  onToggle,
  maxSelect,
}: Props) => {
  const { width, height } = useWindowDimensions();
  const modalW = Math.min(width - 32, 640);
  // 3 columns with 16px padding each side and 8px gaps
  const colSize = (modalW - 32 - 16) / 3;

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
          s.imageCard,
          {
            width: colSize,
            opacity: atMax ? 0.45 : 1,
            borderColor: isSelected ? C.primary : "#E2E8F0",
          },
        ]}
      >
        <View style={[s.imageContainer, { height: colSize * 0.75 }]}>
          {item.imageurl ? (
            <Image
              source={{ uri: item.imageurl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <View style={s.placeholder}>
              <Ionicons name="image-outline" size={32} color="#94A3B8" />
            </View>
          )}
        </View>

        {isSelected && <View style={s.selectedOverlay} />}
        {isSelected && (
          <View style={s.checkIcon}>
            <Ionicons name="checkmark-circle" size={22} color={C.primary} />
          </View>
        )}
        {isSelected && (
          <View style={s.orderBadge}>
            <Text style={s.orderText}>{orderIndex + 1}</Text>
          </View>
        )}

        <Text style={s.imageName} numberOfLines={1}>
          {item.imageName}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    // transparent + justifyContent center = centered modal, NOT bottom sheet
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={[s.modalBox, { width: modalW, maxHeight: height * 0.85 }]}>
          {/* Header */}
          <View style={s.header}>
            <View>
              <Text style={s.headerTitle}>Select Imagess</Text>
              <Text style={s.headerSub}>
                {selected.length}/{maxSelect} selected
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  backgroundColor: C.primaryGhost,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 99,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Poppins_600SemiBold",
                    fontSize: 12,
                    color: C.primary,
                  }}
                >
                  {selected.length}/{maxSelect}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Grid */}
          <FlatList
            data={options}
            keyExtractor={(item) => String(item.imageId)}
            renderItem={renderItem}
            numColumns={3}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, gap: 8 }}
            columnWrapperStyle={{ gap: 8, justifyContent: "flex-start" }}
          />

          {/* Footer */}
          <View style={s.footer}>
            <TouchableOpacity onPress={onClose} style={s.cancelBtn}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Poppins_600SemiBold",
                  color: "#6B7280",
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              style={[
                s.doneBtn,
                { opacity: selected.length === 0 ? 0.5 : 1 },
              ]}
            >
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={s.doneText}>Done ({selected.length})</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  // centered overlay — NOT bottom-aligned
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#111" },
  headerSub: { fontSize: 13, color: "#64748B", marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 99,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  imageCard: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F8FAFC",
    borderWidth: 2.5,
    marginBottom: 0,
  },
  imageContainer: {
    width: "100%",
    backgroundColor: "#F0F4F8",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(59,130,246,0.12)",
  },
  checkIcon: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "white",
    borderRadius: 99,
  },
  orderBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: C.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "white",
  },
  orderText: { color: "white", fontSize: 11, fontWeight: "bold" },
  imageName: {
    fontSize: 11,
    textAlign: "center",
    paddingVertical: 7,
    paddingHorizontal: 4,
    color: "#334155",
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  doneText: { color: "white", fontSize: 15, fontWeight: "700" },
});