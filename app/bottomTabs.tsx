import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold } from '@expo-google-fonts/poppins';

const COLORS = {
  primary: '#1E3A8A',
  background: '#F1F5F9',
  surface: '#FFFFFF',
  text: '#1E293B',
  textLight: '#475569',
  border: '#E2E8F0',
};

export default function BottomTabs() {
  const [loaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  if (!loaded) return null;

  const tabs = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: 'grid-outline', 
      activeIcon: 'grid',
      route: '/dashboard' 
    },
    { 
      id: 'devices', 
      label: 'Devices', 
      icon: 'tv-outline', 
      activeIcon: 'tv',
      route: '/device' 
    },
    { 
      id: 'media', 
      label: 'Media', 
      icon: 'images-outline', 
      activeIcon: 'images',
      route: '/media' 
    },
  ];

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  // Don't show bottom tabs on tablet/desktop
  if (isTablet) return null;

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = pathname === tab.route;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => handleNavigation(tab.route)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={24}
                color={isActive ? COLORS.primary : COLORS.textLight}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Safe area for modern devices with home indicator */}
      {Platform.OS === 'ios' && <View style={styles.safeArea} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  tabActive: {
    // No background to keep it clean
  },
  tabLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
  activeDot: {
    position: 'absolute',
    top: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  safeArea: {
    height: 34, // For iPhone home indicator
    backgroundColor: COLORS.surface,
  },
});