export interface LayoutConfig {
  label: string;
  value: string;
  rows: number;
  cols: number;
  slots: number;
}

// Keep this only as a fallback / type reference — do NOT use in UI
export const LAYOUT_CONFIGS: LayoutConfig[] = [];

export function getLayoutConfig(
  value: string,
  layouts?: LayoutConfig[]
): LayoutConfig | undefined {
  return (layouts ?? []).find((l) => l.value === value);
}