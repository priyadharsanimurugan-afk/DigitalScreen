// app/(tv)/display.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, Image, StyleSheet, useWindowDimensions,
  Animated, StatusBar, Platform, ActivityIndicator,
  TouchableOpacity, Dimensions,
} from "react-native";
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { useContent } from "../../hooks/useTvDisplay";
import { useRouter } from "expo-router";
import { notifyAuthChange } from "@/utils/authEvents";
import * as ScreenOrientation from 'expo-screen-orientation';
import { getLocation, fetchWeather, WeatherData } from "@/utils/weather";
import { logoutApi } from "@/services/auth";
import { deleteTokens, getRefreshToken } from "@/utils/tokenStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary:   "#FFFFFF",
  secondary: "#8B4513",
  bg:        "#2A3462",
  headerBg:  "#2A3462",
  dimText:   "#E0E0E0",
  border:    "rgba(255,255,255,0.15)",
  loaderBg:  "rgba(255,255,255,0.06)",
};

const PIN_PALETTE = ["#D94035","#1E3A8A","#8B4513","#1A7A4A","#7B3FA0","#C75B15","#1A6B8A","#3D3D3D"];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isMobile  = SCREEN_WIDTH < 768 || Platform.OS !== 'web';
const GAP       = isMobile ? 4  : 12;
const PIN_WIDTH = isMobile ? 14 : 28;
const HEADER_H  = isMobile ? 40 : 56;

// ─── Slideshow timing ─────────────────────────────────────────────────────────
const DISPLAY_TIME = 12000;
const FADE_TIME    =  1200;

// ─── Types ────────────────────────────────────────────────────────────────────
type ImageObject = {
  imageId: number;
  imageurl: string;
  sortOrder: number;
  mimeType?: string;
};
type Slot        = { slotIndex: number; images: ImageObject[] };
type ScreenLayoutObject = { label: string; value: string; rows: number; cols: number; slots: number };
type DeviceDisplay = {
  deviceId: number | any; id: number; title: string; description: string;
  screenLayout: string | ScreenLayoutObject;
  images?: ImageObject[] | null;
  slots?: Slot[];
};
type DeviceDisplayResponse = { message: string; data: DeviceDisplay | null };
type FeatureLayout = "f2" | "2f" | "ft" | "fb";
const FEATURE_LAYOUTS: FeatureLayout[] = ["f2","2f","ft","fb"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getSortedImages = (imgs?: ImageObject[] | null): ImageObject[] =>
  imgs ? [...imgs].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) : [];

const getLayoutValue = (l: string | ScreenLayoutObject): string =>
  typeof l === "object" && l !== null ? l.value : l;

const getLayoutDims = (l: string | ScreenLayoutObject): { rows: number; cols: number } => {
  if (typeof l === "object" && l !== null) return { rows: l.rows, cols: l.cols };
  if (typeof l === "string" && l.includes("x")) {
    const [r, c] = l.split("x").map(Number);
    if (r > 0 && c > 0) return { rows: r, cols: c };
  }
  return { rows: 1, cols: 1 };
};

const isFeatureLayout = (v: string): v is FeatureLayout => FEATURE_LAYOUTS.includes(v as FeatureLayout);

const isPdfFile = (img: ImageObject): boolean =>
  img.mimeType === "application/pdf" ||
  img.imageurl?.toLowerCase().endsWith(".pdf") ||
  false;

const normalizeSlots = (rawSlots: Slot[] | undefined, count: number) =>
  Array.from({ length: count }, (_, i) => ({
    slotIndex: i,
    images: rawSlots?.find(s => s.slotIndex === i)?.images
      ? getSortedImages(rawSlots.find(s => s.slotIndex === i)!.images)
      : [],
  }));

// ─── Image prefetch cache ─────────────────────────────────────────────────────
const prefetchedUrls = new Set<string>();
function prefetchImage(url: string, isPdf: boolean = false) {
  if (!url || prefetchedUrls.has(url) || isPdf) return;
  prefetchedUrls.add(url);
  Image.prefetch(url).catch(() => {});
}

