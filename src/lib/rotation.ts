import type { CareEvent, HarvestRecord, Plant } from "../types";
import { AGRONOMY, ROTATION_YEARS } from "../data/agronomy";
import { findCrop } from "../data/catalog";
import { daysBetween } from "./date";

export interface RotationWarning {
  family: string;
  /** 直近で同じ科を育てた作物名と収穫日 */
  lastCrop: string;
  lastDate: string;
  /** 空けたい年数 */
  years: number;
  /** あと何か月空けるべきか */
  monthsLeft: number;
  message: string;
}

/**
 * 連作障害の警告。同じ場所で同じ科を、空けたい年数のうちに育てていたら返す。
 * 土替え（refresh）以降は土が新しいので数えない（地植えは土が替わらないので数える）
 */
export const rotationWarning = (
  args: { bedId: string; bedName: string; bedType: string; cropId: string; harvestLog: HarvestRecord[]; plants: Plant[]; careLog: CareEvent[]; today: string },
): RotationWarning | null => {
  const { bedId, bedName, bedType, cropId, harvestLog, plants, careLog, today } = args;
  const ag = AGRONOMY[cropId];
  if (!ag) return null;
  const years = ROTATION_YEARS[ag.family];
  if (years === 0) return null;
  const lastRefresh = bedType === "field" ? null : careLog.filter((c) => c.kind === "refresh" && c.label === bedName).map((c) => c.date).sort().at(-1) ?? null;
  const sameFamily = (id: string) => id !== undefined && AGRONOMY[id]?.family === ag.family;
  const candidates: { name: string; date: string }[] = [];
  for (const h of harvestLog) {
    const here = h.bedId ? h.bedId === bedId : h.bedName === bedName;
    if (!here || !sameFamily(h.cropId)) continue;
    if (lastRefresh && h.harvestDate <= lastRefresh) continue;
    candidates.push({ name: h.cropName, date: h.harvestDate });
  }
  // 今育っている同じ科の株（収穫前でも土は使っている）
  for (const p of plants) {
    if (p.bedId !== bedId || !sameFamily(p.cropId)) continue;
    if (lastRefresh && p.plantedDate <= lastRefresh) continue;
    candidates.push({ name: findCrop(p.cropId)?.name ?? p.projectName, date: p.plantedDate });
  }
  const last = candidates.sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!last) return null;
  const monthsAgo = daysBetween(last.date, today) / 30.4;
  const monthsLeft = Math.ceil(years * 12 - monthsAgo);
  if (monthsLeft <= 0) return null;
  const crop = findCrop(cropId);
  return {
    family: ag.family,
    lastCrop: last.name,
    lastDate: last.date,
    years,
    monthsLeft,
    message: `${bedName}では${last.date.slice(0, 7).replace("-", "/")}に同じ${ag.family}の${last.name}を育てています。${crop?.name ?? ""}は${years}年空けるのが目安（あと約${monthsLeft}か月）。別の場所か、土を替えてから。`,
  };
};
