// hooks/useImages.ts
import { useState, useCallback } from "react";
 // Assuming you're using react-native-toast-message
import {
  uploadImage,
  getImages,
  deleteImage,
  ImageItem,
} from "@/services/images";
import Toast from "react-native-toast-message";

export const useImages = () => {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);

  // ── Error Handler ─────────────────────────────────────────────────────────
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

    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: message,
      visibilityTime: 3000,
    });
  }, []);

  // ── Fetch Images ──────────────────────────────────────────────────────────
  const fetchImages = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const res = await getImages();
      setImages(res);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // ── Upload Image with Auto-Refresh ────────────────────────────────────────
  const upload = useCallback(async (
    file: any,
    imageName: string
  ): Promise<ImageItem | null> => {
    try {
      setLoading(true);
      const res = await uploadImage(file, imageName);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Image uploaded successfully',
        visibilityTime: 2000,
      });
      
      // 🔄 Wait a moment for server to process, then refresh the entire list
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Fetch fresh data from server
      await fetchImages();
      
      return res;
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [handleError, fetchImages]);

  // ── Delete Image ──────────────────────────────────────────────────────────
  const removeImage = useCallback(async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      await deleteImage(id);
      
      // Instant update - remove from array
      setImages((prev) => prev.filter((img) => img.id !== id));
      
      Toast.show({
        type: 'success',
        text1: 'Deleted',
        text2: 'Image deleted successfully',
        visibilityTime: 2000,
      });
      return true;
    } catch (error) {
      handleError(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  return {
    images,
    loading,
    upload,
    fetchImages,
    removeImage,
  };
};

export type { ImageItem };