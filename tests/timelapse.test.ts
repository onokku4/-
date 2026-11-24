import { describe, expect, it } from "vitest";
import { apply, initialState, type Action } from "../src/lib/garden";
import { normalize } from "../src/lib/storage";
import {
  DEFAULT_ALIGN,
  FADE_MIN,
  clampAlign,
  coverSize,
  dayLabel,
  defaultPotShape,
  durationSec,
  fadeOpacity,
  frameAt,
  framesFor,
  isDefaultAlign,
  potFrame,
} from "../src/lib/timelapse";
import type { GardenState } from "../src/types";

const T = "2026-11-24";
const run = (s: GardenState, ...actions: Action[]) => actions.reduce((st, a) => apply(st, a).state, s);

describe("位置合わせ", () => {
  it("範囲に収め、壊れた値は既定へ", () => {
    expect(clampAlign(undefined)).toEqual(DEFAULT_ALIGN);
    expect(clampAlign({ x: 3, y: -3, scale: 99, rotate: -90 })).toEqual({ x: 1, y: -1, scale: 4, rotate: -45 });
    expect(clampAlign({ x: Number.NaN, scale: 0.01 })).toEqual({ x: 0, y: 0, scale: 0.4, rotate: 0 });
    expect(isDefaultAlign(undefined)).toBe(true);
    expect(isDefaultAlign({ ...DEFAULT_ALIGN, x: 0.1 })).toBe(false);
  });
  it("写真は正方形の枠を覆う大きさ", () => {
    expect(coverSize(4000, 3000)).toEqual({ w: 4000 / 3000, h: 1 });
    expect(coverSize(3000, 4000)).toEqual({ w: 1, h: 4000 / 3000 });
    expect(coverSize(0, 10)).toEqual({ w: 1, h: 1 });
  });
  it("鉢の枠は中央。プランターは長方形、畑は四角が既定", () => {
    expect(defaultPotShape("planter")).toBe("rect");
    expect(defaultPotShape("field")).toBe("square");
    const r = potFrame("round");
    expect(r).toMatchObject({ kind: "circle", cx: 0.5, cy: 0.5 });
    const rect = potFrame("rect");
    if (rect.kind !== "rect") throw new Error();
    expect(rect.x + rect.w / 2).toBeCloseTo(0.5);
    expect(rect.y + rect.h / 2).toBeCloseTo(0.5);
    expect(rect.w).toBeGreaterThan(rect.h);
  });
  it("位置合わせと鉢の形が保存・往復できる。既定値に戻すと消える", () => {
    const s = run(initialState(), { type: "addPhoto", id: "p1", bedId: "bed_1", date: T, note: "", today: T });
    expect(s.beds[0]?.potShape).toBe("rect");
    const a = run(s, { type: "setPhotoAlign", id: "p1", align: { x: 0.12, y: -0.3, scale: 1.6, rotate: 4.25 } }, { type: "setPotShape", bedId: "bed_1", shape: "round" });
    expect(a.photos[0]?.align).toEqual({ x: 0.12, y: -0.3, scale: 1.6, rotate: 4.3 });
    expect(a.beds[0]?.potShape).toBe("round");
    expect(normalize(JSON.parse(JSON.stringify(a)))).toEqual(a);
    const reset = run(a, { type: "setPhotoAlign", id: "p1", align: DEFAULT_ALIGN });
    expect("align" in reset.photos[0]!).toBe(false);
    expect(apply(a, { type: "setPhotoAlign", id: "nope", align: null }).state).toBe(a);
    // 旧データ：形がなければ種類から
    expect(normalize({ beds: [{ id: "f", type: "field" }] }).beds[0]?.potShape).toBe("square");
    expect(normalize({ beds: [{ id: "b" }], photos: [{ id: "x", bedId: "b", date: T, align: { x: 5 } }] }).photos[0]?.align).toEqual({ x: 1, y: 0, scale: 1, rotate: 0 });
  });
});

describe("タイムラプス", () => {
  const s = run(
    initialState(),
    { type: "addBed", id: "b2", soil: "planter", today: T },
    { type: "addPhoto", id: "c", bedId: "bed_1", date: "2026-11-20", note: "", today: T },
    { type: "addPhoto", id: "a", bedId: "bed_1", date: "2026-11-01", note: "", today: T },
    { type: "addPhoto", id: "z", bedId: "b2", date: "2026-11-05", note: "", today: T },
  );
  it("場所ごと・古い順のコマ", () => {
    expect(framesFor(s.photos, "bed_1").map((p) => p.id)).toEqual(["a", "c"]);
    expect(framesFor(s.photos, "b2").map((p) => p.id)).toEqual(["z"]);
  });
  it("12コマ/秒なら30コマで2.5秒。ループ再生", () => {
    expect(durationSec(30, 12)).toBe(2.5);
    expect(durationSec(30, 0)).toBe(0);
    expect(frameAt(0, 12, 30)).toBe(0);
    expect(frameAt(1, 12, 30)).toBe(12);
    expect(frameAt(2.5, 12, 30)).toBe(0);
    expect(frameAt(5, 12, 0)).toBe(0);
  });
  it("何日目のラベル", () => {
    expect(dayLabel(s.photos[0]!)).toBe("植え付け前");
    expect(dayLabel({ ...s.photos[0]!, stages: [{ label: "a", emoji: "", day: 3 }, { label: "b", emoji: "", day: 40 }] })).toBe("40日目");
  });
});

describe("縦スクロールの透明度", () => {
  it("中央は不透明、離れるほど薄く、端で最小", () => {
    expect(fadeOpacity(0)).toBe(1);
    expect(fadeOpacity(1)).toBe(FADE_MIN);
    expect(fadeOpacity(5)).toBe(FADE_MIN);
    expect(fadeOpacity(-0.5)).toBe(fadeOpacity(0.5));
    expect(fadeOpacity(0.25)).toBeGreaterThan(fadeOpacity(0.5));
  });
});
