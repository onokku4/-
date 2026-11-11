import type { Condition, WeatherReading, WeatherState } from "../types";

export const CONDITIONS: readonly { id: Condition; label: string; mult: number; color: string }[] = [
  { id: "sunny", label: "晴れ", mult: 1.0, color: "#e0a32e" },
  { id: "cloudy", label: "くもり", mult: 1.3, color: "#9aa5ad" },
  { id: "rainy", label: "雨", mult: 2.5, color: "#5b8aa6" },
  { id: "snowy", label: "雪", mult: 2.5, color: "#7fa8c9" },
  { id: "windy", label: "強風", mult: 0.85, color: "#88a08a" },
];

export const conditionInfo = (id: Condition) => CONDITIONS.find((c) => c.id === id) ?? CONDITIONS[0]!;

export const TEMP_MIN = -20;
export const TEMP_MAX = 45;
export const clampTemp = (t: number): number =>
  Number.isFinite(t) ? Math.min(TEMP_MAX, Math.max(TEMP_MIN, Math.round(t))) : 20;

export const DEFAULT_WEATHER: WeatherState = { current: { condition: "sunny", tempC: 20 }, auto: null };

/** 気温による水やり間隔の倍率。暑いほど短く、寒いほど長く */
export const tempMultiplier = (tempC: number): number => {
  if (tempC >= 30) return 0.6;
  if (tempC >= 25) return 0.8;
  if (tempC >= 15) return 1;
  if (tempC >= 5) return 1.3;
  return 1.8;
};

export const weatherMultiplier = (r: WeatherReading): number =>
  conditionInfo(r.condition).mult * tempMultiplier(r.tempC);

export const tempLabel = (tempC: number): string => {
  if (tempC >= 30) return "猛暑";
  if (tempC >= 25) return "暑い";
  if (tempC >= 15) return "適温";
  if (tempC >= 5) return "肌寒い";
  return "厳寒";
};

/** 自動取得値を人が書き換えたか */
export const isAdjusted = (w: WeatherState): boolean =>
  w.auto !== null && (w.auto.condition !== w.current.condition || w.auto.tempC !== w.current.tempC);

export const applyAuto = (reading: WeatherReading, fetchedAt: string): WeatherState => ({
  current: reading,
  auto: { ...reading, fetchedAt },
});

export const adjust = (w: WeatherState, patch: Partial<WeatherReading>): WeatherState => ({
  ...w,
  current: {
    condition: patch.condition ?? w.current.condition,
    tempC: patch.tempC === undefined ? w.current.tempC : clampTemp(patch.tempC),
  },
});

export const resetToAuto = (w: WeatherState): WeatherState =>
  w.auto ? { ...w, current: { condition: w.auto.condition, tempC: w.auto.tempC } } : w;

/** WMO天気コード＋風速(m/s) → アプリの天気区分 */
export const conditionFromWmo = (code: number, windMs: number): Condition => {
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snowy";
  if (code >= 51) return "rainy";
  if (windMs >= 8) return "windy";
  return code <= 1 ? "sunny" : "cloudy";
};

export type FetchWeatherError = "unsupported" | "denied" | "position" | "network";

export type FetchWeatherResult =
  | { ok: true; reading: WeatherReading }
  | { ok: false; error: FetchWeatherError };

const getPosition = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 0,
    }),
  );

/**
 * 位置情報を1回だけ取得して現在の天気と気温を返す。
 * 座標は小数2桁（約1km）に丸めて天気APIへ送るだけで、どこにも保存しない。
 */
export async function fetchWeatherHere(): Promise<FetchWeatherResult> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return { ok: false, error: "unsupported" };
  }
  let pos: GeolocationPosition;
  try {
    pos = await getPosition();
  } catch (e) {
    const denied = (e as GeolocationPositionError).code === 1;
    return { ok: false, error: denied ? "denied" : "position" };
  }
  try {
    const q = new URLSearchParams({
      latitude: pos.coords.latitude.toFixed(2),
      longitude: pos.coords.longitude.toFixed(2),
      current: "temperature_2m,weather_code,wind_speed_10m",
      wind_speed_unit: "ms",
    });
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${q}`);
    if (!res.ok) return { ok: false, error: "network" };
    const cur = ((await res.json()) as { current?: Record<string, unknown> }).current;
    const temp = cur?.temperature_2m;
    const code = cur?.weather_code;
    const wind = cur?.wind_speed_10m;
    if (typeof temp !== "number" || typeof code !== "number") return { ok: false, error: "network" };
    return {
      ok: true,
      reading: {
        condition: conditionFromWmo(code, typeof wind === "number" ? wind : 0),
        tempC: clampTemp(temp),
      },
    };
  } catch {
    return { ok: false, error: "network" };
  }
}

export const FETCH_ERROR_MESSAGE: Record<FetchWeatherError, string> = {
  unsupported: "この端末は位置情報に未対応です。手動で入力してください",
  denied: "位置情報が許可されていません。手動で入力してください",
  position: "位置情報を取得できませんでした。手動で入力してください",
  network: "天気を取得できませんでした。手動で入力してください",
};
