import { describe, expect, it } from "vitest";
import { apply, initialState, type Action } from "../src/lib/garden";
import { dayInfo } from "../src/lib/calendar";
import { growthStages, photosByBed, stageLine } from "../src/lib/photos";
import { normalize } from "../src/lib/storage";
import type { GardenState } from "../src/types";

const T = "2026-11-12";
let seq = 0;
const plant = (cropId: string, varietyId: string, extra: Partial<Extract<Action, { type: "plant" }>> = {}): Action => ({
  type: "plant", uid: `p${++seq}`, cropId, varietyId, projectName: "", plantedDate: T, bedId: "bed_1", today: T, ...extra,
});
const run = (s: GardenState, ...actions: Action[]) => actions.reduce((st, a) => apply(st, a).state, s);

describe("成長記録の写真", () => {
  it("撮影日時点の「植え付けから何日目」を株ごとに残す", () => {
    const s = run(initialState(), plant("tomato", "aiko", { plantedDate: "2026-11-01" }), plant("blueberry", "festival", { plantedDate: "2026-06-01" }));
    const st = growthStages(s.plants, "bed_1", T);
    expect(st).toEqual([
      { label: "トマト（アイコ）", emoji: "🍅", day: 11 },
      { label: "ブルーベリー（フェスティバル）", emoji: "🫐", day: 164 },
    ]);
    expect(stageLine(st)).toBe("🍅 トマト（アイコ） 11日目・🫐 ブルーベリー（フェスティバル） 164日目");
    expect(stageLine(growthStages(s.plants, "bed_1", "2026-05-01"))).toBe("まだ何も植えていない頃");
    expect(growthStages(s.plants, "other", T)).toEqual([]);
  });
  it("写真を登録するとXPが付き、株を片付けても何日目かは残る", () => {
    const s = run(initialState(), plant("tomato", "aiko", { plantedDate: "2026-11-01" }));
    const out = apply(s, { type: "addPhoto", id: "ph1", bedId: "bed_1", date: T, note: " 本葉が出た ", today: T });
    expect(out.state.photos[0]).toMatchObject({ id: "ph1", bedId: "bed_1", date: T, note: "本葉が出た", stages: [{ day: 11 }] });
    expect(out.state.xp).toBe(s.xp + 5);
    expect(out.toast).toContain("記録");
    const removedPlant = run(out.state, { type: "remove", uid: s.plants[0]!.uid });
    expect(removedPlant.photos[0]?.stages[0]?.label).toBe("トマト（アイコ）");
    // 同じIDの二重登録、存在しない場所は無視
    expect(apply(out.state, { type: "addPhoto", id: "ph1", bedId: "bed_1", date: T, note: "", today: T }).state).toBe(out.state);
    expect(apply(s, { type: "addPhoto", id: "x", bedId: "nope", date: T, note: "", today: T }).state).toBe(s);
  });
  it("メモの編集と削除", () => {
    const s = run(initialState(), { type: "addPhoto", id: "ph1", bedId: "bed_1", date: T, note: "", today: T });
    expect(run(s, { type: "setPhotoNote", id: "ph1", note: "花が咲いた" }).photos[0]?.note).toBe("花が咲いた");
    expect(run(s, { type: "removePhoto", id: "ph1" }).photos).toEqual([]);
    expect(apply(s, { type: "removePhoto", id: "zz" }).state).toBe(s);
  });
  it("場所ごと・日付順に並ぶ。カレンダーの日にも出る", () => {
    const s = run(
      initialState(),
      { type: "addBed", id: "b2", soil: "field", today: T },
      { type: "addPhoto", id: "c", bedId: "bed_1", date: "2026-11-10", note: "", today: T },
      { type: "addPhoto", id: "a", bedId: "bed_1", date: "2026-11-01", note: "", today: T },
      { type: "addPhoto", id: "b", bedId: "b2", date: "2026-11-05", note: "", today: T },
    );
    const m = photosByBed(s.photos);
    expect(m.get("bed_1")?.map((p) => p.id)).toEqual(["a", "c"]);
    expect(m.get("b2")?.map((p) => p.id)).toEqual(["b"]);
    expect(dayInfo(s, "2026-11-05", T).photos.map((p) => p.id)).toEqual(["b"]);
  });
  it("保存データの往復。場所が消えた写真は残り、壊れた値は落ちる", () => {
    const s = run(initialState(), plant("tomato", "aiko"), { type: "addPhoto", id: "ph1", bedId: "bed_1", date: T, note: "x", today: T });
    expect(normalize(JSON.parse(JSON.stringify(s)))).toEqual(s);
    const n = normalize({ beds: [{ id: "b" }], photos: [{ id: "ok", bedId: "b", date: T, stages: [{ label: "x", day: -3 }, { nope: 1 }] }, { id: "gone", bedId: "zz", date: T }, { id: 1 }] });
    expect(n.photos.map((p) => p.id)).toEqual(["ok", "gone"]);
    expect(n.photos[0]?.stages).toEqual([{ label: "x", emoji: "🌱", day: 0 }]);
  });
});

describe("場所の削除", () => {
  it("株がなければ消せる。株があれば断る。最後の1つは消せない。写真は残る", () => {
    const s = run(initialState(), { type: "addBed", id: "b2", soil: "planter", today: T }, plant("tomato", "aiko", { bedId: "b2" }), { type: "addPhoto", id: "ph", bedId: "b2", date: T, note: "", today: T });
    const refused = apply(s, { type: "removeBed", bedId: "b2" });
    expect(refused.state).toBe(s);
    expect(refused.toast).toContain("まだ1株");
    const cleared = run(s, { type: "remove", uid: s.plants[0]!.uid });
    const out = apply(cleared, { type: "removeBed", bedId: "b2" });
    expect(out.state.beds.map((b) => b.id)).toEqual(["bed_1"]);
    expect(out.state.photos).toHaveLength(1);
    expect(normalize(JSON.parse(JSON.stringify(out.state))).photos).toHaveLength(1);
    expect(apply(out.state, { type: "removeBed", bedId: "bed_1" }).toast).toContain("最後");
    expect(apply(out.state, { type: "removeBed", bedId: "zz" }).state).toBe(out.state);
  });
});
