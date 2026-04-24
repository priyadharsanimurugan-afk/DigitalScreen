// services/images.ts
import api from "./api";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ImageApi {
  imageId: number;
  imageName: string;
  imageUrl: string;
  mimeType?: string;
  createdAt?: string;
}

export interface ImageItem {
  id: number;
  imageName: string;
  imageUrl: string;
  mimeType?: string;
  createdAt?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const normalizeItems = (items: ImageApi[]): ImageItem[] =>
  items.map((img) => ({
    id: img.imageId,
    imageName: img.imageName,
    imageUrl: img.imageUrl,
    mimeType: img.mimeType,
    createdAt: img.createdAt,
  }));

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

  return normalizeItems([res.data])[0];
};

// ── Get All Images (paginated API → full list) ────────────────────────────────
export const getImages = async (): Promise<ImageItem[]> => {
  // Step 1: Fetch first page to get total count
  const firstRes = await api.get<{
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    items: ImageApi[];
  }>("/images", { params: { page: 1, pageSize: 10 } });

  const { totalPages, items: firstItems } = firstRes.data;

  if (totalPages <= 1) return normalizeItems(firstItems);

  // Step 2: Fetch remaining pages in parallel
  const requests = Array.from({ length: totalPages - 1 }, (_, i) =>
    api.get("/images", { params: { page: i + 2, pageSize: 10 } })
  );

  const responses = await Promise.all(requests);

  const allItems: ImageApi[] = [
    ...firstItems,
    ...responses.flatMap((r) => r.data.items as ImageApi[]),
  ];

  return normalizeItems(allItems);
};

// ── Get Image File URL by ID ──────────────────────────────────────────────────
export const getImageFileUrl = (id: number): string =>
  `${api.defaults.baseURL}/images/file/${id}`;

// ── Delete Image ──────────────────────────────────────────────────────────────
export const deleteImage = async (id: number): Promise<void> => {
  await api.post(`/images/delete/${id}`);
};