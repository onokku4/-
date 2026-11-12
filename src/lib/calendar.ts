import type { Bed, CareEvent, DailyWeather, DiaryEntry, GardenState, HarvestRecord, Photo, Plant } from "../types";
import { PHOTO_TAGS } from "../data/agronomy";
import { resolve } from "../data/catalog";
import { daysBetween } from "./date";
import { dayTempIssues, type DayTempIssue } from "./temperature";
import { plantStatus } from "./watering";

export interface CalendarCell {
  date: string;
  day: number;
  /** 表示中の月の日か（前後の月の埋め草は false） */
  inMonth: boolean;
}

const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

/** 月のマス目（日曜始まり・6週ぶん=42マス） */
export const monthGrid = (year: number, month: number): CalendarCell[] => {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const start = new Date(first.getTime() - first.getUTCDay() * 86_400_000);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start.getTime() + i * 86_400_000);
    return { date: d.toISOString().slice(0, 10), day: d.getUTCDate(), inMonth: d.getUTCMonth() === month - 1 };
  });
};

export const shiftMonth = (year: number, month: number, by: number): { year: number; month: number } => {
  const idx = year * 12 + (month - 1) + by;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
};

export interface DayInfo {
  date: string;
  weather: DailyWeather | undefined;
  /** 予報か（今日より後） */
  forecast: boolean;
  planted: Plant[];
  harvests: HarvestRecord[];
  care: CareEvent[];
  /** この日に水やりが必要になる株（今日以降のみ） */
  waterDue: Plant[];
  photos: Photo[];
  /** その日の最高・最低気温で、暑すぎ／寒すぎだった株 */
  tempIssues: DayTempIssue[];
  diary: DiaryEntry[];
  /** 写真・日記に付いた病害虫タグ */
  pestTags: string[];
}

/**
 * その日の天気と出来事。
 * 水やり予定は「最後に水を得た日＋今日の天気で補正した間隔」（作物カードと同じ計算）。期限切れの株は今日に寄せる
 */
export type DayState = Pick<GardenState, "plants" | "beds" | "harvestLog" | "careLog" | "weatherLog" | "weather" | "photos" | "diary">;

export const dayInfo = (state: DayState, date: string, today: string): DayInfo => {
  const weather = state.weatherLog[date];
  const bedOf = (p: Plant): Bed | undefined => state.beds.find((b) => b.id === p.bedId);
  const waterDue =
    date < today ? [] : state.plants.filter((p) => plantStatus(p, bedOf(p), state.weather.current, today, state.weatherLog)?.nextDue === date);
  return {
    date,
    weather,
    forecast: date > today,
    planted: state.plants.filter((p) => p.plantedDate === date),
    harvests: state.harvestLog.filter((h) => h.harvestDate === date),
    care: state.careLog.filter((c) => c.date === date),
    waterDue,
    photos: state.photos.filter((p) => p.date === date),
    tempIssues: weather ? dayTempIssues(state.plants, weather, date) : [],
    diary: state.diary.filter((d) => d.date === date),
    pestTags: [...new Set([...state.photos.filter((p) => p.date === date), ...state.diary.filter((d) => d.date === date)].flatMap((x) => x.tags).filter((t) => PHOTO_TAGS.some((pt) => pt.id === t && pt.kind === "pest")))],
  };
};

/** 去年の今頃（±days 日）に記録した病害虫タグ。「去年は6/12にうどんこ病」の先回り用 */
export const lastYearAround = (state: Pick<GardenState, "photos" | "diary">, today: string, days = 21): { date: string; tags: string[] }[] => {
  const y = Number(today.slice(0, 4));
  const out: { date: string; tags: string[] }[] = [];
  for (const x of [...state.photos, ...state.diary]) {
    const pests = x.tags.filter((t) => PHOTO_TAGS.some((pt) => pt.id === t && pt.kind === "pest"));
    if (pests.length === 0 || Number(x.date.slice(0, 4)) >= y) continue;
    const sameYear = `${y}${x.date.slice(4)}`;
    if (Math.abs(daysBetween(sameYear, today)) <= days) out.push({ date: x.date, tags: pests });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
};

/** 株の表示名。カタログから消えた作物は projectName だけ */
export const plantEmoji = (p: Plant): string => resolve(p)?.crop.emoji ?? "🌱";

/** 記録のある最初の日から今日までの日数（「天気を◯日ぶん記録」の表示用） */
export const loggedDays = (log: GardenState["weatherLog"], today: string): number => {
  const past = Object.keys(log).filter((d) => d <= today);
  return past.length === 0 ? 0 : daysBetween(past.sort()[0]!, today) + 1;
};
