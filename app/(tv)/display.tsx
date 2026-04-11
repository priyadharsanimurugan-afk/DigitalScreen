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

const C = {
  navy: "#0F2557",
  blue: "#1E3A8A",
  blueMid: "#2563EB",
  blueLight: "#DBEAFE",
  brown: "#7C4A1E",
  brownLight: "#F5EDE4",
  white: "#FFFFFF",
  bg: "#EEF2FF",
  border: "#D1D9F0",
  textMid: "#475569",
  textLight: "#94A3B8",
  green: "#10B981",
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

type ImageObject = {
  imageId: number;
  imageurl: string;
  mimeType: string;
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

const getSortedImages = (imgs?: ImageObject[] | null): ImageObject[] =>
  imgs
    ? [...imgs].sort((a, b) => {
        if (a.sortOrder != null && b.sortOrder != null) {
          return a.sortOrder - b.sortOrder;
        }
        return 0; // keep original order if sortOrder missing
      })
    : [];


const isFeatureLayout = (l: string): l is FeatureLayout =>
  FEATURE_LAYOUTS.includes(l as FeatureLayout);

type LayoutInfo = {
  cols: number;
  rows: number;
  isSlideshow: boolean;
  isFeature: boolean;
  featureLayout?: FeatureLayout;
};

const getLayoutInfo = (
  layoutInput: string | ScreenLayoutObject,
  imageCount: number
): LayoutInfo => {
  // Extract the layout string from the object if needed
  const layout =
    typeof layoutInput === "object" && layoutInput !== null
      ? layoutInput.value
      : layoutInput;

  // Now layout is guaranteed to be a string
  if (isFeatureLayout(layout)) {
    return {
      cols: 0,
      rows: 0,
      isSlideshow: false,
      isFeature: true,
      featureLayout: layout,
    };
  }

  if (layout?.includes("x")) {
    const [r, c] = layout.split("x").map(Number);
    if (r > 0 && c > 0) {
      return {
        cols: c,
        rows: r,
        isSlideshow: imageCount > r * c,
        isFeature: false,
      };
    }
  }

  switch (layout) {
    case "left_right":
      return { cols: 2, rows: 1, isSlideshow: false, isFeature: false };
    case "top_bottom":
      return { cols: 1, rows: 2, isSlideshow: false, isFeature: false };
    case "grid_4":
      return { cols: 2, rows: 2, isSlideshow: false, isFeature: false };
    default:
      return { cols: 1, rows: 1, isSlideshow: imageCount > 1, isFeature: false };
  }
};

const lighten = (hex: string): string => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${Math.min(255, ((n >> 16) & 0xff) + 70)},${Math.min(
    255,
    ((n >> 8) & 0xff) + 70
  )},${Math.min(255, (n & 0xff) + 70)})`;
};

function Pin({ color }: { color: string }) {
  return (
    <View style={st.pinWrap} pointerEvents="none">
      <View style={[st.pinGlow, { backgroundColor: color + "50" }]} />
      <View
        style={[
          st.pinHead,
          { backgroundColor: color, borderColor: lighten(color) },
        ]}
      >
        <View style={st.pinShine} />
      </View>
      <View style={st.pinNeedle} />
      <View style={st.pinGround} />
    </View>
  );
}

function ImageCell({
  img,
  pinColor,
}: {
  img: ImageObject | null;
  pinColor: string;
}) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  return (
    <View
      style={{ flex: 1 }}
      onLayout={(e) =>
        setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
      }
    >
      <View style={st.pinAnchor} pointerEvents="none">
        <Pin color={pinColor} />
      </View>
      <View style={st.cell}>

        {img?.imageurl && size ? (
          <Image
            source={{ uri: img.imageurl }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="contain"
          />
        ) : img?.imageurl ? null : (
          <View style={st.emptySlot}>
            <Text style={st.emptyIcon}>🖼️</Text>
          </View>
        )}
      </View>
    </View>
  );
}
function FeatureLayoutView({
  layout,
  images,
  gap,
}: {
  layout: FeatureLayout;
  images: ImageObject[];
  gap: number;
}) {
  const slots = [images[0] ?? null, images[1] ?? null, images[2] ?? null];



  const Feature = (
    <View style={{ flex: 3 }}>
      <ImageCell img={slots[0]} pinColor={PIN_PALETTE[0]!} />
    </View>
  );

  const SmallsH = (
    <View style={{ flex: 2, gap }}>
      <View style={{ flex: 1 }}>
        <ImageCell img={slots[1]} pinColor={PIN_PALETTE[1]!} />
      </View>
      <View style={{ flex: 1 }}>
        <ImageCell img={slots[2]} pinColor={PIN_PALETTE[2]!} />
      </View>
    </View>
  );

  const SmallsV = (
    <View style={{ flex: 2, flexDirection: "row", gap }}>
      <View style={{ flex: 1 }}>
        <ImageCell img={slots[1]} pinColor={PIN_PALETTE[1]!} />
      </View>
      <View style={{ flex: 1 }}>
        <ImageCell img={slots[2]} pinColor={PIN_PALETTE[2]!} />
      </View>
    </View>
  );

  if (layout === "f2")
    return (
      <View style={{ flex: 1, flexDirection: "row", gap }}>
        {Feature}
        {SmallsH}
      </View>
    );

  if (layout === "2f")
    return (
      <View style={{ flex: 1, flexDirection: "row", gap }}>
        {SmallsH}
        {Feature}
      </View>
    );

  if (layout === "ft")
    return (
      <View style={{ flex: 1, gap }}>
        {Feature}
        {SmallsV}
      </View>
    );

  return (
    <View style={{ flex: 1, gap }}>
      {SmallsV}
      {Feature}
    </View>
  );
}

function SlideshowView({
  images,
  slideIndex,
  slideFade,
  dd,
  loaded,
  P,
}: {
  images: ImageObject[];
  slideIndex: number;
  slideFade: Animated.Value;
  dd: DeviceDisplay;
  loaded: boolean;
  P: (w: string) => string;
}) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const img = images[slideIndex]!;

  return (
    <View
      style={{ flex: 1 }}
      onLayout={(e) =>
        setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
      }
    >
      <View style={st.pinAnchor} pointerEvents="none">
        <Pin color={PIN_PALETTE[0]!} />
      </View>
      <View style={st.cell}>
        {size && (
          <Animated.View style={{ flex: 1, opacity: slideFade }}>
            <Image
              source={{ uri: img.imageurl }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
           
          </Animated.View>
        )}
        {images.length > 1 && (
          <>
            <View style={st.slideChip}>
              <Text
                style={[
                  st.slideChipT,
                  { fontFamily: loaded ? P("600") : undefined },
                ]}
              >
                {slideIndex + 1}/{images.length}
              </Text>
            </View>
            <View style={st.slideDots}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[st.slideDot, i === slideIndex && st.slideDotActive]}
                />
              ))}
            </View>
          </>
        )}
        {(dd.title || dd.description) && (
          <View style={st.labelOverlay}>
            {dd.title && (
              <Text
                style={[
                  st.labelText,
                  { fontFamily: loaded ? P("600") : undefined },
                ]}
                numberOfLines={1}
              >
                {dd.title}
              </Text>
            )}
            {dd.description && (
              <Text
                style={[
                  st.descText,
                  { fontFamily: loaded ? P("400") : undefined },
                ]}
                numberOfLines={1}
              >
                {dd.description}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function NoImagesScreen({
  loaded,
  P,
  title,
}: {
  loaded: boolean;
  P: (w: string) => string;
  title?: string;
}) {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: -8,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={[st.root, { alignItems: "center", justifyContent: "center" }]}>
      <Animated.View style={[st.noImgCard, { transform: [{ translateY: bounce }] }]}>
        <Text style={{ fontSize: 34 }}>📌</Text>
        <Text
          style={[
            st.noImgHeading,
            { fontFamily: loaded ? P("700") : undefined },
          ]}
        >
          Nothing pinned yet
        </Text>
        <Text
          style={[st.noImgSub, { fontFamily: loaded ? P("400") : undefined }]}
        >
          {title ? `"${title}" has no images` : "This board is empty."}
        </Text>
      </Animated.View>
    </View>
  );
}

function WaitingScreen({ loaded, P }: { loaded: boolean; P: (w: string) => string }) {
  return (
    <View style={st.waiting}>
      <Text style={{ fontSize: 44 }}>📺</Text>
      <Text style={[st.waitT, { fontFamily: loaded ? P("700") : undefined }]}>
        Screenova
      </Text>
    </View>
  );
}

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

  const [loaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const P = (w: string) =>
    ({
      "400": "Poppins_400Regular",
      "600": "Poppins_600SemiBold",
      "700": "Poppins_700Bold",
    }[w] || "System");

  const { loading, deviceDisplay, fetchDeviceDisplay } = useContent();

  const transitionToNewContent = (newData: DeviceDisplay) => {
    if (isTransitioning) {
      nextContentRef.current = newData;
      return;
    }
    setIsTransitioning(true);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSlideIndex(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setIsTransitioning(false);
        if (nextContentRef.current) {
          const q = nextContentRef.current;
          nextContentRef.current = null;
          transitionToNewContent(q);
        }
      });
    });
  };

  const hasContentChanged = (
    old: DeviceDisplay | null,
    next: DeviceDisplay
  ): boolean => {
    if (!old) return true;
    const oi = getSortedImages(old.images);
    const ni = getSortedImages(next.images);
    return (
      old.id !== next.id ||
      old.title !== next.title ||
      JSON.stringify(old.screenLayout) !== JSON.stringify(next.screenLayout) ||
      oi.length !== ni.length ||
      oi.some(
        (o) => ni.find((n) => n.imageId === o.imageId)?.imageurl !== o.imageurl
      )
    );
  };

  const loadDeviceDisplay = async () => {
    try {
      const data = (await fetchDeviceDisplay()) as DeviceDisplay | null;
      if (
        data &&
        !isTransitioning &&
        hasContentChanged(deviceDisplay as DeviceDisplay | null, data)
      ) {
        transitionToNewContent(data);
      }
    } catch {}
  };

  useEffect(() => {
    loadDeviceDisplay();
    isInitialLoadComplete.current = true;

    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      if (slideTimer.current) clearInterval(slideTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!isInitialLoadComplete.current) return;
    intervalIdRef.current = setInterval(loadDeviceDisplay, 5000);
    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  }, [deviceDisplay]);

  useEffect(() => {
    if (slideTimer.current) clearInterval(slideTimer.current);
    if (!deviceDisplay) return;

    const imgs = getSortedImages(deviceDisplay.images);
    const { isSlideshow } = getLayoutInfo(
      deviceDisplay.screenLayout,
      imgs.length
    );

    if (!isSlideshow || imgs.length <= 1) {
      setSlideIndex(0);
      return;
    }

    slideTimer.current = setInterval(() => {
      Animated.timing(slideFade, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setSlideIndex((p) => (p + 1) % imgs.length);
        Animated.timing(slideFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 4000);

    return () => {
      if (slideTimer.current) clearInterval(slideTimer.current);
    };
  }, [deviceDisplay]);

  if (loading && !deviceDisplay) return <WaitingScreen loaded={loaded} P={P} />;
  if (!deviceDisplay) return <WaitingScreen loaded={loaded} P={P} />;

  const dd = deviceDisplay;
 const sortedImages = getSortedImages(dd.images);




  if (sortedImages.length === 0) {
    return <NoImagesScreen loaded={loaded} P={P} title={dd.title} />;
  }

  const { cols, rows, isSlideshow, isFeature, featureLayout } = getLayoutInfo(
    dd.screenLayout,
    sortedImages.length
  );

  const GAP = 10;

  return (
    <View style={[st.root, { width: SW, height: SH }]}>
      <StatusBar hidden />
      <Animated.View style={{ opacity: fadeAnim, flex: 1, padding: GAP }}>
        {isFeature && featureLayout ? (
          <FeatureLayoutView
            layout={featureLayout}
            images={sortedImages}
            gap={GAP}
          />
        ) : !isSlideshow ? (
          <View style={{ flex: 1, flexDirection: "column", gap: GAP }}>
            {Array.from({ length: rows }, (_, r) => (
              <View key={r} style={{ flex: 1, flexDirection: "row", gap: GAP }}>
                {Array.from({ length: cols }, (__, c) => {
                  const img = sortedImages[r * cols + c] ?? null;
                  return (
                    <View key={c} style={{ flex: 1 }}>
                      <ImageCell
                        img={img}
                        pinColor={PIN_PALETTE[(r * cols + c) % PIN_PALETTE.length]!}
                      />
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        ) : (
          <SlideshowView
            images={sortedImages}
            slideIndex={slideIndex}
            slideFade={slideFade}
            dd={dd}
            loaded={loaded}
            P={P}
          />
        )}
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  cell: {
    flex: 1,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
    ...Platform.select({
      ios: {
        shadowColor: C.navy,
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: { elevation: 5 },
    }),
  },
  emptySlot: {
    flex: 1,
    backgroundColor: C.brownLight,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: { fontSize: 28, opacity: 0.4 },
  pinAnchor: {
    position: "absolute",
    top: -4,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  pinWrap: { alignItems: "center", width: 24 },
  pinGlow: {
    position: "absolute",
    top: -5,
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  pinHead: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
      },
      android: { elevation: 8 },
    }),
  },
  pinShine: {
    position: "absolute",
    top: 3,
    left: 4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  pinNeedle: {
    width: 2,
    height: 7,
    backgroundColor: "#8A9BB0",
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    marginTop: -1,
  },
  pinGround: {
    width: 14,
    height: 3,
    borderRadius: 7,
    backgroundColor: "rgba(0,0,0,0.12)",
    marginTop: 1,
  },
  slideChip: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: C.navy + "CC",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    zIndex: 10,
  },
  slideChipT: { color: C.white, fontSize: 11 },
  slideDots: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 7,
    zIndex: 10,
  },
  slideDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  slideDotActive: {
    width: 22,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.white,
  },
  labelOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.navy + "D0",
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 10,
  },
  labelText: {
    fontSize: 13,
    color: C.white,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  descText: {
    fontSize: 11,
    color: C.blueLight,
    marginTop: 2,
    opacity: 0.85,
  },
  noImgCard: {
    backgroundColor: C.white,
    borderRadius: 8,
    padding: 30,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: C.navy,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.13,
        shadowRadius: 20,
      },
      android: { elevation: 14 },
    }),
  },
  noImgHeading: { fontSize: 20, color: C.navy, marginVertical: 10 },
  noImgSub: { fontSize: 13, color: C.textMid, textAlign: "center" },
  waiting: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
  },
  waitT: { color: C.navy, fontSize: 22, marginTop: 10 },
});