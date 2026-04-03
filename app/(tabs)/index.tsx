import React, { useState } from "react";
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  useWindowDimensions, StyleSheet
} from "react-native";
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins";

const BLUE = "#1E3A8A";
const BLUE_LIGHT = "#EEF2FF";
const GRAY = "#94A3B8";

export default function Dashboard() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [selectedRatio, setSelectedRatio] = useState("16:9");

  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold });
  if (!fontsLoaded) return null;

  const RATIOS = [
    { label: "1:1 Square", value: "1:1" },
    { label: "4:3 Classic", value: "4:3" },
    { label: "16:9 Cinema", value: "16:9" },
    { label: "2:1 Fitness", value: "2:1" }
  ];

  const MOCK_IMAGES = [
    "https://picsum.photos/seed/1/400/400",
    "https://picsum.photos/seed/2/400/400",
    "https://picsum.photos/seed/3/400/400",
    "https://picsum.photos/seed/4/400/400"
  ];

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={[s.content, isMobile && s.contentMobile]}>
        {/* Header Logo */}
        <View style={s.header}>
          <View style={s.logoBox}>
            <Image source={require("../../assets/images/logo.png")} style={s.logo} />
          </View>
          <View>
            <Text style={s.brand}>Screenova</Text>
            <Text style={s.tagline}>DIGITAL SIGNAGE PORTAL</Text>
          </View>
        </View>

        {/* Dashboard Title */}
        <Text style={s.dashboardTitle}>Dashboard</Text>
        <Text style={s.dashboardSub}>Screenova Signage Control</Text>

        {/* Live Preview Section */}
        <View style={s.card}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionLabel}>LIVE PREVIEW</Text>
            <View style={s.resolutionBadge}>
              <Text style={s.resolutionText}>4K Resolution</Text>
              <View style={s.activeDot} />
              <Text style={s.activeText}>Active</Text>
            </View>
          </View>
          
          <Text style={s.sectionTitle}>Screen Viewport</Text>
          
          <View style={[s.viewport, { aspectRatio: parseFloat(selectedRatio.replace(":", "/")) }]}>
            <Image source={{ uri: MOCK_IMAGES[0] }} style={s.previewImage} />
          </View>

          <Text style={s.ratioLabel}>Select Aspect Ratio</Text>
          <View style={s.ratioRow}>
            {RATIOS.map(r => (
              <TouchableOpacity
                key={r.value}
                style={[s.ratioBtn, selectedRatio === r.value && s.ratioActive]}
                onPress={() => setSelectedRatio(r.value)}
              >
                <Text style={[s.ratioText, selectedRatio === r.value && s.ratioTextActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notice Settings & Recent Assets Row */}
        <View style={s.twoColumnRow}>
          {/* Notice Settings */}
          <View style={[s.card, s.halfCard]}>
            <Text style={s.cardTitle}>Notice Settings</Text>
            
            <Text style={s.fieldLabel}>Content Title</Text>
            <View style={s.fieldValue}>
              <Text style={s.fieldText}>Morning Motivation Ritual</Text>
            </View>

            <Text style={s.fieldLabel}>Target Display</Text>
            <View style={s.targetBox}>
              <Text style={s.targetMain}>Main Lobby</Text>
              <Text style={s.targetSub}>Screen 01</Text>
            </View>

            <TouchableOpacity style={s.sendBtn}>
              <Text style={s.sendText}>Send to TV</Text>
            </TouchableOpacity>

            <View style={s.confirmationRow}>
              <View style={s.pendingDot} />
              <Text style={s.confirmationText}>AWAITING CONFIRMATION</Text>
            </View>
          </View>

          {/* Recent Library Assets */}
          <View style={[s.card, s.halfCard]}>
            <Text style={s.cardTitle}>Recent Library Assets</Text>
            <View style={s.assetGrid}>
              {MOCK_IMAGES.map((img, i) => (
                <TouchableOpacity key={i} style={s.assetItem}>
                  <Image source={{ uri: img }} style={s.assetImage} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={s.uploadBtn}>
                <Text style={s.uploadText}>Upload New</Text>
              </TouchableOpacity>
            </View>
            
            <View style={s.helpLogoutRow}>
              <TouchableOpacity>
                <Text style={s.helpText}>Help</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={s.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Auto Sync Section */}
        <View style={s.syncCard}>
          <View style={s.syncHeader}>
            <Text style={s.syncLabel}>AUTO-SYNC</Text>
            <Text style={s.syncTime}>14:00 - 18:00</Text>
          </View>
          <Text style={s.syncSubtext}>Next scheduled update</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  content: { padding: 24, maxWidth: 1200, alignSelf: "center", width: "100%" },
  contentMobile: { padding: 16 },
  
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 32 },
  logoBox: { width: 52, height: 52, borderRadius: 12, backgroundColor: BLUE_LIGHT, alignItems: "center", justifyContent: "center" },
  logo: { width: 36, height: 36 },
  brand: { fontSize: 22, fontWeight: "700", color: "#1E293B" },
  tagline: { fontSize: 9, fontWeight: "600", color: BLUE, letterSpacing: 2.5, marginTop: 2 },
  
  dashboardTitle: { fontSize: 34, fontWeight: "700", color: "#1E293B" },
  dashboardSub: { fontSize: 14, color: GRAY, marginBottom: 24, marginTop: 4 },
  
  card: { backgroundColor: "#FFF", borderRadius: 20, padding: 24, marginBottom: 20, shadowColor: BLUE, shadowOpacity: 0.08, shadowRadius: 20, elevation: 5 },
  
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: BLUE, letterSpacing: 1.5 },
  sectionTitle: { fontSize: 22, fontWeight: "700", color: "#1E293B", marginBottom: 16 },
  
  resolutionBadge: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F1F5F9", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  resolutionText: { fontSize: 10, fontWeight: "600", color: "#475569" },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22C55E" },
  activeText: { fontSize: 10, fontWeight: "600", color: "#22C55E" },
  
  viewport: { backgroundColor: "#F8FAFC", borderRadius: 16, overflow: "hidden", marginBottom: 24 },
  previewImage: { width: "100%", height: "100%" },
  
  ratioLabel: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 12 },
  ratioRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  ratioBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: "#F1F5F9" },
  ratioActive: { backgroundColor: BLUE },
  ratioText: { fontSize: 13, fontWeight: "600", color: GRAY },
  ratioTextActive: { color: "#FFF" },
  
  twoColumnRow: { flexDirection: "row", gap: 20, marginBottom: 20 },
  halfCard: { flex: 1, marginBottom: 0 },
  
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B", marginBottom: 20 },
  
  fieldLabel: { fontSize: 11, fontWeight: "600", color: "#475569", marginBottom: 6, marginTop: 8 },
  fieldValue: { backgroundColor: "#F8FAFC", paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, marginBottom: 16 },
  fieldText: { fontSize: 14, color: "#1E293B", fontWeight: "500" },
  
  targetBox: { backgroundColor: "#F8FAFC", paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, marginBottom: 20 },
  targetMain: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  targetSub: { fontSize: 12, color: GRAY, marginTop: 4 },
  
  sendBtn: { backgroundColor: BLUE, paddingVertical: 14, borderRadius: 12, alignItems: "center", marginBottom: 20 },
  sendText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  
  confirmationRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#E2E8F0" },
  pendingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#F59E0B" },
  confirmationText: { fontSize: 10, fontWeight: "700", color: GRAY, letterSpacing: 1 },
  
  assetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  assetItem: { width: "30%", aspectRatio: 1, borderRadius: 12, overflow: "hidden" },
  assetImage: { width: "100%", height: "100%" },
  uploadBtn: { width: "30%", aspectRatio: 1, borderRadius: 12, borderWidth: 2, borderColor: "#E2E8F0", borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  uploadText: { fontSize: 11, fontWeight: "600", color: GRAY },
  
  helpLogoutRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 16, borderTopWidth: 1, borderTopColor: "#E2E8F0" },
  helpText: { fontSize: 14, fontWeight: "600", color: GRAY },
  logoutText: { fontSize: 14, fontWeight: "600", color: "#EF4444" },
  
  syncCard: { backgroundColor: "#FFF", borderRadius: 20, padding: 24, marginBottom: 40, shadowColor: BLUE, shadowOpacity: 0.08, shadowRadius: 20, elevation: 5 },
  syncHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  syncLabel: { fontSize: 11, fontWeight: "700", color: BLUE, letterSpacing: 1.5 },
  syncTime: { fontSize: 22, fontWeight: "700", color: "#1E293B" },
  syncSubtext: { fontSize: 12, color: GRAY },
});