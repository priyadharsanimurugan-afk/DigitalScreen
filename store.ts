import { create } from 'zustand';
import { Layout, LayoutElement, ElementType } from './types/layout';

interface LayoutState {
  layout: Layout;
  selectedId: string | null;
  isSaving: boolean;
  designRes: { width: number; height: number };
  
  setLayout: (layout: Layout) => void;
  setSelectedId: (id: string | null) => void;
  addElement: (type: ElementType, content?: string) => void;
  updateElement: (id: string, updates: Partial<LayoutElement>) => void;
  deleteElement: (id: string) => void;
  moveLayer: (id: string, direction: 'front' | 'back') => void;
  resetLayout: () => void;
  setDesignRes: (res: { width: number; height: number }) => void;
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  layout: { elements: [], updatedAt: Date.now() },
  selectedId: null,
  isSaving: false,
  designRes: { width: 375, height: 667 },

  setLayout: (layout) => set({ layout }),
  
  setSelectedId: (id) => set({ selectedId: id }),
  
  addElement: (type, content) => {
    const { layout, designRes } = get();
    const id = Math.random().toString(36).substr(2, 9);
    
    // Auto-position elements in a grid pattern
    const count = layout.elements.length;
    const cols = 2;
    const spacing = 20;
    const baseX = 20 + (count % cols) * 160;
    const baseY = 20 + Math.floor(count / cols) * 180;

    const newElement: LayoutElement = {
      id,
      type,
      x: baseX,
      y: baseY,
      width: type === 'image' ? 150 : 140,
      height: type === 'image' ? 150 : 140,
      content: content || (type === 'image' 
        ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'
        : 'New note...'),
      zIndex: layout.elements.length + 1,
    };

    const newLayout = {
      ...layout,
      elements: [...layout.elements, newElement],
      designWidth: designRes.width,
      designHeight: designRes.height,
      updatedAt: Date.now(),
    };
    
    set({ layout: newLayout, selectedId: id });
  },

  updateElement: (id, updates) => {
    const { layout, designRes } = get();
    const newElements = layout.elements.map((el) =>
      el.id === id ? { ...el, ...updates } : el
    );
    set({
      layout: {
        ...layout,
        elements: newElements,
        designWidth: designRes.width,
        designHeight: designRes.height,
        updatedAt: Date.now(),
      },
    });
  },

  deleteElement: (id) => {
    const { layout } = get();
    set({
      layout: {
        ...layout,
        elements: layout.elements.filter((el) => el.id !== id),
        updatedAt: Date.now(),
      },
      selectedId: null,
    });
  },

  moveLayer: (id, direction) => {
    const { layout, updateElement } = get();
    const elements = layout.elements;
    const maxZ = Math.max(...elements.map((e) => e.zIndex), 0);
    const minZ = Math.min(...elements.map((e) => e.zIndex), 0);
    updateElement(id, { zIndex: direction === 'front' ? maxZ + 1 : minZ - 1 });
  },

  resetLayout: () => {
    set({ layout: { elements: [], updatedAt: Date.now() }, selectedId: null });
  },

  setDesignRes: (res) => set({ designRes: res }),
}));
