// app/dashboard.styles.ts
import { StyleSheet } from "react-native";

// ─── THEME ────────────────────────────────────────────────────────────────────

export const C = {
  // Blues
  primary:       "#1E3A8A",
  primaryLight:  "#3B5FC0",
  primaryGhost:  "#EEF2FF",
  primaryDeep:   "#0F2057",

  // Browns
  brown:         "#78350F",
  brownMid:      "#A16207",
  brownLight:    "#FEF3C7",
  brownGhost:    "#FFFBEB",

  // Backgrounds
  bg:            "#F0F4FF",
  surface:       "#FFFFFF",
  surfaceAlt:    "#F8FAFC",
  surfaceWarm:   "#FDFAF5",

  // Text
  text:          "#0F172A",
  textMid:       "#334155",
  textLight:     "#64748B",

  // UI
  border:        "#E2E8F0",
  borderWarm:    "#E8DCC8",

  // Status
  success:       "#059669",
  successBg:     "#D1FAE5",
  danger:        "#DC2626",
  dangerBg:      "#FEE2E2",
  live:          "#DC2626",
  warning:       "#F59E0B",

  // Accent (brown-gold)
  accent:        "#D97706",
  accentBg:      "#FEF3C7",
} as const;

export const BREAKPOINTS = { mobile: 768, tablet: 1024, desktop: 1200 } as const;

// ─── DROPDOWN STYLES ──────────────────────────────────────────────────────────

export const dd = StyleSheet.create({
  label: {
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
    color: C.textLight,
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  triggerOpen: { borderColor: C.primary, backgroundColor: C.primaryGhost },
  triggerText: { flex: 1, fontSize: 14, fontFamily: "Poppins_500Medium", color: C.text },
  triggerSub: { fontSize: 11, fontFamily: "Poppins_400Regular", color: C.textLight, marginTop: 1 },
  menu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.primaryLight + "66",
    borderRadius: 12,
    marginTop: 4,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 9999,
    zIndex: 9999,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  itemActive: { backgroundColor: C.primaryGhost },
  itemText: { fontSize: 14, fontFamily: "Poppins_500Medium", color: C.textMid },
  itemTextActive: { color: C.primary, fontFamily: "Poppins_600SemiBold" },
  itemSub: { fontSize: 11, fontFamily: "Poppins_400Regular", color: C.textLight, marginTop: 1 },
});

// ─── STAT CARD STYLES ─────────────────────────────────────────────────────────

export const sc = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  num: { fontSize: 24, fontFamily: "Poppins_700Bold" },
  label: { fontSize: 10, fontFamily: "Poppins_500Medium", letterSpacing: 0.3 },
});

