// services/images.ts
import api from "./api";

// ✅ Matches ACTUAL API response: { imageId, imageName, imageUrl, createdAt }
interface ImageApi {
  imageId: number;
  imageName: string;
  imageUrl: string;
  mimeType?: string;   // ← ADD THIS
  createdAt?: string;
}


// Clean frontend model
export interface ImageItem {
  id: number;
  imageName: string;
  imageUrl: string;
    mimeType?: string;
  createdAt?: string;
}

// ── Map API → Frontend ────────────────────────────────────────────────────────
const mapImage = (img: ImageApi): ImageItem => ({
  id: img.imageId,
  imageName: img.imageName,
  imageUrl: img.imageUrl,
  mimeType: img.mimeType,  // ← ADD THIS
  createdAt: img.createdAt,
});

// ── Upload Image ──────────────────────────────────────────────────────────────
export const uploadImage = async (
  file: any,
  imageName: string,
    options?: { timeout?: number } 
): Promise<ImageItem> => {
  const formData = new FormData();

  if (typeof file === "object" && file.uri) {
    // 📱 React Native / Expo
    formData.append("file", {
      uri: file.uri,
      name: file.fileName || "image.jpg",
      type: file.mimeType || "image/jpeg",
    } as any);
  } else {
    // 🌐 Web
    formData.append("file", file);
  }

  formData.append("imageName", imageName || "Untitled");

  const res = await api.post<ImageApi>("/images/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: options?.timeout ?? 30000,
  });

  return mapImage(res.data);
};
type ImageResponse = {
  items: ImageApi[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
export const getImages = async (
  page: number = 1,
  pageSize: number = 10
): Promise<{
  items: ImageItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}> => {
  const res = await api.get<ImageResponse>("/images", {
    params: { page, pageSize },
  });

  return {
    ...res.data,
    items: res.data.items.map(mapImage), // 👈 mapping applied
  };
};
// ── Get Image File URL by ID ──────────────────────────────────────────────────
export const getImageFileUrl = (id: number): string =>
  `${api.defaults.baseURL}/images/file/${id}`;

// ── Delete Image ──────────────────────────────────────────────────────────────
export const deleteImage = async (id: number): Promise<void> => {
  await api.post(`/images/delete/${id}`);
};