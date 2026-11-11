import { useEffect, useRef } from "react";
import type { GardenState } from "../types";
import type { Action } from "../lib/garden";
import { localDate, localTime } from "../lib/date";
import { shouldNotify } from "../lib/watering";
import { showNativeNotification } from "../ui/notify";

export const NOTIFY_CHECK_MS = 30_000;

/** 通知ONの間、マウント時と30秒ごとに「通知すべき時刻か」を確認する */
export function useWaterNotify(
  state: Pick<GardenState, "notifyOn" | "notifyTime" | "lastNotifyDate">,
  dueNames: string[],
  feedBedNames: string[],
  dispatch: (a: Action) => void,
  say: (m: string) => void,
) {
  const latest = useRef({ state, dueNames, feedBedNames });
  useEffect(() => {
    latest.current = { state, dueNames, feedBedNames };
  });

  const on = state.notifyOn;
  useEffect(() => {
    if (!on) return;
    const check = () => {
      const { state: s, dueNames: names, feedBedNames: feeds } = latest.current;
      const today = localDate();
      if (!shouldNotify(localTime(), s.notifyTime, s.lastNotifyDate, today)) return;
      dispatch({ type: "notified", today });
      if (names.length === 0 && feeds.length === 0) return;
      const parts = [
        ...(names.length ? [`水やりのタイミング：${names.join("、")}`] : []),
        ...(feeds.length ? [`追肥のタイミング：${feeds.join("、")}`] : []),
      ];
      const body = parts.join(" ／ ");
      if (!showNativeNotification("そだてる庭", body)) say(`${names.length ? "💧" : "🌱"} ${body}`);
    };
    check();
    const id = setInterval(check, NOTIFY_CHECK_MS);
    return () => clearInterval(id);
  }, [on, dispatch, say]);
}
