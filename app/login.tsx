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


export default function Login() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [foc, setFoc] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const pwRef = useRef<TextInput>(null);
  const idRef = useRef<TextInput>(null);
  const { width } = useWindowDimensions();
  const mobile = width < 768;

  const [loaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold
  });

  const { login, loading, errors } = useLogin();

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

  const handleLogin = async () => {
    const res = await login({
      loginId: id.trim(),
      password: pw,
    });

    if (!res) return;

    // Handle remember me
    if (rememberMe) {
      await saveRememberedCredentials(id.trim(), pw);
    } else {
      await clearRememberedCredentials();
    }

    // Navigate based on role
   // Just go to root → layout will handle redirect
     // 🔥 CRITICAL FIX
  notifyAuthChange();
router.replace("/");

  };

  // Load saved credentials if remember me was checked
  useEffect(() => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const savedId = localStorage.getItem('remembered_login_id');
      const savedRemember = localStorage.getItem('remember_me') === 'true';
      
      if (savedRemember && savedId) {
        setId(savedId);
        setRememberMe(true);
      }
    }
  }, []);

  // Add web-specific styles only on client-side
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
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

  if (!loaded) return null;



  const content = (
    <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
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

            <Text style={[s.head, { fontFamily: FONTS.bold }]}>
              Welcome back 👋
            </Text>
            <Text style={[s.sub, { fontFamily: FONTS.regular }]}>
              Sign in to continue
            </Text>

            {/* General Error Display */}
            {errors.general ? (
              <View style={s.errorContainer}>
                <Text style={[s.errorText, { fontFamily: FONTS.regular }]}>
                  {errors.general}
                </Text>
              </View>
            ) : null}

            {/* Login ID Input */}
            <View style={s.fWrap}>
              <Text style={[s.lbl, { fontFamily: FONTS.semiBold }]}>Login ID</Text>
              <TextInput
                ref={idRef}
                style={[
                  s.inp,
                  errors.id ? s.inpError : foc === "id" && s.inpF,
                  { fontFamily: FONTS.regular }
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

            {/* Password Input */}
            <View style={s.fWrap}>
              <Text style={[s.lbl, { fontFamily: FONTS.semiBold }]}>Password</Text>
              <TextInput
                ref={pwRef}
                style={[
                  s.inp,
                  errors.pw ? s.inpError : foc === "pw" && s.inpF,
                  { fontFamily: FONTS.regular }
                ]}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry={true}
                value={pw}
                onChangeText={setPw}
                onFocus={() => setFoc("pw")}
                onBlur={() => setFoc(null)}
                onSubmitEditing={handleLogin}
                returnKeyType="done"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {errors.pw && (
                <Text style={[s.fieldError, { fontFamily: FONTS.regular }]}>
                  {errors.pw}
                </Text>
              )}
            </View>

            {/* Remember Me & Forgot Password Row */}
            <View style={s.row}>
              <TouchableOpacity 
                style={s.checkboxContainer} 
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View style={[s.checkbox, rememberMe && s.checkboxChecked]}>
                  {rememberMe && (
                    <Text style={s.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={[s.rememberText, { fontFamily: FONTS.regular }]}>
                  Remember me
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.forgot}>
                <Text style={[s.forgotT, { fontFamily: FONTS.semiBold }]}>
                  Forgot password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* LOGIN BUTTON */}
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
      </View>
    </ScrollView>
  );

  if (Platform.OS === "web") return <View style={s.root}>{content}</View>;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={s.root}
      >
        {content}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}