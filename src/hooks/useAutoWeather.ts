import { useCallback, useEffect, useRef, useState } from "react";
import type { GardenState } from "../types";
import type { Action } from "../lib/garden";
import { localDate } from "../lib/date";
import { FETCH_ERROR_MESSAGE, conditionInfo, fetchWeatherHere } from "../lib/weather";

/**
 * 位置情報で天気を取得する。結果は dispatch とトーストで反映する。
 * 自動取得ONで、今日まだ取得していなければマウント時に1回だけ取得する。
 */
export function useAutoWeather(
  state: Pick<GardenState, "autoWeather" | "weather">,
  dispatch: (a: Action) => void,
  say: (m: string) => void,
) {
  const [fetching, setFetching] = useState(false);
  const busy = useRef(false);

  const fetchNow = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setFetching(true);
    const result = await fetchWeatherHere();
    busy.current = false;
    setFetching(false);
    if (result.ok) {
      const { reading } = result;
      dispatch({ type: "weatherAuto", reading, fetchedAt: new Date().toISOString() });
      say(`📍 天気を自動入力：${conditionInfo(reading.condition).label} ${reading.tempC}℃（実際と違えば調整できます）`);
    } else {
      say(FETCH_ERROR_MESSAGE[result.error]);
    }
  }, [dispatch, say]);

  const initial = useRef(state);
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const { autoWeather, weather } = initial.current;
    const fetchedToday = weather.auto !== null && localDate(new Date(weather.auto.fetchedAt)) === localDate();
    if (autoWeather && !fetchedToday) void fetchNow();
  }, [fetchNow]);

  return { fetching, fetchNow };
}
