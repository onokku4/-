import { describe, expect, it } from "vitest";
import { dayInfo, loggedDays, monthGrid, shiftMonth } from "../src/lib/calendar";
import { apply, initialState, type Action } from "../src/lib/garden";
import { normalize } from "../src/lib/storage";
import { lastWaterOrRain, plantStatus } from "../src/lib/watering";
import { manualDaily, mergeLog, parseDaily } from "../src/lib/weather";
import type { GardenState, WeatherLog } from "../src/types";

const T = "2026-11-11";
let seq = 0;
const plant = (cropId: string, varietyId: string, extra: Partial<Extract<Action, { type: "plant" }>> = {}): Action => ({
  type: "plant", uid: `c${++seq}`, cropId, varietyId, projectName: "", plantedDate: T, bedId: "bed_1", today: T, ...extra,
});
const run = (s: GardenState, ...actions: Action[]) => actions.reduce((st, a) => apply(st, a).state, s);

const SAMPLE = {
  daily: {
    time: ["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "bad"],
    weather_code: [3, 63, 0, 71, 0],
    temperature_2m_max: [16.4, 14.2, 18.9, 5.1, 10],
    temperature_2m_min: [8.1, 10.0, 7.5, -1.2, 1],
    precipitation_sum: [0, 27.4, 0.2, 4.0, 0],
    wind_speed_10m_max: [3, 4.9, 9.5, 2, 1],
  },
};

describe("天気の記録", () => {
  it("Open-Meteo の日別応答を取り込む。不正な日付は捨てる", () => {
    const log = parseDaily(SAMPLE);
    expect(Object.keys(log)).toEqual(["2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12"]);
    expect(log["2026-11-10"]).toEqual({ condition: "rainy", maxC: 14, minC: 10, rainMm: 27.4, source: "auto" });
    expect(log["2026-11-11"]?.condition).toBe("windy");
    expect(log["2026-11-12"]?.condition).toBe("snowy");
    expect(parseDaily(null)).toEqual({});
    expect(parseDaily({ daily: { time: ["2026-11-09"], weather_code: [null] } })).toEqual({});
  });
  it("手で直した日は自動値で上書きしない", () => {
    const manual: WeatherLog = { "2026-11-10": manualDaily({ condition: "sunny", tempC: 20 }) };
    const merged = mergeLog(manual, parseDaily(SAMPLE));
    expect(merged["2026-11-10"]?.condition).toBe("sunny");
    expect(merged["2026-11-09"]?.condition).toBe("cloudy");
  });
  it("手動の雨は降水量の目安が入る", () => {
    expect(manualDaily({ condition: "rainy", tempC: 15 }).rainMm).toBeGreaterThan(0);
    expect(manualDaily({ condition: "sunny", tempC: 15 }).rainMm).toBe(0);
  });
  it("自動取得で記録が溜まり、手動調整は今日の記録になる", () => {
    const s = run(initialState(), { type: "weatherAuto", reading: { condition: "sunny", tempC: 19 }, fetchedAt: "x", daily: parseDaily(SAMPLE) });
    expect(Object.keys(s.weatherLog)).toHaveLength(4);
    const adj = run(s, { type: "weatherAdjust", patch: { condition: "rainy" }, today: T });
    expect(adj.weatherLog[T]).toMatchObject({ condition: "rainy", source: "manual" });
    const back = run(adj, { type: "weatherReset", today: T });
    expect(back.weatherLog[T]).toMatchObject({ condition: "sunny", source: "auto" });
  });
});

describe("雨を水やりとして数える", () => {
  const log: WeatherLog = {
    "2026-11-08": { condition: "rainy", maxC: 15, minC: 10, rainMm: 7, source: "auto" },
    "2026-11-10": { condition: "rainy", maxC: 15, minC: 10, rainMm: 12, source: "auto" },
    "2026-11-13": { condition: "rainy", maxC: 15, minC: 10, rainMm: 30, source: "auto" },
  };
  it("地植えは5mm、鉢は10mm以上の雨で水やり扱い。予報（未来）は数えない", () => {
    const s = run(initialState(), { type: "addBed", id: "f", soil: "field", today: T }, plant("tomato", "aiko", { plantedDate: "2026-11-01" }), plant("tomato", "aiko", { plantedDate: "2026-11-01", bedId: "f" }));
    const [pot, field] = s.plants;
    expect(lastWaterOrRain(pot!, s.beds[0], log, T)).toEqual({ date: "2026-11-10", byRain: true });
    expect(lastWaterOrRain(field!, s.beds[1], log, "2026-11-09")).toEqual({ date: "2026-11-08", byRain: true });
    expect(lastWaterOrRain(field!, s.beds[1], log, T).date).toBe("2026-11-10");
  });
  it("自分で水やりした日のほうが新しければそちら", () => {
    const s = run(initialState(), plant("tomato", "aiko", { plantedDate: "2026-11-01" }));
    const watered = run(s, { type: "water", uid: s.plants[0]!.uid, today: T });
    expect(lastWaterOrRain(watered.plants[0]!, s.beds[0], log, T)).toEqual({ date: T, byRain: false });
    expect(watered.careLog).toEqual([{ date: T, kind: "water", label: "トマト（アイコ）" }]);
  });
  it("植え付け前の雨は数えない。水耕は雨に当たらない", () => {
    const s = run(initialState(), { type: "addBed", id: "h", soil: "hydro", today: T }, plant("lettuce", "sunny", { bedId: "h", plantedDate: "2026-11-09" }));
    expect(lastWaterOrRain(s.plants[0]!, s.beds[1], log, T).byRain).toBe(false);
    const pot = run(initialState(), plant("tomato", "aiko", { plantedDate: T }));
    expect(lastWaterOrRain(pot.plants[0]!, pot.beds[0], log, T).date).toBe(T);
  });
  it("次の水やり日が出る", () => {
    const s = run(initialState(), plant("tomato", "aiko", { plantedDate: "2026-11-01" }));
    const st = plantStatus(s.plants[0]!, s.beds[0], { condition: "sunny", tempC: 20 }, T, log)!;
    expect(st.byRain).toBe(true);
    expect(st.lastWatered).toBe("2026-11-10");
    expect(st.nextDue >= T).toBe(true);
    const dry = plantStatus(s.plants[0]!, s.beds[0], { condition: "sunny", tempC: 35 }, T, {})!;
    expect(dry.due).toBe(true);
    expect(dry.nextDue).toBe(T);
  });
});

describe("カレンダー", () => {
  it("月のマス目は日曜始まりで42マス", () => {
    const g = monthGrid(2026, 11);
    expect(g).toHaveLength(42);
    expect(g[0]?.date).toBe("2026-11-01"); // 2026-11-01 は日曜
    expect(g.filter((c) => c.inMonth)).toHaveLength(30);
    expect(monthGrid(2026, 12)[0]?.date).toBe("2026-11-29");
  });
  it("月の前後移動は年をまたぐ", () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });
  it("日ごとの出来事と水やり予定", () => {
    const s0 = run(initialState(), plant("tomato", "aiko", { plantedDate: "2026-11-01" }));
    const s = run(s0, { type: "water", uid: s0.plants[0]!.uid, today: "2026-11-10" }, { type: "feedBed", bedId: "bed_1", fertilizer: "liquid", today: T });
    const past = dayInfo(s, "2026-11-10", T);
    expect(past.care.map((c) => c.kind)).toEqual(["water"]);
    expect(past.waterDue).toEqual([]);
    expect(dayInfo(s, T, T).care.map((c) => c.kind)).toEqual(["feed"]);
    expect(dayInfo(s, "2026-11-01", T).planted).toHaveLength(1);
    // 晴れ20℃のトマト（1日おき）は 11/10 に水やり → 11/12 が予定
    const due = dayInfo(s, "2026-11-12", T);
    expect(due.forecast).toBe(true);
    expect(due.waterDue).toHaveLength(1);
  });
  it("記録日数", () => {
    expect(loggedDays({}, T)).toBe(0);
    expect(loggedDays(parseDaily(SAMPLE), T)).toBe(3);
  });
});

describe("保存データ", () => {
  it("天気の記録と世話の記録が往復し、壊れた値は落ちる", () => {
    const s = run(initialState(), { type: "weatherAuto", reading: { condition: "sunny", tempC: 19 }, fetchedAt: "x", daily: parseDaily(SAMPLE) }, plant("tomato", "aiko"));
    const w = run(s, { type: "water", uid: s.plants[0]!.uid, today: T });
    expect(normalize(JSON.parse(JSON.stringify(w)))).toEqual(w);
    const n = normalize({ weatherLog: { "2026-11-01": { condition: "nope" }, bad: { condition: "sunny" }, "2026-11-02": { condition: "sunny", maxC: 99 } }, careLog: [{ date: T, kind: "water", label: "x" }, { kind: "zzz" }] });
    expect(Object.keys(n.weatherLog)).toEqual(["2026-11-02"]);
    expect(n.weatherLog["2026-11-02"]?.maxC).toBe(45);
    expect(n.careLog).toHaveLength(1);
  });
});