// ─── Image size cache ─────────────────────────────────────────────────────────
const imageSizeCache: Record<string, { w: number; h: number }> = {};
function fetchImageSize(url: string, cb: (w: number, h: number) => void, isPdf: boolean = false) {
  if (isPdf) {
    // Use landscape ratio for PDFs so pin sits at top-center of the card
    cb(1600, 900);
    return;
  }
  if (imageSizeCache[url]) return cb(imageSizeCache[url].w, imageSizeCache[url].h);
  Image.getSize(url, (w, h) => { imageSizeCache[url] = { w, h }; cb(w, h); }, () => cb(100, 100));
}

function computePinPos(cW: number, cH: number, nW: number, nH: number) {
  const cr = cW / cH, ir = nW / nH;
  const rW = ir > cr ? cW : cH * ir;
  const rH = ir > cr ? cW / ir : cH;
  return { left: (cW - rW) / 2 + rW / 2 - PIN_WIDTH / 2, top: (cH - rH) / 2 - (isMobile ? 4 : 12) };
}

// ─── PDF Viewer ───────────────────────────────────────────────────────────────
// Web:    srcdoc iframe wrapper — forces fit-page, kills all scrollbars + controls
// Mobile: WebView with scrollEnabled=false + injected CSS to disable scroll/overflow
function PdfViewer({ url }: { url: string }) {
  const [loading, setLoading] = useState(true);

  if (Platform.OS === 'web') {
    // srcdoc lets us inject CSS that suppresses all overflow and PDF chrome
    const srcdoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{
    width:100%;height:100%;
    overflow:hidden;
    background:#2A3462;
    user-select:none;
    -webkit-user-select:none;
  }
  embed{
    display:block;
    width:100%;
    height:100%;
    border:none;
    background:#2A3462;
    pointer-events:none;
  }
  ::-webkit-scrollbar{display:none;}
</style>
</head>
<body>
  <embed
    src="${url}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=Fit&zoom=page-fit&pagemode=none"
    type="application/pdf"
    width="100%"
    height="100%"
  />
</body>
</html>`;

    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {loading && (
          <View style={[StyleSheet.absoluteFill, st.loaderOverlay, { backgroundColor: C.bg }]}>
            <View style={st.loaderSpinnerWrap}>
              <ActivityIndicator size={isMobile ? "small" : "large"} color="rgba(255,255,255,0.75)" />
              <Text style={st.loaderText}>Loading PDF…</Text>
            </View>
          </View>
        )}
        {/* @ts-ignore — iframe is valid on web */}
        <iframe
          srcDoc={srcdoc}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
            backgroundColor: "#2A3462",
          }}
          scrolling="no"
          onLoad={() => setLoading(false)}
        />
        {/* Transparent overlay prevents user interaction / scroll */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none" />
 
      </View>
    );
  }

  // ── Mobile WebView ────────────────────────────────────────────────────────
  const embedUrl = `${url}#toolbar=0&navpanes=0&scrollbar=0&view=Fit&zoom=page-fit`;
  const injectedJS = `
    (function(){
      document.documentElement.style.cssText = 'overflow:hidden!important;margin:0;padding:0;background:#2A3462;';
      document.body.style.cssText = 'overflow:hidden!important;margin:0;padding:0;background:#2A3462;';
      document.addEventListener('touchmove', function(e){ e.preventDefault(); }, { passive: false });
    })();
    true;
  `;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {loading && (
        <View style={[StyleSheet.absoluteFill, st.loaderOverlay, { backgroundColor: C.bg }]}>
          <View style={st.loaderSpinnerWrap}>
            <ActivityIndicator size="large" color="rgba(255,255,255,0.75)" />
            <Text style={st.loaderText}>Loading PDF…</Text>
          </View>
        </View>
      )}
      <WebView
        source={{ uri: embedUrl }}
        style={{ flex: 1, backgroundColor: C.bg }}
        onLoadEnd={() => setLoading(false)}
        onError={() => setLoading(false)}
        originWhitelist={["*"]}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        bounces={false}
        injectedJavaScript={injectedJS}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
      <View style={st.pdfBadge}>
        <Ionicons name="document-text" size={isMobile ? 10 : 14} color="#fff" />
        <Text style={st.pdfBadgeText}>PDF</Text>
      </View>
    </View>
  );
}

