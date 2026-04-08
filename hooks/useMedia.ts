// hooks/useImages.ts
import { useState, useCallback, useRef } from "react";
import {
  uploadImage,
  getImages,
  deleteImage,
  ImageItem,
} from "@/services/images";

export interface ToastMessage {
  id: number;
  type: "success" | "error";
  message: string;
}

export const useImages = () => {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastCounter = useRef(0);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = useCallback((type: "success" | "error", message: string) => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Error Handler ─────────────────────────────────────────────────────────
  const handleError = useCallback((error: any) => {
    const apiError = error?.response?.data;
    let message = "Something went wrong";

    if (apiError?.errors) {
      const firstKey = Object.keys(apiError.errors)[0];
      message = apiError.errors[firstKey]?.[0] ?? message;
    } else if (apiError?.title) {
      const firstKey = apiError.errors ? Object.keys(apiError.errors)[0] : null;
      message = firstKey ? (apiError.errors[firstKey]?.[0] ?? apiError.title) : apiError.title;
    } else if (apiError?.message) {
      message = apiError.message;
    } else if (error?.message) {
      message = error.message;
    }

    showToast("error", message);
  }, [showToast]);

  // ── Fetch Images ──────────────────────────────────────────────────────────
  const fetchImages = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const res = await getImages();
      setImages(res); // already mapped: [{ id, imageName, imageUrl, createdAt }]
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // ── Upload Image ──────────────────────────────────────────────────────────
  const upload = useCallback(async (
    file: any,
    imageName: string
  ): Promise<ImageItem | null> => {
    try {
      setLoading(true);
      const res = await uploadImage(file, imageName);
      setImages((prev) => [res, ...prev]);
      showToast("success", "Image uploaded successfully");
      return res;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, showToast]);

  // ── Delete Image ──────────────────────────────────────────────────────────
  const removeImage = useCallback(async (id: number): Promise<void> => {
    try {
      setLoading(true);
      await deleteImage(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
      showToast("success", "Image deleted successfully");
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [handleError, showToast]);

  return {
    images,
    loading,
    toasts,
    dismissToast,
    upload,
    fetchImages,
    removeImage,
  };
};

export type { ImageItem };