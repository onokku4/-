import { describe, expect, it } from "vitest";
import { AGRONOMY, PHOTO_TAGS } from "../src/data/agronomy";
import { CROPS } from "../src/data/catalog";
import { lastYearAround } from "../src/lib/calendar";
import { apply, initialState, type Action } from "../src/lib/garden";
import { gddEstimate } from "../src/lib/gdd";
import { harvestSummary } from "../src/lib/harvest";
import { rotationWarning } from "../src/lib/rotation";
import { cropsForMonth, inSeason, plantMonthsFor, regionOf } from "../src/lib/season";
import { normalize } from "../src/lib/storage";
import { plantStatus } from "../src/lib/watering";
import type { GardenState, WeatherLog } from "../src/types";

const T = "2026-11-12";
let seq = 0;
const plant = (cropId: string, varietyId: string, extra: Partial<Extract<Action, { type: "plant" }>> = {}): Action => ({
  type: "plant", uid: `a${++seq}`, cropId, varietyId, projectName: "", plantedDate: T, bedId: "bed_1", today: T, ...extra,
});
const run = (s: GardenState, ...actions: Action[]) => actions.reduce((st, a) => apply(st, a).state, s);
const bedArgs = (s: GardenState, cropId: string, today = T) => ({ bedId: "bed_1", bedName: "プランターA", bedType: "planter", cropId, harvestLog: s.harvestLog, plants: s.plants, careLog: s.careLog, today });

describe("科と適期のデータ", () => {
  it("全作物に科と植え付け月がある", () => {
    for (const c of CROPS) {
      expect(AGRONOMY[c.id], c.name).toBeDefined();
      expect(AGRONOMY[c.id]!.plantMonths.length, c.name).toBeGreaterThan(0);
    }
    expect(new Set(PHOTO_TAGS.map((t) => t.id)).size).toBe(PHOTO_TAGS.length);
  });
});

describe("連作障害の警告", () => {
  it("同じ場所で同じ科を4年以内に育てていたら警告。別の科は出ない", () => {
    const s0 = run(initialState(), plant("tomato", "aiko", { plantedDate: "2026-05-01" }));
    const s = run(s0, { type: "harvest", uid: s0.plants[0]!.uid, recordId: "h1", today: "2026-08-01" });
    expect(s.harvestLog[0]?.bedId).toBe("bed_1");
    const w = rotationWarning(bedArgs(s, "eggplant"));
    expect(w).toMatchObject({ family: "ナス科", lastCrop: "トマト", years: 4 });
    expect(w!.monthsLeft).toBeGreaterThan(40);
    expect(rotationWarning(bedArgs(s, "cucumber"))).toBeNull();
    expect(rotationWarning(bedArgs(s, "eggplant", "2031-01-01"))).toBeNull();
  });
  it("今育っている株も数える。土替えのあとは数えない（地植えは数える）", () => {
    const s = run(initialState(), plant("potato", "danshaku"));
    expect(rotationWarning(bedArgs(s, "tomato"))?.lastCrop).toBe("ジャガイモ");
    const refreshed = run(s, { type: "remove", uid: s.plants[0]!.uid }, { type: "refreshBed", bedId: "bed_1", today: "2026-12-01", soilMix: "veg" });
    expect(rotationWarning(bedArgs(refreshed, "tomato", "2026-12-02"))).toBeNull();
    expect(rotationWarning({ ...bedArgs(refreshed, "tomato", "2026-12-02"), bedType: "field" })).toBeNull(); // 株は片付け済み
  });
  it("連作障害が出にくい科は警告しない", () => {
    const s = run(initialState(), plant("basil", "sweet"));
    expect(rotationWarning(bedArgs(s, "mint"))).toBeNull();
  });
});

describe("植え付けの適期", () => {
  it("地域で月がずれる", () => {
    expect(regionOf(null)).toBe("middle");
    expect(regionOf({ lat: 43.0 })).toBe("cold");
    expect(regionOf({ lat: 31.5 })).toBe("warm");
    expect(plantMonthsFor("tomato", "middle")).toEqual([4, 5]);
    expect(plantMonthsFor("tomato", "cold")).toEqual([5, 6]);
    expect(plantMonthsFor("tomato", "warm")).toEqual([3, 4]);
    expect(plantMonthsFor("lettuce", "cold")).toEqual([4, 5, 8, 9]);
    expect(inSeason("komatsuna", 10, "middle")).toBe(true);
    expect(cropsForMonth(11, "middle").map((c) => c.id)).toContain("strawberry");
    expect(cropsForMonth(11, "middle").map((c) => c.id)).not.toContain("tomato");
  });
});

