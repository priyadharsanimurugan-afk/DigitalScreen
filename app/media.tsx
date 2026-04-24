// app/media.tsx
import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Image, SafeAreaView, ActivityIndicator, Platform, Modal, Linking,
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
  pagination as paginationStyle, loading as loadingStyle, empty,
  dialog as dialogStyle, modalStyles,
} from "./media.styles";
import { toastConfig } from "@/constants/toastConfig";

// ── Confirm Dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ visible, onConfirm, onCancel }: {
  visible: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  if (!visible) return null;
  return (
    <View style={dialogStyle.overlay}>
      <View style={dialogStyle.box}>
        <View style={dialogStyle.iconWrap}>
          <Ionicons name="trash-outline" size={28} color={COLORS.red} />
        </View>
        <Text style={dialogStyle.title}>Delete File</Text>
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
function FullscreenImageModal({ visible, imageUrl, imageName, onClose }: {
  visible: boolean; imageUrl: string | null; imageName: string; onClose: () => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  if (!visible || !imageUrl) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title} numberOfLines={1}>{imageName || "Preview"}</Text>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
            <Ionicons name="close-outline" size={28} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={modalStyles.content} activeOpacity={1} onPress={onClose}>
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

// ── PDF Preview Modal (web: iframe, mobile: open link) ───────────────────────
function PdfPreviewModal({ visible, pdfUrl, pdfName, onClose }: {
  visible: boolean; pdfUrl: string | null; pdfName: string; onClose: () => void;
}) {
  if (!visible || !pdfUrl) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title} numberOfLines={1}>{pdfName || "PDF Preview"}</Text>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
            <Ionicons name="close-outline" size={28} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {Platform.OS === "web" ? (
          // ✅ Render PDF inline using iframe on web
          <View style={{ flex: 1, width: "100%" }}>
            {/* @ts-ignore */}
            <iframe
              src={pdfUrl}
              style={{ width: "100%", height: "100%", border: "none", background: "#fff" }}
              title={pdfName}
            />
          </View>
        ) : (
          // ✅ Mobile: show open button since iframe is not available
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
            <Ionicons name="document-text-outline" size={64} color="#fff" />
            {/* <Text style={{ color: "#fff", fontFamily: FONTS.medium, fontSize: 14, textAlign: "center" }}>
              PDF preview is not available{"\n"}in the app.
            </Text> */}
            <TouchableOpacity
              onPress={() => { Linking.openURL(pdfUrl); onClose(); }}
              style={{
                backgroundColor: "#A16207", paddingHorizontal: 24, paddingVertical: 12,
                borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 8,
              }}
            >
              <Ionicons name="open-outline" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontFamily: FONTS.semiBold, fontSize: 14 }}>
                Open PDF
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

// ── Media Card ────────────────────────────────────────────────────────────────
function MediaCard({ item, onDelete, onPressImage, onPressPdf }: {
  item: ImageItem;
  onDelete: (id: number) => void;
  onPressImage: (url: string, name: string) => void;
  onPressPdf: (url: string, name: string) => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // ✅ Detect PDF by URL content-type hint or name extension
// In MediaCard — prioritize mimeType, fallback to name/url
const isPdf =
  (item as any).mimeType === "application/pdf" ||
  item.imageName?.toLowerCase().endsWith(".pdf") ||
  item.imageUrl?.toLowerCase().includes(".pdf");


  const handleImageError = () => {
    if (retryCount < maxRetries) {
      setTimeout(() => { setRetryCount(p => p + 1); setImgError(false); }, 1000 * (retryCount + 1));
    } else {
      setImgError(true);
    }
  };

  const dateStr = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  return (
    <View style={grid.card}>
      <TouchableOpacity
        style={grid.imgWrap}
        activeOpacity={0.9}
        onPress={() => isPdf
          ? onPressPdf(item.imageUrl, item.imageName || "Document")
          : onPressImage(item.imageUrl, item.imageName || "Image")
        }
      >
        {isPdf ? (
          // ✅ PDF card: yellow background with icon
          <View style={[grid.shimmer, { gap: 8, backgroundColor: "#FEF3C7" }]}>
            <Ionicons name="document-text-outline" size={36} color="#A16207" />
            <Text style={{ fontSize: 10, color: "#A16207", fontFamily: FONTS.regular, textAlign: "center" }}>
              Tap to Preview
            </Text>
          </View>
        ) : (
          <>
            {!imgLoaded && !imgError && (
              <View style={grid.shimmer}>
                <ActivityIndicator size="small" color={COLORS.blue} />
              </View>
            )}
            {imgError ? (
              <View style={[grid.shimmer, { gap: 6 }]}>
                <Ionicons name="image-outline" size={28} color={COLORS.textLight} />
                <Text style={{ fontSize: 10, color: COLORS.textLight, fontFamily: FONTS.regular }}>No preview</Text>
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
          </>
        )}
      </TouchableOpacity>

      <View style={[grid.badge, isPdf && { backgroundColor: "#A16207" }]}>
        <Ionicons name={isPdf ? "document-text-outline" : "image-outline"} size={10} color="#fff" />
        <Text style={grid.badgeText}>{isPdf ? "PDF" : "IMG"}</Text>
      </View>

      <View style={grid.body}>
        <Text style={grid.name} numberOfLines={1}>{item.imageName || "Untitled"}</Text>
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

// ── Server-side Paginator ─────────────────────────────────────────────────────
function Paginator({ page, totalPages, onPage }: {
  page: number; totalPages: number; onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <View style={paginationStyle.row}>
      <TouchableOpacity
        style={[paginationStyle.navBtn, page === 1 && paginationStyle.navBtnDisabled]}
        onPress={() => page > 1 && onPage(page - 1)}
        disabled={page === 1}
      >
        <Ionicons name="chevron-back" size={14} color={COLORS.textMid} />
        <Text style={paginationStyle.navText}>Prev</Text>
      </TouchableOpacity>

      {visiblePages[0] > 1 && (
        <>
          <TouchableOpacity style={paginationStyle.btn} onPress={() => onPage(1)}>
            <Text style={paginationStyle.btnText}>1</Text>
          </TouchableOpacity>
          {visiblePages[0] > 2 && <Text style={paginationStyle.ellipsis}>...</Text>}
        </>
      )}

      {visiblePages.map(p => (
        <TouchableOpacity
          key={p}
          style={[paginationStyle.btn, p === page && paginationStyle.btnActive]}
          onPress={() => onPage(p)}
        >
          <Text style={[paginationStyle.btnText, p === page && paginationStyle.btnTextActive]}>{p}</Text>
        </TouchableOpacity>
      ))}

      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <Text style={paginationStyle.ellipsis}>...</Text>
          )}
          <TouchableOpacity style={paginationStyle.btn} onPress={() => onPage(totalPages)}>
            <Text style={paginationStyle.btnText}>{totalPages}</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={[paginationStyle.navBtn, page === totalPages && paginationStyle.navBtnDisabled]}
        onPress={() => page < totalPages && onPage(page + 1)}
        disabled={page === totalPages}
      >
        <Text style={paginationStyle.navText}>Next</Text>
        <Ionicons name="chevron-forward" size={14} color={COLORS.textMid} />
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function MediaScreen() {
  const [loaded] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });
  const { images, loading, upload, fetchImages, removeImage, pagination } = useImages();

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const [confirmDelete, setConfirmDelete] = useState<{ visible: boolean; id: number | null }>
    ({ visible: false, id: null });
  const [fullscreenImage, setFullscreenImage] = useState<{ visible: boolean; url: string | null; name: string }>
    ({ visible: false, url: null, name: "" });
  const [pdfPreview, setPdfPreview] = useState<{ visible: boolean; url: string | null; name: string }>
    ({ visible: false, url: null, name: "" });

  // ✅ Fetch when page changes
  useEffect(() => {
    fetchImages(currentPage, PAGE_SIZE);
  }, [currentPage]);

  // ✅ Reset to page 1 on search (client-side filter within current page)
  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  if (!loaded) return null;

  // Client-side search filter within the current page's items
  const filtered = images.filter(img =>
    img.imageName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePageChange = (p: number) => {
    setCurrentPage(p);
  };

  const handleUpload = async () => {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*,application/pdf";
      input.multiple = true;
      input.onchange = async (e: any) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        await Promise.all(
          files.map((file: any) => upload(file, file.name.replace(/\.[^/.]+$/, ""), currentPage))
        );
      };
      input.click();
      return;
    }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Toast.show({ type: "error", text1: "Permission Required", text2: "Please grant media library access", visibilityTime: 2000 });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsMultipleSelection: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const name = asset.fileName?.replace(/\.[^/.]+$/, "") || `img_${Date.now()}`;
      await upload(asset, name, currentPage);
    }
  };

  return (
    <ResponsiveLayout>
      <SafeAreaView style={screen.safeArea}>
        <View style={screen.container}>
          <ScrollView style={screen.scroll} showsVerticalScrollIndicator={false}>
            <View style={screen.content}>

              {/* Header */}
              <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={{
                    flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start",
                    backgroundColor: "#FEF3C7", paddingHorizontal: 10, paddingVertical: 4,
                    borderRadius: 99, marginBottom: 4, borderWidth: 1, borderColor: "#A1620744",
                  }}>
                    <Ionicons name="images-outline" size={11} color="#A16207" />
                    <Text style={{ fontSize: 10, fontFamily: "Poppins_600SemiBold", color: "#A16207", letterSpacing: 0.5, textTransform: "uppercase" }}>
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
              <Text style={header.sub}>Manage and organize your image and PDF assets.</Text>

              {/* Search + Stats */}
              <View style={search.container}>
                <View style={search.bar}>
                  <Ionicons name="search-outline" size={18} color={COLORS.textLight} />
                  <TextInput
                    style={search.input}
                    placeholder="Search files..."
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
                    {/* ✅ Show server total, not local array length */}
                    <Text style={stats.text}>Total {pagination.total}</Text>
                  </View>
                </View>
              </View>

              {/* Loading */}
              {loading && (
                <View style={loadingStyle.wrap}>
                  <ActivityIndicator size="large" color={COLORS.blue} />
                  <Text style={loadingStyle.text}>Loading...</Text>
                </View>
              )}

              {/* Grid */}
              {!loading && (
                <View style={grid.wrap}>
                  <TouchableOpacity style={grid.uploadCard} onPress={handleUpload}>
                    <View style={grid.uploadIconWrap}>
                      <Ionicons name="add-circle-outline" size={32} color={COLORS.blue} />
                    </View>
                    <Text style={grid.uploadLabel}>Upload File</Text>
                    <Text style={grid.uploadSub}>{Platform.OS === "web" ? "Images or PDFs" : "Tap to pick"}</Text>
                  </TouchableOpacity>

                  {filtered.map(item => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      onDelete={id => setConfirmDelete({ visible: true, id })}
                      onPressImage={(url, name) => setFullscreenImage({ visible: true, url, name })}
                      onPressPdf={(url, name) => setPdfPreview({ visible: true, url, name })}
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
                  <Text style={empty.title}>No files found</Text>
                  <TouchableOpacity style={empty.btn} onPress={handleUpload}>
                    <Text style={empty.btnText}>Upload your first file</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ✅ Server-side pagination */}
              {!loading && pagination.totalPages > 1 && (
                <Paginator
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  onPage={handlePageChange}
                />
              )}

            </View>
          </ScrollView>

          <ConfirmDialog
            visible={confirmDelete.visible}
            onConfirm={async () => {
              if (confirmDelete.id !== null) {
                const id = confirmDelete.id;
                setConfirmDelete({ visible: false, id: null });
                await removeImage(id, currentPage);
              }
            }}
            onCancel={() => setConfirmDelete({ visible: false, id: null })}
          />

          <FullscreenImageModal
            visible={fullscreenImage.visible}
            imageUrl={fullscreenImage.url}
            imageName={fullscreenImage.name}
            onClose={() => setFullscreenImage({ visible: false, url: null, name: "" })}
          />

          {/* ✅ PDF Preview Modal */}
          <PdfPreviewModal
            visible={pdfPreview.visible}
            pdfUrl={pdfPreview.url}
            pdfName={pdfPreview.name}
            onClose={() => setPdfPreview({ visible: false, url: null, name: "" })}
          />

          <Toast config={toastConfig} />
        </View>
      </SafeAreaView>
    </ResponsiveLayout>
  );
}