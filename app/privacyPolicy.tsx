import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  useWindowDimensions,
  Platform,
  TouchableOpacity,
  Image,
  Animated,
  StyleSheet,
  StatusBar,
  Linking,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const C = {
  bg: "#F8F6F3",
  surface: "#FFFFFF",
  text: "#1A1410",
  textMid: "#4B3F35",
  textLight: "#8C7A6B",
  primary: "#1D3461",   // Blue
  brown: "#6B4226",     // Brown accent
  border: "#E5DDD5",
  navBg: "#1D3461",
};

const SECTIONS = [
  { no: "01", title: "Data Collection on TV Device", body: "We do not collect personal data on the TV device. No name, email, phone number, camera, or microphone access is used. The app does not track viewer behavior, session duration, or usage patterns." },
  { no: "02", title: "Admin Panel Data", body: "Only uploaded images and device identifiers are handled. These are used strictly to authenticate devices and deliver the correct content to the correct screen." },
  { no: "03", title: "Use of Information", body: "Data is used exclusively for authentication and delivering content from the admin panel to TV devices. We do not use data for marketing, profiling, or analytics." },
  { no: "04", title: "Data Sharing", body: "We do not sell, trade, or share any data with third parties. All content is delivered from our own secure servers. No third-party analytics or advertising platforms are used." },
  { no: "05", title: "Security", body: "All communication is encrypted via HTTPS/TLS. Admin credentials must be kept secure by the user. We recommend strong, unique passwords for all accounts." },
  { no: "06", title: "Data Retention", body: "Uploaded media and device records are retained only as long as operationally necessary. Admins may delete content and unregister devices at any time via the admin panel." },
  { no: "07", title: "Your Rights", body: "Admin users have the right to access, correct, export, or delete account data at any time. Submit requests via the admin panel or our support email." },
  { no: "08", title: "Contact Us", body: "For privacy concerns or data requests, contact us at info@lemenizinfotech.com. We take all privacy matters seriously and respond promptly." },
];

const EmailLink = ({ email }: { email: string }) => (
  <TouchableOpacity onPress={() => Linking.openURL(`mailto:${email}`)}>
    <Text style={styles.emailLink}>{email}</Text>
  </TouchableOpacity>
);

function SectionCard({
  item,
  index,
  isMobile,
}: {
  item: (typeof SECTIONS)[0];
  index: number;
  isMobile: boolean;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, delay: index * 50, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 500, delay: index * 50, useNativeDriver: true }),
    ]).start();
  }, [index]);

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      <View style={[styles.card, isMobile && styles.cardMobile]}>
        <View style={styles.cardHeader}>
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>{item.no}</Text>
          </View>
          <Text style={[styles.cardTitle, { fontSize: isMobile ? 17.5 : 20 }]}>
            {item.title}
          </Text>
        </View>
        <Text style={[styles.cardBody, { fontSize: isMobile ? 14.5 : 15.5, lineHeight: isMobile ? 22 : 24 }]}>
          {item.body}
        </Text>
      </View>
    </Animated.View>
  );
}

