// app/media.tsx
import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Image, SafeAreaView, ActivityIndicator, Platform, Modal,
} from "react-native";
import {
  useFonts, Poppins_400Regular, Poppins_500Medium,
  Poppins_600SemiBold, Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";

import ResponsiveLayout from "@/components/responsiveLayout";
import { useImages } from "@/hooks/useMedia";
import { ImageItem } from "@/services/images";

import {
  COLORS, FONTS,
  screen, header, search, stats, grid,
  pagination, loading as loadingStyle, empty,
  dialog as dialogStyle, modalStyles,
} from "./media.styles";
import { toastConfig } from "@/constants/toastConfig";

const PAGE_SIZE = 12;

// ── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({
  visible,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!visible) return null;
  return (
    <View style={dialogStyle.overlay}>
      <View style={dialogStyle.box}>
        <View style={dialogStyle.iconWrap}>
          <Ionicons name="trash-outline" size={28} color={COLORS.red} />
        </View>
        <Text style={dialogStyle.title}>Delete Image</Text>
        <Text style={dialogStyle.msg}>Are you sure? This cannot be undone.</Text>
        <View style={dialogStyle.actions}>
          <TouchableOpacity style={dialogStyle.cancelBtn} onPress={onCancel}>
            <Text style={dialogStyle.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={dialogStyle.deleteBtn} onPress={onConfirm}>
            <Text style={dialogStyle.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Fullscreen Image Modal ────────────────────────────────────────────────────
function FullscreenImageModal({
  visible,
  imageUrl,
  imageName,
  onClose,
}: {
  visible: boolean;
  imageUrl: string | null;
  imageName: string;
  onClose: () => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);

  if (!visible || !imageUrl) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title} numberOfLines={1}>
            {imageName || "Image Preview"}
          </Text>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
            <Ionicons name="close-outline" size={28} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={modalStyles.content}
          activeOpacity={1}
          onPress={onClose}
        >
          {!imgLoaded && (
            <View style={modalStyles.loaderWrap}>
              <ActivityIndicator size="large" color={COLORS.white} />
            </View>
          )}
          <Image
            source={{ uri: imageUrl }}
            style={[modalStyles.image, !imgLoaded && { opacity: 0 }]}
            resizeMode="contain"
            onLoad={() => setImgLoaded(true)}
          />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ── Image Card ────────────────────────────────────────────────────────────────
function MediaCard({
  item,
  onDelete,
  onPressImage,
}: {
  item: ImageItem;
  onDelete: (id: number) => void;
  onPressImage: (url: string, name: string) => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const handleImageError = () => {
    if (retryCount < maxRetries) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setImgError(false);
      }, 1000 * (retryCount + 1));
    } else {
      setImgError(true);
    }
  };

  const dateStr = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <View style={grid.card}>
      <TouchableOpacity
        style={grid.imgWrap}
        activeOpacity={0.9}
        onPress={() => onPressImage(item.imageUrl, item.imageName || "Image")}
      >
        {!imgLoaded && !imgError && (
          <View style={grid.shimmer}>
            <ActivityIndicator size="small" color={COLORS.blue} />
          </View>
        )}

        {imgError ? (
          <View style={[grid.shimmer, { gap: 6 }]}>
            <Ionicons name="image-outline" size={28} color={COLORS.textLight} />
            <Text style={{ fontSize: 10, color: COLORS.textLight, fontFamily: FONTS.regular }}>
              No preview
            </Text>
          </View>
        ) : (
          <Image
            key={`${item.id}-${retryCount}`}
            source={{ uri: item.imageUrl }}
            style={[grid.thumb, !imgLoaded && { position: "absolute", opacity: 0 }]}
            resizeMode="cover"
            onLoad={() => setImgLoaded(true)}
            onError={handleImageError}
          />
        )}
      </TouchableOpacity>

      <View style={grid.badge}>
        <Ionicons name="image-outline" size={10} color="#fff" />
        <Text style={grid.badgeText}>IMG</Text>
      </View>

      <View style={grid.body}>
        <Text style={grid.name} numberOfLines={1}>
          {item.imageName || "Untitled"}
        </Text>
        {!!dateStr && <Text style={grid.date}>{dateStr}</Text>}

        <View style={grid.actions}>
          <TouchableOpacity
            style={[grid.actionBtn, { backgroundColor: COLORS.redLight }]}
            onPress={() => onDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={15} color={COLORS.red} />
          </TouchableOpacity>

          {Platform.OS === "web" && !!item.imageUrl && (
            <TouchableOpacity
              style={[grid.actionBtn, { backgroundColor: COLORS.blueLight }]}
              onPress={() => window.open(item.imageUrl, "_blank")}
            >
              <Ionicons name="open-outline" size={15} color={COLORS.blue} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Paginator({
  page,
  total,
  onPage,
}: {
  page: number;
  total: number;
  onPage: (p: number) => void;
}) {
  if (total <= 1) return null;

  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <View style={pagination.row}>
      <TouchableOpacity
        style={[pagination.navBtn, page === 1 && pagination.navBtnDisabled]}
        onPress={() => page > 1 && onPage(page - 1)}
        disabled={page === 1}
      >
        <Ionicons name="chevron-back" size={14} color={COLORS.textMid} />
        <Text style={pagination.navText}>Prev</Text>
      </TouchableOpacity>

      {visiblePages[0] > 1 && (
        <>
          <TouchableOpacity style={pagination.btn} onPress={() => onPage(1)}>
            <Text style={pagination.btnText}>1</Text>
          </TouchableOpacity>
          {visiblePages[0] > 2 && <Text style={pagination.ellipsis}>...</Text>}
        </>
      )}

      {visiblePages.map((p) => (
        <TouchableOpacity
          key={p}
          style={[pagination.btn, p === page && pagination.btnActive]}
          onPress={() => onPage(p)}
        >
          <Text style={[pagination.btnText, p === page && pagination.btnTextActive]}>
            {p}
          </Text>
        </TouchableOpacity>
      ))}

      {visiblePages[visiblePages.length - 1] < total && (
        <>
          {visiblePages[visiblePages.length - 1] < total - 1 && (
            <Text style={pagination.ellipsis}>...</Text>
          )}
          <TouchableOpacity style={pagination.btn} onPress={() => onPage(total)}>
            <Text style={pagination.btnText}>{total}</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={[pagination.navBtn, page === total && pagination.navBtnDisabled]}
        onPress={() => page < total && onPage(page + 1)}
        disabled={page === total}
      >
        <Text style={pagination.navText}>Next</Text>
        <Ionicons name="chevron-forward" size={14} color={COLORS.textMid} />
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function MediaScreen() {
  const [loaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const { images, loading, upload, fetchImages, removeImage } = useImages();

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<{
    visible: boolean;
    id: number | null;
  }>({ visible: false, id: null });
  const [fullscreenImage, setFullscreenImage] = useState<{
    visible: boolean;
    url: string | null;
    name: string;
  }>({ visible: false, url: null, name: "" });

  useEffect(() => { fetchImages(); }, []);
  useEffect(() => { setPage(1); }, [searchQuery]);

  if (!loaded) return null;

  const filtered = images.filter((img) =>
    img.imageName?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleUpload = async () => {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.multiple = true; // ✅ add this
     input.onchange = async (e: any) => {
  const files = Array.from(e.target.files || []);
  if (files.length === 0) return;

  await Promise.all(
    files.map((file: any) =>
      upload(
        file,
        file.name.replace(/\.[^/.]+$/, "")
      )
    )
  );
};

      input.click();
      return;
    }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Toast.show({
        type: 'error',
        text1: 'Permission Required',
        text2: 'Please grant media library access',
        visibilityTime: 2000,
      });
      return;
    }

 const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  quality: 1,
  allowsMultipleSelection: true, // ✅ important
});


    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const name = asset.fileName?.replace(/\.[^/.]+$/, "") || `img_${Date.now()}`;
      await upload(asset, name);
    }
  };

  const handleOpenFullscreen = (url: string, name: string) => {
    setFullscreenImage({ visible: true, url, name });
  };

  const handleCloseFullscreen = () => {
    setFullscreenImage({ visible: false, url: null, name: "" });
  };

  return (
    <ResponsiveLayout>
      <SafeAreaView style={screen.safeArea}>
        <View style={screen.container}>
          <ScrollView style={screen.scroll} showsVerticalScrollIndicator={false}>
            <View style={screen.content}>

              {/* Header */}
        {/* Header with Badge */}
<View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
  <View style={{ flex: 1, gap: 3 }}>
    {/* Badge - same style as dashboard */}
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      alignSelf: "flex-start",
      backgroundColor: "#FEF3C7",  // brownLight
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 99,
      marginBottom: 4,
      borderWidth: 1,
      borderColor: "#A1620744",  // brownMid with opacity
    }}>
      <Ionicons name="images-outline" size={11} color="#A16207" />
      <Text style={{
        fontSize: 10,
        fontFamily: "Poppins_600SemiBold",
        color: "#A16207",
        letterSpacing: 0.5,
        textTransform: "uppercase",
      }}>
        Media Management
      </Text>
    </View>
    
    <Text style={header.title}>Media Library</Text>
 
  </View>
  
  <TouchableOpacity style={header.uploadBtn} onPress={handleUpload}>
    <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
    <Text style={header.uploadBtnText}>Upload</Text>
  </TouchableOpacity>
</View>
              <Text style={header.sub}>Manage and organize your image assets.</Text>

              {/* Search + Stats */}
              <View style={search.container}>
                <View style={search.bar}>
                  <Ionicons name="search-outline" size={18} color={COLORS.textLight} />
                  <TextInput
                    style={search.input}
                    placeholder="Search images..."
                    placeholderTextColor={COLORS.textLight}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery !== "" && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={stats.bar}>
                
           
                  <View style={stats.item}>
                    <Ionicons name="images-outline" size={14} color={COLORS.brownMid} />
                    <Text style={stats.text}>Total {images.length}</Text>
                  </View>
                </View>
              </View>

              {/* Loading */}
              {loading && (
                <View style={loadingStyle.wrap}>
                  <ActivityIndicator size="large" color={COLORS.blue} />
                  <Text style={loadingStyle.text}>Loading images...</Text>
                </View>
              )}

              {/* Grid */}
              {!loading && (
                <View style={grid.wrap}>
                  <TouchableOpacity style={grid.uploadCard} onPress={handleUpload}>
                    <View style={grid.uploadIconWrap}>
                      <Ionicons name="add-circle-outline" size={32} color={COLORS.blue} />
                    </View>
                    <Text style={grid.uploadLabel}>Upload Image</Text>
                    <Text style={grid.uploadSub}>
                      {Platform.OS === "web" ? "Click to browse" : "Tap to pick"}
                    </Text>
                  </TouchableOpacity>

                  {paginated.map((item) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      onDelete={(id) => setConfirmDelete({ visible: true, id })}
                      onPressImage={handleOpenFullscreen}
                    />
                  ))}
                </View>
              )}

              {/* Empty */}
              {!loading && filtered.length === 0 && (
                <View style={empty.wrap}>
                  <View style={empty.iconWrap}>
                    <Ionicons name="folder-open-outline" size={48} color={COLORS.border} />
                  </View>
                  <Text style={empty.title}>No images found</Text>
                  <TouchableOpacity style={empty.btn} onPress={handleUpload}>
                    <Text style={empty.btnText}>Upload your first image</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Pagination */}
              {!loading && filtered.length > 0 && (
                <Paginator page={page} total={totalPages} onPage={setPage} />
              )}

            </View>
          </ScrollView>

          <ConfirmDialog
            visible={confirmDelete.visible}
            onConfirm={async () => {
              if (confirmDelete.id !== null) {
                setConfirmDelete({ visible: false, id: null });
                await removeImage(confirmDelete.id);
              }
            }}
            onCancel={() => setConfirmDelete({ visible: false, id: null })}
          />

          <FullscreenImageModal
            visible={fullscreenImage.visible}
            imageUrl={fullscreenImage.url}
            imageName={fullscreenImage.name}
            onClose={handleCloseFullscreen}
          />

          {/* Global Toast */}
          <Toast config={toastConfig} />
        </View>
      </SafeAreaView>
    </ResponsiveLayout>
  );
}