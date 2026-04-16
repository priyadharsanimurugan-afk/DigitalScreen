
export interface LayoutConfig {
  type: string;
  value: string;
  label: string;
  slots: number;
    rows: number;
  cols: number;

  structure: {
    direction?: "row" | "column";
    children: (
      | number
      | {
          direction?: "row" | "column";
          children: (number)[];
          flex?: number;
        }
    )[];
  };
}
// Keep this only as a fallback / type reference — do NOT use in UI
export const LAYOUT_CONFIGS: LayoutConfig[] = [];

export function getLayoutConfig(
  value: string,
  layouts?: LayoutConfig[]
): LayoutConfig | undefined {
  return (layouts ?? []).find((l) => l.value === value);
}