describe("積算温度の収穫予測", () => {
  const s = run(initialState(), plant("radish", "comet", { plantedDate: "2026-10-20" })); // 25日
  const uid = () => s.plants[0]!;
  it("記録がなければ日数どおり", () => {
    const g = gddEstimate(uid(), { id: "comet", name: "", days: 25, tip: "" }, {}, "2026-11-01");
    expect(g).toMatchObject({ loggedDays: 0, shiftDays: 0, expectedDate: "2026-11-14" });
  });
  it("寒い日が続くと遅れ、暑いと早まる", () => {
    const cold: WeatherLog = {};
    const hot: WeatherLog = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date(Date.UTC(2026, 9, 20 + i)).toISOString().slice(0, 10);
      cold[d] = { condition: "cloudy", maxC: 14, minC: 10, rainMm: 0, source: "auto" }; // 平均12 → 2℃日
      hot[d] = { condition: "sunny", maxC: 30, minC: 22, rainMm: 0, source: "auto" }; // 平均26 → 16℃日
    }
    const v = { id: "comet", name: "", days: 25, tip: "" };
    const c = gddEstimate(uid(), v, cold, "2026-11-01");
    const h = gddEstimate(uid(), v, hot, "2026-11-01");
    expect(c.shiftDays).toBeGreaterThan(10);
    expect(c.stalled).toBe(false);
    const frozen: WeatherLog = Object.fromEntries(Object.entries(cold).map(([k, v]) => [k, { ...v, maxC: 8, minC: 2 }]));
    expect(gddEstimate(uid(), v, frozen, "2026-11-01").stalled).toBe(true);
    expect(h.shiftDays).toBeLessThan(-5);
    expect(h.progressPct).toBeGreaterThan(c.progressPct);
  });
});

describe("収穫量・水やり補正・日記・タグ", () => {
  it("収穫量が記録され、作物ごとに集計される", () => {
    const s0 = run(initialState(), plant("blueberry", "festival", { plantedDate: "2026-01-01" }));
    const uid = s0.plants[0]!.uid;
    const s = run(s0, { type: "harvest", uid, recordId: "h1", today: "2026-07-01", count: 30, grams: 60.4 }, { type: "harvest", uid, recordId: "h2", today: "2027-07-01", count: 0, grams: -5 });
    expect(s.harvestLog.map((h) => [h.count, h.grams])).toEqual([[null, null], [30, 60]]);
    expect(harvestSummary(s.harvestLog)).toEqual([{ cropId: "blueberry", cropName: "ブルーベリー", emoji: "🫐", times: 2, count: 30, grams: 60, years: ["2026", "2027"] }]);
  });
  it("「まだ湿ってた」で間隔が延び、「乾きすぎ」で縮む。0.5〜2倍", () => {
    const s = run(initialState(), plant("tomato", "aiko"));
    const uid = s.plants[0]!.uid;
    const wet = run(s, { type: "waterFeedback", uid, kind: "wet" });
    expect(wet.plants[0]?.waterAdjust).toBe(1.15);
    let st = s;
    for (let i = 0; i < 20; i++) st = run(st, { type: "waterFeedback", uid, kind: "dry" });
    expect(st.plants[0]?.waterAdjust).toBe(0.5);
    const base = plantStatus(s.plants[0]!, s.beds[0], { condition: "cloudy", tempC: 8 }, T)!.interval; // 2*1.3*1.3=3.4→3
    const longer = plantStatus({ ...s.plants[0]!, waterAdjust: 2 }, s.beds[0], { condition: "cloudy", tempC: 8 }, T)!.interval;
    expect(longer).toBeGreaterThan(base);
  });
  it("日記とタグ。去年の今頃の病害虫が引ける", () => {
    const s0 = run(initialState(), plant("tomato", "aiko"));
    const uid = s0.plants[0]!.uid;
    const s = run(
      s0,
      { type: "addDiary", id: "d1", date: "2025-11-05", text: " 葉裏に白い粉 ", plantUid: uid, tags: ["powdery", "powdery"] },
      { type: "addDiary", id: "d2", date: "2025-06-01", text: "開花", tags: ["flower"] },
      { type: "addDiary", id: "d3", date: T, text: "   " },
      { type: "addPhoto", id: "p1", bedId: "bed_1", date: "2025-11-20", note: "", today: T },
      { type: "setPhotoTags", id: "p1", tags: ["aphid", "ripe", "aphid"] },
    );
    expect(s.diary).toHaveLength(2);
    expect(s.diary[0]).toMatchObject({ text: "葉裏に白い粉", plantUid: uid, tags: ["powdery"] });
    expect(s.photos[0]?.tags).toEqual(["aphid", "ripe"]);
    expect(lastYearAround(s, T).map((l) => [l.date, l.tags])).toEqual([["2025-11-05", ["powdery"]], ["2025-11-20", ["aphid"]]]);
    expect(run(s, { type: "removeDiary", id: "d2" }).diary).toHaveLength(1);
    const round = normalize(JSON.parse(JSON.stringify(s)));
    expect(round).toEqual(s);
    expect(normalize({ diary: [{ id: "x", date: T, text: "ok", plantUid: "gone", tags: [1, "a"] }, { id: "y", date: "bad", text: "no" }] }).diary).toEqual([{ id: "x", date: T, text: "ok", plantUid: null, tags: ["a"] }]);
  });
});
