// app/(tv)/display.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  useWindowDimensions,
  Animated,
  StatusBar,
  Platform,
} from "react-native";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { useContent } from "../../hooks/useTvDisplay";

// ─── Brand Colors ─────────────────────────────────────────────────────────────
const C = {
  navy:       "#0F2557",
  blue:       "#1E3A8A",
  blueMid:    "#2563EB",
  blueLight:  "#DBEAFE",
  brown:      "#7C4A1E",
  brownLight: "#F5EDE4",
  brownMid:   "#A0522D",
  white:      "#FFFFFF",
  bg:         "#EEF2FF",
  border:     "#D1D9F0",
  textMid:    "#475569",
  textLight:  "#94A3B8",
  green:      "#10B981",
  shadow:     "#0F2557",
};

const PIN_PALETTE = [
  "#C0392B",
  "#1E3A8A",
  "#7C4A1E",
  "#16A085",
  "#8E44AD",
  "#D35400",
  "#27AE60",
  "#2C3E50",
];

// ─── A4 ratio constant ────────────────────────────────────────────────────────
// A4 portrait: width / height = 1 / 1.414
const A4_RATIO = 1 / 1.414; // width ÷ height

// ─── Types ────────────────────────────────────────────────────────────────────
type ImageObject = {
  imageId:     number;
  imageBase64: string;
  mimeType:    string;
  sortOrder:   number;
};

type DeviceDisplay = {
  id:           number;
  title:        string;
  description:  string;
  screenRatio:  string;
  screenLayout: string;
  images?:      ImageObject[] | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getSortedImages = (imgs?: ImageObject[] | null): ImageObject[] =>
  imgs && Array.isArray(imgs)
    ? [...imgs].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    : [];

type LayoutInfo = { cols: number; rows: number; label: string; isSlideshow: boolean };

const getLayoutInfo = (layout: string, imageCount: number): LayoutInfo => {
  if (layout?.includes("x")) {
    const [rStr, cStr] = layout.split("x");
    const rows = parseInt(rStr ?? "1", 10);
    const cols = parseInt(cStr ?? "1", 10);
    if (rows > 0 && cols > 0) {
      const slots = rows * cols;
      return { cols, rows, label: `${rows}×${cols} Grid`, isSlideshow: imageCount > slots };
    }
  }
  switch (layout) {
    case "left_right": return { cols: 2, rows: 1, label: "Left & Right",  isSlideshow: false };
    case "top_bottom": return { cols: 1, rows: 2, label: "Top & Bottom",  isSlideshow: false };
    case "grid_4":     return { cols: 2, rows: 2, label: "2×2 Grid",      isSlideshow: false };
    case "full":       return { cols: 1, rows: 1, label: "Full Screen",   isSlideshow: imageCount > 1 };
    default:           return { cols: 1, rows: 1, label: "Full Screen",   isSlideshow: imageCount > 1 };
  }
};

function lighten(hex: string): string {
  try {
    const n = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, ((n >> 16) & 0xff) + 70);
    const g = Math.min(255, ((n >> 8)  & 0xff) + 70);
    const b = Math.min(255, (n          & 0xff) + 70);
    return `rgb(${r},${g},${b})`;
  } catch { return hex; }
}

// ─── Pin ──────────────────────────────────────────────────────────────────────
function Pin({ color }: { color: string }) {
  return (
    <View style={st.pinWrap} pointerEvents="none">
      <View style={[st.pinGlow, { backgroundColor: color + "50" }]} />
      <View style={[st.pinHead, { backgroundColor: color, borderColor: lighten(color) }]}>
        <View style={st.pinShine} />
      </View>
      <View style={st.pinNeedle} />
      <View style={st.pinGround} />
    </View>
  );
}

