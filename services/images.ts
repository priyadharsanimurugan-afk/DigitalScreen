// services/images.ts
import api from "./api";

// ✅ Matches ACTUAL API response: { imageId, imageName, imageUrl, createdAt }
interface ImageApi {
  imageId: number;
  imageName: string;
  imageUrl: string;
  createdAt?: string;
}

// Clean frontend model
export interface ImageItem {
  id: number;
  imageName: string;
  imageUrl: string;
  createdAt?: string;
}

// ── Map API → Frontend ────────────────────────────────────────────────────────
const mapImage = (img: ImageApi): ImageItem => ({
  id: img.imageId,
  imageName: img.imageName,
  imageUrl: img.imageUrl,
  createdAt: img.createdAt,
});

// ── Upload Image ──────────────────────────────────────────────────────────────
export const uploadImage = async (
  file: any,
  imageName: string
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
  });

  return mapImage(res.data);
};

// ── Get All Images ────────────────────────────────────────────────────────────
export const getImages = async (): Promise<ImageItem[]> => {
  const res = await api.get<ImageApi[]>("/images");
  return res.data.map(mapImage);
};

// ── Get Image File URL by ID ──────────────────────────────────────────────────
export const getImageFileUrl = (id: number): string =>
  `${api.defaults.baseURL}/images/file/${id}`;

// ── Delete Image ──────────────────────────────────────────────────────────────
export const deleteImage = async (id: number): Promise<void> => {
  await api.post(`/images/delete/${id}`);
};