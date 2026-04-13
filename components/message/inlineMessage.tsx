// components/InlineMessage.tsx
import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface InlineMessageProps {
  type: "error" | "success";
  message: string | null;
  onClose: () => void;
}

const InlineMessage: React.FC<InlineMessageProps> = ({ type, message, onClose }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    if (message) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      opacity.setValue(0);
      translateY.setValue(-8);
    }
  }, [message]);

  if (!message) return null;

  const isError = type === "error";

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
        backgroundColor: isError ? "#FEF2F2" : "#F0FDF4",
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
        flexDirection: "row",
        alignItems: "flex-start",
        borderWidth: 1,
        borderColor: isError ? "#FECACA" : "#BBF7D0",
        shadowColor: isError ? "#EF4444" : "#22C55E",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: isError ? "#FEE2E2" : "#DCFCE7",
          justifyContent: "center",
          alignItems: "center",
          marginRight: 10,
          flexShrink: 0,
        }}
      >
        <Ionicons
          name={isError ? "alert-circle" : "checkmark-circle"}
          size={18}
          color={isError ? "#DC2626" : "#16A34A"}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 12,
            fontFamily: "Poppins_600SemiBold",
            color: isError ? "#991B1B" : "#14532D",
            marginBottom: 2,
          }}
        >
          {isError ? "Error" : "Success"}
        </Text>
        <Text
          style={{
            fontSize: 13,
            fontFamily: "Poppins_400Regular",
            color: isError ? "#7F1D1D" : "#15803D",
            lineHeight: 19,
          }}
        >
          {message}
        </Text>
      </View>
      <TouchableOpacity
        onPress={onClose}
        style={{
          padding: 4,
          borderRadius: 6,
          marginLeft: 8,
        }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={16} color={isError ? "#DC2626" : "#16A34A"} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default InlineMessage;