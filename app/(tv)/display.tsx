// app/(tv)/display.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, Image, StyleSheet, useWindowDimensions,
  Animated, StatusBar, Platform, LayoutChangeEvent,
  TouchableOpacity, Dimensions,
} from "react-native";
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { useContent } from "../../hooks/useTvDisplay";
import { useRouter } from "expo-router";
import { clearTokens } from "@/services/api";
import { notifyAuthChange } from "@/utils/authEvents";
import * as ScreenOrientation from 'expo-screen-orientation';
import { getLocation, fetchWeather, WeatherData } from "@/utils/weather";
// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary: "#1E3A8A", secondary: "#8B4513",
  bg: "#EDF1FE", headerBg: "#FFFFFF", footerBg: "#FFFFFF",
  dimText: "#6B5B4F", border: "rgba(30,58,138,0.15)",
};

const PIN_PALETTE = ["#D94035","#1E3A8A","#8B4513","#1A7A4A","#7B3FA0","#C75B15","#1A6B8A","#3D3D3D"];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isMobile = SCREEN_WIDTH < 768 || Platform.OS !== 'web';
const GAP = isMobile ? 4 : 12;
const PIN_WIDTH = isMobile ? 14 : 28;
const HEADER_H = isMobile ? 40 : 56;
const FOOTER_H = isMobile ? 40 : 60;

// ─── Types ────────────────────────────────────────────────────────────────────
type ImageObject = { imageId: number; imageurl: string; sortOrder: number };
type Slot = { slotIndex: number; images: ImageObject[] };
type ScreenLayoutObject = { label: string; value: string; rows: number; cols: number; slots: number };
type DeviceDisplay = {
  deviceId: number | any; id: number; title: string; description: string;
  screenLayout: string | ScreenLayoutObject;
  images?: ImageObject[] | null;
  slots?: Slot[];
};
type DeviceDisplayResponse = {
  message: string;
  data: DeviceDisplay | null;
};


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

const unwrapDisplay = (raw: any): DeviceDisplay | null => {
  if (!raw) return null;
  const d = raw?.data ?? raw;
  return d?.id ? d as DeviceDisplay : null;
};

const normalizeSlots = (rawSlots: Slot[] | undefined, count: number) =>
  Array.from({ length: count }, (_, i) => ({
    slotIndex: i,
    images: rawSlots?.find(s => s.slotIndex === i)?.images 
      ? getSortedImages(rawSlots.find(s => s.slotIndex === i)!.images) 
      : [],
  }));

// ─── Image size cache ─────────────────────────────────────────────────────────
const imageSizeCache: Record<string, { w: number; h: number }> = {};
function fetchImageSize(url: string, cb: (w: number, h: number) => void) {
  if (imageSizeCache[url]) return cb(imageSizeCache[url].w, imageSizeCache[url].h);
  Image.getSize(url, (w, h) => { imageSizeCache[url] = { w, h }; cb(w, h); }, () => cb(100, 100));
}

function computePinPos(cW: number, cH: number, nW: number, nH: number) {
  const cr = cW / cH, ir = nW / nH;
  const rW = ir > cr ? cW : cH * ir;
  const rH = ir > cr ? cW / ir : cH;
  return { left: (cW - rW) / 2 + rW / 2 - PIN_WIDTH / 2, top: (cH - rH) / 2 - (isMobile ? 4 : 12) };
}

// ─── Ultra-Mild Float Animation ───────────────────────────────────────────────
function useGentleFloat() {
  const floatY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: isMobile ? -0.8 : -1.2, duration: 5000, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: isMobile ? 0.8 : 1.2, duration: 5000, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return floatY;
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
function ImageCell({ img, pinColor }: { img: ImageObject | null; pinColor: string }) {
  const [cellSize, setCellSize] = useState<{ w: number; h: number } | null>(null);
  const [natSize, setNatSize] = useState<{ w: number; h: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const floatY = useGentleFloat();

  useEffect(() => {
    if (!img?.imageurl) return;
    let cancel = false;
    setLoaded(false);
    fetchImageSize(img.imageurl, (w, h) => { if (!cancel) setNatSize({ w, h }); });
    return () => { cancel = true; };
  }, [img?.imageurl]);

  const pinPos = cellSize && natSize
    ? computePinPos(cellSize.w, cellSize.h, natSize.w, natSize.h)
    : cellSize ? { left: cellSize.w / 2 - PIN_WIDTH / 2, top: isMobile ? -4 : -12 } : null;

  return (
    <View style={st.cellWrapper} onLayout={(e) => setCellSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <View style={st.floatCard}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateY: floatY }] }]}>
          {img?.imageurl ? (
            <Image source={{ uri: img.imageurl }} style={StyleSheet.absoluteFill} resizeMode="contain" onLoad={() => setLoaded(true)} />
          ) : (
            <View style={st.emptySlot}><Text style={st.emptyIcon}>📌</Text></View>
          )}
        </Animated.View>
      </View>
      {pinPos && loaded && img?.imageurl && (
        <View pointerEvents="none" style={[st.pinAnchor, pinPos]}><Pin color={pinColor} /></View>
      )}
    </View>
  );
}

