// TVDisplayScreen.tsx
// TV-side page: polls API and renders canvas fullscreen.
// Birthday section: seamless bg, elegant left label + right queue slider, image-only cards.

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View, Image, Text, StyleSheet, useWindowDimensions,
  ActivityIndicator, StatusBar, Platform, Animated, Easing,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceCanvas, DeviceCanvasData } from '@/services/content';
import { logoutApi } from '@/services/auth';
import { deleteTokens, getRefreshToken } from '@/utils/tokenStorage';
import { notifyAuthChange } from '@/utils/authEvents';
import { router } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { getLocation, fetchWeather } from '@/utils/weather';
import { getBirthdays, BirthdayItem } from '@/services/birthdaylist';

// ─── CONFIG ───────────────────────────────────────────────────────────────────


const POLL_INTERVAL       = 8_000;
const SLOT_CYCLE_INTERVAL = 5_000;
const BIRTHDAY_REFRESH_MS = 24 * 60 * 60 * 1000;

const HEADER_H            = 47;

/* responsive values based on mobile width */
const screenWidth = Dimensions.get('window').width;
const isMobile = screenWidth < 768;

const BIRTHDAY_STRIP_H = isMobile ? 70 : 170;
const BIRTHDAY_CARD_W  = isMobile ? 135 : 230;
const BIRTHDAY_CARD_H  = isMobile ? 95 : 145;

const CARD_GAP            = isMobile ? 9 : 12;
const QUEUE_STEP_INTERVAL = 3_500;
const QUEUE_ANIM_DURATION = 500;

const BIRTHDAY_CACHE_KEY     = 'cached_birthdays_v2';
const BIRTHDAY_TIMESTAMP_KEY = 'cached_birthdays_ts_v2';





// ─── TYPES ────────────────────────────────────────────────────────────────────
interface WeatherData { temp: number; icon: string; condition: string; }

// ─── SCALE HELPER ────────────────────────────────────────────────────────────
function scaleToScreen(
  x: number,
  y: number,
  w: number,
  h: number,
  baseW: number,
  baseH: number,
  screenW: number,
  screenH: number,
  bottomReserved: number,
) {
  const canvasTop = HEADER_H;
  const canvasBottom = bottomReserved;
  const usableHeight = screenH - canvasTop - canvasBottom;

  const scaleX = screenW / baseW;
  const scaleY = usableHeight / baseH;

  return {
    left: x * scaleX,
    top: y * scaleY,
    width: w * scaleX,
    height: h * scaleY,
  };
}

// ─── DATE TIME ────────────────────────────────────────────────────────────────
const DateTimeDisplay: React.FC = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={styles.dateTimeContainer}>
      <Text style={styles.dateText}>
        {now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </Text>
      <Text style={styles.timeText}>
        {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
};

// ─── HEADER ──────────────────────────────────────────────────────────────────
const Header: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const lastTap  = useRef(0);

  // ── FIX 3: Clear all birthday caches on logout ────────────────────────────
  const clearBirthdayCache = async () => {
    try {
      await AsyncStorage.removeItem(BIRTHDAY_CACHE_KEY);
      await AsyncStorage.removeItem(BIRTHDAY_TIMESTAMP_KEY);
      await AsyncStorage.removeItem('lastWeather');
      // Clear any other session-bound keys
      const allKeys = await AsyncStorage.getAllKeys();
      const birthdayRelated = allKeys.filter(k =>
        k.startsWith('cached_birthdays') || k.startsWith('birthday_')
      );
      if (birthdayRelated.length) {
        await AsyncStorage.multiRemove(birthdayRelated);
      }
    } catch {}
  };

  const logout = async () => {
    const now = Date.now();
    if (now - lastTap.current < 400) {
      try {
        const rt = await getRefreshToken();
        if (rt) { try { await logoutApi(rt); } catch {} }
      } finally {
        await clearBirthdayCache(); // ← clear cache before routing away
        await deleteTokens();
        notifyAuthChange();
        router.replace('/login');
      }
    }
    lastTap.current = now;
  };

  const loadWeather = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem('lastWeather');
      if (cached) setWeather(JSON.parse(cached));
      const loc = await getLocation();
      if (!loc) return;
      const w = await fetchWeather(loc);
      if (!w) return;
      setWeather(w);
      await AsyncStorage.setItem('lastWeather', JSON.stringify(w));
    } catch {}
  }, []);

  useEffect(() => {
    loadWeather();
    const t = setInterval(loadWeather, 10 * 60 * 1000);
    return () => clearInterval(t);
  }, [loadWeather]);

  return (
    <View style={[styles.header, { paddingHorizontal: isMobile ? 10 : 20 }]}>
      <TouchableOpacity onPress={logout} style={styles.brand}>
        <View style={[styles.logoBox, { width: isMobile ? 28 : 36, height: isMobile ? 28 : 36 }]}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={{ width: isMobile ? 18 : 24, height: isMobile ? 18 : 24 }}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.appName, { fontSize: isMobile ? 14 : 18 }]}>SCREEN NOVA</Text>
      </TouchableOpacity>
      <View style={styles.headerRight}>
        {weather && (
          <View style={styles.weatherContainer}>
            {!!weather.icon && (
              <Image source={{ uri: weather.icon }} style={{ width: isMobile ? 20 : 24, height: isMobile ? 20 : 24 }} />
            )}
            <Text style={[styles.weatherTemp, { fontSize: isMobile ? 12 : 14 }]}>
              {weather.temp}°C
            </Text>
          </View>
        )}
        <DateTimeDisplay />
      </View>
    </View>
  );
};

