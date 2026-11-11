import { describe, expect, it } from "vitest";
import { apply, initialState, type Action } from "../src/lib/garden";
import { normalize } from "../src/lib/storage";
import { daysBetween, localDate } from "../src/lib/date";
import { plantStatus, shouldNotify } from "../src/lib/watering";
import { adjust, applyAuto, conditionFromWmo, isAdjusted, resetToAuto, weatherMultiplier, DEFAULT_WEATHER } from "../src/lib/weather";
import type { GardenState } from "../src/types";

const T = "2026-11-11";
let seq = 0;
const plant = (cropId: string, varietyId: string, extra: Partial<Extract<Action, { type: "plant" }>> = {}): Action => ({
  type: "plant", uid: `u${++seq}`, cropId, varietyId, projectName: "", plantedDate: T, bedId: "bed_1", today: T, ...extra,
});
const run = (s: GardenState, ...actions: Action[]) => actions.reduce((st, a) => apply(st, a).state, s);

describe("日付", () => {
  it("ローカル日付を返す（UTCにずれない）", () => {
    expect(localDate(new Date(2026, 10, 11, 8, 25))).toBe("2026-11-11");
    expect(localDate(new Date(2026, 0, 1, 0, 5))).toBe("2026-01-01");
  });
  it("日数差", () => {
    expect(daysBetween("2026-11-01", "2026-11-11")).toBe(10);
    expect(daysBetween("2026-02-28", "2026-03-01")).toBe(1);
  });
});

describe("天気", () => {
  it("WMOコードと風速から区分を決める", () => {
    expect(conditionFromWmo(0, 2)).toBe("sunny");
    expect(conditionFromWmo(3, 2)).toBe("cloudy");
    expect(conditionFromWmo(61, 2)).toBe("rainy");
    expect(conditionFromWmo(73, 2)).toBe("snowy");
    expect(conditionFromWmo(86, 2)).toBe("snowy");
    expect(conditionFromWmo(1, 10)).toBe("windy");
    expect(conditionFromWmo(63, 10)).toBe("rainy");
  });
  it("自動取得後に人が調整でき、自動値に戻せる", () => {
    const auto = applyAuto({ condition: "cloudy", tempC: 14 }, "2026-11-11T08:25:00+09:00");
    expect(isAdjusted(auto)).toBe(false);
    const fixed = adjust(adjust(auto, { condition: "sunny" }), { tempC: 17 });
    expect(fixed.current).toEqual({ condition: "sunny", tempC: 17 });
    expect(fixed.auto?.tempC).toBe(14);
    expect(isAdjusted(fixed)).toBe(true);
    expect(resetToAuto(fixed).current).toEqual({ condition: "cloudy", tempC: 14 });
  });
  it("気温は範囲内に丸める。未取得なら調整済み扱いにしない", () => {
    expect(adjust(DEFAULT_WEATHER, { tempC: 99 }).current.tempC).toBe(45);
    expect(adjust(DEFAULT_WEATHER, { tempC: Number.NaN }).current.tempC).toBe(20);
    expect(isAdjusted(adjust(DEFAULT_WEATHER, { tempC: 5 }))).toBe(false);
  });
  it("暑いほど水やり間隔が短く、雨・寒さで長くなる", () => {
    const base = weatherMultiplier({ condition: "sunny", tempC: 20 });
    expect(weatherMultiplier({ condition: "sunny", tempC: 33 })).toBeLessThan(base);
    expect(weatherMultiplier({ condition: "rainy", tempC: 20 })).toBeGreaterThan(base);
    expect(weatherMultiplier({ condition: "sunny", tempC: 2 })).toBeGreaterThan(base);
  });
});

