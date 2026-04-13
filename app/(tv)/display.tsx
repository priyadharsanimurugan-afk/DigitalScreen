// app/(tv)/display.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  useWindowDimensions,
  Animated,
  StatusBar,
  Platform,
  LayoutChangeEvent,
  TouchableOpacity,
  PanResponder,
} from "react-native";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { useContent } from "../../hooks/useTvDisplay";
import { router } from "expo-router";
import { clearTokens } from "@/services/api";
import { notifyAuthChange } from "@/utils/authEvents";

// ─── Design Tokens ─────────────────────────────────────────────────────────────
const C = {
  // Your theme colors
  primary: "#1E3A8A",
  primaryDark: "#162d6e",
  secondary: "#8B4513",
  secondaryLight: "#A0522D",
  
  // Light theme background
  bg: "#EDF1FE",
  headerBg: "#FFFFFF",
  footerBg: "#FFFFFF",
  cork: "#D2B48C",
  corkLight: "#DEB887",
  accent: "#1E3A8A",
  accentDim: "#8B4513",
  navy: "#1E3A8A",
  white: "#2C2C2C",
  cream: "#4A3728",
  dimText: "#6B5B4F",
  border: "rgba(30,58,138,0.15)",
  glow: "rgba(30,58,138,0.05)",
};

const PIN_PALETTE = [
  "#D94035", // crimson
  "#1E3A8A", // navy
  "#8B4513", // brown
  "#1A7A4A", // forest
  "#7B3FA0", // purple
  "#C75B15", // burnt orange
  "#1A6B8A", // teal
  "#3D3D3D", // charcoal
];

const GAP = 12;
const PIN_WIDTH = 28;
const HEADER_H = 56;
const FOOTER_H = 60;

// ─── Types ────────────────────────────────────────────────────────────────────
type ImageObject = {
  imageId: number;
  imageurl: string;
  mimeType?: string;
  sortOrder: number;
};

type ScreenLayoutObject = {
  label: string;
  value: string;
  rows: number;
  cols: number;
  slots: number;
};

type DeviceDisplay = {
  id: number;
  title: string;
  description: string;
  screenLayout: string | ScreenLayoutObject;
  images?: ImageObject[] | null;
};

type FeatureLayout = "f2" | "2f" | "ft" | "fb";
const FEATURE_LAYOUTS: FeatureLayout[] = ["f2", "2f", "ft", "fb"];

