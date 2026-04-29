// useBirthdayCanvas.ts
// No longer calls addBirthdaySticky.
// Each BirthdayItem from /content/birthday-list already has { id, imageUrl }.
// We convert those directly into SlotImages and place them on the canvas.

import { useState, useCallback } from "react";
import Toast from "react-native-toast-message";

import { BirthdayItem }  from "@/services/birthdaylist";
import { CanvasItem, SlotImage } from "@/app/layouts";
import { BirthdayLayoutType }    from "@/components/birthdayModal";

// ─── Canvas constants (must match AdminLayoutStudio) ──────────────────────────
const CANVAS_W = 1920;
const CANVAS_H = 1080;
const SNAP     = 20;
const GAP      = 20;

const snap = (v: number) => Math.round(v / SNAP) * SNAP;
const uid  = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// ─── Equal-fit grid layout ────────────────────────────────────────────────────
interface Rect { x: number; y: number; w: number; h: number }

function computeEqualGrid(
  count: number,
  existingItems: CanvasItem[],
): Array<{ x: number; y: number; w: number; h: number }> {
  if (count === 0) return [];

  // ── Step 1: find free region ──────────────────────────────────────────────
  let freeX = 0;
  let freeY = 0;
  let freeW = CANVAS_W;
  let freeH = CANVAS_H;

  if (existingItems.length > 0) {
    const maxRight  = Math.max(...existingItems.map(it => it.x + it.w));
    const maxBottom = Math.max(...existingItems.map(it => it.y + it.h));
    const rightSpace  = CANVAS_W - maxRight - GAP;
    const bottomSpace = CANVAS_H - maxBottom - GAP;

    if (rightSpace >= bottomSpace && rightSpace > 0) {
      freeX = maxRight + GAP;
      freeY = 0;
      freeW = CANVAS_W - freeX;
      freeH = CANVAS_H;
    } else if (bottomSpace > 0) {
      freeX = 0;
      freeY = maxBottom + GAP;
      freeW = CANVAS_W;
      freeH = CANVAS_H - freeY;
    } else {
      freeX = 0; freeY = 0;
      freeW = CANVAS_W; freeH = CANVAS_H;
    }
  }

  // ── Step 2: optimal cols × rows ───────────────────────────────────────────
  let bestCols = 1;
  let bestCellW = 0;
  let bestCellH = 0;

  for (let cols = 1; cols <= count; cols++) {
    const rows  = Math.ceil(count / cols);
    const cellW = (freeW - GAP * (cols + 1)) / cols;
    const cellH = (freeH - GAP * (rows + 1)) / rows;
    if (cellW < 40 || cellH < 40) continue;
    const minDim = Math.min(cellW, cellH);
    if (minDim > Math.min(bestCellW, bestCellH)) {
      bestCols  = cols;
      bestCellW = cellW;
      bestCellH = cellH;
    }
  }

  const cols  = bestCols;
  const rows  = Math.ceil(count / cols);
  const cellW = snap((freeW - GAP * (cols + 1)) / cols);
  const cellH = snap((freeH - GAP * (rows + 1)) / rows);

  // ── Step 3: assign positions ──────────────────────────────────────────────
  const slots: Array<{ x: number; y: number; w: number; h: number }> = [];

  for (let i = 0; i < count; i++) {
    const col  = i % cols;
    const row  = Math.floor(i / cols);
    const x    = snap(freeX + GAP + col * (cellW + GAP));
    const y    = snap(freeY + GAP + row * (cellH + GAP));
    const safeX = Math.min(x, CANVAS_W - cellW);
    const safeY = Math.min(y, CANVAS_H - cellH);
    slots.push({ x: snap(safeX), y: snap(safeY), w: cellW, h: cellH });
  }

  return slots;
}

// ─── Convert BirthdayItem → SlotImage ────────────────────────────────────────
// Uses the id and imageUrl that come directly from /content/birthday-list.
// No API call needed.
function birthdayToSlotImage(birthday: BirthdayItem, index: number): SlotImage {
  return {
    id:       `bday_img_${birthday.id}_${index}`,
    imageId:  birthday.id,
    imageurl: birthday.imageUrl,   // ← full URL straight from API
  };
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────
export function useBirthdayCanvas() {
  const [building, setBuilding] = useState(false);

  /**
   * Converts birthday list items into CanvasItems using their
   * existing id + imageUrl. No sticky API call is made.
   *
   * SINGLE   → one slot, all images rotate inside it
   * MULTIPLE → N equal slots, one per birthday
   *
   * @param type          "single" | "multiple"
   * @param birthdays     Array from fetchBirthdays() — each has id + imageUrl
   * @param existingItems Full items[] from AdminLayoutStudio for gap detection
   */
  const buildCanvasItems = useCallback(
    async (
      type: BirthdayLayoutType,
      birthdays: BirthdayItem[],
      existingItems: CanvasItem[],
    ): Promise<CanvasItem[]> => {
      if (!birthdays.length) return [];

      setBuilding(true);

      try {
        // Filter out any items that somehow have no imageUrl
        const validBirthdays = birthdays.filter(b => !!b.imageUrl);

        if (!validBirthdays.length) {
          Toast.show({
            type: "error",
            text1: "Birthday Error",
            text2: "No birthday images found.",
            visibilityTime: 3000,
          });
          return [];
        }

        // Convert each birthday to a SlotImage — instant, no API call
        const slotImages: SlotImage[] = validBirthdays.map((b, i) =>
          birthdayToSlotImage(b, i)
        );

        const maxZ = existingItems.reduce((m, it) => Math.max(m, it.zIndex), 0);

        // ── SINGLE: all images rotate inside one slot ──────────────────────
        if (type === "single") {
          const slots = computeEqualGrid(1, existingItems);
          const slot  = slots[0];
          return [{
            id:                `bday_single_${uid()}`,
            images:            slotImages,
            currentImageIndex: 0,
            x:                 slot.x,
            y:                 slot.y,
            w:                 slot.w,
            h:                 slot.h,
            zIndex:            maxZ + 1,
          }];
        }

        // ── MULTIPLE: each birthday gets its own equal-sized slot ──────────
        const slots = computeEqualGrid(slotImages.length, existingItems);
        return slotImages.map((img, i) => ({
          id:                `bday_multi_${uid()}_${i}`,
          images:            [img],
          currentImageIndex: 0,
          x:                 slots[i].x,
          y:                 slots[i].y,
          w:                 slots[i].w,
          h:                 slots[i].h,
          zIndex:            maxZ + i + 1,
        }));

      } catch (err: any) {
        Toast.show({
          type: "error",
          text1: "Birthday Error",
          text2: err?.message ?? "Failed to place birthday images.",
          visibilityTime: 3000,
        });
        return [];
      } finally {
        setBuilding(false);
      }
    },
    [],
  );

  return { buildCanvasItems, building };
}