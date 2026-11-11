import { describe, expect, it } from "vitest";
import { FERTILIZERS } from "../src/data/fertilizers";
import { SOIL_MIXES } from "../src/data/soils";
import { apply, initialState, type Action } from "../src/lib/garden";
import { normalize } from "../src/lib/storage";
import { acidMismatch, fed, feedSchedule, newBed, nutrientsOn, refreshed } from "../src/lib/soil";
import { findCrop } from "../src/data/catalog";
import type { GardenState } from "../src/types";

const T = "2026-11-11";
let seq = 0;
const plant = (cropId: string, varietyId: string, bedId = "bed_1"): Action => ({
  type: "plant", uid: `s${++seq}`, cropId, varietyId, projectName: "", plantedDate: T, bedId, today: T,
});
const run = (s: GardenState, ...actions: Action[]) => actions.reduce((st, a) => apply(st, a).state, s);

describe("土と肥料のカタログ", () => {
  it("IDが重複しない", () => {
    expect(new Set(SOIL_MIXES.map((m) => m.id)).size).toBe(SOIL_MIXES.length);
    expect(new Set(FERTILIZERS.map((f) => f.id)).size).toBe(FERTILIZERS.length);
  });
  it("値は0〜100、持続日数は0以上", () => {
    for (const m of SOIL_MIXES) {
      for (const v of [m.nutrients.n, m.nutrients.p, m.nutrients.k]) expect(v >= 0 && v <= 100, m.name).toBe(true);
      expect(m.lasts, m.name).toBeGreaterThanOrEqual(0);
    }
    for (const f of FERTILIZERS) expect(f.lasts, f.name).toBeGreaterThan(0);
  });
});

describe("土の栄養の推移", () => {
  it("市販の土を選ぶと、その土の栄養と元肥日が入る", () => {
    const b = newBed("b", "A", "planter", "veg", T);
    expect(b).toMatchObject({ n: 90, p: 90, k: 90, soilMix: "veg", fedAt: T, nutrientsAt: T, fertilizer: null });
    expect(newBed("b", "A", "planter", "no-such", T).soilMix).toBeNull();
  });
  it("日が経つと減る。株が多いほど、プランターほど速い", () => {
    const b = newBed("b", "A", "planter", "veg", T);
    expect(nutrientsOn(b, 0, T)).toEqual({ n: 90, p: 90, k: 90 });
    const one = nutrientsOn(b, 1, "2026-12-11").n;
    const three = nutrientsOn(b, 3, "2026-12-11").n;
    expect(one).toBeLessThan(90);
    expect(three).toBeLessThan(one);
    const field = nutrientsOn({ ...b, type: "field" }, 1, "2026-12-11").n;
    expect(field).toBeGreaterThan(one);
    expect(nutrientsOn(b, 50, "2030-01-01").n).toBe(0);
  });
  it("記録日がなければ減らない。水耕も減らない", () => {
    expect(nutrientsOn(newBed("b", "A"), 3, "2030-01-01").n).toBe(100);
    expect(nutrientsOn(newBed("b", "A", "hydro", null, T), 3, "2030-01-01").n).toBe(100);
  });
  it("追肥は今日時点の残量に足し、100で止まる", () => {
    const b = newBed("b", "A", "planter", "plain", T); // 25
    const after = fed(b, "chemical", 1, "2026-11-21")!;
    expect(after.fertilizer).toBe("chemical");
    expect(after.fedAt).toBe("2026-11-21");
    expect(after.n).toBeGreaterThan(50);
    expect(after.n).toBeLessThan(60); // 25 - 10日ぶんの減り + 35
    expect(fed(newBed("b", "A", "planter", "veg", T), "slow", 0, T)!.n).toBe(100);
    expect(fed(b, "no-such", 0, T)).toBeUndefined();
    expect(fed(newBed("b", "A", "hydro"), "chemical", 0, T)).toBeUndefined();
  });
  it("土替えで土の種類を変えられ、連用回数が戻る", () => {
    const b = { ...newBed("b", "A", "planter", "veg", T), uses: 3, fertilizer: "liquid" };
    const r = refreshed(b, "2026-12-01", "blueberry");
    expect(r).toMatchObject({ uses: 0, soilMix: "blueberry", n: 60, fedAt: "2026-12-01", fertilizer: null });
    expect(refreshed(b, "2026-12-01").soilMix).toBe("veg");
  });
});

