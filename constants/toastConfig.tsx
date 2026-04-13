import React from "react";
import { View, Text, Platform } from "react-native";

export const toastConfig = {
  success: (props: any) => (
<View
  style={{
    maxWidth: 400,
    minWidth: 280,
    backgroundColor: "#097731",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    width: "90%",
    alignSelf: "center",
    marginTop: 50, // ✅ push below notch

    ...(Platform.OS === "web"
      ? {
          alignSelf: "center",
          marginHorizontal: 20,
        }
      : {}),

    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  }}
>

      {/* Success Icon */}
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: "rgba(255,255,255,0.2)",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 14 }}>✓</Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: "#fff",
            fontSize: 15,
            fontWeight: "600",
            letterSpacing: -0.3,
          }}
        >
          {props.text1}
        </Text>
        {props.text2 ? (
          <Text
            style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: 13,
              marginTop: 2,
              letterSpacing: -0.2,
            }}
          >
            {props.text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),

  error: (props: any) => (
    <View
      style={{
        maxWidth: 400,
        minWidth: 280,
        backgroundColor: "#EF4444",
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 12,
        alignSelf: "center",
        marginHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
      }}
    >
      {/* Error Icon */}
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: "rgba(255,255,255,0.2)",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 14 }}>✕</Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: "#fff",
            fontSize: 15,
            fontWeight: "600",
            letterSpacing: -0.3,
          }}
        >
          {props.text1}
        </Text>
        {props.text2 ? (
          <Text
            style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: 13,
              marginTop: 2,
              letterSpacing: -0.2,
            }}
          >
            {props.text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),
};