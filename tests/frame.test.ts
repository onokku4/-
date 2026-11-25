import { describe, expect, it } from "vitest";
import { apply, initialState, type Action } from "../src/lib/garden";
import { normalize } from "../src/lib/storage";
import { DEFAULT_FRAME, baseAnchorY, clampFrame, potGuide, remapAlign } from "../src/lib/timelapse";
import type { Align, FrameAdjust, GardenState } from "../src/types";

const T = "2026-11-25";
const run = (s: GardenState, ...actions: Action[]) => actions.reduce((st, a) => apply(st, a).state, s);

/** 写真の中のある点（写真中心からのずれ v、等倍・回転なし）が画面のどこに来るか */
const at = (a: Align, v: [number, number]): [number, number] => [0.5 + a.x + a.scale * v[0], 0.5 + a.y + a.scale * v[1]];

describe("枠の調整", () => {
  it("範囲に収め、壊れた値は既定へ", () => {
    expect(clampFrame(undefined)).toEqual(DEFAULT_FRAME);
    expect(clampFrame({ size: 9, y: -9, tilt: 0 })).toEqual({ size: 1.6, y: -0.35, tilt: 0.4 });
  });
  it("大きさは基準点を中心に、位置は上下に動く。縁の厚みは縦だけ", () => {
    const base = potGuide("round", "oblique");
    const big = potGuide("round", "oblique", { size: 1.5, y: 0, tilt: 1 });
    const low = potGuide("round", "oblique", { size: 1, y: 0.1, tilt: 1 });
    const thick = potGuide("round", "oblique", { size: 1, y: 0, tilt: 2 });
    const rim = (g: typeof base) => g.outline[0] as Extract<(typeof base.outline)[number], { kind: "ellipse" }>;
    expect(rim(big).rx).toBeCloseTo(rim(base).rx * 1.5);
    expect(rim(big).cy).toBeCloseTo(rim(base).cy);
    expect(rim(low).cy).toBeCloseTo(rim(base).cy + 0.1);
    expect(low.anchor[1]).toBeCloseTo(base.anchor[1] + 0.1);
    expect(rim(thick).ry).toBeCloseTo(rim(base).ry * 2);
    expect(rim(thick).rx).toBeCloseTo(rim(base).rx);
    // 真上も同じく
    const top = potGuide("rect", "top", { size: 0.5, y: 0, tilt: 1 });
    const r = top.outline[0]!;
    if (r.kind !== "rect") throw new Error();
    expect(r.x + r.w / 2).toBeCloseTo(0.5);
    expect(r.w).toBeCloseTo(0.43);
  });
  it("枠を変えると、古い枠に合っていた点は新しい枠の同じ場所へ動く", () => {
    const ay0 = baseAnchorY("round", "oblique");
    const from: FrameAdjust = { size: 1, y: 0, tilt: 1 };
    const to: FrameAdjust = { size: 0.7, y: -0.1, tilt: 1.3 };
    // 写真の中の「鉢の縁の中心」が、古い枠の基準点に合わせてある
    const a: Align = { x: 0.05, y: -0.02, scale: 1.2, rotate: 0 };
    const v: [number, number] = [(0.5 - 0.5 - a.x) / a.scale, (ay0 - 0.5 - a.y) / a.scale];
    expect(at(a, v)[1]).toBeCloseTo(ay0);
    const b = remapAlign(a, ay0, from, to);
    const moved = at(b, v);
    expect(moved[0]).toBeCloseTo(0.5, 2);
    expect(moved[1]).toBeCloseTo(ay0 + to.y, 2);
    expect(b.scale).toBeCloseTo(a.scale * 0.7, 2);
    // 鉢の幅（写真の中の2点の距離）も同じ倍率
    const w0 = at(a, [0.3, 0])[0] - at(a, [-0.3, 0])[0];
    const w1 = at(b, [0.3, 0])[0] - at(b, [-0.3, 0])[0];
    expect(w1 / w0).toBeCloseTo(0.7, 2);
  });
});