describe("追肥のタイミング", () => {
  it("株がなければ目安なし。水耕は対象外", () => {
    expect(feedSchedule(newBed("b", "A", "planter", "veg", T), 0, T).nextDate).toBeNull();
    expect(feedSchedule(newBed("b", "A", "hydro"), 2, T).due).toBe(false);
  });
  it("元肥の持続日数を過ぎたら追肥どき", () => {
    const b = newBed("b", "A", "planter", "veg", T); // lasts 30
    const soon = feedSchedule(b, 1, "2026-11-20");
    expect(soon).toMatchObject({ nextDate: "2026-12-11", daysLeft: 21, due: false });
    expect(soon.note).toContain("12/11");
    expect(feedSchedule(b, 1, "2026-12-11").due).toBe(true);
  });
  it("無肥料の土は植えた時点で追肥どき", () => {
    expect(feedSchedule(newBed("b", "A", "planter", "plain", T), 1, T).due).toBe(true);
  });
  it("追肥すると、その肥料の持続日数で次が決まる", () => {
    const b = fed(newBed("b", "A", "planter", "veg", T), "liquid", 1, "2026-11-20")!; // 7日
    expect(feedSchedule(b, 1, "2026-11-21").nextDate).toBe("2026-11-27");
    const slow = fed(newBed("b", "A", "planter", "veg", T), "slow", 1, "2026-11-20")!; // 60日
    expect(feedSchedule(slow, 1, "2026-11-21").nextDate).toBe("2027-01-19");
  });
  it("日数が残っていても栄養が減りすぎていれば追肥どき", () => {
    const b = fed({ ...newBed("b", "A", "planter", "plain", T) }, "slow", 1, T)!; // 70, 60日
    expect(feedSchedule(b, 6, "2026-11-25").due).toBe(true); // 6株で14日 → 約-30
  });
  it("肥料の日付がない旧データは残量だけで判断", () => {
    const b = { ...newBed("b", "A"), n: 30, p: 30, k: 30 };
    expect(feedSchedule(b, 1, T).due).toBe(true);
    expect(feedSchedule(newBed("b", "A"), 1, T).due).toBe(false);
  });
});

describe("酸性土の警告", () => {
  it("ブルーベリーを普通の培養土に植えると警告、専用土なら出ない", () => {
    const bb = findCrop("blueberry")!;
    expect(acidMismatch(newBed("b", "A", "planter", "veg", T), [bb])).toBe(true);
    expect(acidMismatch(newBed("b", "A", "planter", "blueberry", T), [bb])).toBe(false);
    expect(acidMismatch(newBed("b", "A"), [bb])).toBe(false); // 土が未設定なら判断しない
    expect(acidMismatch(newBed("b", "A", "planter", "veg", T), [findCrop("tomato")!])).toBe(false);
  });
});

describe("状態遷移（土・肥料）", () => {
  it("場所の追加で土を選べ、追肥でXPと記録が付く", () => {
    const s = run(initialState(), { type: "addBed", id: "p2", soil: "planter", soilMix: "veg", today: T }, plant("tomato", "aiko", "p2"));
    const out = apply(s, { type: "feedBed", bedId: "p2", fertilizer: "chemical", today: "2026-11-20" });
    expect(out.state.beds[1]).toMatchObject({ soilMix: "veg", fertilizer: "chemical", fedAt: "2026-11-20" });
    expect(out.state.xp).toBe(s.xp + 10);
    expect(out.toast).toContain("追肥");
    expect(apply(s, { type: "feedBed", bedId: "nope", fertilizer: "chemical", today: T }).state).toBe(s);
  });
  it("収穫の消耗は経過ぶんの減りも反映して記録日を更新する", () => {
    const s = run(initialState(), { type: "addBed", id: "p2", soil: "planter", soilMix: "veg", today: T }, plant("tomato", "aiko", "p2"));
    const out = run(s, { type: "harvest", uid: s.plants[0]!.uid, recordId: "r1", today: "2026-12-11" });
    expect(out.beds[1]?.nutrientsAt).toBe("2026-12-11");
    expect(out.beds[1]!.n).toBeLessThan(90 - 5 * 1.4);
  });
  it("保存データの往復と、土・肥料のない旧形式", () => {
    const s = run(initialState(), { type: "addBed", id: "p2", soil: "field", soilMix: "field", today: T }, plant("tomato", "aiko", "p2"), {
      type: "feedBed", bedId: "p2", fertilizer: "organic", today: T,
    });
    expect(normalize(JSON.parse(JSON.stringify(s)))).toEqual(s);
    const old = normalize({ beds: [{ id: "b", n: 80, p: 70, k: 60, soilMix: "bogus", fertilizer: "bogus" }] });
    expect(old.beds[0]).toMatchObject({ soilMix: null, nutrientsAt: null, fedAt: null, fertilizer: null, n: 80 });
  });
});
