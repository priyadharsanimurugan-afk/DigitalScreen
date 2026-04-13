// app/device.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  Platform,
} from "react-native";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { Ionicons } from "@expo/vector-icons";
import Toast from 'react-native-toast-message';
import ResponsiveLayout from "@/components/responsiveLayout";
import { useDevices } from "@/hooks/useDevice";
import CreateDeviceModal from "./CreateAccountModal";
import { styles } from "./device.styles";

interface StatusCardProps {
  title: string;
  value: string | number;
  label: string;
  dark?: boolean;
  brown?: boolean;
  light?: boolean;
}

interface Device {
  deviceId: string;
  displayName: string;
  deviceName: string;
  status: string;
  isLive?: boolean;
  currentDisplay?: string;
  password?: string;
}

const ITEMS_PER_PAGE = 10;

export default function DeviceScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isWeb = Platform.OS === 'web';

  const [loaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const {
    devices,
    loading,
    addDevice,
    editDevice,
    removeDevice,
    refreshAllData,
    getStatistics,
  } = useDevices();

  const [modalVisible, setModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFormData, setEditFormData] = useState({
    displayName: "",
    deviceName: "",
    password: "",
  });
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const statistics = getStatistics();
  const scrollViewRef = React.useRef<ScrollView>(null);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAllData();
    Toast.show({
      type: 'info',
      text1: 'Refreshed',
      text2: 'Devices updated successfully',
      visibilityTime: 2000,
    });
    setRefreshing(false);
  };

  const handleViewDetails = (device: Device) => {
    setSelectedDevice(device);
    setModalVisible(true);
  };

  const handleEditDevice = (device: Device) => {
    setEditingDevice(device);
    setEditFormData({
      displayName: device.displayName ?? "",
      deviceName: device.deviceName ?? "",
      password: "",
    });
    setEditModalVisible(true);
  };

  const handleCloseEditModal = () => {
    setEditModalVisible(false);
    setTimeout(() => {
      setEditingDevice(null);
      setEditFormData({ displayName: "", deviceName: "", password: "" });
    }, 300);
  };

  const handleUpdateDevice = async () => {
    if (!editingDevice?.deviceId) return;

    const result = await editDevice(editingDevice.deviceId, {
      displayName: editFormData.displayName,
      deviceName: editFormData.deviceName,
      password: editFormData.password || undefined,
    });

    if (result?.success) {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Device updated successfully',
        visibilityTime: 3000,
      });
      handleCloseEditModal();
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: result?.message || 'Failed to update device',
        visibilityTime: 3000,
      });
    }
  };

  const handleDeletePress = (device: Device) => {
    setDeviceToDelete(device);
    setDeleteModalVisible(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalVisible(false);
    setTimeout(() => setDeviceToDelete(null), 300);
  };

  const handleConfirmDelete = async () => {
    if (!deviceToDelete?.deviceId) {
      handleCloseDeleteModal();
      return;
    }
    
    const result = await removeDevice(deviceToDelete.deviceId);
    
    if (result?.success) {
      Toast.show({
        type: 'success',
        text1: 'Deleted',
        text2: 'Device deleted successfully',
        visibilityTime: 3000,
      });
      handleCloseDeleteModal();
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: result?.message || 'Failed to delete device',
        visibilityTime: 3000,
      });
    }
  };

