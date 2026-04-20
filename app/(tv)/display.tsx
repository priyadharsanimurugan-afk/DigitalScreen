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
type ImageObject = { imageId: number; imageurl: string; sortOrder: number };
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

const normalizeSlots = (rawSlots: Slot[] | undefined, count: number) =>
  Array.from({ length: count }, (_, i) => ({
    slotIndex: i,
    images: rawSlots?.find(s => s.slotIndex === i)?.images
      ? getSortedImages(rawSlots.find(s => s.slotIndex === i)!.images)
      : [],
  }));

// ─── Image prefetch cache ─────────────────────────────────────────────────────
const prefetchedUrls = new Set<string>();
function prefetchImage(url: string) {
  if (!url || prefetchedUrls.has(url)) return;
  prefetchedUrls.add(url);
  Image.prefetch(url).catch(() => {});
}

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

// ─── Slot Loader Overlay ──────────────────────────────────────────────────────
// Pulsing shimmer card + spinner shown while image is downloading.
// Fades out smoothly when the image fires onLoad.
function SlotLoader({ visible }: { visible: boolean }) {
  const opacity    = useRef(new Animated.Value(1)).current;
  const shimmer    = useRef(new Animated.Value(0.45)).current;
  const prevRef    = useRef(true);
  const shimmerRef = useRef<Animated.CompositeAnimation | null>(null);

  // Shimmer loop
  useEffect(() => {
    shimmerRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 0.75, duration: 850, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.45, duration: 850, useNativeDriver: true }),
      ])
    );
    shimmerRef.current.start();
    return () => shimmerRef.current?.stop();
  }, []);

  // Fade out when image is ready
  useEffect(() => {
    if (prevRef.current === visible) return;
    prevRef.current = visible;
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      if (!visible) shimmerRef.current?.stop();
    });
  }, [visible]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, st.loaderOverlay, { opacity }]}
    >
      {/* shimmer card */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { borderRadius: isMobile ? 4 : 10, backgroundColor: C.loaderBg, opacity: shimmer }]}
      />
      {/* spinner + label */}
      <View style={st.loaderSpinnerWrap}>
        <ActivityIndicator
          size={isMobile ? "small" : "large"}
          color="rgba(255,255,255,0.75)"
        />
        <Text style={st.loaderText}>Loading…</Text>
      </View>
    </Animated.View>
  );
}
function useMildAnimation(slotIndex: number) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 10000 + slotIndex * 300, // slight variation per slot
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: -1,
          duration: 10000 + slotIndex * 300,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, []); // 🚨 no dependency → never resets

  return anim;
}

// ─── Animation Hooks (mild) ───────────────────────────────────────────────────
function useSequentialFloat(slotIndex: number) {
  const floatY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(slotIndex * 600),
        Animated.timing(floatY, { toValue: isMobile ? -2 : -3, duration: 10000, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: isMobile ?  2 :  3, duration: 10000, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [slotIndex]);
  return floatY;
}

function useSequentialPulse(slotIndex: number) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(slotIndex * 600),
        Animated.timing(pulse, { toValue: 1.005, duration: 8000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.995, duration: 8000, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [slotIndex]);
  return pulse;
}

function useSequentialRotate(slotIndex: number) {
  const rotate = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(slotIndex * 600),
        Animated.timing(rotate, { toValue:  1, duration: 14000, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: -1, duration: 14000, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [slotIndex]);
  return rotate;
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

// Add this custom hook before ImageCell component
function useVeryMildAnimation(slotIndex: number) {
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Extremely subtle floating animation (±2px)
    const floatAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -2,
          duration: 8000 + (slotIndex * 500),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 2,
          duration: 8000 + (slotIndex * 500),
          useNativeDriver: true,
        }),
      ])
    );
    
    // Very gentle pulse animation (0.5% scale change)
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.002,
          duration: 6000 + (slotIndex * 400),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.998,
          duration: 6000 + (slotIndex * 400),
          useNativeDriver: true,
        }),
      ])
    );
    
    floatAnim.start();
    pulseAnim.start();
    
    return () => {
      floatAnim.stop();
      pulseAnim.stop();
    };
  }, [slotIndex]);
  
  return { translateY, scale };
}