// ─── FLOATING ANIMATION ───────────────────────────────────────────────────────
const useFloatingAnimation = () => {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2500, // faster → more noticeable
          easing: Easing.inOut(Easing.ease), // smooth natural motion
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, []);

  return floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3], // 🔥 sweet spot (NOT too big, NOT invisible)
  });
};




const FloatFadeImage: React.FC<{
  uri: string;
  style: object;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
}> = ({ uri, style, resizeMode = 'contain' }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(1.02)).current;
  const floatY  = useFloatingAnimation();

  useEffect(() => {
    opacity.setValue(0);
    scale.setValue(1.02);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(scale,   { toValue: 1, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, [uri]);

  return (
    <Animated.View style={[style, { justifyContent: 'center', alignItems: 'center', transform: [{ translateY: floatY }] }]}>
      <Animated.Image
        source={{ uri }}
        resizeMode={resizeMode}
        style={[{ width: '100%', height: '100%', opacity, transform: [{ scale }] }]}
      />
    </Animated.View>
  );
};

// ─── CYCLING CANVAS SLOT ──────────────────────────────────────────────────────
const CyclingSlot: React.FC<{
  slotIndex: number;
  images: any[];
  frame: { left: number; top: number; width: number; height: number; };
  cycleInterval?: number;
}> = ({ images, frame, cycleInterval = 5000 }) => {
  const [currentIndex, setCurrentIndex]       = useState(0);
  const [isLoaded, setIsLoaded]               = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCurrentIndex(0);
    setIsLoaded(false);
    setIsTransitioning(false);
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;
    const nextImage = images[(currentIndex + 1) % images.length]?.imageUrl;
    if (nextImage) Image.prefetch(nextImage).catch(() => null);
  }, [currentIndex, images]);

  const handleLoad = useCallback(() => {
    if (!isTransitioning) setIsLoaded(true);
  }, [isTransitioning]);

  useEffect(() => {
    if (!isLoaded || images.length <= 1) return;
    cycleRef.current = setTimeout(() => {
      setIsTransitioning(true);
      setIsLoaded(false);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % images.length);
        setIsTransitioning(false);
      }, 200);
    }, cycleInterval);
    return () => { if (cycleRef.current) clearTimeout(cycleRef.current); };
  }, [isLoaded, currentIndex, images.length, cycleInterval]);

  if (!images.length) return null;

  const activeImage = images[currentIndex];
  const resizeMode  = activeImage?.resizeMode || 'contain';

  return (
    <View style={[styles.slot, { left: frame.left, top: frame.top, width: frame.width, height: frame.height, zIndex: activeImage?.zIndex || 1 }]}>
      <Image source={{ uri: activeImage.imageUrl }} style={styles.hiddenLoader} onLoad={handleLoad} onError={() => setIsLoaded(true)} />
      {isLoaded && <FloatFadeImage uri={activeImage.imageUrl} style={StyleSheet.absoluteFill} resizeMode={resizeMode} />}
      {!isLoaded && (
        <View style={styles.imageLoadingContainer}>
          <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" />
        </View>
      )}
      {images.length > 1 && (
        <View style={styles.dots} pointerEvents="none">
          {images.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
};

// ─── BALLOON ─────────────────────────────────────────────────────────────────
const BalloonFloat: React.FC<{ delay?: number; emoji?: string }> = ({ delay = 0, emoji = '🎈' }) => {
  const y    = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fa = Animated.loop(Animated.sequence([
      Animated.timing(y,    { toValue: -7, duration: 2000, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(y,    { toValue: 0,  duration: 2000,        easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const sa = Animated.loop(Animated.sequence([
      Animated.timing(sway, { toValue: 3,  duration: 1700, delay, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(sway, { toValue: -3, duration: 1700,        easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    fa.start(); sa.start();
    return () => { fa.stop(); sa.stop(); };
  }, []);

  return (
    <Animated.Text style={[styles.balloon, { transform: [{ translateY: y }, { translateX: sway }] }]}>
      {emoji}
    </Animated.Text>
  );
};

// ─── FIX 1: BIRTHDAY LEFT PANEL — Elegant, premium redesign ──────────────────
const BirthdayLabel: React.FC<{ isMobile?: boolean }> = ({ isMobile = false }) => {
  const opacity   = useRef(new Animated.Value(0)).current;
  const slideY    = useRef(new Animated.Value(12)).current;
  const shimmer   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(slideY,  { toValue: 0, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();

    // Subtle shimmer pulse on the gold text
    const shimmerLoop = Animated.loop(Animated.sequence([
      Animated.timing(shimmer, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(shimmer, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    shimmerLoop.start();
    return () => shimmerLoop.stop();
  }, []);

  const glowOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });

  return (
    <View style={[styles.birthdayLabel, isMobile && styles.birthdayLabelMobile]}>

      {/* Balloons row — unchanged count */}
      <View style={styles.balloonsRow}>
        <BalloonFloat delay={0}   emoji="🎈" />
        <BalloonFloat delay={200} emoji="🎈" />
        <BalloonFloat delay={400} emoji="🎈" />
     
      </View>

      {/* ── Premium text block ── */}
      <Animated.View style={[styles.bdayTextBlock, { opacity, transform: [{ translateY: slideY }] }]}>

        {/* "HAPPY" — spaced tracking, soft white */}
        <Text style={[styles.bdayLine1, isMobile && styles.bdayLine1Mobile]}>
          H A P P Y
        </Text>

        {/* Thin gold rule above "Birthday!" */}
        <View style={styles.bdayGoldRule} />

        {/* "Birthday!" — large, bold, gold with glow */}
        <Animated.Text style={[styles.bdayLine2, isMobile && styles.bdayLine2Mobile, { opacity: glowOpacity }]}>
          Birthday!
        </Animated.Text>

   
      </Animated.View>

    </View>
  );
};

// ─── BIRTHDAY QUEUE SLIDER ────────────────────────────────────────────────────
const BirthdayQueueSlider: React.FC<{ birthdays: BirthdayItem[]; isMobile?: boolean }> = ({ birthdays, isMobile = false }) => {
  const cardW =  BIRTHDAY_CARD_W;
  const cardH =  BIRTHDAY_CARD_H;
  const count = birthdays.length;
  const [allItems]      = useState(() => [...birthdays]);
  const extendedItems   = [...allItems, ...allItems];
  const [currentOffset, setCurrentOffset] = useState(0);
  const scrollAnim      = useRef(new Animated.Value(0)).current;
  const containerWidth  = useRef(0);
  const intervalRef     = useRef<NodeJS.Timeout | null | any>(null);
  const isAnimatingRef  = useRef(false);

  const cardTotalWidth = cardW + CARD_GAP;
  const visibleCount   = Math.max(3, Math.floor(containerWidth.current / cardTotalWidth) || 3);

  if (count <= visibleCount + 1) {
    return (
      <View style={styles.queueViewport}>
        <View style={[styles.queueTrackStatic, { gap: CARD_GAP }]}>
          {birthdays.map((item, i) =>
            item.imageUrl ? (
              <View key={`${item.id}_${i}`} style={[styles.bdayCard, { width: cardW, height: cardH }]}>
                <Image source={{ uri: item.imageUrl }} style={styles.bdayCardImage} resizeMode="contain" />
              </View>
            ) : null
          )}
        </View>
      </View>
    );
  }

  useEffect(() => {
    if (count <= 1) return;
    const startAnimation = () => {
      if (isAnimatingRef.current) return;
      isAnimatingRef.current = true;
      Animated.timing(scrollAnim, {
        toValue: currentOffset - cardTotalWidth,
        duration: QUEUE_ANIM_DURATION,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          let newOffset = currentOffset - cardTotalWidth;
          if (Math.abs(newOffset) >= count * cardTotalWidth) {
            newOffset = 0;
            setCurrentOffset(0);
            scrollAnim.setValue(0);
          } else {
            setCurrentOffset(newOffset);
          }
        }
        isAnimatingRef.current = false;
      });
    };
    intervalRef.current = setInterval(startAnimation, QUEUE_STEP_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [count, cardTotalWidth, currentOffset, scrollAnim]);

  return (
    <View
      style={[styles.queueViewport, { height: cardH }]}
      onLayout={e => { containerWidth.current = e.nativeEvent.layout.width; }}
    >
      <Animated.View style={[styles.queueTrackAnimated, { transform: [{ translateX: scrollAnim }] }]}>
        <View style={[styles.queueTrackStatic, { gap: CARD_GAP }]}>
          {extendedItems.map((item, i) =>
            item.imageUrl ? (
              <View key={`${item.id}_ext_${i}`} style={[styles.bdayCard, { width: cardW, height: cardH }]}>
                <Image source={{ uri: item.imageUrl }} style={styles.bdayCardImage} resizeMode="contain" />
              </View>
            ) : null
          )}
        </View>
      </Animated.View>
    </View>
  );
};

// ─── BIRTHDAY SECTION ─────────────────────────────────────────────────────────
const BirthdaySection: React.FC<{ birthdays: BirthdayItem[]; stripHeight: number; isMobile?: boolean }> = ({ birthdays, stripHeight, isMobile = false }) => {
  const valid = birthdays.filter(b => !!b.imageUrl);
  if (!valid.length) return null;
  return (
    <View style={[styles.birthdaySection, { height: stripHeight }]}>
      <View style={styles.sectionDivider} />
      <View style={[styles.birthdayInner, isMobile && styles.birthdayInnerMobile]}>
        <BirthdayLabel isMobile={isMobile} />
        <View style={[styles.verticalRule, isMobile && styles.verticalRuleMobile]} />
        <BirthdayQueueSlider birthdays={valid} isMobile={isMobile} />
      </View>
    </View>
  );
};

// ─── BIRTHDAY AUTO-FETCH HOOK ─────────────────────────────────────────────────
function useBirthdayAutoFetch(): BirthdayItem[] {
  const [birthdays, setBirthdays] = useState<BirthdayItem[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAndCache = useCallback(async () => {
    try {
      const data = await getBirthdays();
      const list = Array.isArray(data) ? data : [];
      setBirthdays(list);
      await AsyncStorage.setItem(BIRTHDAY_CACHE_KEY, JSON.stringify(list));
      await AsyncStorage.setItem(BIRTHDAY_TIMESTAMP_KEY, Date.now().toString());
    } catch {}
  }, []);

  const init = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem(BIRTHDAY_CACHE_KEY);
      const tsRaw  = await AsyncStorage.getItem(BIRTHDAY_TIMESTAMP_KEY);
      const ts     = tsRaw ? parseInt(tsRaw, 10) : 0;

      if (cached) setBirthdays(JSON.parse(cached));

      const isStale = Date.now() - ts > BIRTHDAY_REFRESH_MS;
      if (isStale || !cached) await fetchAndCache();
    } catch {
      await fetchAndCache();
    }
  }, [fetchAndCache]);

  useEffect(() => {
    init();
    timerRef.current = setInterval(fetchAndCache, BIRTHDAY_REFRESH_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [init, fetchAndCache]);

  return birthdays;
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function TVDisplayScreen() {
  const { width, height } = useWindowDimensions();
  const [canvas, setCanvas] = useState<DeviceCanvasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── FIX 2: Detect portrait mobile ────────────────────────────────────────
  const isMobile   = width < 768;
  const isPortrait = height > width;
  const isMobilePortrait = isMobile && isPortrait;

  const birthdayStripH =  BIRTHDAY_STRIP_H;

  const birthdays = useBirthdayAutoFetch();

  const hasBirthdays =
    canvas?.isBirthday === true &&
    birthdays.filter(b => !!b.imageUrl).length > 0;

  const birthdayReservedH = hasBirthdays ? birthdayStripH : 0;

  useEffect(() => {
    const lock = async () => {
      try {
        await ScreenOrientation.unlockAsync();
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        setTimeout(fetchCanvas, 500);
      } catch {}
    };
    if (Platform.OS !== 'web') lock();
  }, []);

  const fetchCanvas = useCallback(async () => {
    try {
      const res = await getDeviceCanvas();
      setCanvas(res?.data ?? null);
      setError('');
    } catch {
      setError('Unable to load content');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCanvas();
    timerRef.current = setInterval(fetchCanvas, POLL_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchCanvas]);

  const slots = useMemo(() => {
    if (!canvas?.items?.length) return [];
    const groups = new Map<number, any[]>();
    canvas.items.forEach(item => {
      const si = item.slotIndex ?? 0;
      if (!groups.has(si)) groups.set(si, []);
      groups.get(si)!.push(item);
    });
    return Array.from(groups.entries()).map(([slotIndex, items]) => ({
      slotIndex,
      items,
      frame: scaleToScreen(
        items[0].x, items[0].y, items[0].width, items[0].height,
        canvas.screenWidth, canvas.screenHeight,
        width, height, birthdayReservedH,
      ),
    }));
  }, [canvas, width, height, birthdayReservedH]);

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <Header onPress={fetchCanvas} />

      {/* Canvas area */}
      <View style={[styles.contentArea, { bottom: birthdayReservedH }]}>
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Loading canvas…</Text>
          </View>
        )}
        {!loading && !!error && (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorSub}>Retrying…</Text>
          </View>
        )}
        {!loading && !error && canvas?.items?.length
          ? slots.map(slot => (
              <CyclingSlot
                key={slot.slotIndex}
                slotIndex={slot.slotIndex}
                images={slot.items}
                frame={slot.frame}
                cycleInterval={SLOT_CYCLE_INTERVAL}
              />
            ))
          : null}
        {!loading && !error && !canvas?.items?.length && (
          <View style={styles.center}>
            <Text style={styles.idleText}>No content scheduled</Text>
            <Text style={styles.idleSub}>Waiting for admin to send a canvas…</Text>
          </View>
        )}
      </View>

      {/* Birthday section */}
      {hasBirthdays && (
        <BirthdaySection
          birthdays={birthdays}
          stripHeight={birthdayReservedH}
          isMobile={isMobilePortrait}
        />
      )}
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#253666',
    position: 'relative',
    overflow: 'hidden',
  },

  // ── Header ───────────────────────────────────────────────────────────────────
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_H,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#2A3462',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
    zIndex: 100,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18, shadowRadius: 4, elevation: 4,
  },
  brand:             { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox:           { borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
  appName:           { color: '#FFF', fontWeight: '700', letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },
  headerRight:       { flexDirection: 'row', alignItems: 'center', gap: 16 },
  weatherContainer:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weatherTemp:       { color: '#FFF', fontWeight: '600' },
  dateTimeContainer: { alignItems: 'flex-end' },
  dateText:          { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '500' },
  timeText:          { color: '#FFF', fontSize: 14, fontWeight: '600' },

  // ── Canvas area ──────────────────────────────────────────────────────────────
  contentArea: {
    position: 'absolute',
    top: HEADER_H,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#2A3462',
    overflow: 'hidden',
  },

  slot: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderRadius: 14,
    overflow: 'visible',
    justifyContent: 'center',
    alignItems: 'center',
  },

  hiddenLoader:          { width: 0, height: 0, position: 'absolute', opacity: 0 },
  imageLoadingContainer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  dots:                  { position: 'absolute', bottom: 8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot:                   { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive:             { backgroundColor: '#FFF', width: 18 },
  center:                { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:           { color: 'rgba(255,255,255,0.45)', fontSize: 14 },
  errorText:             { color: '#EF4444', fontSize: 18, fontWeight: '700' },
  errorSub:              { color: 'rgba(255,255,255,0.35)', fontSize: 13 },
  idleText:              { color: 'rgba(255,255,255,0.55)', fontSize: 22, fontWeight: '700' },
  idleSub:               { color: 'rgba(255,255,255,0.28)', fontSize: 14 },

  // ── Birthday section ─────────────────────────────────────────────────────────
  birthdaySection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2A3462',
    zIndex: 999,
    elevation: 999,
  },

  sectionDivider: {
    marginHorizontal: 28,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },





balloon: {
  fontSize: isMobile ? 14 : 26,
},

bdayGoldRule: {
  width: isMobile ? 34 : 80,
  height: 1,
  backgroundColor: 'rgba(255,215,0,0.45)',
  marginBottom: isMobile ? 1 : 4,
  marginTop: isMobile ? 1 : 0,
  borderRadius: 1,
},

birthdayLabel: {
  width: isMobile ? 72 : 160,
  minWidth: isMobile ? 60 : 130,
  alignItems: 'center',
  justifyContent: 'center',
  gap: isMobile ? 0 : 4,
  paddingHorizontal: isMobile ? 0 : 6,
},

verticalRule: {
  width: 1,
  height: isMobile ? '42%' : '65%',
  backgroundColor: 'rgba(255,255,255,0.10)',
  marginHorizontal: isMobile ? 4 : 18,
},

birthdayInner: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: isMobile ? 10 : 20,
  paddingVertical: isMobile ? 6 : 10,
},

  birthdayLabelMobile: {
  width: 72,
  minWidth: 60,
  gap: 0,
  paddingHorizontal: 0,
  justifyContent: 'center',
  alignItems: 'center',
},

balloonsRow: {
  flexDirection: 'row',
  gap: 2,
  marginBottom: 0,
  alignItems: 'center',
  justifyContent: 'center',
},


bdayTextBlock: {
  alignItems: 'center',
  justifyContent: 'center',
  gap: 0,
},

bdayLine1Mobile: {
  fontSize: 6,
  letterSpacing: 1,
  marginBottom: 0,
  lineHeight: 8,
},


bdayLine2Mobile: {
  fontSize: 11,
  lineHeight: 13,
  marginBottom: 0,
},

verticalRuleMobile: {
  marginHorizontal: 4,
  height: '42%',
},

  // ── FIX 2: tighter padding on portrait mobile ─────────────────────────────
  birthdayInnerMobile: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  // ── FIX 1: Left label — premium redesign ─────────────────────────────────────


  // "H A P P Y" — refined, spaced
 bdayLine1: {
  color: 'rgba(255,255,255,0.75)',
  fontSize: isMobile ? 8 : 19,
  fontWeight: '800',
  letterSpacing: isMobile ? 1 : 4,
  textAlign: 'center',
  fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  marginBottom: isMobile ? 0 : 2,
  lineHeight: isMobile ? 8 : 24,
},

bdayLine2: {
  color: '#FFD700',
  fontSize: isMobile ? 11 : 26,
  fontWeight: '800',
  letterSpacing: isMobile ? 0.1 : 0.3,
  textAlign: 'center',
  fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  textShadowColor: 'rgba(255,215,0,0.55)',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: isMobile ? 6 : 14,
  marginBottom: isMobile ? 0 : 2,
  lineHeight: isMobile ? 13 : 32,
},




  // ── Queue slider ─────────────────────────────────────────────────────────────
  queueViewport: {
    flex: 1,
    overflow: 'hidden',
    height: BIRTHDAY_CARD_H,
    justifyContent: 'center',
  },
  queueTrackStatic: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  queueTrackAnimated: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Birthday card — pure image, transparent bg
  bdayCard: {
    width: BIRTHDAY_CARD_W,
    height: BIRTHDAY_CARD_H,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  bdayCardImage: {
    width: '100%',
    height: '100%',
  },







  
});