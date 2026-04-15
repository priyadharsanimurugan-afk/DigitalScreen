import { clearTokens } from '@/services/api';
import { notifyAuthChange } from '@/utils/authEvents';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';

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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();

  if (!loaded) return null;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline', activeIcon: 'grid', route: '/dashboard' },
    { id: 'sedntv', label: 'Send to Tv', icon: 'grid-outline', activeIcon: 'grid', route: '/sendtv' },

    { id: 'devices', label: 'Devices', icon: 'tv-outline', activeIcon: 'tv', route: '/device' },
    { id: 'media', label: 'Media', icon: 'images-outline', activeIcon: 'images', route: '/media' },
  ];

  const getUserInitials = () => {
    return 'AD';
  };

  const handleNavigation = (route: string | any) => {
    router.push(route);
  };

  const handleLogout = () => {
    setProfileModalVisible(false);
    setShowLogoutConfirm(true);
  };

const confirmLogout = async () => {
  setShowLogoutConfirm(false);

  // 🔥 1. Clear tokens
  await clearTokens();

  // 🔥 2. Notify layout
  notifyAuthChange();

  // 🔥 3. Go to login
  router.replace("/login");
};


  const cancelLogout = () => {
    setShowLogoutConfirm(false);
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
              <Text style={styles.userName}>Administrator</Text>
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
                <Text style={styles.modalUserName}>Administrator</Text>
              </View>
            </View>

            <View style={styles.modalDivider} />

            <TouchableOpacity style={styles.modalItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
              <Text style={[styles.modalItemText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showLogoutConfirm}
        onRequestClose={cancelLogout}
      >
        <Pressable style={styles.modalOverlay} onPress={cancelLogout}>
          <View style={styles.confirmModalContent}>
            <View style={styles.confirmModalHeader}>
              <Ionicons name="log-out-outline" size={24} color={COLORS.danger} />
              <Text style={styles.confirmModalTitle}>Confirm Logout</Text>
            </View>
            
            <Text style={styles.confirmModalMessage}>
              Are you sure you want to logout?
            </Text>

            <View style={styles.confirmModalButtons}>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.cancelButton]} 
                onPress={cancelLogout}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmButton, styles.logoutButton]} 
                onPress={confirmLogout}
              >
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    width: 280,
    position: 'absolute',
    top: 70,
    right: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalContentMobile: {
    top: 60,
    right: 16,
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
  // Confirmation Modal Styles
  confirmModalContent: {
    backgroundColor: COLORS.surface,
    width: 320,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  confirmModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  confirmModalTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: COLORS.text,
  },
  confirmModalMessage: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: COLORS.textLight,
    marginBottom: 24,
    lineHeight: 22,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoutButton: {
    backgroundColor: COLORS.danger,
  },
  cancelButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.text,
  },
  logoutButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.surface,
  },
});