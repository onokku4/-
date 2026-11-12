import type { Bed, GardenState, Plant, WeatherLog } from "../types";
import { findCrop, resolve } from "../data/catalog";
import { CATEGORY_GUIDES, CROP_GUIDES, type Gear, type Supply } from "../data/guides";
import { findSoilMix } from "../data/soils";
import { OVERUSE_THRESHOLD, feedSchedule } from "./soil";
import { tempVerdict } from "./temperature";
import { daysBetween } from "./date";

export interface Recommendation {
  /** 短い名前（「不織布」など） */
  name: string;
  /** なぜ今か */
  reason: string;
  /** 対象の株・場所 */
  for: string;
  urgency: "now" | "soon";
}

const addDays = (date: string, n: number): string => new Date(Date.parse(date) + n * 86_400_000).toISOString().slice(0, 10);

/** 明日の朝の予想最低気温がこれ以下なら霜注意 */
export const FROST_C = 3;

/** 明日の最低気温の予報が霜の恐れなら、その気温を返す */
export const frostTomorrow = (log: WeatherLog, today: string): number | null => {
  const t = log[addDays(today, 1)];
  return t && t.minC <= FROST_C ? t.minC : null;
};

/**
 * 今そろえる・補充すべき物。株の成長段階、場所の肥料残量、天気の予報から決める。
 * 道具の「あると楽」は出さず、今必要な物だけ
 */
export const recommendSupplies = (
  state: Pick<GardenState, "plants" | "beds" | "weatherLog" | "weather">,
  today: string,
): Recommendation[] => {
  const out: Recommendation[] = [];
  const push = (r: Recommendation) => {
    if (!out.some((o) => o.name === r.name && o.for === r.for)) out.push(r);
  };
  const bedOf = (p: Plant): Bed | undefined => state.beds.find((b) => b.id === p.bedId);
  const frost = frostTomorrow(state.weatherLog, today);
  const month = Number(today.slice(5, 7));

  for (const plant of state.plants) {
    const r = resolve(plant);
    if (!r) continue;
    const { crop, variety } = r;
    const age = daysBetween(plant.plantedDate, today);
    const bed = bedOf(plant);
    const who = plant.projectName;

    // 支柱・ネット：つる物・背の高い果菜は植えて2週間で必要
    if (["tomato", "cucumber", "eggplant", "goya", "kiwi", "blackberry", "raspberry"].includes(crop.id) && age >= 10 && age <= 40) {
      push({ name: crop.id === "cucumber" || crop.id === "goya" ? "ネット・トレリス" : "支柱と麻ひも", reason: "茎が伸びて倒れる前に誘引", for: who, urgency: age >= 20 ? "now" : "soon" });
    }
    // 葉物・エダマメ：防虫ネットは植えてすぐ
    if ((crop.category === "葉物" || crop.id === "edamame") && age <= 14) {
      push({ name: "防虫ネット（1mm目）", reason: "虫が来る前に張る", for: who, urgency: "now" });
    }
    // ベリー：収穫期の前月に防鳥ネット
    if (crop.category === "ベリー" && crop.harvestMonths?.some((m) => m === month || m === month + 1)) {
      push({ name: "防鳥ネット", reason: "色づく前に。鳥は人より早い", for: who, urgency: crop.harvestMonths.includes(month) ? "now" : "soon" });
    }
    // 寒さ：明日の霜予報 or 今の気温が低い
    const cold = tempVerdict(crop, state.weather.current.tempC).kind === "cold";
    if (crop.coldTenderBelowC !== undefined && (frost !== null || cold)) {
      push({ name: "不織布・防寒カバー", reason: frost !== null ? `明日の朝 ${frost}℃の予報` : "今日の気温が低い", for: who, urgency: "now" });
    }
    // 暑さ：遮光
    if (tempVerdict(crop, state.weather.current.tempC).kind === "hot") {
      push({ name: "遮光ネット・寒冷紗", reason: "暑すぎる日の葉焼け・水切れ対策", for: who, urgency: "soon" });
    }
    // 人工授粉
    const poll = variety.pollination ?? crop.pollination;
    if (poll.kind === "monoecious" && age >= 30) push({ name: "受粉用の筆（または朝の雄花）", reason: "実を確実につける", for: who, urgency: "soon" });
    // 実もの肥料：果菜の開花期
    if (crop.category === "果菜" && age >= 30 && age <= 90) push({ name: "実もの用肥料（リン酸・カリ多め）", reason: "花が咲いたら切り替え", for: who, urgency: "soon" });
    // 酸性土
    if (crop.acidSoil && bed) {
      const mix = findSoilMix(bed.soilMix);
      if (mix && !mix.acidic) push({ name: "ピートモス・ブルーベリー用土", reason: "酸性土に植え替える", for: who, urgency: "now" });
      push({ name: "硫安 か ブルーベリー用肥料", reason: "普通の化成だと土のpHが上がる", for: who, urgency: "soon" });
    }
    // 作物固有の資材
    for (const s of CROP_GUIDES[crop.id]?.supplies ?? []) push({ name: s.name, reason: s.when, for: who, urgency: "soon" });
  }

  for (const bed of state.beds) {
    const growing = state.plants.filter((p) => p.bedId === bed.id).length;
    const feed = feedSchedule(bed, growing, today);
    if (feed.due || (feed.daysLeft !== null && feed.daysLeft <= 7)) {
      push({ name: "追肥用の肥料（化成 8-8-8 か 液肥）", reason: feed.due ? "追肥どき" : `${feed.daysLeft}日後に追肥`, for: bed.name, urgency: feed.due ? "now" : "soon" });
    }
    if (bed.type !== "hydro" && bed.uses >= OVERUSE_THRESHOLD - 1) {
      push({ name: "新しい培養土・堆肥", reason: `連用${bed.uses}回。次の植え付け前に土替え`, for: bed.name, urgency: bed.uses >= OVERUSE_THRESHOLD ? "now" : "soon" });
    }
    if (bed.type === "hydro" && growing > 0) push({ name: "水耕用の液体肥料", reason: "週1回の交換ぶん", for: bed.name, urgency: "soon" });
  }

  return out.sort((a, b) => (a.urgency === b.urgency ? 0 : a.urgency === "now" ? -1 : 1));
};

/** 作物の道具・資材（カテゴリ共通＋その作物特有） */
export const gearFor = (cropId: string): { tools: Gear[]; supplies: Supply[] } => {
  const crop = findCrop(cropId);
  if (!crop) return { tools: [], supplies: [] };
  const cat = CATEGORY_GUIDES[crop.category];
  const own = CROP_GUIDES[cropId];
  const tools = [...(own?.tools ?? []), ...cat.tools.filter((t) => !own?.tools?.some((o) => o.name === t.name))];
  const supplies = [...(own?.supplies ?? []), ...cat.supplies.filter((s) => !own?.supplies?.some((o) => o.name === s.name))];
  return { tools, supplies };
};
