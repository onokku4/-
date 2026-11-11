import type { Bed, Crop, Nutrients, SoilTypeId } from "../types";
import { soilType } from "../data/catalog";

export const NUTRIENTS: readonly { key: keyof Nutrients; label: string; short: string; color: string; role: string }[] = [
  { key: "n", label: "窒素", short: "N", color: "#5a9b4f", role: "葉を育てる" },
  { key: "p", label: "リン酸", short: "P", color: "#c98b3a", role: "花・実をつける" },
  { key: "k", label: "カリ", short: "K", color: "#5b8aa6", role: "根を丈夫に" },
];

const CONSUME_RATE = 1.4;
export const OVERUSE_THRESHOLD = 4;

export const newBed = (id: string, name: string, type: SoilTypeId = "planter"): Bed => ({
  id,
  name,
  type,
  uses: 0,
  n: 100,
  p: 100,
  k: 100,
});

export interface SoilHealth {
  label: "肥沃" | "やや痩せ気味" | "痩せている" | "要・土替え";
  color: string;
  advice: string;
}

export const soilHealth = (bed: Nutrients): SoilHealth => {
  const avg = (bed.n + bed.p + bed.k) / 3;
  if (avg >= 70) return { label: "肥沃", color: "#5a9b4f", advice: "良い状態です。このまま栽培OK。" };
  if (avg >= 45) return { label: "やや痩せ気味", color: "#c9a23a", advice: "追肥（液肥や化成肥料）を足すと安心。" };
  if (avg >= 25) return { label: "痩せている", color: "#cc7a33", advice: "堆肥をすき込み、不足の栄養を補給して。" };
  return { label: "要・土替え", color: "#c0432a", advice: "連用しすぎ。土をリフレッシュしましょう。" };
};

/** 収穫1回ぶんの消耗。水耕は栄養を液肥で管理するので回数だけ数える */
export const afterHarvest = (bed: Bed, crop: Crop): Bed => {
  const used = { ...bed, uses: bed.uses + 1 };
  if (!soilType(bed.type).hasNutrient) return used;
  const drain = (key: keyof Nutrients) => Math.max(0, bed[key] - crop.feed[key] * CONSUME_RATE);
  return { ...used, n: drain("n"), p: drain("p"), k: drain("k") };
};

export const refreshed = (bed: Bed): Bed => ({ ...bed, uses: 0, n: 100, p: 100, k: 100 });
