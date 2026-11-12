import type { Plant, Variety, WeatherLog } from "../types";
import { daysBetween } from "./date";

/** 有効積算温度の基準温度（℃）。この温度を超えたぶんだけ生育が進むとみなす */
export const BASE_C = 10;
/** 標準の1日あたりの有効温度（日平均18℃想定）。品種の「◯日で収穫」はこの条件が前提 */
export const STANDARD_PER_DAY = 8;

const addDays = (date: string, n: number): string => new Date(Date.parse(date) + n * 86_400_000).toISOString().slice(0, 10);

export interface GddEstimate {
  /** 植え付けからの積算（℃日） */
  accumulated: number;
  /** 収穫に必要な積算の目安 */
  target: number;
  /** 0〜100 */
  progressPct: number;
  /** 予測する収穫日。記録が足りなければ日数計算と同じ */
  expectedDate: string;
  /** 日数計算との差（＋なら遅れ、−なら早い）。日単位 */
  shiftDays: number;
  /** 天気の記録があった日数 */
  loggedDays: number;
  /** 今の気温では1年以内に収穫に届かない（真冬の果菜など） */
  stalled: boolean;
}

/**
 * 積算温度での収穫予測。記録のない日は標準値で補い、これからは直近14日の平均で進むとみなす。
 * 多年生（days が年単位）には使わない
 */
export const gddEstimate = (plant: Plant, variety: Variety, log: WeatherLog, today: string): GddEstimate => {
  const target = variety.days * STANDARD_PER_DAY;
  let acc = 0;
  let logged = 0;
  const recent: number[] = [];
  const days = Math.max(0, daysBetween(plant.plantedDate, today));
  for (let i = 0; i < days; i++) {
    const d = addDays(plant.plantedDate, i);
    const w = log[d];
    const v = w ? Math.max(0, (w.maxC + w.minC) / 2 - BASE_C) : STANDARD_PER_DAY;
    if (w) {
      logged++;
      recent.push(v);
      if (recent.length > 14) recent.shift();
    }
    acc += v;
  }
  // 予報があれば先に使い、その先は直近平均
  const rate = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : STANDARD_PER_DAY;
  let future = acc;
  let date = today;
  let guard = 0;
  const LIMIT = 365;
  while (future < target && guard < LIMIT) {
    const w = log[date];
    future += w ? Math.max(0, (w.maxC + w.minC) / 2 - BASE_C) : Math.max(0.5, rate);
    date = addDays(date, 1);
    guard++;
  }
  const stalled = future < target || guard >= LIMIT;
  const plain = addDays(plant.plantedDate, variety.days);
  const expectedDate = stalled ? plain : date;
  return {
    accumulated: Math.round(acc),
    target: Math.round(target),
    progressPct: Math.min(100, Math.round((acc / target) * 100)),
    expectedDate,
    shiftDays: daysBetween(plain, expectedDate),
    loggedDays: logged,
    stalled,
  };
};
