// app/device.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { Ionicons } from "@expo/vector-icons";
import ResponsiveLayout from "@/components/responsiveLayout";
import { useDevices } from "@/hooks/useDevice";
import CreateDeviceModal from "./CreateAccountModal";
import {styles} from './device.styles';

interface StatusCardProps {
  title: string;
  value: string | number;
  label: string;
  dark?: boolean;
  brown?: boolean;
  light?: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function DeviceScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;

  const [loaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const {
    devices,
    statusSummary,
    loading,
    addDevice,
    editDevice,
    removeDevice,
    refreshAllData,
    getStatistics,
  } = useDevices();

  const [modalVisible, setModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editFormData, setEditFormData] = useState({
    displayName: "",
    deviceName: "",
    password: "",
  });

  const statistics = getStatistics();

  useEffect(() => {
    refreshAllData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAllData();
    setRefreshing(false);
  };

  const handleViewDetails = (device: any) => {
    setSelectedDevice(device);
    setModalVisible(true);
  };

  const handleEditDevice = (device: any) => {
    setEditingDevice(device);
    setEditFormData({
      displayName: device.displayName,
      deviceName: device.deviceName,
      password: "",
    });
    setEditModalVisible(true);
  };

  const handleUpdateDevice = async () => {
    if (!editFormData.displayName.trim()) {
      Alert.alert("Error", "Device name is required");
      return;
    }

    const success = await editDevice(editingDevice.deviceId, {
      displayName: editFormData.displayName,
      deviceName: editFormData.deviceName,
      password: editFormData.password || undefined,
    });

    if (success) {
      setEditModalVisible(false);
      setEditingDevice(null);
      setEditFormData({ displayName: "", deviceName: "", password: "" });
    }
  };

  const handleDeleteDevice = (device: any) => {
    Alert.alert(
      "Delete Device",
      `Are you sure you want to delete "${device.displayName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await removeDevice(device.deviceId);
          },
        },
      ]
    );
  };

  const StatusCard = ({ title, value, label, dark, brown, light }: StatusCardProps) => {
    return (
      <View
        style={[
          styles.card,
          dark && { backgroundColor: "#1E3A8A" },
          brown && { backgroundColor: "#8B4513" },
          light && { backgroundColor: "#F8FAFC" },
          isMobile && styles.cardMobile,
        ]}
      >
        <Text style={[styles.cardTitle, dark && styles.white, brown && styles.white]}>
          {title}
        </Text>
        <Text style={[styles.cardValue, dark && styles.white, brown && styles.white]}>
          {value}
        </Text>
        <Text style={[styles.cardLabel, dark && styles.white, brown && styles.white]}>
          {label}
        </Text>
      </View>
    );
  };

  const StatusBadge = ({ status, isLive }: { status: string; isLive: boolean }) => {
    const getStatusColor = () => {
      if (isLive) return { bg: "#DCFCE7", text: "#166534", label: "Live" };
      if (status === "online") return { bg: "#E0F2FE", text: "#1E3A8A", label: "Online" };
      return { bg: "#FEE2E2", text: "#991B1B", label: "Offline" };
    };

    const color = getStatusColor();

    return (
      <View style={[styles.badge, { backgroundColor: color.bg }]}>
        <Text style={{ color: color.text, fontFamily: "Poppins_500Medium", fontSize: 12 }}>
          {isLive ? "Live" : status.toUpperCase()}
        </Text>
      </View>
    );
  };

  const filteredDevices = devices.filter(device =>
    device.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.deviceName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredDevices.length / ITEMS_PER_PAGE);
  const paginatedDevices = filteredDevices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  const scrollViewRef = React.useRef<ScrollView>(null);

  const Pagination = () => {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
      const pages = [];
      const maxVisible = isMobile ? 3 : 5;
      let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(totalPages, start + maxVisible - 1);
      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      return pages;
    };

    const visiblePages = getVisiblePages();

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
          onPress={() => currentPage > 1 && handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? "#CBD5E1" : "#1E3A8A"} />
          <Text style={[styles.pageBtnText, currentPage === 1 && styles.pageBtnTextDisabled]}>Prev</Text>
        </TouchableOpacity>

        {visiblePages[0] > 1 && (
          <>
            <TouchableOpacity style={styles.pageNumber} onPress={() => handlePageChange(1)}>
              <Text style={styles.pageNumberText}>1</Text>
            </TouchableOpacity>
            {visiblePages[0] > 2 && <Text style={styles.pageEllipsis}>...</Text>}
          </>
        )}

        {visiblePages.map((page) => (
          <TouchableOpacity
            key={page}
            style={[styles.pageNumber, currentPage === page && styles.pageNumberActive]}
            onPress={() => handlePageChange(page)}
          >
            <Text style={[styles.pageNumberText, currentPage === page && styles.pageNumberTextActive]}>
              {page}
            </Text>
          </TouchableOpacity>
        ))}

        {visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
              <Text style={styles.pageEllipsis}>...</Text>
            )}
            <TouchableOpacity style={styles.pageNumber} onPress={() => handlePageChange(totalPages)}>
              <Text style={styles.pageNumberText}>{totalPages}</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
          onPress={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <Text style={[styles.pageBtnText, currentPage === totalPages && styles.pageBtnTextDisabled]}>Next</Text>
          <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? "#CBD5E1" : "#1E3A8A"} />
        </TouchableOpacity>
      </View>
    );
  };

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (!loaded) return null;

  return (
    <ResponsiveLayout>
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={[styles.contentContainer, isMobile && styles.contentContainerMobile]}>
            {/* TITLE */}
            <View style={[styles.titleRow, isMobile && styles.titleRowMobile]}>
              <View>
                <Text style={[styles.title, isMobile && styles.titleMobile]}>Device Management</Text>
                <Text style={[styles.subtitle, isMobile && styles.subtitleMobile]}>
                  Monitor and organize your digital signage network.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.createBtn, isMobile && styles.createBtnMobile]}
                onPress={() => setCreateModalVisible(true)}
              >
                <Text style={[styles.createBtnText, isMobile && styles.createBtnTextMobile]}>
                  {isMobile ? "+ New" : "+ Create New Device"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* STATUS CARDS */}
            {!loading && (
              <View style={[styles.cardsRow, isMobile && styles.cardsRowMobile]}>
                <StatusCard
                  title="TOTAL DEVICES"
                  value={statistics.total}
                  label="Total Active Devices"
                />
                <StatusCard
                  title="LIVE DEVICES"
                  value={statistics.live}
                  label="Currently Live"
                  dark
                />
                <StatusCard
                  title="ONLINE DEVICES"
                  value={statistics.online}
                  label="Status Online"
                  brown
                />
                <StatusCard
                  title="OFFLINE DEVICES"
                  value={statistics.offline}
                  label="Offline Terminals"
                  light
                />
              </View>
            )}

            {/* SEARCH BAR */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color="#64748B" />
              <TextInput
                placeholder="Search devices by name or device name..."
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#94A3B8"
              />
              {searchQuery !== "" && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color="#64748B" />
                </TouchableOpacity>
              )}
            </View>

            {/* LOADING STATE */}
            {loading && devices.length === 0 && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1E3A8A" />
                <Text style={styles.loadingText}>Loading devices...</Text>
              </View>
            )}

            {/* TABLE */}
            {!loading && (
              <View style={[styles.table, isMobile && styles.tableMobile]}>
                {/* Desktop Table Header */}
                {!isMobile && (
                  <View style={styles.tableHeader}>
                    <Text style={styles.th1}>DISPLAY NAME</Text>
                    <Text style={styles.th}>STATUS</Text>
                    <Text style={styles.th}>DEVICE NAME</Text>
                    <Text style={styles.th}>ACTIONS</Text>
                  </View>
                )}

                {paginatedDevices.map((device) => (
                  <View key={device.deviceId} style={[styles.row, isMobile && styles.rowMobile]}>
                    {/* Mobile Card View */}
                    {isMobile ? (
                      <View style={styles.mobileCard}>
                        <View style={styles.mobileCardHeader}>
                          <View style={styles.deviceIcon}>
                            <Ionicons name="tv-outline" size={18} color="#1E3A8A" />
                          </View>
                          <View style={styles.mobileCardTitle}>
                            <Text style={styles.deviceName}>{device.displayName}</Text>
                            <Text style={styles.deviceId}>ID: {device.deviceId?.slice(0, 8)}</Text>
                          </View>
                          <StatusBadge status={device.status} isLive={device.isLive ?? device.currentDisplay === "yes"} />
                        </View>
                        <View style={styles.mobileCardDetails}>
                          <View style={styles.mobileDetailRow}>
                            <Text style={styles.mobileDetailLabel}>Device Name:</Text>
                            <Text style={styles.mobileDetailValue}>{device.deviceName}</Text>
                          </View>
                          <View style={styles.mobileActions}>
                            <TouchableOpacity onPress={() => handleViewDetails(device)} style={styles.mobileActionBtn}>
                              <Ionicons name="eye-outline" size={18} color="#1E3A8A" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleEditDevice(device)} style={styles.mobileActionBtn}>
                              <Ionicons name="create-outline" size={18} color="#64748B" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteDevice(device)} style={styles.mobileActionBtn}>
                              <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ) : (
                      // Desktop Row View
                      <>
                        <View style={styles.deviceCol}>
                          <View style={styles.deviceIcon}>
                            <Ionicons name="tv-outline" size={18} color="#1E3A8A" />
                          </View>
                          <View>
                            <Text style={styles.deviceName}>{device.displayName}</Text>
                            <Text style={styles.deviceId}>ID: {device.deviceId?.slice(0, 8)}</Text>
                          </View>
                        </View>

                        <StatusBadge status={device.status} isLive={device.isLive ?? device.currentDisplay === "yes"} />

                        <Text style={styles.loginId}>{device.deviceName}</Text>

                        <View style={styles.actions}>
                          <TouchableOpacity onPress={() => handleViewDetails(device)}>
                            <Ionicons name="eye-outline" size={18} color="#1E3A8A" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleEditDevice(device)}>
                            <Ionicons name="create-outline" size={18} color="#64748B" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteDevice(device)}>
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>
                ))}

                {filteredDevices.length === 0 && (
                  <View style={styles.emptyState}>
                    <Ionicons name="tv-outline" size={48} color="#CBD5E1" />
                    <Text style={styles.emptyText}>No devices found</Text>
                    <TouchableOpacity
                      style={styles.emptyBtn}
                      onPress={() => setCreateModalVisible(true)}
                    >
                      <Text style={styles.emptyBtnText}>Create your first device</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* FOOTER */}
                {filteredDevices.length > 0 && (
                  <View style={styles.footer}>
                    <Text style={styles.footerText}>
                      SHOWING {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredDevices.length)} OF {filteredDevices.length} DEVICES
                    </Text>
                  </View>
                )}

                {/* PAGINATION */}
                {filteredDevices.length > 0 && <Pagination />}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Device Details Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, isMobile && styles.modalContentMobile]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Device Details</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#475569" />
                </TouchableOpacity>
              </View>

              {selectedDevice && (
                <View style={styles.modalBody}>
                  <View style={styles.modalIcon}>
                    <Ionicons name="tv" size={48} color="#1E3A8A" />
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Display Name</Text>
                    <Text style={styles.detailValue}>{selectedDevice.displayName}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Device Name</Text>
                    <Text style={styles.detailValue}>{selectedDevice.deviceName}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Device ID</Text>
                    <Text style={styles.detailValue}>{selectedDevice.deviceId}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={[
                      styles.statusBadge,
                      (selectedDevice.isLive || selectedDevice.currentDisplay === "yes") ? styles.statusLive :
                      selectedDevice.status === "online" ? styles.statusOnline : styles.statusOffline
                    ]}>
                      <Text style={styles.statusText}>
                        {(selectedDevice.isLive || selectedDevice.currentDisplay === "yes")
                          ? "Live"
                          : selectedDevice.status?.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalCloseText}>Close</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Edit Device Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={editModalVisible}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, isMobile && styles.modalContentMobile]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Device</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#475569" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Display Name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editFormData.displayName}
                    onChangeText={(text) => setEditFormData({ ...editFormData, displayName: text })}
                    placeholder="Enter display name"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Device Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editFormData.deviceName}
                    onChangeText={(text) => setEditFormData({ ...editFormData, deviceName: text })}
                    placeholder="Enter device name"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password (leave blank to keep current)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editFormData.password}
                    onChangeText={(text) => setEditFormData({ ...editFormData, password: text })}
                    placeholder="Enter new password"
                    secureTextEntry
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.cancelBtn]}
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.saveBtn]}
                    onPress={handleUpdateDevice}
                  >
                    <Text style={styles.saveBtnText}>Update</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Create Device Modal */}
        <CreateDeviceModal
          visible={createModalVisible}
          onClose={() => setCreateModalVisible(false)}
          onCreateDevice={addDevice}
        />
      </View>
    </ResponsiveLayout>
  );
}