// ─── Slot Loader Overlay ──────────────────────────────────────────────────────
function SlotLoader({ visible }: { visible: boolean }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const prevRef = useRef(true);

  useEffect(() => {
    if (prevRef.current === visible) return;
    prevRef.current = visible;
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, st.loaderOverlay, { opacity }]}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: C.bg }]} />
      <View style={st.loaderSpinnerWrap}>
        <ActivityIndicator size={isMobile ? "small" : "large"} color="rgba(255,255,255,0.75)" />
        <Text style={st.loaderText}>Loading…</Text>
      </View>
    </Animated.View>
  );
}

// ─── Small Pin ────────────────────────────────────────────────────────────────
function Pin({ color }: { color: string }) {
  const pinSize = isMobile ? 12 : 24;
  return (
    <View style={[st.pinWrap, { width: PIN_WIDTH }]} pointerEvents="none">
      <View style={[st.pinHead, { backgroundColor: color, width: pinSize, height: pinSize, borderRadius: pinSize / 2 }]} />
      <View style={[st.pinNeedle, { height: isMobile ? 5 : 10 }]} />
      <View style={[st.pinGround, { width: isMobile ? 8 : 16 }]} />
    </View>
  );
}

// ─── ImageCell ────────────────────────────────────────────────────────────────
// No animation at all — completely static display
function ImageCell({ img, pinColor, slotIndex }: {
  img: ImageObject | null;
  pinColor: string;
  slotIndex: number;
}) {
  const [cellSize,  setCellSize]  = useState<{ w: number; h: number } | null>(null);
  const [natSize,   setNatSize]   = useState<{ w: number; h: number } | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  const isPdf = img ? isPdfFile(img) : false;

  useEffect(() => {
    if (!img?.imageurl) return;
    let cancelled = false;
    setImgLoaded(false);
    setNatSize(null);
    prefetchImage(img.imageurl, isPdf);
    fetchImageSize(img.imageurl, (w, h) => {
      if (!cancelled) setNatSize({ w, h });
    }, isPdf);
    // PDFs are immediately "loaded" — so the pin can render without waiting
    if (isPdf) setImgLoaded(true);
    return () => { cancelled = true; };
  }, [img?.imageurl, isPdf]);

  const pinReady = imgLoaded && cellSize && natSize;
  const pinPos   = pinReady
    ? computePinPos(cellSize!.w, cellSize!.h, natSize!.w, natSize!.h)
    : null;

  return (
    <View
      style={st.cellWrapper}
      onLayout={(e) => setCellSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <View style={st.floatCard}>
        {img?.imageurl ? (
          isPdf ? (
            <PdfViewer url={img.imageurl} />
          ) : (
            <Image
              source={{ uri: img.imageurl }}
              style={StyleSheet.absoluteFill}
              resizeMode="contain"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgLoaded(true)}
            />
          )
        ) : (
          <View style={st.emptySlot}>
            <Text style={st.emptyIcon}>📌</Text>
          </View>
        )}
        {/* Loader only for regular images */}
        {img?.imageurl && !isPdf && <SlotLoader visible={!imgLoaded} />}
      </View>

      {/* Pin for ALL content types including PDFs */}
      {pinPos && (
        <View pointerEvents="none" style={[st.pinAnchor, pinPos]}>
          <Pin color={pinColor} />
        </View>
      )}
    </View>
  );
}

