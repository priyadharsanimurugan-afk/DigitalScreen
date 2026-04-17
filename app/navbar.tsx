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

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  if (!loaded) return null;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline', activeIcon: 'grid', route: '/dashboard' },
    { id: 'sendtv', label: 'Send to TV', icon: 'tv-outline', activeIcon: 'tv', route: '/sendtv' },
    { id: 'devices', label: 'Devices', icon: 'hardware-chip-outline', activeIcon: 'hardware-chip', route: '/device' },
    { id: 'media', label: 'Media', icon: 'images-outline', activeIcon: 'images', route: '/media' },
  ];

  const getUserInitials = () => 'AD';
  const handleNavigation = (route: string | any) => router.push(route);

  const handleLogout = () => {
    setProfileModalVisible(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    await clearTokens();
    notifyAuthChange();
    router.replace('/login');
  };

  const cancelLogout = () => setShowLogoutConfirm(false);

  const avatarSize = isDesktop ? 44 : isTablet ? 40 : 36;
  const logoSize = isDesktop ? 48 : isTablet ? 40 : 46;

  // ─────────────────────────────────────────────────────────
  // MOBILE & TABLET:  [Logo]   Screen Nova   [AD]
  // ─────────────────────────────────────────────────────────
  if (!isDesktop) {
    return (
      <>
        <View style={[
          styles.navbarMobileTablet,
          {
            paddingHorizontal: isTablet ? 20 : 16,
            marginTop: showBottomTabs ? 39 : 0,
          }
        ]}>

          {/* LEFT — Logo icon only */}
          <TouchableOpacity
            onPress={() => handleNavigation('/dashboard')}
            style={styles.logoIconWrapper}
          >
            <Image
              source={require('../assets/images/logo.png')}
              style={{ width: logoSize, height: logoSize }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {/* CENTER — App name, absolutely centered in the bar */}
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <View style={styles.centerAbsolute}>
              <Text style={[styles.logoText, { fontSize: isTablet ? 20 : 18 }]}>
                Screen Nova
              </Text>
            </View>
          </View>

          {/* RIGHT — AD Avatar */}
          <TouchableOpacity
            style={[styles.avatarButton, { backgroundColor: COLORS.background }]}
            onPress={() => setProfileModalVisible(true)}
          >
            <View style={[
              styles.avatarPlaceholder,
              { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }
            ]}>
              <Text style={[styles.avatarInitials, { fontSize: 14 }]}>
                {getUserInitials()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Profile Modal */}
        <Modal animationType="fade" transparent visible={profileModalVisible} onRequestClose={() => setProfileModalVisible(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setProfileModalVisible(false)}>
            <View style={[styles.modalContent, { width: isTablet ? 300 : 280, right: isTablet ? 20 : 16, top: 80 }]}>
              <View style={styles.modalHeader}>
                <View style={[styles.modalAvatarPlaceholder, { width: 48, height: 48, borderRadius: 24 }]}>
                  <Text style={[styles.modalAvatarInitials, { fontSize: 18 }]}>{getUserInitials()}</Text>
                </View>
                <View style={styles.modalUserInfo}>
                  <Text style={[styles.modalUserName, { fontSize: 14 }]}>Administrator</Text>
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

        {/* Logout Confirm Modal */}
        <Modal animationType="fade" transparent visible={showLogoutConfirm} onRequestClose={cancelLogout}>
          <Pressable style={styles.modalOverlay} onPress={cancelLogout}>
            <View style={[styles.confirmModalContent, { width: isTablet ? 360 : 320, padding: 20 }]}>
              <View style={styles.confirmModalHeader}>
                <Ionicons name="log-out-outline" size={24} color={COLORS.danger} />
                <Text style={[styles.confirmModalTitle, { fontSize: 18 }]}>Confirm Logout</Text>
              </View>
              <Text style={[styles.confirmModalMessage, { fontSize: 14 }]}>
                Are you sure you want to logout from your account?
              </Text>
              <View style={styles.confirmModalButtons}>
                <TouchableOpacity style={[styles.confirmButton, styles.cancelButton]} onPress={cancelLogout}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.confirmButton, styles.logoutButton]} onPress={confirmLogout}>
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────
  // DESKTOP:  [Logo + Screen Nova]   [Nav Items]   [Admin + AD]
  // ─────────────────────────────────────────────────────────
  return (
    <>
      <View style={[styles.navbar, { paddingHorizontal: 32 }]}>

        {/* Logo + App Name */}
        <TouchableOpacity onPress={() => handleNavigation('/dashboard')} style={styles.logoContainer}>
          <Image source={require('../assets/images/logo.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />
          <Text style={[styles.logoText, { fontSize: 24 }]}>Screen Nova</Text>
        </TouchableOpacity>

        {/* Nav Items */}
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
                  name={isActive ? item.activeIcon as any : item.icon as any}
                  size={22}
                  color={isActive ? COLORS.primary : COLORS.textLight}
                />
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
                {isActive && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Administrator + AD Avatar */}
        <TouchableOpacity style={styles.profileSection} onPress={() => setProfileModalVisible(true)}>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>Administrator</Text>
          </View>
          <View style={[styles.avatarPlaceholder, { width: 44, height: 44, borderRadius: 22 }]}>
            <Text style={[styles.avatarInitials, { fontSize: 16 }]}>{getUserInitials()}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Profile Modal */}
      <Modal animationType="fade" transparent visible={profileModalVisible} onRequestClose={() => setProfileModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setProfileModalVisible(false)}>
          <View style={[styles.modalContent, { width: 320, right: 32, top: 80 }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalAvatarPlaceholder, { width: 56, height: 56, borderRadius: 28 }]}>
                <Text style={[styles.modalAvatarInitials, { fontSize: 20 }]}>{getUserInitials()}</Text>
              </View>
              <View style={styles.modalUserInfo}>
                <Text style={[styles.modalUserName, { fontSize: 16 }]}>Administrator</Text>
              </View>
            </View>
            <View style={styles.modalDivider} />
            <TouchableOpacity style={styles.modalItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
              <Text style={[styles.modalItemText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Logout Confirm Modal */}
      <Modal animationType="fade" transparent visible={showLogoutConfirm} onRequestClose={cancelLogout}>
        <Pressable style={styles.modalOverlay} onPress={cancelLogout}>
          <View style={[styles.confirmModalContent, { width: 400, padding: 28 }]}>
            <View style={styles.confirmModalHeader}>
              <Ionicons name="log-out-outline" size={28} color={COLORS.danger} />
              <Text style={[styles.confirmModalTitle, { fontSize: 20 }]}>Confirm Logout</Text>
            </View>
            <Text style={[styles.confirmModalMessage, { fontSize: 16 }]}>
              Are you sure you want to logout from your account?
            </Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity style={[styles.confirmButton, styles.cancelButton]} onPress={cancelLogout}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmButton, styles.logoutButton]} onPress={confirmLogout}>
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
  // ── Shared navbar base ──
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  // ── Mobile / Tablet navbar (3-column: left | center | right) ──
  navbarMobileTablet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  logoIconWrapper: {
    // just the logo image, no text
  },

  // Absolutely centered overlay for app name
  centerAbsolute: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Avatar button on right
  avatarButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
  },

  // ── Desktop logo row ──
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoText: {
    fontFamily: 'Poppins_700Bold',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },

  // ── Desktop nav items ──
  navItems: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
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

  // ── Desktop profile section ──
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  profileInfo: {
    alignItems: 'flex-end',
  },
  userName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: COLORS.text,
  },
  userRole: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },

  // ── Shared avatar ──
  avatarPlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.surface,
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    position: 'absolute',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  modalAvatarPlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarInitials: {
    fontFamily: 'Poppins_700Bold',
    color: COLORS.surface,
  },
  modalUserInfo: {
    flex: 1,
  },
  modalUserName: {
    fontFamily: 'Poppins_600SemiBold',
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
    paddingHorizontal: 4,
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

  // ── Confirm Modal ──
  confirmModalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  confirmModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  confirmModalTitle: {
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.text,
  },
  confirmModalMessage: {
    fontFamily: 'Poppins_400Regular',
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