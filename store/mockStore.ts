// mockStore.ts
// Zero-backend shared state between Admin and TV screens.
// Both screens import this module — same JS process = same memory.
// Admin writes → TV reads via subscription (poll every 1s).

export interface MockImage {
  imageId: number;
  imageName: string;
  imageurl: string;   // full URL, ready to use
  mimeType: string;
}

export interface MockDevice {
  deviceId: string;
  deviceName: string;
  displayName: string;
}

export interface MockSlot {
  slotIndex: number;
  imageIds: number[];
}

export interface MockLayout {
  title: string;
  description: string;
  screenLayout: string;
  deviceId: string;
  slots: MockSlot[];
  sentAt: number; // timestamp
}

// ─── MOCK IMAGE LIBRARY (uses real picsum photos) ─────────────────────────────
export const MOCK_IMAGES: MockImage[] = [
  { imageId: 183, imageName: 'Notice_page_1.png',   imageurl: 'https://picsum.photos/seed/notice1/800/600',  mimeType: 'image/png' },
  { imageId: 184, imageName: 'Notice_page_2.png',   imageurl: 'https://picsum.photos/seed/notice2/800/600',  mimeType: 'image/png' },
  { imageId: 185, imageName: 'Notice_page_3.png',   imageurl: 'https://picsum.photos/seed/notice3/800/600',  mimeType: 'image/png' },
  { imageId: 186, imageName: 'Event_Banner.png',    imageurl: 'https://picsum.photos/seed/event1/800/600',   mimeType: 'image/png' },
  { imageId: 187, imageName: 'Announcement.png',    imageurl: 'https://picsum.photos/seed/announce/800/600', mimeType: 'image/png' },
  { imageId: 188, imageName: 'Hall_Timetable.png',  imageurl: 'https://picsum.photos/seed/timetable/800/600',mimeType: 'image/png' },
  { imageId: 189, imageName: 'College_Logo.png',    imageurl: 'https://picsum.photos/seed/college/800/600',  mimeType: 'image/png' },
  { imageId: 190, imageName: 'Sports_Event.png',    imageurl: 'https://picsum.photos/seed/sports1/800/600',  mimeType: 'image/png' },
  { imageId: 191, imageName: 'Library_Notice.png',  imageurl: 'https://picsum.photos/seed/library/800/600', mimeType: 'image/png' },
  { imageId: 192, imageName: 'Cultural_Fest.png',   imageurl: 'https://picsum.photos/seed/culture/800/600', mimeType: 'image/png' },
  { imageId: 193, imageName: 'Fee_Notice.png',      imageurl: 'https://picsum.photos/seed/fee/800/600',     mimeType: 'image/png' },
  { imageId: 194, imageName: 'Workshop_Banner.png', imageurl: 'https://picsum.photos/seed/workshop/800/600',mimeType: 'image/png' },
];

// ─── MOCK DEVICES ─────────────────────────────────────────────────────────────
export const MOCK_DEVICES: MockDevice[] = [
  { deviceId: '0d1d7288-701a-422a-828f-5925d398435e', deviceName: 'tvOne',   displayName: 'front hall tv' },
  { deviceId: '1491b652-04db-428c-acaa-2d5110197e64', deviceName: 'tvTwo',   displayName: 'projector' },
  { deviceId: '492df205-2f6f-464a-aef6-2971aa980f31', deviceName: 'sd',      displayName: 'sd' },
  { deviceId: '9b7f5585-39ce-4cdb-9d7f-6eaebf090635', deviceName: '123456',  displayName: 'new' },
  { deviceId: 'f8ce2bf9-a4f9-40a2-a620-e17e3c50ceea', deviceName: 'nb1',     displayName: 'Main Notice Board' },
];

// ─── IN-MEMORY STORE ──────────────────────────────────────────────────────────
// Map: deviceId → last layout sent to that device
const _layouts = new Map<string, MockLayout>();
type Listener = (layout: MockLayout | null) => void;
const _listeners = new Map<string, Set<Listener>>();

export const MockStore = {
  /** Admin calls this when "Send to TV" is pressed */
  sendLayout(layout: MockLayout) {
    _layouts.set(layout.deviceId, { ...layout, sentAt: Date.now() });
    // notify any TV that is watching this deviceId
    _listeners.get(layout.deviceId)?.forEach(fn => fn(_layouts.get(layout.deviceId) ?? null));
  },

  /** TV calls this to get current layout for its deviceId */
  getLayout(deviceId: string): MockLayout | null {
    return _layouts.get(deviceId) ?? null;
  },

  /** TV subscribes to live updates for its deviceId */
  subscribe(deviceId: string, fn: Listener): () => void {
    if (!_listeners.has(deviceId)) _listeners.set(deviceId, new Set());
    _listeners.get(deviceId)!.add(fn);
    return () => _listeners.get(deviceId)?.delete(fn);
  },

  /** Helper: get full MockImage objects for a slot's imageIds */
  resolveImages(imageIds: number[]): MockImage[] {
    return imageIds
      .map(id => MOCK_IMAGES.find(img => img.imageId === id))
      .filter(Boolean) as MockImage[];
  },
};