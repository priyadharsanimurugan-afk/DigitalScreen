// services/secureStore.ts
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_TOKEN = "accessToken";
const REFRESH_TOKEN = "refreshToken";
const ROLES = "roles";
const REMEMBERED_USERNAME = "rememberedLoginId"; // Changed to match loginId
const REMEMBERED_PASSWORD = "rememberedPassword";
const CRYPTO_KEY_NAME = "rememberMeCryptoKey";

// ✅ AES-256 Web Crypto — generate or retrieve persistent key
const getCryptoKey = async (): Promise<CryptoKey> => {
  if (Platform.OS !== "web") throw new Error("Web Crypto only available on web");
  
  const stored = localStorage.getItem(CRYPTO_KEY_NAME);

  if (stored) {
    const raw = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
    return await crypto.subtle.importKey(
      "raw", raw,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  // Generate new key
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  // Save key to localStorage
  const exported = await crypto.subtle.exportKey("raw", key);
  const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
  localStorage.setItem(CRYPTO_KEY_NAME, keyBase64);

  return key;
};

// ✅ Encrypt
const encryptValue = async (value: string): Promise<string> => {
  const key = await getCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(value);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  const combined = new Uint8Array(iv.byteLength + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.byteLength);

  return btoa(String.fromCharCode(...combined));
};

// ✅ Decrypt
const decryptValue = async (value: string): Promise<string> => {
  const key = await getCryptoKey();
  const combined = Uint8Array.from(atob(value), (c) => c.charCodeAt(0));

  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
};

// ── Token functions ──────────────────────────────────────────────

export const saveTokens = async (
  accessToken: string,
  refreshToken: string,
  roles: string[]
) => {
  const rolesString = JSON.stringify(roles);
  if (Platform.OS === "web") {
    localStorage.setItem(ACCESS_TOKEN, accessToken);
    localStorage.setItem(REFRESH_TOKEN, refreshToken);
    localStorage.setItem(ROLES, rolesString);
  } else {
    await SecureStore.setItemAsync(ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN, refreshToken);
    await SecureStore.setItemAsync(ROLES, rolesString);
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (Platform.OS === "web") return localStorage.getItem(ACCESS_TOKEN);
  return await SecureStore.getItemAsync(ACCESS_TOKEN);
};

export const getRefreshToken = async (): Promise<string | null> => {
  if (Platform.OS === "web") return localStorage.getItem(REFRESH_TOKEN);
  return await SecureStore.getItemAsync(REFRESH_TOKEN);
};

export const getRoles = async (): Promise<string[] | null> => {
  if (Platform.OS === "web") {
    const roles = localStorage.getItem(ROLES);
    return roles ? JSON.parse(roles) : null;
  }
  const roles = await SecureStore.getItemAsync(ROLES);
  return roles ? JSON.parse(roles) : null;
};

export const deleteTokens = async () => {
  if (Platform.OS === "web") {
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    localStorage.removeItem(ROLES);
  } else {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(ROLES);
  }
};

// ── Remember Me functions ─────────────────────────────────────

export const saveRememberedCredentials = async (loginId: string, password: string) => {
  if (Platform.OS === "web") {
    const encryptedLoginId = await encryptValue(loginId);
    const encryptedPassword = await encryptValue(password);
    localStorage.setItem(REMEMBERED_USERNAME, encryptedLoginId);
    localStorage.setItem(REMEMBERED_PASSWORD, encryptedPassword);
  } else {
    await SecureStore.setItemAsync(REMEMBERED_USERNAME, loginId);
    await SecureStore.setItemAsync(REMEMBERED_PASSWORD, password);
  }
};

export const getRememberedCredentials = async () => {
  if (Platform.OS === "web") {
    try {
      const loginId = localStorage.getItem(REMEMBERED_USERNAME);
      const password = localStorage.getItem(REMEMBERED_PASSWORD);
      return {
        loginId: loginId ? await decryptValue(loginId) : "",
        password: password ? await decryptValue(password) : "",
      };
    } catch {
      // If decryption fails, clear and return empty
      localStorage.removeItem(REMEMBERED_USERNAME);
      localStorage.removeItem(REMEMBERED_PASSWORD);
      return { loginId: "", password: "" };
    }
  }
  const loginId = await SecureStore.getItemAsync(REMEMBERED_USERNAME);
  const password = await SecureStore.getItemAsync(REMEMBERED_PASSWORD);
  return { loginId: loginId || "", password: password || "" };
};

export const clearRememberedCredentials = async () => {
  if (Platform.OS === "web") {
    localStorage.removeItem(REMEMBERED_USERNAME);
    localStorage.removeItem(REMEMBERED_PASSWORD);
  } else {
    await SecureStore.deleteItemAsync(REMEMBERED_USERNAME);
    await SecureStore.deleteItemAsync(REMEMBERED_PASSWORD);
  }
};