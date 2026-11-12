import type { Condition, DailyWeather, GardenLocation, WeatherLog, WeatherReading, WeatherState } from "../types";

export const CONDITIONS: readonly { id: Condition; label: string; mult: number; color: string }[] = [
  { id: "sunny", label: "晴れ", mult: 1.0, color: "#f5b942" },
  { id: "cloudy", label: "くもり", mult: 1.3, color: "#8b93a3" },
  { id: "rainy", label: "雨", mult: 2.5, color: "#5aa9e6" },
  { id: "snowy", label: "雪", mult: 2.5, color: "#9cc6ea" },
  { id: "windy", label: "強風", mult: 0.85, color: "#7fb8a0" },
];

export const conditionInfo = (id: Condition) => CONDITIONS.find((c) => c.id === id) ?? CONDITIONS[0]!;

export const CONDITION_EMOJI: Record<Condition, string> = { sunny: "☀️", cloudy: "☁️", rainy: "🌧️", snowy: "❄️", windy: "💨" };

/** 取得する過去日数と予報日数（Open-Meteo の上限） */
export const PAST_DAYS = 92;
export const FORECAST_DAYS = 16;

/** 1日の降水量がこれ以上なら水やり1回ぶんとみなす（mm）。鉢は軒下などで当たりにくいので多めに */
export const RAIN_AS_WATER_MM = { field: 5, planter: 10 } as const;

/** 手動で「雨」にしたときの降水量の目安（mm） */
const MANUAL_RAIN_MM = 10;

/** 手動入力の天気を1日の記録にする。気温は最高・最低とも入力値 */
export const manualDaily = (r: WeatherReading): DailyWeather => ({
  condition: r.condition,
  maxC: r.tempC,
  minC: r.tempC,
  rainMm: r.condition === "rainy" || r.condition === "snowy" ? MANUAL_RAIN_MM : 0,
  source: "manual",
});

/**
 * 自動取得の日別天気を記録に取り込む。
 * 人が手で直した日（manual）は自動値で上書きしない。
 */
export const mergeLog = (log: WeatherLog, daily: WeatherLog): WeatherLog => {
  const out = { ...log };
  for (const [date, d] of Object.entries(daily)) {
    if (out[date]?.source === "manual") continue;
    out[date] = d;
  }
  return out;
};

/** 日別天気の代表値（水やり計算に使う）。日中の最高気温と天気区分 */
export const readingOf = (d: DailyWeather): WeatherReading => ({ condition: d.condition, tempC: clampTemp(d.maxC) });

const numAt = (arr: unknown, i: number): number | undefined => {
  const v = Array.isArray(arr) ? arr[i] : undefined;
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
};

/** Open-Meteo の daily 応答を日付→天気に変換する。値が欠けている日は飛ばす */
export const parseDaily = (json: unknown): WeatherLog => {
  const daily = (json as { daily?: Record<string, unknown> } | null)?.daily;
  const times = daily?.time;
  if (!daily || !Array.isArray(times)) return {};
  const out: WeatherLog = {};
  times.forEach((t, i) => {
    if (typeof t !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(t)) return;
    const code = numAt(daily.weather_code, i);
    const max = numAt(daily.temperature_2m_max, i);
    const min = numAt(daily.temperature_2m_min, i);
    if (code === undefined || max === undefined || min === undefined) return;
    out[t] = {
      condition: conditionFromWmo(code, numAt(daily.wind_speed_10m_max, i) ?? 0),
      maxC: Math.round(max),
      minC: Math.round(min),
      rainMm: Math.round((numAt(daily.precipitation_sum, i) ?? 0) * 10) / 10,
      source: "auto",
    };
  });
  return out;
};

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
  | { ok: true; reading: WeatherReading; daily: WeatherLog; lat: number; lon: number }
  | { ok: false; error: FetchWeatherError };

/** 座標を約1km（小数2桁）に丸める。保存・送信はこの精度だけ */
export const roundCoord = (v: number): number => Math.round(v * 100) / 100;

export const DAILY_PARAMS = "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max";

/** 指定座標の現在の天気と、過去92日＋予報16日の日別天気 */
export async function fetchWeatherAt(lat: number, lon: number): Promise<FetchWeatherResult> {
  try {
    const q = new URLSearchParams({
      latitude: roundCoord(lat).toFixed(2),
      longitude: roundCoord(lon).toFixed(2),
      current: "temperature_2m,weather_code,wind_speed_10m",
      daily: DAILY_PARAMS,
      past_days: String(PAST_DAYS),
      forecast_days: String(FORECAST_DAYS),
      timezone: "auto",
      wind_speed_unit: "ms",
    });
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${q}`);
    if (!res.ok) return { ok: false, error: "network" };
    const json: unknown = await res.json();
    const cur = (json as { current?: Record<string, unknown> }).current;
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
      daily: parseDaily(json),
      lat: roundCoord(lat),
      lon: roundCoord(lon),
    };
  } catch {
    return { ok: false, error: "network" };
  }
}

/** 過去の日別天気（start〜end、YYYY-MM-DD）。失敗したら空 */
export async function fetchArchive(loc: Pick<GardenLocation, "lat" | "lon">, start: string, end: string): Promise<WeatherLog> {
  try {
    const q = new URLSearchParams({
      latitude: loc.lat.toFixed(2),
      longitude: loc.lon.toFixed(2),
      start_date: start,
      end_date: end,
      daily: DAILY_PARAMS,
      timezone: "auto",
      wind_speed_unit: "ms",
    });
    const res = await fetch(`https://archive-api.open-meteo.com/v1/archive?${q}`);
    if (!res.ok) return {};
    return parseDaily(await res.json());
  } catch {
    return {};
  }
}

const addDays = (date: string, n: number): string => new Date(Date.parse(date) + n * 86_400_000).toISOString().slice(0, 10);

/**
 * 植え付け以降で天気の記録が欠けている期間（昨日まで）。
 * 欠けが1日もなければ null。欠けの最初から最後までを1つの範囲で返す（途中に記録済みの日が混ざっていてもよい）
 */
export const backfillRange = (log: WeatherLog, plantedDates: string[], today: string): { start: string; end: string; missing: number } | null => {
  if (plantedDates.length === 0) return null;
  const from = [...plantedDates].sort()[0]!;
  const to = addDays(today, -1);
  let start: string | null = null;
  let end: string | null = null;
  let missing = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    if (log[d]) continue;
    missing++;
    start ??= d;
    end = d;
  }
  return start && end ? { start, end, missing } : null;
};

const getPosition = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 0,
    }),
  );

/**
 * 位置情報を1回だけ取得して天気を返す。
 * 座標は約1kmに丸めて天気APIへ送る。保存するかどうかは呼び出し側（庭の位置の登録）が決める。
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
  return fetchWeatherAt(pos.coords.latitude, pos.coords.longitude);
}

export const FETCH_ERROR_MESSAGE: Record<FetchWeatherError, string> = {
  unsupported: "この端末は位置情報に未対応です。手動で入力してください",
  denied: "位置情報が許可されていません。手動で入力してください",
  position: "位置情報を取得できませんでした。手動で入力してください",
  network: "天気を取得できませんでした。手動で入力してください",
};