export default function PrivacyPolicyScreen() {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();

  const isMobile = width < 600;
  const isTablet = width >= 600 && width < 1024;
  const maxContentWidth = 1500;

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else if (Platform.OS === "web") {
      window.history.back();
    } 
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.navBg} />

      {/* Navbar */}
      <View style={styles.navBar}>
        <View style={[styles.navContent, { maxWidth: maxContentWidth }]}>
          <Pressable
            onPress={handleGoBack}
            style={({ pressed, hovered }) => [
              styles.backBtn,
              Platform.OS === "web" && hovered && styles.backBtnHovered,
              pressed && styles.backBtnPressed,
            ]}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <View style={styles.logoContainer}>
            <Image source={require("../assets/images/logo.png")} style={styles.navLogo} resizeMode="contain" />
            <Text style={styles.navBrand}>SCREEN NOVA</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header - No Logo */}
        <View style={[styles.header, { maxWidth: maxContentWidth, paddingHorizontal: isMobile ? 20 : 40 }]}>
          <Text style={[styles.pageTitle, { fontSize: isMobile ? 32 : isTablet ? 38 : 44 }]}>
            Privacy Policy
          </Text>
          <View style={styles.metaContainer}>
            <Text style={[styles.metaText, { fontSize: isMobile ? 14 : 15 }]}>
              Last Updated: April 2026
            </Text>
            <Text style={[styles.metaText, { fontSize: isMobile ? 14 : 15 }]}>
              Screen Nova • Digital Signage Platform
            </Text>
          </View>
        </View>

        {/* Sections */}
        <View style={[styles.sectionsContainer, { maxWidth: maxContentWidth, paddingHorizontal: isMobile ? 16 : 24 }]}>
          {SECTIONS.map((section, index) => (
            <SectionCard
              key={section.no}
              item={section}
              index={index}
              isMobile={isMobile}
            />
          ))}
        </View>

        {/* Footer */}
        <View style={[styles.footer, { maxWidth: maxContentWidth, paddingHorizontal: isMobile ? 20 : 40 }]}>
          <View style={styles.footerContent}>
            <Image source={require("../assets/images/logo.png")} style={styles.footerLogo} resizeMode="contain" />
            <View>
              <Text style={styles.footerBrand}>SCREEN NOVA</Text>
              <EmailLink email="info@lemenizinfotech.com" />
            </View>
          </View>
          <Text style={[styles.copyright, { fontSize: isMobile ? 13 : 13.5 }]}>
            © 2026 Screen Nova by Lemeniz Infotech • All Rights Reserved
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  navBar: {
    backgroundColor: C.navBg,
    paddingTop: Platform.OS === "ios" ? 50 : Platform.OS === "android" ? 36 : 16,
    paddingBottom: 16,
  },
  navContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    alignSelf: "center",
    width: "100%",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  backBtnHovered: { backgroundColor: "rgba(255,255,255,0.15)" },
  backBtnPressed: { opacity: 0.8 },
  backText: { color: "#fff", fontSize: 16, fontWeight: "600", marginLeft: 6 },

  logoContainer: { flexDirection: "row", alignItems: "center" },
  navLogo: { width: 32, height: 32, marginRight: 10 },
  navBrand: { color: "#fff", fontSize: 18, fontWeight: "700", letterSpacing: 1 },

  scrollContent: { alignItems: "center", paddingBottom: 80 },

  header: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 30,
  },
  pageTitle: {
    fontWeight: "800",
    color: C.text,
    letterSpacing: -1.4,
    textAlign: "center",
  },
  metaContainer: {
    marginTop: 12,
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: C.textLight,
    fontWeight: "500",
  },

  sectionsContainer: {
    gap: 18,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: C.border,
    ...Platform.select({
      ios: { shadowColor: "#1D3461", shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 5 },
      web: { boxShadow: "0 8px 25px rgba(29, 52, 97, 0.07)" },
    }),
  },
  cardMobile: {
    padding: 22,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 14,
  },
  numberBadge: {
    backgroundColor: "#ECF3FF",
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: {
    color: C.primary,
    fontSize: 16.5,
    fontWeight: "700",
  },
  cardTitle: {
    color: C.text,
    fontWeight: "700",
    letterSpacing: -0.3,
    flex: 1,
  },
  cardBody: {
    color: C.textMid,
  },

  footer: {
    marginTop: 50,
    paddingTop: 40,
    borderTopWidth: 1,
    borderTopColor: C.border,
    alignItems: "center",
  },
  footerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  footerLogo: { width: 34, height: 34, marginRight: 12 },
  footerBrand: {
    color: C.primary,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  emailLink: {
    color: C.primary,
    fontSize: 14.5,
    textDecorationLine: "underline",
    marginTop: 3,
  },
  copyright: {
    color: C.textLight,
    textAlign: "center",
  },
});