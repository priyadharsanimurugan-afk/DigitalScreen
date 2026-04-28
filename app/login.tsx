import React, { useState, useRef, useEffect } from "react";
import {
  Image, KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  Keyboard, ScrollView, View, Text, TextInput,
  TouchableOpacity, useWindowDimensions,
} from "react-native";
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { router } from "expo-router";
import { COLORS, FONTS } from "@/constants/theme";
import { loginStyles as s } from "@/app/login.style";
import { useLogin } from "@/hooks/useLoginAuth";
import { clearRememberedCredentials, getRememberedCredentials, saveRememberedCredentials } from "@/utils/tokenStorage";
import { notifyAuthChange } from "@/utils/authEvents";
import { Ionicons } from "@expo/vector-icons";
import * as ScreenOrientation from "expo-screen-orientation";


export default function Login() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [foc, setFoc] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const pwRef = useRef<TextInput>(null);
  const idRef = useRef<TextInput>(null);
  const { width } = useWindowDimensions();
  const mobile = width < 768;

  const [loaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const { login, loading, errors } = useLogin();

  // Load remembered credentials on mount
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

  useEffect(() => {
  const forceLandscape = async () => {
    try {
      await ScreenOrientation.unlockAsync();

      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT
      );
    } catch (e) {
      // silently ignore
    }
  };

  if (Platform.OS !== "web") {
    forceLandscape();
  }
}, []);


  // Auto-focus login ID field and open keyboard automatically
  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      idRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [loaded]);

  // Web: load remembered credentials from localStorage
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

  // Web: inject CSS to remove focus outline on inputs
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const style = document.createElement("style");
      style.textContent = `
        * { box-sizing: border-box; }
        html, body, #root { height: 100%; min-height: 100vh; margin: 0; padding: 0; }
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
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  // Focus on first field that has an error
  useEffect(() => {
    if (errors.id) {
      idRef.current?.focus();
    } else if (errors.pw) {
      pwRef.current?.focus();
    }
  }, [errors]);

  const handleLogin = async () => {
    const res = await login({
      loginId: id.trim(),
      password: pw,
    });

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

  const cardContent = (
    <View style={s.bg}>
      <View style={s.blob1} />
      <View style={s.blob2} />

      <View style={[s.card, mobile && s.cardM]}>
        <View style={s.strip} />

        <View style={s.inner}>
          {/* Logo Row */}
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

          {/* General Error */}
          {errors.general ? (
            <View style={s.errorContainer}>
              <Text style={[s.errorText, { fontFamily: FONTS.regular }]}>
                {errors.general}
              </Text>
            </View>
          ) : null}

          {/* Login ID */}
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

          {/* Password */}
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
                onPress={() => setShowPassword(!showPassword)}
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

          {/* Remember Me */}
          <View style={s.row}>
            <TouchableOpacity
              style={s.checkboxContainer}
              onPress={() => setRememberMe(!rememberMe)}
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

          {/* Sign In Button */}
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

  // ─── WEB / TV ────────────────────────────────────────────────────────────────
  if (Platform.OS === "web") {
    return (
      <View style={s.root}>
        <ScrollView
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {cardContent}
        </ScrollView>
      </View>
    );
  }

  // ─── iOS / Android ───────────────────────────────────────────────────────────
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