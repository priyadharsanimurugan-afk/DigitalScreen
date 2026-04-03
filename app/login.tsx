


// app/login.tsx
import React, { useState, useRef } from "react";
import {
  Image, KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  Keyboard, ScrollView, StyleSheet, View, Text, TextInput,
  TouchableOpacity, useWindowDimensions, Alert,
} from "react-native";
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { router } from "expo-router";

const B = "#1E3A8A", BL = "#EEF2FF", G = "#94A3B8";

const USERS = [
  { login: "admin", password: "123456", route: "/(admin)/dashboard" },
  { login: "abc",   password: "123456", route: "/(tv)/display"      },
];

export default function Login() {
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [foc, setFoc] = useState<string | null>(null);
  const pwRef = useRef<TextInput>(null);
  const { width } = useWindowDimensions();
  const mobile = width < 768;

  const [loaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold });
  if (!loaded) return null;

  const P = (w: "400" | "600" | "700") =>
    ({ "400": "Poppins_400Regular", "600": "Poppins_600SemiBold", "700": "Poppins_700Bold" }[w]);

  const handleLogin = () => {
    const user = USERS.find(u => u.login === id.trim() && u.password === pw);
    if (!user) return Alert.alert("Invalid Credentials", "Check your login ID and password.");
    router.replace(user.route as any);
  };

  const content = (
    <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      <View style={s.bg}>
        <View style={s.blob1} /><View style={s.blob2} />
        <View style={[s.card, mobile && s.cardM]}>
          <View style={s.strip} />
          <View style={s.inner}>
            <View style={s.logoRow}>
              <View style={s.logoBox}>
                <Image source={require("../assets/images/logo.png")} style={s.logo} resizeMode="contain" />
              </View>
              <View>
                <Text style={[s.brand, { fontFamily: P("700") }]}>Screenova</Text>
                <Text style={[s.tagline, { fontFamily: P("600") }]}>DIGITAL SIGNAGE PORTAL</Text>
              </View>
            </View>

            <View style={s.div} />
            <Text style={[s.head, { fontFamily: P("700") }]}>Welcome back 👋</Text>
            <Text style={[s.sub, { fontFamily: P("400") }]}>Sign in to continue</Text>

            {[
              { key: "id", lbl: "Login ID",  ph: "admin  /  abc", sec: false },
              { key: "pw", lbl: "Password",  ph: "••••••••",       sec: true  },
            ].map(({ key, lbl, ph, sec }) => (
              <View key={key} style={s.fWrap}>
                <Text style={[s.lbl, { fontFamily: P("600") }]}>{lbl}</Text>
                <TextInput
                  ref={key === "pw" ? pwRef : undefined}
                  style={[s.inp, foc === key && s.inpF, { fontFamily: P("400") }]}
                  placeholder={ph}
                  placeholderTextColor={G}
                  secureTextEntry={sec}
                  value={key === "id" ? id : pw}
                  onChangeText={key === "id" ? setId : setPw}
                  onFocus={() => setFoc(key)}
                  onBlur={() => setFoc(null)}
                  onSubmitEditing={() => key === "id" ? pwRef.current?.focus() : handleLogin()}
                  returnKeyType={key === "id" ? "next" : "done"}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            ))}

            <TouchableOpacity style={s.forgot}>
              <Text style={[s.forgotT, { fontFamily: P("600") }]}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.btn} onPress={handleLogin} activeOpacity={0.88}>
              <Text style={[s.btnT, { fontFamily: P("700") }]}>Sign In  →</Text>
            </TouchableOpacity>

            <View style={s.hint}>
              <Text style={[s.hintT, { fontFamily: P("400") }]}>
                Admin: <Text style={{ fontFamily: P("600"), color: B }}>admin / 123456</Text>
                {"   "}TV: <Text style={{ fontFamily: P("600"), color: B }}>abc / 123456</Text>
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  // Web: no TouchableWithoutFeedback (it blocks input events on web)
  if (Platform.OS === "web") {
    return <View style={s.root}>{content}</View>;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.root}>
        {content}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F1F5F9" },
  scroll: { flexGrow: 1 },
  bg: { flex: 1, minHeight: "100%", justifyContent: "center", alignItems: "center", padding: 24 },
  blob1: { position: "absolute", width: 400, height: 400, borderRadius: 9999, backgroundColor: B, opacity: 0.06, top: -80, right: -80 },
  blob2: { position: "absolute", width: 300, height: 300, borderRadius: 9999, backgroundColor: "#3B82F6", opacity: 0.04, bottom: -60, left: -60 },
  card: { width: "100%", maxWidth: 460, backgroundColor: "#fff", borderRadius: 24, flexDirection: "row", overflow: "hidden", shadowColor: B, shadowOpacity: 0.12, shadowRadius: 32, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  cardM: { maxWidth: "100%" },
  strip: { width: 5, backgroundColor: B },
  inner: { flex: 1, padding: 36 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
  logoBox: { width: 60, height: 60, borderRadius: 14, backgroundColor: BL, alignItems: "center", justifyContent: "center" },
  logo: { width: 40, height: 40 },
  brand: { fontSize: 21, color: "#1E293B", letterSpacing: 0.3 },
  tagline: { fontSize: 8, color: B, letterSpacing: 2.5, marginTop: 2 },
  div: { height: 1, backgroundColor: "#E2E8F0", marginBottom: 22 },
  head: { fontSize: 26, color: "#1E293B" },
  sub: { fontSize: 13, color: G, marginTop: 4, marginBottom: 24 },
  fWrap: { gap: 6, marginBottom: 16 },
  lbl: { fontSize: 11, color: "#475569", letterSpacing: 0.5 },
  inp: { height: 50, borderWidth: 1.5, borderColor: "#E2E8F0", borderRadius: 12, paddingHorizontal: 16, fontSize: 14, color: "#1E293B", backgroundColor: "#FAFBFC" },
  inpF: { borderColor: B, backgroundColor: "#fff" },
  forgot: { alignSelf: "flex-end", marginTop: -8, marginBottom: 4 },
  forgotT: { fontSize: 12, color: B },
  btn: { height: 52, backgroundColor: B, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 8 },
  btnT: { color: "#fff", fontSize: 15, letterSpacing: 0.4 },
  hint: { marginTop: 20, padding: 12, backgroundColor: BL, borderRadius: 10, alignItems: "center" },
  hintT: { fontSize: 11, color: "#475569" },
});