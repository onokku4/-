import type { Crop, GardenLocation } from "../types";
import { AGRONOMY } from "../data/agronomy";
import { CROPS } from "../data/catalog";

export type Region = "cold" | "middle" | "warm";
export const REGION_LABEL: Record<Region, string> = { cold: "寒冷地", middle: "中間地", warm: "暖地" };

/** 緯度から大まかな地域。登録がなければ中間地 */
export const regionOf = (loc: Pick<GardenLocation, "lat"> | null): Region => {
  if (!loc) return "middle";
  if (loc.lat >= 37.5) return "cold";
  if (loc.lat <= 32.5) return "warm";
  return "middle";
};

const wrap = (m: number) => ((m - 1 + 12) % 12) + 1;

/** 中間地の月を地域に合わせてずらす。寒冷地は春が遅く秋が早い、暖地はその逆 */
export const plantMonthsFor = (cropId: string, region: Region): number[] => {
  const months = AGRONOMY[cropId]?.plantMonths ?? [];
  if (region === "middle") return months;
  const shift = (m: number) => (m <= 6 ? (region === "cold" ? wrap(m + 1) : wrap(m - 1)) : region === "cold" ? wrap(m - 1) : wrap(m + 1));
  return [...new Set(months.map(shift))].sort((a, b) => a - b);
};

export const inSeason = (cropId: string, month: number, region: Region): boolean => plantMonthsFor(cropId, region).includes(month);

/** 今月植えられる作物 */
export const cropsForMonth = (month: number, region: Region): Crop[] => CROPS.filter((c) => inSeason(c.id, month, region));

export const monthsLabel = (months: number[]): string => (months.length === 0 ? "—" : months.map((m) => `${m}月`).join("・"));
