// utils/weather.ts

export type WeatherData = {
  temp: number;
  icon: string;
  condition: string;
};

// 🔹 Get location via IP (TV safe)
export async function getLocation(): Promise<string | null> {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    if (!data?.latitude || !data?.longitude) return null;

    return `${data.latitude},${data.longitude}`;
  } catch (e) {
    console.log("Location error:", e);
    return null;
  }
}

// 🔹 Fetch weather
export async function fetchWeather(query: string): Promise<WeatherData | null> {
  try {
    const API_KEY = "6b0e5b8c79cc45a58fd70931261604"; // 🔴 replace this

    const res = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${query}`
    );

    const data = await res.json();

    return {
      temp: Math.round(data.current.temp_c),
      icon: data.current.condition.icon,
      condition: data.current.condition.text,
    };
  } catch (e) {
    console.log("Weather error:", e);
    return null;
  }
}
