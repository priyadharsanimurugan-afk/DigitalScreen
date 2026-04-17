import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold } from "@expo-google-fonts/poppins";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const COLORS = {
  primary: "#1E3A8A",
  background: "#F1F5F9",
  surface: "#FFFFFF",
  text: "#1E293B",
  textLight: "#475569",
  border: "#E2E8F0",
};

export default function BottomTabs() {
  const [loaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  const router = useRouter();
  const pathname = usePathname();

  if (!loaded) return null;

  const tabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "grid-outline" as const,
      activeIcon: "grid" as const,
      route: "/dashboard",
    },
    {
      id: "sendtv",
      label: "Send To Tv",
      icon: "send-outline" as const,
      activeIcon: "send" as const,
      route: "/sendtv",
    },
    {
      id: "devices",
      label: "Devices",
      icon: "tv-outline" as const,
      activeIcon: "tv" as const,
      route: "/device",
    },
    {
      id: "media",
      label: "Media",
      icon: "images-outline" as const,
      activeIcon: "images" as const,
      route: "/media",
    },
  ];

  const handleNavigation = (route: string | any) => {
    router.push(route);
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = pathname === tab.route;

          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tab}
              onPress={() => handleNavigation(tab.route)}
              activeOpacity={0.7}
            >
              <View style={styles.tabContent}>
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.icon}
                  size={24}
                  color={isActive ? COLORS.primary : COLORS.textLight}
                />

                <Text
                  style={[
                    styles.tabLabel,
                    isActive && styles.tabLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>

                {isActive && <View style={styles.activeIndicator} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {Platform.OS === "ios" && <View style={styles.safeArea} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingHorizontal: 8,
  },
  tabLabel: {
    fontFamily: "Poppins_500Medium",
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontFamily: "Poppins_600SemiBold",
  },
  activeIndicator: {
    position: "absolute",
    bottom: -16,
    width: "100%",
    height: 3,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  safeArea: {
    height: 34,
    backgroundColor: COLORS.surface,
  },
});
