// AdminLayoutStudio.tsx — Production-grade rewrite (FIXED)

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image, StyleSheet,
  useWindowDimensions, Modal, ActivityIndicator, Pressable,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, runOnJS, withSpring,
} from 'react-native-reanimated';
import {
  Gesture, GestureDetector, GestureHandlerRootView,
} from 'react-native-gesture-handler';
import {
  Monitor, Tv, Trash2, Send, Grid3X3, X, Layers, ImageIcon,
  CheckCircle, Plus, MinusCircle, ChevronLeft, ChevronRight,
  ArrowUpToLine, ArrowDownToLine,
} from 'lucide-react-native';
import { BirthdayModal } from '@/components/birthdayModal';
import { useBirthdayCanvas } from '@/constants/useBirthday';
import { Cake } from 'lucide-react-native';
import {
  getContentLUT, sendCanvasContent,
  ContentLUT, ImageItem, DeviceLUTItem,
} from '@/services/content';
import ResponsiveLayout from '@/components/responsiveLayout';
import { useLocalSearchParams } from 'expo-router';
import Toast from "react-native-toast-message";

import { DraxProvider, DraxView } from 'react-native-drax';


// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  bg: '#F0F4FF',
  surface: '#FFFFFF',
  surfaceRaised: '#F1F3F9',
  border: '#E2E8F0',
  borderLight: '#EDF2F7',
  accent: '#1E3A8A',
  accentDim: '#3b53b4',
  accentGhost: '#EBEDF5',
  success: '#10B981',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  text: '#1E293B',
  textMid: '#64748B',
  textDim: '#94A3B8',
  handle: '#1E3A8A',
  handleBg: '#FFFFFF',
  selectedBorder: '#1E3A8A',
  white: '#FFFFFF',
} as const;

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface SlotImage {
  id: string;
  imageId: number;
  imageurl: string;
}

export interface CanvasItem {
  id: string;
  images: SlotImage[];
  currentImageIndex: number;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
}

type HandleDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CANVAS_W = 1920;
const CANVAS_H = 1080;
const SNAP = 20;
const MIN_W = 120;
const MIN_H = 68;
const ARROW_STEP = 20;

