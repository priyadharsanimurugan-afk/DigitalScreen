// types.ts
export type ElementType = 'image' | 'sticky';

export interface LayoutElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  zIndex: number;
  additionalAssets?: string[];
  rotation?: number;
  scale?: number;
}

export interface Layout {
  elements: LayoutElement[];
  updatedAt: number;
  designWidth?: number;
  designHeight?: number;
}