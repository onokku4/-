import type { Bed, Crop, Plant, Variety, WeatherReading } from "../types";
import { resolve, soilType } from "../data/catalog";
import { daysBetween } from "./date";
import { weatherMultiplier } from "./weather";

export interface PlantStatus {
  crop: Crop;
  variety: Variety;
  /** 天気・気温・場所で補正した水やり間隔（日） */
  interval: number;
  daysSinceWater: number;
  due: boolean;
  urgent: boolean;
  ageDays: number;
  /** 一年生: 収穫までの進み具合(0〜100)。多年生: null */
  growthPct: number | null;
  /** 多年生で今月が収穫期か */
  inSeason: boolean;
  /** 防寒が必要な冷え込みか */
  frostRisk: boolean;
}

export function plantStatus(
  plant: Plant,
  bed: Bed | undefined,
  weather: WeatherReading,
  today: string,
): PlantStatus | undefined {
  const r = resolve(plant);
  if (!r) return undefined;
  const { crop, variety } = r;
  const soilMult = bed ? soilType(bed.type).waterMult : 1;
  const interval = Math.max(1, Math.round(crop.waterEvery * soilMult * weatherMultiplier(weather)));
  const daysSinceWater = Math.max(0, daysBetween(plant.lastWater ?? plant.plantedDate, today));
  const ageDays = Math.max(0, daysBetween(plant.plantedDate, today));
  const month = Number(today.slice(5, 7));
  return {
    crop,
    variety,
    interval,
    daysSinceWater,
    due: daysSinceWater >= interval,
    urgent: daysSinceWater > interval,
    ageDays,
    growthPct: crop.perennial ? null : Math.min(100, Math.round((ageDays / variety.days) * 100)),
    inSeason: crop.perennial === true && (crop.harvestMonths?.includes(month) ?? false),
    frostRisk: crop.coldTenderBelowC !== undefined && weather.tempC < crop.coldTenderBelowC,
  };
}

/** 水やり通知を今出すべきか。指定時刻を過ぎていて、今日まだ出していなければ出す */
export const shouldNotify = (nowHHMM: string, notifyTime: string, lastNotifyDate: string | null, today: string) =>
  nowHHMM >= notifyTime && lastNotifyDate !== today;
