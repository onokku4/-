import type { BadgeId, Bed, CareEvent, CareKind, Condition, DiaryEntry, GardenLocation, GardenState, GrowthStage, HarvestRecord, Photo, Plant, SoilTypeId, WeatherLog, WeatherState } from "../types";
import { defaultProjectName, findCrop, varietyOf } from "../data/catalog";
import { BADGES } from "../data/game";
import { initialState } from "./garden";
import { CONDITIONS, DEFAULT_WEATHER, clampTemp, roundCoord } from "./weather";
import { findFertilizer } from "../data/fertilizers";
import { findSoilMix } from "../data/soils";

export const STORE_KEY = "sodateru-niwa:v2";

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const strOrNull = (v: unknown): string | null => (typeof v === "string" ? v : null);
const num = (v: unknown, fallback = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const list = (v: unknown): Raw[] => (Array.isArray(v) ? v.filter(isObj) : []);
const pct = (v: unknown): number => Math.min(100, Math.max(0, num(v, 100)));

const SOILS: readonly SoilTypeId[] = ["planter", "field", "hydro"];
const isSoil = (v: unknown): v is SoilTypeId => SOILS.includes(v as SoilTypeId);
const isCondition = (v: unknown): v is Condition => CONDITIONS.some((c) => c.id === v);
const isBadge = (v: unknown): v is BadgeId => {
  if (typeof v !== "string") return false;
  if (BADGES.some((b) => b.id === v)) return true;
  const m = /^crop(10)?:(.+)$/.exec(v);
  return m !== null && findCrop(m[2]!) !== undefined;
};

const toBed = (r: Raw): Bed | undefined =>
  typeof r.id === "string"
    ? {
        id: r.id,
        name: str(r.name, "プランター"),
        type: isSoil(r.type) ? r.type : "planter",
        uses: num(r.uses),
        n: pct(r.n),
        p: pct(r.p),
        k: pct(r.k),
        soilMix: findSoilMix(str(r.soilMix))?.id ?? null,
        nutrientsAt: strOrNull(r.nutrientsAt),
        fedAt: strOrNull(r.fedAt),
        fertilizer: findFertilizer(str(r.fertilizer))?.id ?? null,
      }
    : undefined;

/** カタログにない作物・存在しない場所を指す株は捨てる */
const toPlant = (r: Raw, bedIds: Set<string>, fallbackBed: string): Plant | undefined => {
  const crop = findCrop(str(r.cropId));
  if (!crop || typeof r.uid !== "string" || typeof r.plantedDate !== "string") return undefined;
  const variety = varietyOf(crop, str(r.varietyId) || undefined);
  const bedId = str(r.bedId);
  return {
    uid: r.uid,
    cropId: crop.id,
    varietyId: variety.id,
    projectName: str(r.projectName) || defaultProjectName(crop, variety),
    plantedDate: r.plantedDate,
    lastWater: strOrNull(r.lastWater),
    bedId: bedIds.has(bedId) ? bedId : fallbackBed,
    harvestCount: num(r.harvestCount),
    waterAdjust: Math.min(2, Math.max(0.5, num(r.waterAdjust, 1))),
  };
};

const toRecord = (r: Raw): HarvestRecord | undefined =>
  typeof r.id === "string" && typeof r.harvestDate === "string"
    ? {
        id: r.id,
        cropId: str(r.cropId),
        bedId: strOrNull(r.bedId),
        count: typeof r.count === "number" && r.count > 0 ? Math.round(r.count) : null,
        grams: typeof r.grams === "number" && r.grams > 0 ? Math.round(r.grams) : null,
        cropName: str(r.cropName, "作物"),
        varietyName: str(r.varietyName),
        projectName: str(r.projectName) || str(r.cropName, "作物"),
        emoji: str(r.emoji, "🌱"),
        bedName: str(r.bedName),
        soilLabel: str(r.soilLabel),
        plantedDate: str(r.plantedDate, r.harvestDate),
        harvestDate: r.harvestDate,
        days: num(r.days),
      }
    : undefined;

/** v1 は天気を文字列1つ（hot/cold含む）で持っていた */
const toWeather = (v: unknown): WeatherState => {
  if (typeof v === "string") {
    if (v === "hot") return { current: { condition: "sunny", tempC: 33 }, auto: null };
    if (v === "cold") return { current: { condition: "cloudy", tempC: 3 }, auto: null };
    return isCondition(v) ? { current: { condition: v, tempC: 20 }, auto: null } : DEFAULT_WEATHER;
  }
  if (!isObj(v) || !isObj(v.current) || !isCondition(v.current.condition)) return DEFAULT_WEATHER;
  const current = { condition: v.current.condition, tempC: clampTemp(num(v.current.tempC, 20)) };
  const a = v.auto;
  const auto =
    isObj(a) && isCondition(a.condition) && typeof a.fetchedAt === "string"
      ? { condition: a.condition, tempC: clampTemp(num(a.tempC, 20)), fetchedAt: a.fetchedAt }
      : null;
  return { current, auto };
};

const defined = <T>(v: T | undefined): v is T => v !== undefined;

const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const CARE_KINDS: readonly CareKind[] = ["water", "feed", "refresh"];
const isCareKind = (v: unknown): v is CareKind => CARE_KINDS.includes(v as CareKind);

const toWeatherLog = (v: unknown): WeatherLog => {
  if (!isObj(v)) return {};
  const out: WeatherLog = {};
  for (const [date, d] of Object.entries(v)) {
    if (!isDate(date) || !isObj(d) || !isCondition(d.condition)) continue;
    out[date] = {
      condition: d.condition,
      maxC: clampTemp(num(d.maxC, 20)),
      minC: clampTemp(num(d.minC, 20)),
      rainMm: Math.max(0, num(d.rainMm)),
      source: d.source === "manual" ? "manual" : "auto",
    };
  }
  return out;
};

const toLocation = (v: unknown): GardenLocation | null => {
  if (!isObj(v) || typeof v.lat !== "number" || typeof v.lon !== "number") return null;
  if (!Number.isFinite(v.lat) || !Number.isFinite(v.lon) || Math.abs(v.lat) > 90 || Math.abs(v.lon) > 180) return null;
  return { lat: roundCoord(v.lat), lon: roundCoord(v.lon), registeredAt: str(v.registeredAt) };
};

const toStage = (r: Raw): GrowthStage | undefined =>
  typeof r.label === "string" ? { label: r.label, emoji: str(r.emoji, "🌱"), day: Math.max(0, num(r.day)) } : undefined;

/** 場所を消しても写真は残す（画面では「削除された場所」と出る） */
const toPhoto = (r: Raw): Photo | undefined =>
  typeof r.id === "string" && isDate(r.date) && typeof r.bedId === "string"
    ? { id: r.id, bedId: r.bedId, date: r.date, note: str(r.note), stages: list(r.stages).map(toStage).filter(defined), tags: strList(r.tags) }
    : undefined;

const strList = (v: unknown): string[] => (Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === "string"))] : []);

