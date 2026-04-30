// services/birthdaylist.ts
import api from "./api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BirthdayItem {
  id: number;
  employeeName: string;
  date: string;
  message: string;
  imageUrl: string;   // ← direct from API e.g. "https://.../api/images/file/237"
}

// ── Get All Birthdays ─────────────────────────────────────────────────────────
// Response shape per item: { id, imageUrl, employeeName?, date?, message? }

export const getBirthdays = async (): Promise<BirthdayItem[]> => {
  const res = await api.post<BirthdayItem[]>("/content/birthday-list");

  console.log(
    "[getBirthdays] raw response:",
    JSON.stringify(res.data, null, 2)
  );

  return (res.data ?? []).map((item) => ({
    id:           item.id,
    employeeName: item.employeeName ?? "",
    date:         item.date ?? "",
    message:      item.message ?? "",
    imageUrl:     item.imageUrl ?? "",
  }));
};

export interface UpdateBirthdayContentResponse {
  message?: string;
  data?: any;
}

export const updateBirthdayContent = async (
  deviceId: string,
  isBirthday: boolean
): Promise<UpdateBirthdayContentResponse> => {
  const response = await api.post(
    `/devices/update-birthday-content`,
    null,
    {
      params: {
        deviceId,
        isBirthday,
      },
    }
  );

  return response.data;
};