// ─── ImageCell ────────────────────────────────────────────────────────────────
function ImageCell({ img, pinColor, slotIndex }: {
  img: ImageObject | null;
  pinColor: string;
  slotIndex: number;
}) {
  const [cellSize, setCellSize] = useState<{ w: number; h: number } | null>(null);
  const [natSize,  setNatSize]  = useState<{ w: number; h: number } | null>(null);
  const [loaded,   setLoaded]   = useState(false);
  const [imageLayout, setImageLayout] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

    // Add this line - the very mild animation hook
  const { translateY, scale } = useVeryMildAnimation(slotIndex);

  useEffect(() => {
    if (!img?.imageurl) return;
    let cancelled = false;
    setLoaded(false);
    prefetchImage(img.imageurl);
    fetchImageSize(img.imageurl, (w, h) => {
      if (!cancelled) setNatSize({ w, h });
    });
    return () => { cancelled = true; };
  }, [img?.imageurl]);

  // Calculate actual image position when contained
  useEffect(() => {
    if (cellSize && natSize) {
      const cellW = cellSize.w;
      const cellH = cellSize.h;
      const imgW = natSize.w;
      const imgH = natSize.h;
      
      const cellRatio = cellW / cellH;
      const imgRatio = imgW / imgH;
      
      let renderW, renderH, renderX, renderY;
      
      if (imgRatio > cellRatio) {
        renderW = cellW;
        renderH = cellW / imgRatio;
        renderX = 0;
        renderY = (cellH - renderH) / 2;
      } else {
        renderH = cellH;
        renderW = cellH * imgRatio;
        renderX = (cellW - renderW) / 2;
        renderY = 0;
      }
      
      setImageLayout({ x: renderX, y: renderY, w: renderW, h: renderH });
    }
  }, [cellSize, natSize]);

  const pinPos = cellSize && natSize
    ? computePinPos(cellSize.w, cellSize.h, natSize.w, natSize.h)
    : cellSize
      ? { left: cellSize.w / 2 - PIN_WIDTH / 2, top: isMobile ? -4 : -12 }
      : null;

 return (
    <View
      style={st.cellWrapper}
      onLayout={(e) =>
        setCellSize({
          w: e.nativeEvent.layout.width,
          h: e.nativeEvent.layout.height,
        })
      }
    >
      <View style={st.floatCard}>
        {img?.imageurl ? (
          <>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#2A3462" }]} />
            
            {imageLayout && (
              <Animated.View  // Changed from View to Animated.View
                style={{
                  position: "absolute",
                  left: imageLayout.x,
                  top: imageLayout.y,
                  width: imageLayout.w,
                  height: imageLayout.h,
                  overflow: "visible",
                  backgroundColor: "transparent",
                  transform: [
                    { translateY: translateY },
                    { scale: scale }
                  ],
                  ...Platform.select({
                    web: {
                      boxShadow: "8px 8px 20px rgba(255,255,255,0.28)"
                    },
                    ios: {
                      shadowColor: "#000000",
                      shadowOffset: { width: 0, height: 40 },
                      shadowOpacity: 0.65,
                      shadowRadius: 80,
                    },
                    android: {
                      elevation: 40,
                      shadowColor: "#071597",
                    },
                  }),
                }}
              >
                <Image
                  source={{ uri: img.imageurl }}
                  style={{
                    width: "100%",
                    height: "100%",
                    ...Platform.select({
                      ios: {
                        shadowColor: "#ffffff",
                        shadowOffset: { width: 0, height: -8 },
                        shadowOpacity: 0.75,
                        shadowRadius: 25,
                      },
                      android: {
                        borderWidth: 2,
                        borderColor: "rgba(255,255,255,0.3)",
                      },
                      web: {
                        boxShadow: "8px 8px 20px rgba(255,255,255,0.28)"
                      },
                    }),
                  }}
                  resizeMode="contain"
                  onLoad={() => setLoaded(true)}
                  onError={() => setLoaded(true)}
                />
              </Animated.View>
            )}
          </>
        ) : (
          <View style={st.emptySlot}>
            <Text style={st.emptyIcon}>📌</Text>
          </View>
        )}

        {img?.imageurl && <SlotLoader visible={!loaded} />}
      </View>

      {pinPos && loaded && img?.imageurl && (
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
  const [idx,    setIdx]   = useState(0);
  const fadeAnim           = useRef(new Animated.Value(1)).current;
  const idxRef             = useRef(0);
  const imgsRef            = useRef(images);

  useEffect(() => { imgsRef.current = images; }, [images]);
  useEffect(() => { idxRef.current  = idx;    }, [idx]);

  // Prefetch every image in this slot upfront
  useEffect(() => {
    images.forEach(img => prefetchImage(img.imageurl));
  }, [images]);

  useEffect(() => {
    if (images.length <= 1) return;
    const startDelay = slotIndex * 2000;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: FADE_TIME, useNativeDriver: true })
          .start(() => {
            const next = (idxRef.current + 1) % imgsRef.current.length;
            setIdx(next);
            prefetchImage(imgsRef.current[(next + 1) % imgsRef.current.length]?.imageurl);
            Animated.timing(fadeAnim, { toValue: 1, duration: FADE_TIME, useNativeDriver: true }).start();
          });
      }, DISPLAY_TIME + FADE_TIME);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(timeout);
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
    return <ImageCell img={null}           pinColor={PIN_PALETTE[idx % PIN_PALETTE.length]} slotIndex={idx} />;
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
  useEffect(() => {
    async function loadWeather() {
      const loc = await getLocation();
      if (!loc) return;
      const w = await fetchWeather(loc);
      if (w) setWeather(w);
    }
    loadWeather();
    const interval = setInterval(loadWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {weather?.icon && (
            <Image source={{ uri: `https:${weather.icon}` }} style={{ width: isMobile ? 14 : 20, height: isMobile ? 14 : 20 }} />
          )}
          <Text style={{ fontSize: isMobile ? 10 : 14, color: C.primary }}>
            {weather ? `${weather.temp}°C` : "--"}
          </Text>
        </View>
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
  const fade  = useRef(new Animated.Value(1)).current;
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
          <Text style={{ fontSize: 72, marginBottom: 24, color: C.primary }}>📭</Text>
          <Text style={{ fontSize: 24, color: C.primary, fontWeight: "600", marginBottom: 12 }}>No Active Content</Text>
          <Text style={{ fontSize: 16, color: C.dimText, textAlign: "center", paddingHorizontal: 40, lineHeight: 22 }}>
            Waiting for content to be assigned{'\n'}to this display
          </Text>
        </View>
      </View>
    );
  }

  const lv        = getLayoutValue(dd.screenLayout);
  const { rows, cols } = getLayoutDims(dd.screenLayout);
  const isFeature = isFeatureLayout(lv);
  const slots     = isFeature ? normalizeSlots(dd.slots, 3) : normalizeSlots(dd.slots, rows * cols);

  return (
    <View style={[st.root, { width: SW, height: SH }]}>
      <StatusBar hidden />
      <Header loaded={loaded} P={P} onPress={logout} />
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <Animated.View style={{ opacity: fade, flex: 1, padding: GAP }}>
          {isFeature
            ? <FeatureLayoutView layout={lv as FeatureLayout} slots={slots} />
            : <GridView rows={rows} cols={cols} slots={slots} />
          }
        </Animated.View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#2A3462" },
  cellWrapper: { flex: 1, position: "relative", minHeight: isMobile ? 60 : 100 },
  floatCard: {
    flex: 1, backgroundColor: "#2A3462", borderRadius: isMobile ? 4 : 10, overflow: "visible",
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },

  // ── Loader ──────────────────────────────────────────────────────────────────
  loaderOverlay: {
    borderRadius:   isMobile ? 4 : 10,
    overflow:       "hidden",
    zIndex:         20,
    alignItems:     "center",
    justifyContent: "center",
  },
  loaderSpinnerWrap: {
    alignItems:     "center",
    justifyContent: "center",
  },
  loaderText: {
    color:       "rgba(255,255,255,0.55)",
    fontSize:    isMobile ? 9 : 13,
    fontWeight:  "500",
    letterSpacing: 0.4,
    marginTop:   6,
  },

  // ── Pin ─────────────────────────────────────────────────────────────────────
  pinAnchor:  { position: "absolute", zIndex: 40 },
  pinWrap:    { alignItems: "center" },
  pinHead:    { borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)" },
  pinNeedle:  { width: 1.5, backgroundColor: "#888", marginTop: -1 },
  pinGround:  { height: 2, borderRadius: 2, marginTop: 1, backgroundColor: "rgba(0,0,0,0.1)" },

  // ── Empty / counter ──────────────────────────────────────────────────────────
  emptySlot:       { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyIcon:       { fontSize: isMobile ? 16 : 28, opacity: 0.3 },
  slotCounter: {
    position: "absolute", bottom: 4, right: 4,
    backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: 6, zIndex: 50,
  },
  slotCounterText: { color: "#fff", fontSize: isMobile ? 8 : 10, fontWeight: "500" },
});