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

  // Responsive breakpoints
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  if (!loaded) return null;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline', activeIcon: 'grid', route: '/dashboard' },
    { id: 'sedntv', label: 'Send to Tv', icon: 'tv-outline', activeIcon: 'tv', route: '/sendtv' },
    { id: 'devices', label: 'Devices', icon: 'hardware-chip-outline', activeIcon: 'hardware-chip', route: '/device' },
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
    await clearTokens();
    notifyAuthChange();
    router.replace("/login");
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // Dynamic styles based on screen size
  const getResponsiveStyles = () => {
    return {
      navbarPadding: isDesktop ? 32 : isTablet ? 20 : 16,
      logoSize: isDesktop ? 48 : isTablet ? 40 : 36,
      logoFontSize: isDesktop ? 24 : isTablet ? 20 : 18,
      navGap: isDesktop ? 16 : isTablet ? 12 : 8,
      navItemPadding: isDesktop ? 20 : isTablet ? 16 : 12,
      avatarSize: isDesktop ? 44 : isTablet ? 40 : 36,
    };
  };

  const responsive = getResponsiveStyles();

  return (
    <>
      <View style={[
        styles.navbar,
        { paddingHorizontal: responsive.navbarPadding },
        showBottomTabs && styles.navbarMobile
      ]}>
        {/* Logo Section */}
        <TouchableOpacity 
          onPress={() => handleNavigation('/dashboard')} 
          style={[styles.logoContainer, { gap: isTablet ? 12 : 8 }]}
        >
          <Image 
            source={require('../assets/images/logo.png')} 
            style={[styles.logoImage, { 
              width: responsive.logoSize, 
              height: responsive.logoSize 
            }]}
            resizeMode="contain"
          />
     
            <Text style={[styles.logoText, { fontSize: responsive.logoFontSize }]}>
              Screen Nova
            </Text>

        </TouchableOpacity>

        {/* Navigation Items - Only show on tablet/desktop */}
        {!showBottomTabs && (
          <View style={[styles.navItems, { gap: responsive.navGap }]}>
            {navItems.map((item) => {
              const isActive = pathname === item.route;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.navItem, 
                    { paddingHorizontal: responsive.navItemPadding },
                    isActive && styles.navItemActive
                  ]}
                  onPress={() => handleNavigation(item.route)}
                >
                  <Ionicons
                    name={isActive ? item.activeIcon : item.icon}
                    size={isDesktop ? 22 : isTablet ? 20 : 18}
                    color={isActive ? COLORS.primary : COLORS.textLight}
                  />
                  <Text style={[
                    styles.navLabel, 
                    { fontSize: isDesktop ? 15 : isTablet ? 14 : 13 },
                    isActive && styles.navLabelActive
                  ]}>
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
          style={[
            styles.profileSection,
            { paddingHorizontal: isDesktop ? 16 : isTablet ? 12 : 8 }
          ]} 
          onPress={() => setProfileModalVisible(true)}
        >
          {!showBottomTabs && !isMobile && (
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { fontSize: isDesktop ? 14 : isTablet ? 13 : 12 }]}>
                Administrator
              </Text>
              {isDesktop && (
                <Text style={styles.userRole}>Super Admin</Text>
              )}
            </View>
          )}
          <View style={[
            styles.avatarPlaceholder, 
            { 
              width: responsive.avatarSize, 
              height: responsive.avatarSize,
              borderRadius: responsive.avatarSize / 2 
            }
          ]}>
            <Text style={[
              styles.avatarInitials, 
              { fontSize: isDesktop ? 16 : isTablet ? 15 : 14 }
            ]}>
              {getUserInitials()}
            </Text>
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
            { 
              width: isDesktop ? 320 : isTablet ? 300 : 280,
              right: isDesktop ? 32 : isTablet ? 24 : 20,
              top: isDesktop ? 80 : isTablet ? 70 : 60
            },
            showBottomTabs && styles.modalContentMobile
          ]}>
            <View style={styles.modalHeader}>
              <View style={[
                styles.modalAvatarPlaceholder,
                { 
                  width: isDesktop ? 56 : isTablet ? 52 : 48,
                  height: isDesktop ? 56 : isTablet ? 52 : 48,
                  borderRadius: isDesktop ? 28 : isTablet ? 26 : 24
                }
              ]}>
                <Text style={[
                  styles.modalAvatarInitials,
                  { fontSize: isDesktop ? 20 : isTablet ? 19 : 18 }
                ]}>
                  {getUserInitials()}
                </Text>
              </View>
              <View style={styles.modalUserInfo}>
                <Text style={[
                  styles.modalUserName,
                  { fontSize: isDesktop ? 16 : isTablet ? 15 : 14 }
                ]}>
                  Administrator
                </Text>
                <Text style={styles.modalUserEmail}>admin@screennova.com</Text>
              </View>
            </View>

            <View style={styles.modalDivider} />

            <TouchableOpacity style={styles.modalItem} onPress={handleLogout}>
              <Ionicons 
                name="log-out-outline" 
                size={isDesktop ? 22 : isTablet ? 21 : 20} 
                color={COLORS.danger} 
              />
              <Text style={[
                styles.modalItemText, 
                styles.logoutText,
                { fontSize: isDesktop ? 15 : isTablet ? 14 : 13 }
              ]}>
                Logout
              </Text>
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
          <View style={[
            styles.confirmModalContent,
            { 
              width: isDesktop ? 400 : isTablet ? 360 : 320,
              padding: isDesktop ? 28 : isTablet ? 24 : 20
            }
          ]}>
            <View style={styles.confirmModalHeader}>
              <Ionicons 
                name="log-out-outline" 
                size={isDesktop ? 28 : isTablet ? 26 : 24} 
                color={COLORS.danger} 
              />
              <Text style={[
                styles.confirmModalTitle,
                { fontSize: isDesktop ? 20 : isTablet ? 19 : 18 }
              ]}>
                Confirm Logout
              </Text>
            </View>
            
            <Text style={[
              styles.confirmModalMessage,
              { fontSize: isDesktop ? 16 : isTablet ? 15 : 14 }
            ]}>
              Are you sure you want to logout from your account?
            </Text>

            <View style={[styles.confirmModalButtons, { gap: isDesktop ? 16 : 12 }]}>
              <TouchableOpacity 
                style={[styles.confirmButton, styles.cancelButton]} 
                onPress={cancelLogout}
              >
                <Text style={[
                  styles.cancelButtonText,
                  { fontSize: isDesktop ? 15 : isTablet ? 14 : 13 }
                ]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.confirmButton, styles.logoutButton]} 
                onPress={confirmLogout}
              >
                <Text style={[
                  styles.logoutButtonText,
                  { fontSize: isDesktop ? 15 : isTablet ? 14 : 13 }
                ]}>
                  Logout
                </Text>
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
    paddingVertical: 8,
    marginTop: 39,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    resizeMode: 'contain',
  },
  logoText: {
    fontFamily: 'Poppins_700Bold',
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  navItems: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderRadius: 10,
    position: 'relative',
  },
  navItemActive: {
    backgroundColor: COLORS.primary + '10',
  },
  navLabel: {
    fontFamily: 'Poppins_500Medium',
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
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  profileInfo: {
    alignItems: 'flex-end',
  },
  userName: {
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.text,
  },
  userRole: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontFamily: 'Poppins_600SemiBold',
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
    position: 'absolute',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalContentMobile: {
    right: 16,
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
  modalUserEmail: {
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
    color: COLORS.text,
  },
  logoutText: {
    color: COLORS.danger,
  },
  confirmModalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
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
    color: COLORS.text,
  },
  logoutButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    color: COLORS.surface,
  },
});