const handleCreateDevice = async (data: any) => {
  const result = await addDevice(data);

  if (result?.success) {
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Device created successfully',
    });

    await refreshAllData(); // ✅🔥 ADD THIS

    setCreateModalVisible(false);
  } else {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: result?.message || 'Failed to create device',
    });
  }

  return result;
};


  const StatusCard = ({ title, value, label, dark, brown, light }: StatusCardProps) => (
    <View style={[styles.card, dark && styles.cardDark, brown && styles.cardBrown, light && styles.cardLight, isMobile && styles.cardMobile]}>
      <Text style={[styles.cardTitle, (dark || brown) && styles.whiteText]}>{title}</Text>
      <Text style={[styles.cardValue, (dark || brown) && styles.whiteText]}>{value}</Text>
      <Text style={[styles.cardLabel, (dark || brown) && styles.whiteText]}>{label}</Text>
    </View>
  );

  const StatusBadge = ({ status, isLive }: { status: string; isLive: boolean }) => {
    const color = isLive
      ? { bg: "#DCFCE7", text: "#166534", label: "Live" }
      : status === "online"
      ? { bg: "#E0F2FE", text: "#1E3A8A", label: "Online" }
      : { bg: "#FEE2E2", text: "#991B1B", label: "Offline" };

    return (
      <View style={[styles.badge, { backgroundColor: color.bg }]}>
        <Text style={[styles.badgeText, { color: color.text }]}>{color.label}</Text>
      </View>
    );
  };

  const filteredDevices = devices.filter(
    (d) =>
      d.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.deviceName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDevices.length / ITEMS_PER_PAGE);
  const paginatedDevices = filteredDevices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const Pagination = () => {
    if (totalPages <= 1) return null;
    const maxVisible = isMobile ? 3 : 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    const visiblePages: number[] = [];
    for (let i = start; i <= end; i++) visiblePages.push(i);

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

  if (!loaded) return null;

  return (
    <ResponsiveLayout>
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={[styles.contentContainer, isMobile && styles.contentContainerMobile]}>
            {/* Header */}
            <View style={[styles.header, isMobile && styles.headerMobile]}>
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

            {/* Stats Cards */}
            {!loading && (
              <View style={[styles.statsContainer, isMobile && styles.statsContainerMobile]}>
                <StatusCard title="TOTAL DEVICES" value={statistics.total} label="Total Active Devices" />
                <StatusCard title="LIVE DEVICES" value={statistics.live} label="Currently Live" dark />
                <StatusCard title="ONLINE DEVICES" value={statistics.online} label="Status Online" brown />
                <StatusCard title="OFFLINE DEVICES" value={statistics.offline} label="Offline Terminals" light />
              </View>
            )}

            {/* Search */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color="#64748B" />
              <TextInput
                placeholder="Search devices..."
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

            {/* Loading State */}
            {loading && devices.length === 0 && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1E3A8A" />
                <Text style={styles.loadingText}>Loading devices...</Text>
              </View>
            )}

            {/* Table */}
            {!loading && (
              <View style={[styles.tableContainer, isWeb && styles.webTableContainer]}>
                {!isMobile && (
                  <View style={styles.tableHeader}>
                    <Text style={[styles.th, styles.thDisplayName]}>DISPLAY NAME</Text>
                    <Text style={[styles.th, styles.thStatus]}>STATUS</Text>
                    <Text style={[styles.th, styles.thDeviceName]}>DEVICE NAME</Text>
                    <Text style={[styles.th, styles.thActions]}>ACTIONS</Text>
                  </View>
                )}

                <View style={isWeb ? styles.webTableBody : {}}>
                  {paginatedDevices.map((device) => {
                    const isLive = device.isLive ?? device.currentDisplay === "yes";
                    return (
                      <View key={device.deviceId} style={[styles.row, isMobile && styles.rowMobile]}>
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
                              <StatusBadge status={device.status} isLive={isLive} />
                            </View>
                            <View style={styles.mobileCardDetails}>
                              <View style={styles.mobileDetailRow}>
                                <Text style={styles.mobileDetailLabel}>Device Name:</Text>
                                <Text style={styles.mobileDetailValue}>{device.deviceName}</Text>
                              </View>
                              <View style={styles.mobileActions}>
                                <TouchableOpacity onPress={() => handleViewDetails(device)}>
                                  <Ionicons name="eye-outline" size={18} color="#1E3A8A" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleEditDevice(device)}>
                                  <Ionicons name="create-outline" size={18} color="#64748B" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeletePress(device)}>
                                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        ) : (
                          <>
                            <View style={[styles.cell, styles.cellDisplayName]}>
                              <View style={styles.deviceIcon}>
                                <Ionicons name="tv-outline" size={18} color="#1E3A8A" />
                              </View>
                              <View>
                                <Text style={styles.deviceName}>{device.displayName}</Text>
                                <Text style={styles.deviceId}>ID: {device.deviceId?.slice(0, 8)}</Text>
                              </View>
                            </View>
                            <View style={[styles.cell, styles.cellStatus]}>
                              <StatusBadge status={device.status} isLive={isLive} />
                            </View>
                            <View style={[styles.cell, styles.cellDeviceName]}>
                              <Text style={styles.deviceNameText}>{device.deviceName}</Text>
                            </View>
                            <View style={[styles.cell, styles.cellActions]}>
                              <TouchableOpacity onPress={() => handleViewDetails(device)}>
                                <Ionicons name="eye-outline" size={18} color="#1E3A8A" />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleEditDevice(device)}>
                                <Ionicons name="create-outline" size={18} color="#64748B" />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDeletePress(device)}>
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                              </TouchableOpacity>
                            </View>
                          </>
                        )}
                      </View>
                    );
                  })}
                </View>

                {filteredDevices.length === 0 && (
                  <View style={styles.emptyState}>
                    <Ionicons name="tv-outline" size={48} color="#CBD5E1" />
                    <Text style={styles.emptyText}>No devices found</Text>
                    <TouchableOpacity style={styles.emptyBtn} onPress={() => setCreateModalVisible(true)}>
                      <Text style={styles.emptyBtnText}>Create your first device</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {filteredDevices.length > 0 && (
                  <>
                    <View style={styles.footer}>
                      <Text style={styles.footerText}>
                        SHOWING {(currentPage - 1) * ITEMS_PER_PAGE + 1} –{" "}
                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredDevices.length)} OF{" "}
                        {filteredDevices.length} DEVICES
                      </Text>
                    </View>
                    <Pagination />
                  </>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Modals */}
        <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
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
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
                    <Text style={styles.modalCloseText}>Close</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>

        <Modal animationType="fade" transparent visible={editModalVisible} onRequestClose={handleCloseEditModal}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, isMobile && styles.modalContentMobile]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Device</Text>
                <TouchableOpacity onPress={handleCloseEditModal}>
                  <Ionicons name="close" size={24} color="#475569" />
                </TouchableOpacity>
              </View>
              {editingDevice && (
                <View style={styles.modalBody}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Display Name</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={editFormData.displayName}
                      onChangeText={(text) => setEditFormData(p => ({ ...p, displayName: text }))}
                      placeholder="Enter display name"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Device Name</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={editFormData.deviceName}
                      onChangeText={(text) => setEditFormData(p => ({ ...p, deviceName: text }))}
                      placeholder="Enter device name"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Password (leave blank to keep current)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={editFormData.password}
                      onChangeText={(text) => setEditFormData(p => ({ ...p, password: text }))}
                      placeholder="Enter new password"
                      secureTextEntry
                    />
                  </View>
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={handleCloseEditModal}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleUpdateDevice}>
                      <Text style={styles.saveBtnText}>Update</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>

        <Modal animationType="fade" transparent visible={deleteModalVisible} onRequestClose={handleCloseDeleteModal}>
          <View style={styles.modalOverlay}>
            <View style={[styles.deleteModal, isMobile && styles.deleteModalMobile]}>
              <View style={styles.deleteIconWrap}>
                <Ionicons name="trash" size={28} color="#EF4444" />
              </View>
              <Text style={styles.deleteTitle}>Delete Device</Text>
              {deviceToDelete && (
                <Text style={styles.deleteMsg}>
                  Are you sure you want to delete "{deviceToDelete.displayName}"? This action cannot be undone.
                </Text>
              )}
              <View style={styles.deleteActions}>
                <TouchableOpacity style={styles.deleteCancelBtn} onPress={handleCloseDeleteModal}>
                  <Text style={styles.deleteCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteConfirmBtn} onPress={handleConfirmDelete}>
                  <Ionicons name="trash-outline" size={15} color="#fff" />
                  <Text style={styles.deleteConfirmText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <CreateDeviceModal
          visible={createModalVisible}
          onClose={() => setCreateModalVisible(false)}
          onCreateDevice={handleCreateDevice}
        />
      </View>

    </ResponsiveLayout>
  );
}