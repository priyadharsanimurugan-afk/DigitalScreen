import { StyleSheet } from "react-native";
import { COLORS, SPACING, RADIUS, SHADOWS, FONTS } from "../constants/theme";

export const navbarStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm,
  },
  safeArea: {
    backgroundColor: COLORS.surface,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  logo: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.primary,
    letterSpacing: -0.3,
    flex: 1,
  },
  logoAccent: {
    color: COLORS.secondary,
  },
  navLinks: {
    flexDirection: "row",
    gap: SPACING.xl,
    marginRight: SPACING.xl,
  },
  navItem: {
    paddingBottom: 2,
  },
  navItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  navText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  navTextActive: {
    color: COLORS.primary,
  },
  iconRow: {
    flexDirection: "row",
    gap: SPACING.md,
    alignItems: "center",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: "#fff",
  },
});