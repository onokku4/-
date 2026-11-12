import { describe, expect, it } from "vitest";
import { findCrop } from "../src/data/catalog";
import { cropBadges } from "../src/data/game";
import { dayInfo } from "../src/lib/calendar";
import { apply, initialState, type Action } from "../src/lib/garden";
import { normalize } from "../src/lib/storage";
import { dayTempIssues, tempRangeOf, tempVerdict } from "../src/lib/temperature";
import type { GardenState } from "../src/types";

const T = "2026-11-12";
let seq = 0;
const plant = (cropId: string, varietyId: string, extra: Partial<Extract<Action, { type: "plant" }>> = {}): Action => ({
  type: "plant", uid: `t${++seq}`, cropId, varietyId, projectName: "", plantedDate: T, bedId: "bed_1", today: T, ...extra,
});
const run = (s: GardenState, ...actions: Action[]) => actions.reduce((st, a) => apply(st, a).state, s);

describe("気温の適否", () => {
  const tomato = findCrop("tomato")!;
  const blueberry = findCrop("blueberry")!;
  const lemon = findCrop("lemon")!;
  it("カテゴリの既定範囲で暑すぎ・寒い・適温", () => {
    expect(tempRangeOf(tomato)).toEqual({ min: 15, max: 30 });
    expect(tempVerdict(tomato, 22).kind).toBe("ok");
    expect(tempVerdict(tomato, 33)).toMatchObject({ kind: "hot", label: "暑すぎ（+3℃）" });
    expect(tempVerdict(tomato, 9)).toMatchObject({ kind: "cold", label: "寒い（−6℃）" });
  });
  it("落葉果樹は冬の寒さを休眠として扱い、防寒が要る果樹だけ寒さを出す", () => {
    expect(tempVerdict(blueberry, 2)).toMatchObject({ kind: "ok", label: "休眠期" });
    expect(tempVerdict(lemon, 1).kind).toBe("cold"); // coldTenderBelowC: 3
    expect(tempVerdict(lemon, 8).kind).toBe("ok");
  });
  it("1日の記録では最高気温で暑さ、最低気温で寒さを見る。植える前の日は見ない", () => {
    const s = run(initialState(), plant("tomato", "aiko", { plantedDate: "2026-11-01" }), plant("lettuce", "sunny", { plantedDate: "2026-11-10" }));
    const hot = { condition: "sunny" as const, maxC: 33, minC: 20, rainMm: 0, source: "auto" as const };
    expect(dayTempIssues(s.plants, hot, "2026-11-05").map((i) => [i.plant.cropId, i.verdict.kind])).toEqual([["tomato", "hot"]]);
    expect(dayTempIssues(s.plants, hot, T).map((i) => i.plant.cropId)).toEqual(["tomato", "lettuce"]);
    const cold = { ...hot, maxC: 12, minC: 2 };
    expect(dayTempIssues(s.plants, cold, T).map((i) => i.verdict.kind)).toEqual(["cold", "cold"]);
    expect(dayTempIssues(s.plants, { ...hot, maxC: 22, minC: 16 }, T)).toEqual([]);
  });
  it("カレンダーの日にも出る", () => {
    const s0 = run(initialState(), plant("tomato", "aiko", { plantedDate: "2026-11-01" }));
    const s = { ...s0, weatherLog: { "2026-11-05": { condition: "sunny" as const, maxC: 34, minC: 22, rainMm: 0, source: "auto" as const } } };
    expect(dayInfo(s, "2026-11-05", T).tempIssues).toHaveLength(1);
    expect(dayInfo(s, "2026-11-06", T).tempIssues).toHaveLength(0);
  });
});

describe("作物ごとの実績", () => {
  it("初収穫と10回収穫で付く", () => {
    const s = run(initialState(), plant("tomato", "aiko", { plantedDate: "2026-10-01" }), plant("blueberry", "festival", { plantedDate: "2026-06-01" }));
    const uid = s.plants[1]!.uid; // 多年生なので何度でも収穫できる
    const first = apply(s, { type: "harvest", uid, recordId: "r1", today: T });
    expect(first.newBadges).toContain("crop:blueberry");
    expect(first.newBadges).not.toContain("crop10:blueberry");
    let st = first.state;
    for (let i = 2; i <= 10; i++) st = apply(st, { type: "harvest", uid, recordId: `r${i}`, today: T }).state;
    expect(st.earnedBadges).toContain("crop10:blueberry");
    expect(st.earnedBadges).not.toContain("crop:tomato");
    expect(normalize(JSON.parse(JSON.stringify(st)))).toEqual(st);
    expect(normalize({ earnedBadges: ["crop:tomato", "crop:nope", "crop10:x", "bogus"] }).earnedBadges).toEqual(["crop:tomato"]);
  });
  it("カタログの全作物に2つずつ", () => {
    expect(cropBadges(findCrop("tomato")!).map((b) => b.id)).toEqual(["crop:tomato", "crop10:tomato"]);
  });
});

describe("名前・日付・場所の編集", () => {
  it("株の名前・植え付け日・場所を変えられる。空の名前は既定名に戻る", () => {
    const s = run(initialState(), { type: "addBed", id: "f", soil: "field", today: T }, { type: "addBed", id: "h", soil: "hydro", today: T }, plant("tomato", "aiko"));
    const uid = s.plants[0]!.uid;
    const out = apply(s, { type: "editPlant", uid, projectName: " ベランダのトマト ", plantedDate: "2026-11-01", bedId: "f" });
    expect(out.state.plants[0]).toMatchObject({ projectName: "ベランダのトマト", plantedDate: "2026-11-01", bedId: "f" });
    expect(apply(out.state, { type: "editPlant", uid, projectName: "" }).state.plants[0]?.projectName).toBe("トマト（アイコ）");
    expect(apply(s, { type: "editPlant", uid, plantedDate: "bad" }).state).toBe(s);
    expect(apply(s, { type: "editPlant", uid, bedId: "zz" }).toast).toContain("ありません");
    // 果樹は水耕へ移せない
    const bb = run(s, plant("blueberry", "festival"));
    const r = apply(bb, { type: "editPlant", uid: bb.plants[1]!.uid, bedId: "h" });
    expect(r.state).toBe(bb);
    expect(r.toast).toContain("育てられません");
  });
  it("場所の名前を変えられる", () => {
    const s = initialState();
    expect(run(s, { type: "renameBed", bedId: "bed_1", name: " 南のプランター " }).beds[0]?.name).toBe("南のプランター");
    expect(apply(s, { type: "renameBed", bedId: "bed_1", name: "  " }).state).toBe(s);
    expect(apply(s, { type: "renameBed", bedId: "nope", name: "x" }).state).toBe(s);
  });
});
