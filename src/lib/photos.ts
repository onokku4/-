import type { GrowthStage, Photo, Plant } from "../types";
import { resolve } from "../data/catalog";
import { daysBetween } from "./date";

/** その場所で育っている株それぞれの「植え付けから何日目」（撮影日時点） */
export const growthStages = (plants: Plant[], bedId: string, date: string): GrowthStage[] =>
  plants
    .filter((p) => p.bedId === bedId && p.plantedDate <= date)
    .map((p) => ({ label: p.projectName, emoji: resolve(p)?.crop.emoji ?? "🌱", day: daysBetween(p.plantedDate, date) }));

/** 「トマト 12日目・ブルーベリー 120日目」のような一行 */
export const stageLine = (stages: GrowthStage[]): string =>
  stages.length === 0 ? "まだ何も植えていない頃" : stages.map((s) => `${s.emoji} ${s.label} ${s.day}日目`).join("・");

/** 場所ごと・日付順（古い→新しい）に並べる */
export const photosByBed = (photos: Photo[]): Map<string, Photo[]> => {
  const m = new Map<string, Photo[]>();
  for (const p of [...photos].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))) {
    m.set(p.bedId, [...(m.get(p.bedId) ?? []), p]);
  }
  return m;
};
