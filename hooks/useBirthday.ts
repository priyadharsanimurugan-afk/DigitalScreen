// hooks/useBirthday.ts
import { useState, useCallback } from "react";
import { getBirthdays, BirthdayItem } from "@/services/birthdaylist";
import Toast from "react-native-toast-message";

export const useBirthday = () => {
  const [loading, setLoading]     = useState(false);
  const [birthdays, setBirthdays] = useState<BirthdayItem[]>([]);

  // ── Error Handler ─────────────────────────────────────────────────────────
  const handleError = useCallback((error: any) => {
    const apiError = error?.response?.data;
    let message = "Something went wrong";

    if (apiError?.errors) {
      const firstKey = Object.keys(apiError.errors)[0];
      message = apiError.errors[firstKey]?.[0] ?? message;
    } else if (apiError?.title) {
      message = apiError.title;
    } else if (apiError?.message) {
      message = apiError.message;
    } else if (error?.message) {
      message = error.message;
    }

    Toast.show({ type: "error", text1: "Error", text2: message, visibilityTime: 3000 });
  }, []);

  // ── Fetch Birthdays ───────────────────────────────────────────────────────
  // Each birthday already has id + imageUrl from the API — no sticky call needed.
  const fetchBirthdays = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const res = await getBirthdays();
      setBirthdays(res);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  return {
    birthdays,
    loading,
    fetchBirthdays,
  };
};

export type { BirthdayItem };