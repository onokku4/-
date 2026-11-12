import type { BadgeId, Bed, CareEvent, GardenState, Plant, SoilTypeId, WeatherLog, WeatherReading } from "../types";
import { canGrowIn, defaultProjectName, findCrop, pollinationOf, resolve, soilType, varietyOf } from "../data/catalog";
import { GREEN_THUMB_XP, XP } from "../data/game";
import { daysBetween } from "./date";
import { diagnose } from "./pollination";
import { growthStages } from "./photos";
import { afterHarvest, fed, newBed, refreshed } from "./soil";
import { DEFAULT_WEATHER, adjust, applyAuto, manualDaily, mergeLog, resetToAuto } from "./weather";

/** 状態遷移はすべてここを通す。純粋関数なので日付とIDは呼び出し側が渡す */
export type Action =
  | { type: "plant"; uid: string; cropId: string; varietyId: string; projectName: string; plantedDate: string; bedId: string; today: string }
  | { type: "water"; uid: string; today: string }
  | { type: "harvest"; uid: string; recordId: string; today: string }
  | { type: "remove"; uid: string }
  | { type: "addBed"; id: string; soil: SoilTypeId; name?: string; soilMix?: string; today: string }
  | { type: "refreshBed"; bedId: string; today: string; soilMix?: string }
  | { type: "feedBed"; bedId: string; fertilizer: string; today: string }
  | { type: "weatherAuto"; reading: WeatherReading; fetchedAt: string; daily?: WeatherLog }
  | { type: "weatherBackfill"; daily: WeatherLog }
  | { type: "setLocation"; lat: number; lon: number; today: string }
  | { type: "addPhoto"; id: string; bedId: string; date: string; note: string; today: string }
  | { type: "removePhoto"; id: string }
  | { type: "setPhotoNote"; id: string; note: string }
  | { type: "clearLocation" }
  | { type: "weatherAdjust"; patch: Partial<WeatherReading>; today: string }
  | { type: "weatherReset"; today: string }
  | { type: "setAutoWeather"; on: boolean }
  | { type: "setNotify"; on: boolean }
  | { type: "setNotifyTime"; time: string }
  | { type: "notified"; today: string };

export interface Outcome {
  state: GardenState;
  toast?: string;
  newBadges: BadgeId[];
}

export const initialState = (bedId = "bed_1"): GardenState => ({
  plants: [],
  beds: [newBed(bedId, "プランターA")],
  harvestLog: [],
  xp: 0,
  streak: 0,
  lastCareDate: null,
  waterCount: 0,
  earnedBadges: [],
  weather: DEFAULT_WEATHER,
  weatherLog: {},
  careLog: [],
  location: null,
  photos: [],
  autoWeather: false,
  notifyOn: false,
  notifyTime: "07:00",
  lastNotifyDate: null,
});

const quiet = (state: GardenState): Outcome => ({ state, newBadges: [] });

/** 世話の記録を足す（カレンダー用）。同じ日・同じ種類・同じ対象は1件にまとめる */
const logged = (s: GardenState, ev: CareEvent): GardenState =>
  s.careLog.some((e) => e.date === ev.date && e.kind === ev.kind && e.label === ev.label) ? s : { ...s, careLog: [...s.careLog, ev] };

/** 自動取得した「今日」の記録がなければ、手動の値を今日の天気として記録する */
const logManual = (s: GardenState, today: string): GardenState => ({
  ...s,
  weatherLog: { ...s.weatherLog, [today]: manualDaily(s.weather.current) },
});

/** 世話をした日の記録。XP加算と連続日数の更新 */
const cared = (s: GardenState, xp: number, today: string): GardenState => {
  if (s.lastCareDate === today) return { ...s, xp: s.xp + xp };
  const consecutive = s.lastCareDate !== null && daysBetween(s.lastCareDate, today) === 1;
  return { ...s, xp: s.xp + xp, streak: consecutive ? s.streak + 1 : 1, lastCareDate: today };
};

