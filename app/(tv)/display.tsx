// app/(tv)/display.tsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, Image, StyleSheet, useWindowDimensions,
  Animated, StatusBar, Platform, LayoutChangeEvent,
  PanResponder,
  TouchableOpacity,
} from "react-native";
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { useContent } from "../../hooks/useTvDisplay";
import { useRouter } from "expo-router";
import { clearTokens } from "@/services/api";
import { notifyAuthChange } from "@/utils/authEvents";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  primary: "#1E3A8A", secondary: "#8B4513",
  bg: "#EDF1FE", headerBg: "#FFFFFF", footerBg: "#FFFFFF",
  cork: "#D2B48C", corkLight: "#DEB887",
  dimText: "#6B5B4F", cream: "#4A3728",
  border: "rgba(30,58,138,0.15)",
};

const PIN_PALETTE = ["#D94035","#1E3A8A","#8B4513","#1A7A4A","#7B3FA0","#C75B15","#1A6B8A","#3D3D3D"];
const GAP = 12, PIN_WIDTH = 28, HEADER_H = 56, FOOTER_H = 60;

// ─── Types ────────────────────────────────────────────────────────────────────
type ImageObject = { imageId: number; imageurl: string; sortOrder: number };
type Slot = { slotIndex: number; images: ImageObject[] };
type ScreenLayoutObject = { label: string; value: string; rows: number; cols: number; slots: number };
type DeviceDisplay = {
  deviceId: number | undefined | any;
  id: number; title: string; description: string;
  screenLayout: string | ScreenLayoutObject;
  images?: ImageObject[] | null;
  slots?: Slot[];
};

// All known feature layouts
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
    const parts = l.split("x");
    const r = Number(parts[0]);
    const c = Number(parts[1]);
    if (r > 0 && c > 0) return { rows: r, cols: c };
  }
  return { rows: 1, cols: 1 };
};

const isFeatureLayout = (v: string): v is FeatureLayout =>
  FEATURE_LAYOUTS.includes(v as FeatureLayout);

