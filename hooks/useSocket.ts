// hooks/useSocket.ts
// WebSocket removed completely
// Safe empty hook so other pages won't break

import { useCallback } from "react";
import { Layout } from "../types/layout";

export const useSocket = () => {
  // dummy function so existing code keeps working
  const emitLayoutChange = useCallback((layout: Layout) => {
    // intentionally empty
    console.log("WebSocket removed. Layout change skipped:", layout);
  }, []);

  return {
    emitLayoutChange,
  };
};
