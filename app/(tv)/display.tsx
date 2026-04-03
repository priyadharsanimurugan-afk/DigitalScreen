// app/(tv)/display.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, Image, StyleSheet, useWindowDimensions,
  Animated, StatusBar,
} from "react-native";
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins";

const BIN_ID  = "69cf9d46856a682189f6fd6a";
const API_KEY = "$2a$10$Efm/UAU.d8QJEPXSqWD.weXXqJoyK9vlSUK.TsKSF5PuOmWWJqmm2";

type Payload = {
  images:    string[];
  layout:    { cols:number; rows:number; slots:number; label:string };
  ratio:     number;
  title:     string;
  message:   string;
  sentAt:    string | null;
  slideshow: boolean;
};

const EMPTY: Payload = {
  images: [], layout:{ cols:1, rows:1, slots:1, label:"Full" },
  ratio: 16/9, title:"", message:"", sentAt:null, slideshow:false,
};

export default function TVDisplay() {
  const { width:SW, height:SH } = useWindowDimensions();
  const [data, setData]           = useState<Payload>(EMPTY);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const fadeAnim      = useRef(new Animated.Value(1)).current;
  const slideFade     = useRef(new Animated.Value(1)).current;
  const barAnim       = useRef(new Animated.Value(80)).current;
  const nextContentRef = useRef<Payload | null>(null);
  const slideTimer    = useRef<NodeJS.Timeout | null>(null);

  const [loaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold });
  const P = (w:"400"|"600"|"700") =>
    ({ "400":"Poppins_400Regular","600":"Poppins_600SemiBold","700":"Poppins_700Bold" }[w] as string);

  // ── Smooth page-level transition when new content arrives ──────────────
  const transitionToNewContent = (newData: Payload) => {
    if (isTransitioning) {
      nextContentRef.current = newData;
      return;
    }
    setIsTransitioning(true);

    Animated.timing(fadeAnim, { toValue:0, duration:300, useNativeDriver:true }).start(() => {
      setData(newData);
      setSlideIndex(0);

      Animated.timing(fadeAnim, { toValue:1, duration:500, useNativeDriver:true }).start(() => {
        setIsTransitioning(false);
        if (nextContentRef.current) {
          const queued = nextContentRef.current;
          nextContentRef.current = null;
          transitionToNewContent(queued);
        }
      });
    });

    if (newData.title) {
      barAnim.setValue(80);
      Animated.sequence([
        Animated.timing(barAnim, { toValue:0,  duration:420, useNativeDriver:true }),
        Animated.delay(4500),
        Animated.timing(barAnim, { toValue:80, duration:380, useNativeDriver:true }),
      ]).start();
    }
  };

  // ── Poll JSONBin ───────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted  = true;
    let lastVersion = "";
    let timeoutId: NodeJS.Timeout | undefined;

    const fetchContent = async () => {
      try {
        const res  = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
          headers: { "X-Master-Key": API_KEY },
        });
        const json = await res.json();
        if (!isMounted) return;
        const newData = json?.record;
        if (newData?.images) {
          const version = JSON.stringify({ images:newData.images, title:newData.title, message:newData.message });
          if (version !== lastVersion && !isTransitioning) {
            lastVersion = version;
            transitionToNewContent(newData);
          }
        }
      } catch (err) {
        console.log("Fetch error:", err);
      }
      if (isMounted) timeoutId = setTimeout(fetchContent, 3000);
    };

    fetchContent();
    return () => { isMounted = false; if (timeoutId) clearTimeout(timeoutId); };
  }, []);

  // ── Slideshow timer — cross-fade between slides ────────────────────────
  useEffect(() => {
    if (slideTimer.current) clearInterval(slideTimer.current);

    const isSlideshow = data.slideshow && data.layout.cols === 1 && data.layout.rows === 1 && data.images.length > 1;
    if (!isSlideshow) { setSlideIndex(0); return; }

    slideTimer.current = setInterval(() => {
      // Fade out current slide
      Animated.timing(slideFade, { toValue:0, duration:400, useNativeDriver:true }).start(() => {
        setSlideIndex(prev => (prev + 1) % data.images.length);
        // Fade in next slide
        Animated.timing(slideFade, { toValue:1, duration:500, useNativeDriver:true }).start();
      });
    }, 4000);

    return () => { if (slideTimer.current) clearInterval(slideTimer.current); };
  }, [data]);

  const { images, layout, ratio, title, message, sentAt, slideshow } = data;
  const { cols, rows } = layout;
  const hasContent = images?.length > 0;
  const isSlideshow = slideshow && cols === 1 && rows === 1 && images.length > 1;

  // Compute display box dimensions
  let dispW = SW, dispH = SH;
  const screenRatio = SW / SH;
  if (ratio > screenRatio) { dispW = SW; dispH = SW / ratio; }
  else                     { dispH = SH; dispW = SH * ratio; }

  return (
    <View style={[s.root, { width:SW, height:SH }]}>
      <StatusBar hidden/>

      {hasContent ? (
        <Animated.View style={{ flex:1, opacity:fadeAnim, alignItems:"center", justifyContent:"center" }}>

          {/* ── Display Box ── */}
          <View style={[s.displayBox, { width:dispW, height:dispH }]}>

            {/* Slideshow: single cross-fading image */}
            {isSlideshow ? (
              <Animated.View style={{ flex:1, opacity:slideFade }}>
                <Image
                  source={{ uri: images[slideIndex] }}
                  style={{ width:"100%", height:"100%" }}
                  resizeMode="cover"
                />
              </Animated.View>
            ) : (
              /* Multi-slot grid */
              <View style={{ flex:1, flexDirection:"row", flexWrap:"wrap" }}>
                {Array.from({ length: cols * rows }).map((_,i) => {
                  const uri = images[i];
                  return (
                    <View key={i} style={{ width:dispW/cols, height:dispH/rows }}>
                      {uri
                        ? <Image source={{ uri }} style={{ width:"100%", height:"100%" }} resizeMode="cover" fadeDuration={300}/>
                        : <View style={s.emptySlot}>
                            <Text style={[s.emptyT, { fontFamily:loaded?P("400"):"System" }]}>Slot {i+1}</Text>
                          </View>
                      }
                    </View>
                  );
                })}
              </View>
            )}

            {/* Grid lines for multi-slot */}
            {!isSlideshow && (cols > 1 || rows > 1) && (
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {Array.from({ length:cols-1 }).map((_,i) => (
                  <View key={`v${i}`} style={[s.gridLine, s.gridV, { left:(dispW/cols)*(i+1) }]}/>
                ))}
                {Array.from({ length:rows-1 }).map((_,i) => (
                  <View key={`h${i}`} style={[s.gridLine, s.gridH, { top:(dispH/rows)*(i+1) }]}/>
                ))}
              </View>
            )}

            {/* Slide indicator dots */}
            {isSlideshow && (
              <View style={s.slideDots} pointerEvents="none">
                {images.map((_,i) => (
                  <View key={i} style={[s.slideDot, i===slideIndex && s.slideDotA]}/>
                ))}
              </View>
            )}
          </View>

          {/* ── Info Bar ── */}
          {title ? (
            <Animated.View style={[
              s.infoBar,
              { width:dispW, bottom:(SH-dispH)/2, transform:[{ translateY:barAnim }] },
            ]}>
              <View style={s.infoInner}>
                <View style={s.infoDot}/>
                <View style={{ flex:1 }}>
                  <Text style={[s.infoTitle, { fontFamily:loaded?P("700"):"System" }]} numberOfLines={1}>{title}</Text>
                  {message ? (
                    <Text style={[s.infoMsg, { fontFamily:loaded?P("400"):"System" }]} numberOfLines={1}>{message}</Text>
                  ) : null}
                </View>
                {sentAt ? (
                  <Text style={[s.infoTime, { fontFamily:loaded?P("400"):"System" }]}>{sentAt}</Text>
                ) : null}
              </View>
            </Animated.View>
          ) : null}

          {/* ── Ratio / Layout Badge ── */}
          <View style={[s.ratioBadge, { top:(SH-dispH)/2+12, right:(SW-dispW)/2+12 }]}>
            <Text style={[s.ratioBadgeT, { fontFamily:loaded?P("600"):"System" }]}>
              {isSlideshow
                ? `Slideshow · ${slideIndex+1}/${images.length}`
                : `${layout.label}  ·  ${cols}×${rows}`
              }
            </Text>
          </View>

        </Animated.View>
      ) : (
        <WaitingScreen loaded={loaded} P={P}/>
      )}
    </View>
  );
}