// ─── SlotSlideshow - Professional Crossfade ───────────────────────────────────
function SlotSlideshow({ images, slotIndex }: { images: ImageObject[]; slotIndex: number }) {
  const [idx, setIdx] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const idxRef = useRef(0);
  const imgsRef = useRef(images);

  useEffect(() => { imgsRef.current = images; }, [images]);
  useEffect(() => { idxRef.current = idx; }, [idx]);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      Animated.timing(fade, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setIdx((idxRef.current + 1) % imgsRef.current.length);
        Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
        <ImageCell img={images[idx]} pinColor={PIN_PALETTE[(slotIndex + idx) % PIN_PALETTE.length]} />
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
  if (slot.images.length === 0) return <ImageCell img={null} pinColor={PIN_PALETTE[idx % PIN_PALETTE.length]} />;
  if (slot.images.length === 1) return <ImageCell img={slot.images[0]} pinColor={PIN_PALETTE[idx % PIN_PALETTE.length]} />;
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
      <Text style={{ fontSize: isMobile ? 8 : 10, color: C.dimText, marginTop: 1 }}>{dateStr}</Text>
    </View>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ loaded, P, onPress }: { loaded: boolean; P: (w: string) => string; onPress: () => void }) {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    let interval: any;

    async function loadWeather() {
      const loc = await getLocation();
      if (!loc) return;

      const w = await fetchWeather(loc);
      if (w) setWeather(w);
    }

    loadWeather();

    // refresh every 10 mins
    interval = setInterval(loadWeather, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[hSt.bar, { height: HEADER_H, paddingHorizontal: isMobile ? 10 : 20 }]}>
      
      {/* LEFT */}
      <TouchableOpacity onPress={onPress} style={hSt.brand}>
        <View style={[hSt.logoBox, { width: isMobile ? 24 : 34, height: isMobile ? 24 : 34 }]}>
          <Image source={require("../../assets/images/logo.png")} style={{ width: isMobile ? 16 : 22, height: isMobile ? 16 : 22 }} />
        </View>
        <Text style={[hSt.appName, { fontFamily: loaded ? P("700") : undefined, fontSize: isMobile ? 12 : 16 }]}>
          Screenova
        </Text>
      </TouchableOpacity>

      {/* RIGHT */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: isMobile ? 8 : 12 }}>

        {/* 🌦️ WEATHER */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {weather?.icon && (
            <Image
              source={{ uri: `https:${weather.icon}` }}
              style={{ width: isMobile ? 14 : 20, height: isMobile ? 14 : 20 }}
            />
          )}
          <Text style={{ fontSize: isMobile ? 10 : 14, color: C.primary }}>
            {weather ? `${weather.temp}°C` : "--"}
          </Text>
        </View>

        {/* ⏰ TIME */}
        <DateTimeDisplay />
      </View>
    </View>
  );
}

const hSt = StyleSheet.create({
  bar: { backgroundColor: C.headerBg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: C.border },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoBox: { borderRadius: 6, backgroundColor: C.primary, alignItems: "center", justifyContent: "center" },
  appName: { color: C.primary, letterSpacing: 1, fontWeight: "700" },
});

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer({ count }: { count: number }) {
  return (
    <View style={[fSt.bar, { height: FOOTER_H, paddingHorizontal: isMobile ? 10 : 20 }]}>
      <Text style={[fSt.chip, { fontSize: isMobile ? 9 : 11 }]}>{count} Item{count !== 1 ? 's' : ''}</Text>
      <View style={{ width: 10 }} />
    </View>
  );
}
const fSt = StyleSheet.create({
  bar: { backgroundColor: C.footerBg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.border },
  chip: { borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: "rgba(30,58,138,0.05)", color: C.primary },
});

