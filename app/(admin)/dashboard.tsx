// app/(admin)/dashboard.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, ScrollView, Image, TouchableOpacity, TextInput,
  StyleSheet, useWindowDimensions, Animated, ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  useFonts,
  Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, Poppins_500Medium,
} from "@expo-google-fonts/poppins";
import { router } from "expo-router";

const B = "#1E3A8A", BL = "#EEF2FF", G = "#94A3B8", S = "#F1F5F9";

const MOCK = [
  { id:"1",  uri:"https://picsum.photos/seed/a1/600/400",  label:"Gym Session",    tag:"gym"     },
  { id:"2",  uri:"https://picsum.photos/seed/a2/600/400",  label:"Fitness Promo",  tag:"fitness" },
  { id:"3",  uri:"https://picsum.photos/seed/a3/600/400",  label:"Food Special",   tag:"food"    },
  { id:"4",  uri:"https://picsum.photos/seed/a4/600/400",  label:"Hotel Lobby",    tag:"hotel"   },
  { id:"5",  uri:"https://picsum.photos/seed/a5/600/400",  label:"Sale Banner",    tag:"sale"    },
  { id:"6",  uri:"https://picsum.photos/seed/a6/600/400",  label:"Event Night",    tag:"event"   },
  { id:"7",  uri:"https://picsum.photos/seed/a7/600/400",  label:"Morning Yoga",   tag:"gym"     },
  { id:"8",  uri:"https://picsum.photos/seed/a8/600/400",  label:"Tech Launch",    tag:"tech"    },
  { id:"9",  uri:"https://picsum.photos/seed/a9/600/400",  label:"Menu Board",     tag:"food"    },
  { id:"10", uri:"https://picsum.photos/seed/a10/600/400", label:"Welcome Screen", tag:"hotel"   },
  { id:"11", uri:"https://picsum.photos/seed/a11/600/400", label:"Sports Day",     tag:"fitness" },
  { id:"12", uri:"https://picsum.photos/seed/a12/600/400", label:"Brand Story",    tag:"brand"   },
];

const TAGS    = ["All","gym","fitness","food","hotel","sale","event","tech","brand"];
const RATIOS  = [{ l:"1:1",v:1 },{ l:"4:3",v:4/3 },{ l:"16:9",v:16/9 },{ l:"2:1",v:2 }];
const LAYOUTS = [
  { label:"Full", cols:1, rows:1, slots:1 },
  { label:"1×2",  cols:1, rows:2, slots:2 },
  { label:"2×1",  cols:2, rows:1, slots:2 },
  { label:"2×2",  cols:2, rows:2, slots:4 },
  { label:"3×1",  cols:3, rows:1, slots:3 },
  { label:"1×3",  cols:1, rows:3, slots:3 },
];

const SLIDESHOW_MAX = 10;

// Pure helper — no hooks
function poppins(w: "400"|"500"|"600"|"700"): string {
  return `Poppins_${
    w==="400"?"400Regular":w==="500"?"500Medium":w==="600"?"600SemiBold":"700Bold"
  }`;
}

// ── Preview — defined OUTSIDE Dashboard so it never breaks hook order ──────
type ImgItem = { id:string; uri:string; label:string; tag:string };
type PreviewProps = {
  ratio: { l:string; v:number };
  layout: { label:string; cols:number; rows:number; slots:number };
  selImgs: ImgItem[];
  isFullLayout: boolean;
  previewSlide: number;
  title: string;
  msg: string;
};

