import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useRouter, usePathname } from 'expo-router';

const COLORS = {
  primary: '#1E3A8A',
  secondary: '#8B4513',
  background: '#F1F5F9',
  surface: '#FFFFFF',
  text: '#1E293B',
  textLight: '#475569',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
};

interface NavbarProps {
  showBottomTabs?: boolean;
}

export default function Navbar({ showBottomTabs = false }: NavbarProps) {
  const [loaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  if (!loaded) return null;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline', activeIcon: 'grid', route: '/dashboard' },
    { id: 'devices', label: 'Devices', icon: 'tv-outline', activeIcon: 'tv', route: '/device' },
    { id: 'media', label: 'Media', icon: 'images-outline', activeIcon: 'images', route: '/media' },
  ];

  const getUserInitials = () => {
    return 'AD';
  };

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            router.replace('/login');
          }
        },
      ]
    );
  };

  return (
    <>
      <View style={[
        styles.navbar,
        showBottomTabs && styles.navbarMobile
      ]}>
        {/* Logo Section */}
        <TouchableOpacity onPress={() => handleNavigation('/dashboard')} style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/logo.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>Screen Nova</Text>
        </TouchableOpacity>

        {/* Navigation Items - Only show on tablet/desktop */}
        {!showBottomTabs && (
          <View style={styles.navItems}>
            {navItems.map((item) => {
              const isActive = pathname === item.route;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                  onPress={() => handleNavigation(item.route)}
                >
                  <Ionicons
                    name={isActive ? item.activeIcon : item.icon}
                    size={20}
                    color={isActive ? COLORS.primary : COLORS.textLight}
                  />
                  <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                  {isActive && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* User Profile Section */}
        <TouchableOpacity 
          style={styles.profileSection} 
          onPress={() => setProfileModalVisible(true)}
        >
          {!showBottomTabs && (
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>Alex Davidson</Text>
              <Text style={styles.userRole}>Administrator</Text>
            </View>
          )}
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{getUserInitials()}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Profile Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={profileModalVisible}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setProfileModalVisible(false)}>
          <View style={[
            styles.modalContent,
            showBottomTabs && styles.modalContentMobile
          ]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalAvatarPlaceholder}>
                <Text style={styles.modalAvatarInitials}>{getUserInitials()}</Text>
              </View>
              <View style={styles.modalUserInfo}>
                <Text style={styles.modalUserName}>Alex Davidson</Text>
                <Text style={styles.modalUserRole}>Administrator</Text>
              </View>
            </View>

            <View style={styles.modalDivider} />

            <TouchableOpacity style={styles.modalItem} onPress={() => {
              setProfileModalVisible(false);
              handleNavigation('/profile');
            }}>
              <Ionicons name="person-outline" size={20} color={COLORS.text} />
              <Text style={styles.modalItemText}>My Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalItem} onPress={() => {
              setProfileModalVisible(false);
              Alert.alert('Account Settings', 'Coming soon!');
            }}>
              <Ionicons name="settings-outline" size={20} color={COLORS.text} />
              <Text style={styles.modalItemText}>Account Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalItem} onPress={() => {
              setProfileModalVisible(false);
              handleLogout();
            }}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
              <Text style={[styles.modalItemText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
   
  },
  navbarMobile: {
    paddingHorizontal: 16,
    paddingVertical: 7,
     marginTop: 39,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoImage: {
    width: 36,
    height: 36,
  },
  logoText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  navItems: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: COLORS.primary + '10',
  },
  navLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: COLORS.textLight,
  },
  navLabelActive: {
    color: COLORS.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  profileInfo: {
    alignItems: 'flex-end',
  },
  userName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: COLORS.text,
  },
  userRole: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    color: COLORS.textLight,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.surface,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    width: 280,
    marginTop: 70,
    marginRight: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalContentMobile: {
    marginTop: 60,
    marginRight: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  modalAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarInitials: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: COLORS.surface,
  },
  modalUserInfo: {
    flex: 1,
  },
  modalUserName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: COLORS.text,
  },
  modalUserRole: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  modalDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalItemText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: COLORS.text,
  },
  logoutText: {
    color: COLORS.danger,
  },
});