const toDiary = (r: Raw, plantUids: Set<string>): DiaryEntry | undefined =>
  typeof r.id === "string" && isDate(r.date) && typeof r.text === "string" && r.text.trim()
    ? { id: r.id, date: r.date, text: r.text, plantUid: typeof r.plantUid === "string" && plantUids.has(r.plantUid) ? r.plantUid : null, tags: strList(r.tags) }
    : undefined;

const toCare = (r: Raw): CareEvent | undefined =>
  isDate(r.date) && isCareKind(r.kind) ? { date: r.date, kind: r.kind, label: str(r.label) } : undefined;

/** 保存データ（旧形式・壊れた値を含む）を現在の GardenState に正規化する */
export function normalize(raw: unknown): GardenState {
  const base = initialState();
  if (!isObj(raw)) return base;
  const beds = list(raw.beds).map(toBed).filter(defined);
  const safeBeds = beds.length > 0 ? beds : base.beds;
  const bedIds = new Set(safeBeds.map((b) => b.id));
  const plants = list(raw.plants).map((p) => toPlant(p, bedIds, safeBeds[0]!.id)).filter(defined);
  const plantUids = new Set(plants.map((p) => p.uid));
  return {
    plants,
    beds: safeBeds,
    harvestLog: list(raw.harvestLog).map(toRecord).filter(defined),
    xp: Math.max(0, num(raw.xp)),
    streak: Math.max(0, num(raw.streak)),
    lastCareDate: strOrNull(raw.lastCareDate),
    waterCount: Math.max(0, num(raw.waterCount)),
    earnedBadges: Array.isArray(raw.earnedBadges) ? [...new Set(raw.earnedBadges.filter(isBadge))] : [],
    weather: toWeather(raw.weather),
    weatherLog: toWeatherLog(raw.weatherLog),
    careLog: list(raw.careLog).map(toCare).filter(defined),
    location: toLocation(raw.location),
    photos: list(raw.photos).map(toPhoto).filter(defined),
    diary: list(raw.diary).map((d) => toDiary(d, plantUids)).filter(defined),
    lastBackupAt: strOrNull(raw.lastBackupAt),
    autoWeather: raw.autoWeather === true,
    notifyOn: raw.notifyOn === true,
    notifyTime: /^\d{2}:\d{2}$/.test(str(raw.notifyTime)) ? str(raw.notifyTime) : base.notifyTime,
    lastNotifyDate: strOrNull(raw.lastNotifyDate),
  };
}

export function load(): GardenState {
  try {
    const text = localStorage.getItem(STORE_KEY);
    return text ? normalize(JSON.parse(text)) : initialState();
  } catch {
    return initialState();
  }
}

/** 保存できなければ false（容量超過やプライベートモードなど） */
export function save(state: GardenState): boolean {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
