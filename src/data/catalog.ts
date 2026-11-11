import type { Category, Crop, Pollination, PlantRef, SoilTypeId, Variety } from "../types";
import { VEGETABLES } from "./vegetables";
import { MORE_VEGETABLES } from "./moreVegetables";
import { FRUITS } from "./fruits";

export const CROPS: readonly Crop[] = [...VEGETABLES, ...MORE_VEGETABLES, ...FRUITS];

const CROP_BY_ID = new Map(CROPS.map((c) => [c.id, c]));

export const findCrop = (cropId: string): Crop | undefined => CROP_BY_ID.get(cropId);

/** 品種が見つからなければ先頭品種にフォールバックする（旧データ救済） */
export const varietyOf = (crop: Crop, varietyId: string | undefined): Variety =>
  crop.varieties.find((v) => v.id === varietyId) ?? crop.varieties[0];

export const pollinationOf = (crop: Crop, variety: Variety): Pollination =>
  variety.pollination ?? crop.pollination;

export const resolve = (ref: PlantRef): { crop: Crop; variety: Variety } | undefined => {
  const crop = findCrop(ref.cropId);
  return crop && { crop, variety: varietyOf(crop, ref.varietyId) };
};

export const CATEGORIES: readonly Category[] = ["果菜", "葉物", "根菜", "ハーブ", "ベリー", "果樹"];

export interface SoilType {
  id: SoilTypeId;
  label: string;
  emoji: string;
  /** 土の栄養(NPK)を管理するか */
  hasNutrient: boolean;
  /** 水やり間隔の倍率（地植えは乾きにくい） */
  waterMult: number;
  desc: string;
}

export const SOIL_TYPES: readonly SoilType[] = [
  { id: "planter", label: "プランター", emoji: "🪴", hasNutrient: true, waterMult: 1, desc: "ベランダや玄関先で手軽に。土の量が限られるので追肥がカギ。" },
  { id: "field", label: "畑（地植え）", emoji: "🌾", hasNutrient: true, waterMult: 2, desc: "根を広く張れて大きく育つ。連作障害に注意し、輪作・堆肥で地力を保つ。" },
  { id: "hydro", label: "水耕栽培", emoji: "💧", hasNutrient: false, waterMult: 1.5, desc: "土を使わず液体肥料で育てる。清潔で病害虫が少ない。葉物やハーブが得意。" },
];

const SOIL_BY_ID: Record<SoilTypeId, SoilType> = {
  planter: SOIL_TYPES[0]!,
  field: SOIL_TYPES[1]!,
  hydro: SOIL_TYPES[2]!,
};

export const soilType = (id: SoilTypeId): SoilType => SOIL_BY_ID[id];

export const canGrowIn = (crop: Crop, soil: SoilTypeId): boolean =>
  !crop.soils || crop.soils.includes(soil);

/** 名前を省略したときのプロジェクト名。品種名の補足（系統・雌雄など）は落として短くする */
export const defaultProjectName = (crop: Crop, variety: Variety): string =>
  `${crop.name}（${variety.name.replace(/（[^）]*）$/, "")}）`;
