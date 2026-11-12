import type { Family } from "../types";

/** 作物の科と、中間地での植え付け（苗）・種まきの月。地域で前後する（lib/season.ts） */
export interface Agronomy {
  family: Family;
  /** 植え付け・種まきに向く月（1〜12）。多年生は苗を植える時期 */
  plantMonths: number[];
}

/** 同じ科を続けて育てるまでに空けたい年数。0 は連作障害が出にくい */
export const ROTATION_YEARS: Record<Family, number> = {
  ナス科: 4,
  ウリ科: 2,
  アブラナ科: 1,
  マメ科: 2,
  セリ科: 1,
  キク科: 1,
  ヒユ科: 1,
  シソ科: 0,
  ヒガンバナ科: 0,
  イネ科: 0,
  アオイ科: 1,
  バラ科: 0,
  ツツジ科: 0,
  ミカン科: 0,
  クワ科: 0,
  マタタビ科: 0,
  モクセイ科: 0,
};

export const AGRONOMY: Record<string, Agronomy> = {
  tomato: { family: "ナス科", plantMonths: [4, 5] },
  eggplant: { family: "ナス科", plantMonths: [4, 5] },
  pepper: { family: "ナス科", plantMonths: [4, 5] },
  potato: { family: "ナス科", plantMonths: [2, 3, 8, 9] },
  cucumber: { family: "ウリ科", plantMonths: [4, 5, 6] },
  zucchini: { family: "ウリ科", plantMonths: [4, 5] },
  kabocha: { family: "ウリ科", plantMonths: [4, 5] },
  goya: { family: "ウリ科", plantMonths: [5, 6] },
  lettuce: { family: "キク科", plantMonths: [3, 4, 9, 10] },
  spinach: { family: "ヒユ科", plantMonths: [3, 4, 9, 10, 11] },
  komatsuna: { family: "アブラナ科", plantMonths: [3, 4, 5, 9, 10, 11] },
  radish: { family: "アブラナ科", plantMonths: [3, 4, 5, 9, 10] },
  carrot: { family: "セリ科", plantMonths: [3, 4, 7, 8] },
  negi: { family: "ヒガンバナ科", plantMonths: [3, 4, 9, 10] },
  corn: { family: "イネ科", plantMonths: [4, 5] },
  edamame: { family: "マメ科", plantMonths: [4, 5, 6] },
  okra: { family: "アオイ科", plantMonths: [5, 6] },
  basil: { family: "シソ科", plantMonths: [4, 5, 6] },
  mint: { family: "シソ科", plantMonths: [3, 4, 5, 9, 10] },
  shiso: { family: "シソ科", plantMonths: [4, 5] },
  strawberry: { family: "バラ科", plantMonths: [10, 11] },
  raspberry: { family: "バラ科", plantMonths: [11, 12, 2, 3] },
  blackberry: { family: "バラ科", plantMonths: [11, 12, 2, 3] },
  blueberry: { family: "ツツジ科", plantMonths: [11, 12, 2, 3] },
  lemon: { family: "ミカン科", plantMonths: [3, 4] },
  yuzu: { family: "ミカン科", plantMonths: [3, 4] },
  kumquat: { family: "ミカン科", plantMonths: [3, 4] },
  mikan: { family: "ミカン科", plantMonths: [3, 4] },
  fig: { family: "クワ科", plantMonths: [11, 12, 2, 3] },
  kiwi: { family: "マタタビ科", plantMonths: [11, 12, 2, 3] },
  olive: { family: "モクセイ科", plantMonths: [3, 4, 5] },
};

/** 写真・日記に付けるタグ。病害虫は pest、生育の節目は stage */
export const PHOTO_TAGS: readonly { id: string; label: string; kind: "pest" | "stage" }[] = [
  { id: "powdery", label: "うどんこ病", kind: "pest" },
  { id: "aphid", label: "アブラムシ", kind: "pest" },
  { id: "mite", label: "ハダニ", kind: "pest" },
  { id: "caterpillar", label: "アオムシ・イモムシ", kind: "pest" },
  { id: "rot", label: "尻腐れ・実の腐れ", kind: "pest" },
  { id: "scorch", label: "葉焼け・水切れ", kind: "pest" },
  { id: "yellow", label: "葉が黄色い", kind: "pest" },
  { id: "bird", label: "鳥・獣の害", kind: "pest" },
  { id: "sprout", label: "発芽", kind: "stage" },
  { id: "flower", label: "開花", kind: "stage" },
  { id: "fruitset", label: "結実", kind: "stage" },
  { id: "ripe", label: "色づき", kind: "stage" },
  { id: "repot", label: "植え替え", kind: "stage" },
  { id: "prune", label: "剪定・摘芯", kind: "stage" },
];
export const tagLabel = (id: string): string => PHOTO_TAGS.find((t) => t.id === id)?.label ?? id;
