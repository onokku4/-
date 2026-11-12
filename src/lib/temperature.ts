import type { Category, Crop, DailyWeather, Plant, TempRange } from "../types";
import { resolve } from "../data/catalog";

/** カテゴリごとの生育適温の既定（℃）。作物の tempRange があればそちら */
export const TEMP_BY_CATEGORY: Record<Category, TempRange> = {
  果菜: { min: 15, max: 30 },
  葉物: { min: 10, max: 23 },
  根菜: { min: 12, max: 25 },
  ハーブ: { min: 12, max: 28 },
  ベリー: { min: 8, max: 28 },
  果樹: { min: 10, max: 32 },
};

export const tempRangeOf = (crop: Crop): TempRange => crop.tempRange ?? TEMP_BY_CATEGORY[crop.category];

export type TempKind = "ok" | "hot" | "cold";

export interface TempVerdict {
  kind: TempKind;
  range: TempRange;
  /** 「適温」「暑すぎ（+3℃）」のような短い表示 */
  label: string;
  advice: string;
}

/** 今の気温が作物に合っているか */
export const tempVerdict = (crop: Crop, tempC: number): TempVerdict => {
  const range = tempRangeOf(crop);
  // 落葉果樹・ベリーは冬の寒さで休眠するので、寒さは「防寒が必要な作物」だけ見る
  if (crop.perennial && tempC < range.min) {
    if (crop.coldTenderBelowC !== undefined && tempC < crop.coldTenderBelowC) {
      return { kind: "cold", range, label: `寒い（−${crop.coldTenderBelowC - tempC}℃）`, advice: "軒下・室内へ移すか、不織布で覆う。" };
    }
    return { kind: "ok", range, label: "休眠期", advice: "" };
  }
  if (tempC > range.max) {
    return { kind: "hot", range, label: `暑すぎ（+${tempC - range.max}℃）`, advice: "遮光ネットや半日陰へ。朝夕の水やりで土の温度を下げる。" };
  }
  if (tempC < range.min) {
    return { kind: "cold", range, label: `寒い（−${range.min - tempC}℃）`, advice: "軒下・室内へ移すか、不織布やビニールで覆う。水やりは控えめに。" };
  }
  return { kind: "ok", range, label: "適温", advice: "" };
};

export interface DayTempIssue {
  plant: Plant;
  verdict: TempVerdict;
}

/**
 * ある日の天気の記録に対して、どの株が暑すぎ／寒すぎだったか。
 * 暑さは最高気温、寒さは最低気温で判定する。その日に植わっていない株は見ない
 */
export const dayTempIssues = (plants: Plant[], weather: DailyWeather, date: string): DayTempIssue[] =>
  plants.flatMap((plant) => {
    if (plant.plantedDate > date) return [];
    const crop = resolve(plant)?.crop;
    if (!crop) return [];
    const hot = tempVerdict(crop, weather.maxC);
    if (hot.kind === "hot") return [{ plant, verdict: hot }];
    const cold = tempVerdict(crop, weather.minC);
    if (cold.kind === "cold") return [{ plant, verdict: cold }];
    return [];
  });