/** 条件を満たした未獲得バッジを付与する */
const award = (before: GardenState, after: GardenState, extra: BadgeId[] = []): Outcome & { state: GardenState } => {
  const earned: BadgeId[] = [...extra];
  if (after.plants.length > 0) earned.push("first");
  if (after.waterCount >= 10) earned.push("water10");
  if (after.streak >= 7) earned.push("streak7");
  if (new Set(after.plants.map((p) => p.cropId)).size >= 5) earned.push("variety5");
  if (after.harvestLog.length > 0) earned.push("harvest");
  if (after.xp >= GREEN_THUMB_XP) earned.push("green");
  if (after.plants.some((p) => findCrop(p.cropId)?.perennial)) earned.push("fruit");
  const newBadges = [...new Set(earned)].filter((b) => !before.earnedBadges.includes(b));
  return {
    state: newBadges.length ? { ...after, earnedBadges: [...after.earnedBadges, ...newBadges] } : after,
    newBadges,
  };
};

/** 相手が必要な品種（他家受粉・雌雄異株）で、相手が揃った株が庭にあるか */
const hasMatchedPair = (plants: Plant[]): boolean =>
  plants.some((p) => {
    const r = resolve(p);
    if (!r) return false;
    const kind = pollinationOf(r.crop, r.variety).kind;
    if (kind !== "cross" && kind !== "dioecious") return false;
    return diagnose(p, plants.filter((o) => o.uid !== p.uid))?.verdict === "ok";
  });

const bedLabel = (beds: Bed[], soil: SoilTypeId): string => {
  const count = beds.filter((b) => b.type === soil).length;
  return `${soilType(soil).label.replace(/（.*）/, "")}${String.fromCharCode(65 + (count % 26))}`;
};

