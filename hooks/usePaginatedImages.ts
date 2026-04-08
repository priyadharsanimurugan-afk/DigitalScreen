import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

interface ImageItem {
  imageId: number;
  imageName: string;
  imageUrl: string;
  createdAt: string;
}

export function usePaginatedImages() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalImages, setTotalImages] = useState(0);
  const itemsPerPage = 10;

  const fetchImages = useCallback(async (page: number = 1, isRefresh: boolean = false) => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      // Simulate API call with pagination
      // In production, replace with your actual API endpoint that supports pagination
      // Example: `https://digisignapi.lemeniz.com/api/images?page=${page}&limit=${itemsPerPage}`
      
      // For demo, we'll fetch all images and paginate client-side
      // Replace this with your actual API call
      const response = await fetch('https://digisignapi.lemeniz.com/api/images');
      const allImages = await response.json();
      
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const paginatedImages = allImages.slice(start, end);
      
      setTotalImages(allImages.length);
      
      if (isRefresh) {
        setImages(paginatedImages);
      } else {
        setImages(prev => [...prev, ...paginatedImages]);
      }
      
      setHasMore(end < allImages.length);
      setCurrentPage(page);
      
    } catch (error) {
      console.error('Error fetching images:', error);
      Alert.alert('Error', 'Failed to load images');
    } finally {
      setLoading(false);
    }
  }, [loading, itemsPerPage]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchImages(currentPage + 1);
    }
  }, [loading, hasMore, currentPage, fetchImages]);

  const refreshImages = useCallback(() => {
    fetchImages(1, true);
  }, [fetchImages]);

  return {
    images,
    loading,
    hasMore,
    totalImages,
    fetchImages,
    loadMore,
    refreshImages,
    itemsPerPage,
  };
}