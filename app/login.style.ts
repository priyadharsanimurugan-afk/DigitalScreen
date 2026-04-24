import { StyleSheet, Platform } from "react-native";
import { COLORS, SPACING, SHADOWS } from "@/constants/theme";

export const loginStyles = StyleSheet.create({
  // ─── Root fills the entire screen ──────────────────────────────────────────
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
    ...(Platform.OS === "web"
      ? ({ minHeight: "100vh", width: "100%" } as any)
      : {}),
  },

  // ─── ScrollView contentContainerStyle ──────────────────────────────────────
  scrollContent: {
    flexGrow: 1,
    ...(Platform.OS === "web" ? ({ minHeight: "100vh" } as any) : {}),
  },

  // ─── Background layer — centres card vertically & horizontally ─────────────
  bg: {
    flex: 1,
    ...(Platform.OS === "web"
      ? ({ minHeight: "100vh" } as any)
      : { minHeight: "100%" }),
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xxl,
  },

  blob1: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: 9999,
    backgroundColor: COLORS.primary,
    opacity: 0.06,
    top: -80,
    right: -80,
  },
  blob2: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 9999,
    backgroundColor: COLORS.secondary,
    opacity: 0.04,
    bottom: -60,
    left: -60,
  },

  // ─── Card ──────────────────────────────────────────────────────────────────
  card: {
    width: "100%",
    maxWidth: 460,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    flexDirection: "row",
    overflow: "hidden",
    ...SHADOWS.card,
  },
  cardM: {
    maxWidth: "100%",
  },

  strip: { width: 5, backgroundColor: COLORS.primary },

  inner: { flex: 1, padding: SPACING.xxxl },

  // ─── Logo row ──────────────────────────────────────────────────────────────
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  logoBox: {
    width: 60,
    height: 60,
    borderRadius: SPACING.lg,
    backgroundColor: COLORS.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 40, height: 40 },
  brand: { fontSize: 21, color: COLORS.text, letterSpacing: 0.3 },
  tagline: {
    fontSize: 8,
    color: COLORS.secondary,
    letterSpacing: 2.5,
    marginTop: SPACING.xs,
  },

  div: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 22,
  },

  head: { fontSize: 26, color: COLORS.text },
  sub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xxl,
  },

  // ─── Form fields ───────────────────────────────────────────────────────────
  fWrap: { gap: 6, marginBottom: SPACING.lg },
  lbl: { fontSize: 11, color: COLORS.textLight, letterSpacing: 0.5 },

  inp: {
    height: 50,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SPACING.md,
    paddingHorizontal: SPACING.lg,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceAlt,
  },
  inpF: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.surface,
  },
  inpError: {
    borderColor: "#FF4444",
    borderWidth: 1.5,
  },

  fieldError: {
    color: "#FF4444",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },

  errorContainer: {
    backgroundColor: "#FFE5E5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FF4444",
  },
  errorText: {
    color: "#FF4444",
    fontSize: 14,
    lineHeight: 20,
  },

  // ─── Password field ────────────────────────────────────────────────────────
  passwordContainer: {
    position: "relative",
    width: "100%",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },

  // ─── Remember me row ───────────────────────────────────────────────────────
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: SPACING.xl,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: "bold",
  },
  rememberText: {
    fontSize: 13,
    color: COLORS.textLight,
  },

  // ─── Button ────────────────────────────────────────────────────────────────
  btn: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.sm,
  },
  btnT: { color: COLORS.surface, fontSize: 15, letterSpacing: 0.4 },
  btnDisabled: { opacity: 0.6 },

  // ─── Legacy / unused (kept for safety) ────────────────────────────────────
  scroll: { flexGrow: 1 },
  forgot: { alignSelf: "flex-end" },
  forgotT: { fontSize: 12, color: COLORS.secondary },
  hint: {
    marginTop: SPACING.xl,
    padding: SPACING.md,
    backgroundColor: COLORS.accentLight,
    borderRadius: 10,
    alignItems: "center",
  },
  hintT: { fontSize: 11, color: COLORS.textLight },
  eyeIcon: { fontSize: 20, opacity: 0.6 },
});