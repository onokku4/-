import type { Nutrients } from "../types";

/** 追肥の種類。add は1回の追肥で戻る栄養の目安（0〜100スケール）。lasts は効く日数の目安 */
export interface Fertilizer {
  id: string;
  name: string;
  desc: string;
  add: Nutrients;
  lasts: number;
}

export const FERTILIZERS: readonly Fertilizer[] = [
  { id: "liquid", name: "液体肥料（週1回）", desc: "即効性。薄めて水やり代わりに。効きは短いので1週間ごと。", add: { n: 15, p: 15, k: 15 }, lasts: 7 },
  { id: "chemical", name: "化成肥料 8-8-8（粒）", desc: "バランス型の定番。株元にひとつまみ。2〜3週間効く。", add: { n: 35, p: 35, k: 35 }, lasts: 21 },
  { id: "slow", name: "緩効性肥料（IB化成・マグァンプなど）", desc: "ゆっくり長く効く。1〜2か月に1回でよい。", add: { n: 45, p: 45, k: 45 }, lasts: 60 },
  { id: "organic", name: "有機肥料（油かす・鶏ふん・ぼかし）", desc: "じわじわ効き土も良くなる。窒素寄り。効き始めまで1〜2週間。", add: { n: 35, p: 25, k: 20 }, lasts: 45 },
  { id: "fruit", name: "実もの用（リン酸・カリ多め）", desc: "花つき・実つきを良くする。トマト・果樹の開花〜結実期に。", add: { n: 10, p: 35, k: 35 }, lasts: 21 },
  { id: "blueberry", name: "ブルーベリー用（酸性肥料）", desc: "硫安系で土を酸性に保つ。普通の化成だとpHが上がって弱る。", add: { n: 30, p: 30, k: 30 }, lasts: 30 },
];

const FERT_BY_ID = new Map(FERTILIZERS.map((f) => [f.id, f]));
export const findFertilizer = (id: string | null | undefined): Fertilizer | undefined =>
  id == null ? undefined : FERT_BY_ID.get(id);
