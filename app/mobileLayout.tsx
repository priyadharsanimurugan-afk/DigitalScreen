// AdminLayoutStudio.mobile.tsx
// Mobile-only version — zero gesture handling, control-based editing only

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Image, StyleSheet,
  useWindowDimensions, Alert, Modal, ActivityIndicator,
  FlatList, Pressable, ScrollView,
} from 'react-native';
import {
  Monitor, Tv, Trash2, Send, Grid3X3, X,
  ImageIcon, CheckCircle, Plus, MinusCircle,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  PlusCircle, Minus,
} from 'lucide-react-native';

import { getContentLUT, sendCanvasContent, ContentLUT, ImageItem, DeviceLUTItem } from '@/services/content';
import ResponsiveLayout from '@/components/responsiveLayout';
import { useLocalSearchParams } from 'expo-router';

// ─── THEME ────────────────────────────────────────────────────────────────────
const C = {
  primary: '#1E3A8A',
  primaryGhost: '#EEF2FF',
  bg: '#F0F4FF',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  text: '#0F172A',
  textLight: '#64748B',
  border: '#E2E8F0',
  topBar: '#1E3A8A',
  success: '#059669',
  danger: '#DC2626',
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
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

// ─── CANVAS ITEM (MOBILE - CONTROL BASED) ────────────────────────────────────
const CanvasItemMobile: React.FC<{
  item: CanvasItem;
  selected: boolean;
  scale: number;
  imageBaseUrl: string;
  onSelect: () => void;
  onMove: (dx: number, dy: number) => void;
  onResize: (dw: number, dh: number) => void;
  onDelete: () => void;
  onAddImage: () => void;
  onRemoveImage: (id: string) => void;
  onPrevImage: () => void;
  onNextImage: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
}> = ({ 
  item, selected, scale, imageBaseUrl, onSelect, onMove, onResize, 
  onDelete, onAddImage, onRemoveImage, onPrevImage, onNextImage,
  onBringForward, onSendBackward 
}) => {
  const current = item.images[item.currentImageIndex];

  return (
    <View style={[ms.itemContainer, selected && ms.itemContainerSelected]}>
      {/* Canvas preview */}
      <TouchableOpacity 
        style={[ms.itemPreview, { 
          width: item.w * scale, 
          height: item.h * scale,
          aspectRatio: item.w / item.h 
        }]} 
        onPress={onSelect}
        activeOpacity={0.8}
      >
        {current && (
          <Image
            source={{ uri: `${imageBaseUrl}${current.imageurl}` }}
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
          />
        )}
        {selected && (
          <View style={[StyleSheet.absoluteFill, ms.selectedOverlay]} pointerEvents="none" />
        )}
        {item.images.length > 1 && (
          <View style={ms.counter} pointerEvents="none">
            <Text style={ms.counterTxt}>{item.currentImageIndex + 1}/{item.images.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Controls for selected item */}
      {selected && (
        <View style={ms.controls}>
          {/* Position Info */}
          <View style={ms.infoRow}>
            <Text style={ms.infoText}>X: {item.x} | Y: {item.y} | W: {item.w} | H: {item.h}</Text>
          </View>

          {/* Movement Controls */}
          <View style={ms.controlGroup}>
            <Text style={ms.controlLabel}>Move</Text>
            <View style={ms.arrowGrid}>
              <View style={ms.arrowRow}>
                <View style={ms.arrowSpacer} />
                <TouchableOpacity style={ms.arrowBtn} onPress={() => onMove(0, -SNAP)}>
                  <ChevronUp size={20} color={C.primary} />
                </TouchableOpacity>
                <View style={ms.arrowSpacer} />
              </View>
              <View style={ms.arrowRow}>
                <TouchableOpacity style={ms.arrowBtn} onPress={() => onMove(-SNAP, 0)}>
                  <ChevronLeft size={20} color={C.primary} />
                </TouchableOpacity>
                <View style={ms.arrowCenter}>
                  <Text style={ms.arrowCenterText}>{'▲\n◄ ►\n▼'}</Text>
                </View>
                <TouchableOpacity style={ms.arrowBtn} onPress={() => onMove(SNAP, 0)}>
                  <ChevronRight size={20} color={C.primary} />
                </TouchableOpacity>
              </View>
              <View style={ms.arrowRow}>
                <View style={ms.arrowSpacer} />
                <TouchableOpacity style={ms.arrowBtn} onPress={() => onMove(0, SNAP)}>
                  <ChevronDown size={20} color={C.primary} />
                </TouchableOpacity>
                <View style={ms.arrowSpacer} />
              </View>
            </View>
          </View>

          {/* Size Controls */}
          <View style={ms.controlGroup}>
            <Text style={ms.controlLabel}>Resize</Text>
            <View style={ms.sizeRow}>
              <View style={ms.sizeControl}>
                <Text style={ms.sizeLabel}>Width</Text>
                <View style={ms.sizeBtnRow}>
                  <TouchableOpacity style={ms.sizeBtn} onPress={() => onResize(-SNAP, 0)}>
                    <Minus size={16} color={C.primary} />
                  </TouchableOpacity>
                  <Text style={ms.sizeValue}>{item.w}</Text>
                  <TouchableOpacity style={ms.sizeBtn} onPress={() => onResize(SNAP, 0)}>
                    <PlusCircle size={16} color={C.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={ms.sizeControl}>
                <Text style={ms.sizeLabel}>Height</Text>
                <View style={ms.sizeBtnRow}>
                  <TouchableOpacity style={ms.sizeBtn} onPress={() => onResize(0, -SNAP)}>
                    <Minus size={16} color={C.primary} />
                  </TouchableOpacity>
                  <Text style={ms.sizeValue}>{item.h}</Text>
                  <TouchableOpacity style={ms.sizeBtn} onPress={() => onResize(0, SNAP)}>
                    <PlusCircle size={16} color={C.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* Image Controls */}
          <View style={ms.controlGroup}>
            <Text style={ms.controlLabel}>Images ({item.images.length})</Text>
            <View style={ms.imageControls}>
              {item.images.length > 1 && (
                <View style={ms.navRow}>
                  <TouchableOpacity style={ms.navBtn} onPress={onPrevImage}>
                    <ChevronLeft size={16} color="#fff" />
                  </TouchableOpacity>
                  <Text style={ms.navText}>{item.currentImageIndex + 1}/{item.images.length}</Text>
                  <TouchableOpacity style={ms.navBtn} onPress={onNextImage}>
                    <ChevronRight size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
              <View style={ms.imageActionRow}>
                <TouchableOpacity style={ms.imageActionBtn} onPress={onAddImage}>
                  <Plus size={14} color={C.primary} />
                  <Text style={ms.imageActionText}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[ms.imageActionBtn, ms.imageActionBtnDanger]} 
                  onPress={() => onRemoveImage(item.images[item.currentImageIndex].id)}
                >
                  <MinusCircle size={14} color={C.danger} />
                  <Text style={[ms.imageActionText, { color: C.danger }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Z-Index Controls */}
          <View style={ms.controlGroup}>
            <Text style={ms.controlLabel}>Layer Order</Text>
            <View style={ms.zIndexRow}>
              <TouchableOpacity style={ms.zIndexBtn} onPress={onSendBackward}>
                <Text style={ms.zIndexBtnText}>Send Backward</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ms.zIndexBtn} onPress={onBringForward}>
                <Text style={ms.zIndexBtnText}>Bring Forward</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Delete */}
          <TouchableOpacity style={ms.deleteBtn} onPress={onDelete}>
            <Trash2 size={16} color="#fff" />
            <Text style={ms.deleteBtnText}>Delete Slot</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ─── MAIN MOBILE SCREEN ───────────────────────────────────────────────────────
export default function AdminLayoutStudioMobile() {
  const { width: screenW } = useWindowDimensions();

  const canvasW = screenW - 32;
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
  const [selectedDevices, setSelectedDevices]   = useState<DeviceLUTItem[]>([]);

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
  

  useEffect(() => { 
    loadImages(1, true); 
  }, []);

  const loadImages = async (pageNum: number, reset = false) => {
    if (loadingMore && !reset) return;
    setLoadingMore(true);
    try {
      const result = await getContentLUT(pageNum, 20);
      setLut(prev => reset || !prev ? result : { ...result, imageList: [...prev.imageList, ...result.imageList] });
      setPage(pageNum);
      setHasMore(result.pagination ? pageNum < result.pagination.totalPages : false);
    } catch { 
      Alert.alert('Error', 'Failed to load content library'); 
    } finally { 
      setLoadingMore(false); 
      if (reset) setLoading(false); 
    }
  };

  // FIXED: Single useEffect for edit mode initialization
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


  // FIXED: Separate useEffect for pre-selecting devices after LUT loads
  useEffect(() => {
    if (isEditMode && editDeviceId && lut?.deviceList && items.length === 0) {
      const deviceToSelect = lut.deviceList.find(
        device => device.deviceId === editDeviceId
      );
      
      if (deviceToSelect && selectedDevices.length === 0) {
        setSelectedDevices([deviceToSelect]);
      }
    }
  }, [isEditMode, editDeviceId, lut, items.length, selectedDevices.length]);

  const addImageToCanvas = (img: ImageItem, targetId?: string) => {
    const newImg: SlotImage = { id: `img_${uid()}`, imageId: img.imageId, imageurl: img.imageurl || img.imageName };
    if (targetId) {
      setItems(prev => prev.map(it => it.id === targetId ? { ...it, images: [...it.images, newImg] } : it));
      setSelectingFor(null);
      setShowImageDrawer(false);
    } else {
      const count = items.length;
      const w = snap(CANVAS_BASE_W / 2);
      const h = snap(w * 9 / 16);
      const newItem: CanvasItem = {
        id: `item_${uid()}`, images: [newImg], currentImageIndex: 0,
        x: snap((count % 2) * (w + SNAP * 2) + SNAP),
        y: snap(Math.floor(count / 2) * (h + SNAP * 2) + SNAP),
        w, h, zIndex: count + 1,
      };
      setItems(prev => [...prev, newItem]);
      setSelectedId(newItem.id);
      setShowImageDrawer(false);
    }
  };

  const moveItem = (id: string, dx: number, dy: number) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      return { ...i, x: Math.max(0, snap(i.x + dx)), y: Math.max(0, snap(i.y + dy)) };
    }));
  };

  const resizeItem = (id: string, dw: number, dh: number) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      return { 
        ...i, 
        w: Math.max(80, snap(i.w + dw)), 
        h: Math.max(60, snap(i.h + dh)) 
      };
    }));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const removeImage = (itemId: string, imgId: string) =>
    setItems(prev => prev.map(it => {
      if (it.id !== itemId) return it;
      const imgs = it.images.filter(i => i.id !== imgId);
      if (!imgs.length) return it;
      return { ...it, images: imgs, currentImageIndex: Math.min(it.currentImageIndex, imgs.length - 1) };
    }));

  const prevImage = (id: string) =>
    setItems(prev => prev.map(i => {
      if (i.id !== id || i.images.length <= 1) return i;
      return {
        ...i,
        currentImageIndex: i.currentImageIndex > 0 ? i.currentImageIndex - 1 : i.images.length - 1
      };
    }));

  const nextImage = (id: string) =>
    setItems(prev => prev.map(i => {
      if (i.id !== id || i.images.length <= 1) return i;
      return {
        ...i,
        currentImageIndex: (i.currentImageIndex + 1) % i.images.length
      };
    }));

  const bringForward = (id: string) => {
    setItems(prev => {
      const maxZ = Math.max(...prev.map(i => i.zIndex));
      return prev.map(i => i.id === id ? { ...i, zIndex: maxZ + 1 } : i);
    });
  };

  const sendBackward = (id: string) => {
    setItems(prev => {
      const minZ = Math.min(...prev.map(i => i.zIndex));
      return prev.map(i => i.id === id ? { ...i, zIndex: Math.max(1, minZ - 1) } : i);
    });
  };

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
          description: `${items.length} slot(s)`,
          deviceId: device.deviceId,
          screenWidth: CANVAS_BASE_W,
          screenHeight: Math.round(CANVAS_BASE_W * 9 / 16),
          screenLayout: `${items.length}`,
          items: sendItems,
        })
      ));
      setShowDevicePicker(false);
      setSuccessModal(true);
    } catch { 
      Alert.alert('Error', 'Failed to send content.'); 
    } finally { 
      setSending(false); 
    }
  };

  return (
    <ResponsiveLayout>
      <View style={ms.root}>
        {/* TOP BAR */}
        <View style={ms.topBar}>
          <View style={ms.topBarLeft}>
            <Monitor size={18} color="#fff" />
            <Text style={ms.topBarTitle}>Layout Studio</Text>
          </View>
          <TouchableOpacity style={ms.sendBtn} onPress={() => setShowDevicePicker(true)} disabled={sending || loading}>
            {sending ? <ActivityIndicator size="small" color="#fff" />
              : <><Send size={14} color="#fff" /><Text style={ms.sendBtnTxt}>Send to TV</Text></>}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={ms.center}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={ms.label}>Loading…</Text>
          </View>
        ) : (
          <ScrollView style={ms.body} contentContainerStyle={ms.bodyContent}>
            {/* INFO BAR */}
            <View style={ms.infoBar}>
              <Text style={ms.infoTxt}>{items.length} slot{items.length !== 1 ? 's' : ''}</Text>
              <TouchableOpacity style={ms.gridBtn} onPress={() => setShowGrid(g => !g)}>
                <Grid3X3 size={14} color={showGrid ? C.primary : C.textLight} />
                <Text style={[ms.gridBtnTxt, showGrid && { color: C.primary }]}>Grid</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ms.mobileAddBtn}
                onPress={() => { setSelectingFor(null); setShowImageDrawer(true); }}>
                <ImageIcon size={14} color={C.primary} />
                <Text style={ms.mobileAddTxt}>Add Slot</Text>
              </TouchableOpacity>
            </View>

            {/* CANVAS PREVIEW */}
            <View style={[ms.canvas, { width: canvasW, height: canvasH }]}>
              {showGrid && (
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  {Array.from({ length: Math.floor(canvasH / (SNAP * scale)) + 1 }).map((_, i) =>
                    <View key={`h${i}`} style={[ms.gridLine, { top: i * SNAP * scale, width: '100%', height: 1 }]} />
                  )}
                  {Array.from({ length: Math.floor(canvasW / (SNAP * scale)) + 1 }).map((_, i) =>
                    <View key={`v${i}`} style={[ms.gridLine, { left: i * SNAP * scale, height: '100%', width: 1 }]} />
                  )}
                </View>
              )}

              {!items.length && (
                <View style={ms.emptyCanvas}>
                  <Grid3X3 size={40} color={C.border} />
                  <Text style={ms.emptyTitle}>Canvas is empty</Text>
                  <Text style={ms.emptySub}>Tap "Add Slot" to start</Text>
                </View>
              )}

              {[...items].sort((a, b) => a.zIndex - b.zIndex).map(item => {
                const current = item.images[item.currentImageIndex];
                const isSelected = selectedId === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      ms.canvasItem,
                      {
                        left: item.x * scale,
                        top: item.y * scale,
                        width: item.w * scale,
                        height: item.h * scale,
                        zIndex: item.zIndex,
                      },
                      isSelected && ms.canvasItemSelected
                    ]}
                    onPress={() => setSelectedId(item.id)}
                    activeOpacity={0.8}
                  >
                    {current && (
                      <Image
                        source={{ uri: `${lut?.imageUrl || ''}${current.imageurl}` }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="contain"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* SELECTED ITEM CONTROLS */}
            {selectedId && (() => {
              const sel = items.find(i => i.id === selectedId);
              if (!sel) return null;
              return (
                <CanvasItemMobile
                  item={sel}
                  selected={true}
                  scale={scale}
                  imageBaseUrl={lut?.imageUrl || ''}
                  onSelect={() => {}}
                  onMove={(dx, dy) => moveItem(sel.id, dx, dy)}
                  onResize={(dw, dh) => resizeItem(sel.id, dw, dh)}
                  onDelete={() => deleteItem(sel.id)}
                  onAddImage={() => { setSelectingFor(sel.id); setShowImageDrawer(true); }}
                  onRemoveImage={imgId => removeImage(sel.id, imgId)}
                  onPrevImage={() => prevImage(sel.id)}
                  onNextImage={() => nextImage(sel.id)}
                  onBringForward={() => bringForward(sel.id)}
                  onSendBackward={() => sendBackward(sel.id)}
                />
              );
            })()}
          </ScrollView>
        )}

        {/* ── DEVICE PICKER MODAL ── */}
        <Modal visible={showDevicePicker} transparent animationType="fade"
          onRequestClose={() => setShowDevicePicker(false)}>
          <Pressable style={ms.overlay} onPress={() => setShowDevicePicker(false)}>
            <Pressable style={ms.modal}>
              <View style={ms.modalHeader}>
                <Tv size={20} color={C.primary} />
                <Text style={ms.modalTitle}>Select TV Device(s)</Text>
                <TouchableOpacity onPress={() => setShowDevicePicker(false)}>
                  <X size={20} color={C.textLight} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={lut?.deviceList ?? []}
                keyExtractor={d => d.deviceId}
                style={{ maxHeight: 300 }}
                renderItem={({ item: device }) => {
                  const active = selectedDevices.some(d => d.deviceId === device.deviceId);
                  return (
                    <TouchableOpacity
                      style={[ms.deviceRow, active && ms.deviceRowActive]}
                      onPress={() => toggleDevice(device)}>
                      <View style={[ms.deviceDot, active && { backgroundColor: C.success }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={ms.deviceName}>{device.displayName}</Text>
                        <Text style={ms.deviceSub}>{device.deviceName}</Text>
                      </View>
                      {active && <CheckCircle size={18} color={C.success} />}
                    </TouchableOpacity>
                  );
                }}
              />
              <TouchableOpacity
                style={[ms.modalSendBtn, (!selectedDevices.length || sending) && { opacity: 0.5 }]}
                onPress={handleSend}
                disabled={!selectedDevices.length || sending}>
                {sending ? <ActivityIndicator size="small" color="#fff" />
                  : <><Send size={15} color="#fff" />
                    <Text style={ms.modalSendTxt}>
                      Send to {selectedDevices.length || ''} {selectedDevices.length === 1 ? 'device' : 'devices'}
                    </Text></>}
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* ── IMAGE DRAWER ── */}
        <Modal visible={showImageDrawer} transparent animationType="slide"
          onRequestClose={() => { setShowImageDrawer(false); setSelectingFor(null); }}>
          <View style={ms.drawer}>
            <View style={ms.drawerHandle} />
            <View style={ms.drawerHeader}>
              <Text style={ms.modalTitle}>
                {selectingFor ? 'Add Image to Slot' : 'Image Library'}
              </Text>
              <TouchableOpacity onPress={() => { setShowImageDrawer(false); setSelectingFor(null); }}>
                <X size={20} color={C.textLight} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={lut?.imageList ?? []}
              numColumns={3}
              keyExtractor={i => String(i.imageId)}
              onEndReached={() => { if (hasMore && !loadingMore) loadImages(page + 1, false); }}
              onEndReachedThreshold={0.3}
              renderItem={({ item: img }) => (
                <TouchableOpacity
                  style={ms.imgCell}
                  onPress={() => addImageToCanvas(img, selectingFor ?? undefined)}
                  activeOpacity={0.7}>
                  <Image
                    source={{ uri: `${lut?.imageUrl || ''}${img.imageurl || img.imageName}` }}
                    style={ms.imgThumb}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              )}
              ListFooterComponent={
                loadingMore ? <ActivityIndicator color={C.primary} style={{ marginVertical: 12 }} /> : null
              }
            />
          </View>
        </Modal>

        {/* ── SUCCESS MODAL ── */}
        <Modal visible={successModal} transparent animationType="fade"
          onRequestClose={() => setSuccessModal(false)}>
          <Pressable style={ms.overlay} onPress={() => setSuccessModal(false)}>
            <View style={ms.successBox}>
              <CheckCircle size={48} color={C.success} />
              <Text style={ms.successTitle}>Sent!</Text>
              <Text style={ms.successSub}>
                Content sent to {selectedDevices.length} device{selectedDevices.length !== 1 ? 's' : ''}
              </Text>
              <TouchableOpacity style={ms.successBtn} onPress={() => setSuccessModal(false)}>
                <Text style={ms.successBtnTxt}>Done</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      </View>
    </ResponsiveLayout>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const ms = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label:       { fontSize: 13, color: C.textLight, marginTop: 12 },

  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.topBar },
  topBarLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  sendBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ffffff25', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#ffffff50' },
  sendBtnTxt:  { color: '#fff', fontWeight: '700', fontSize: 13 },

  body:        { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 32 },

  infoBar:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' },
  infoTxt:     { fontSize: 11, color: C.textLight, fontWeight: '500', flex: 1 },
  gridBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: C.border },
  gridBtnTxt:  { fontSize: 12, color: C.textLight },
  mobileAddBtn:{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primaryGhost, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5 },
  mobileAddTxt:{ fontSize: 12, color: C.primary, fontWeight: '600' },

  // Canvas
  canvas:      { backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: C.border, borderRadius: 4 },
  gridLine:    { position: 'absolute', backgroundColor: '#E2E8F040' },
  emptyCanvas: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle:  { fontSize: 15, fontWeight: '700', color: C.border, marginTop: 8 },
  emptySub:    { fontSize: 12, color: C.border },

  // Canvas items
  canvasItem: { position: 'absolute', backgroundColor: '#fff', overflow: 'hidden' },
  canvasItemSelected: { borderWidth: 2, borderColor: C.primary },

  // Item container (controls area)
  itemContainer: { marginTop: 16, backgroundColor: C.surface, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  itemContainerSelected: { borderColor: C.primary, borderWidth: 2 },
  
  // Item preview in controls
  itemPreview: { alignSelf: 'center', margin: 12, backgroundColor: C.surfaceAlt, borderRadius: 6, overflow: 'hidden' },
  selectedOverlay: { backgroundColor: 'rgba(30,58,138,0.07)' },
  counter:    { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  counterTxt: { color: '#fff', fontSize: 9, fontWeight: '700' },

  // Controls
  controls: { padding: 12 },
  infoRow: { marginBottom: 12 },
  infoText: { fontSize: 12, color: C.textLight, fontWeight: '600', textAlign: 'center' },

  controlGroup: { marginBottom: 16, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 },
  controlLabel: { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 8 },

  // Arrow controls
  arrowGrid: { alignItems: 'center', gap: 2 },
  arrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrowSpacer: { width: 40 },
  arrowBtn: { 
    width: 40, height: 40, backgroundColor: C.primaryGhost, 
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border
  },
  arrowCenter: { 
    width: 40, height: 40, backgroundColor: C.surfaceAlt, 
    borderRadius: 8, alignItems: 'center', justifyContent: 'center' 
  },
  arrowCenterText: { fontSize: 8, color: C.textLight, textAlign: 'center', lineHeight: 10 },

  // Size controls
  sizeRow: { gap: 12 },
  sizeControl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sizeLabel: { fontSize: 12, color: C.textLight, fontWeight: '500', flex: 1 },
  sizeBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sizeBtn: { 
    width: 32, height: 32, backgroundColor: C.primaryGhost, 
    borderRadius: 8, alignItems: 'center', justifyContent: 'center' 
  },
  sizeValue: { fontSize: 12, fontWeight: '700', color: C.text, minWidth: 40, textAlign: 'center' },

  // Image controls
  imageControls: { gap: 8 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  navBtn: { 
    backgroundColor: C.primary, width: 32, height: 32, 
    borderRadius: 16, alignItems: 'center', justifyContent: 'center' 
  },
  navText: { fontSize: 12, fontWeight: '600', color: C.text },
  imageActionRow: { flexDirection: 'row', gap: 8 },
  imageActionBtn: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    gap: 4, paddingVertical: 8, backgroundColor: C.primaryGhost, borderRadius: 8 
  },
  imageActionBtnDanger: { backgroundColor: '#FEE2E2' },
  imageActionText: { fontSize: 12, fontWeight: '600', color: C.primary },

  // Z-index controls
  zIndexRow: { flexDirection: 'row', gap: 8 },
  zIndexBtn: { 
    flex: 1, paddingVertical: 8, backgroundColor: C.surfaceAlt, 
    borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: C.border 
  },
  zIndexBtnText: { fontSize: 12, fontWeight: '600', color: C.text },

  // Delete
  deleteBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    gap: 8, backgroundColor: C.danger, borderRadius: 8, paddingVertical: 12, marginTop: 4 
  },
  deleteBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Modals
  overlay:     { flex: 1, backgroundColor: '#0F172A90', justifyContent: 'center', alignItems: 'center' },
  modal:       { width: '90%', maxWidth: 400, backgroundColor: C.surface, borderRadius: 16, padding: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  modalTitle:  { flex: 1, fontSize: 16, fontWeight: '700', color: C.text },
  deviceRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 8, marginBottom: 4, borderWidth: 1, borderColor: C.border },
  deviceRowActive:{ borderColor: C.primary, backgroundColor: C.primaryGhost },
  deviceDot:   { width: 10, height: 10, borderRadius: 5, backgroundColor: C.border },
  deviceName:  { fontSize: 14, fontWeight: '600', color: C.text },
  deviceSub:   { fontSize: 11, color: C.textLight, marginTop: 2 },
  modalSendBtn:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.primary, borderRadius: 10, paddingVertical: 12, marginTop: 16 },
  modalSendTxt:{ color: '#fff', fontWeight: '700', fontSize: 14 },

  drawer:      { position: 'absolute', bottom: 0, left: 0, right: 0, height: '75%', backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16 },
  drawerHandle:{ width: 36, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  drawerHeader:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  imgCell:     { flex: 1 / 3, aspectRatio: 1, padding: 4 },
  imgThumb:    { flex: 1, borderRadius: 8, backgroundColor: C.surfaceAlt },

  successBox:    { backgroundColor: C.surface, borderRadius: 20, padding: 32, alignItems: 'center', gap: 12, maxWidth: 300, width: '90%' },
  successTitle:  { fontSize: 22, fontWeight: '800', color: C.text },
  successSub:    { fontSize: 14, color: C.textLight, textAlign: 'center', lineHeight: 20 },
  successBtn:    { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 32, paddingVertical: 12, marginTop: 8 },
  successBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
});