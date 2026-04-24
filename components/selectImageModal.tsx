// components/selectImageModal.tsx - UPDATED VERSION

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  FlatList,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { C } from "@/app/dashboard.styles";
import { PdfPreviewModal } from "./pdfpreviewModal";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SelectableImage {
  imageId: number;
  imageName: string;
  imageurl?: string;
  mimeType?: string;
  thumbnailUrl?: string; // NEW: for PDF thumbnails
}

export function isPdf(item: SelectableImage) {
  return (
    item.mimeType === "application/pdf" ||
    item.imageurl?.toLowerCase().endsWith(".pdf")
  );
}

interface Props {
  visible: boolean;
  onClose: () => void;
  options: SelectableImage[];
  selected: number[];
  onToggle: (id: number) => void;
  maxSelect: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const ImageSelectModal = ({
  visible,
  onClose,
  options,
  selected,
  onToggle,
  maxSelect,
}: Props) => {
  const { width, height } = useWindowDimensions();
  const modalW = Math.min(width - 32, 640);
  const colSize = (modalW - 32 - 16) / 3;

  const [pdfPreview, setPdfPreview] = useState<{ url: string; name: string } | null>(null);
  const [processingPdfIds, setProcessingPdfIds] = useState<Set<number>>(new Set());

  // ✦ NEW: Convert PDF to selectable image
  const handlePdfSelect = async (item: SelectableImage) => {
    if (!item.imageurl) return;
    
    // Show preview first (user can still preview)
    setPdfPreview({ url: item.imageurl, name: item.imageName });
    
    // Mark as processing
    setProcessingPdfIds(prev => new Set(prev).add(item.imageId));
    
    try {
      // For now, we'll use the PDF URL directly as the image source
      // In production, you'd generate a thumbnail here
      const thumbnailUrl = item.imageurl; // Or await pdfToImage(item.imageurl)
      
      // Update the item with thumbnail
      item.thumbnailUrl = thumbnailUrl;
      
      // Allow selection
      onToggle(item.imageId);
    } catch (error) {
      console.error("Failed to process PDF:", error);
    } finally {
      setProcessingPdfIds(prev => {
        const next = new Set(prev);
        next.delete(item.imageId);
        return next;
      });
    }
  };

  const renderItem = ({ item }: { item: SelectableImage }) => {
    const isItemPdf = isPdf(item);
    const isSelected = selected.includes(item.imageId);
    const orderIndex = selected.indexOf(item.imageId);
    const atMax = !isSelected && selected.length >= maxSelect;
    const isProcessing = processingPdfIds.has(item.imageId);

    return (
      <TouchableOpacity
        onPress={() => {
          if (isItemPdf) {
            // ✦ PDFs can now be selected (they'll show as image preview)
            if (!atMax && !isProcessing) {
              handlePdfSelect(item);
            }
          } else if (!atMax) {
            onToggle(item.imageId);
          }
        }}
        onLongPress={() => {
          // Long press to preview PDF without selecting
          if (isItemPdf && item.imageurl) {
            setPdfPreview({ url: item.imageurl, name: item.imageName });
          }
        }}
        activeOpacity={0.85}
        style={[
          s.imageCard,
          {
            width: colSize,
            opacity: !isItemPdf && atMax ? 0.45 : 1,
            borderColor: isItemPdf ? "#F59E0B" : isSelected ? C.primary : "#E2E8F0",
          },
        ]}
      >
        <View style={[s.imageContainer, { height: colSize * 0.75 }]}>
          {isItemPdf ? (
            // ✦ PDF now shows preview image if selected/processed
            isSelected && item.thumbnailUrl ? (
              <Image 
                source={{ uri: item.thumbnailUrl }} 
                style={{ width: "100%", height: "100%" }} 
                resizeMode="cover" 
              />
            ) : (
              <View style={s.pdfBox}>
                <Ionicons name="document-text-outline" size={32} color="#F59E0B" />
                <Text style={s.pdfLabel}>PDF</Text>
                {isProcessing ? (
                  <View style={s.previewBadge}>
                    <Text style={s.previewBadgeText}>Processing...</Text>
                  </View>
                ) : (
                  <View style={s.previewBadge}>
                    <Ionicons name="eye-outline" size={9} color="#fff" />
                    <Text style={s.previewBadgeText}>Tap to use</Text>
                  </View>
                )}
                <Text style={s.hintText}>Long press to preview</Text>
              </View>
            )
          ) : item.imageurl ? (
            <Image source={{ uri: item.imageurl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <View style={s.placeholder}>
              <Ionicons name="image-outline" size={32} color="#94A3B8" />
            </View>
          )}
        </View>

        {isSelected && (
          <>
            <View style={s.selectedOverlay} />
            <View style={s.checkIcon}>
              <Ionicons name="checkmark-circle" size={22} color={C.primary} />
            </View>
            <View style={s.orderBadge}>
              <Text style={s.orderText}>{orderIndex + 1}</Text>
            </View>
          </>
        )}

        <Text style={s.imageName} numberOfLines={1}>
          {item.imageName}
          {isItemPdf && isSelected && " (PDF)"}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={s.overlay}>
          <View style={[s.modalBox, { width: modalW, maxHeight: height * 0.85 }]}>
            {/* Header */}
            <View style={s.header}>
              <View>
                <Text style={s.headerTitle}>Select Images</Text>
                <Text style={s.headerSub}>
                  {selected.length}/{maxSelect} selected · PDFs can be used as images
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ backgroundColor: C.primaryGhost, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}>
                  <Text style={{ fontFamily: "Poppins_600SemiBold", fontSize: 12, color: C.primary }}>
                    {selected.length}/{maxSelect}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Grid */}
            <FlatList
              data={options}
              keyExtractor={(item) => String(item.imageId)}
              renderItem={renderItem}
              numColumns={3}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 16, gap: 8 }}
              columnWrapperStyle={{ gap: 8, justifyContent: "flex-start" }}
            />

            {/* Footer */}
            <View style={s.footer}>
              <TouchableOpacity onPress={onClose} style={s.cancelBtn}>
                <Text style={{ fontSize: 14, fontFamily: "Poppins_600SemiBold", color: "#6B7280" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                style={[s.doneBtn, { opacity: selected.length === 0 ? 0.5 : 1 }]}
              >
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={s.doneText}>Done ({selected.length})</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full-screen PDF preview */}
      {pdfPreview && (
        <PdfPreviewModal
          visible={!!pdfPreview}
          onClose={() => setPdfPreview(null)}
          pdfUrl={pdfPreview.url}
          title={pdfPreview.name}
        />
      )}
    </>
  );
};

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", padding: 16 },
  modalBox: { backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, elevation: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#111" },
  headerSub: { fontSize: 13, color: "#64748B", marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 99, backgroundColor: "#F1F5F9", justifyContent: "center", alignItems: "center" },
  imageCard: { borderRadius: 12, overflow: "hidden", backgroundColor: "#F8FAFC", borderWidth: 2.5 },
  imageContainer: { width: "100%", backgroundColor: "#F0F4F8", justifyContent: "center", alignItems: "center" },
  placeholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  pdfBox: { flex: 1, justifyContent: "center", alignItems: "center", gap: 2 },
  pdfLabel: { fontSize: 9, fontWeight: "700", color: "#F59E0B", letterSpacing: 1 },
  previewBadge: { flexDirection: "row", alignItems: "center", gap: 2, backgroundColor: "#F59E0B", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, marginTop: 2 },
  previewBadgeText: { fontSize: 8, color: "#fff", fontWeight: "700" },
  hintText: { fontSize: 7, color: "#94A3B8", marginTop: 2 },
  selectedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(59,130,246,0.12)" },
  checkIcon: { position: "absolute", top: 6, right: 6, backgroundColor: "white", borderRadius: 99 },
  orderBadge: { position: "absolute", top: 6, left: 6, backgroundColor: C.primary, width: 22, height: 22, borderRadius: 11, justifyContent: "center", alignItems: "center", borderWidth: 1.5, borderColor: "white" },
  orderText: { color: "white", fontSize: 11, fontWeight: "bold" },
  imageName: { fontSize: 11, textAlign: "center", paddingVertical: 7, paddingHorizontal: 4, color: "#334155", fontWeight: "500" },
  footer: { flexDirection: "row", gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: "#F1F5F9" },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  doneBtn: { flex: 2, paddingVertical: 12, borderRadius: 12, backgroundColor: C.primary, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 },
  doneText: { color: "white", fontSize: 15, fontWeight: "700" },
});