// ─── SlotSlideshow ────────────────────────────────────────────────────────────
function SlotSlideshow({ images, slotIndex }: {
  images: ImageObject[];
  slotIndex: number;
}) {
  const [idx,    setIdx] = useState(0);
  const fadeAnim         = useRef(new Animated.Value(1)).current;
  const idxRef           = useRef(0);
  const imgsRef          = useRef(images);

  useEffect(() => { imgsRef.current = images; }, [images]);
  useEffect(() => { idxRef.current  = idx;    }, [idx]);

  useEffect(() => {
    images.forEach(img => prefetchImage(img.imageurl, isPdfFile(img)));
  }, [images]);

  useEffect(() => {
    if (images.length <= 1) return;
    const startDelay = slotIndex * 2000;
    const t = setTimeout(() => {
      const iv = setInterval(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: FADE_TIME, useNativeDriver: true })
          .start(() => {
            const next = (idxRef.current + 1) % imgsRef.current.length;
            setIdx(next);
            const nxt = imgsRef.current[(next + 1) % imgsRef.current.length];
            if (nxt) prefetchImage(nxt.imageurl, isPdfFile(nxt));
            Animated.timing(fadeAnim, { toValue: 1, duration: FADE_TIME, useNativeDriver: true }).start();
          });
      }, DISPLAY_TIME + FADE_TIME);
      return () => clearInterval(iv);
    }, startDelay);
    return () => clearTimeout(t);
  }, [images.length, slotIndex]);

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
        <ImageCell
          img={images[idx]}
          pinColor={PIN_PALETTE[(slotIndex + idx) % PIN_PALETTE.length]}
          slotIndex={slotIndex}
        />
      </Animated.View>
      {images.length > 1 && (
        <View style={st.slotCounter}>
          <Text style={st.slotCounterText}>{idx + 1}/{images.length}</Text>
        </View>
      )}
    </View>
  );
}

// ─── SlotCell ─────────────────────────────────────────────────────────────────
function SlotCell({ slot, idx }: { slot: { images: ImageObject[] }; idx: number }) {
  if (slot.images.length === 0)
    return <ImageCell img={null} pinColor={PIN_PALETTE[idx % PIN_PALETTE.length]} slotIndex={idx} />;
  if (slot.images.length === 1)
    return <ImageCell img={slot.images[0]} pinColor={PIN_PALETTE[idx % PIN_PALETTE.length]} slotIndex={idx} />;
  return <SlotSlideshow images={slot.images} slotIndex={idx} />;
}

