// hooks/useLoginAuth.ts
import { useState } from "react";
import { loginApi, LoginRequest, LoginResponse } from "@/services/auth";

export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const login = async (data: LoginRequest): Promise<LoginResponse | null> => {
    try {
      setLoading(true);
      setErrors({});

      const res = await loginApi(data);
      return res;

    } catch (error: any) {
      const apiError = error?.response?.data;
      const newErrors: Record<string, string> = {};

      if (apiError?.errors) {
        // Handle validation errors
        Object.keys(apiError.errors).forEach(key => {
          const fieldMap: Record<string, string> = {
            "LoginId": "id",
            "Password": "pw"
          };
          
          const frontendField = fieldMap[key] || key.toLowerCase();
          newErrors[frontendField] = apiError.errors[key][0];
        });
      } else if (apiError?.title) {
        newErrors.general = apiError.title;
      } else if (error?.message) {
        newErrors.general = error.message;
      } else {
        newErrors.general = "Login failed. Please try again.";
      }

      setErrors(newErrors);
      return null;

    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    loading,
    errors,
  };
};