// components/signage/ImageSelectModal.tsx
import React from "react";
import {
  Modal, View, Text, TouchableOpacity,
  ScrollView, Image, Alert, Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "@/app/dashboard.styles";
import { ImageItem } from "../components/layoutGrid";

interface Props {
  visible: boolean;
  onClose: () => void;
  options: ImageItem[];
  selected: number[];
  onToggle: (id: number) => void;
  maxSelect?: number;
}

export const ImageSelectModal = ({ visible, onClose, options, selected, onToggle, maxSelect = 6 }: Props) => {
  const screenW = Dimensions.get("window").width;
  const numCols = screenW > 600 ? 3 : 2;
  const thumbSize = (screenW - 48) / numCols;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>

        {/* Header */}
        <View style={{
          flexDirection: "row", alignItems: "center",
          paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14,
          borderBottomWidth: 1, borderBottomColor: C.border,
          backgroundColor: C.surface, gap: 10,
        }}>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <Ionicons name="close" size={22} color={C.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 16, color: C.text }}>
              Select Images
            </Text>
            <Text style={{ fontFamily: "Poppins_400Regular", fontSize: 12, color: C.textLight }}>
              Tap in display order — up to {maxSelect}
            </Text>
          </View>
          <View style={{ backgroundColor: C.primaryGhost, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99 }}>
            <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 13, color: C.primary }}>
              {selected.length}/{maxSelect}
            </Text>
          </View>
        </View>

        {/* Grid */}
        <ScrollView
          contentContainerStyle={{ padding: 12, flexDirection: "row", flexWrap: "wrap", gap: 10 }}
          showsVerticalScrollIndicator={false}
        >
          {options.map((img) => {
            const isSelected = selected.includes(img.imageId);
            const orderIndex = selected.indexOf(img.imageId);
            const atMax = !isSelected && selected.length >= maxSelect;

            return (
              <TouchableOpacity
                key={img.imageId}
                onPress={() => { if (!atMax) onToggle(img.imageId); }}
                activeOpacity={0.8}
                style={{
                  width: thumbSize, borderRadius: 10, overflow: "hidden",
                  borderWidth: isSelected ? 2.5 : 1,
                  borderColor: isSelected ? C.primary : C.border,
                  opacity: atMax ? 0.4 : 1,
                  backgroundColor: C.surface,
                }}
              >
                {img.imageurl ? (
                  <Image source={{ uri: img.imageurl }} style={{ width: "100%", height: thumbSize }} resizeMode="contain" />
                ) : (
                  <View style={{ width: "100%", height: thumbSize, justifyContent: "center", alignItems: "center", backgroundColor: C.surfaceAlt }}>
                    <Ionicons name="image-outline" size={28} color={C.textLight} />
                  </View>
                )}

                {isSelected && (
                  <View style={{
                    position: "absolute", top: 6, left: 6,
                    backgroundColor: C.primary, borderRadius: 99,
                    width: 22, height: 22, justifyContent: "center", alignItems: "center",
                  }}>
                    <Text style={{ fontSize: 11, fontFamily: "Poppins_700Bold", color: "#fff" }}>
                      {orderIndex + 1}
                    </Text>
                  </View>
                )}
                {isSelected && (
                  <View style={{ position: "absolute", top: 6, right: 6, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 99 }}>
                    <Ionicons name="checkmark-circle" size={20} color={C.primary} />
                  </View>
                )}

                <View style={{ paddingHorizontal: 8, paddingVertical: 6, backgroundColor: C.surface }}>
                  <Text style={{ fontFamily: "Poppins_500Medium", fontSize: 11, color: C.text }} numberOfLines={1}>
                    {img.imageName}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Done */}
        <View style={{
          paddingHorizontal: 16, paddingBottom: 34, paddingTop: 12,
          backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border,
        }}>
          <TouchableOpacity
            style={{
              backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14,
              alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8,
              opacity: selected.length === 0 ? 0.5 : 1,
            }}
            onPress={() => {
              if (selected.length === 0) { Alert.alert("Select at least one image"); return; }
              onClose();
            }}
          >
            <Ionicons name="checkmark-done" size={18} color="#fff" />
            <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 15, color: "#fff" }}>
              Done — {selected.length} selected
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};