// ─── A4 Card ──────────────────────────────────────────────────────────────────
// This component takes the available cell size and renders a card that:
//   1. Is always A4 portrait shaped
//   2. Fills the cell as much as possible without overflow
//   3. Image covers 100% of the card — no gaps, no white bars
//
// Strategy: given cellWidth and cellHeight, compute the largest A4 rect that
// fits inside both dimensions, then center it.
function A4Card({
  cellWidth,
  cellHeight,
  img,
  pinColor,
}: {
  cellWidth:  number;
  cellHeight: number;
  img:        ImageObject | null;
  pinColor:   string;
}) {
  // Compute the largest A4-portrait rect that fits in the cell
  // A4_RATIO = cardWidth / cardHeight = 1/1.414
  // Option A: fill width  → height = cellWidth / A4_RATIO
  // Option B: fill height → width  = cellHeight * A4_RATIO
  // Pick whichever keeps both dimensions within bounds
  const byWidth  = { w: cellWidth,             h: cellWidth / A4_RATIO };
  const byHeight = { w: cellHeight * A4_RATIO, h: cellHeight };

  const { w: cardW, h: cardH } =
    byWidth.h <= cellHeight ? byWidth : byHeight;

  return (
    <View
      style={{
        width:          cellWidth,
        height:         cellHeight,
        alignItems:     "center",
        justifyContent: "center",
        position:       "relative",
      }}
    >
      {/* Pin sits above card, centered */}
      <View
        style={{
          position:   "absolute",
          top:        0,
          left:       0,
          right:      0,
          alignItems: "center",
          zIndex:     20,
        }}
        pointerEvents="none"
      >
        <Pin color={pinColor} />
      </View>

      {/* Shadow offset */}
      <View
        style={[
          st.cardShadow,
          { width: cardW, height: cardH, top: "50%", left: "50%",
            marginTop: -cardH / 2 + 7, marginLeft: -cardW / 2 + 7 },
        ]}
      />

      {/* Card — exactly A4 sized, image fills it 100% */}
      <View
        style={{
          width:           cardW,
          height:          cardH,
          backgroundColor: C.white,
          borderRadius:    6,
          overflow:        "hidden",
          borderWidth:     1,
          borderColor:     C.border,
        }}
      >
        {img?.imageBase64 ? (
          <Image
            source={{ uri: `data:${img.mimeType};base64,${img.imageBase64}` }}
            style={{ width: cardW, height: cardH }}
            resizeMode="cover"
          />
        ) : (
          <View style={st.emptySlot}>
            <Text style={st.emptyIcon}>🖼️</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TVDisplay() {
  const { width: SW, height: SH } = useWindowDimensions();

  const [slideIndex,      setSlideIndex]      = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideFade = useRef(new Animated.Value(1)).current;
  const barSlide  = useRef(new Animated.Value(80)).current;

  const nextContentRef        = useRef<DeviceDisplay | null>(null);
  const slideTimer            = useRef<ReturnType<typeof setInterval> | null>(null);
  const intervalIdRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInitialLoadComplete = useRef(false);

  const [loaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold });
  const P = (w: "400" | "600" | "700") =>
    ({ "400": "Poppins_400Regular", "600": "Poppins_600SemiBold", "700": "Poppins_700Bold" }[w]);

  const { loading, deviceDisplay, fetchDeviceDisplay } = useContent();

  const transitionToNewContent = (newData: DeviceDisplay) => {
    if (isTransitioning) { nextContentRef.current = newData; return; }
    setIsTransitioning(true);
    Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
      setSlideIndex(0);
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start(() => {
        setIsTransitioning(false);
        if (nextContentRef.current) {
          const q = nextContentRef.current; nextContentRef.current = null;
          transitionToNewContent(q);
        }
      });
    });
    if (newData.title) {
      barSlide.setValue(80);
      Animated.sequence([
        Animated.timing(barSlide, { toValue: 0,  duration: 420, useNativeDriver: true }),
        Animated.delay(5000),
        Animated.timing(barSlide, { toValue: 80, duration: 380, useNativeDriver: true }),
      ]).start();
    }
  };

  const hasContentChanged = (old: DeviceDisplay | null, next: DeviceDisplay): boolean => {
    if (!old) return true;
    if (old.id !== next.id || old.title !== next.title || old.description !== next.description) return true;
    if (old.screenRatio !== next.screenRatio || old.screenLayout !== next.screenLayout) return true;
    const oi = getSortedImages(old.images);
    const ni = getSortedImages(next.images);
    if (oi.length !== ni.length) return true;
    return oi.some(o => {
      const n = ni.find(x => x.imageId === o.imageId);
      return !n || o.imageBase64 !== n.imageBase64 || o.sortOrder !== n.sortOrder;
    });
  };

  const loadDeviceDisplay = async () => {
    try {
      const data = (await fetchDeviceDisplay()) as DeviceDisplay | null;
      if (data && !isTransitioning && hasContentChanged(deviceDisplay as DeviceDisplay | null, data))
        transitionToNewContent(data);
    } catch (err) { console.error("Fetch error:", err); }
  };

  useEffect(() => {
    (async () => { await loadDeviceDisplay(); isInitialLoadComplete.current = true; })();
    return () => {
      intervalIdRef.current && clearInterval(intervalIdRef.current);
      slideTimer.current    && clearInterval(slideTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!isInitialLoadComplete.current) return;
    intervalIdRef.current = setInterval(loadDeviceDisplay, 5000);
    return () => { intervalIdRef.current && clearInterval(intervalIdRef.current); };
  }, [deviceDisplay]);

  useEffect(() => {
    slideTimer.current && clearInterval(slideTimer.current);
    if (!deviceDisplay) return;
    const imgs = getSortedImages((deviceDisplay as DeviceDisplay).images);
    const { isSlideshow } = getLayoutInfo((deviceDisplay as DeviceDisplay).screenLayout, imgs.length);
    if (!isSlideshow || imgs.length <= 1) { setSlideIndex(0); return; }
    slideTimer.current = setInterval(() => {
      Animated.timing(slideFade, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        setSlideIndex(p => (p + 1) % imgs.length);
        Animated.timing(slideFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
    }, 4000);
    return () => { slideTimer.current && clearInterval(slideTimer.current); };
  }, [deviceDisplay]);

  if (loading && !deviceDisplay) return <WaitingScreen loaded={loaded} P={P} />;
  if (!deviceDisplay)            return <WaitingScreen loaded={loaded} P={P} />;

  const dd           = deviceDisplay as DeviceDisplay;
  const sortedImages = getSortedImages(dd.images);
  if (sortedImages.length === 0) return <NoImagesScreen loaded={loaded} P={P} title={dd.title} />;

  const { cols, rows, isSlideshow } = getLayoutInfo(dd.screenLayout, sortedImages.length);

  // ── Layout spacing ──
  const EDGE  = 24; // outer padding
  const GAP   = 20; // gap between cards
  const PIN_H = 18; // extra top space for pin overflow

  // ── Available area for the card grid ──
  const availW = SW - EDGE * 2 - GAP * (cols - 1);
  const availH = SH - EDGE * 2 - GAP * (rows - 1) - PIN_H;

  // Each cell's available dimensions
  const cellW = availW / cols;
  const cellH = availH / rows;

  // ── Dot background ──
  const DOT_COLS = Math.floor(SW / 26);
  const DOT_ROWS = Math.floor(SH / 26);

  return (
    <View style={[st.root, { width: SW, height: SH }]}>
      <StatusBar hidden />

      {/* Dotted background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: DOT_ROWS }, (_, r) =>
          Array.from({ length: DOT_COLS }, (__, c) => (
            <View key={`${r}-${c}`} style={[st.bgDot, { top: r * 26 + 13, left: c * 26 + 13 }]} />
          ))
        )}
      </View>

      <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>

        {!isSlideshow ? (
          /* ══════════════════════════════════════════════════════
              GRID / SPLIT
              Each card uses A4Card which computes the largest A4
              portrait rectangle that fits in its cell — works for
              1-col, 2-col, 4-col, any layout.
             ══════════════════════════════════════════════════════ */
          <View
            style={{
              flex:              1,
              paddingTop:        EDGE + PIN_H,
              paddingBottom:     EDGE,
              paddingHorizontal: EDGE,
            }}
          >
            {Array.from({ length: rows }, (_, rowIdx) => (
              <View
                key={rowIdx}
                style={{
                  flexDirection: "row",
                  flex:          1,
                  marginBottom:  rowIdx < rows - 1 ? GAP : 0,
                }}
              >
                {Array.from({ length: cols }, (__, colIdx) => {
                  const slotIdx  = rowIdx * cols + colIdx;
                  const img      = sortedImages[slotIdx] ?? null;
                  const pinColor = PIN_PALETTE[slotIdx % PIN_PALETTE.length]!;

                  return (
                    <View
                      key={colIdx}
                      style={{
                        flex:        1,
                        marginRight: colIdx < cols - 1 ? GAP : 0,
                      }}
                    >
                      {/* Use onLayout so cell size is exact at runtime */}
                      <A4CardAutoSize
                        img={img}
                        pinColor={pinColor}
                      />
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

        ) : (
          /* ══════════════════════════════════════════════════════
              SLIDESHOW / FULL
              Single A4 card centered on screen, slides cycle.
             ══════════════════════════════════════════════════════ */
          <View
            style={{
              flex:              1,
              paddingTop:        EDGE + PIN_H,
              paddingBottom:     EDGE,
              paddingHorizontal: EDGE,
              alignItems:        "center",
              justifyContent:    "center",
            }}
          >
            {/* Pin at top center */}
            <View
              style={{
                position:   "absolute",
                top:        EDGE,
                left:       0,
                right:      0,
                alignItems: "center",
                zIndex:     20,
              }}
              pointerEvents="none"
            >
              <Pin color={PIN_PALETTE[0]!} />
            </View>

            {/* Centered A4 card that fits in the available space */}
            <SlideshowA4Card
              screenW={SW}
              screenH={SH}
              edge={EDGE}
              pinH={PIN_H}
              sortedImages={sortedImages}
              slideIndex={slideIndex}
              slideFade={slideFade}
              dd={dd}
              loaded={loaded}
              P={P}
            />
          </View>
        )}

        {/* ── Info bar (grid mode) ── */}
        {dd.description && !isSlideshow && (
          <Animated.View style={[st.infoBar, { width: SW, transform: [{ translateY: barSlide }] }]}>
            <View style={st.infoInner}>
              <View style={st.infoDot} />
              <View style={{ flex: 1 }}>
                <Text style={[st.infoTitle, { fontFamily: loaded ? P("700") : "System" }]} numberOfLines={1}>
                  {dd.title}
                </Text>
                <Text style={[st.infoMsg, { fontFamily: loaded ? P("400") : "System" }]} numberOfLines={1}>
                  {dd.description}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}

      </Animated.View>
    </View>
  );
}

// ─── A4CardAutoSize ───────────────────────────────────────────────────────────
// Uses onLayout to get exact cell size at runtime, then renders A4Card.
// This is needed for the grid because flex:1 cells don't have a known pixel
// size until after layout.
function A4CardAutoSize({ img, pinColor }: { img: ImageObject | null; pinColor: string }) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  return (
    <View
      style={{ flex: 1 }}
      onLayout={e => {
        const { width, height } = e.nativeEvent.layout;
        setSize({ w: width, h: height });
      }}
    >
      {size && (
        <A4Card
          cellWidth={size.w}
          cellHeight={size.h}
          img={img}
          pinColor={pinColor}
        />
      )}
    </View>
  );
}

// ─── SlideshowA4Card ──────────────────────────────────────────────────────────
// Full-screen slideshow — A4 card centered, with slide counter & dots.
function SlideshowA4Card({
  screenW, screenH, edge, pinH,
  sortedImages, slideIndex, slideFade,
  dd, loaded, P,
}: {
  screenW:      number;
  screenH:      number;
  edge:         number;
  pinH:         number;
  sortedImages: ImageObject[];
  slideIndex:   number;
  slideFade:    Animated.Value;
  dd:           DeviceDisplay;
  loaded:       boolean;
  P:            (w: "400" | "600" | "700") => string;
}) {
  const LBL_H = dd.description ? 54 : 36;

  const availW = screenW - edge * 2;
  const availH = screenH - edge * 2 - pinH - LBL_H;

  // Largest A4 portrait card that fits
  const byWidth  = { w: availW,             h: availW / A4_RATIO };
  const byHeight = { w: availH * A4_RATIO,  h: availH };
  const { w: cardW, h: cardH } = byWidth.h <= availH ? byWidth : byHeight;

  const img = sortedImages[slideIndex]!;

  return (
    <View style={{ alignItems: "center" }}>
      {/* Shadow */}
      <View style={[st.cardShadow, { width: cardW, height: cardH, position: "relative", top: 7, left: 7, marginBottom: -cardH - 7 }]} />

      {/* Card */}
      <View
        style={{
          width:           cardW,
          height:          cardH,
          backgroundColor: C.white,
          borderRadius:    6,
          overflow:        "hidden",
          borderWidth:     1,
          borderColor:     C.border,
        }}
      >
        <Animated.View style={{ width: cardW, height: cardH, opacity: slideFade }}>
          <Image
            source={{ uri: `data:${img.mimeType};base64,${img.imageBase64}` }}
            style={{ width: cardW, height: cardH }}
            resizeMode="cover"
          />
        </Animated.View>

        {sortedImages.length > 1 && (
          <>
            <View style={st.slideChip}>
              <Text style={[st.slideChipT, { fontFamily: loaded ? P("600") : "System" }]}>
                {slideIndex + 1} / {sortedImages.length}
              </Text>
            </View>
            <View style={st.slideDots} pointerEvents="none">
              {sortedImages.map((_, i) => (
                <View key={i} style={[st.slideDot, i === slideIndex && st.slideDotActive]} />
              ))}
            </View>
          </>
        )}
      </View>

      {/* Label below card */}
      <View style={[st.labelBar, { width: cardW, height: LBL_H }]}>
        {dd.title ? (
          <Text style={[st.labelText, { fontFamily: loaded ? P("600") : "System" }]} numberOfLines={1}>
            {dd.title}
          </Text>
        ) : null}
        {dd.description ? (
          <Text style={[st.descText, { fontFamily: loaded ? P("400") : "System" }]} numberOfLines={1}>
            {dd.description}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

// ─── No Images ────────────────────────────────────────────────────────────────
function NoImagesScreen({
  loaded, P, title,
}: { loaded: boolean; P: (w: "400" | "600" | "700") => string; title?: string }) {
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -8, duration: 900, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0,  duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={[st.root, { alignItems: "center", justifyContent: "center" }]}>
      <View style={{ alignSelf: "center", marginBottom: -4, zIndex: 10 }}>
        <Pin color={C.brown} />
      </View>
      <Animated.View style={[st.noImgCard, { transform: [{ translateY: bounce }] }]}>
        <View style={st.noImgIconWrap}>
          <Text style={{ fontSize: 34 }}>📌</Text>
        </View>
        <Text style={[st.noImgHeading, { fontFamily: loaded ? P("700") : "System" }]}>
          Nothing pinned yet
        </Text>
        <Text style={[st.noImgSub, { fontFamily: loaded ? P("400") : "System" }]}>
          {title ? `"${title}" has no images attached` : "This board is empty.\nAdd images to display them here."}
        </Text>
        <View style={st.noImgDivider} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.green }} />
          <Text style={[{ fontSize: 12, color: C.textLight }, { fontFamily: loaded ? P("400") : "System" }]}>
            Watching for new content…
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Waiting Screen ───────────────────────────────────────────────────────────
function WaitingScreen({ loaded, P }: { loaded: boolean; P: (w: "400" | "600" | "700") => string }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={st.waiting}>
      <Animated.View style={[st.logoCircle, { transform: [{ scale }] }]}>
        <Text style={{ fontSize: 44 }}>📺</Text>
      </Animated.View>
      <Text style={[st.waitT, { fontFamily: loaded ? P("700") : "System" }]}>Screenova Display</Text>
      <Text style={[st.waitS, { fontFamily: loaded ? P("400") : "System" }]}>Connecting to board…</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {[0, 1, 2].map(i => <WaitDot key={i} delay={i * 280} />)}
      </View>
    </View>
  );
}

function WaitDot({ delay }: { delay: number }) {
  const op = useRef(new Animated.Value(0.25)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(op, { toValue: 1,    duration: 450, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.25, duration: 450, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[st.waitDot, { opacity: op }]} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  bgDot: {
    position:        "absolute",
    width:           3,
    height:          3,
    borderRadius:    1.5,
    backgroundColor: C.blue,
    opacity:         0.07,
  },

  cardShadow: {
    position:        "absolute",
    backgroundColor: C.navy,
    opacity:         0.09,
    borderRadius:    6,
  },

  emptySlot: {
    flex:            1,
    backgroundColor: C.brownLight,
    alignItems:      "center",
    justifyContent:  "center",
  },
  emptyIcon: { fontSize: 28, opacity: 0.4 },

  // ── Label bar ──
  labelBar: {
    paddingHorizontal: 12,
    paddingVertical:   4,
    backgroundColor:   C.white,
    justifyContent:    "center",
    borderTopWidth:    1,
    borderTopColor:    C.border,
  },
  labelText: {
    fontSize:      10,
    color:         C.brown,
    letterSpacing: 1.0,
    textTransform: "uppercase",
  },
  descText: {
    fontSize:  10,
    color:     C.textLight,
    marginTop: 2,
  },

  // ── Pin ──
  pinWrap: { alignItems: "center", width: 24 },
  pinGlow: {
    position:     "absolute",
    top:          -5,
    width:        30,
    height:       30,
    borderRadius: 15,
  },
  pinHead: {
    width:        22,
    height:       22,
    borderRadius: 11,
    borderWidth:  2.5,
    ...Platform.select({
      ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.5, shadowRadius: 4 },
      android: { elevation: 8 },
    }),
  },
  pinShine: {
    position:        "absolute",
    top:             3,
    left:            4,
    width:           7,
    height:          7,
    borderRadius:    3.5,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  pinNeedle: {
    width:                   2,
    height:                  7,
    backgroundColor:         "#8A9BB0",
    borderBottomLeftRadius:  2,
    borderBottomRightRadius: 2,
    marginTop:               -1,
  },
  pinGround: {
    width:           14,
    height:          3,
    borderRadius:    7,
    backgroundColor: "rgba(0,0,0,0.12)",
    marginTop:       1,
  },

  // ── Slideshow ──
  slideChip: {
    position:          "absolute",
    top:               12,
    right:             12,
    backgroundColor:   C.navy + "CC",
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      20,
  },
  slideChipT: { color: C.white, fontSize: 11 },
  slideDots: {
    position:       "absolute",
    bottom:         16,
    left:           0,
    right:          0,
    flexDirection:  "row",
    justifyContent: "center",
    gap:            7,
  },
  slideDot:       { width: 7,  height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.4)" },
  slideDotActive: { width: 22, height: 7, borderRadius: 4, backgroundColor: C.white },

  // ── Info bar ──
  infoBar: {
    position:        "absolute",
    bottom:          0,
    left:            0,
    backgroundColor: C.navy + "F2",
    borderTopWidth:  1,
    borderTopColor:  C.blueMid + "55",
  },
  infoInner: {
    flexDirection:     "row",
    alignItems:        "center",
    paddingHorizontal: 20,
    paddingVertical:   12,
    gap:               12,
  },
  infoDot:   { width: 10, height: 10, borderRadius: 5, backgroundColor: C.green },
  infoTitle: { color: C.white,     fontSize: 15 },
  infoMsg:   { color: C.blueLight, fontSize: 12, marginTop: 2, opacity: 0.85 },

  // ── No images ──
  noImgCard: {
    backgroundColor:   C.white,
    borderRadius:      8,
    paddingHorizontal: 40,
    paddingTop:        32,
    paddingBottom:     28,
    alignItems:        "center",
    maxWidth:          420,
    marginHorizontal:  32,
    borderWidth:       1,
    borderColor:       C.border,
    ...Platform.select({
      ios:     { shadowColor: C.navy, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.13, shadowRadius: 20 },
      android: { elevation: 14 },
    }),
  },
  noImgIconWrap: {
    width:           68,
    height:          68,
    borderRadius:    34,
    backgroundColor: C.brownLight,
    alignItems:      "center",
    justifyContent:  "center",
    marginBottom:    16,
  },
  noImgHeading: { fontSize: 20, color: C.navy,    marginBottom: 10, textAlign: "center" },
  noImgSub:     { fontSize: 13, color: C.textMid, textAlign: "center", lineHeight: 20 },
  noImgDivider: { width: 40, height: 2, backgroundColor: C.brownLight, borderRadius: 2, marginVertical: 18 },

  // ── Waiting ──
  waiting: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg },
  logoCircle: {
    width:           90,
    height:          90,
    borderRadius:    45,
    backgroundColor: C.blueLight,
    alignItems:      "center",
    justifyContent:  "center",
    marginBottom:    22,
    borderWidth:     1.5,
    borderColor:     C.blue + "44",
  },
  waitT:   { color: C.navy,    fontSize: 22, marginBottom: 8 },
  waitS:   { color: C.textMid, fontSize: 13, marginBottom: 22 },
  waitDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.brown },
});