import { useCallback, useEffect, useRef, useState } from "react";
import type { GardenState } from "../types";
import type { Action } from "../lib/garden";
import { localDate } from "../lib/date";
import { FETCH_ERROR_MESSAGE, backfillRange, conditionInfo, fetchArchive, fetchWeatherAt, fetchWeatherHere } from "../lib/weather";

type Slice = Pick<GardenState, "autoWeather" | "weather" | "location" | "plants" | "harvestLog" | "weatherLog">;

/**
 * 天気の自動取得。
 * 庭の位置を登録済みならその座標で（位置情報の許可は不要）、未登録なら位置情報で取る。
 * 取得後、植え付け以降で天気の記録が欠けていれば過去データを取り込む。
 * 自動取得ONで今日まだ取得していなければ、マウント時に1回だけ取得する。
 */
export function useAutoWeather(state: Slice, dispatch: (a: Action) => void, say: (m: string) => void) {
  const [fetching, setFetching] = useState(false);
  const busy = useRef(false);
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  });

  const backfill = useCallback(
    async (loc: { lat: number; lon: number }) => {
      const s = latest.current;
      const planted = [...s.plants.map((p) => p.plantedDate), ...s.harvestLog.map((h) => h.plantedDate)];
      const range = backfillRange(s.weatherLog, planted, localDate());
      if (!range) return;
      const daily = await fetchArchive(loc, range.start, range.end);
      const got = Object.keys(daily).filter((d) => !s.weatherLog[d]).length;
      if (got === 0) return;
      dispatch({ type: "weatherBackfill", daily });
      say(`📚 植え付け以降の天気を${got}日ぶん取り込みました`);
    },
    [dispatch, say],
  );

  /** register=true なら位置情報で取り、その座標を庭の位置として登録する */
  const fetchNow = useCallback(
    async (register = false) => {
      if (busy.current) return;
      busy.current = true;
      setFetching(true);
      const loc = latest.current.location;
      const result = !register && loc ? await fetchWeatherAt(loc.lat, loc.lon) : await fetchWeatherHere();
      busy.current = false;
      setFetching(false);
      if (!result.ok) {
        say(FETCH_ERROR_MESSAGE[result.error]);
        return;
      }
      const { reading, daily } = result;
      const today = localDate();
      if (register) dispatch({ type: "setLocation", lat: result.lat, lon: result.lon, today });
      dispatch({ type: "weatherAuto", reading, fetchedAt: new Date().toISOString(), daily });
      say(
        register
          ? `📍 庭の位置を登録しました。天気：${conditionInfo(reading.condition).label} ${reading.tempC}℃`
          : `📍 天気を自動入力：${conditionInfo(reading.condition).label} ${reading.tempC}℃（実際と違えば調整できます）`,
      );
      // 取り込んだ92日より前に欠けがあれば過去データで埋める
      const where = register || loc ? { lat: result.lat, lon: result.lon } : null;
      if (where) {
        // weatherAuto の反映後に欠けを数えたいので、1ティック待つ
        await new Promise((r) => setTimeout(r, 0));
        await backfill(where);
      }
    },
    [dispatch, say, backfill],
  );

  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const { autoWeather, weather, location } = latest.current;
    const fetchedToday = weather.auto !== null && localDate(new Date(weather.auto.fetchedAt)) === localDate();
    if ((autoWeather || location) && !fetchedToday) void fetchNow();
  }, [fetchNow]);

  return { fetching, fetchNow: () => fetchNow(false), register: () => fetchNow(true) };
}