// ─── GridView ─────────────────────────────────────────────────────────────────
function GridView({ rows, cols, slots }: { rows: number; cols: number; slots: any[] }) {
  return (
    <View style={{ flex: 1, gap: GAP }}>
      {Array.from({ length: rows }, (_, r) => (
        <View key={r} style={{ flex: 1, flexDirection: "row", gap: GAP }}>
          {Array.from({ length: cols }, (_, c) => {
            const i = r * cols + c;
            return (
              <View key={c} style={{ flex: 1 }}>
                <SlotCell slot={slots[i] ?? { images: [] }} idx={i} />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── FeatureLayoutView ────────────────────────────────────────────────────────
function FeatureLayoutView({ layout, slots }: { layout: FeatureLayout; slots: any[] }) {
  const safe = [slots[0] ?? { images: [] }, slots[1] ?? { images: [] }, slots[2] ?? { images: [] }];
  const Feature = <View style={{ flex: 1 }}><SlotCell slot={safe[0]} idx={0} /></View>;
  const SmallsV = <View style={{ flex: 1, gap: GAP }}><View style={{ flex: 1 }}><SlotCell slot={safe[1]} idx={1} /></View><View style={{ flex: 1 }}><SlotCell slot={safe[2]} idx={2} /></View></View>;
  const SmallsH = <View style={{ flex: 1, flexDirection: "row", gap: GAP }}><View style={{ flex: 1 }}><SlotCell slot={safe[1]} idx={1} /></View><View style={{ flex: 1 }}><SlotCell slot={safe[2]} idx={2} /></View></View>;

  if (layout === "f2") return <View style={{ flex: 1, flexDirection: "row", gap: GAP }}>{Feature}{SmallsV}</View>;
  if (layout === "2f") return <View style={{ flex: 1, flexDirection: "row", gap: GAP }}>{SmallsV}{Feature}</View>;
  if (layout === "ft") return <View style={{ flex: 1, gap: GAP }}>{Feature}{SmallsH}</View>;
  return <View style={{ flex: 1, gap: GAP }}>{SmallsH}{Feature}</View>;
}

// ─── DateTime Display ─────────────────────────────────────────────────────────
function DateTimeDisplay() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  const dateStr = now.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  return (
    <View style={{ alignItems: "flex-end" }}>
      <Text style={{ fontSize: isMobile ? 11 : 15, color: C.primary, fontWeight: "600", letterSpacing: 0.5 }}>{timeStr}</Text>
      <Text style={{ fontSize: isMobile ? 8  : 10, color: C.dimText, marginTop: 1 }}>{dateStr}</Text>
    </View>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ loaded, P, onPress }: { loaded: boolean; P: (w: string) => string; onPress: () => void }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  async function loadWeather() {
    try {
      const loc = await getLocation();
      if (!loc) return;
      const w = await fetchWeather(loc);
      if (w) {
        setWeather(w);
        await AsyncStorage.setItem("lastWeather", JSON.stringify(w));
      }
    } catch (e) {
      console.log("Weather fetch failed:", e);
    }
  }

  useEffect(() => {
    async function init() {
      try {
        const cached = await AsyncStorage.getItem("lastWeather");
        if (cached) setWeather(JSON.parse(cached));
      } catch {}
      loadWeather();
    }
    init();
    const iv = setInterval(loadWeather, 10 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <View style={[hSt.bar, { height: HEADER_H, paddingHorizontal: isMobile ? 10 : 20 }]}>
      <TouchableOpacity onPress={onPress} style={hSt.brand}>
        <View style={[hSt.logoBox, { width: isMobile ? 24 : 34, height: isMobile ? 24 : 34 }]}>
          <Image source={require("../../assets/images/logo.png")} style={{ width: isMobile ? 16 : 22, height: isMobile ? 16 : 22 }} />
        </View>
        <Text style={[hSt.appName, { fontFamily: loaded ? P("700") : undefined, fontSize: isMobile ? 12 : 16 }]}>
          Screenova
        </Text>
      </TouchableOpacity>
      <View style={{ flexDirection: "row", alignItems: "center", gap: isMobile ? 8 : 12 }}>
        {weather && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            {weather.icon && (
              <Image
                source={{ uri: `https:${weather.icon}` }}
                style={{ width: isMobile ? 14 : 20, height: isMobile ? 14 : 20 }}
              />
            )}
            <Text style={{ fontSize: isMobile ? 10 : 14, color: C.primary }}>{weather.temp}°C</Text>
          </View>
        )}
        <DateTimeDisplay />
      </View>
    </View>
  );
}

const hSt = StyleSheet.create({
  bar:     { backgroundColor: C.headerBg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: C.border },
  brand:   { flexDirection: "row", alignItems: "center", gap: 8 },
  logoBox: { borderRadius: 6, backgroundColor: "#1E3A8A", alignItems: "center", justifyContent: "center" },
  appName: { color: C.primary, letterSpacing: 1, fontWeight: "700" },
});

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TVDisplay() {
  const { width: SW, height: SH } = useWindowDimensions();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [loaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold });
  const P = (w: string) => (({ "400": "Poppins_400Regular", "600": "Poppins_600SemiBold", "700": "Poppins_700Bold" } as any)[w] || "System");

  const router = useRouter();
  const { deviceDisplay, fetchDeviceDisplay } = useContent();
  const lastTap = useRef(0);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(console.log);
      return () => { ScreenOrientation.unlockAsync().catch(console.log); };
    }
  }, []);

  const logout = async () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      try {
        const refreshToken = await getRefreshToken();
        if (refreshToken) await logoutApi(refreshToken);
      } catch (err) {
        console.log("Logout API error:", err);
      } finally {
        await deleteTokens();
        notifyAuthChange();
        router.replace("/login");
      }
    }
    lastTap.current = now;
  };

  const load = useCallback(async () => {
    try {
      const raw = await fetchDeviceDisplay();
      if (raw?.message === "No active content" || raw?.data === null) return;
    } catch (err) {
      console.log("Fetch error:", err);
    }
  }, []);

  useEffect(() => {
    load();
    timer.current = setInterval(load, 8000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [load]);

  const rawData           = deviceDisplay as DeviceDisplayResponse | null;
  const dd                = rawData?.data ?? null;
  const isNoActiveContent = rawData?.message === "No active content" || !rawData?.data;

  if (!rawData && !isNoActiveContent) {
    return (
      <View style={[st.root, { width: SW, height: SH }]}>
        <StatusBar hidden />
        <Header loaded={loaded} P={P} onPress={logout} />
        <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={C.primary} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 20, color: C.primary, fontWeight: "600" }}>Screenova</Text>
          <Text style={{ fontSize: 16, color: C.dimText, marginTop: 8 }}>Connecting to display…</Text>
        </View>
      </View>
    );
  }

  if (isNoActiveContent || !dd) {
    return (
      <View style={[st.root, { width: SW, height: SH }]}>
        <StatusBar hidden />
        <Header loaded={loaded} P={P} onPress={logout} />
        <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="cloud-offline-outline" size={72} color={C.primary} style={{ marginBottom: 24 }} />
          <Text style={{ fontSize: 24, color: C.primary, fontWeight: "600", marginBottom: 12 }}>No Active Content</Text>
          <Text style={{ fontSize: 16, color: C.dimText, textAlign: "center", paddingHorizontal: 40, lineHeight: 22 }}>
            Waiting for content to be assigned{'\n'}to this display
          </Text>
        </View>
      </View>
    );
  }

  const lv             = getLayoutValue(dd.screenLayout);
  const { rows, cols } = getLayoutDims(dd.screenLayout);
  const isFeature      = isFeatureLayout(lv);
  const slots          = isFeature ? normalizeSlots(dd.slots, 3) : normalizeSlots(dd.slots, rows * cols);

  return (
    <View style={[st.root, { width: SW, height: SH }]}>
      <StatusBar hidden />
      <Header loaded={loaded} P={P} onPress={logout} />
      <View style={{ flex: 1, backgroundColor: C.bg, padding: GAP }}>
        {isFeature
          ? <FeatureLayoutView layout={lv as FeatureLayout} slots={slots} />
          : <GridView rows={rows} cols={cols} slots={slots} />
        }
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  cellWrapper: { flex: 1, position: "relative", minHeight: isMobile ? 60 : 100 },
  floatCard:   {
    flex: 1, backgroundColor: C.bg, overflow: "hidden",
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },

  // ── Loader ──────────────────────────────────────────────────────────────────
  loaderOverlay:     { zIndex: 20, alignItems: "center", justifyContent: "center" },
  loaderSpinnerWrap: { alignItems: "center", justifyContent: "center", zIndex: 1 },
  loaderText:        { color: "rgba(255,255,255,0.55)", fontSize: isMobile ? 9 : 13, fontWeight: "500", letterSpacing: 0.4, marginTop: 6 },

  // ── Pin ─────────────────────────────────────────────────────────────────────
  pinAnchor:  { position: "absolute", zIndex: 40 },
  pinWrap:    { alignItems: "center" },
  pinHead:    { borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)" },
  pinNeedle:  { width: 1.5, backgroundColor: "#888", marginTop: -1 },
  pinGround:  { height: 2, borderRadius: 2, marginTop: 1, backgroundColor: "rgba(0,0,0,0.1)" },

  // ── PDF Badge ───────────────────────────────────────────────────────────────
  pdfBadge: {
    position: "absolute", top: 4, right: 4,
    backgroundColor: "rgba(245,158,11,0.9)",
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, flexDirection: "row", alignItems: "center", gap: 3, zIndex: 50,
  },
  pdfBadgeText: { color: "#fff", fontSize: isMobile ? 8 : 10, fontWeight: "700" },

  // ── Empty / counter ──────────────────────────────────────────────────────────
  emptySlot:       { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyIcon:       { fontSize: isMobile ? 16 : 28, opacity: 0.3 },
  slotCounter:     { position: "absolute", bottom: 4, right: 4, backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, zIndex: 50 },
  slotCounterText: { color: "#fff", fontSize: isMobile ? 8 : 10, fontWeight: "500" },
});