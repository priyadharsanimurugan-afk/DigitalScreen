// hooks/useBirthday.ts
import { useState, useCallback } from "react";
import { getBirthdays, updateBirthdayContent, BirthdayItem } from "@/services/birthdaylist";
import Toast from "react-native-toast-message";

export const useBirthday = () => {
  const [loading, setLoading] = useState(false);
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

  // ── Update Birthday ───────────────────────────────────────────────────────
  const updateBirthday = useCallback(
    async (deviceId: string, isBirthday: boolean): Promise<boolean> => {
      try {
        setLoading(true);

        const res = await updateBirthdayContent(deviceId, isBirthday);

        Toast.show({
          type: "success",
          text1: "Success",
          text2: res?.message || "Birthday content updated successfully",
          visibilityTime: 3000,
        });

        // Optionally refresh the birthdays list after update
        await fetchBirthdays();

        return true;
      } catch (error) {
        handleError(error);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [handleError, fetchBirthdays]
  );

  return {
    birthdays,
    loading,
    fetchBirthdays,
    updateBirthday,
  };
};

export type { BirthdayItem };