describe("枠の保存と写真の追従", () => {
  const base = run(
    initialState(),
    { type: "addBed", id: "b2", soil: "planter", today: T },
    { type: "addPhoto", id: "p1", bedId: "bed_1", date: T, note: "", today: T },
    { type: "addPhoto", id: "p2", bedId: "bed_1", date: T, note: "", today: T },
    { type: "addPhoto", id: "q1", bedId: "b2", date: T, note: "", today: T },
    { type: "setPhotoAlign", id: "p1", align: { x: 0.1, y: 0.05, scale: 1.4, rotate: 3 } },
    { type: "setPhotoAlign", id: "q1", align: { x: 0.1, y: 0.05, scale: 1.4, rotate: 3 } },
  );
  it("枠を変えると同じ場所の位置合わせ済みの写真だけ動く。未調整の写真と他の場所は動かない", () => {
    const s = run(base, { type: "setFrame", bedId: "bed_1", frame: { size: 0.8, y: -0.05, tilt: 1 } });
    expect(s.beds[0]?.frame).toEqual({ size: 0.8, y: -0.05, tilt: 1 });
    expect(s.photos.find((p) => p.id === "p1")?.align?.scale).toBeCloseTo(1.12);
    expect(s.photos.find((p) => p.id === "p1")?.align?.rotate).toBe(3);
    expect(s.photos.find((p) => p.id === "p2")?.align).toBeUndefined();
    expect(s.photos.find((p) => p.id === "q1")?.align).toEqual({ x: 0.1, y: 0.05, scale: 1.4, rotate: 3 });
    // 縁の厚みだけなら写真は動かない
    const t = run(base, { type: "setFrame", bedId: "bed_1", frame: { size: 1, y: 0, tilt: 1.8 } });
    expect(t.photos.find((p) => p.id === "p1")?.align).toEqual({ x: 0.1, y: 0.05, scale: 1.4, rotate: 3 });
  });
  it("プリセットを保存・上書き・適用・削除できる。往復しても変わらない", () => {
    const s = run(
      base,
      { type: "saveFramePreset", id: "f1", name: " ベランダ丸鉢 ", shape: "round", view: "oblique", frame: { size: 0.8, y: 0.02, tilt: 1.4 } },
      { type: "saveFramePreset", id: "f2", name: "畑", shape: "square", view: "top", frame: DEFAULT_FRAME },
      { type: "saveFramePreset", id: "f3", name: "ベランダ丸鉢", shape: "round", view: "oblique", frame: { size: 0.9, y: 0, tilt: 1 } },
    );
    expect(s.framePresets.map((p) => [p.id, p.name])).toEqual([["f2", "畑"], ["f3", "ベランダ丸鉢"]]);
    const applied = run(s, { type: "applyFramePreset", bedId: "b2", presetId: "f2" });
    expect(applied.beds[1]).toMatchObject({ potShape: "square", viewAngle: "top", frame: DEFAULT_FRAME });
    // 形が変わるときは写真を動かさない
    expect(applied.photos.find((p) => p.id === "q1")?.align).toEqual({ x: 0.1, y: 0.05, scale: 1.4, rotate: 3 });
    expect(normalize(JSON.parse(JSON.stringify(applied)))).toEqual(applied);
    expect(run(applied, { type: "removeFramePreset", id: "f2" }).framePresets.map((p) => p.id)).toEqual(["f3"]);
    expect(apply(s, { type: "saveFramePreset", id: "x", name: "  ", shape: "rect", view: "top", frame: DEFAULT_FRAME }).state).toBe(s);
    expect(apply(s, { type: "applyFramePreset", bedId: "nope", presetId: "f2" }).state).toBe(s);
  });
  it("旧データは既定の枠、壊れたプリセットは落ちる", () => {
    const n = normalize({ beds: [{ id: "b", frame: { size: "x" } }], framePresets: [{ id: "a", name: "ok", shape: "round" }, { id: "b", name: "", shape: "round" }, { id: "c", name: "bad", shape: "hex" }] });
    expect(n.beds[0]?.frame).toEqual(DEFAULT_FRAME);
    expect(n.framePresets.map((p) => p.id)).toEqual(["a"]);
  });
});