// ─── Main ─────────────────────────────────────────────────────────────────────
// ─── Main ─────────────────────────────────────────────────────────────────────
export default function TVDisplay() {
  const { width: SW, height: SH } = useWindowDimensions();
  const fade = useRef(new Animated.Value(1)).current;
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
      await clearTokens();
      notifyAuthChange();
      router.replace("/login");
    }
    lastTap.current = now;
  };

  const load = useCallback(async () => {
    try {
      const raw = await fetchDeviceDisplay();
      
      // Handle "No active content" case
      if (raw?.message === "No active content" || raw?.data === null) {
        // We will handle this in render as empty content
        return;
      }
    } catch (err) {
      console.log("Fetch error:", err);
    }
  }, []);

  useEffect(() => {
    load();
    timer.current = setInterval(load, 8000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [load]);

  // ─── Process Display Data ─────────────────────────────────────────────────
const rawData = deviceDisplay as DeviceDisplayResponse | null;

const dd = rawData?.data ?? null;

const isNoActiveContent =
  rawData?.message === "No active content" || !rawData?.data;


  // ─── Initial Loading / No Device ──────────────────────────────────────────
  if (!rawData && !isNoActiveContent) {
    return (
      <View style={[st.root, { width: SW, height: SH }]}>
        <StatusBar hidden />
        <Header loaded={loaded} P={P} onPress={logout} />
        <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📌</Text>
          <Text style={{ fontSize: 20, color: C.primary, fontWeight: "600" }}>Screenova</Text>
          <Text style={{ fontSize: 16, color: C.dimText, marginTop: 8 }}>Connecting to display...</Text>
        </View>
        <Footer count={0} />
      </View>
    );
  }

  // ─── No Active Content Screen ─────────────────────────────────────────────
  if (isNoActiveContent || !dd) {
    return (
      <View style={[st.root, { width: SW, height: SH }]}>
        <StatusBar hidden />
        <Header loaded={loaded} P={P} onPress={logout} />
        
        <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 72, marginBottom: 24 }}>📭</Text>
          <Text style={{ fontSize: 24, color: C.primary, fontWeight: "600", marginBottom: 12 }}>
            No Active Content
          </Text>
          <Text style={{ fontSize: 16, color: C.dimText, textAlign: "center", paddingHorizontal: 40, lineHeight: 22 }}>
            Waiting for content to be assigned{'\n'}to this display
          </Text>
        </View>

        <Footer count={0} />
      </View>
    );
  }

  // ─── Normal Content Screen ────────────────────────────────────────────────
  const lv = getLayoutValue(dd.screenLayout);
  const { rows, cols } = getLayoutDims(dd.screenLayout);
  const hasSlots = (dd.slots?.length ?? 0) > 0;
  const isFeature = isFeatureLayout(lv);
  const slots = isFeature ? normalizeSlots(dd.slots, 3) : normalizeSlots(dd.slots, rows * cols);
  const total = hasSlots ? slots.reduce((n, s) => n + s.images.length, 0) : getSortedImages(dd.images).length;

  return (
    <View style={[st.root, { width: SW, height: SH }]}>
      <StatusBar hidden />
      <Header loaded={loaded} P={P} onPress={logout} />
      
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <Animated.View style={{ opacity: fade, flex: 1, padding: GAP }}>
          {isFeature ? (
            <FeatureLayoutView layout={lv as FeatureLayout} slots={slots} />
          ) : (
            <GridView rows={rows} cols={cols} slots={slots} />
          )}
        </Animated.View>
      </View>

      <Footer count={total} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EDF1FE" },
  cellWrapper: { flex: 1, position: "relative", minHeight: isMobile ? 60 : 100 },
  floatCard: {
    flex: 1, backgroundColor: "#FFF", borderRadius: isMobile ? 4 : 10, overflow: "hidden",
    ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 }, android: { elevation: 2 } }),
  },
  pinAnchor: { position: "absolute", zIndex: 40 },
  pinWrap: { alignItems: "center" },
  pinHead: { borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)" },
  pinNeedle: { width: 1.5, backgroundColor: "#888", marginTop: -1 },
  pinGround: { height: 2, borderRadius: 2, marginTop: 1, backgroundColor: "rgba(0,0,0,0.1)" },
  emptySlot: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyIcon: { fontSize: isMobile ? 16 : 28, opacity: 0.3 },
  slotCounter: {
    position: "absolute", bottom: 4, right: 4,
    backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: 6, zIndex: 50,
  },
  slotCounterText: { color: "#fff", fontSize: isMobile ? 8 : 10, fontWeight: "500" },
});