export function apply(s: GardenState, a: Action): Outcome {
  switch (a.type) {
    case "plant": {
      const crop = findCrop(a.cropId);
      const bed = s.beds.find((b) => b.id === a.bedId);
      if (!crop || !bed) return quiet(s);
      if (!canGrowIn(crop, bed.type)) {
        return { ...quiet(s), toast: `${crop.name}は${soilType(bed.type).label}では育てられません` };
      }
      const variety = varietyOf(crop, a.varietyId);
      const plant: Plant = {
        uid: a.uid,
        cropId: crop.id,
        varietyId: variety.id,
        projectName: a.projectName.trim() || defaultProjectName(crop, variety),
        plantedDate: a.plantedDate,
        lastWater: null,
        bedId: a.bedId,
        harvestCount: 0,
      };
      const plants = [...s.plants, plant];
      const next = cared({ ...s, plants }, XP.plant, a.today);
      const out = award(s, next, hasMatchedPair(plants) ? ["matchmaker"] : []);
      return { ...out, toast: `${crop.emoji} 「${plant.projectName}」を植えました！ +${XP.plant}XP` };
    }

    case "water": {
      if (!s.plants.some((p) => p.uid === a.uid)) return quiet(s);
      const plant = s.plants.find((p) => p.uid === a.uid)!;
      const plants = s.plants.map((p) => (p.uid === a.uid ? { ...p, lastWater: a.today } : p));
      const next = cared(logged({ ...s, plants, waterCount: s.waterCount + 1 }, { date: a.today, kind: "water", label: plant.projectName }), XP.water, a.today);
      return { ...award(s, next), toast: `💧 水やり完了！ +${XP.water}XP` };
    }

    case "harvest": {
      const plant = s.plants.find((p) => p.uid === a.uid);
      const r = plant && resolve(plant);
      if (!plant || !r) return quiet(s);
      const bed = s.beds.find((b) => b.id === plant.bedId);
      const record = {
        id: a.recordId,
        cropId: r.crop.id,
        cropName: r.crop.name,
        varietyName: r.variety.name,
        projectName: plant.projectName,
        emoji: r.crop.emoji,
        bedName: bed?.name ?? "（不明な場所）",
        soilLabel: bed ? soilType(bed.type).label : "",
        plantedDate: plant.plantedDate,
        harvestDate: a.today,
        days: Math.max(0, daysBetween(plant.plantedDate, a.today)),
      };
      // 多年生は株を残して収穫回数だけ増やす。一年生は片付ける
      const plants = r.crop.perennial
        ? s.plants.map((p) => (p.uid === a.uid ? { ...p, harvestCount: p.harvestCount + 1 } : p))
        : s.plants.filter((p) => p.uid !== a.uid);
      const growing = s.plants.filter((p) => p.bedId === bed?.id).length;
      const beds = s.beds.map((b) => (b.id === bed?.id ? afterHarvest(b, r.crop, growing, a.today) : b));
      const next = cared({ ...s, plants, beds, harvestLog: [record, ...s.harvestLog] }, XP.harvest, a.today);
      return { ...award(s, next), toast: `🧺 「${plant.projectName}」を収穫！履歴に記録 +${XP.harvest}XP` };
    }

    case "remove": {
      const plant = s.plants.find((p) => p.uid === a.uid);
      if (!plant) return quiet(s);
      return { state: { ...s, plants: s.plants.filter((p) => p.uid !== a.uid) }, newBadges: [], toast: `「${plant.projectName}」を片付けました` };
    }

    case "addBed": {
      const name = a.name?.trim() || bedLabel(s.beds, a.soil);
      return {
        state: { ...s, beds: [...s.beds, newBed(a.id, name, a.soil, a.soilMix ?? null, a.today)] },
        newBadges: [],
        toast: `${soilType(a.soil).emoji} 「${name}」を追加しました`,
      };
    }

    case "refreshBed": {
      const bed = s.beds.find((b) => b.id === a.bedId);
      if (!bed) return quiet(s);
      const beds = s.beds.map((b) => (b.id === a.bedId ? refreshed(b, a.today, a.soilMix) : b));
      const what = bed.type === "hydro" ? "培養液を交換しました" : a.soilMix ? "土を記録しました" : "土をリフレッシュしました";
      const next = logged({ ...s, beds }, { date: a.today, kind: "refresh", label: bed.name });
      return { ...award(s, cared(next, XP.refresh, a.today)), toast: `♻️ ${what}！ +${XP.refresh}XP` };
    }

    case "feedBed": {
      const bed = s.beds.find((b) => b.id === a.bedId);
      if (!bed) return quiet(s);
      const growing = s.plants.filter((p) => p.bedId === a.bedId).length;
      const next = fed(bed, a.fertilizer, growing, a.today);
      if (!next) return quiet(s);
      const beds = s.beds.map((b) => (b.id === a.bedId ? next : b));
      const after = logged({ ...s, beds }, { date: a.today, kind: "feed", label: bed.name });
      return { ...award(s, cared(after, XP.feed, a.today)), toast: `🌱 「${bed.name}」に追肥しました！ +${XP.feed}XP` };
    }

    case "weatherAuto":
      return quiet({ ...s, weather: applyAuto(a.reading, a.fetchedAt), weatherLog: mergeLog(s.weatherLog, a.daily ?? {}) });
    case "addPhoto": {
      const bed = s.beds.find((b) => b.id === a.bedId);
      if (!bed || s.photos.some((p) => p.id === a.id)) return quiet(s);
      const photo = { id: a.id, bedId: a.bedId, date: a.date, note: a.note.trim(), stages: growthStages(s.plants, a.bedId, a.date) };
      const next = cared({ ...s, photos: [...s.photos, photo] }, XP.photo, a.today);
      return { ...award(s, next), toast: `📷 「${bed.name}」の様子を記録しました +${XP.photo}XP` };
    }
    case "removePhoto":
      return s.photos.some((p) => p.id === a.id) ? { state: { ...s, photos: s.photos.filter((p) => p.id !== a.id) }, newBadges: [], toast: "写真を削除しました" } : quiet(s);
    case "setPhotoNote":
      return quiet({ ...s, photos: s.photos.map((p) => (p.id === a.id ? { ...p, note: a.note.trim() } : p)) });
    case "weatherBackfill":
      return quiet({ ...s, weatherLog: mergeLog(s.weatherLog, a.daily) });
    case "setLocation":
      return quiet({ ...s, location: { lat: a.lat, lon: a.lon, registeredAt: a.today }, autoWeather: true });
    case "clearLocation":
      return quiet({ ...s, location: null });
    case "weatherAdjust":
      return quiet(logManual({ ...s, weather: adjust(s.weather, a.patch) }, a.today));
    case "weatherReset": {
      // 自動値に戻すので、今日の手動記録も自動値に戻す
      const weather = resetToAuto(s.weather);
      const auto = weather.auto;
      const log = { ...s.weatherLog };
      if (auto) log[a.today] = { ...manualDaily({ condition: auto.condition, tempC: auto.tempC }), source: "auto" };
      return quiet({ ...s, weather, weatherLog: log });
    }
    case "setAutoWeather":
      return quiet({ ...s, autoWeather: a.on });
    case "setNotify":
      return quiet({ ...s, notifyOn: a.on });
    case "setNotifyTime":
      return quiet(/^\d{2}:\d{2}$/.test(a.time) ? { ...s, notifyTime: a.time } : s);
    case "notified":
      return quiet({ ...s, lastNotifyDate: a.today });
  }
}