const snap  = (v: number) => Math.round(v / SNAP) * SNAP;
const uid   = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// ─── RESIZE HANDLE CONFIG ─────────────────────────────────────────────────────
const HANDLES: { dir: HandleDir; style: object }[] = [
  { dir: 'nw', style: { top: -6,  left: -6,              cursor: 'nw-resize' } },
  { dir: 'ne', style: { top: -6,  right: -6,             cursor: 'ne-resize' } },
  { dir: 'sw', style: { bottom: -6, left: -6,            cursor: 'sw-resize' } },
  { dir: 'se', style: { bottom: -6, right: -6,           cursor: 'se-resize' } },
  { dir: 'n',  style: { top: -5,   left: '50%', marginLeft: -8, cursor: 'n-resize' } },
  { dir: 's',  style: { bottom: -5, left: '50%', marginLeft: -8, cursor: 's-resize' } },
  { dir: 'w',  style: { left: -5,  top: '50%', marginTop: -8,  cursor: 'w-resize' } },
  { dir: 'e',  style: { right: -5, top: '50%', marginTop: -8,  cursor: 'e-resize' } },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function applyResize(
  dir: HandleDir, dx: number, dy: number,
  startX: number, startY: number, startW: number, startH: number,
  scale: number, canvasW: number, canvasH: number,
): { x: number; y: number; w: number; h: number } {
  // All inputs are in PIXEL space; output is also in PIXEL space
  let x = startX, y = startY, w = startW, h = startH;
  const minWpx = MIN_W * scale;
  const minHpx = MIN_H * scale;
  if (dir.includes('e')) w = Math.max(minWpx, startW + dx);
  if (dir.includes('s')) h = Math.max(minHpx, startH + dy);
  if (dir.includes('w')) { const nw = Math.max(minWpx, startW - dx); x = startX + (startW - nw); w = nw; }
  if (dir.includes('n')) { const nh = Math.max(minHpx, startH - dy); y = startY + (startH - nh); h = nh; }
  const maxXpx = canvasW * scale - minWpx;
  const maxYpx = canvasH * scale - minHpx;
  x = clamp(x, 0, maxXpx);
  y = clamp(y, 0, maxYpx);
  w = clamp(w, minWpx, canvasW * scale - x);
  h = clamp(h, minHpx, canvasH * scale - y);
  return { x, y, w, h };
}



const CanvasItemView: React.FC<{
  item: CanvasItem;
  selected: boolean;
  scale: number;
  imageBaseUrl: string;
  canvasLogW: number;
  canvasLogH: number;
  onSelect: () => void;
  onUpdate: (u: Partial<CanvasItem>) => void;
  onDelete: () => void;
  onAddImage: () => void;
  onRemoveCurrentImage: () => void;
}> = ({
  item, selected, scale, imageBaseUrl,
  canvasLogW, canvasLogH,
  onSelect, onUpdate, onDelete, onAddImage, onRemoveCurrentImage,
}) => {
  // ─────────────────────────────────────────────────────────────────────────────
  // ALL shared values are stored in PIXEL space.
  // Logical ↔ pixel conversion:  pixel = logical * scale
  // ─────────────────────────────────────────────────────────────────────────────
  const tx = useSharedValue(item.x * scale);   // pixels
  const ty = useSharedValue(item.y * scale);   // pixels
  const sw = useSharedValue(item.w * scale);   // pixels
  const sh = useSharedValue(item.h * scale);   // pixels

  // Start-of-gesture pixel values — stored as shared values so worklets can read them safely
  const dragStartX = useSharedValue(0);  // pixels at drag start
  const dragStartY = useSharedValue(0);  // pixels at drag start

  const dragActive  = useRef(false);

  // Resize start state — read/written only in worklets or JS callbacks
  const resizeStartX = useSharedValue(0);  // pixels
  const resizeStartY = useSharedValue(0);  // pixels
  const resizeStartW = useSharedValue(0);  // pixels
  const resizeStartH = useSharedValue(0);  // pixels
  const resizeActiveRef = useRef(false);
  const resizeDirRef    = useRef<HandleDir>('se');

  // Sync animated values when item geometry changes externally (undo/redo, arrow keys, etc.)
  // Only sync when no gesture is active to avoid fighting the gesture.
  useEffect(() => {
    if (!dragActive.current && !resizeActiveRef.current) {
      tx.value = item.x * scale;
      ty.value = item.y * scale;
      sw.value = item.w * scale;
      sh.value = item.h * scale;
    }
    // tx/ty/sw/sh intentionally excluded — they are stable Reanimated refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.x, item.y, item.w, item.h, scale]);

  // ── JS-thread callbacks (called via runOnJS) ─────────────────────────────────
  const onDragEnd = useCallback((finalTxPx: number, finalTyPx: number) => {
    dragActive.current = false;
    // Convert pixel → logical, snap, clamp
    const nx = snap(clamp(finalTxPx / scale, 0, canvasLogW - item.w));
    const ny = snap(clamp(finalTyPx / scale, 0, canvasLogH - item.h));
    onUpdate({ x: nx, y: ny });
  }, [scale, canvasLogW, canvasLogH, item.w, item.h, onUpdate]);

  const onResizeEnd = useCallback((
    finalTxPx: number, finalTyPx: number,
    finalSwPx: number, finalShPx: number,
  ) => {
    resizeActiveRef.current = false;
    // Convert pixel → logical, snap
    onUpdate({
      x: snap(clamp(finalTxPx / scale, 0, canvasLogW)),
      y: snap(clamp(finalTyPx / scale, 0, canvasLogH)),
      w: snap(Math.max(MIN_W, finalSwPx / scale)),
      h: snap(Math.max(MIN_H, finalShPx / scale)),
    });
  }, [scale, canvasLogW, canvasLogH, onUpdate]);

  // ── Pan gesture — drag to move ────────────────────────────────────────────────
  const pan = Gesture.Pan()
    .minDistance(3)
    .onStart(() => {
      'worklet';
      // Capture current pixel position at start of drag
      dragStartX.value = tx.value;
      dragStartY.value = ty.value;
      runOnJS(onSelect)();
      dragActive.current = true;
    })
    .onUpdate((e) => {
      'worklet';
      // Both dragStart and translation are in pixels — safe addition
      const nextX = dragStartX.value + e.translationX;
      const nextY = dragStartY.value + e.translationY;
      // Clamp to canvas bounds in pixel space
      tx.value = clamp(nextX, 0, (canvasLogW - item.w) * scale);
      ty.value = clamp(nextY, 0, (canvasLogH - item.h) * scale);
    })
    .onEnd(() => {
      'worklet';
      runOnJS(onDragEnd)(tx.value, ty.value);
    });

  // ── Resize gesture factory ────────────────────────────────────────────────────
  const makeResize = useCallback((dir: HandleDir) =>
    Gesture.Pan()
      .minDistance(2)
      .onStart(() => {
        'worklet';
        // Capture current pixel geometry at start of resize
        resizeStartX.value = tx.value;
        resizeStartY.value = ty.value;
        resizeStartW.value = sw.value;
        resizeStartH.value = sh.value;
        resizeDirRef.current = dir;
        resizeActiveRef.current = true;
        runOnJS(onSelect)();
      })
      .onUpdate((e) => {
        'worklet';
        // applyResize works entirely in pixel space
        const res = applyResize(
          dir,
          e.translationX,      // pixel delta
          e.translationY,      // pixel delta
          resizeStartX.value,  // pixel start
          resizeStartY.value,  // pixel start
          resizeStartW.value,  // pixel start
          resizeStartH.value,  // pixel start
          scale,
          canvasLogW,
          canvasLogH,
        );
        tx.value = res.x;
        ty.value = res.y;
        sw.value = res.w;
        sh.value = res.h;
      })
      .onEnd(() => {
        'worklet';
        runOnJS(onResizeEnd)(tx.value, ty.value, sw.value, sh.value);
      }),
  // tx/ty/sw/sh/resizeStart* are stable Reanimated refs — intentionally excluded from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [scale, canvasLogW, canvasLogH, onSelect, onResizeEnd]);

  // ── Animated style — ONLY place .value is read declaratively ─────────────────
  const posStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
    ],
    width:  sw.value,
    height: sh.value,
  }));

  const currentImg = item.images[item.currentImageIndex];
  const hasMulti   = item.images.length > 1;
  const prevImage  = () => onUpdate({ currentImageIndex: item.currentImageIndex > 0 ? item.currentImageIndex - 1 : item.images.length - 1 });
  const nextImage  = () => onUpdate({ currentImageIndex: (item.currentImageIndex + 1) % item.images.length });

  return (
    <Animated.View style={[styles.itemOuter, posStyle]}>
      <GestureDetector gesture={pan}>
        <Pressable style={[styles.itemInner, selected && styles.itemSelected]} onPress={onSelect}>
          {currentImg && (
            <Image source={{ uri: `${imageBaseUrl}${currentImg.imageurl}` }} style={StyleSheet.absoluteFill} resizeMode="contain" />
          )}
          {!currentImg && (
            <View style={styles.emptySlot}>
              <ImageIcon size={20} color={T.textDim} />
              <Text style={styles.emptySlotText}>No image</Text>
            </View>
          )}
          {hasMulti && (
            <View style={styles.counterBadge} pointerEvents="none">
              <Text style={styles.counterText}>{item.currentImageIndex + 1}/{item.images.length}</Text>
            </View>
          )}
        </Pressable>
      </GestureDetector>

      {selected && (
        <>
          {HANDLES.map(({ dir, style: pos }) => (
            <GestureDetector key={dir} gesture={makeResize(dir)}>
              <View
                style={[dir.length === 2 ? styles.handleCorner : styles.handleEdge, pos as any]}
                hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
              />
            </GestureDetector>
          ))}
          <View style={styles.floatBar}>
            {hasMulti && (
              <>
                <TouchableOpacity style={styles.floatBtn} onPress={prevImage}><ChevronLeft size={11} color={T.text} /></TouchableOpacity>
                <TouchableOpacity style={styles.floatBtn} onPress={nextImage}><ChevronRight size={11} color={T.text} /></TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.floatBtn} onPress={onAddImage}><Plus size={11} color={T.accent} /></TouchableOpacity>
            {hasMulti && (
              <TouchableOpacity style={styles.floatBtn} onPress={onRemoveCurrentImage}><MinusCircle size={11} color={T.danger} /></TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.floatBtn, styles.floatBtnDanger]} onPress={onDelete}><Trash2 size={11} color={T.danger} /></TouchableOpacity>
          </View>
        </>
      )}
      {!selected && (
        <TouchableOpacity
          style={styles.quickAdd}
          onPress={e => { e.stopPropagation(); onAddImage(); }}
          hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}
        >
          <Plus size={10} color={T.white} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminLayoutStudio() {
  const { width: screenW } = useWindowDimensions();
  const params = useLocalSearchParams();

  const SIDEBAR = 220;
  const PANEL   = 220;
  const canvasW = Math.min(screenW - SIDEBAR - PANEL - 40, 1200);
  const canvasH = Math.round(canvasW * (CANVAS_H / CANVAS_W));
  const scale   = canvasW / CANVAS_W;

  const isEditMode   = params.editMode === 'true';
  const editItems    = useMemo(() => { try { return params.items ? JSON.parse(params.items as string) : []; } catch { return []; } }, [params.items]);
  const editDeviceId = params.deviceId as string;

  const [lut, setLut]                   = useState<ContentLUT | null>(null);
  const [loading, setLoading]           = useState(true);
  const [page, setPage]                 = useState(1);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [hasMore, setHasMore]           = useState(true);
  const [items, setItems]               = useState<CanvasItem[]>([]);
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [sending, setSending]           = useState(false);
  const [showGrid, setShowGrid]         = useState(true);
  const [showDevicePicker, setShowDevicePicker] = useState(false);
  const [showImageDrawer, setShowImageDrawer]   = useState(false);
  const [successModal, setSuccessModal]         = useState(false);
  const [selectingFor, setSelectingFor]         = useState<string | null>(null);
  const [selectedDevices, setSelectedDevices]   = useState<DeviceLUTItem[]>([]);

  const { buildCanvasItems } = useBirthdayCanvas();
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);

  const historyRef  = useRef<CanvasItem[][]>([[]]);
  const historyIdx  = useRef(0);
  const skipHistory = useRef(false);
  const canvasRef = useRef<View>(null);
  const canvasLayout = useRef({ x: 0, y: 0 });
  const scrollOffset = useRef({ x: 0, y: 0 });

  const dragLock = useRef(false);

  const clipboardRef = useRef<CanvasItem | null>(null);

  const [dragOver, setDragOver] = useState(false);

  const pushHistory = useCallback((newItems: CanvasItem[]) => {
    if (skipHistory.current) return;
    const sliced = historyRef.current.slice(0, historyIdx.current + 1);
    sliced.push(JSON.parse(JSON.stringify(newItems)));
    historyRef.current = sliced;
    historyIdx.current = sliced.length - 1;
  }, []);

  const setItemsWithHistory = useCallback((updater: CanvasItem[] | ((prev: CanvasItem[]) => CanvasItem[])) => {
    setItems(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  useEffect(() => { loadImages(1, true); }, []);

  const loadImages = async (pageNum: number, reset = false) => {
    if (loadingMore && !reset) return;
    setLoadingMore(true);
    try {
      const result = await getContentLUT(pageNum, 20);
      setLut(prev => reset || !prev ? result : { ...result, imageList: [...prev.imageList, ...result.imageList] });
      setPage(pageNum);
      setHasMore(result.pagination ? pageNum < result.pagination.totalPages : false);
    } catch {
      Toast.show({ type: "error", text1: "Error", text2: 'Failed to load image library.', visibilityTime: 2000 });
    } finally {
      setLoadingMore(false);
      if (reset) setLoading(false);
    }
  };

  useEffect(() => {
    if (!isEditMode || !editItems?.length || !lut?.deviceList?.length || items.length > 0) return;
    const map: Record<string, CanvasItem> = {};
    editItems.forEach((api: any, i: number) => {
      const key = `slot_${api.slotIndex}`;
      const img: SlotImage = { id: `img_${api.imageId}_${i}`, imageId: api.imageId, imageurl: api.imageUrl || api.imageurl || '' };
      if (!map[key]) {
        map[key] = { id: key, images: [img], currentImageIndex: 0, x: api.x || 0, y: api.y || 0, w: api.width || 400, h: api.height || 250, zIndex: api.zIndex || i + 1 };
      } else {
        map[key].images.push(img);
      }
    });
    const final = Object.values(map);
    skipHistory.current = true;
    setItems(final);
    skipHistory.current = false;
    pushHistory(final);
    if (final.length) setSelectedId(final[0].id);
    const dev = lut.deviceList.find(d => d.deviceId === editDeviceId);
    if (dev) setSelectedDevices([dev]);
  }, [isEditMode, editItems, editDeviceId, lut?.deviceList, items.length]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const tag  = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (historyIdx.current > 0) {
          historyIdx.current -= 1;
          const prev = historyRef.current[historyIdx.current];
          skipHistory.current = true;
          setItems(JSON.parse(JSON.stringify(prev)));
          skipHistory.current = false;
        }
        return;
      }
      if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (historyIdx.current < historyRef.current.length - 1) {
          historyIdx.current += 1;
          const next = historyRef.current[historyIdx.current];
          skipHistory.current = true;
          setItems(JSON.parse(JSON.stringify(next)));
          skipHistory.current = false;
        }
        return;
      }
      if (ctrl && e.key === 'a') {
        e.preventDefault();
        setItems(prev => {
          if (!prev.length) return prev;
          setSelectedId(id => {
            const idx = prev.findIndex(i => i.id === id);
            return prev[(idx + 1) % prev.length].id;
          });
          return prev;
        });
        return;
      }
      if (ctrl && e.key === 'x') {
        e.preventDefault();
        setItems(prev => {
          const sel = prev.find(i => i.id === selectedId);
          if (!sel) return prev;
          clipboardRef.current = JSON.parse(JSON.stringify(sel));
          const next = prev.filter(i => i.id !== selectedId);
          pushHistory(next);
          setSelectedId(null);
          return next;
        });
        return;
      }
      if (ctrl && e.key === 'c') {
        e.preventDefault();
        setItems(prev => {
          const sel = prev.find(i => i.id === selectedId);
          if (sel) clipboardRef.current = JSON.parse(JSON.stringify(sel));
          return prev;
        });
        return;
      }
      if (ctrl && e.key === 'v') {
        e.preventDefault();
        if (!clipboardRef.current) return;
        const clone: CanvasItem = {
          ...JSON.parse(JSON.stringify(clipboardRef.current)),
          id: `item_${uid()}`,
          x: snap(clamp(clipboardRef.current.x + SNAP * 2, 0, CANVAS_W - clipboardRef.current.w)),
          y: snap(clamp(clipboardRef.current.y + SNAP * 2, 0, CANVAS_H - clipboardRef.current.h)),
        };
        setItemsWithHistory(prev => {
          const maxZ = prev.length ? Math.max(...prev.map(i => i.zIndex)) : 0;
          return [...prev, { ...clone, zIndex: maxZ + 1 }];
        });
        setSelectedId(clone.id);
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        setItemsWithHistory(prev => prev.filter(i => i.id !== selectedId));
        setSelectedId(null);
        return;
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
        return;
      }
      if (selectedId && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? ARROW_STEP * 5 : ARROW_STEP;
        setItems(prev => {
          const next = prev.map(it => {
            if (it.id !== selectedId) return it;
            let nx = it.x, ny = it.y;
            if (e.key === 'ArrowLeft')  nx = clamp(it.x - step, 0, CANVAS_W - it.w);
            if (e.key === 'ArrowRight') nx = clamp(it.x + step, 0, CANVAS_W - it.w);
            if (e.key === 'ArrowUp')    ny = clamp(it.y - step, 0, CANVAS_H - it.h);
            if (e.key === 'ArrowDown')  ny = clamp(it.y + step, 0, CANVAS_H - it.h);
            return { ...it, x: snap(nx), y: snap(ny) };
          });
          pushHistory(next);
          return next;
        });
        return;
      }
      if (selectedId && (e.key === '[' || e.key === ']')) {
        e.preventDefault();
        setItems(prev => {
          const next = prev.map(it => {
            if (it.id !== selectedId) return it;
            const allZ = prev.map(i => i.zIndex);
            const minZ = Math.min(...allZ);
            const maxZ = Math.max(...allZ);
            return { ...it, zIndex: e.key === ']' ? maxZ + 1 : Math.max(0, minZ - 1) };
          });
          pushHistory(next);
          return next;
        });
        return;
      }
    };

    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedId, pushHistory, setItemsWithHistory]);

  // ── Item mutations ────────────────────────────────────────────────────────────
const addImageToCanvas = useCallback((
  img: ImageItem,
  targetId?: string | null,
  dropX?: number,   // logical X (already converted before calling)
  dropY?: number,   // logical Y (already converted before calling)
) => {
  const newImg: SlotImage = {
    id: `img_${Date.now()}_${Math.random()}`,
    imageId: img.imageId,
    imageurl: img.imageurl || img.imageName,
  };
 
  // Case 1: Adding to an existing slot
  if (targetId) {
    setItemsWithHistory(prev =>
      prev.map(it =>
        it.id === targetId
          ? { ...it, images: [...it.images, newImg] }
          : it
      )
    );
     // ✅ ADD THIS
  setSelectedId(targetId);
    setSelectingFor(null);
    setShowImageDrawer(false);
    return;
  }
 
  // Case 2: New slot — either at drop position or staggered default
  setItemsWithHistory(prev => {
    const width  = 520;
    const height = 300;
    const maxZ   = prev.length ? Math.max(...prev.map(i => i.zIndex)) : 0;
 
    const logicalX = dropX !== undefined
      ? snap(clamp(dropX, 0, CANVAS_W - width))
      : snap(80 + prev.length * 40);   // click → stagger
 
    const logicalY = dropY !== undefined
      ? snap(clamp(dropY, 0, CANVAS_H - height))
      : snap(80 + prev.length * 40);   // click → stagger
 
    const newItem: CanvasItem = {
      id: `item_${Date.now()}_${Math.random()}`,
      images: [newImg],
      currentImageIndex: 0,
      x: logicalX,
      y: logicalY,
      w: width,
      h: height,
      zIndex: maxZ + 1,
    };
 
    return [...prev, newItem];
  });
 
  setSelectingFor(null);
  setShowImageDrawer(false);
}, [setItemsWithHistory]);

  const updateItem = useCallback((id: string, u: Partial<CanvasItem>) =>
    setItemsWithHistory(prev => prev.map(i => i.id === id ? { ...i, ...u } : i)),
  [setItemsWithHistory]);

  const deleteItem = useCallback((id: string) => {
    setItemsWithHistory(prev => prev.filter(i => i.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId, setItemsWithHistory]);

  const removeCurrentImage = useCallback((itemId: string) => {
    setItemsWithHistory(prev => prev.map(it => {
      if (it.id !== itemId) return it;
      const imgs = it.images.filter((_, i) => i !== it.currentImageIndex);
      if (!imgs.length) return it;
      return { ...it, images: imgs, currentImageIndex: Math.min(it.currentImageIndex, imgs.length - 1) };
    }));
  }, [setItemsWithHistory]);

  const bringToFront = (id: string) => {
    const maxZ = Math.max(...items.map(i => i.zIndex));
    updateItem(id, { zIndex: maxZ + 1 });
  };
  const sendToBack = (id: string) => {
    const minZ = Math.min(...items.map(i => i.zIndex));
    updateItem(id, { zIndex: Math.max(0, minZ - 1) });
  };

  const toggleDevice = (device: DeviceLUTItem) =>
    setSelectedDevices(prev =>
      prev.some(d => d.deviceId === device.deviceId)
        ? prev.filter(d => d.deviceId !== device.deviceId)
        : [...prev, device]
    );

  const validateBounds = (): string | null => {
    for (const item of items) {
      if (item.x < 0 || item.y < 0 || item.x + item.w > CANVAS_W || item.y + item.h > CANVAS_H)
        return `Slot "${item.id}" is outside the canvas bounds.`;
    }
    return null;
  };

  const handleSend = async () => {
    if (!selectedDevices.length) { Toast.show({ type: "error", text1: "No Device", text2: "Please select at least one TV.", position: "top" }); return; }
    if (!items.length)            { Toast.show({ type: "error", text1: "No Content", text2: "Add at least one image slot.", position: "top" }); return; }
    const boundsError = validateBounds();
    if (boundsError)              { Toast.show({ type: "error", text1: "Layout Error", text2: boundsError, position: "top" }); return; }

    setSending(true);
    try {
      const sorted    = [...items].sort((a, b) => a.zIndex - b.zIndex);
      const sendItems = sorted.flatMap((item, slotIdx) =>
        item.images.map((img, imgIdx) => ({
          slotIndex: slotIdx, imageIndex: imgIdx,
          imageId: img.imageId, imageurl: img.imageurl,
          x: item.x, y: item.y, width: item.w, height: item.h,
          zIndex: slotIdx + 1, pinned: true, resizeMode: "contain",
        }))
      );
      const payloads = selectedDevices.map(device => ({
        title: `Layout_${Date.now()}`,
        description: `${items.length} slot(s), ${sendItems.length} image(s)`,
        deviceId: device.deviceId,
        screenWidth: CANVAS_W, screenHeight: CANVAS_H,
        screenLayout: `${items.length}`,
        items: sendItems,
      }));
      await Promise.all(payloads.map(p => sendCanvasContent(p)));
      setShowDevicePicker(false);
      setSuccessModal(true);
      Toast.show({ type: "success", text1: "Success", text2: `Layout sent to ${selectedDevices.length} device${selectedDevices.length > 1 ? 's' : ''} successfully`, position: "top" });
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Send Failed", text2: error?.message || "Failed to send content to TV.", position: "top" });
    } finally {
      setSending(false);
    }
  };

  const selectedItem  = items.find(i => i.id === selectedId) ?? null;
  const sortedItems   = useMemo(() => [...items].sort((a, b) => a.zIndex - b.zIndex), [items]);
  const reversedItems = useMemo(() => [...items].sort((a, b) => b.zIndex - a.zIndex), [items]);

  // ─── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <DraxProvider>
      <ResponsiveLayout>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={styles.root}>

            {/* ── TOP BAR ── */}
            <View style={styles.topBar}>
              <View style={styles.topBarLeft}>
                <Monitor size={16} color={T.accent} />
                <Text style={styles.topBarTitle}>Layout Studio</Text>
                <View style={styles.topBarDivider} />
                <Text style={styles.topBarMeta}>{items.length} slot{items.length !== 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.topBarRight}>
                <TouchableOpacity style={styles.gridBtn} onPress={() => setShowGrid(g => !g)}>
                  <Grid3X3 size={14} color={showGrid ? T.accent : T.textMid} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.birthdayBtn} onPress={() => setShowBirthdayModal(true)}>
                  <Cake size={13} color={T.accent} />
                  <Text style={styles.birthdayBtnText}>Add Birthday</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sendBtn, (sending || loading) && { opacity: 0.5 }]}
                  onPress={() => setShowDevicePicker(true)}
                  disabled={sending || loading}
                >
                  {sending
                    ? <ActivityIndicator size="small" color={T.white} />
                    : <><Send size={13} color={T.white} /><Text style={styles.sendBtnText}>Send to TV</Text></>}
                </TouchableOpacity>
              </View>
            </View>

            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={T.accent} />
                <Text style={styles.loadingText}>Loading library…</Text>
              </View>
            ) : (
              <View style={styles.body}>

                {/* ── LEFT SIDEBAR ── */}
                <View style={styles.sidebar}>
                  <Text style={styles.sectionLabel}>Image Library</Text>
                  <Text style={styles.dragHint}>Drag image → canvas to place</Text>
                  <ScrollView
                    style={{ flex: 1 }}
                    showsVerticalScrollIndicator={false}
                    onScroll={({ nativeEvent: n }) => {
                      if (n.layoutMeasurement.height + n.contentOffset.y >= n.contentSize.height - 200 && hasMore && !loadingMore)
                        loadImages(page + 1, false);
                    }}
                    scrollEventThrottle={100}
                  >
                    {(lut?.imageList ?? []).map(img => (
<DraxView
  key={img.imageId}
  style={styles.libRow}
  draggingStyle={{ opacity: 0.2 }}
  dragReleasedStyle={{ opacity: 1 }}
  longPressDelay={150} // 🔥 important: prevents accidental drag on tap
  payload={img}
  onDragStart={() => {
    dragLock.current = true;
    setDragOver(true);
  }}
  onDragEnd={() => {
    setDragOver(false);

    // 🔥 release lock AFTER small delay
    setTimeout(() => {
      dragLock.current = false;
    }, 100);
  }}
>

  <Pressable
    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
onPress={() => {
  // 🔥 only ignore if drag JUST happened
  if (dragLock.current) return;

  // ALWAYS create new slot
  addImageToCanvas(img);
}}



  >
    <View style={styles.libDragHandle}>
      <Text style={styles.libDragIcon}>⠿</Text>
    </View>
    <Image
      source={{ uri: `${lut?.imageUrl || ''}${img.imageurl || img.imageName}` }}
      style={styles.libThumb}
      resizeMode="contain"
    />
    <View style={styles.libMeta}>
      <Text style={styles.libName} numberOfLines={2}>{img.imageName}</Text>
      <Text style={styles.libId}>ID {img.imageId}</Text>
    </View>
  </Pressable>
</DraxView>
                    ))}
                    {loadingMore && <ActivityIndicator color={T.accent} style={{ marginVertical: 12 }} />}
                    {!hasMore && !!lut?.imageList?.length && <Text style={styles.endText}>— End of library —</Text>}
                  </ScrollView>
                </View>

                {/* ── CANVAS AREA ── */}
                <View style={styles.canvasOuter}>
                  <ScrollView
                    style={styles.canvasScroll}
                    contentContainerStyle={styles.canvasScrollContent}
                    showsVerticalScrollIndicator={true}
                    showsHorizontalScrollIndicator={true}
                    bounces={false}
                    onScroll={({ nativeEvent }) => {
                      scrollOffset.current = {
                        x: nativeEvent.contentOffset.x,
                        y: nativeEvent.contentOffset.y,
                      };
                    }}
                    scrollEventThrottle={16}
                  >
                    <View style={styles.canvasArea}>
                      <DraxView
                   
                        style={[
                          styles.canvas,
                          { width: canvasW, height: canvasH },
                          dragOver && styles.canvasDragOver,
                        ]}
                        onLayout={() => {
                          canvasRef.current?.measure((_fx, _fy, _w, _h, px, py) => {
                            canvasLayout.current = { x: px, y: py };
                          });
                        }}
                        receivingStyle={{
                          borderColor: T.accent,
                          borderWidth: 2,
                        }}
                     onReceiveDragDrop={({ dragged, receiver }) => {
                          const payload = dragged?.payload as ImageItem | undefined;
                          if (!payload) return;
                        
                          // receiveOffset is relative to the DraxView (canvas element) — already canvas-pixel space
                          const offsetX = receiver?.receiveOffset?.x ?? 0;
                          const offsetY = receiver?.receiveOffset?.y ?? 0;
                        
                          const ITEM_W = 520;
                          const ITEM_H = 300;
                        
                          // Convert canvas-pixels → logical coords, center item on drop point
                          const logicalX = snap(clamp(offsetX / scale - ITEM_W / 2, 0, CANVAS_W - ITEM_W));
                          const logicalY = snap(clamp(offsetY / scale - ITEM_H / 2, 0, CANVAS_H - ITEM_H));
                        
                          addImageToCanvas(payload, null, logicalX, logicalY);
                          setDragOver(false);
                        }}
                        onReceiveDragEnter={() => setDragOver(true)}
                        onReceiveDragExit={() => setDragOver(false)}
                        renderContent={() => (
                          <>
                            <Pressable style={{ flex: 1 }} onPress={() => setSelectedId(null)}>
                              {/* Grid overlay */}
                              {showGrid && (
                                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                                  {Array.from({ length: Math.floor(canvasH / (SNAP * scale)) + 1 }).map((_, i) => (
                                    <View key={`h${i}`} style={[styles.gridLine, { top: i * SNAP * scale, width: '100%', height: 1 }]} />
                                  ))}
                                  {Array.from({ length: Math.floor(canvasW / (SNAP * scale)) + 1 }).map((_, i) => (
                                    <View key={`v${i}`} style={[styles.gridLine, { left: i * SNAP * scale, height: '100%', width: 1 }]} />
                                  ))}
                                </View>
                              )}

                              {/* Drop hint */}
                              {dragOver && (
                                <View style={styles.dropOverlay} pointerEvents="none">
                                  <Text style={styles.dropOverlayText}>Drop to place image</Text>
                                </View>
                              )}

                              {/* Empty state */}
                              {!items.length && !dragOver && (
                                <View style={styles.emptyCanvas}>
                                  <Grid3X3 size={36} color={T.border} />
                                  <Text style={styles.emptyTitle}>Canvas is empty</Text>
                                  <Text style={styles.emptySub}>Tap or drag an image from the library</Text>
                                </View>
                              )}

                              {/* Canvas items */}
                              {sortedItems.map(item => (
                                <CanvasItemView
                                  key={item.id}
                                  item={item}
                                  selected={selectedId === item.id}
                                  scale={scale}
                                  imageBaseUrl={lut?.imageUrl || ''}
                                  canvasLogW={CANVAS_W}
                                  canvasLogH={CANVAS_H}
                                  onSelect={() => setSelectedId(item.id)}
                                  onUpdate={u => updateItem(item.id, u)}
                                  onDelete={() => deleteItem(item.id)}
                                  onAddImage={() => { setSelectingFor(item.id); setShowImageDrawer(true); }}
                                  onRemoveCurrentImage={() => removeCurrentImage(item.id)}
                                />
                              ))}
                            </Pressable>
                          </>
                        )}
                      />

                   
                    </View>
                  </ScrollView>
                </View>

                {/* ── RIGHT PANEL ── */}
                <View style={styles.panel}>
                  <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                    {selectedItem ? (
                      <>
                        <View style={styles.propSection}>
                          <Text style={styles.sectionLabel}>Images in Slot</Text>
                          {selectedItem.images.map((img, idx) => (
                            <View
                              key={img.id}
                              style={[styles.imgListRow, idx === selectedItem.currentImageIndex && styles.imgListRowActive]}
                            >
                              <Image
                                source={{ uri: `${lut?.imageUrl || ''}${img.imageurl}` }}
                                style={styles.imgListThumb}
                                resizeMode="contain"
                              />
                              <Text style={styles.imgListId} numberOfLines={1}>#{img.imageId}</Text>
                              {idx === selectedItem.currentImageIndex && <View style={styles.activeDot} />}
                              {selectedItem.images.length > 1 && (
                                <TouchableOpacity
                                  onPress={() => setItemsWithHistory(prev => prev.map(it => {
                                    if (it.id !== selectedItem.id) return it;
                                    const imgs = it.images.filter(im => im.id !== img.id);
                                    return { ...it, images: imgs, currentImageIndex: Math.min(it.currentImageIndex, imgs.length - 1) };
                                  }))}
                                  hitSlop={{ top: 6, left: 6, right: 6, bottom: 6 }}
                                >
                                  <MinusCircle size={12} color={T.danger} />
                                </TouchableOpacity>
                              )}
                            </View>
                          ))}
                          <TouchableOpacity
                            style={styles.addSlotBtn}
                            onPress={() => { setSelectingFor(selectedItem.id); setShowImageDrawer(true); }}
                          >
                            <Plus size={13} color={T.accent} />
                            <Text style={styles.addSlotText}>Add image to slot</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.propSection}>
                          <Text style={styles.sectionLabel}>Geometry</Text>
                          <View style={styles.coordGrid}>
                            {(['x', 'y', 'w', 'h'] as const).map(k => (
                              <View key={k} style={styles.coordCell}>
                                <Text style={styles.coordLabel}>{k.toUpperCase()}</Text>
                                <Text style={styles.coordValue}>{selectedItem[k]}</Text>
                              </View>
                            ))}
                          </View>
                          <View style={styles.qRow}>
                            <TouchableOpacity style={styles.qBtn} onPress={() => updateItem(selectedItem.id, { w: Math.min(CANVAS_W - selectedItem.x, selectedItem.w + 120), h: Math.min(CANVAS_H - selectedItem.y, selectedItem.h + 68) })}>
                              <Text style={styles.qBtnText}>+ Larger</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.qBtn, styles.qBtnSecondary]} onPress={() => updateItem(selectedItem.id, { w: Math.max(MIN_W, selectedItem.w - 120), h: Math.max(MIN_H, selectedItem.h - 68) })}>
                              <Text style={[styles.qBtnText, { color: T.textMid }]}>− Smaller</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={styles.propSection}>
                          <Text style={styles.sectionLabel}>Layer Order</Text>
                          <View style={styles.layerBtns}>
                            <TouchableOpacity style={styles.layerBtn} onPress={() => bringToFront(selectedItem.id)}>
                              <ArrowUpToLine size={13} color={T.accent} />
                              <Text style={styles.layerBtnText}>To Front</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.layerBtn, styles.layerBtnSecondary]} onPress={() => sendToBack(selectedItem.id)}>
                              <ArrowDownToLine size={13} color={T.textMid} />
                              <Text style={[styles.layerBtnText, { color: T.textMid }]}>To Back</Text>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <TouchableOpacity style={styles.deleteSlotBtn} onPress={() => deleteItem(selectedItem.id)}>
                          <Trash2 size={13} color={T.danger} />
                          <Text style={styles.deleteSlotText}>Remove Slot</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <View style={styles.nothingSelected}>
                        <Layers size={26} color={T.textDim} />
                        <Text style={styles.nothingText}>Select a slot{'\n'}to edit properties</Text>
                      </View>
                    )}

                    <View style={styles.layerListSection}>
                      <Text style={styles.sectionLabel}>Layers ({items.length})</Text>
                      {reversedItems.map(it => (
                        <TouchableOpacity
                          key={it.id}
                          style={[styles.layerListRow, selectedId === it.id && styles.layerListRowActive]}
                          onPress={() => setSelectedId(it.id)}
                        >
                          <Text style={styles.layerZBadge}>{it.zIndex}</Text>
                          <ImageIcon size={11} color={selectedId === it.id ? T.accent : T.textDim} />
                          <Text style={[styles.layerListText, selectedId === it.id && { color: T.accent }]} numberOfLines={1}>
                            {it.images.length} image{it.images.length !== 1 ? 's' : ''}
                          </Text>
                          <TouchableOpacity onPress={() => deleteItem(it.id)} hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }} style={{ marginLeft: 'auto' }}>
                            <Trash2 size={10} color={T.danger} />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            )}

            <BirthdayModal
              visible={showBirthdayModal}
              onClose={() => setShowBirthdayModal(false)}
              onConfirm={async (type, birthdays) => {
                const newItems = await buildCanvasItems(type, birthdays, items);
                if (newItems.length) {
                  setItemsWithHistory(prev => [...prev, ...newItems]);
                  setSelectedId(newItems[0].id);
                }
              }}
            />

            {/* ── DEVICE PICKER MODAL ── */}
            <Modal visible={showDevicePicker} transparent animationType="fade" onRequestClose={() => setShowDevicePicker(false)}>
              <Pressable style={styles.overlay} onPress={() => setShowDevicePicker(false)}>
                <Pressable style={styles.modal}>
                  <View style={styles.modalHeader}>
                    <Tv size={18} color={T.accent} />
                    <Text style={styles.modalTitle}>Select Display(s)</Text>
                    <TouchableOpacity onPress={() => setShowDevicePicker(false)}><X size={18} color={T.textMid} /></TouchableOpacity>
                  </View>
                  <ScrollView style={{ maxHeight: 280 }}>
                    {(lut?.deviceList ?? []).map(device => {
                      const active = selectedDevices.some(d => d.deviceId === device.deviceId);
                      return (
                        <TouchableOpacity
                          key={device.deviceId}
                          style={[styles.deviceRow, active && styles.deviceRowActive]}
                          onPress={() => toggleDevice(device)}
                        >
                          <View style={[styles.deviceDot, active && { backgroundColor: T.success }]} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.deviceName}>{device.displayName}</Text>
                            <Text style={styles.deviceSub}>{device.deviceId.slice(0, 12)}…</Text>
                          </View>
                          {active && <CheckCircle size={16} color={T.success} />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  <TouchableOpacity
                    style={[styles.modalSendBtn, (!selectedDevices.length || sending) && { opacity: 0.4 }]}
                    onPress={handleSend}
                    disabled={!selectedDevices.length || sending}
                  >
                    {sending
                      ? <ActivityIndicator size="small" color={T.white} />
                      : <><Send size={14} color={T.white} /><Text style={styles.modalSendText}>Send to {selectedDevices.length || ''} {selectedDevices.length === 1 ? 'device' : 'devices'}</Text></>}
                  </TouchableOpacity>
                </Pressable>
              </Pressable>
            </Modal>

            {/* ── IMAGE DRAWER ── */}
            <Modal
              visible={showImageDrawer}
              transparent
              animationType="slide"
              onRequestClose={() => { setShowImageDrawer(false); setSelectingFor(null); }}
            >
              <View style={styles.drawer}>
                <View style={styles.drawerHandle} />
                <View style={styles.drawerHeader}>
                  <Text style={styles.modalTitle}>{selectingFor ? 'Add to Slot' : 'Image Library'}</Text>
                  <TouchableOpacity onPress={() => { setShowImageDrawer(false); setSelectingFor(null); }}>
                    <X size={18} color={T.textMid} />
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.drawerGrid}>
                    {(lut?.imageList ?? []).map(img => (
                      <TouchableOpacity
                        key={img.imageId}
                        style={styles.drawerCell}
                        onPress={() => addImageToCanvas(img, selectingFor)}
                        activeOpacity={0.7}
                      >
                        <Image
                          source={{ uri: `${lut?.imageUrl || ''}${img.imageurl || img.imageName}` }}
                          style={styles.drawerThumb}
                          resizeMode="contain"
                        />
                        <Text style={styles.drawerThumbId} numberOfLines={1}>#{img.imageId}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {loadingMore && <ActivityIndicator color={T.accent} style={{ marginVertical: 12 }} />}
                </ScrollView>
              </View>
            </Modal>

            {/* ── SUCCESS ── */}
            <Modal visible={successModal} transparent animationType="fade" onRequestClose={() => setSuccessModal(false)}>
              <Pressable style={styles.overlay} onPress={() => setSuccessModal(false)}>
                <View style={styles.successBox}>
                  <CheckCircle size={44} color={T.success} />
                  <Text style={styles.successTitle}>Sent!</Text>
                  <Text style={styles.successSub}>Layout delivered to {selectedDevices.length} device{selectedDevices.length !== 1 ? 's' : ''}.</Text>
                  <TouchableOpacity style={styles.successBtn} onPress={() => setSuccessModal(false)}>
                    <Text style={styles.successBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Modal>

          </View>
        </GestureHandlerRootView>
      </ResponsiveLayout>
    </DraxProvider>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: T.bg },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 13, color: T.textMid },
  body:        { flex: 1, flexDirection: 'row' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: T.accent, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  topBarLeft:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topBarRight:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarTitle:   { fontSize: 15, fontWeight: '700', color: '#fff' },
  topBarDivider: { width: 1, height: 14, backgroundColor: T.border },
  topBarMeta:    { fontSize: 12, color: '#fff' },

  gridBtn: {
    width: 32, height: 32, borderRadius: 6,
    backgroundColor: T.surfaceRaised, borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#8b4300', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  sendBtnText:     { color: T.white, fontWeight: '700', fontSize: 13 },
  birthdayBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: T.accentGhost, borderWidth: 1, borderColor: T.accent + '60',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  birthdayBtnText: { color: T.accent, fontWeight: '700', fontSize: 13 },

  sidebar: {
    width: 220, backgroundColor: T.surface,
    borderRightWidth: 1, borderRightColor: T.border, padding: 12,
  },
  dragHint:     { fontSize: 9, color: T.textDim, marginBottom: 8, fontStyle: 'italic' },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: T.textDim,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10,
  },
  libRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: T.borderLight,
    cursor: 'grab',
  } as any,
  libDragHandle: { paddingRight: 4 },
  libDragIcon:   { fontSize: 14, color: T.textDim, lineHeight: 18 },
  libThumb:      { width: 48, height: 36, borderRadius: 4, backgroundColor: T.surfaceRaised },
  libMeta:       { flex: 1, marginLeft: 8 },
  libName:       { fontSize: 11, color: T.text, fontWeight: '500', lineHeight: 15 },
  libId:         { fontSize: 10, color: T.textDim, marginTop: 2 },
  endText:       { textAlign: 'center', paddingVertical: 12, fontSize: 10, color: T.textDim },

  canvasOuter:        { flex: 1, backgroundColor: T.surfaceRaised },
  canvasScroll:       { flex: 1 },
  canvasScrollContent:{ alignItems: 'center', justifyContent: 'flex-start', paddingVertical: 20, paddingHorizontal: 20, minHeight: '100%' },
  canvasArea:         { alignItems: 'center', justifyContent: 'flex-start', padding: 16, paddingTop: 20 },
  canvas: {
    backgroundColor: '#fefeff',
    borderWidth: 1, borderColor: T.border,
    borderRadius: 4, overflow: 'visible', position: 'relative',
  },
  canvasDragOver:  { borderWidth: 2, borderColor: T.accent, borderStyle: 'dashed' } as any,
  dropOverlay: {
    position: 'absolute', inset: 0,
    backgroundColor: T.accentGhost + 'CC',
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 4, zIndex: 99999,
  },
  dropOverlayText: { fontSize: 18, fontWeight: '700', color: T.accent },
  gridLine:        { position: 'absolute', backgroundColor: 'rgb(241, 241, 241)' },
  emptyCanvas:     { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle:      { fontSize: 15, fontWeight: '700', color: '#6b78b1', marginTop: 8 },
  emptySub:        { fontSize: 12, color: '#6b78b1' },



  itemOuter:     { position: 'absolute' },
  itemInner: {
    flex: 1, borderRadius: 3, overflow: 'hidden',
    backgroundColor: '#f2f5ff', borderWidth: 1, borderColor: T.border,
  },
  itemSelected:  { borderWidth: 2, borderColor: T.selectedBorder },
  emptySlot:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  emptySlotText: { fontSize: 9, color: T.textDim },
  counterBadge: {
    position: 'absolute', top: 5, right: 5,
    backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1,
  },
  counterText: { color: T.white, fontSize: 8, fontWeight: '700' },
  quickAdd: {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: T.accent, borderRadius: 10,
    width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
    elevation: 5, zIndex: 10,
  },
  handleCorner: {
    position: 'absolute', width: 12, height: 12,
    backgroundColor: T.handleBg, borderWidth: 2, borderColor: T.handle,
    borderRadius: 2, zIndex: 20,
  },
  handleEdge: {
    position: 'absolute', width: 16, height: 8,
    backgroundColor: T.handle, borderRadius: 2, zIndex: 20, opacity: 0.8,
  },
  floatBar: {
    position: 'absolute', top: -32, left: 0,
    flexDirection: 'row', gap: 3, zIndex: 30,
  },
  floatBtn: {
    backgroundColor: T.surfaceRaised, borderWidth: 1, borderColor: T.border,
    borderRadius: 5, paddingHorizontal: 7, paddingVertical: 5,
    alignItems: 'center', justifyContent: 'center',
  },
  floatBtnDanger: { borderColor: T.danger + '60' },

  panel:          { width: 220, backgroundColor: T.surface, borderLeftWidth: 1, borderLeftColor: T.border, padding: 12 },
  propSection:    { marginBottom: 16 },
  imgListRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 5, borderRadius: 5, marginBottom: 2 },
  imgListRowActive:{ backgroundColor: T.accentGhost },
  imgListThumb:   { width: 28, height: 20, borderRadius: 2, backgroundColor: T.surfaceRaised },
  imgListId:      { flex: 1, fontSize: 10, color: T.textMid },
  activeDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: T.accent },
  addSlotBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: T.accent + '80', borderRadius: 6,
    borderStyle: 'dashed', paddingVertical: 7, paddingHorizontal: 10, marginTop: 4,
  },
  addSlotText:    { fontSize: 11, color: T.accent, fontWeight: '600' },

  coordGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  coordCell: {
    flex: 1, minWidth: 44, backgroundColor: T.surfaceRaised,
    borderRadius: 5, paddingVertical: 6, alignItems: 'center',
    borderWidth: 1, borderColor: T.border,
  },
  coordLabel: { fontSize: 9, color: T.textDim, fontWeight: '700', textTransform: 'uppercase' },
  coordValue: { fontSize: 12, color: T.accent, fontWeight: '700', marginTop: 1 },
  qRow:       { flexDirection: 'row', gap: 6 },
  qBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: T.accent, borderRadius: 6, paddingVertical: 7,
  },
  qBtnSecondary: { borderColor: T.border },
  qBtnText:      { fontSize: 11, color: T.accent, fontWeight: '600' },

  layerBtns:         { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  layerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: T.accent, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 6, flex: 1,
  },
  layerBtnSecondary: { borderColor: T.border },
  layerBtnText:      { fontSize: 10, color: T.accent, fontWeight: '600' },

  deleteSlotBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: T.dangerBg, borderRadius: 6,
    paddingVertical: 9, paddingHorizontal: 12, marginBottom: 16,
  },
  deleteSlotText:   { fontSize: 12, color: T.danger, fontWeight: '600' },
  nothingSelected:  { alignItems: 'center', paddingVertical: 32, gap: 8 },
  nothingText:      { fontSize: 12, color: T.textDim, textAlign: 'center', lineHeight: 18 },

  layerListSection: { borderTopWidth: 1, borderTopColor: T.border, paddingTop: 12, marginTop: 4 },
  layerListRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 8, borderRadius: 5, marginBottom: 2,
  },
  layerListRowActive: { backgroundColor: T.accentGhost },
  layerZBadge: {
    fontSize: 9, fontWeight: '700', color: T.textDim,
    backgroundColor: T.surfaceRaised, paddingHorizontal: 4, paddingVertical: 1,
    borderRadius: 3, minWidth: 18, textAlign: 'center',
  },
  layerListText: { fontSize: 11, color: T.textMid, flex: 1, fontWeight: '500' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modal: {
    width: '88%', maxWidth: 400, backgroundColor: T.surface,
    borderRadius: 14, padding: 20, borderWidth: 1, borderColor: T.border,
  },
  modalHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  modalTitle:    { flex: 1, fontSize: 15, fontWeight: '700', color: T.text },
  deviceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 10,
    borderRadius: 7, marginBottom: 4, borderWidth: 1, borderColor: T.border,
  },
  deviceRowActive: { borderColor: T.accent, backgroundColor: T.accentGhost },
  deviceDot:       { width: 9, height: 9, borderRadius: 5, backgroundColor: T.border },
  deviceName:      { fontSize: 13, fontWeight: '600', color: T.text },
  deviceSub:       { fontSize: 10, color: T.textMid, marginTop: 1 },
  modalSendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: T.accent, borderRadius: 9, paddingVertical: 12, marginTop: 14,
  },
  modalSendText: { color: T.white, fontWeight: '700', fontSize: 14 },

  drawer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '78%',
    backgroundColor: T.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18,
    padding: 16, borderTopWidth: 1, borderColor: T.border,
  },
  drawerHandle:  { width: 34, height: 4, backgroundColor: T.border, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  drawerHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  drawerGrid:    { flexDirection: 'row', flexWrap: 'wrap' },
  drawerCell:    { width: '33.333%', padding: 5 },
  drawerThumb:   { width: '100%', aspectRatio: 1.6, borderRadius: 6, backgroundColor: T.surfaceRaised },
  drawerThumbId: { fontSize: 9, color: T.textDim, marginTop: 2, textAlign: 'center' },

  successBox: {
    backgroundColor: T.surface, borderRadius: 18, padding: 32,
    alignItems: 'center', gap: 10, maxWidth: 290, width: '90%',
    borderWidth: 1, borderColor: T.border,
  },
  successTitle:   { fontSize: 22, fontWeight: '800', color: T.text },
  successSub:     { fontSize: 13, color: T.textMid, textAlign: 'center', lineHeight: 20 },
  successBtn:     { backgroundColor: T.accent, borderRadius: 9, paddingHorizontal: 32, paddingVertical: 11, marginTop: 6 },
  successBtnText: { color: T.white, fontWeight: '700', fontSize: 14 },
});