function Preview({ ratio, layout, selImgs, isFullLayout, previewSlide, title, msg }: PreviewProps) {
  const previewImg = isFullLayout ? (selImgs[previewSlide] ?? selImgs[0]) : undefined;
  return (
    <View style={[pv.wrap, { aspectRatio: ratio.v }]}>
      <View style={pv.bar}>
        {[B,"#3B82F6","#22C55E"].map((c,i) => (
          <View key={i} style={[pv.dot, { backgroundColor:c }]}/>
        ))}
        <Text style={[pv.barT, { fontFamily:poppins("400") }]}>
          Live Preview · {ratio.l} · {layout.label}
          {isFullLayout && selImgs.length > 1 ? ` · Slideshow (${selImgs.length})` : ""}
        </Text>
        <View style={pv.liveBadge}>
          <View style={pv.liveDot}/>
          <Text style={[pv.liveT, { fontFamily:poppins("600") }]}>LIVE</Text>
        </View>
      </View>

      <View style={{ flex:1, flexDirection:"row", flexWrap:"wrap" }}>
        {Array.from({ length: layout.cols * layout.rows }).map((_,i) => {
          const img = isFullLayout ? previewImg : selImgs[i];
          return (
            <View key={i} style={{ width:`${100/layout.cols}%` as any, height:`${100/layout.rows}%` as any }}>
              {img
                ? <Image source={{ uri:img.uri }} style={{ width:"100%", height:"100%" }} resizeMode="cover"/>
                : <View style={pv.empty}><Text style={[pv.emptyT,{fontFamily:poppins("400")}]}>Slot {i+1}</Text></View>
              }
            </View>
          );
        })}
      </View>

      {isFullLayout && selImgs.length > 1 && (
        <View style={pv.slideDots}>
          {selImgs.map((_,i) => (
            <View key={i} style={[pv.slideDot, i===previewSlide && pv.slideDotA]}/>
          ))}
        </View>
      )}

      {title ? (
        <View style={pv.titleOverlay}>
          <Text style={[pv.titleOverlayT,{fontFamily:poppins("700")}]} numberOfLines={1}>{title}</Text>
          {msg ? <Text style={[pv.msgOverlayT,{fontFamily:poppins("400")}]} numberOfLines={1}>{msg}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

// ── LayoutIcon — also outside ──────────────────────────────────────────────
function LayoutIcon({ cols, rows, active }: { cols:number; rows:number; active:boolean }) {
  const c = active ? "#ffffff66" : "#CBD5E1";
  const size = 28, cw = size/cols - 1, rh = size/rows - 1;
  return (
    <View style={{ width:size, height:size, flexDirection:"row", flexWrap:"wrap", gap:1, marginBottom:4 }}>
      {Array.from({ length:cols*rows }).map((_,i) => (
        <View key={i} style={{ width:cw, height:rh, backgroundColor:c, borderRadius:1 }}/>
      ))}
    </View>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { width } = useWindowDimensions();
  const mob = width < 900;

  // All hooks — NEVER put an early return before these
  const [images, setImages]             = useState<ImgItem[]>(MOCK);
  const [sel, setSel]                   = useState<string[]>([]);
  const [ratio, setRatio]               = useState(RATIOS[2]);
  const [layout, setLayout]             = useState(LAYOUTS[0]);
  const [tag, setTag]                   = useState("All");
  const [title, setTitle]               = useState("Morning Motivation Ritual");
  const [msg, setMsg]                   = useState("Displayed on Main Lobby · Screen 01");
  const [sent, setSent]                 = useState(false);
  const [foc, setFoc]                   = useState<string|null>(null);
  const [loadingSend, setLoadingSend]   = useState(false);
  const [previewSlide, setPreviewSlide] = useState(0);
  const pulse      = useRef(new Animated.Value(1)).current;
  const slideTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold,
  });

  const isFullLayout = layout.slots === 1;

  // Slideshow preview cycling
  useEffect(() => {
    if (slideTimer.current) clearInterval(slideTimer.current);
    if (isFullLayout && sel.length > 1) {
      setPreviewSlide(0);
      slideTimer.current = setInterval(() => {
        setPreviewSlide(p => (p + 1) % sel.length);
      }, 1500);
    } else {
      setPreviewSlide(0);
    }
    return () => { if (slideTimer.current) clearInterval(slideTimer.current); };
  }, [sel, isFullLayout]);

  // Early return AFTER all hooks
  if (!fontsLoaded) return null;

  const filtered = tag === "All" ? images : images.filter(i => i.tag === tag);
  const selImgs  = sel.map(id => images.find(i => i.id === id)!).filter(Boolean);

  const toggle = (id: string) => {
    setSel(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      const limit = isFullLayout ? SLIDESHOW_MAX : layout.slots;
      if (prev.length < limit) return [...prev, id];
      return [...prev.slice(1), id];
    });
  };

  const pickImg = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection:true });
    if (!r.canceled)
      setImages(p => [
        ...r.assets.map((a,i) => ({ id:`c${Date.now()}${i}`, uri:a.uri, label:`Custom ${p.length+i+1}`, tag:"custom" })),
        ...p,
      ]);
  };

  const doSend = async () => {
    if (!sel.length) return;
    setLoadingSend(true);
    Animated.sequence([
      Animated.timing(pulse, { toValue:1.06, duration:150, useNativeDriver:true }),
      Animated.timing(pulse, { toValue:1,    duration:150, useNativeDriver:true }),
    ]).start();
    const BIN_ID  = "69cf9d46856a682189f6fd6a";
    const API_KEY = "$2a$10$Efm/UAU.d8QJEPXSqWD.weXXqJoyK9vlSUK.TsKSF5PuOmWWJqmm2";
    try {
      await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
        method: "PUT",
        headers: { "Content-Type":"application/json", "X-Master-Key":API_KEY },
        body: JSON.stringify({
          images:    selImgs.map(i => i.uri),
          layout,
          ratio:     ratio.v,
          title,
          message:   msg,
          sentAt:    new Date().toLocaleTimeString(),
          slideshow: isFullLayout && selImgs.length > 1,
        }),
      });
      setSent(true);
      setTimeout(() => setSent(false), 4000);
    } catch (err) {
      console.error("❌ Error:", err);
    } finally {
      setLoadingSend(false);
    }
  };

  return (
    <ScrollView style={s.root} showsVerticalScrollIndicator={false}>
      <View style={[s.wrap, mob && s.wrapM]}>

        {/* NAV */}
        <View style={s.nav}>
          <View style={s.navL}>
            <View style={s.navLogo}>
              <Image source={require("../../assets/images/logo.png")} style={s.navLogoImg} resizeMode="contain"/>
            </View>
            <View>
              <Text style={[s.navBrand,{fontFamily:poppins("700")}]}>Screenova</Text>
              <Text style={[s.navTag,  {fontFamily:poppins("600")}]}>ADMIN PORTAL</Text>
            </View>
          </View>
          <View style={s.navR}>
            <View style={s.adminPill}>
              <View style={s.adminDot}/>
              <Text style={[s.adminT,{fontFamily:poppins("600")}]}>admin</Text>
            </View>
            <TouchableOpacity style={s.logoutBtn} onPress={() => router.replace("/login")}>
              <Text style={[s.logoutT,{fontFamily:poppins("600")}]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PAGE TITLE */}
        <View style={s.pageTitleRow}>
          <View>
            <Text style={[s.pageTitle,{fontFamily:poppins("700")}]}>Dashboard</Text>
            <Text style={[s.pageSub,  {fontFamily:poppins("400")}]}>Build your signage · Preview · Send to TV</Text>
          </View>
          <View style={s.statRow}>
            {[
              { n:images.length.toString(), l:"Assets"   },
              { n:sel.length.toString(),    l:"Selected" },
              { n:"4K",                     l:"Display"  },
            ].map(({ n,l }) => (
              <View key={l} style={s.stat}>
                <Text style={[s.statN,{fontFamily:poppins("700")}]}>{n}</Text>
                <Text style={[s.statL,{fontFamily:poppins("400")}]}>{l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* MAIN */}
        <View style={[s.main, mob && s.mainCol]}>

          {/* LEFT: Media Library */}
          <View style={[s.card, { flex: mob ? undefined : 1.35 }]}>
            <View style={s.cardHead}>
              <Text style={[s.cardTitle,{fontFamily:poppins("700")}]}>Media Library</Text>
              <TouchableOpacity style={s.uploadBtn} onPress={pickImg}>
                <Text style={[s.uploadT,{fontFamily:poppins("600")}]}>+ Upload</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tagsScroll}>
              <View style={s.tagsRow}>
                {TAGS.map(t => (
                  <TouchableOpacity key={t} style={[s.tagBtn, tag===t && s.tagA]} onPress={() => setTag(t)}>
                    <Text style={[s.tagT,{fontFamily:poppins("600")}, tag===t && s.tagTA]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {isFullLayout ? (
              <View style={s.slideshowBanner}>
                <Text style={s.slideshowIcon}>🎞</Text>
                <Text style={[s.slideshowInfo,{fontFamily:poppins("500")}]}>
                  <Text style={{fontFamily:poppins("600"),color:B}}>Slideshow mode</Text>
                  {"  "}— select up to <Text style={{fontFamily:poppins("600"),color:B}}>{SLIDESHOW_MAX}</Text> images · {sel.length} chosen
                </Text>
              </View>
            ) : (
              <Text style={[s.selInfo,{fontFamily:poppins("400")}]}>
                Select up to <Text style={{fontFamily:poppins("600"),color:B}}>{layout.slots}</Text> image{layout.slots>1?"s":""}  · {sel.length} chosen
              </Text>
            )}

            <View style={s.imgGrid}>
              {filtered.map(img => {
                const active = sel.includes(img.id);
                const idx    = sel.indexOf(img.id);
                return (
                  <TouchableOpacity
                    key={img.id}
                    style={[s.imgCell, active && s.imgCellA]}
                    onPress={() => toggle(img.id)}
                  >
                    <Image source={{ uri:img.uri }} style={s.imgThumb} resizeMode="cover"/>
                    {active && (
                      <View style={s.imgBadge}>
                        <Text style={s.imgBadgeT}>{idx+1}</Text>
                      </View>
                    )}
                    {active && <View style={s.imgCheckOverlay}/>}
                    <View style={s.imgFooter}>
                      <Text style={[s.imgFooterT,{fontFamily:poppins("500")}]} numberOfLines={1}>{img.label}</Text>
                      <View style={[s.imgTagPill,{backgroundColor:active?B+"22":"#F1F5F9"}]}>
                        <Text style={[s.imgTagT,{fontFamily:poppins("600"),color:active?B:G}]}>{img.tag}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* RIGHT */}
          <View style={{ flex:1, gap:16 }}>

            <View style={s.card}>
              <Text style={[s.cardTitle,{fontFamily:poppins("700")}]}>Content Info</Text>
              <Text style={[s.fieldLbl, {fontFamily:poppins("600")}]}>Display Title</Text>
              <TextInput
                style={[s.input, foc==="t"&&s.inputF, {fontFamily:poppins("400")}]}
                value={title} onChangeText={setTitle}
                placeholder="e.g. Morning Motivation Ritual"
                placeholderTextColor={G}
                onFocus={()=>setFoc("t")} onBlur={()=>setFoc(null)}
              />
              <Text style={[s.fieldLbl,{fontFamily:poppins("600"),marginTop:12}]}>Message / Location</Text>
              <TextInput
                style={[s.input, foc==="m"&&s.inputF, {fontFamily:poppins("400")}]}
                value={msg} onChangeText={setMsg}
                placeholder="e.g. Main Lobby · Screen 01"
                placeholderTextColor={G}
                onFocus={()=>setFoc("m")} onBlur={()=>setFoc(null)}
              />
            </View>

            <View style={s.card}>
              <Text style={[s.cardTitle,{fontFamily:poppins("700")}]}>Aspect Ratio</Text>
              <View style={s.pillRow}>
                {RATIOS.map(r => (
                  <TouchableOpacity key={r.l} style={[s.pill, ratio.l===r.l&&s.pillA]} onPress={()=>setRatio(r)}>
                    <Text style={[s.pillT,{fontFamily:poppins("600")},ratio.l===r.l&&s.pillTA]}>{r.l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={s.card}>
              <Text style={[s.cardTitle,{fontFamily:poppins("700")}]}>Screen Layout</Text>
              <View style={s.layoutGrid}>
                {LAYOUTS.map(l => {
                  const active = layout.label===l.label;
                  return (
                    <TouchableOpacity
                      key={l.label}
                      style={[s.layoutCell, active&&s.layoutCellA]}
                      onPress={() => { setLayout(l); setSel([]); setPreviewSlide(0); }}
                    >
                      <LayoutIcon cols={l.cols} rows={l.rows} active={active}/>
                      <Text style={[s.layoutT,{fontFamily:poppins("600")},active&&s.layoutTA]}>{l.label}</Text>
                      <Text style={[s.layoutSub,{fontFamily:poppins("400")},active&&{color:"#ffffff99"}]}>
                        {l.label==="Full"?"slideshow":`${l.slots} slots`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={s.card}>
              <View style={s.cardHead}>
                <Text style={[s.cardTitle,{fontFamily:poppins("700")}]}>Live Preview</Text>
                <View style={s.resBadge}>
                  <Text style={[s.resBadgeT,{fontFamily:poppins("600")}]}>4K Ready</Text>
                </View>
              </View>
              <Preview
                ratio={ratio}
                layout={layout}
                selImgs={selImgs}
                isFullLayout={isFullLayout}
                previewSlide={previewSlide}
                title={title}
                msg={msg}
              />
            </View>

            <Animated.View style={{ transform:[{scale:pulse}] }}>
              <TouchableOpacity
                style={[s.sendBtn, (!sel.length||loadingSend)&&s.sendOff]}
                onPress={doSend}
                activeOpacity={0.86}
                disabled={!sel.length||loadingSend}
              >
                {loadingSend ? (
                  <>
                    <ActivityIndicator size="small" color="#fff"/>
                    <Text style={[s.sendT,{fontFamily:poppins("700")}]}>Sending to TV...</Text>
                  </>
                ) : sent ? (
                  <>
                    <Text style={s.sendIcon}>✓</Text>
                    <Text style={[s.sendT,{fontFamily:poppins("700")}]}>Sent to TV!</Text>
                  </>
                ) : (
                  <>
                    <Text style={s.sendIcon}>📺</Text>
                    <Text style={[s.sendT,{fontFamily:poppins("700")}]}>
                      {isFullLayout && sel.length > 1
                        ? `Send Slideshow to TV  (${sel.length} images)`
                        : `Send to TV  (${sel.length}/${layout.slots})`
                      }
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {sent && !loadingSend && (
              <View style={s.sentRow}>
                <View style={s.sentDot}/>
                <Text style={[s.sentT,{fontFamily:poppins("500")}]}>
                  TV display updated · {new Date().toLocaleTimeString()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:{ flex:1, backgroundColor:S },
  wrap:{ maxWidth:1300, alignSelf:"center", width:"100%", padding:28, paddingBottom:48 },
  wrapM:{ padding:16 },
  nav:{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:32,
    backgroundColor:"#fff", borderRadius:18, paddingHorizontal:20, paddingVertical:14,
    shadowColor:B, shadowOpacity:0.07, shadowRadius:20, elevation:4 },
  navL:{ flexDirection:"row", alignItems:"center", gap:12 },
  navLogo:{ width:48, height:48, borderRadius:12, backgroundColor:BL, alignItems:"center", justifyContent:"center" },
  navLogoImg:{ width:32, height:32 },
  navBrand:{ fontSize:19, color:"#1E293B" },
  navTag:{ fontSize:8, color:B, letterSpacing:2.5, marginTop:1 },
  navR:{ flexDirection:"row", alignItems:"center", gap:10 },
  adminPill:{ flexDirection:"row", alignItems:"center", gap:6, backgroundColor:BL, paddingHorizontal:12, paddingVertical:6, borderRadius:20 },
  adminDot:{ width:6, height:6, borderRadius:3, backgroundColor:"#22C55E" },
  adminT:{ fontSize:12, color:B },
  logoutBtn:{ paddingHorizontal:14, paddingVertical:7, borderRadius:10, borderWidth:1.5, borderColor:"#FECACA", backgroundColor:"#FFF5F5" },
  logoutT:{ fontSize:12, color:"#EF4444" },
  pageTitleRow:{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:12 },
  pageTitle:{ fontSize:30, color:"#1E293B" },
  pageSub:{ fontSize:13, color:G, marginTop:3 },
  statRow:{ flexDirection:"row", gap:16 },
  stat:{ alignItems:"center", backgroundColor:"#fff", borderRadius:14, paddingHorizontal:16, paddingVertical:10,
    shadowColor:B, shadowOpacity:0.06, shadowRadius:10, elevation:2 },
  statN:{ fontSize:22, color:B },
  statL:{ fontSize:10, color:G, marginTop:1 },
  main:{ flexDirection:"row", gap:20, alignItems:"flex-start" },
  mainCol:{ flexDirection:"column" },
  card:{ backgroundColor:"#fff", borderRadius:20, padding:22,
    shadowColor:B, shadowOpacity:0.07, shadowRadius:20, elevation:4, marginBottom:0 },
  cardHead:{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:16 },
  cardTitle:{ fontSize:17, color:"#1E293B" },
  uploadBtn:{ backgroundColor:BL, paddingHorizontal:14, paddingVertical:8, borderRadius:10 },
  uploadT:{ fontSize:12, color:B },
  tagsScroll:{ marginBottom:14 },
  tagsRow:{ flexDirection:"row", gap:8, flexWrap:"wrap" },
  tagBtn:{ paddingHorizontal:14, paddingVertical:7, borderRadius:20, backgroundColor:S },
  tagA:{ backgroundColor:B },
  tagT:{ fontSize:11, color:G },
  tagTA:{ color:"#fff" },
  selInfo:{ fontSize:12, color:G, marginBottom:14 },
  slideshowBanner:{ flexDirection:"row", alignItems:"center", gap:8, backgroundColor:BL,
    borderRadius:10, paddingHorizontal:12, paddingVertical:9, marginBottom:14 },
  slideshowIcon:{ fontSize:16 },
  slideshowInfo:{ fontSize:12, color:"#475569", flex:1 },
  imgGrid:{ flexDirection:"row", flexWrap:"wrap", gap:10 },
  imgCell:{ width:"30.5%", borderRadius:14, overflow:"hidden", borderWidth:2.5, borderColor:"transparent",
    shadowColor:"#000", shadowOpacity:0.04, shadowRadius:4, elevation:1 },
  imgCellA:{ borderColor:B },
  imgThumb:{ width:"100%", aspectRatio:1 },
  imgBadge:{ position:"absolute", top:7, right:7, width:24, height:24, borderRadius:12, backgroundColor:B,
    alignItems:"center", justifyContent:"center", borderWidth:2, borderColor:"#fff" },
  imgBadgeT:{ color:"#fff", fontSize:11, fontWeight:"800" },
  imgCheckOverlay:{ ...StyleSheet.absoluteFillObject, backgroundColor:B+"18" },
  imgFooter:{ backgroundColor:"#fff", paddingHorizontal:8, paddingVertical:6, flexDirection:"row", justifyContent:"space-between", alignItems:"center" },
  imgFooterT:{ fontSize:10, color:"#334155", flex:1 },
  imgTagPill:{ paddingHorizontal:6, paddingVertical:2, borderRadius:6 },
  imgTagT:{ fontSize:9 },
  fieldLbl:{ fontSize:11, color:"#475569", marginBottom:7, letterSpacing:0.3 },
  input:{ height:46, borderWidth:1.5, borderColor:"#E2E8F0", borderRadius:12,
    paddingHorizontal:14, fontSize:13, color:"#1E293B", backgroundColor:"#FAFBFC" },
  inputF:{ borderColor:B, backgroundColor:"#fff" },
  pillRow:{ flexDirection:"row", gap:8, flexWrap:"wrap" },
  pill:{ paddingHorizontal:20, paddingVertical:9, borderRadius:12, backgroundColor:S },
  pillA:{ backgroundColor:B },
  pillT:{ fontSize:13, color:G },
  pillTA:{ color:"#fff" },
  layoutGrid:{ flexDirection:"row", flexWrap:"wrap", gap:10 },
  layoutCell:{ width:"30%", borderRadius:14, backgroundColor:S, alignItems:"center", paddingVertical:14, paddingHorizontal:8, borderWidth:2, borderColor:"transparent" },
  layoutCellA:{ backgroundColor:B, borderColor:B },
  layoutT:{ fontSize:12, color:"#475569" },
  layoutTA:{ color:"#fff" },
  layoutSub:{ fontSize:9, color:G, marginTop:2 },
  resBadge:{ backgroundColor:"#F0FDF4", paddingHorizontal:10, paddingVertical:4, borderRadius:8 },
  resBadgeT:{ fontSize:10, color:"#16A34A" },
  sendBtn:{ height:58, backgroundColor:B, borderRadius:16, flexDirection:"row",
    alignItems:"center", justifyContent:"center", gap:10,
    shadowColor:B, shadowOpacity:0.35, shadowRadius:14, elevation:8 },
  sendOff:{ backgroundColor:"#CBD5E1", shadowOpacity:0 },
  sendIcon:{ fontSize:20 },
  sendT:{ color:"#fff", fontSize:16, letterSpacing:0.3 },
  sentRow:{ flexDirection:"row", alignItems:"center", gap:8, justifyContent:"center" },
  sentDot:{ width:8, height:8, borderRadius:4, backgroundColor:"#22C55E" },
  sentT:{ fontSize:12, color:"#22C55E" },
});

const pv = StyleSheet.create({
  wrap:{ width:"100%", backgroundColor:"#0A1628", borderRadius:14, overflow:"hidden" },
  bar:{ flexDirection:"row", alignItems:"center", gap:6, backgroundColor:"#0D1F3C",
    paddingHorizontal:14, paddingVertical:10, flexWrap:"wrap" },
  dot:{ width:9, height:9, borderRadius:5 },
  barT:{ fontSize:11, color:"#64748B", marginLeft:6, flex:1 },
  liveBadge:{ flexDirection:"row", alignItems:"center", gap:4, backgroundColor:"#EF444422",
    paddingHorizontal:8, paddingVertical:3, borderRadius:6 },
  liveDot:{ width:6, height:6, borderRadius:3, backgroundColor:"#EF4444" },
  liveT:{ fontSize:9, color:"#EF4444", letterSpacing:1 },
  empty:{ flex:1, alignItems:"center", justifyContent:"center", borderWidth:0.5, borderColor:"#ffffff11" },
  emptyT:{ color:"#ffffff22", fontSize:11 },
  slideDots:{ position:"absolute", bottom:8, left:0, right:0,
    flexDirection:"row", justifyContent:"center", gap:5 },
  slideDot:{ width:5, height:5, borderRadius:3, backgroundColor:"#ffffff44" },
  slideDotA:{ width:14, backgroundColor:"#fff" },
  titleOverlay:{ position:"absolute", bottom:0, left:0, right:0,
    backgroundColor:"#000000CC", paddingHorizontal:16, paddingVertical:10 },
  titleOverlayT:{ color:"#fff", fontSize:13 },
  msgOverlayT:{ color:"#ffffffaa", fontSize:10, marginTop:2 },
});