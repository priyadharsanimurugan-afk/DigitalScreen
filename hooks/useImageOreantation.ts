import { useState, useEffect } from "react";

export type Orientation = "portrait" | "landscape" | "square";

export function useImageOrientation(
  imageList: { imageId: number; imageurl?: string }[]
): Map<number, Orientation> {
  const [orientations, setOrientations] = useState<Map<number, Orientation>>(new Map());

  useEffect(() => {
    if (!imageList.length) return;

    const map = new Map<number, Orientation>();
    let resolved = 0;

    imageList.forEach(({ imageId, imageurl }) => {
      if (!imageurl) {
        map.set(imageId, "landscape");
        resolved++;
        if (resolved === imageList.length) setOrientations(new Map(map));
        return;
      }

      const img = new Image();
      img.onload = () => {
        const ratio = img.naturalWidth / img.naturalHeight;
        const orientation: Orientation =
          ratio < 0.85 ? "portrait" : ratio > 1.15 ? "landscape" : "square";
        map.set(imageId, orientation);
        resolved++;
        if (resolved === imageList.length) setOrientations(new Map(map));
      };
      img.onerror = () => {
        map.set(imageId, "landscape");
        resolved++;
        if (resolved === imageList.length) setOrientations(new Map(map));
      };
      img.src = imageurl;
    });
  }, [imageList]);

  return orientations;
}