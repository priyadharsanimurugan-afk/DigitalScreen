// AdminLayoutStudio.tsx — Web-only version with stable drag/resize

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image, StyleSheet,
  useWindowDimensions, Alert, Modal, ActivityIndicator,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  Monitor, Tv, Trash2, Send, Grid3X3, X, Layers,
  ImageIcon, CheckCircle, ArrowUp, ArrowDown, Plus, MinusCircle,
} from 'lucide-react-native';

import { getContentLUT, sendCanvasContent, ContentLUT, ImageItem, DeviceLUTItem } from '@/services/content';
import ResponsiveLayout from '@/components/responsiveLayout';
import { useLocalSearchParams } from 'expo-router';

// ─── THEME ────────────────────────────────────────────────────────────────────
const C = {
  primary: '#1E3A8A', primaryLight: '#3B5FC0', primaryGhost: '#EEF2FF',
  bg: '#F0F4FF', surface: '#FFFFFF', surfaceAlt: '#F8FAFC',
  text: '#0F172A', textMid: '#334155', textLight: '#64748B',
  border: '#E2E8F0', topBar: '#1E3A8A',
  success: '#059669', danger: '#DC2626', dangerBg: '#FEE2E2',
} as const;

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface SlotImage { id: string; imageId: number; imageurl: string; }
interface CanvasItem {
  id: string; images: SlotImage[]; currentImageIndex: number;
  x: number; y: number; w: number; h: number; zIndex: number;
}

