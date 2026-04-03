// Update your store/signageStore.ts:

type SignagePayload = {
  images: string[];
  layout: { cols: number; rows: number; slots: number; label: string };
  ratio: number;
  title: string;
  message: string;
  sentAt: string | null;
};

const defaultPayload: SignagePayload = {
  images: [],
  layout: { cols: 1, rows: 1, slots: 1, label: "Full" },
  ratio: 16 / 9,
  title: "",
  message: "",
  sentAt: null,
};

let store: SignagePayload = { ...defaultPayload };
const listeners: (() => void)[] = [];

export const signageStore = {
  get: () => store,
  send: (payload: Partial<SignagePayload>) => {
    console.log('📦 Store update - Sending:', {
      imagesCount: payload.images?.length,
      title: payload.title,
      layout: payload.layout
    });
    
    store = { ...store, ...payload, sentAt: new Date().toLocaleTimeString() };
    
    console.log('📦 Store updated - New state:', {
      imagesCount: store.images.length,
      firstImage: store.images[0]?.substring(0, 50)
    });
    
    // Trigger all listeners
    listeners.forEach(fn => {
      try {
        fn();
      } catch (err) {
        console.error('Listener error:', err);
      }
    });
  },
  subscribe: (fn: () => void) => {
    listeners.push(fn);
    console.log('📦 New subscriber, total:', listeners.length);
    return () => { 
      const i = listeners.indexOf(fn); 
      if (i > -1) listeners.splice(i, 1);
      console.log('📦 Unsubscribed, remaining:', listeners.length);
    };
  },
};