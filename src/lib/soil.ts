import type { Bed, Crop, Nutrients, SoilTypeId } from "../types";
import { soilType } from "../data/catalog";
import { findFertilizer } from "../data/fertilizers";
import { findSoilMix } from "../data/soils";
import { daysBetween } from "./date";

export const NUTRIENTS: readonly { key: keyof Nutrients; label: string; short: string; color: string; role: string }[] = [
  { key: "n", label: "窒素", short: "N", color: "#3ddc97", role: "葉を育てる" },
  { key: "p", label: "リン酸", short: "P", color: "#f5b942", role: "花・実をつける" },
  { key: "k", label: "カリ", short: "K", color: "#5aa9e6", role: "根を丈夫に" },
];

const CONSUME_RATE = 1.4;
export const OVERUSE_THRESHOLD = 4;

/** 1日あたりの栄養の減り（0〜100スケール）。雨や水やりでの流亡ぶん＋育っている株の吸収ぶん */
const LEACH_PER_DAY = 0.15;
const PLANT_PER_DAY = 0.35;
/** 畑は土の量が多いので減りがゆるやか */
const FIELD_FACTOR = 0.5;
/** 元肥の持続日数がわからないときの既定 */
const DEFAULT_LASTS = 30;
/** 栄養の平均がこれを下回ったら、日数に関係なく追肥どき */
export const FEED_LOW_AVG = 45;

const clamp = (v: number) => Math.min(100, Math.max(0, v));
const FULL: Nutrients = { n: 100, p: 100, k: 100 };

export const newBed = (id: string, name: string, type: SoilTypeId = "planter", soilMix: string | null = null, today: string | null = null): Bed => {
  const mix = findSoilMix(soilMix);
  const base = mix?.nutrients ?? FULL;
  return { id, name, type, uses: 0, ...base, soilMix: mix?.id ?? null, nutrientsAt: today, fedAt: mix ? today : null, fertilizer: null };
};

export interface SoilHealth {
  label: "肥沃" | "やや痩せ気味" | "痩せている" | "要・土替え";
  color: string;
  advice: string;
}

export const soilHealth = (bed: Nutrients): SoilHealth => {
  const avg = (bed.n + bed.p + bed.k) / 3;
  if (avg >= 70) return { label: "肥沃", color: "#3ddc97", advice: "良い状態です。このまま栽培OK。" };
  if (avg >= 45) return { label: "やや痩せ気味", color: "#f5b942", advice: "追肥（液肥や化成肥料）を足すと安心。" };
  if (avg >= 25) return { label: "痩せている", color: "#ff9a62", advice: "堆肥をすき込み、不足の栄養を補給して。" };
  return { label: "要・土替え", color: "#ff5b2e", advice: "連用しすぎ。土をリフレッシュしましょう。" };
};

/**
 * 今日時点の栄養。記録日からの経過日数ぶん、流亡と株の吸収で減らす。
 * 水耕・未記録はそのまま。保存値は変えず、表示と判定にだけ使う
 */
export const nutrientsOn = (bed: Bed, growing: number, today: string): Nutrients => {
  if (!soilType(bed.type).hasNutrient || bed.nutrientsAt === null) return { n: bed.n, p: bed.p, k: bed.k };
  const days = Math.max(0, daysBetween(bed.nutrientsAt, today));
  const perDay = (LEACH_PER_DAY + growing * PLANT_PER_DAY) * (bed.type === "field" ? FIELD_FACTOR : 1);
  const drop = days * perDay;
  return { n: clamp(bed.n - drop), p: clamp(bed.p - drop), k: clamp(bed.k - drop) };
};

/** 経過ぶんの減りを保存値に反映し、記録日を今日にする。栄養を変える操作の前に必ず通す */
const settled = (bed: Bed, growing: number, today: string): Bed => ({ ...bed, ...nutrientsOn(bed, growing, today), nutrientsAt: today });