const CANVAS_BASE_W = 1920;
const SNAP = 20;
const snap = (v: number) => Math.round(v / SNAP) * SNAP;
const uid  = () => `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

// ─── CANVAS ITEM ──────────────────────────────────────────────────────────────
const CanvasItemView: React.FC<{
  item: CanvasItem; selected: boolean; scale: number; imageBaseUrl: string;
  onSelect: () => void; onUpdate: (u: Partial<CanvasItem>) => void;
  onDelete: () => void; onAddImage: () => void; onRemoveImage: (id: string) => void;
}> = ({ item, selected, scale, imageBaseUrl, onSelect, onUpdate, onDelete, onAddImage, onRemoveImage }) => {

  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);

  const tx = useSharedValue(item.x * scale);
  const ty = useSharedValue(item.y * scale);
  const sw = useSharedValue(item.w * scale);
  const sh = useSharedValue(item.h * scale);

  useEffect(() => {
    if (!isDraggingRef.current) {
      tx.value = item.x * scale;
      ty.value = item.y * scale;
    }
    if (!isResizingRef.current) {
      sw.value = item.w * scale;
      sh.value = item.h * scale;
    }
  }, [item.x, item.y, item.w, item.h, scale]);

  const startX = useSharedValue(0); const startY = useSharedValue(0);
  const startW = useSharedValue(0); const startH = useSharedValue(0);
  const startTX = useSharedValue(0); const startTY = useSharedValue(0);

  const setDragging = useCallback((v: boolean) => { isDraggingRef.current = v; }, []);
  const setResizing = useCallback((v: boolean) => { isResizingRef.current = v; }, []);

  const pan = Gesture.Pan()
    .minDistance(4)
    .onStart(() => {
      runOnJS(setDragging)(true);
      startX.value = tx.value;
      startY.value = ty.value;
    })
    .onUpdate(e => {
      tx.value = startX.value + e.translationX;
      ty.value = startY.value + e.translationY;
    })
    .onEnd(() => {
      runOnJS(setDragging)(false);
      runOnJS(onUpdate)({
        x: Math.max(0, snap(tx.value / scale)),
        y: Math.max(0, snap(ty.value / scale)),
      });
    });

  const resizeTL = Gesture.Pan()
    .minDistance(4)
    .onStart(() => {
      runOnJS(setResizing)(true);
      startTX.value = tx.value; startTY.value = ty.value;
      startW.value = sw.value; startH.value = sh.value;
    })
    .onUpdate(e => {
      const nw = Math.max(80 * scale, startW.value - e.translationX);
      const nh = Math.max(60 * scale, startH.value - e.translationY);
      tx.value = startTX.value + (startW.value - nw);
      ty.value = startTY.value + (startH.value - nh);
      sw.value = nw; sh.value = nh;
    })
    .onEnd(() => {
      runOnJS(setResizing)(false);
      runOnJS(onUpdate)({
        x: Math.max(0, snap(tx.value / scale)), y: Math.max(0, snap(ty.value / scale)),
        w: Math.max(80, snap(sw.value / scale)), h: Math.max(60, snap(sh.value / scale)),
      });
    });

  const resizeBR = Gesture.Pan()
    .minDistance(4)
    .onStart(() => {
      runOnJS(setResizing)(true);
      startW.value = sw.value;
      startH.value = sh.value;
    })
    .onUpdate(e => {
      sw.value = Math.max(80 * scale, startW.value + e.translationX);
      sh.value = Math.max(60 * scale, startH.value + e.translationY);
    })
    .onEnd(() => {
      runOnJS(setResizing)(false);
      runOnJS(onUpdate)({
        w: Math.max(80, snap(sw.value / scale)),
        h: Math.max(60, snap(sh.value / scale)),
      });
    });

  const posStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
    zIndex: selected ? 999 : item.zIndex,
  }));

  const sizeStyle = useAnimatedStyle(() => ({
    width: sw.value,
    height: sh.value,
  }));

  const H = 14;
  const current = item.images[item.currentImageIndex];

  return (
    <Animated.View style={[s.canvasItemOuter, posStyle]}>
      <Animated.View style={[s.canvasItem, sizeStyle, selected && s.canvasItemSelected]}>

        <GestureDetector gesture={pan}>
          <Pressable onPress={onSelect} style={StyleSheet.absoluteFill}>
            {current && (
              <Image
                source={{ uri: `${imageBaseUrl}${current.imageurl}` }}
                style={StyleSheet.absoluteFill}
                resizeMode="contain"
              />
            )}
            {selected && (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(30,58,138,0.07)' }]} pointerEvents="none" />
            )}
            {item.images.length > 1 && (
              <View style={s.imgCounter} pointerEvents="none">
                <Text style={s.imgCounterText}>{item.currentImageIndex + 1}/{item.images.length}</Text>
              </View>
            )}
            <TouchableOpacity
              style={s.addImgBtn}
              onPress={e => { e.stopPropagation(); onAddImage(); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Plus size={13} color="#fff" />
            </TouchableOpacity>
          </Pressable>
        </GestureDetector>

        {selected && (
          <>
            {[
              { g: resizeTL, pos: { top: -H / 2, left: -H / 2 } },
              { g: resizeTL, pos: { top: -H / 2, right: -H / 2 } },
              { g: resizeBR, pos: { bottom: -H / 2, left: -H / 2 } },
              { g: resizeBR, pos: { bottom: -H / 2, right: -H / 2 } },
            ].map((h, i) => (
              <GestureDetector key={i} gesture={h.g}>
                <View style={[s.rHandle, h.pos]} hitSlop={{ top: 12, left: 12, right: 12, bottom: 12 }} />
              </GestureDetector>
            ))}

            <TouchableOpacity style={s.deleteFloat} onPress={onDelete}
              hitSlop={{ top: 8, left: 8, right: 8, bottom: 8 }}>
              <Trash2 size={11} color="#fca5a5" />
            </TouchableOpacity>

            {item.images.length > 1 && (
              <>
                <View style={s.cycleControls}>
                  <TouchableOpacity style={s.cycleBtn} onPress={() =>
                    onUpdate({ currentImageIndex: item.currentImageIndex > 0 ? item.currentImageIndex - 1 : item.images.length - 1 })}>
                    <Text style={s.cycleBtnText}>◀</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.cycleBtn} onPress={() =>
                    onUpdate({ currentImageIndex: (item.currentImageIndex + 1) % item.images.length })}>
                    <Text style={s.cycleBtnText}>▶</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={s.removeImgBtn}
                  onPress={() => onRemoveImage(item.images[item.currentImageIndex].id)}>
                  <MinusCircle size={12} color={C.danger} />
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </Animated.View>
    </Animated.View>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AdminLayoutStudio() {
  const { width: sw } = useWindowDimensions();

  const SIDEBAR = 240;
  const PANEL   = 230;
  const canvasW = Math.min(sw - SIDEBAR - PANEL - 48, 1100);
  const canvasH = canvasW * (9 / 16);
  const scale   = canvasW / CANVAS_BASE_W;

  const [lut, setLut]                 = useState<ContentLUT | null>(null);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]         = useState(true);
  const [items, setItems]             = useState<CanvasItem[]>([]);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [sending, setSending]         = useState(false);
  const [showGrid, setShowGrid]       = useState(true);
  const [showDevicePicker, setShowDevicePicker] = useState(false);
  const [showImageDrawer, setShowImageDrawer]   = useState(false);
  const [successModal, setSuccessModal]         = useState(false);
  const [selectingFor, setSelectingFor]         = useState<string | null>(null);


  const params = useLocalSearchParams();

const isEditMode = params.editMode === "true";
const editItems = React.useMemo(() => {
  try {
    return params.items ? JSON.parse(params.items as string) : [];
  } catch {
    return [];
  }
}, [params.items]);

const editTitle = params.title as string;
const editDeviceId = params.deviceId as string;
const editContentId = Number(params.contentId);
const editScreenWidth = Number(params.screenWidth || 1920);
const editScreenHeight = Number(params.screenHeight || 1080);

  useEffect(() => { loadImages(1, true); }, []);

  const loadImages = async (pageNum: number, reset = false) => {
    if (loadingMore && !reset) return;
    setLoadingMore(true);
    try {
      const result = await getContentLUT(pageNum, 20);
      setLut(prev => reset || !prev ? result : { ...result, imageList: [...prev.imageList, ...result.imageList] });
      setPage(pageNum);
      setHasMore(result.pagination ? pageNum < result.pagination.totalPages : false);
    } catch { Alert.alert('Error', 'Failed to load content library'); }
    finally { setLoadingMore(false); if (reset) setLoading(false); }
  };
 const [selectedDevices, setSelectedDevices] = useState<DeviceLUTItem[]>([]);



// Also update your existing edit mode useEffect (around line 260-300) 
// to include the device selection after LUT loads
useEffect(() => {
  if (
    !isEditMode ||
    !editItems?.length ||
    !lut?.deviceList?.length ||
    items.length > 0
  ) return;

  const groupedMap: Record<string, CanvasItem> = {};

  editItems.forEach((apiItem: any, index: number) => {
    const key = `slot_${apiItem.slotIndex}`;

    const newImg: SlotImage = {
      id: `img_${apiItem.imageId}_${index}`,
      imageId: apiItem.imageId,
      imageurl: apiItem.imageUrl || apiItem.imageurl || "",
    };

    if (!groupedMap[key]) {
      groupedMap[key] = {
        id: key,
        images: [newImg],
        currentImageIndex: 0,
        x: apiItem.x || 0,
        y: apiItem.y || 0,
        w: apiItem.width || 400,
        h: apiItem.height || 250,
        zIndex: apiItem.zIndex || index + 1,
      };
    } else {
      groupedMap[key].images.push(newImg);
    }
  });

  const finalItems = Object.values(groupedMap);

  setItems(finalItems);

  if (finalItems.length > 0) {
    setSelectedId(finalItems[0].id);
  }

  const deviceToSelect = lut.deviceList.find(
    device => device.deviceId === editDeviceId
  );

  if (deviceToSelect) {
    setSelectedDevices([deviceToSelect]);
  }
}, [
  isEditMode,
  editItems,
  editDeviceId,
  lut?.deviceList,
  items.length,
]);


  const addImageToCanvas = (img: ImageItem, targetId?: string) => {
    const newImg: SlotImage = {
      id: `img_${uid()}`,
      imageId: img.imageId,
      imageurl: img.imageurl || img.imageName,
    };
    if (targetId) {
      setItems(prev => prev.map(it =>
        it.id === targetId ? { ...it, images: [...it.images, newImg] } : it
      ));
      setSelectingFor(null);
      setShowImageDrawer(false);
    } else {
      const count = items.length;
      const w = snap(CANVAS_BASE_W / 3);
      const h = snap(w * 9 / 16);
      const newItem: CanvasItem = {
        id: `item_${uid()}`,
        images: [newImg],
        currentImageIndex: 0,
        x: snap((count % 2) * (w + SNAP * 3) + SNAP * 2),
        y: snap(Math.floor(count / 2) * (h + SNAP * 3) + SNAP * 2),
        w, h,
        zIndex: count + 1,
      };
      setItems(prev => [...prev, newItem]);
      setSelectedId(newItem.id);
      setShowImageDrawer(false);
    }
  };

  const updateItem = (id: string, u: Partial<CanvasItem>) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...u } : i));

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const moveLayer = (id: string, dir: 'up' | 'down') => {
    const maxZ = Math.max(...items.map(i => i.zIndex));
    const minZ = Math.min(...items.map(i => i.zIndex));
    updateItem(id, { zIndex: dir === 'up' ? maxZ + 1 : Math.max(0, minZ - 1) });
  };

  const removeImage = (itemId: string, imgId: string) =>
    setItems(prev => prev.map(it => {
      if (it.id !== itemId) return it;
      const imgs = it.images.filter(i => i.id !== imgId);
      if (!imgs.length) return it;
      return { ...it, images: imgs, currentImageIndex: Math.min(it.currentImageIndex, imgs.length - 1) };
    }));

  const toggleDevice = (device: DeviceLUTItem) =>
    setSelectedDevices(prev =>
      prev.some(d => d.deviceId === device.deviceId)
        ? prev.filter(d => d.deviceId !== device.deviceId)
        : [...prev, device]
    );

  const handleSend = async () => {
    if (!selectedDevices.length) { Alert.alert('No device', 'Select at least one TV.'); return; }
    if (!items.length) { Alert.alert('No content', 'Add at least one image.'); return; }
    setSending(true);
    try {
      const sendItems = items.flatMap((item, ii) =>
        item.images.map((img, ji) => ({
          slotIndex: ii, imageIndex: ji,
          imageId: img.imageId, imageurl: img.imageurl,
          x: item.x, y: item.y, width: item.w, height: item.h,
          pinned: true, zIndex: item.zIndex, resizeMode: 'cover',
        }))
      );
      await Promise.all(selectedDevices.map(device =>
        sendCanvasContent({
          title: `Layout_${Date.now()}`,
          description: `${items.length} slot(s), ${sendItems.length} image(s)`,
          deviceId: device.deviceId,
          screenWidth: CANVAS_BASE_W,
          screenHeight: Math.round(CANVAS_BASE_W * 9 / 16),
          screenLayout: `${items.length}`,
          items: sendItems,
        })
      ));
      setShowDevicePicker(false);
      setSuccessModal(true);
    } catch { Alert.alert('Error', 'Failed to send content.'); }
    finally { setSending(false); }
  };

  const selectedItem = items.find(i => i.id === selectedId);

  return (
    <ResponsiveLayout>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={s.root}>

          {/* ── BLUE TOP BAR ── */}
          <View style={s.topBar}>
            <View style={s.topBarLeft}>
              <Monitor size={18} color="#fff" />
              <Text style={s.topBarTitle}>Layout Studio</Text>
            </View>
            <TouchableOpacity
              style={s.sendBtn}
              onPress={() => setShowDevicePicker(true)}
              disabled={sending || loading}
            >
              {sending
                ? <ActivityIndicator size="small" color="#fff" />
                : <><Send size={14} color="#fff" /><Text style={s.sendBtnText}>Send to TV</Text></>}
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={s.center}>
              <ActivityIndicator size="large" color={C.primary} />
              <Text style={s.label}>Loading library…</Text>
            </View>
          ) : (
            <View style={s.body}>

              {/* ── LEFT SIDEBAR ── */}
              <View style={s.sidebar}>
                <Text style={s.sectionTitle}>Image Library</Text>
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}
                  onScroll={({ nativeEvent: n }) => {
                    if (n.layoutMeasurement.height + n.contentOffset.y >= n.contentSize.height - 200 && hasMore && !loadingMore)
                      loadImages(page + 1, false);
                  }}>
                  {(lut?.imageList ?? []).map(img => (
                    <TouchableOpacity key={img.imageId} style={s.imgRow}
                      onPress={() => addImageToCanvas(img)} activeOpacity={0.7}>
                      <Image
                        source={{ uri: `${lut?.imageUrl || ''}${img.imageurl || img.imageName}` }}
                        style={s.imgThumb} resizeMode="contain"
                      />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={s.imgName} numberOfLines={2}>{img.imageName}</Text>
                        <Text style={s.imgId}>ID {img.imageId}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {loadingMore && <ActivityIndicator color={C.primary} style={{ marginVertical: 12 }} />}
                  {!hasMore && !!lut?.imageList?.length && <Text style={s.endText}>End of library</Text>}
                </ScrollView>
                <TouchableOpacity style={s.gridToggle} onPress={() => setShowGrid(g => !g)}>
                  <Grid3X3 size={14} color={showGrid ? C.primary : C.textLight} />
                  <Text style={[s.gridToggleText, showGrid && { color: C.primary }]}>
                    {showGrid ? 'Grid ON' : 'Grid OFF'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ── CANVAS ── */}
              <View style={s.canvasArea}>
                <View style={s.infoBar}>
                  <Text style={s.infoText}>{items.length} slot{items.length !== 1 ? 's' : ''}</Text>
                  {selectedItem && (
                    <Text style={s.infoText}>
                      X:{selectedItem.x} Y:{selectedItem.y} W:{selectedItem.w} H:{selectedItem.h}
                    </Text>
                  )}
                </View>

                <Pressable
                  style={[s.canvas, { width: canvasW, height: canvasH }]}
                  onPress={() => setSelectedId(null)}
                >
                  {showGrid && (
                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                      {Array.from({ length: Math.floor(canvasH / (SNAP * scale)) + 1 }).map((_, i) =>
                        <View key={`h${i}`} style={[s.gridLine, { top: i * SNAP * scale, width: '100%', height: 1 }]} />
                      )}
                      {Array.from({ length: Math.floor(canvasW / (SNAP * scale)) + 1 }).map((_, i) =>
                        <View key={`v${i}`} style={[s.gridLine, { left: i * SNAP * scale, height: '100%', width: 1 }]} />
                      )}
                    </View>
                  )}

                  {!items.length && (
                    <View style={s.emptyCanvas}>
                      <Grid3X3 size={40} color={C.border} />
                      <Text style={s.emptyTitle}>Canvas is empty</Text>
                      <Text style={s.emptySub}>Pick images from the library</Text>
                    </View>
                  )}

                  {[...items].sort((a, b) => a.zIndex - b.zIndex).map(item => (
                    <CanvasItemView
                      key={item.id}
                      item={item}
                      selected={selectedId === item.id}
                      scale={scale}
                      imageBaseUrl={lut?.imageUrl || ''}
                      onSelect={() => setSelectedId(item.id)}
                      onUpdate={u => updateItem(item.id, u)}
                      onDelete={() => deleteItem(item.id)}
                      onAddImage={() => { setSelectingFor(item.id); setShowImageDrawer(true); }}
                      onRemoveImage={imgId => removeImage(item.id, imgId)}
                    />
                  ))}
                </Pressable>
              </View>

              {/* ── RIGHT PANEL ── */}
              <View style={s.panel}>
                <Text style={s.sectionTitle}>Properties</Text>
                {selectedItem ? (
                  <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                    <View style={s.propGroup}>
                      <Text style={s.propLabel}>Images in Slot</Text>
                      {selectedItem.images.map((img, idx) => (
                        <View key={img.id}
                          style={[s.imgListItem, idx === selectedItem.currentImageIndex && { backgroundColor: C.primaryGhost }]}>
                          <Image
                            source={{ uri: `${lut?.imageUrl || ''}${img.imageurl}` }}
                            style={s.imgListThumb} resizeMode="contain"
                          />
                          <Text style={s.imgListName} numberOfLines={1}>#{img.imageId}</Text>
                          {selectedItem.images.length > 1 && (
                            <TouchableOpacity onPress={() => removeImage(selectedItem.id, img.id)} style={{ padding: 4 }}>
                              <MinusCircle size={12} color={C.danger} />
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                      <TouchableOpacity style={s.addToSlotBtn}
                        onPress={() => { setSelectingFor(selectedItem.id); setShowImageDrawer(true); }}>
                        <Plus size={14} color={C.primary} />
                        <Text style={s.addToSlotText}>Add image to slot</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={s.propGroup}>
                      <Text style={s.propLabel}>Position</Text>
                      <View style={s.row}>
                        {(['x', 'y'] as const).map(k => (
                          <View key={k} style={s.coordBox}>
                            <Text style={s.coordLbl}>{k.toUpperCase()}</Text>
                            <Text style={s.coordVal}>{selectedItem[k]}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    <View style={s.propGroup}>
                      <Text style={s.propLabel}>Size</Text>
                      <View style={s.row}>
                        {(['w', 'h'] as const).map(k => (
                          <View key={k} style={s.coordBox}>
                            <Text style={s.coordLbl}>{k.toUpperCase()}</Text>
                            <Text style={s.coordVal}>{selectedItem[k]}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    <View style={s.propGroup}>
                      <Text style={s.propLabel}>Quick Resize</Text>
                      <View style={s.row}>
                        <TouchableOpacity style={s.qBtn}
                          onPress={() => updateItem(selectedItem.id, { w: selectedItem.w + 120, h: selectedItem.h + 68 })}>
                          <Text style={s.qBtnText}>+ Larger</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.qBtn, { borderColor: C.border }]}
                          onPress={() => updateItem(selectedItem.id, { w: Math.max(80, selectedItem.w - 120), h: Math.max(60, selectedItem.h - 68) })}>
                          <Text style={[s.qBtnText, { color: C.textLight }]}>− Smaller</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={s.propGroup}>
                      <Text style={s.propLabel}>Layer</Text>
                      <View style={s.row}>
                        <TouchableOpacity style={s.qBtn} onPress={() => moveLayer(selectedItem.id, 'up')}>
                          <ArrowUp size={12} color={C.primary} />
                          <Text style={s.qBtnText}>Front</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.qBtn, { borderColor: C.border }]} onPress={() => moveLayer(selectedItem.id, 'down')}>
                          <ArrowDown size={12} color={C.textLight} />
                          <Text style={[s.qBtnText, { color: C.textLight }]}>Back</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <TouchableOpacity style={s.deleteBtn} onPress={() => deleteItem(selectedItem.id)}>
                      <Trash2 size={14} color={C.danger} />
                      <Text style={s.deleteBtnText}>Remove slot</Text>
                    </TouchableOpacity>
                  </ScrollView>
                ) : (
                  <View style={s.nothingSelected}>
                    <Layers size={28} color={C.border} />
                    <Text style={s.nothingText}>Select an element{'\n'}to edit properties</Text>
                  </View>
                )}

                <View style={s.layerList}>
                  <Text style={s.sectionTitle}>Layers ({items.length})</Text>
                  {[...items].reverse().map(it => (
                    <TouchableOpacity key={it.id}
                      style={[s.layerRow, selectedId === it.id && { backgroundColor: C.primaryGhost }]}
                      onPress={() => setSelectedId(it.id)}>
                      <ImageIcon size={12} color={selectedId === it.id ? C.primary : C.textLight} />
                      <Text style={[s.layerText, selectedId === it.id && { color: C.primary }]} numberOfLines={1}>
                        Slot {it.images.length} img(s)
                      </Text>
                      <TouchableOpacity onPress={() => deleteItem(it.id)} style={{ marginLeft: 'auto', padding: 4 }}>
                        <Trash2 size={10} color={C.danger} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* ── DEVICE PICKER MODAL ── */}
          <Modal visible={showDevicePicker} transparent animationType="fade"
            onRequestClose={() => setShowDevicePicker(false)}>
            <Pressable style={s.overlay} onPress={() => setShowDevicePicker(false)}>
              <Pressable style={s.modal}>
                <View style={s.modalHeader}>
                  <Tv size={20} color={C.primary} />
                  <Text style={s.modalTitle}>Select TV Device(s)</Text>
                  <TouchableOpacity onPress={() => setShowDevicePicker(false)}>
                    <X size={20} color={C.textLight} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ maxHeight: 300 }}>
                  {(lut?.deviceList ?? []).map(device => {
                    const active = selectedDevices.some(d => d.deviceId === device.deviceId);
                    return (
                      <TouchableOpacity key={device.deviceId}
                        style={[s.deviceRow, active && s.deviceRowActive]}
                        onPress={() => toggleDevice(device)}>
                        <View style={[s.deviceDot, active && { backgroundColor: C.success }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.deviceName}>{device.displayName}</Text>
                          <Text style={s.deviceSub}>{device.deviceName} · {device.deviceId.slice(0, 8)}…</Text>
                        </View>
                        {active && <CheckCircle size={18} color={C.success} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity
                  style={[s.modalSendBtn, (!selectedDevices.length || sending) && { opacity: 0.5 }]}
                  onPress={handleSend}
                  disabled={!selectedDevices.length || sending}>
                  {sending
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <>
                        <Send size={15} color="#fff" />
                        <Text style={s.modalSendText}>
                          Send to {selectedDevices.length || ''} {selectedDevices.length === 1 ? 'device' : 'devices'}
                        </Text>
                      </>}
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
            <View style={s.drawer}>
              <View style={s.drawerHandle} />
              <View style={s.drawerHeader}>
                <Text style={s.modalTitle}>
                  {selectingFor ? 'Add Image to Slot' : 'Image Library'}
                </Text>
                <TouchableOpacity onPress={() => { setShowImageDrawer(false); setSelectingFor(null); }}>
                  <X size={20} color={C.textLight} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {(lut?.imageList ?? []).map(img => (
                    <TouchableOpacity
                      key={img.imageId}
                      style={s.drawerImgCell}
                      onPress={() => addImageToCanvas(img, selectingFor ?? undefined)}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={{ uri: `${lut?.imageUrl || ''}${img.imageurl || img.imageName}` }}
                        style={s.drawerImgThumb}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                {loadingMore && <ActivityIndicator color={C.primary} style={{ marginVertical: 12 }} />}
              </ScrollView>
            </View>
          </Modal>

          {/* ── SUCCESS MODAL ── */}
          <Modal visible={successModal} transparent animationType="fade"
            onRequestClose={() => setSuccessModal(false)}>
            <Pressable style={s.overlay} onPress={() => setSuccessModal(false)}>
              <View style={s.successBox}>
                <CheckCircle size={48} color={C.success} />
                <Text style={s.successTitle}>Sent!</Text>
                <Text style={s.successSub}>
                  Content sent to {selectedDevices.length} device{selectedDevices.length !== 1 ? 's' : ''}
                </Text>
                <TouchableOpacity style={s.successBtn} onPress={() => setSuccessModal(false)}>
                  <Text style={s.successBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>

        </View>
      </GestureHandlerRootView>
    </ResponsiveLayout>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, color: C.textLight, marginTop: 12 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: C.topBar,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  sendBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#ffffff25', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: '#ffffff50',
  },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  body: { flex: 1, flexDirection: 'row' },

  sidebar: { width: 240, backgroundColor: C.surface, borderRightWidth: 1, borderRightColor: C.border, padding: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: C.textLight, letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase' },
  imgRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  imgThumb: { width: 60, height: 44, borderRadius: 4, backgroundColor: C.surfaceAlt },
  imgName: { fontSize: 11, color: C.text, fontWeight: '500' },
  imgId: { fontSize: 10, color: C.textLight, marginTop: 2 },
  gridToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, marginTop: 8, borderTopWidth: 1, borderTopColor: C.border },
  gridToggleText: { fontSize: 12, color: C.textLight },
  endText: { textAlign: 'center', paddingVertical: 12, fontSize: 11, color: C.textLight },

  canvasArea: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', padding: 16 },
  infoBar: { flexDirection: 'row', gap: 16, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' },
  infoText: { fontSize: 11, color: C.textLight, fontWeight: '500' },

  canvas: { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: C.border, borderRadius: 4, overflow: 'visible', position: 'relative' },
  gridLine: { position: 'absolute', backgroundColor: '#E2E8F040' },
  emptyCanvas: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: C.border, marginTop: 8 },
  emptySub: { fontSize: 12, color: C.border },

  canvasItemOuter: {
    position: 'absolute',
  },
  canvasItem: {
    borderRadius: 3,
    overflow: 'hidden',
  },
  canvasItemSelected: { borderWidth: 2, borderColor: C.primary },

  imgCounter: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  imgCounterText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  addImgBtn: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: C.primary, borderRadius: 12,
    width: 28, height: 28,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, zIndex: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  rHandle: { position: 'absolute', width: 14, height: 14, backgroundColor: C.surface, borderWidth: 2.5, borderColor: C.primary, borderRadius: 3, zIndex: 10 },
  deleteFloat: { position: 'absolute', top: -26, right: -2, backgroundColor: '#7f1d1d', borderRadius: 6, padding: 5, zIndex: 20 },
  cycleControls: { position: 'absolute', top: '50%', left: -16, right: -16, flexDirection: 'row', justifyContent: 'space-between', marginTop: -15 },
  cycleBtn: { backgroundColor: C.primary, borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', elevation: 3 },
  cycleBtnText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  removeImgBtn: { position: 'absolute', top: -12, left: -12, backgroundColor: C.surface, borderRadius: 10, padding: 2, elevation: 3 },

  panel: { width: 230, backgroundColor: C.surface, borderLeftWidth: 1, borderLeftColor: C.border, padding: 12 },
  propGroup: { marginBottom: 14 },
  propLabel: { fontSize: 10, fontWeight: '700', color: C.textLight, letterSpacing: 0.8, marginBottom: 5, textTransform: 'uppercase' },
  row: { flexDirection: 'row', gap: 8 },
  coordBox: { flex: 1, backgroundColor: C.surfaceAlt, borderRadius: 6, padding: 8, alignItems: 'center' },
  coordLbl: { fontSize: 10, color: C.textLight, fontWeight: '700' },
  coordVal: { fontSize: 13, color: C.primary, fontWeight: '700' },
  qBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: C.primary, borderRadius: 6, paddingVertical: 8 },
  qBtnText: { fontSize: 11, color: C.primary, fontWeight: '600' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.dangerBg, borderRadius: 6, padding: 10, marginTop: 4 },
  deleteBtnText: { fontSize: 12, color: C.danger, fontWeight: '600' },
  nothingSelected: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  nothingText: { fontSize: 12, color: C.border, textAlign: 'center', lineHeight: 18 },
  layerList: { borderTopWidth: 1, borderTopColor: C.border, paddingTop: 10, marginTop: 8 },
  layerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6, marginBottom: 2 },
  layerText: { fontSize: 11, color: C.textLight, fontWeight: '500', flex: 1 },
  imgListItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 6, borderRadius: 4, marginBottom: 2 },
  imgListThumb: { width: 24, height: 18, borderRadius: 2, backgroundColor: C.surfaceAlt },
  imgListName: { flex: 1, fontSize: 10, color: C.textLight },
  addToSlotBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.primary, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 10, marginTop: 4, borderStyle: 'dashed' },
  addToSlotText: { fontSize: 11, color: C.primary, fontWeight: '600' },

  overlay: { flex: 1, backgroundColor: '#0F172A90', justifyContent: 'center', alignItems: 'center' },
  modal: { width: '90%', maxWidth: 420, backgroundColor: C.surface, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  modalTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: C.text },
  deviceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8, marginBottom: 4, borderWidth: 1, borderColor: C.border },
  deviceRowActive: { borderColor: C.primary, backgroundColor: C.primaryGhost },
  deviceDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.border },
  deviceName: { fontSize: 14, fontWeight: '600', color: C.text },
  deviceSub: { fontSize: 11, color: C.textLight, marginTop: 2 },
  modalSendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 10, paddingVertical: 12, marginTop: 16 },
  modalSendText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  drawer: { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '75%', backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 },
  drawerHandle: { width: 36, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  drawerImgCell: { width: '33.333%', aspectRatio: 1, padding: 4 },
  drawerImgThumb: { flex: 1, borderRadius: 8, backgroundColor: C.surfaceAlt },

  successBox: { backgroundColor: C.surface, borderRadius: 20, padding: 32, alignItems: 'center', gap: 12, maxWidth: 300, width: '90%' },
  successTitle: { fontSize: 22, fontWeight: '800', color: C.text },
  successSub: { fontSize: 14, color: C.textLight, textAlign: 'center', lineHeight: 20 },
  successBtn: { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 32, paddingVertical: 12, marginTop: 8 },
  successBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});