describe("状態遷移", () => {
  it("植えるとXP・連続日数・バッジが付き、名前は自動で付く", () => {
    const out = apply(initialState(), plant("tomato", "aiko"));
    expect(out.state.plants[0]?.projectName).toBe("トマト（アイコ）");
    expect(out.state.xp).toBe(15);
    expect(out.state.streak).toBe(1);
    expect(out.newBadges).toEqual(["first"]);
  });

  it("果樹は水耕に植えられない", () => {
    const s = run(initialState(), { type: "addBed", id: "h1", soil: "hydro" });
    const out = apply(s, plant("lemon", "meyer", { bedId: "h1" }));
    expect(out.state.plants).toHaveLength(0);
    expect(out.toast).toContain("育てられません");
  });

  it("受粉相手が揃うと縁結びバッジ", () => {
    const first = apply(initialState(), plant("blueberry", "tifblue"));
    expect(first.newBadges).toContain("fruit");
    expect(first.newBadges).not.toContain("matchmaker");
    expect(apply(first.state, plant("blueberry", "homebell")).newBadges).toEqual(["matchmaker"]);
  });

  it("一年生は収穫で片付き、土の栄養が減る", () => {
    const s = run(initialState(), plant("tomato", "aiko", { uid: "t" }), { type: "harvest", uid: "t", recordId: "h", today: T });
    expect(s.plants).toHaveLength(0);
    expect(s.harvestLog[0]?.varietyName).toBe("アイコ");
    expect(s.beds[0]).toMatchObject({ uses: 1 });
    expect(s.beds[0]!.k).toBeLessThan(100);
  });

  it("果樹は収穫しても株が残り、収穫回数が増える", () => {
    const s = run(initialState(), plant("lemon", "meyer", { uid: "l" }),
      { type: "harvest", uid: "l", recordId: "h1", today: T }, { type: "harvest", uid: "l", recordId: "h2", today: T });
    expect(s.plants[0]?.harvestCount).toBe(2);
    expect(s.harvestLog).toHaveLength(2);
  });

  it("連続日数は翌日で+1、空くと1に戻る", () => {
    let s = run(initialState(), plant("basil", "sweet", { uid: "b" }));
    s = run(s, { type: "water", uid: "b", today: "2026-11-12" });
    expect(s.streak).toBe(2);
    s = run(s, { type: "water", uid: "b", today: "2026-11-12" });
    expect(s.streak).toBe(2);
    s = run(s, { type: "water", uid: "b", today: "2026-11-15" });
    expect(s.streak).toBe(1);
  });

  it("場所の自動命名は種類ごとにA,B,C", () => {
    const s = run(initialState(), { type: "addBed", id: "p2", soil: "planter" }, { type: "addBed", id: "f1", soil: "field" });
    expect(s.beds.map((b) => b.name)).toEqual(["プランターA", "プランターB", "畑A"]);
  });

  it("存在しない株への操作は何も変えない", () => {
    const s = initialState();
    expect(apply(s, { type: "water", uid: "x", today: T }).state).toBe(s);
    expect(apply(s, { type: "harvest", uid: "x", recordId: "h", today: T }).state).toBe(s);
  });
});

describe("水やり判定", () => {
  const s = run(initialState(), plant("lemon", "meyer", { uid: "l", plantedDate: "2026-11-01" }));
  const p = s.plants[0]!;
  it("天気と気温で間隔が変わる", () => {
    const warm = plantStatus(p, s.beds[0], { condition: "sunny", tempC: 20 }, T)!;
    const rain = plantStatus(p, s.beds[0], { condition: "rainy", tempC: 20 }, T)!;
    expect(warm.interval).toBe(2);
    expect(rain.interval).toBe(5);
    expect(warm.due).toBe(true);
  });
  it("果樹は成長率ではなく収穫期で表す。冷え込みで防寒警告", () => {
    const st = plantStatus(p, s.beds[0], { condition: "sunny", tempC: 2 }, T)!;
    expect(st.growthPct).toBeNull();
    expect(st.inSeason).toBe(true);
    expect(st.frostRisk).toBe(true);
    expect(plantStatus(p, s.beds[0], { condition: "sunny", tempC: 10 }, T)!.frostRisk).toBe(false);
  });
  it("通知は指定時刻を過ぎて、その日まだなら出す", () => {
    expect(shouldNotify("06:59", "07:00", null, T)).toBe(false);
    expect(shouldNotify("08:25", "07:00", null, T)).toBe(true);
    expect(shouldNotify("08:25", "07:00", T, T)).toBe(false);
  });
});

describe("保存データの正規化", () => {
  it("壊れた入力は初期状態になる", () => {
    for (const bad of [null, 1, "x", [], {}]) expect(normalize(bad).beds).toHaveLength(1);
  });
  it("旧形式（天気が文字列・品種なし・場所タイプなし）を引き継ぐ", () => {
    const s = normalize({
      plants: [{ uid: "a", cropId: "tomato", plantedDate: "2026-10-01", bedId: "b" }, { uid: "z", cropId: "gone", plantedDate: "2026-10-01" }],
      beds: [{ id: "b", name: "プランターA", uses: 2, n: 80, p: 70, k: 60 }],
      weather: "hot", xp: 40, earnedBadges: ["first", "bogus"],
    });
    expect(s.plants).toHaveLength(1);
    expect(s.plants[0]).toMatchObject({ varietyId: "momotaro", projectName: "トマト（桃太郎）", harvestCount: 0 });
    expect(s.beds[0]?.type).toBe("planter");
    expect(s.weather.current).toEqual({ condition: "sunny", tempC: 33 });
    expect(s.earnedBadges).toEqual(["first"]);
  });
  it("現行形式は往復しても変わらない", () => {
    const s = run(initialState(), plant("kiwi", "hayward"), { type: "weatherAuto", reading: { condition: "cloudy", tempC: 14 }, fetchedAt: "2026-11-11T08:25:00+09:00" });
    expect(normalize(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
});

describe("プロジェクト名の自動命名", () => {
  it("品種名の補足を落として短くする", () => {
    const s = run(initialState(), plant("blueberry", "tifblue"), plant("kiwi", "hayward"), plant("tomato", "chika"));
    expect(s.plants.map((p) => p.projectName)).toEqual(["ブルーベリー（ティフブルー）", "キウイフルーツ（ヘイワード）", "トマト（千果）"]);
  });
});
