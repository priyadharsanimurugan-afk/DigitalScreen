import { deleteImage, getImages, ImageItem, uploadImage } from "@/services/images";
import { useCallback, useState } from "react";
import Toast from "react-native-toast-message";

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export const useImages = () => {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  });

  const handleError = useCallback((error: any) => {
    const apiError = error?.response?.data;
    let message = "Something went wrong";
    if (apiError?.errors) {
      const firstKey = Object.keys(apiError.errors)[0];
      message = apiError.errors[firstKey]?.[0] ?? message;
    } else if (apiError?.title) {
      message = apiError.title;
    } else if (apiError?.message) {
      message = apiError.message;
    } else if (error?.message) {
      message = error.message;
    }
    Toast.show({ type: "error", text1: "Error", text2: message, visibilityTime: 3000 });
  }, []);

  // ── Fetch Images (server-side pagination) ─────────────────────────────────
  const fetchImages = useCallback(async (page = 1, pageSize = 10): Promise<void> => {
    try {
      setLoading(true);
      const res = await getImages(page, pageSize); // pass page params to service
      // Map imageId → id so the rest of the app stays consistent
    // In useImages fetchImages — explicitly preserve mimeType
      const mapped = (res.items ?? []).map((img: any) => ({
        ...img,
        id: img.imageId ?? img.id,
        mimeType: img.mimeType,   // ← add this explicitly
      }));
      setImages(mapped);
      setPagination({
        page: res.page,
        pageSize: res.pageSize,
        total: res.total,
        totalPages: res.totalPages,
      });
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // ── Upload ────────────────────────────────────────────────────────────────
  const upload = useCallback(async (
    file: any,
    imageName: string,
    currentPage = 1
  ): Promise<ImageItem | null> => {
    try {
      setLoading(true);
      await uploadImage(file, imageName, { timeout: 5 * 60 * 1000 });
      Toast.show({ type: "success", text1: "Success", text2: "Uploaded successfully", visibilityTime: 2000 });
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchImages(currentPage); // stay on same page after upload
      return null;
    } catch (error: any) {
      if (error?.code === "ECONNABORTED" || error?.message?.includes("timeout")) {
        Toast.show({ type: "error", text1: "Upload Timed Out", text2: "File took too long. Try a smaller file.", visibilityTime: 4000 });
      } else {
        handleError(error);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, fetchImages]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const removeImage = useCallback(async (id: number, currentPage = 1): Promise<boolean> => {
    try {
      setLoading(true);
      await deleteImage(id);
      Toast.show({ type: "success", text1: "Deleted", text2: "Deleted successfully", visibilityTime: 2000 });
      await fetchImages(currentPage); // refresh current page
      return true;
    } catch (error) {
      handleError(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError, fetchImages]);

  return { images, loading, upload, fetchImages, removeImage, pagination };
};

export type { ImageItem };