// ─── Weather Component ────────────────────────────────────────────────────────
function WeatherWidget({ loaded, P }: { loaded: boolean; P: (w: string) => string }) {
  const [weather, setWeather] = useState({ temp: 24, condition: "Sunny", icon: "☀️" });
  
  useEffect(() => {
    // Simulate weather update - replace with actual weather API
    const interval = setInterval(() => {
      const conditions = [
        { temp: 24, condition: "Sunny", icon: "☀️" },
        { temp: 22, condition: "Partly Cloudy", icon: "⛅" },
        { temp: 20, condition: "Cloudy", icon: "☁️" },
        { temp: 26, condition: "Clear", icon: "🌤️" },
      ];
      setWeather(conditions[Math.floor(Math.random() * conditions.length)]);
    }, 300000); // Update every 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={weatherSt.wrap}>
      <Text style={weatherSt.icon}>{weather.icon}</Text>
      <View style={weatherSt.info}>
        <Text style={[weatherSt.temp, { fontFamily: loaded ? P("600") : undefined }]}>
          {weather.temp}°C
        </Text>
        <Text style={[weatherSt.condition, { fontFamily: loaded ? P("400") : undefined }]}>
          {weather.condition}
        </Text>
      </View>
    </View>
  );
}

const weatherSt = StyleSheet.create({
  wrap: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8,
    backgroundColor: "rgba(30,58,138,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  icon: { fontSize: 20 },
  info: { alignItems: "flex-start" },
  temp: { fontSize: 14, color: C.primary, fontWeight: "600" },
  condition: { fontSize: 10, color: C.dimText },
});

// ─── Live Clock with Date ─────────────────────────────────────────────────────
function DateTimeWidget({ loaded, P }: { loaded: boolean; P: (w: string) => string }) {
  const [now, setNow] = useState(new Date());
  
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString([], { 
    hour: "2-digit", 
    minute: "2-digit", 
    second: "2-digit",
    hour12: true 
  });
  
  const dateStr = now.toLocaleDateString([], { 
    weekday: "long", 
    day: "numeric", 
    month: "long", 
    year: "numeric" 
  });

  return (
    <View style={dtSt.wrap}>
      <Text style={[dtSt.time, { fontFamily: loaded ? P("700") : undefined }]}>
        {timeStr}
      </Text>
      <Text style={[dtSt.date, { fontFamily: loaded ? P("400") : undefined }]}>
        {dateStr}
      </Text>
    </View>
  );
}

const dtSt = StyleSheet.create({
  wrap: { alignItems: "flex-end" },
  time: { fontSize: 16, color: C.primary, letterSpacing: 1.5 },
  date: { fontSize: 10, color: C.dimText, letterSpacing: 0.5, marginTop: 2 },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getSortedImages = (imgs?: ImageObject[] | null): ImageObject[] =>
  imgs ? [...imgs].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) : [];

const getLayoutValue = (layout: string | ScreenLayoutObject): string =>
  typeof layout === "object" && layout !== null ? layout.value : layout;

const getLayoutDims = (layout: string | ScreenLayoutObject): { rows: number; cols: number } => {
  if (typeof layout === "object" && layout !== null) {
    return { rows: layout.rows, cols: layout.cols };
  }
  if (layout?.includes("x")) {
    const [r, c] = layout.split("x").map(Number);
    if (r > 0 && c > 0) return { rows: r, cols: c };
  }
  return { rows: 1, cols: 1 };
};

const isFeatureLayout = (v: string): v is FeatureLayout =>
  FEATURE_LAYOUTS.includes(v as FeatureLayout);

const lighten = (hex: string): string => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${Math.min(255, ((n >> 16) & 0xff) + 40)},${Math.min(255, ((n >> 8) & 0xff) + 40)},${Math.min(255, (n & 0xff) + 40)})`;
};
const lastTapRef = useRef<number>(0);

const handleLogoPress = async () => {
  const now = Date.now();

  if (lastTapRef.current && now - lastTapRef.current < 300) {
  await clearTokens();

  // 🔥 2. Notify layout
  notifyAuthChange();

  // 🔥 3. Go to login
  router.replace("/login");
  }

  lastTapRef.current = now;
};
// ─── Image size cache ─────────────────────────────────────────────────────────
const imageSizeCache: Record<string, { w: number; h: number }> = {};

function fetchImageSize(url: string, onSize: (w: number, h: number) => void): void {
  if (imageSizeCache[url]) {
    onSize(imageSizeCache[url]!.w, imageSizeCache[url]!.h);
    return;
  }
  Image.getSize(
    url,
    (w, h) => { imageSizeCache[url] = { w, h }; onSize(w, h); },
    () => {}
  );
}

// ─── Pin position math ────────────────────────────────────────────────────────
function computePinPosition(cellW: number, cellH: number, natW: number, natH: number): { left: number; top: number } {
  const cellRatio = cellW / cellH;
  const imgRatio = natW / natH;
  let renderedW: number, renderedH: number;
  if (imgRatio > cellRatio) {
    renderedW = cellW; renderedH = cellW / imgRatio;
  } else {
    renderedH = cellH; renderedW = cellH * imgRatio;
  }
  return {
    left: (cellW - renderedW) / 2 + renderedW / 2 - PIN_WIDTH / 2,
    top: (cellH - renderedH) / 2 - 12,
  };
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ title, loaded, P, onLogout }: { title?: string; loaded: boolean; P: (w: string) => string; onLogout?: () => void }) {
  const pulse = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={hSt.bar}>
      {/* Left: brand and weather */}
      <View style={hSt.leftSection}>
        <View style={hSt.brand}>
          <View style={hSt.logoBox}>
          <TouchableOpacity onPress={handleLogoPress} activeOpacity={0.8}>
          <View style={hSt.logoBox}>
            <Image
              source={require("../../assets/images/logo.png")} // ✅ your logo
              style={{ width: 22, height: 22 }}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>

          </View>
          <View>
            <Text style={[hSt.appName, { fontFamily: loaded ? P("700") : undefined }]}>
              Screenova
            </Text>
            <View style={hSt.liveRow}>
              <Animated.View style={[hSt.liveDot, { opacity: pulse }]} />
              <Text style={[hSt.liveText, { fontFamily: loaded ? P("400") : undefined }]}>LIVE</Text>
            </View>
          </View>
        </View>
        
    
      </View>

      {/* Right: weather and logout */}
      <View style={hSt.rightSection}>
        <WeatherWidget loaded={loaded} P={P} />
        
      </View>
    </View>
  );
}

const hSt = StyleSheet.create({
  bar: {
    height: HEADER_H,
    backgroundColor: C.headerBg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  leftSection: { flexDirection: "row", alignItems: "center", gap: 20 },
  rightSection: { flexDirection: "row", alignItems: "center", gap: 16 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoBox: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: C.primary,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: C.secondary,
  },
  logoIcon: { fontSize: 16 },
  appName: { fontSize: 16, color: C.primary, letterSpacing: 1.5, fontWeight: "700" },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#3ECF6A" },
  liveText: { fontSize: 8, color: "#3ECF6A", letterSpacing: 2 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(30,58,138,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
  },
  logoutIcon: { fontSize: 16 },
  logoutText: { fontSize: 12, color: C.primary },
  titleWrap: { alignItems: "center", flex: 1 },
  title: { fontSize: 14, color: C.cream, letterSpacing: 0.8 },
  titleUnderline: {
    height: 2, width: "80%", backgroundColor: C.secondary,
    borderRadius: 1, marginTop: 3,
  },
});

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer({ imageCount, loaded, P }: {
  imageCount: number; loaded: boolean; P: (w: string) => string;
}) {
  return (
    <View style={fSt.bar}>
      <View style={fSt.left}>
        <View style={fSt.chip}>
          <Text style={[fSt.chipText, { fontFamily: loaded ? P("600") : undefined }]}>
            {imageCount} {imageCount === 1 ? "Item" : "Items"}
          </Text>
        </View>
      </View>
      
      {/* Date and Time in Footer */}
      <DateTimeWidget loaded={loaded} P={P} />
    </View>
  );
}

const fSt = StyleSheet.create({
  bar: {
    height: FOOTER_H,
    backgroundColor: C.footerBg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: C.border,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  left: { flexDirection: "row", gap: 8 },
  chip: {
    borderWidth: 1, borderColor: C.border,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
    backgroundColor: "rgba(30,58,138,0.05)",
  },
  chipText: { fontSize: 11, color: C.primary, letterSpacing: 0.6 },
});

// ─── Cork Board Background ────────────────────────────────────────────────────
function CorkBoardArea({ children }: { children: React.ReactNode }) {
  return (
    <View style={cbSt.wrap}>
      {Array.from({ length: 20 }, (_, i) => (
        <View
          key={i}
          style={[
            cbSt.grain,
            {
              top: `${(i * 17 + 5) % 100}%` as any,
              left: `${(i * 31 + 10) % 100}%` as any,
              opacity: 0.03 + (i % 4) * 0.01,
              width: 3 + (i % 3),
              height: 3 + (i % 3),
            },
          ]}
        />
      ))}
      {children}
    </View>
  );
}

const cbSt = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg, overflow: "hidden", position: "relative" },
  grain: { position: "absolute", borderRadius: 99, backgroundColor: C.corkLight },
});

// ─── Floating / Wind animation ────────────────────────────────────────────────
// ─── Mild Floating + Subtle Shake Animation Hook ─────────────────────────────────
// ─── Mild Floating + Left-Right Shake Animation ─────────────────────────────
function useFloatAnim(seed: number = 0) {
  const floatY = useRef(new Animated.Value(0)).current;
  const floatX = useRef(new Animated.Value(0)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const baseDuration = 4200 + (seed % 6) * 500;
    const shakeAmp = 2.2; // Mild shake for notice board feel

    Animated.loop(
      Animated.parallel([
        // Gentle up-down float
        Animated.sequence([
          Animated.timing(floatY, { toValue: -3.5, duration: baseDuration, useNativeDriver: true }),
          Animated.timing(floatY, { toValue: 2.5, duration: baseDuration * 0.9, useNativeDriver: true }),
          Animated.timing(floatY, { toValue: 0, duration: baseDuration * 0.95, useNativeDriver: true }),
        ]),

        // Very light natural drift
        Animated.sequence([
          Animated.timing(floatX, { toValue: 1.8, duration: baseDuration * 1.2, useNativeDriver: true }),
          Animated.timing(floatX, { toValue: -1.5, duration: baseDuration * 0.95, useNativeDriver: true }),
          Animated.timing(floatX, { toValue: 0, duration: baseDuration, useNativeDriver: true }),
        ]),

        // ─── Only Left ↔ Right Shake (as requested) ───
        Animated.sequence([
          Animated.timing(shakeX, { toValue: shakeAmp, duration: 220, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: -shakeAmp * 0.85, duration: 190, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: shakeAmp * 0.6, duration: 240, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: -shakeAmp * 0.4, duration: 180, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: 0, duration: 210, useNativeDriver: true }),
        ]),

        // Very soft rotation
        Animated.sequence([
          Animated.timing(rotate, { toValue: 0.7, duration: baseDuration * 1.1, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: -0.6, duration: baseDuration * 0.9, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 0, duration: baseDuration * 0.95, useNativeDriver: true }),
        ]),

        // Subtle breathing scale
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.012, duration: baseDuration * 0.85, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.99, duration: baseDuration * 1.05, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: baseDuration * 0.9, useNativeDriver: true }),
        ]),
      ])
    ).start();

    return () => {
      floatY.stopAnimation();
      floatX.stopAnimation();
      shakeX.stopAnimation();
      rotate.stopAnimation();
      scale.stopAnimation();
    };
  }, [seed]);

  const rotDeg = rotate.interpolate({ inputRange: [-1, 1], outputRange: ["-0.8deg", "0.8deg"] });

  return { floatY, floatX, shakeX, rotDeg, scale };
}

// ─── Parallax Tilt Effect Hook ────────────────────────────────────────────────
function useParallaxTilt(intensity: number = 12) {
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Reset on tap
        Animated.spring(tiltX, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 40
        }).start();
        Animated.spring(tiltY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 40
        }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        const { moveX, moveY, x0, y0 } = gestureState;
        const relativeX = (moveX - x0) / 200;
        const relativeY = (moveY - y0) / 200;
        
        tiltX.setValue(relativeY * intensity);
        tiltY.setValue(-relativeX * intensity);
      },
      onPanResponderRelease: () => {
        // Spring back to center
        Animated.spring(tiltX, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 40
        }).start();
        Animated.spring(tiltY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 40
        }).start();
      },
    })
  ).current;

  const tiltTransform = [
    { perspective: 1000 },
    { rotateX: tiltX.interpolate({
      inputRange: [-intensity, intensity],
      outputRange: [`-${intensity}deg`, `${intensity}deg`]
    })},
    { rotateY: tiltY.interpolate({
      inputRange: [-intensity, intensity],
      outputRange: [`-${intensity}deg`, `${intensity}deg`]
    })},
    { translateZ: 10 }
  ];

  return { panResponder, tiltTransform };
}

// ─── Pin ──────────────────────────────────────────────────────────────────────
function Pin({ color }: { color: string }) {
  return (
    <View style={st.pinWrap} pointerEvents="none">
      <View style={[st.pinGlow, { backgroundColor: color + "33" }]} />
      <View style={[st.pinHead, { backgroundColor: color, borderColor: lighten(color) }]}>
        <View style={st.pinShine} />
      </View>
      <View style={st.pinNeedle} />
      <View style={[st.pinGround, { backgroundColor: "rgba(0,0,0,0.15)" }]} />
    </View>
  );
}

// ─── ImageCell with Parallax Tilt ─────────────────────────────────────────────
function ImageCell({ img, pinColor, floatSeed }: {
  img: ImageObject | null; 
  pinColor: string; 
  floatSeed: number;
}) {
  const [cellSize, setCellSize] = useState<{ w: number; h: number } | null>(null);
  const [natSize, setNatSize] = useState<{ w: number; h: number } | null>(null);
  
  const { floatY, floatX, shakeX, rotDeg, scale } = useFloatAnim(floatSeed);
  const { panResponder } = useParallaxTilt(6);

  const onCellLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setCellSize({ w: width, h: height });
  }, []);

  useEffect(() => {
    if (!img?.imageurl) return;
    let cancelled = false;
    fetchImageSize(img.imageurl, (w, h) => { if (!cancelled) setNatSize({ w, h }); });
    return () => { cancelled = true; };
  }, [img?.imageurl]);

  let pinPos = null;
  if (cellSize) {
    pinPos = (natSize && natSize.w > 0 && natSize.h > 0)
      ? computePinPosition(cellSize.w, cellSize.h, natSize.w, natSize.h)
      : { left: cellSize.w / 2 - PIN_WIDTH / 2, top: -12 };
  }

  return (
    <View style={st.cellWrapper} onLayout={onCellLayout}>
      <View style={st.floatCard}>
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                { translateY: floatY },
                { translateX: floatX },
                { translateX: shakeX },   // ← Only left-right shake
                { rotate: rotDeg },
                { scale },
              ],
            },
          ]}
        >
          {img?.imageurl ? (
            <Image
              source={{ uri: img.imageurl }}
              style={StyleSheet.absoluteFill}
              resizeMode="contain"
            />
          ) : (
            <View style={st.emptySlot}>
              <Text style={st.emptyIcon}>📌</Text>
            </View>
          )}
        </Animated.View>
      </View>

      {pinPos && (
        <View
          pointerEvents="none"
          style={[st.pinAnchor, { top: pinPos.top, left: pinPos.left }]}
        >
          <Pin color={pinColor} />
        </View>
      )}
    </View>
  );
}
// ─── Grid ─────────────────────────────────────────────────────────────────────
function GridView({ rows, cols, images }: { rows: number; cols: number; images: ImageObject[] }) {
  return (
    <View style={{ flex: 1, gap: GAP }}>
      {Array.from({ length: rows }, (_, r) => (
        <View key={r} style={{ flex: 1, flexDirection: "row", gap: GAP }}>
          {Array.from({ length: cols }, (_, c) => {
            const idx = r * cols + c;
            return (
              <View key={c} style={{ flex: 1 }}>
                <View style={st.paperCurl} />
                <ImageCell
                  img={images[idx] ?? null}
                  pinColor={PIN_PALETTE[idx % PIN_PALETTE.length]!}
                  floatSeed={idx}
                />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── Feature ──────────────────────────────────────────────────────────────────
function FeatureLayoutView({ layout, images }: { layout: FeatureLayout; images: ImageObject[] }) {
  const s = [images[0] ?? null, images[1] ?? null, images[2] ?? null];

  const Feature = (
    <View style={{ flex: 1 }}>
      <ImageCell img={s[0]} pinColor={PIN_PALETTE[0]!} floatSeed={0} />
    </View>
  );
  const SmallsH = (
    <View style={{ flex: 1, gap: GAP }}>
      <View style={{ flex: 1 }}><ImageCell img={s[1]} pinColor={PIN_PALETTE[1]!} floatSeed={1} /></View>
      <View style={{ flex: 1 }}><ImageCell img={s[2]} pinColor={PIN_PALETTE[2]!} floatSeed={2} /></View>
    </View>
  );
  const SmallsV = (
    <View style={{ flex: 2, flexDirection: "row", gap: GAP }}>
      <View style={{ flex: 1 }}><ImageCell img={s[1]} pinColor={PIN_PALETTE[1]!} floatSeed={1} /></View>
      <View style={{ flex: 1 }}><ImageCell img={s[2]} pinColor={PIN_PALETTE[2]!} floatSeed={2} /></View>
    </View>
  );

  if (layout === "f2") return <View style={{ flex: 1, flexDirection: "row", gap: GAP }}>{Feature}{SmallsH}</View>;
  if (layout === "2f") return <View style={{ flex: 1, flexDirection: "row", gap: GAP }}>{SmallsH}{Feature}</View>;
  if (layout === "ft") return <View style={{ flex: 1, gap: GAP }}>{Feature}{SmallsV}</View>;
  return <View style={{ flex: 1, gap: GAP }}>{SmallsV}{Feature}</View>;
}

// ─── Slideshow with Parallax Tilt ─────────────────────────────────────────────
// ─── Slideshow with Parallax Tilt ─────────────────────────────────────────────
function SlideshowView({ images, slideIndex, slideFade }: {
  images: ImageObject[]; 
  slideIndex: number; 
  slideFade: Animated.Value;
}) {
  const img = images[slideIndex]!;
  const [cellSize, setCellSize] = useState<{ w: number; h: number } | null>(null);
  const [natSize, setNatSize] = useState<{ w: number; h: number } | null>(null);
  
const { floatY, floatX, shakeX, rotDeg, scale } = useFloatAnim(slideIndex);
  const { panResponder } = useParallaxTilt(6);

  const onCellLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) setCellSize({ w: width, h: height });
  }, []);

  useEffect(() => {
    if (!img?.imageurl) return;
    let cancelled = false;
    fetchImageSize(img.imageurl, (w, h) => { if (!cancelled) setNatSize({ w, h }); });
    return () => { cancelled = true; };
  }, [img?.imageurl]);

  let pinPos: { left: number; top: number } | null = null;
  if (cellSize) {
    pinPos = (natSize && natSize.w > 0 && natSize.h > 0)
      ? computePinPosition(cellSize.w, cellSize.h, natSize.w, natSize.h)
      : { left: cellSize.w / 2 - PIN_WIDTH / 2, top: -12 };
  }

  return (
    <View style={st.cellWrapper} onLayout={onCellLayout}>
      {/* Fixed Paper Card */}
      <View style={st.floatCard}>
        
        {/* Only Image Animates */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            StyleSheet.absoluteFill,
            {
              // Inside Animated.View style
transform: [
  { translateY: floatY },
  { translateX: floatX },
  { translateX: shakeX },     // ← Added Shake
  { rotate: rotDeg },
  { scale },
],
            },
          ]}
        >
          <Image 
            source={{ uri: img.imageurl }} 
            style={StyleSheet.absoluteFill} 
            resizeMode="contain" 
          />
        </Animated.View>
      </View>

      {images.length > 1 && (
        <>
          <View style={st.slideChip}>
            <Text style={st.slideChipT}>{slideIndex + 1}/{images.length}</Text>
          </View>
          <View style={st.slideDots}>
            {images.map((_, i) => (
              <View key={i} style={[st.slideDot, i === slideIndex && st.slideDotActive]} />
            ))}
          </View>
        </>
      )}

      {pinPos && (
        <View pointerEvents="none" style={[st.pinAnchor, { top: pinPos.top, left: pinPos.left }]}>
          <Pin color={PIN_PALETTE[0]!} />
        </View>
      )}
    </View>
  );
}

// ─── Empty / Waiting ──────────────────────────────────────────────────────────
function NoImagesScreen({ title, loaded, P }: { title?: string; loaded: boolean; P: (w: string) => string }) {
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -10, duration: 1200, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={[emptySt.card, { transform: [{ translateY: bounce }] }]}>
        <Text style={{ fontSize: 40 }}>📌</Text>
        <Text style={[emptySt.heading, { fontFamily: loaded ? P("700") : undefined }]}>Nothing pinned yet</Text>
        <Text style={[emptySt.sub, { fontFamily: loaded ? P("400") : undefined }]}>
          {title ? `"${title}" is empty` : "Board is empty"}
        </Text>
      </Animated.View>
    </View>
  );
}

const emptySt = StyleSheet.create({
  card: {
    backgroundColor: C.cork, borderRadius: 12, padding: 36,
    alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: C.border,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },
  heading: { fontSize: 18, color: C.primary, letterSpacing: 0.5 },
  sub: { fontSize: 12, color: C.dimText },
});

function WaitingScreen({ loaded, P }: { loaded: boolean; P: (w: string) => string }) {
  const pulse = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.7, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
      <Animated.Text style={[{ fontSize: 48, opacity: pulse }]}>📌</Animated.Text>
      <Text style={{ color: C.primary, fontSize: 22, marginTop: 14, fontFamily: loaded ? P("700") : undefined, letterSpacing: 2 }}>
        Screenova
      </Text>
      <Text style={{ color: C.dimText, fontSize: 11, marginTop: 6, letterSpacing: 1.5, fontFamily: loaded ? P("400") : undefined }}>
        CONNECTING…
      </Text>
    </View>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function TVDisplay() {
  const { width: SW, height: SH } = useWindowDimensions();
  const [slideIndex, setSlideIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideFade = useRef(new Animated.Value(1)).current;
  const nextContentRef = useRef<DeviceDisplay | null>(null);
  const slideTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInitialLoadComplete = useRef(false);

  const [loaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold });

  const P = (w: string) => ({ "400": "Poppins_400Regular", "600": "Poppins_600SemiBold", "700": "Poppins_700Bold" }[w] || "System");

  const { loading, deviceDisplay, fetchDeviceDisplay } = useContent();

  const transitionToNewContent = useCallback((newData: DeviceDisplay) => {
    if (isTransitioning) { nextContentRef.current = newData; return; }
    setIsTransitioning(true);
    Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
      setSlideIndex(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start(() => {
        setIsTransitioning(false);
        if (nextContentRef.current) { const q = nextContentRef.current; nextContentRef.current = null; transitionToNewContent(q); }
      });
    });
  }, [isTransitioning, fadeAnim]);

  const hasContentChanged = (old: DeviceDisplay | null, next: DeviceDisplay): boolean => {
    if (!old) return true;
    const oi = getSortedImages(old.images), ni = getSortedImages(next.images);
    return old.id !== next.id || old.title !== next.title ||
      JSON.stringify(old.screenLayout) !== JSON.stringify(next.screenLayout) ||
      oi.length !== ni.length ||
      oi.some((o) => ni.find((n) => n.imageId === o.imageId)?.imageurl !== o.imageurl);
  };

  const loadDeviceDisplay = useCallback(async () => {
    try {
      const data = (await fetchDeviceDisplay()) as DeviceDisplay | null;
      if (data && !isTransitioning && hasContentChanged(deviceDisplay as DeviceDisplay | null, data)) transitionToNewContent(data);
    } catch {}
  }, [fetchDeviceDisplay, isTransitioning, deviceDisplay, transitionToNewContent]);

  useEffect(() => {
    loadDeviceDisplay();
    isInitialLoadComplete.current = true;
    return () => { if (intervalIdRef.current) clearInterval(intervalIdRef.current); if (slideTimer.current) clearInterval(slideTimer.current); };
  }, []);

  useEffect(() => {
    if (!isInitialLoadComplete.current) return;
    intervalIdRef.current = setInterval(loadDeviceDisplay, 5000);
    return () => { if (intervalIdRef.current) clearInterval(intervalIdRef.current); };
  }, [deviceDisplay]);

  useEffect(() => {
    if (slideTimer.current) clearInterval(slideTimer.current);
    if (!deviceDisplay) return;
    const imgs = getSortedImages(deviceDisplay.images);
    const lv = getLayoutValue(deviceDisplay.screenLayout);
    const { rows, cols } = getLayoutDims(deviceDisplay.screenLayout);
    const isSlideshow = !isFeatureLayout(lv) && imgs.length > rows * cols;
    if (!isSlideshow || imgs.length <= 1) { setSlideIndex(0); return; }
    slideTimer.current = setInterval(() => {
      Animated.timing(slideFade, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        setSlideIndex((p) => (p + 1) % imgs.length);
        Animated.timing(slideFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
    }, 4000);
    return () => { if (slideTimer.current) clearInterval(slideTimer.current); };
  }, [deviceDisplay]);






  if (loading && !deviceDisplay) return <WaitingScreen loaded={loaded} P={P} />;
  if (!deviceDisplay) return <WaitingScreen loaded={loaded} P={P} />;

  const dd = deviceDisplay;
  const sortedImages = getSortedImages(dd.images);
  const lv = getLayoutValue(dd.screenLayout);
  const { rows, cols } = getLayoutDims(dd.screenLayout);
  const isFeature = isFeatureLayout(lv);
  const isSlideshow = !isFeature && sortedImages.length > rows * cols;

  return (
    <View style={[st.root, { width: SW, height: SH }]}>
      <StatusBar hidden />

      {/* Header with Weather and Logout */}
      <Header title={dd.title || undefined} loaded={loaded} P={P} />

      {/* Cork Board Content Area */}
      <CorkBoardArea>
        <Animated.View style={{ opacity: fadeAnim, flex: 1, padding: GAP }}>
          {sortedImages.length === 0 ? (
            <NoImagesScreen title={dd.title || undefined} loaded={loaded} P={P} />
          ) : isFeature ? (
            <FeatureLayoutView layout={lv as FeatureLayout} images={sortedImages} />
          ) : isSlideshow ? (
            <SlideshowView images={sortedImages} slideIndex={slideIndex} slideFade={slideFade} />
          ) : (
            <GridView rows={rows} cols={cols} images={sortedImages} />
          )}
        </Animated.View>
      </CorkBoardArea>

      {/* Footer with Date and Time */}
      <Footer imageCount={sortedImages.length} loaded={loaded} P={P} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  cellWrapper: { flex: 1, position: "relative" },

floatCard: {
  flex: 1,
  backgroundColor: "#FFFFFF", // ✅ white paper
  borderRadius: 10,
  overflow: "hidden",

  // paper shadow
  ...Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
    },
    android: {
      elevation: 6,
    },
  }),
},


  pinAnchor: { position: "absolute", zIndex: 40, elevation: 40 },

  pinWrap: { alignItems: "center", width: PIN_WIDTH },
  pinGlow: { position: "absolute", top: -8, width: 0, height: 0, borderRadius: 18 },
  pinHead: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 3,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 5 },
      android: { elevation: 8 },
    }),
  },
  pinShine: {
    position: "absolute", top: 4, left: 5,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.65)",
  },
  pinNeedle: {
    width: 2.5, height: 10, backgroundColor: "#6B7A8D",
    borderBottomLeftRadius: 2, borderBottomRightRadius: 2, marginTop: -1,
  },
  pinGround: { width: 16, height: 3.5, borderRadius: 7, marginTop: 1 },

  emptySlot: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "transparent" },
  emptyIcon: { fontSize: 28, opacity: 0.25 },

  slideChip: {
    position: "absolute", top: 12, right: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, zIndex: 10,
  },
  slideChipT: { color: C.primary, fontSize: 11, fontFamily: "Poppins_600SemiBold", letterSpacing: 1 },
  slideDots: {
    position: "absolute", bottom: 16, left: 0, right: 0,
    flexDirection: "row", justifyContent: "center", gap: 7, zIndex: 10,
  },
  slideDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(0,0,0,0.15)" },
  slideDotActive: { width: 22, height: 7, borderRadius: 4, backgroundColor: C.primary },
  paperCurl: {
  position: "absolute",
  bottom: 0,
  right: 0,
  width: 60,
  height: 60,
  backgroundColor: "transparent",

  borderBottomRightRadius: 10,


  transform: [{ rotate: "45deg" }],
},

});