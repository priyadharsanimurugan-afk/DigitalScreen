// app/portal.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Image,
  useWindowDimensions,
  Animated,
} from "react-native";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { Ionicons } from "@expo/vector-icons";
import ResponsiveLayout from "@/components/responsiveLayout";
import { useDashboard } from "@/hooks/useDashboard";
import { useContent } from "@/hooks/useContent";
import { styles, C, BREAKPOINTS, dd, mip, sc } from "../app/dashboard.styles";
interface ImageSelectDropdownProps {
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
}: ImageSelectDropdownProps) => {
  const [open, setOpen] = useState(false);

  const previewSelected = options.filter((o) =>
    selected.includes(o.imageId)
  );

  return (
    <>
      {/* 🔹 Trigger */}
      <TouchableOpacity
        style={[mip.trigger, open && mip.triggerOpen]}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="images-outline" size={16} color={C.primary} />

        <View style={{ flex: 1 }}>
          {previewSelected.length > 0 ? (
            <Text style={mip.triggerText} numberOfLines={1}>
              {previewSelected.map((i) => i.imageName).join(", ")}
            </Text>
          ) : (
            <Text style={mip.triggerPlaceholder}>
              Tap to select images…
            </Text>
          )}
        </View>

        <View style={mip.countBadge}>
          <Text style={mip.countText}>
            {selected.length}/{maxSelect}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color={C.textLight} />
      </TouchableOpacity>

      {/* 🔥 CENTER MODAL */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        {/* Overlay */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Modal Box */}
          <TouchableOpacity
            activeOpacity={1}
            style={{
              width: "92%",
              maxWidth: 500,
              backgroundColor: C.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: C.border,
              paddingVertical: 10,
            }}
          >
            {/* Header */}
            <View
              style={{
                paddingHorizontal: 16,
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: C.border,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: C.text,
                }}
              >
                Select Images ({selected.length}/{maxSelect})
              </Text>
            </View>

            {/* Image List */}
            <ScrollView
              style={{ maxHeight: 350 }}
              showsVerticalScrollIndicator={false}
            >
              {options.map((img, idx) => {
                const isSelected = selected.includes(img.imageId);
                const orderIndex = selected.indexOf(img.imageId);
                const atMax =
                  !isSelected && selected.length >= maxSelect;

                return (
                  <TouchableOpacity
                    key={img.imageId}
                    style={[
                      mip.dropItem,
                      isSelected && mip.dropItemActive,
                      atMax && mip.dropItemDisabled,
                      idx < options.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: C.border,
                      },
                    ]}
                    onPress={() => {
                      if (!atMax) onToggle(img.imageId);
                    }}
                  >
                    {/* Thumbnail */}
                    <View
                      style={[
                        mip.dropThumb,
                        isSelected && { backgroundColor: C.primary },
                      ]}
                    >
                      {img.imageurl ? (
                        <Image
                          source={{ uri: img.imageurl }}
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: 8,
                          }}
                        />
                      ) : (
                        <Ionicons
                          name={
                            isSelected
                              ? "checkmark"
                              : "image-outline"
                          }
                          size={16}
                          color={
                            isSelected
                              ? "#fff"
                              : atMax
                              ? C.border
                              : C.textLight
                          }
                        />
                      )}

                      {/* Order badge */}
                      {isSelected && (
                        <View style={mip.orderBadge}>
                          <Text style={mip.orderBadgeText}>
                            {orderIndex + 1}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Name */}
                    <Text
                      style={[
                        mip.dropItemName,
                        isSelected && { color: C.primary },
                        atMax && { color: C.border },
                      ]}
                      numberOfLines={1}
                    >
                      {img.imageName}
                    </Text>

                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={C.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Footer */}
            <TouchableOpacity
              style={mip.doneBtn}
              onPress={() => setOpen(false)}
            >
              <Ionicons
                name="checkmark-done"
                size={16}
                color="#fff"
              />
              <Text style={mip.doneBtnText}>
                Done — {selected.length} selected
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* 🔹 Selected Preview */}
      {previewSelected.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 10,
          }}
        >
          {previewSelected.map((img, idx) => (
            <View
              key={img.imageId}
              style={{
                width: 70,
                borderRadius: 8,
                overflow: "hidden",
                backgroundColor: "#0F172A",
              }}
            >
              {img.imageurl ? (
                <Image
                  source={{ uri: img.imageurl }}
                  style={{ width: "100%", height: 60 }}
                />
              ) : null}

              {/* Order */}
              <View
                style={{
                  position: "absolute",
                  top: 4,
                  left: 4,
                  backgroundColor: C.primary,
                  borderRadius: 10,
                  paddingHorizontal: 5,
                }}
              >
                <Text style={{ fontSize: 9, color: "#fff" }}>
                  {idx + 1}
                </Text>
              </View>

              {/* Remove */}
              <TouchableOpacity
                onPress={() => onToggle(img.imageId)}
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                }}
              >
                <Ionicons
                  name="close-circle"
                  size={16}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </>
  );
};
