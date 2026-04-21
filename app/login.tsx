import React, { useState, useRef, useEffect } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { router } from "expo-router";
import { COLORS, FONTS } from "@/constants/theme";
import { loginStyles as s } from "@/app/login.style";
import { useLogin } from "@/hooks/useLoginAuth";
import {
  clearRememberedCredentials,
  getRememberedCredentials,
  saveRememberedCredentials,
} from "@/utils/tokenStorage";
import { notifyAuthChange } from "@/utils/authEvents";
import { Ionicons } from "@expo/vector-icons";

// Focus tracker so D-pad knows which field is active
type FocusField = "id" | "pw" | "remember" | "btn" | null;

export default function Login() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [foc, setFoc] = useState<string | null>(null);
  const [tvFocus, setTvFocus] = useState<FocusField>("id");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const pwRef = useRef<TextInput>(null);
  const idRef = useRef<TextInput>(null);
  const rememberRef = useRef<View>(null);
  const btnRef = useRef<View>(null);

  const { width } = useWindowDimensions();
  const mobile = width < 768;

  // TV detection: native TV or web with large screen (TV browser)
  const isNativeTV = Platform.isTV === true;
  const isWebTV = Platform.OS === "web" && width >= 1280;
  const isTV = isNativeTV || isWebTV;

  // Order of focusable elements for D-pad up/down
  const TV_FOCUS_ORDER: FocusField[] = ["id", "pw", "remember", "btn"];

  const [loaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const { login, loading, errors } = useLogin();

  // ── Load remembered credentials ─────────────────────────────────────────
  useEffect(() => {
    const loadCredentials = async () => {
      const creds = await getRememberedCredentials();
      if (creds.loginId) {
        setId(creds.loginId);
        setPw(creds.password);
        setRememberMe(true);
      }
    };
    loadCredentials();
  }, []);

  // ── Auto-focus first field ───────────────────────────────────────────────
  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      idRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [loaded]);

  // ── Web: load remembered credentials from localStorage ──────────────────
  useEffect(() => {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      const savedId = localStorage.getItem("remembered_login_id");
      const savedRemember = localStorage.getItem("remember_me") === "true";
      if (savedRemember && savedId) {
        setId(savedId);
        setRememberMe(true);
      }
    }
  }, []);

  // ── Web CSS + TV keyboard/remote navigation ──────────────────────────────
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;

    const style = document.createElement("style");
    style.textContent = `
      * { box-sizing: border-box; }
      html, body, #root {
        height: 100%;
        min-height: 100vh;
        margin: 0;
        padding: 0;
        overflow: hidden;
      }
      input:focus {
        outline: none !important;
        box-shadow: none !important;
      }
      input.error-input:focus {
        outline: none !important;
        box-shadow: none !important;
        border-color: ${COLORS.error} !important;
      }
    `;
    document.head.appendChild(style);

    if (!isWebTV) {
      return () => { document.head.removeChild(style); };
    }

    // ── Web TV D-pad / keyboard handler ────────────────────────────────────
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          setTvFocus((prev) => {
            const idx = TV_FOCUS_ORDER.indexOf(prev);
            const next = TV_FOCUS_ORDER[Math.min(idx + 1, TV_FOCUS_ORDER.length - 1)];
            focusField(next);
            return next;
          });
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          setTvFocus((prev) => {
            const idx = TV_FOCUS_ORDER.indexOf(prev);
            const next = TV_FOCUS_ORDER[Math.max(idx - 1, 0)];
            focusField(next);
            return next;
          });
          break;
        }
        case "Enter":
        case "Accept": {
          e.preventDefault();
          setTvFocus((prev) => {
            if (prev === "id") {
              pwRef.current?.focus();
              return "pw";
            }
            if (prev === "pw" || prev === "btn") {
              handleLogin();
              return prev;
            }
            if (prev === "remember") {
              setRememberMe((r) => !r);
              return prev;
            }
            return prev;
          });
          break;
        }
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => {
      document.head.removeChild(style);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isWebTV, id, pw]);

  // ── Native TV: TVEventHandler for Android TV / Apple TV remote ──────────
  useEffect(() => {
    if (!isNativeTV) return;

    // Dynamically import TVEventHandler so it doesn't break web/mobile builds
    let handler: any = null;
    try {
      const { TVEventHandler } = require("react-native");
      handler = new TVEventHandler();
      handler.enable(null, (_cmp: any, evt: any) => {
        if (!evt) return;
        switch (evt.eventType) {
          case "down": {
            setTvFocus((prev) => {
              const idx = TV_FOCUS_ORDER.indexOf(prev);
              const next = TV_FOCUS_ORDER[Math.min(idx + 1, TV_FOCUS_ORDER.length - 1)];
              focusField(next);
              return next;
            });
            break;
          }
          case "up": {
            setTvFocus((prev) => {
              const idx = TV_FOCUS_ORDER.indexOf(prev);
              const next = TV_FOCUS_ORDER[Math.max(idx - 1, 0)];
              focusField(next);
              return next;
            });
            break;
          }
          case "select":
          case "playPause": {
            setTvFocus((prev) => {
              if (prev === "id") {
                pwRef.current?.focus();
                return "pw";
              }
              if (prev === "pw" || prev === "btn") {
                handleLogin();
                return prev;
              }
              if (prev === "remember") {
                setRememberMe((r) => !r);
                return prev;
              }
              return prev;
            });
            break;
          }
          default:
            break;
        }
      });
    } catch (_) {
      // TVEventHandler not available on this platform
    }

    return () => {
      if (handler) handler.disable();
    };
  }, [isNativeTV, id, pw, rememberMe]);

  // ── Focus error fields ───────────────────────────────────────────────────
  useEffect(() => {
    if (errors.id) {
      idRef.current?.focus();
      setTvFocus("id");
    } else if (errors.pw) {
      pwRef.current?.focus();
      setTvFocus("pw");
    }
  }, [errors]);

  // ── Helper: focus the correct element by field name ─────────────────────
  const focusField = (field: FocusField) => {
    switch (field) {
      case "id":
        idRef.current?.focus();
        break;
      case "pw":
        pwRef.current?.focus();
        break;
      case "remember":
        // TouchableOpacity doesn't have .focus() — we use visual highlight only
        idRef.current?.blur();
        pwRef.current?.blur();
        break;
      case "btn":
        idRef.current?.blur();
        pwRef.current?.blur();
        break;
      default:
        break;
    }
  };

  // ── Login handler ────────────────────────────────────────────────────────
  const handleLogin = async () => {
    const res = await login({ loginId: id.trim(), password: pw });
    if (!res) return;
    if (rememberMe) {
      await saveRememberedCredentials(id.trim(), pw);
    } else {
      await clearRememberedCredentials();
    }
    notifyAuthChange();
    router.replace("/");
  };

  if (!loaded) return null;

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── TV LAYOUT (full screen, D-pad navigable) ─────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  if (isTV) {
    return (
      <View style={s.tvRoot}>
        {/* ── Left branding panel ── */}
        <View style={s.tvLeft}>
          <View style={s.tvBlob1} />
          <View style={s.tvBlob2} />
          <View style={s.tvLogoBox}>
            <Image
              source={require("../assets/images/logo.png")}
              style={s.tvLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={[s.tvBrand, { fontFamily: FONTS.bold }]}>Screenova</Text>
          <Text style={[s.tvTagline, { fontFamily: FONTS.semiBold }]}>
            DIGITAL SIGNAGE PORTAL
          </Text>
          <View style={s.tvDivider} />
          <Text style={[s.tvWelcome, { fontFamily: FONTS.bold }]}>Welcome back 👋</Text>
          <Text style={[s.tvSub, { fontFamily: FONTS.regular }]}>Sign in to continue</Text>

          {/* D-pad hint */}
          <View style={s.tvHint}>
            <Text style={[s.tvHintText, { fontFamily: FONTS.regular }]}>
              ▲ ▼  Navigate   •   OK  Select
            </Text>
          </View>
        </View>

        {/* ── Right form panel ── */}
        <View style={s.tvRight}>
          {/* General Error */}
          {errors.general ? (
            <View style={s.tvErrorContainer}>
              <Text style={[s.tvErrorText, { fontFamily: FONTS.regular }]}>
                {errors.general}
              </Text>
            </View>
          ) : null}

          {/* Login ID */}
          <View style={s.tvField}>
            <Text style={[s.tvLabel, { fontFamily: FONTS.semiBold }]}>LOGIN ID</Text>
            <TextInput
              ref={idRef}
              style={[
                s.tvInput,
                errors.id
                  ? s.tvInputError
                  : (foc === "id" || tvFocus === "id") && s.tvInputFocused,
                { fontFamily: FONTS.regular },
              ]}
              placeholder="Enter your login ID"
              placeholderTextColor={COLORS.textMuted}
              value={id}
              onChangeText={setId}
              onFocus={() => { setFoc("id"); setTvFocus("id"); }}
              onBlur={() => setFoc(null)}
              onSubmitEditing={() => {
                pwRef.current?.focus();
                setTvFocus("pw");
              }}
              returnKeyType="next"
              autoCapitalize="none"
              autoCorrect={false}
              hasTVPreferredFocus={true}
            />
            {errors.id && (
              <Text style={[s.tvFieldError, { fontFamily: FONTS.regular }]}>
                {errors.id}
              </Text>
            )}
          </View>

          {/* Password */}
          <View style={s.tvField}>
            <Text style={[s.tvLabel, { fontFamily: FONTS.semiBold }]}>PASSWORD</Text>
            <View style={s.tvPasswordWrap}>
              <TextInput
                ref={pwRef}
                style={[
                  s.tvInput,
                  s.tvPasswordInput,
                  errors.pw
                    ? s.tvInputError
                    : (foc === "pw" || tvFocus === "pw") && s.tvInputFocused,
                  { fontFamily: FONTS.regular },
                ]}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={!showPassword}
                value={pw}
                onChangeText={setPw}
                onFocus={() => { setFoc("pw"); setTvFocus("pw"); }}
                onBlur={() => setFoc(null)}
                onSubmitEditing={() => {
                  setTvFocus("remember");
                  focusField("remember");
                }}
                returnKeyType="next"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={s.tvEyeBtn}
                onPress={() => setShowPassword((v) => !v)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={28}
                  color="#afbfd1"
                />
              </TouchableOpacity>
            </View>
            {errors.pw && (
              <Text style={[s.tvFieldError, { fontFamily: FONTS.regular }]}>
                {errors.pw}
              </Text>
            )}
          </View>

          {/* Remember Me — D-pad highlighted when tvFocus === "remember" */}
          <TouchableOpacity
            ref={rememberRef}
            style={[
              s.tvRememberRow,
              tvFocus === "remember" && s.tvRememberRowFocused,
            ]}
            onPress={() => setRememberMe((r) => !r)}
            activeOpacity={0.7}
          >
            <View style={[s.tvCheckbox, rememberMe && s.tvCheckboxChecked]}>
              {rememberMe && <Text style={s.tvCheckmark}>✓</Text>}
            </View>
            <Text style={[s.tvRememberText, { fontFamily: FONTS.regular }]}>
              Remember me
            </Text>
          </TouchableOpacity>

          {/* Sign In Button — D-pad highlighted when tvFocus === "btn" */}
          <TouchableOpacity
            ref={btnRef}
            style={[
              s.tvBtn,
              loading && s.tvBtnDisabled,
              tvFocus === "btn" && s.tvBtnFocused,
            ]}
            onPress={handleLogin}
            activeOpacity={0.88}
            disabled={loading}
            accessible={true}
            accessibilityRole="button"
          >
            <Text style={[s.tvBtnText, { fontFamily: FONTS.bold }]}>
              {loading ? "Signing in..." : "Sign In →"}
            </Text>
          </TouchableOpacity>

          <Text style={[s.tvFooter, { fontFamily: FONTS.regular }]}>
            By continuing, you agree to our{" "}
            <Text
              style={s.tvFooterLink}
              onPress={() => router.push("/privacyPolicy")}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
      </View>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── SHARED card content (mobile + desktop web) ────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════
  const cardContent = (
    <View style={s.bg}>
      <View style={s.blob1} />
      <View style={s.blob2} />

      <View style={[s.card, mobile && s.cardM]}>
        <View style={s.strip} />

        <View style={s.inner}>
          <View style={s.logoRow}>
            <View style={s.logoBox}>
              <Image
                source={require("../assets/images/logo.png")}
                style={s.logo}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text style={[s.brand, { fontFamily: FONTS.bold }]}>Screenova</Text>
              <Text style={[s.tagline, { fontFamily: FONTS.semiBold }]}>
                DIGITAL SIGNAGE PORTAL
              </Text>
            </View>
          </View>

          <View style={s.div} />

          <Text style={[s.head, { fontFamily: FONTS.bold }]}>Welcome back 👋</Text>
          <Text style={[s.sub, { fontFamily: FONTS.regular }]}>Sign in to continue</Text>

          {errors.general ? (
            <View style={s.errorContainer}>
              <Text style={[s.errorText, { fontFamily: FONTS.regular }]}>
                {errors.general}
              </Text>
            </View>
          ) : null}

          <View style={s.fWrap}>
            <Text style={[s.lbl, { fontFamily: FONTS.semiBold }]}>Login ID</Text>
            <TextInput
              ref={idRef}
              style={[
                s.inp,
                errors.id ? s.inpError : foc === "id" && s.inpF,
                { fontFamily: FONTS.regular },
              ]}
              placeholder="Enter login ID"
              placeholderTextColor={COLORS.textMuted}
              value={id}
              onChangeText={setId}
              onFocus={() => setFoc("id")}
              onBlur={() => setFoc(null)}
              onSubmitEditing={() => pwRef.current?.focus()}
              returnKeyType="next"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.id && (
              <Text style={[s.fieldError, { fontFamily: FONTS.regular }]}>
                {errors.id}
              </Text>
            )}
          </View>

          <View style={s.fWrap}>
            <Text style={[s.lbl, { fontFamily: FONTS.semiBold }]}>Password</Text>
            <View style={s.passwordContainer}>
              <TextInput
                ref={pwRef}
                style={[
                  s.inp,
                  s.passwordInput,
                  errors.pw ? s.inpError : foc === "pw" && s.inpF,
                  { fontFamily: FONTS.regular },
                ]}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={!showPassword}
                value={pw}
                onChangeText={setPw}
                onFocus={() => setFoc("pw")}
                onBlur={() => setFoc(null)}
                onSubmitEditing={handleLogin}
                returnKeyType="done"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={s.eyeButton}
                onPress={() => setShowPassword((v) => !v)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#afbfd1"
                />
              </TouchableOpacity>
            </View>
            {errors.pw && (
              <Text style={[s.fieldError, { fontFamily: FONTS.regular }]}>
                {errors.pw}
              </Text>
            )}
          </View>

          <View style={s.row}>
            <TouchableOpacity
              style={s.checkboxContainer}
              onPress={() => setRememberMe((r) => !r)}
              activeOpacity={0.7}
            >
              <View style={[s.checkbox, rememberMe && s.checkboxChecked]}>
                {rememberMe && <Text style={s.checkmark}>✓</Text>}
              </View>
              <Text style={[s.rememberText, { fontFamily: FONTS.regular }]}>
                Remember me
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleLogin}
            activeOpacity={0.88}
            disabled={loading}
          >
            <Text style={[s.btnT, { fontFamily: FONTS.bold }]}>
              {loading ? "Signing in..." : "Sign In →"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={{ fontSize: 13, color: "#64748B", marginTop: 20 }}>
        By continuing, you agree to our{" "}
        <Text
          style={{
            color: "#1E3A8A",
            fontWeight: "600",
            textDecorationLine: "underline",
          }}
          onPress={() => router.push("/privacyPolicy")}
        >
          Privacy Policy
        </Text>
        .
      </Text>
    </View>
  );

  // ─── WEB (non-TV) ──────────────────────────────────────────────────────────
  if (Platform.OS === "web") {
    return (
      <View style={[s.root, { display: "flex" } as any]}>
        <ScrollView
          contentContainerStyle={[
            s.scrollContent,
            { flexGrow: 1, display: "flex" } as any,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {cardContent}
        </ScrollView>
      </View>
    );
  }

  // ─── iOS / Android ─────────────────────────────────────────────────────────
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={s.root}
      >
        {mobile ? (
          <ScrollView
            contentContainerStyle={s.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {cardContent}
          </ScrollView>
        ) : (
          cardContent
        )}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}