// ─── MAIN STYLES ──────────────────────────────────────────────────────────────

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  content: { maxWidth: 1500, alignSelf: "center", width: "100%" },

  // ── Header ──────────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    paddingBottom: 4,
  },
  headerLeft: { gap: 3 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.brownLight,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: C.brownMid + "44",
  },
  headerBadgeText: {
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
    color: C.brownMid,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: C.primaryDeep,
    letterSpacing: -0.5,
  },
  pageSubtitle: { fontSize: 12, fontFamily: "Poppins_400Regular", color: C.textLight },
  onlineStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.successBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.success },
  onlineText: { fontSize: 11, fontFamily: "Poppins_600SemiBold", color: C.success },

  // ── Stats ────────────────────────────────────────────────────────────────────
  statsRow: { flexDirection: "row", flexWrap: "wrap" },

  // ── Card base ────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  cardTitle: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: C.text, flex: 1 },
  cardBadge: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    color: C.textLight,
    backgroundColor: C.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  cardBadgeBlue: {
    backgroundColor: C.primaryGhost,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: C.primaryLight + "33",
  },
  cardBadgeBlueText: { fontSize: 10, fontFamily: "Poppins_600SemiBold", color: C.primary },

  // ── Steps bar ────────────────────────────────────────────────────────────────
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  stepBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.border,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumDone: { backgroundColor: C.success },
  stepNumText: { fontSize: 11, fontFamily: "Poppins_700Bold", color: C.textLight },
  stepLabel: { fontSize: 12, fontFamily: "Poppins_500Medium", color: C.textLight },
  stepLabelDone: { color: C.text, fontFamily: "Poppins_600SemiBold" },
  stepLine: { flex: 1, height: 1.5, backgroundColor: C.border, minWidth: 20, marginHorizontal: 4 },
  stepNumSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumSmallText: { fontSize: 10, fontFamily: "Poppins_700Bold", color: "#fff" },

  // ── Live displays ─────────────────────────────────────────────────────────────
  livePulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.live },
  liveBadge: {
    backgroundColor: C.dangerBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  liveBadgeText: { fontSize: 10, fontFamily: "Poppins_700Bold", color: C.live, letterSpacing: 0.5 },

  // Live card — full redesign
  liveCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: C.surfaceAlt,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  liveCardLeft: { flex: 1 },
  liveDeviceName: { fontSize: 13, fontFamily: "Poppins_700Bold", color: C.primaryDeep, marginBottom: 2 },
  liveTitle: { fontSize: 12, fontFamily: "Poppins_500Medium", color: C.textMid, marginBottom: 8 },
  liveTagRow: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginBottom: 10 },
  liveTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.primaryGhost,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  liveTagText: { fontSize: 10, fontFamily: "Poppins_600SemiBold", color: C.primary },
  liveDot: { width: 6, height: 6, borderRadius: 3 },

  // Image thumbnails row inside live card
  liveImagePreview: { flexDirection: "row", alignItems: "center", gap: 5 },
  liveThumbWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: C.border,
  },
  liveThumb: { width: "100%", height: "100%" },
  liveThumbPlaceholder: { justifyContent: "center", alignItems: "center", backgroundColor: C.surfaceAlt },
  liveThumbMore: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: C.primaryGhost,
    justifyContent: "center",
    alignItems: "center",
  },
  liveThumbMoreText: { fontSize: 10, fontFamily: "Poppins_700Bold", color: C.primary },

  // Live card action buttons (vertical stack on right)
  liveCardActions: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 6,
    minWidth: 72,
  },
  editLiveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: C.primaryGhost,
    borderWidth: 1,
    borderColor: C.primaryLight + "44",
  },
  editLiveBtnText: { fontSize: 11, fontFamily: "Poppins_600SemiBold", color: C.primary },
  stopBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: C.danger,
  },
  stopBtnText: { fontSize: 11, fontFamily: "Poppins_700Bold", color: "#fff" },

  // ── Edit modal helpers ────────────────────────────────────────────────────────
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: C.primary,
    backgroundColor: C.primaryGhost,
  },
  editButtonText: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: C.primary },
  layoutPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    backgroundColor: C.successBg,
    borderRadius: 10,
    padding: 10,
  },
  layoutPreviewText: { fontFamily: "Poppins_600SemiBold", fontSize: 13, color: C.success },
  layoutPreviewSub: { fontFamily: "Poppins_400Regular", fontSize: 11, color: C.success, marginLeft: "auto" },

  // ── Main grid ─────────────────────────────────────────────────────────────────
  mainGrid: {},
  leftCol: {},
  rightCol: {},

  // ── Form fields ───────────────────────────────────────────────────────────────
  fieldLabel: {
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
    color: C.textLight,
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: C.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: C.text,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  textArea: { minHeight: 80 },

  // ── Device card ────────────────────────────────────────────────────────────────
  devicePreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.brownGhost,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.brownMid + "33",
    marginTop: 12,
  },
  devicePreviewIcon: {
    width: 44,
    height: 44,
    borderRadius: 11,
    backgroundColor: C.brownLight,
    justifyContent: "center",
    alignItems: "center",
  },
  devicePreviewName: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: C.brown },
  devicePreviewSub: { fontSize: 11, fontFamily: "Poppins_400Regular", color: C.textLight },
  devicePreviewId: { fontSize: 10, fontFamily: "Poppins_400Regular", color: C.textLight, marginTop: 1 },

  // ── Preview badge ─────────────────────────────────────────────────────────────
  previewLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.brownLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  previewLiveText: { fontSize: 9, fontFamily: "Poppins_700Bold", color: C.brownMid, letterSpacing: 0.5 },

  // ── Deploy card ───────────────────────────────────────────────────────────────
  deployCard: {
    borderWidth: 2,
    borderColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  deployHeader: { marginBottom: 16 },
  deployHeading: { fontSize: 16, fontFamily: "Poppins_700Bold", color: C.primaryDeep, marginBottom: 3 },
  deploySub: { fontSize: 12, fontFamily: "Poppins_400Regular", color: C.textLight },
  summaryList: { gap: 6, marginBottom: 18 },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  summaryLabel: { fontSize: 11, fontFamily: "Poppins_500Medium", color: C.textLight, width: 52 },
  summaryValue: { flex: 1, fontSize: 12, fontFamily: "Poppins_600SemiBold", color: C.text },
  deployBtn: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  deployBtnText: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 15 },

  // ── Recent uploads ────────────────────────────────────────────────────────────
  recentGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  recentCard: {
    width: "30.5%",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surfaceAlt,
  },
  recentThumb: { width: "100%", height: 72, backgroundColor: C.border },
  recentPin: { position: "absolute", top: 6, left: 0, right: 0, alignItems: "center" },
  recentInfo: { padding: 7 },
  recentName: { fontSize: 10, fontFamily: "Poppins_600SemiBold", color: C.text },
  recentDate: { fontSize: 9, fontFamily: "Poppins_400Regular", color: C.textLight, marginTop: 1 },

  emptyHint: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: C.textLight,
    textAlign: "center",
    paddingVertical: 14,
  },

  // ── Modal ─────────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 24,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  modalTitle: { fontSize: 18, fontFamily: "Poppins_700Bold", color: C.primaryDeep },
  modalSub: { fontSize: 13, fontFamily: "Poppins_400Regular", color: C.textLight, marginBottom: 18 },
  modalSummary: {
    backgroundColor: C.surfaceAlt,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 20,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 8,
  },
  modalRowLabel: { fontSize: 12, fontFamily: "Poppins_500Medium", color: C.textLight, minWidth: 90 },
  modalRowValue: { flex: 1, fontSize: 12, fontFamily: "Poppins_600SemiBold", color: C.text, textAlign: "right" },
  modalActions: { flexDirection: "row", gap: 10 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
    backgroundColor: C.surfaceAlt,
  },
  modalCancelText: { fontFamily: "Poppins_600SemiBold", color: C.textLight, fontSize: 14 },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: C.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  modalConfirmText: { fontFamily: "Poppins_700Bold", color: "#fff", fontSize: 14 },

  // Legacy compat
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  layoutHint: { fontSize: 11, fontFamily: "Poppins_400Regular", color: C.textLight, marginBottom: 12 },
  layoutRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  layoutCard: {
    width: 100, paddingVertical: 14, paddingHorizontal: 8,
    borderRadius: 14, backgroundColor: C.surfaceAlt,
    borderWidth: 1.5, borderColor: C.border,
    alignItems: "center", justifyContent: "center", gap: 6,
  },
  layoutCardActive: {
    backgroundColor: C.primary, borderColor: C.primary,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  layoutCardTitle: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: C.textMid },
  layoutCardSub: { fontSize: 10, fontFamily: "Poppins_400Regular", color: C.textLight },
});