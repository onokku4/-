import { describe, expect, it } from "vitest";
import { CROPS } from "../src/data/catalog";
import { CATEGORY_GUIDES, CROP_GUIDES } from "../src/data/guides";
import { apply, initialState, type Action } from "../src/lib/garden";
import { frostTomorrow, gearFor, recommendSupplies } from "../src/lib/supplies";
import type { GardenState } from "../src/types";

const T = "2026-11-12";
let seq = 0;
const plant = (cropId: string, varietyId: string, extra: Partial<Extract<Action, { type: "plant" }>> = {}): Action => ({
  type: "plant", uid: `g${++seq}`, cropId, varietyId, projectName: "", plantedDate: T, bedId: "bed_1", today: T, ...extra,
});
const run = (s: GardenState, ...actions: Action[]) => actions.reduce((st, a) => apply(st, a).state, s);

describe("育て方ガイド", () => {
  it("すべての作物にガイドがあり、道具と資材が出る", () => {
    for (const c of CROPS) {
      expect(CROP_GUIDES[c.id], c.name).toBeDefined();
      expect(CROP_GUIDES[c.id]!.points.length, c.name).toBeGreaterThanOrEqual(3);
      expect(CATEGORY_GUIDES[c.category].steps.length).toBeGreaterThan(0);
      const g = gearFor(c.id);
      expect(g.tools.some((t) => t.essential), c.name).toBe(true);
      expect(g.supplies.length, c.name).toBeGreaterThan(0);
      expect(new Set(g.tools.map((t) => t.name)).size).toBe(g.tools.length);
    }
    expect(gearFor("nope")).toEqual({ tools: [], supplies: [] });
  });
});

describe("そろえる物の提案", () => {
  it("トマトは植えて3週間で支柱、葉物は植えてすぐ防虫ネット", () => {
    const s = run(initialState(), plant("tomato", "aiko", { plantedDate: "2026-10-20" }), plant("komatsuna", "komatsuna", { plantedDate: "2026-11-10" }));
    const names = recommendSupplies(s, T).map((r) => `${r.urgency}:${r.name}`);
    expect(names).toContain("now:支柱と麻ひも");
    expect(names).toContain("now:防虫ネット（1mm目）");
  });
  it("明日が霜の予報なら、寒さに弱い作物に防寒資材", () => {
    const s = run(initialState(), plant("lemon", "meyer"), plant("tomato", "aiko"));
    const log = { "2026-11-13": { condition: "sunny" as const, maxC: 10, minC: 1, rainMm: 0, source: "auto" as const } };
    expect(frostTomorrow(log, T)).toBe(1);
    expect(frostTomorrow({}, T)).toBeNull();
    const rec = recommendSupplies({ ...s, weatherLog: log }, T);
    expect(rec.find((r) => r.name === "不織布・防寒カバー")).toMatchObject({ for: "レモン（マイヤーレモン）", urgency: "now" });
  });
  it("ブルーベリーを普通の土に植えるとピートモス、追肥が近い場所には肥料", () => {
    const s = run(initialState(), { type: "refreshBed", bedId: "bed_1", today: "2026-10-20", soilMix: "veg" }, plant("blueberry", "festival"));
    const rec = recommendSupplies(s, T);
    expect(rec.some((r) => r.name.startsWith("ピートモス") && r.urgency === "now")).toBe(true);
    expect(rec.some((r) => r.name.startsWith("追肥用の肥料"))).toBe(true);
    // 今すぐが先
    const idx = rec.map((r) => r.urgency);
    expect(idx.indexOf("soon")).toBeGreaterThanOrEqual(idx.lastIndexOf("now"));
  });
  it("何も植えていなければ何も出ない", () => {
    expect(recommendSupplies(initialState(), T)).toEqual([]);
  });
});
