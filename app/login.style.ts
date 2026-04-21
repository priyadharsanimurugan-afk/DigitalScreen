import { StyleSheet, Platform } from "react-native";
import { COLORS, SPACING, SHADOWS } from "@/constants/theme";

export const loginStyles = StyleSheet.create({
  // ─── Root fills the entire screen ──────────────────────────────────────
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
    ...(Platform.OS === "web"
      ? ({ minHeight: "100vh", width: "100%" } as any)
      : {}),
  },

  // ─── ScrollView contentContainerStyle ──────────────────────────────────
  scrollContent: {
    flexGrow: 1,
    ...(Platform.OS === "web" ? ({ minHeight: "100vh" } as any) : {}),
  },

  // ─── Background layer — centres card vertically & horizontally ─────────
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

  // ─── Card ──────────────────────────────────────────────────────────────
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

  // ─── Logo row ──────────────────────────────────────────────────────────
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

  // ─── Form fields ───────────────────────────────────────────────────────
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

  // ─── Password field ────────────────────────────────────────────────────
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

  // ─── Remember me row ───────────────────────────────────────────────────
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

  // ─── Button ────────────────────────────────────────────────────────────
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

  // ─── Legacy / unused (kept for safety) ────────────────────────────────
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

  // ═══════════════════════════════════════════════════════════════════════
  // ─── TV STYLES — full-screen two-column layout ─────────────────────────
  // ═══════════════════════════════════════════════════════════════════════

  tvRoot: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: COLORS.background,
    ...(Platform.OS === "web"
      ? ({ minHeight: "100vh", width: "100vw", overflow: "hidden" } as any)
      : {}),
  },

  // Left branding panel — 40% width
  tvLeft: {
    width: "40%",
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 60,
    paddingVertical: 60,
    position: "relative",
    overflow: "hidden",
  },

  tvBlob1: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: 9999,
    backgroundColor: "#ffffff",
    opacity: 0.05,
    top: -120,
    right: -120,
  },
  tvBlob2: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: 9999,
    backgroundColor: "#ffffff",
    opacity: 0.04,
    bottom: -80,
    left: -80,
  },

  tvLogoBox: {
    width: 100,
    height: 100,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  tvLogo: { width: 68, height: 68 },

  tvBrand: {
    fontSize: 48,
    color: "#ffffff",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  tvTagline: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 4,
    marginBottom: 40,
  },
  tvDivider: {
    width: 60,
    height: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
    borderRadius: 2,
    marginBottom: 32,
  },
  tvWelcome: {
    fontSize: 38,
    color: "#ffffff",
    marginBottom: 12,
  },
  tvSub: {
    fontSize: 20,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 40,
  },

  // D-pad hint shown on left panel
  tvHint: {
    marginTop: "auto" as any,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  tvHintText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.5,
  },

  // Right form panel — 60% width
  tvRight: {
    width: "60%",
    justifyContent: "center",
    paddingHorizontal: 80,
    paddingVertical: 60,
    backgroundColor: COLORS.background,
  },

  tvField: { marginBottom: 28 },

  tvLabel: {
    fontSize: 13,
    color: COLORS.textLight,
    letterSpacing: 1.5,
    marginBottom: 10,
  },

  tvInput: {
    height: 72,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 24,
    fontSize: 20,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceAlt,
  },
  // Active focus — bright blue border + white bg
  tvInputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 3,
    backgroundColor: COLORS.surface,
  },
  tvInputError: {
    borderColor: "#FF4444",
    borderWidth: 2,
  },

  tvFieldError: {
    color: "#FF4444",
    fontSize: 15,
    marginTop: 6,
    marginLeft: 4,
  },

  tvErrorContainer: {
    backgroundColor: "#FFE5E5",
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 5,
    borderLeftColor: "#FF4444",
  },
  tvErrorText: {
    color: "#FF4444",
    fontSize: 17,
    lineHeight: 24,
  },

  tvPasswordWrap: {
    position: "relative",
    width: "100%",
  },
  tvPasswordInput: {
    paddingRight: 70,
  },
  tvEyeBtn: {
    position: "absolute",
    right: 20,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },

  // Remember Me — default
  tvRememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 36,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  // Remember Me — D-pad focused state
  tvRememberRowFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.accentLight,
  },

  tvCheckbox: {
    width: 30,
    height: 30,
    borderWidth: 2.5,
    borderColor: COLORS.border,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
  },
  tvCheckboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tvCheckmark: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  tvRememberText: {
    fontSize: 18,
    color: COLORS.textLight,
  },

  // Sign In button — default
  tvBtn: {
    height: 72,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    borderWidth: 3,
    borderColor: "transparent",
  },
  // Sign In button — D-pad focused state (bright ring + scale feel)
  tvBtnFocused: {
    borderColor: "#ffffff",
    backgroundColor: "#163080",
  },
  tvBtnDisabled: {
    opacity: 0.6,
  },
  tvBtnText: {
    color: "#ffffff",
    fontSize: 22,
    letterSpacing: 0.5,
  },

  tvFooter: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
  tvFooterLink: {
    color: COLORS.primary,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});