// ── Waiting screen ──────────────────────────────────────────────────────────
function WaitingScreen({ loaded, P }: { loaded:boolean; P:(w:"400"|"600"|"700")=>string }) {
  return (
    <View style={s.waiting}>
      <PulseLogo/>
      <Text style={[s.waitT, { fontFamily:loaded?P("700"):"System" }]}>Screenova Display</Text>
      <Text style={[s.waitS, { fontFamily:loaded?P("400"):"System" }]}>Ready to display content</Text>
      <View style={s.dots}>
        {[0,1,2].map(i => <WaitDot key={i} delay={i*280}/>)}
      </View>
    </View>
  );
}

function PulseLogo() {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue:1.12, duration:900, useNativeDriver:true }),
        Animated.timing(scale, { toValue:1,    duration:900, useNativeDriver:true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[s.logoCircle, { transform:[{ scale }] }]}>
      <Text style={{ fontSize:48 }}>📺</Text>
    </Animated.View>
  );
}

function WaitDot({ delay }: { delay:number }) {
  const op = useRef(new Animated.Value(0.25)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(op, { toValue:1,    duration:450, useNativeDriver:true }),
        Animated.timing(op, { toValue:0.25, duration:450, useNativeDriver:true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={[s.dot, { opacity:op }]}/>;
}

const s = StyleSheet.create({
  root: { backgroundColor:"#030712", alignItems:"center", justifyContent:"center" },
  displayBox: { overflow:"hidden", shadowColor:"#000", shadowOpacity:0.8, shadowRadius:40, elevation:20 },
  emptySlot: { flex:1, backgroundColor:"#0F1929", alignItems:"center", justifyContent:"center",
    borderWidth:0.5, borderColor:"#ffffff08" },
  emptyT: { color:"#ffffff18", fontSize:13 },
  gridLine: { position:"absolute", backgroundColor:"#00000066" },
  gridV: { width:1.5, top:0, bottom:0 },
  gridH: { height:1.5, left:0, right:0 },
  slideDots: { position:"absolute", bottom:20, left:0, right:0,
    flexDirection:"row", justifyContent:"center", gap:8 },
  slideDot: { width:8, height:8, borderRadius:4, backgroundColor:"#ffffff40" },
  slideDotA: { width:24, backgroundColor:"#fff" },
  infoBar: { position:"absolute", left:0, backgroundColor:"#000000E0",
    borderTopWidth:1, borderTopColor:"#ffffff0A" },
  infoInner: { flexDirection:"row", alignItems:"center", paddingHorizontal:24, paddingVertical:14, gap:14 },
  infoDot: { width:10, height:10, borderRadius:5, backgroundColor:"#22C55E" },
  infoTitle: { color:"#F1F5F9", fontSize:18 },
  infoMsg: { color:"#94A3B8", fontSize:13, marginTop:3 },
  infoTime: { color:"#475569", fontSize:11 },
  ratioBadge: { position:"absolute", backgroundColor:"#000000AA",
    paddingHorizontal:10, paddingVertical:5, borderRadius:8,
    borderWidth:1, borderColor:"#ffffff12" },
  ratioBadgeT: { color:"#94A3B8", fontSize:10, letterSpacing:0.5 },
  waiting: { flex:1, alignItems:"center", justifyContent:"center", backgroundColor:"#030712" },
  logoCircle: { width:110, height:110, borderRadius:55, backgroundColor:"#1E3A8A1A",
    alignItems:"center", justifyContent:"center", marginBottom:28,
    borderWidth:1, borderColor:"#1E3A8A44" },
  waitT: { color:"#E2E8F0", fontSize:26, marginBottom:10 },
  waitS: { color:"#475569", fontSize:14, marginBottom:24 },
  dots: { flexDirection:"row", gap:10, marginBottom:32 },
  dot: { width:9, height:9, borderRadius:5, backgroundColor:"#1E3A8A" },
});