/** 収穫1回ぶんの消耗。水耕は栄養を液肥で管理するので回数だけ数える */
export const afterHarvest = (bed: Bed, crop: Crop, growing: number, today: string): Bed => {
  const used = { ...bed, uses: bed.uses + 1 };
  if (!soilType(bed.type).hasNutrient) return used;
  const s = settled(used, growing, today);
  const drain = (key: keyof Nutrients) => clamp(s[key] - crop.feed[key] * CONSUME_RATE);
  return { ...s, n: drain("n"), p: drain("p"), k: drain("k") };
};

/** 土替え・培養液交換。soilMix を渡せばその土を入れたことにする（渡さなければ今の土の種類のまま） */
export const refreshed = (bed: Bed, today: string, soilMix: string | null = bed.soilMix): Bed => {
  const mix = findSoilMix(soilMix);
  const base = mix?.nutrients ?? FULL;
  return { ...bed, uses: 0, ...base, soilMix: mix?.id ?? null, nutrientsAt: today, fedAt: today, fertilizer: null };
};

/** 追肥。今日時点の残量に肥料ぶんを足す（上限100） */
export const fed = (bed: Bed, fertilizerId: string, growing: number, today: string): Bed | undefined => {
  const f = findFertilizer(fertilizerId);
  if (!f || !soilType(bed.type).hasNutrient) return undefined;
  const s = settled(bed, growing, today);
  return { ...s, n: clamp(s.n + f.add.n), p: clamp(s.p + f.add.p), k: clamp(s.k + f.add.k), fedAt: today, fertilizer: f.id };
};

export interface FeedSchedule {
  /** 追肥の目安日。株がない・水耕・判断材料なしは null */
  nextDate: string | null;
  /** 目安日までの日数（過ぎていれば負） */
  daysLeft: number | null;
  due: boolean;
  /** 画面にそのまま出せる一言 */
  note: string;
}

const addDays = (date: string, n: number): string => new Date(Date.parse(date) + n * 86_400_000).toISOString().slice(0, 10);
const md = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;

/** 次の追肥のタイミング。前回の肥料（元肥 or 追肥）の持続日数と、今日時点の栄養残量の両方で判定する */
export const feedSchedule = (bed: Bed, growing: number, today: string): FeedSchedule => {
  const none = (note: string): FeedSchedule => ({ nextDate: null, daysLeft: null, due: false, note });
  if (!soilType(bed.type).hasNutrient) return none("培養液で管理");
  if (growing === 0) return none("株を植えると追肥の目安が出ます");

  const cur = nutrientsOn(bed, growing, today);
  const avg = (cur.n + cur.p + cur.k) / 3;
  const fert = findFertilizer(bed.fertilizer);
  const mix = findSoilMix(bed.soilMix);
  const lasts = fert?.lasts ?? mix?.lasts ?? DEFAULT_LASTS;
  const since = bed.fedAt ?? bed.nutrientsAt;

  if (since === null) {
    // 肥料をいつ入れたか不明。残量だけで判断
    return avg < FEED_LOW_AVG
      ? { nextDate: today, daysLeft: 0, due: true, note: "栄養が減っています。追肥しましょう" }
      : none("追肥を記録すると次の目安が出ます");
  }
  const nextDate = addDays(since, lasts);
  const daysLeft = daysBetween(today, nextDate);
  const elapsed = daysBetween(since, today);
  const what = fert ? fert.name.replace(/（.*）/, "") : "元肥";
  if (avg < FEED_LOW_AVG) return { nextDate, daysLeft, due: true, note: `栄養が減っています（${what}から${elapsed}日）。追肥しましょう` };
  if (daysLeft <= 0) return { nextDate, daysLeft, due: true, note: `${what}の効き目が切れる頃です（${elapsed}日経過）。追肥しましょう` };
  if (daysLeft <= 3) return { nextDate, daysLeft, due: false, note: `次の追肥：${md(nextDate)}（あと${daysLeft}日）` };
  return { nextDate, daysLeft, due: false, note: `次の追肥：${md(nextDate)}頃（あと${daysLeft}日）` };
};

/** 酸性土が必要な作物が、酸性でない土に植わっているか */
export const acidMismatch = (bed: Bed, crops: Crop[]): boolean => {
  const mix = findSoilMix(bed.soilMix);
  return mix !== undefined && !mix.acidic && crops.some((c) => c.acidSoil);
};
