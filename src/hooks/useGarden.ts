import { useCallback, useEffect, useRef, useState } from "react";
import type { BadgeId, GardenState } from "../types";
import { apply, type Action } from "../lib/garden";
import { load, save } from "../lib/storage";

export const TOAST_MS = 2200;

export interface Garden {
  state: GardenState;
  dispatch: (action: Action) => void;
  toast: string | null;
  /** 任意のメッセージをトーストで出す（天気取得結果など） */
  say: (message: string) => void;
  /** バッジ獲得ポップアップの順番待ち。先頭が表示中 */
  badgeQueue: BadgeId[];
  dismissBadge: () => void;
}

export function useGarden(): Garden {
  const [state, setState] = useState<GardenState>(load);
  const [toast, setToast] = useState<string | null>(null);
  const [badgeQueue, setBadgeQueue] = useState<BadgeId[]>([]);
  // dispatch を連続で呼んでも最新の状態から遷移させるため、状態の写しを持つ
  const latest = useRef(state);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const say = useCallback((message: string) => {
    clearTimeout(timer.current);
    setToast(message);
    timer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const dispatch = useCallback(
    (action: Action) => {
      const out = apply(latest.current, action);
      if (out.state !== latest.current) {
        latest.current = out.state;
        setState(out.state);
        save(out.state);
      }
      if (out.toast) say(out.toast);
      if (out.newBadges.length > 0) setBadgeQueue((q) => [...q, ...out.newBadges]);
    },
    [say],
  );

  const dismissBadge = useCallback(() => setBadgeQueue((q) => q.slice(1)), []);

  return { state, dispatch, toast, say, badgeQueue, dismissBadge };
}
