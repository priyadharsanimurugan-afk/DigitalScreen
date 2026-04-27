// TVDisplayScreen.tsx
// TV-side page: polls the API and renders canvas layout fullscreen.
// Fixed: portrait-only orientation lock

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Image, Text, StyleSheet, useWindowDimensions,
  ActivityIndicator, StatusBar, Platform, Animated, Easing,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDeviceCanvas, DeviceCanvasData } from '@/services/content';
import { logoutApi } from '@/services/auth';
import { deleteTokens, getRefreshToken } from '@/utils/tokenStorage';
import { notifyAuthChange } from '@/utils/authEvents';
import { router } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { getLocation, fetchWeather } from '@/utils/weather';


// ─── CONFIG ───────────────────────────────────────────────────────────────────
const POLL_INTERVAL      = 8_000;
const SLOT_CYCLE_INTERVAL = 5_000;
const HEADER_H           = 56;

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface WeatherData { temp: number; icon: string; condition: string; }

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function scaleToScreen(
  x: number,
  y: number,
  w: number,
  h: number,
  baseW: number,
  baseH: number,
  screenW: number,
  screenH: number,
) {
  // ONLY mobile portrait should be centered
  const isMobilePortrait =
    Platform.OS !== 'web' &&
    screenW < 768 &&
    screenH > screenW;

  // DESKTOP / WEB / TV / TABLET
  // Keep EXACT admin layout positions
  if (!isMobilePortrait) {
    return {
      left: (x / baseW) * screenW,
      top: (y / baseH) * screenH + HEADER_H,
      width: (w / baseW) * screenW,
      height: (h / baseH) * screenH,
    };
  }

  // MOBILE PORTRAIT ONLY
  // Center the whole admin layout without changing proportions
  const scale = Math.min(
    screenW / baseW,
    (screenH - HEADER_H) / baseH
  );

  const layoutWidth = baseW * scale;
  const layoutHeight = baseH * scale;

  const offsetX = (screenW - layoutWidth) / 2;
  const offsetY = ((screenH - HEADER_H) - layoutHeight) / 2;

  return {
    left: offsetX + (x * scale),
    top: HEADER_H + offsetY + (y * scale),
    width: w * scale,
    height: h * scale,
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

// ─── HEADER ───────────────────────────────────────────────────────────────────
const Header: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const lastTap = useRef(0);

  const logout = async () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      try {
        const rt = await getRefreshToken();
        if (rt) await logoutApi(rt);
      } catch (e) {
        console.log('Logout error:', e);
      } finally {
        await deleteTokens();
        notifyAuthChange();
        router.replace('/login');
      }
    }
    lastTap.current = now;
  };

const loadWeather = async () => {
  try {
    // 1. Try cached weather first (fast UI)
    const cached = await AsyncStorage.getItem('lastWeather');
    if (cached) {
      setWeather(JSON.parse(cached));
    }

    // 2. Get live location
    const location = await getLocation();
    if (!location) return;

    // 3. Fetch latest weather
    const latestWeather = await fetchWeather(location);
    if (!latestWeather) return;

    // 4. Update UI
    setWeather(latestWeather);

    // 5. Save latest weather to cache
    await AsyncStorage.setItem(
      'lastWeather',
      JSON.stringify(latestWeather)
    );
  } catch (e) {
    console.log('Weather load failed:', e);
  }
};


  useEffect(() => {
    loadWeather();
    const t = setInterval(loadWeather, 10 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

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
            {weather.icon ? (
              <Image source={{ uri: weather.icon }} style={{ width: isMobile ? 20 : 24, height: isMobile ? 20 : 24 }} />
            ) : null}
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

// ─── FADE IMAGE ───────────────────────────────────────────────────────────────
// ─── MILD PAN IMAGE (NO ZOOM / NO BLUR) ─────────────────────────────
const FadeImage: React.FC<{ uri: string; style: object }> = ({ uri, style }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // reset on image change
    opacity.setValue(0);
    translateX.setValue(0);

    // smooth fade-in
    Animated.timing(opacity, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease),
    }).start();

    // mild slow pan animation
    const panAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: 6, // very small move right
          duration: 4000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(translateX, {
          toValue: -6, // very small move left
          duration: 4000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );

    panAnimation.start();

    return () => {
      panAnimation.stop();
    };
  }, [uri]);

  return (
    <Animated.Image
      source={{ uri }}
      resizeMode="contain"
      style={[
        style,
        {
          opacity,
          transform: [{ translateX }],
        },
      ]}
    />
  );
};