const lighten = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${Math.min(255,((n>>16)&0xff)+40)},${Math.min(255,((n>>8)&0xff)+40)},${Math.min(255,(n&0xff)+40)})`;
};

const unwrapDisplay = (raw: any): DeviceDisplay | null => {
  if (!raw) return null;
  const d = raw?.data ?? raw;
  if (!d?.id) return null;
  return d as DeviceDisplay;
};

// Stable image list key — only resets slideshow if image IDs actually change
const getImagesKey = (images: ImageObject[]): string =>
  images.map(img => img.imageId).join(",");

// ─── Normalize slots from API response ───────────────────────────────────────
// Builds a full slot array of `count` entries, filling missing ones with empty images.
// Each slot's images are sorted by sortOrder.
const normalizeSlots = (
  rawSlots: Slot[] | undefined,
  count: number
): Array<{ slotIndex: number; images: ImageObject[] }> =>
  Array.from({ length: count }, (_, i) => {
    const found = rawSlots?.find(s => s.slotIndex === i);
    return {
      slotIndex: i,
      images: found ? getSortedImages(found.images) : [],
    };
  });

// ─── Image size cache ─────────────────────────────────────────────────────────
const imageSizeCache: Record<string, { w: number; h: number }> = {};
function fetchImageSize(url: string, cb: (w: number, h: number) => void) {
  if (imageSizeCache[url]) { cb(imageSizeCache[url]!.w, imageSizeCache[url]!.h); return; }
  Image.getSize(url, (w, h) => { imageSizeCache[url] = { w, h }; cb(w, h); }, () => {});
}

function computePinPos(cW: number, cH: number, nW: number, nH: number) {
  const cr = cW / cH, ir = nW / nH;
  const rW = ir > cr ? cW : cH * ir;
  const rH = ir > cr ? cW / ir : cH;
  return { left: (cW - rW) / 2 + rW / 2 - PIN_WIDTH / 2, top: (cH - rH) / 2 - 12 };
}

// ─── Float Animation ──────────────────────────────────────────────────────────
function useFloatAnim(seed = 0) {
  const floatY = useRef(new Animated.Value(0)).current;
  const floatX = useRef(new Animated.Value(0)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const d = 4200 + (seed % 6) * 500;
    Animated.loop(Animated.parallel([
      Animated.sequence([
        Animated.timing(floatY, { toValue: -3.5, duration: d, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 2.5,  duration: d * 0.9, useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0,    duration: d * 0.95, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(floatX, { toValue: 1.8,  duration: d * 1.2, useNativeDriver: true }),
        Animated.timing(floatX, { toValue: -1.5, duration: d * 0.95, useNativeDriver: true }),
        Animated.timing(floatX, { toValue: 0,    duration: d, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(shakeX, { toValue: 2.2,   duration: 220, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -1.87, duration: 190, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 1.32,  duration: 240, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -0.88, duration: 180, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0,     duration: 210, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(rotate, { toValue: 0.7,  duration: d * 1.1, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: -0.6, duration: d * 0.9, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 0,    duration: d * 0.95, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.012, duration: d * 0.85, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.99,  duration: d * 1.05, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,     duration: d * 0.9,  useNativeDriver: true }),
      ]),
    ])).start();
    return () => {
      floatY.stopAnimation(); floatX.stopAnimation(); shakeX.stopAnimation();
      rotate.stopAnimation(); scale.stopAnimation();
    };
  }, [seed]);

  const rotDeg = rotate.interpolate({ inputRange: [-1, 1], outputRange: ["-0.8deg", "0.8deg"] });
  return { floatY, floatX, shakeX, rotDeg, scale };
}

// ─── Pin ──────────────────────────────────────────────────────────────────────
function Pin({ color }: { color: string }) {
  return (
    <View style={st.pinWrap} pointerEvents="none">
      <View style={[st.pinHead, { backgroundColor: color, borderColor: lighten(color) }]}>
        <View style={st.pinShine} />
      </View>
      <View style={st.pinNeedle} />
      <View style={[st.pinGround, { backgroundColor: "rgba(0,0,0,0.15)" }]} />
    </View>
  );
}

// ─── ImageCell ────────────────────────────────────────────────────────────────
function ImageCell({ img, pinColor, floatSeed }: {
  img: ImageObject | null; pinColor: string; floatSeed: number;
}) {
  const [cellSize, setCellSize] = useState<{ w: number; h: number } | null>(null);
  const [natSize, setNatSize]   = useState<{ w: number; h: number } | null>(null);
  const { floatY, floatX, shakeX, rotDeg, scale } = useFloatAnim(floatSeed);
  const panRef = useRef(PanResponder.create({ onStartShouldSetPanResponder: () => true })).current;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    if (w > 0 && h > 0) setCellSize({ w, h });
  }, []);

  useEffect(() => {
    if (!img?.imageurl) return;
    let cancel = false;
    fetchImageSize(img.imageurl, (w, h) => { if (!cancel) setNatSize({ w, h }); });
    return () => { cancel = true; };
  }, [img?.imageurl]);

  const pinPos = cellSize
    ? (natSize?.w && natSize?.h
        ? computePinPos(cellSize.w, cellSize.h, natSize.w, natSize.h)
        : { left: cellSize.w / 2 - PIN_WIDTH / 2, top: -12 })
    : null;

  return (
    <View style={st.cellWrapper} onLayout={onLayout}>
      <View style={st.floatCard}>
        <Animated.View
          {...panRef.panHandlers}
          style={[StyleSheet.absoluteFill, {
            transform: [
              { translateY: floatY }, { translateX: floatX },
              { translateX: shakeX }, { rotate: rotDeg }, { scale },
            ],
          }]}
        >
          {img?.imageurl
            ? <Image source={{ uri: img.imageurl }} style={StyleSheet.absoluteFill} resizeMode="contain" />
            : <View style={st.emptySlot}><Text style={st.emptyIcon}>📌</Text></View>
          }
        </Animated.View>
      </View>
      {pinPos && (
        <View pointerEvents="none" style={[st.pinAnchor, { top: pinPos.top, left: pinPos.left }]}>
          <Pin color={pinColor} />
        </View>
      )}
    </View>
  );
}

// ─── SlotSlideshow ────────────────────────────────────────────────────────────
function SlotSlideshow({ images, slotIndex }: { images: ImageObject[]; slotIndex: number }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [nextIdx, setNextIdx]       = useState<number | null>(null);

  const currentOpacity = useRef(new Animated.Value(1)).current;
  const nextOpacity    = useRef(new Animated.Value(0)).current;
  const isAnimating    = useRef(false);

  const currentIdxRef = useRef(0);
  const imagesRef     = useRef<ImageObject[]>(images);

  useEffect(() => { imagesRef.current = images; });
  useEffect(() => { currentIdxRef.current = currentIdx; }, [currentIdx]);

  const imagesKey = getImagesKey(images);

  useEffect(() => {
    isAnimating.current = false;
    currentIdxRef.current = 0;
    currentOpacity.setValue(1);
    nextOpacity.setValue(0);
    setCurrentIdx(0);
    setNextIdx(null);
  }, [imagesKey]);

  useEffect(() => {
    if (images.length <= 1) return;

    const tick = () => {
      if (isAnimating.current) return;
      isAnimating.current = true;

      const imgs = imagesRef.current;
      const next = (currentIdxRef.current + 1) % imgs.length;

      setNextIdx(next);
      nextOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(nextOpacity,    { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(currentOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (!finished) {
          currentOpacity.setValue(1);
          nextOpacity.setValue(0);
          isAnimating.current = false;
          return;
        }
        currentIdxRef.current = next;
        setCurrentIdx(next);
        setNextIdx(null);
        currentOpacity.setValue(1);
        nextOpacity.setValue(0);
        isAnimating.current = false;
      });
    };

    const timer = setInterval(tick, 5000);
    return () => clearInterval(timer);
  }, [imagesKey]);

  const currentImg = images[currentIdx] ?? null;
  const nextImg    = nextIdx !== null ? (images[nextIdx] ?? null) : null;

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: currentOpacity }]}>
        <ImageCell
          img={currentImg}
          pinColor={PIN_PALETTE[(slotIndex + currentIdx) % PIN_PALETTE.length]!}
          floatSeed={slotIndex * 10 + currentIdx}
        />
      </Animated.View>

      {nextImg && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: nextOpacity }]}>
          <ImageCell
            img={nextImg}
            pinColor={PIN_PALETTE[(slotIndex + (nextIdx ?? 0)) % PIN_PALETTE.length]!}
            floatSeed={slotIndex * 10 + (nextIdx ?? 0)}
          />
        </Animated.View>
      )}

      {images.length > 1 && (
        <View style={st.slotCounter}>
          <Text style={st.slotCounterText}>
            {currentIdx + 1}/{images.length}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── SlotCell ─────────────────────────────────────────────────────────────────
// Single reusable cell: shows slideshow if multiple images, single ImageCell otherwise.
function SlotCell({ slot, globalSlotIndex }: {
  slot: { slotIndex: number; images: ImageObject[] };
  globalSlotIndex: number;
}) {
  if (slot.images.length === 0) {
    return (
      <ImageCell
        img={null}
        pinColor={PIN_PALETTE[globalSlotIndex % PIN_PALETTE.length]!}
        floatSeed={globalSlotIndex}
      />
    );
  }
  if (slot.images.length === 1) {
    return (
      <ImageCell
        img={slot.images[0]!}
        pinColor={PIN_PALETTE[globalSlotIndex % PIN_PALETTE.length]!}
        floatSeed={globalSlotIndex}
      />
    );
  }
  return <SlotSlideshow images={slot.images} slotIndex={globalSlotIndex} />;
}

// ─── GridView ─────────────────────────────────────────────────────────────────
// Generic NxM grid. Works for ALL non-feature layouts (1x2, 2x1, 1x3, 2x2, etc.)
function GridView({ rows, cols, slots }: {
  rows: number;
  cols: number;
  slots: Array<{ slotIndex: number; images: ImageObject[] }>;
}) {
  return (
    <View style={{ flex: 1, gap: GAP }}>
      {Array.from({ length: rows }, (_, r) => (
        <View key={r} style={{ flex: 1, flexDirection: "row", gap: GAP }}>
          {Array.from({ length: cols }, (_, c) => {
            const i = r * cols + c;
            const slot = slots[i] ?? { slotIndex: i, images: [] };
            return (
              <View key={c} style={{ flex: 1 }}>
                <SlotCell slot={slot} globalSlotIndex={i} />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── FeatureLayoutView ────────────────────────────────────────────────────────
// Handles f2, 2f, ft, fb — all use 3 slots from the API.
// slot[0] = feature (large), slot[1] = small top/left, slot[2] = small bottom/right
function FeatureLayoutView({ layout, slots }: {
  layout: FeatureLayout;
  slots: Array<{ slotIndex: number; images: ImageObject[] }>;
}) {
  // Ensure we always have 3 slot entries even if API returned fewer
  const safeSlots = [
    slots[0] ?? { slotIndex: 0, images: [] },
    slots[1] ?? { slotIndex: 1, images: [] },
    slots[2] ?? { slotIndex: 2, images: [] },
  ];

  // Feature cell — always slot[0], takes up ~60% of the space (flex: 3)
  const Feature = (
    <View style={{ flex: 3 }}>
      <SlotCell slot={safeSlots[0]} globalSlotIndex={0} />
    </View>
  );

  // Two smaller cells — slot[1] and slot[2], stacked vertically (flex: 2)
  const SmallsVertical = (
    <View style={{ flex: 2, gap: GAP }}>
      <View style={{ flex: 1 }}>
        <SlotCell slot={safeSlots[1]} globalSlotIndex={1} />
      </View>
      <View style={{ flex: 1 }}>
        <SlotCell slot={safeSlots[2]} globalSlotIndex={2} />
      </View>
    </View>
  );

  // Two smaller cells — slot[1] and slot[2], side by side horizontally (flex: 2)
  const SmallsHorizontal = (
    <View style={{ flex: 2, flexDirection: "row", gap: GAP }}>
      <View style={{ flex: 1 }}>
        <SlotCell slot={safeSlots[1]} globalSlotIndex={1} />
      </View>
      <View style={{ flex: 1 }}>
        <SlotCell slot={safeSlots[2]} globalSlotIndex={2} />
      </View>
    </View>
  );

  // f2 = Feature LEFT, two smalls stacked on RIGHT
  if (layout === "f2") {
    return (
      <View style={{ flex: 1, flexDirection: "row", gap: GAP }}>
        {Feature}
        {SmallsVertical}
      </View>
    );
  }

  // 2f = Two smalls stacked on LEFT, Feature RIGHT
  if (layout === "2f") {
    return (
      <View style={{ flex: 1, flexDirection: "row", gap: GAP }}>
        {SmallsVertical}
        {Feature}
      </View>
    );
  }

  // ft = Feature TOP, two smalls side by side on BOTTOM
  if (layout === "ft") {
    return (
      <View style={{ flex: 1, gap: GAP }}>
        {Feature}
        {SmallsHorizontal}
      </View>
    );
  }

  // fb = Two smalls side by side on TOP, Feature BOTTOM
  return (
    <View style={{ flex: 1, gap: GAP }}>
      {SmallsHorizontal}
      {Feature}
    </View>
  );
}

// ─── SlideshowView ────────────────────────────────────────────────────────────
// Full-screen slideshow — only used when layout is 1x1 (single slot, multiple images)
function SlideshowView({ images, slideIndex, slideFade }: {
  images: ImageObject[]; slideIndex: number; slideFade: Animated.Value;
}) {
  const img = images[slideIndex];
  if (!img) return null;
  return (
    <Animated.View style={[{ flex: 1 }, { opacity: slideFade }]}>
      <ImageCell img={img} pinColor={PIN_PALETTE[0]!} floatSeed={slideIndex} />
      {images.length > 1 && (
        <>
          <View style={st.slideChip}><Text style={st.slideChipT}>{slideIndex + 1}/{images.length}</Text></View>
          <View style={st.slideDots}>
            {images.map((_, i) => <View key={i} style={[st.slideDot, i === slideIndex && st.slideDotActive]} />)}
          </View>
        </>
      )}
    </Animated.View>
  );
}

// ─── WeatherWidget ────────────────────────────────────────────────────────────
function WeatherWidget({ loaded, P }: { loaded: boolean; P: (w: string) => string }) {
  const [w] = useState({ temp: 24, condition: "Sunny", icon: "☀️" });
  return (
    <View style={wxSt.wrap}>
      <Text style={wxSt.icon}>{w.icon}</Text>
      <View>
        <Text style={[wxSt.temp, { fontFamily: loaded ? P("600") : undefined }]}>{w.temp}°C</Text>
        <Text style={[wxSt.cond, { fontFamily: loaded ? P("400") : undefined }]}>{w.condition}</Text>
      </View>
    </View>
  );
}
const wxSt = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(30,58,138,0.05)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  icon: { fontSize: 20 },
  temp: { fontSize: 14, color: C.primary, fontWeight: "600" },
  cond: { fontSize: 10, color: C.dimText },
});

// ─── DateTimeWidget ───────────────────────────────────────────────────────────
function DateTimeWidget({ loaded, P }: { loaded: boolean; P: (w: string) => string }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <View style={{ alignItems: "flex-end" }}>
      <Text style={{ fontSize: 16, color: C.primary, letterSpacing: 1.5, fontFamily: loaded ? P("700") : undefined }}>
        {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
      </Text>
      <Text style={{ fontSize: 10, color: C.dimText, letterSpacing: 0.5, marginTop: 2, fontFamily: loaded ? P("400") : undefined }}>
        {now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </Text>
    </View>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ loaded, P, onLogoPress }: {
  loaded: boolean; P: (w: string) => string; onLogoPress: () => void;
}) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.4, duration: 1100, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1,   duration: 1100, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <View style={hSt.bar}>
      <View style={hSt.brand}>
        <TouchableOpacity onPress={onLogoPress}>
          <View style={hSt.logoBox}>
            <Image source={require("../../assets/images/logo.png")} style={{ width: 22, height: 22 }} />
          </View>
        </TouchableOpacity>
        <View>
          <Text style={[hSt.appName, { fontFamily: loaded ? P("700") : undefined }]}>Screenova</Text>
          <View style={hSt.liveRow}>
            <Animated.View style={[hSt.liveDot, { opacity: pulse }]} />
            <Text style={[hSt.liveText, { fontFamily: loaded ? P("400") : undefined }]}>LIVE</Text>
          </View>
        </View>
      </View>
      <WeatherWidget loaded={loaded} P={P} />
    </View>
  );
}
const hSt = StyleSheet.create({
  bar: { height: HEADER_H, backgroundColor: C.headerBg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.border, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4 }, android: { elevation: 3 } }) },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoBox: { width: 34, height: 34, borderRadius: 8, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.secondary },
  appName: { fontSize: 16, color: C.primary, letterSpacing: 1.5, fontWeight: "700" },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#3ECF6A" },
  liveText: { fontSize: 8, color: "#3ECF6A", letterSpacing: 2 },
});

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer({ imageCount, loaded, P }: { imageCount: number; loaded: boolean; P: (w: string) => string }) {
  return (
    <View style={fSt.bar}>
      <View style={fSt.chip}>
        <Text style={[fSt.chipText, { fontFamily: loaded ? P("600") : undefined }]}>
          {imageCount} {imageCount === 1 ? "Item" : "Items"}
        </Text>
      </View>
      <DateTimeWidget loaded={loaded} P={P} />
    </View>
  );
}
const fSt = StyleSheet.create({
  bar: { height: FOOTER_H, backgroundColor: C.footerBg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: C.border, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 4 }, android: { elevation: 3 } }) },
  chip: { borderWidth: 1, borderColor: C.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, backgroundColor: "rgba(30,58,138,0.05)" },
  chipText: { fontSize: 11, color: C.primary, letterSpacing: 0.6 },
});

// ─── CorkBoardArea ────────────────────────────────────────────────────────────
function CorkBoardArea({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, overflow: "hidden" }}>
      {Array.from({ length: 20 }, (_, i) => (
        <View key={i} style={{
          position: "absolute",
          top: `${(i*17+5)%100}%` as any,
          left: `${(i*31+10)%100}%` as any,
          opacity: 0.03+(i%4)*0.01,
          width: 3+(i%3), height: 3+(i%3),
          borderRadius: 99, backgroundColor: C.corkLight,
        }} />
      ))}
      {children}
    </View>
  );
}

// ─── NoImagesScreen ───────────────────────────────────────────────────────────
function NoImagesScreen({ title, loaded, P }: { title?: string; loaded: boolean; P: (w: string) => string }) {
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(bounce, { toValue: -10, duration: 1200, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 0,   duration: 1200, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={[empSt.card, { transform: [{ translateY: bounce }] }]}>
        <Text style={{ fontSize: 40 }}>📌</Text>
        <Text style={[empSt.heading, { fontFamily: loaded ? P("700") : undefined }]}>Nothing pinned yet</Text>
        <Text style={[empSt.sub, { fontFamily: loaded ? P("400") : undefined }]}>{title ? `"${title}" is empty` : "Board is empty"}</Text>
      </Animated.View>
    </View>
  );
}
const empSt = StyleSheet.create({
  card: { backgroundColor: C.cork, borderRadius: 12, padding: 36, alignItems: "center", gap: 8, borderWidth: 1, borderColor: C.border, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16 }, android: { elevation: 8 } }) },
  heading: { fontSize: 18, color: C.primary, letterSpacing: 0.5 },
  sub: { fontSize: 12, color: C.dimText },
});

// ─── WaitingScreen ────────────────────────────────────────────────────────────
function WaitingScreen({ loaded, P }: { loaded: boolean; P: (w: string) => string }) {
  const pulse = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1,   duration: 1000, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.7, duration: 1000, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
      <Animated.Text style={{ fontSize: 48, opacity: pulse }}>📌</Animated.Text>
      <Text style={{ color: C.primary, fontSize: 22, marginTop: 14, fontFamily: loaded ? P("700") : undefined, letterSpacing: 2 }}>Screenova</Text>
      <Text style={{ color: C.dimText, fontSize: 11, marginTop: 6, letterSpacing: 1.5, fontFamily: loaded ? P("400") : undefined }}>CONNECTING…</Text>
    </View>
  );
}

// ─── TVDisplay (Main) ─────────────────────────────────────────────────────────
export default function TVDisplay() {
  const { width: SW, height: SH } = useWindowDimensions();
  const [slideIndex, setSlideIndex]           = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const fadeAnim       = useRef(new Animated.Value(1)).current;
  const slideFade      = useRef(new Animated.Value(1)).current;
  const nextContentRef = useRef<DeviceDisplay | null>(null);
  const slideTimer     = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimer      = useRef<ReturnType<typeof setInterval> | null>(null);
  const isTransRef     = useRef(false);

  const [loaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold });
  const P = (w: string) => (({ "400": "Poppins_400Regular", "600": "Poppins_600SemiBold", "700": "Poppins_700Bold" } as any)[w] || "System");

  const router = useRouter();
  const { stopCurrentContent } = useContent();
  const { loading, deviceDisplay, fetchDeviceDisplay } = useContent();
  const dd: DeviceDisplay | null = deviceDisplay ? unwrapDisplay(deviceDisplay) : null;

  const lastTapRef = useRef<number>(0);

  const handleDoubleTapLogout = async () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      try {
        if (dd?.id && dd?.deviceId) {
          await stopCurrentContent(dd.deviceId, dd.id);
        }
      } catch (e) {
        console.log("Stop content failed", e);
      }
      await clearTokens();
      notifyAuthChange();
      router.replace("/login");
    }
    lastTapRef.current = now;
  };

  const transitionTo = useCallback((data: DeviceDisplay) => {
    if (isTransRef.current) { nextContentRef.current = data; return; }
    isTransRef.current = true;
    setIsTransitioning(true);
    Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
      setSlideIndex(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start(() => {
        isTransRef.current = false;
        setIsTransitioning(false);
        if (nextContentRef.current) {
          const q = nextContentRef.current; nextContentRef.current = null; transitionTo(q);
        }
      });
    });
  }, [fadeAnim]);

  const load = useCallback(async () => {
    try {
      const raw  = await fetchDeviceDisplay();
      const data = unwrapDisplay(raw);
      if (data) transitionTo(data);
    } catch {}
  }, [fetchDeviceDisplay, transitionTo]);

  useEffect(() => {
    load();
    pollTimer.current = setInterval(load, 10000);
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      if (slideTimer.current) clearInterval(slideTimer.current);
    };
  }, []);

  // Full-screen slideshow timer — only for single-slot (1x1) legacy mode
  useEffect(() => {
    if (slideTimer.current) clearInterval(slideTimer.current);
    if (!dd) return;
    const lv = getLayoutValue(dd.screenLayout);
    const { rows, cols } = getLayoutDims(dd.screenLayout);

    // Only use legacy slideshow if there's no slots data and images[] is present
    const imgs = getSortedImages(dd.images);
    const hasSlots = (dd.slots?.length ?? 0) > 0;
    const isLegacySlideshow = !hasSlots && !isFeatureLayout(lv) && imgs.length > rows * cols;

    if (!isLegacySlideshow || imgs.length <= 1) { setSlideIndex(0); return; }

    slideTimer.current = setInterval(() => {
      Animated.timing(slideFade, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        setSlideIndex(p => (p + 1) % imgs.length);
        Animated.timing(slideFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
    }, 4000);
    return () => { if (slideTimer.current) clearInterval(slideTimer.current); };
  }, [dd]);

  if (loading && !dd) return <WaitingScreen loaded={loaded} P={P} />;
  if (!dd) return <WaitingScreen loaded={loaded} P={P} />;

  const lv = getLayoutValue(dd.screenLayout);
  const { rows, cols } = getLayoutDims(dd.screenLayout);

  // ─── Resolve which rendering path to use ──────────────────────────────────
  // Priority: feature layout → slot-based grid → legacy flat image slideshow/grid

  const hasSlots      = (dd.slots?.length ?? 0) > 0;
  const isFeature     = isFeatureLayout(lv);

  // For feature layouts: always use 3 slots
  const featureSlots = isFeature ? normalizeSlots(dd.slots, 3) : [];

  // For grid layouts: use rows*cols slots
  const gridSlots = !isFeature ? normalizeSlots(dd.slots, rows * cols) : [];

  // Legacy flat image mode (no slots in API response)
  const sortedImages = getSortedImages(dd.images);
  const isLegacySlideshow = !hasSlots && !isFeature && sortedImages.length > rows * cols;

  // Total image count for footer
  const totalImages = hasSlots
    ? gridSlots.reduce((n, s) => n + s.images.length, 0) + (isFeature ? featureSlots.reduce((n, s) => n + s.images.length, 0) : 0)
    : sortedImages.length;

  // Check empty
  const isEmpty = hasSlots
    ? (isFeature ? featureSlots : gridSlots).every(s => s.images.length === 0)
    : sortedImages.length === 0;

  return (
    <View style={[st.root, { width: SW, height: SH }]}>
      <StatusBar hidden />
      <Header loaded={loaded} P={P} onLogoPress={handleDoubleTapLogout} />

      <CorkBoardArea>
        <Animated.View style={{ opacity: fadeAnim, flex: 1, padding: GAP }}>
          {isEmpty ? (
            <NoImagesScreen title={dd.title || undefined} loaded={loaded} P={P} />
          ) : isFeature ? (
            // ✅ Feature layouts (f2, 2f, ft, fb) — all use slot data dynamically
            <FeatureLayoutView layout={lv as FeatureLayout} slots={featureSlots} />
          ) : isLegacySlideshow ? (
            // ✅ Legacy: flat images[] array with more images than slots → full-screen slideshow
            <SlideshowView images={sortedImages} slideIndex={slideIndex} slideFade={slideFade} />
          ) : (
            // ✅ All grid layouts (1x2, 2x1, 1x3, 2x2, 2x3, 2x4, 1x4, etc.) — slot-based
            <GridView rows={rows} cols={cols} slots={gridSlots} />
          )}
        </Animated.View>
      </CorkBoardArea>

      <Footer imageCount={totalImages} loaded={loaded} P={P} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  cellWrapper: { flex: 1, position: "relative" },
  floatCard: {
    flex: 1, backgroundColor: "#FFFFFF", borderRadius: 10, overflow: "hidden",
    ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10 }, android: { elevation: 6 } }),
  },
  pinAnchor: { position: "absolute", zIndex: 40, elevation: 40 },
  pinWrap: { alignItems: "center", width: PIN_WIDTH },
  pinHead: { width: 24, height: 24, borderRadius: 12, borderWidth: 3, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 5 }, android: { elevation: 8 } }) },
  pinShine: { position: "absolute", top: 4, left: 5, width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.65)" },
  pinNeedle: { width: 2.5, height: 10, backgroundColor: "#6B7A8D", borderBottomLeftRadius: 2, borderBottomRightRadius: 2, marginTop: -1 },
  pinGround: { width: 16, height: 3.5, borderRadius: 7, marginTop: 1 },
  emptySlot: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyIcon: { fontSize: 28, opacity: 0.25 },
  slotCounter: {
    position: "absolute", bottom: 8, right: 8,
    backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, zIndex: 50,
  },
  slotCounterText: { color: "#fff", fontSize: 10, fontWeight: "600" },
  slideChip: { position: "absolute", top: 12, right: 12, backgroundColor: "rgba(255,255,255,0.9)", borderWidth: 1, borderColor: C.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, zIndex: 10 },
  slideChipT: { color: C.primary, fontSize: 11, fontFamily: "Poppins_600SemiBold", letterSpacing: 1 },
  slideDots: { position: "absolute", bottom: 16, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 7, zIndex: 10 },
  slideDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(0,0,0,0.15)" },
  slideDotActive: { width: 22, height: 7, borderRadius: 4, backgroundColor: C.primary },
});