// components/pdfPreviewModal.tsx
//
// Full-screen PDF preview that works on BOTH web and mobile.
// Web   → renders PDF inside an <iframe> (no extra lib needed)
// Mobile→ renders PDF inside a WebView with Google Docs viewer fallback
//          Install: npx expo install react-native-webview
// ✦ Done button added at the bottom
// ✦ Mobile: loading overlay fixed so PDF is visible after load

import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "@/app/dashboard.styles";

interface Props {
  visible: boolean;
  onClose: () => void;
  pdfUrl: string;
  title?: string;
}

export const PdfPreviewModal = ({ visible, onClose, pdfUrl, title }: Props) => {
  const { width, height } = useWindowDimensions();
  const [loading, setLoading] = React.useState(true);

  // Reset loading state each time modal opens
  React.useEffect(() => {
    if (visible) setLoading(true);
  }, [visible, pdfUrl]);

  // For mobile we embed via Google Docs viewer so no native PDF lib needed
const [mode, setMode] = React.useState<"direct" | "google" | "error">("direct");



const renderViewer = () => {
  if (Platform.OS === "web") {
    return (
      <iframe
        src={pdfUrl}
        style={{ width: "100%", height: "100%", border: "none" }}
        onLoad={() => setLoading(false)}
      />
    );
  }

  // ✅ MOBILE — ALWAYS use Google Viewer
  try {
    const { WebView } = require("react-native-webview");

    const googleViewer = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;

    return (
      <WebView
        source={{ uri: googleViewer }}
        style={{ flex: 1 }}
        onLoadEnd={() => setLoading(false)}
        onError={() => setLoading(false)}
        originWhitelist={["*"]}
      />
    );
  } catch {
    return (
      <View style={s.errorBox}>
        <Text>WebView not installed</Text>
      </View>
    );
  }
};

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#111" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.headerTitle} numberOfLines={1}>
              {title ?? "PDF Preview"}
            </Text>
            <Text style={s.headerSub}>Full screen preview</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Ionicons name="close" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Viewer — loading overlay sits INSIDE this view so WebView still mounts */}
        <View style={{ flex: 1 }}>
          {/* WebView always mounted so it can load; overlay sits on top */}
          {renderViewer()}

          {/* Loading overlay — pointerEvents="none" so it doesn't block the WebView below */}
          {loading && (
            <View style={s.loadingOverlay} pointerEvents="none">
              <ActivityIndicator size="large" color={C.primary} />
              <Text style={s.loadingText}>Loading PDF…</Text>
            </View>
          )}
        </View>

        {/* ── Done button ── */}
        <View style={s.footer}>
          <TouchableOpacity onPress={onClose} style={s.doneBtn}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={s.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingTop: Platform.OS === "ios" ? 52 : 12,
    backgroundColor: "#fff",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 99,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  headerSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 99,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  // ── loading overlay now uses absoluteFill but pointerEvents="none"
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    zIndex: 10,
  },
  loadingText: {
    fontSize: 14,
    color: "#64748B",
    fontFamily: "Poppins_500Medium",
  },
  errorBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#334155",
    textAlign: "center",
  },
  errorSub: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  // ── Footer with Done button
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#fff",
  },
  doneBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  doneBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    fontWeight: "700",
  },
});