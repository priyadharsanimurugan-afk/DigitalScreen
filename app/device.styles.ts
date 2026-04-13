// app/device.styles.ts
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  // Layout
  container: { flex: 1, backgroundColor: "#F1F5F9" },
  scrollView: { flex: 1 },
  contentContainer: { maxWidth: 1200, alignSelf: "center", padding: 20, width: "100%" },
  contentContainerMobile: { padding: 12 },

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  headerMobile: { flexDirection: "column", alignItems: "flex-start", gap: 12 },
  title: { fontSize: 26, fontFamily: "Poppins_700Bold", color: "#1E293B" },
  titleMobile: { fontSize: 22 },
  subtitle: { color: "#64748B", fontFamily: "Poppins_400Regular", fontSize: 14, marginTop: 4 },
  subtitleMobile: { fontSize: 12 },
  createBtn: { backgroundColor: "#1E3A8A", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  createBtnMobile: { paddingHorizontal: 12, paddingVertical: 8 },
  createBtnText: { color: "#fff", fontFamily: "Poppins_600SemiBold", fontSize: 13 },
  createBtnTextMobile: { fontSize: 12 },

  // Stats Cards
  statsContainer: { flexDirection: "row", gap: 16, marginBottom: 20 },
  statsContainerMobile: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { flex: 1, backgroundColor: "#fff", padding: 16, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  cardDark: { backgroundColor: "#1E3A8A" },
  cardBrown: { backgroundColor: "#8B4513" },
  cardLight: { backgroundColor: "#F8FAFC" },
  cardMobile: { minWidth: "47%" },
  cardTitle: { fontSize: 11, color: "#64748B", fontFamily: "Poppins_500Medium", letterSpacing: 0.5 },
  cardValue: { fontSize: 24, fontFamily: "Poppins_700Bold", marginVertical: 6 },
  cardLabel: { fontSize: 11, fontFamily: "Poppins_400Regular" },
  whiteText: { color: "#fff" },

  // Search
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: "#E2E8F0" },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, fontFamily: "Poppins_400Regular", color: "#1E293B" },

  // Loading
  loadingContainer: { padding: 40, alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14, fontFamily: "Poppins_400Regular", color: "#64748B" },

  // Table
  tableContainer: { backgroundColor: "#fff", borderRadius: 12, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  webTableContainer: { overflowX: "auto" as const, width: "100%" },
  webTableBody: { minWidth: "100%" },
  tableHeader: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#F8FAFC", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  th: { fontFamily: "Poppins_600SemiBold", fontSize: 11, color: "#94A3B8", letterSpacing: 0.6, textTransform: "uppercase" as const },
  thDisplayName: { flex: 2, textAlign: "left" },
  thStatus: { flex: 1, textAlign: "center" },
  thDeviceName: { flex: 1, textAlign: "center" },
  thActions: { flex: 1, textAlign: "center" },

  // Rows
  row: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F8FAFC" },
  rowMobile: { paddingVertical: 0, marginBottom: 12 },
  cell: { flexDirection: "row", alignItems: "center" },
  cellDisplayName: { flex: 2, gap: 10 },
  cellStatus: { flex: 1, justifyContent: "center" },
  cellDeviceName: { flex: 1, justifyContent: "center" },
  cellActions: { flex: 1, justifyContent: "center", gap: 16 },

  // Device Info
  deviceIcon: { width: 36, height: 36, backgroundColor: "#E0F2FE", borderRadius: 8, justifyContent: "center", alignItems: "center" },
  deviceName: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#1E293B" },
  deviceNameText: { fontSize: 13, fontFamily: "Poppins_400Regular", color: "#475569" },
  deviceId: { fontSize: 11, color: "#64748B", fontFamily: "Poppins_400Regular", marginTop: 2 },

  // Badge
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, alignSelf: "center" },
  badgeText: { fontFamily: "Poppins_500Medium", fontSize: 12 },

  // Mobile Card
  mobileCard: { backgroundColor: "#ffffff", borderRadius: 12, padding: 12, width: "100%", borderWidth: 1, borderColor: "#E2E8F0" ,marginTop: 14,marginBottom: 12},
  mobileCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  mobileCardTitle: { flex: 1, marginLeft: 10 },
  mobileCardDetails: { borderTopWidth: 1, borderTopColor: "#F1F5F9", paddingTop: 10 },
  mobileDetailRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  mobileDetailLabel: { fontSize: 12, fontFamily: "Poppins_500Medium", color: "#64748B" },
  mobileDetailValue: { fontSize: 12, fontFamily: "Poppins_400Regular", color: "#475569", flex: 1, textAlign: "right", marginLeft: 10 },
  mobileActions: { flexDirection: "row", justifyContent: "flex-end", gap: 16, marginTop: 8, paddingTop: 8 },

  // Footer
  footer: { marginTop: 16, paddingTop: 12, alignItems: "center" ,marginBottom: 20},
  footerText: { fontSize: 11, color: "#64748B", fontFamily: "Poppins_500Medium" },

  // Empty State
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14, fontFamily: "Poppins_500Medium", color: "#94A3B8", marginTop: 12 },
  emptyBtn: { marginTop: 16, backgroundColor: "#1E3A8A", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  emptyBtnText: { color: "#FFF", fontFamily: "Poppins_600SemiBold", fontSize: 12 },

  // Pagination
  paginationContainer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#E2E8F0", flexWrap: "wrap", gap: 6 ,marginBottom:15},
  pageBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0" },
  pageBtnDisabled: { opacity: 0.5 },
  pageBtnText: { fontSize: 13, fontFamily: "Poppins_500Medium", color: "#1E3A8A" },
  pageBtnTextDisabled: { color: "#CBD5E1" },
  pageNumber: { minWidth: 36, height: 36, paddingHorizontal: 8, justifyContent: "center", alignItems: "center", borderRadius: 8, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: "#E2E8F0" },
  pageNumberActive: { backgroundColor: "#1E3A8A", borderColor: "#1E3A8A" },
  pageNumberText: { fontSize: 13, fontFamily: "Poppins_500Medium", color: "#475569" },
  pageNumberTextActive: { color: "#fff" },
  pageEllipsis: { fontSize: 14, fontFamily: "Poppins_400Regular", color: "#64748B", paddingHorizontal: 4 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", borderRadius: 20, width: "90%", maxWidth: 400, overflow: "hidden" },
  modalContentMobile: { width: "95%", margin: 10 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  modalTitle: { fontSize: 18, fontFamily: "Poppins_700Bold", color: "#1E3A8A" },
  modalBody: { padding: 20 },
  modalIcon: { alignItems: "center", marginBottom: 20 },
  modalCloseBtn: { backgroundColor: "#1E3A8A", paddingVertical: 12, borderRadius: 10, alignItems: "center", marginTop: 20 },
  modalCloseText: { color: "#fff", fontFamily: "Poppins_600SemiBold", fontSize: 14 },

  // Form
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 12, fontFamily: "Poppins_500Medium", color: "#475569", marginBottom: 6 },
  modalInput: { backgroundColor: "#F8FAFC", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontFamily: "Poppins_400Regular", color: "#1E293B", borderWidth: 1, borderColor: "#E2E8F0" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 20 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  cancelBtn: { backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0" },
  cancelBtnText: { color: "#64748B", fontFamily: "Poppins_600SemiBold", fontSize: 14 },
  saveBtn: { backgroundColor: "#1E3A8A" },
  saveBtnText: { color: "#FFF", fontFamily: "Poppins_600SemiBold", fontSize: 14 },

  // Details
  detailRow: { marginBottom: 16 },
  detailLabel: { fontSize: 11, fontFamily: "Poppins_500Medium", color: "#64748B", letterSpacing: 0.5, marginBottom: 4 },
  detailValue: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: "#1E293B" },

  // Delete Modal
  deleteModal: { width: 380, backgroundColor: "#fff", borderRadius: 20, padding: 28, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, elevation: 20 },
  deleteModalMobile: { width: "90%" },
  deleteIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#FEE2E2", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  deleteTitle: { fontFamily: "Poppins_700Bold", fontSize: 18, color: "#111", marginBottom: 8 },
  deleteMsg: { fontFamily: "Poppins_400Regular", fontSize: 14, color: "#64748B", textAlign: "center", lineHeight: 22, marginBottom: 24 },
  deleteActions: { flexDirection: "row", gap: 12, width: "100%" },
  deleteCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  deleteCancelText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#6B7280" },
  deleteConfirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  deleteConfirmText: { fontFamily: "Poppins_600SemiBold", fontSize: 14, color: "#fff" },
});