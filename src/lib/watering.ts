import type { Bed, Crop, Plant, Variety, WeatherLog, WeatherReading } from "../types";
import { resolve, soilType } from "../data/catalog";
import { daysBetween } from "./date";
import { tempVerdict, type TempVerdict } from "./temperature";
import { RAIN_AS_WATER_MM, weatherMultiplier } from "./weather";

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
  /** 最後に水を得た日（水やり、または十分な雨）。植えてから一度もなければ植え付け日 */
  lastWatered: string;
  /** 最後の水が雨だったか */
  byRain: boolean;
  /** 次に水やりが必要になる日（YYYY-MM-DD）。due なら今日 */
  nextDue: string;
  /** 今の気温が適温か */
  temp: TempVerdict;
}

const addDays = (date: string, n: number): string => new Date(Date.parse(date) + n * 86_400_000).toISOString().slice(0, 10);

/** 十分な雨が降った日は水やり扱い。水耕は雨に当たらないものとする */
export const rainCountsAsWater = (bed: Bed | undefined, rainMm: number): boolean =>
  bed !== undefined && bed.type !== "hydro" && rainMm >= RAIN_AS_WATER_MM[bed.type];

/** 最後に水を得た日を、水やりの記録と天気の記録（雨）から決める。未来の日付（予報）は数えない */
export const lastWaterOrRain = (plant: Plant, bed: Bed | undefined, log: WeatherLog, today: string): { date: string; byRain: boolean } => {
  const base = plant.lastWater ?? plant.plantedDate;
  let best = { date: base, byRain: false };
  for (const [date, d] of Object.entries(log)) {
    if (date > today || date <= best.date || date < plant.plantedDate) continue;
    if (rainCountsAsWater(bed, d.rainMm)) best = { date, byRain: true };
  }
  return best;
};

export function plantStatus(
  plant: Plant,
  bed: Bed | undefined,
  weather: WeatherReading,
  today: string,
  log: WeatherLog = {},
): PlantStatus | undefined {
  const r = resolve(plant);
  if (!r) return undefined;
  const { crop, variety } = r;
  const soilMult = bed ? soilType(bed.type).waterMult : 1;
  const interval = Math.max(1, Math.round(crop.waterEvery * soilMult * weatherMultiplier(weather) * (plant.waterAdjust || 1)));
  const last = lastWaterOrRain(plant, bed, log, today);
  const daysSinceWater = Math.max(0, daysBetween(last.date, today));
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
    lastWatered: last.date,
    byRain: last.byRain,
    nextDue: daysSinceWater >= interval ? today : addDays(last.date, interval),
    temp: tempVerdict(crop, weather.tempC),
  };
}

/** 水やり通知を今出すべきか。指定時刻を過ぎていて、今日まだ出していなければ出す */
export const shouldNotify = (nowHHMM: string, notifyTime: string, lastNotifyDate: string | null, today: string) =>
  nowHHMM >= notifyTime && lastNotifyDate !== today;