// ─── CYCLING SLOT ─────────────────────────────────────────────────────────────
const CyclingSlot: React.FC<{
  slotIndex: number;
  images: any[];
  frame: { left: number; top: number; width: number; height: number };
  cycleInterval?: number;
}> = ({ images, frame, cycleInterval = 5000 }) => {
  const [idx, setIdx] = useState(0);

  useEffect(() => { setIdx(0); }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % images.length), cycleInterval);
    return () => clearInterval(t);
  }, [images.length, cycleInterval]);

  if (!images.length) return null;

  return (
    <View style={[styles.slot, { left: frame.left, top: frame.top, width: frame.width, height: frame.height }]}>
      <FadeImage uri={images[idx].imageUrl} style={StyleSheet.absoluteFill} />
      {images.length > 1 && (
        <View style={styles.dots} pointerEvents="none">
          {images.map((_: any, i: number) => (
            <View key={i} style={[styles.dot, i === idx && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function TVDisplayScreen() {
  const { width, height } = useWindowDimensions();
  const [canvas, setCanvas]   = useState<DeviceCanvasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Force portrait ONLY on mobile, LEAVE WEB/TV ALONE ──────────────────
  useEffect(() => {
    // Don't do anything on web - keep original behavior
    if (Platform.OS === 'web') return;

    const lockMobile = async () => {
      try {
        await ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        );
      } catch (e) {
        console.log('Mobile lock failed:', e);
      }
    };

    lockMobile();

    return () => {
      if (Platform.OS !== 'web') {
        ScreenOrientation.unlockAsync().catch(() => {});
      }
    };
  }, []);

  // ── Data fetching ────────────────────────────────────────────────────────
  const fetchCanvas = useCallback(async () => {
    try {
      const response = await getDeviceCanvas();
      if (response?.data) {
        setCanvas(response.data);
        setError('');
      } else {
        setCanvas(null);
      }
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

  // ── Build slots - EXACTLY like original, NO changes ─────────────────────
const slots = (() => {
  if (!canvas?.items?.length) return [];

  const groups = new Map<number, any[]>();

  canvas.items.forEach(item => {
    const si = item.slotIndex ?? 0;

    if (!groups.has(si)) {
      groups.set(si, []);
    }

    groups.get(si)!.push(item);
  });

  return Array.from(groups.entries()).map(([slotIndex, items]) => ({
    slotIndex,
    items,
    frame: scaleToScreen(
      items[0].x,
      items[0].y,
      items[0].width,
      items[0].height,

      // USE EXACT API VALUES
      canvas.screenWidth,
      canvas.screenHeight,

      width,
      height
    ),
  }));
})();



  // ── Render - EXACTLY like original ──────────────────────────────────────
  return (
    <View style={[styles.root, { width, height }]}>
      <StatusBar hidden />
      <Header onPress={fetchCanvas} />
      <View style={styles.contentArea}>
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

        {!loading && !error && canvas?.items?.length ? (
          slots.map(slot => (
            <CyclingSlot
              key={slot.slotIndex}
              slotIndex={slot.slotIndex}
              images={slot.items}
              frame={slot.frame}
              cycleInterval={SLOT_CYCLE_INTERVAL}
            />
          ))
        ) : null}

        {!loading && !error && !canvas?.items?.length && (
          <View style={styles.center}>
            <Text style={styles.idleText}>No content scheduled</Text>
            <Text style={styles.idleSub}>Waiting for admin to send a canvas…</Text>
          </View>
        )}
      </View>
    </View>
  );
}
// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { backgroundColor: '#253666', position: 'relative', overflow: 'hidden' },

  header: {
    position: 'absolute', top: 0, left: 0, right: 0, height: HEADER_H,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#2A3462',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
    zIndex: 100,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: { borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  appName: { color: '#FFF', fontWeight: '700', letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  weatherContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weatherTemp: { color: '#FFF', fontWeight: '600' },
  dateTimeContainer: { alignItems: 'flex-end' },
  dateText: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '500' },
  timeText: { color: '#FFF', fontSize: 14, fontWeight: '600' },

  contentArea: { flex: 1, backgroundColor: '#2A3462', position: 'relative' },
  slot: { position: 'absolute', backgroundColor: '#2A3462', overflow: 'hidden' },

  dots: { position: 'absolute', bottom: 8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: '#FFF', width: 18 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  errorText: { color: '#EF4444', fontSize: 18, fontWeight: '700' },
  errorSub: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  idleText: { color: 'rgba(255,255,255,0.6)', fontSize: 22, fontWeight: '700' },
  idleSub: { color: 'rgba(255,255,255,0.3)', fontSize: 14 },
});