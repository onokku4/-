import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Crosshair, Grid3x3, Play, Rows3 } from "lucide-react";
import type { Bed, Photo } from "../types";
import type { Action } from "../lib/garden";
import { stageLine } from "../lib/photos";
import { dayLabel, fadeOpacity, framesFor } from "../lib/timelapse";
import { styles } from "../styles";
import { AlignedPhoto } from "./AlignedPhoto";
import { PhotoCapture } from "./PhotoCapture";
import { PhotoThumb } from "./PhotoThumb";

interface Props {
  bed: Bed;
  photos: Photo[];
  onOpenPhoto: (id: string) => void;
  onAlign: (id: string) => void;
  onTimelapse: () => void;
  say: (m: string) => void;
  dispatch: (a: Action) => void;
}

const fmt = (d: string) => d.replace(/-/g, ".");

/**
 * プランターを眺める。上が植えたて、下が今。スクロールして画面の中央に来た写真が不透明に、
 * 離れるほど薄くなる。写真は鉢の枠に合わせてあるので、スクロールで成長がつながって見える
 */
export function GazeView({ bed, photos: all, onOpenPhoto, onAlign, onTimelapse, say, dispatch }: Props) {
  const frames = framesFor(all, bed.id);
  const [mode, setMode] = useState<"gaze" | "grid">("gaze");
  const scroller = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const [center, setCenter] = useState(frames.length - 1);
  const [near, setNear] = useState<Set<number>>(() => new Set(frames.map((_, i) => i).slice(-4)));
  const raf = useRef(0);

  const paint = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const half = el.clientHeight / 2 || 1;
    const mid = el.scrollTop + half;
    // 隣の写真がほどよく透けて見えるよう、画面の高さの85%で正規化する
    const reach = el.clientHeight * 0.85 || 1;
    let best = 0;
    let bestD = Infinity;
    const close = new Set<number>();
    items.current.forEach((it, i) => {
      if (!it) return;
      const c = it.offsetTop + it.offsetHeight / 2;
      const d = (c - mid) / reach;
      const o = fadeOpacity(d);
      it.style.opacity = String(o);
      it.style.transform = `scale(${0.88 + 0.12 * o})`;
      if (Math.abs(d) < bestD) {
        bestD = Math.abs(d);
        best = i;
      }
      if (Math.abs(d) < 2.5) close.add(i);
    });
    setCenter((c) => (c === best ? c : best));
    setNear((n) => (n.size === close.size && [...close].every((i) => n.has(i)) ? n : close));
  }, []);

  const onScroll = () => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(paint);
  };

  // はじめは今（いちばん下）を中央に
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || mode !== "gaze") return;
    el.scrollTop = el.scrollHeight;
    paint();
  }, [mode, frames.length, paint]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const cur = frames[center];
  const first = frames[0];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <span style={styles.calNote}>
          {frames.length > 0 ? `${frames.length}枚・${first ? fmt(first.date) : ""} から` : "撮影すると、鉢の枠に合わせて成長を並べられます。"}
        </span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {frames.length > 0 && (
            <button style={styles.histBtn} onClick={() => setMode(mode === "gaze" ? "grid" : "gaze")} aria-label={mode === "gaze" ? "一覧で見る" : "眺める"}>
              {mode === "gaze" ? <Grid3x3 size={14} aria-hidden="true" /> : <Rows3 size={14} aria-hidden="true" />}
            </button>
          )}
          {frames.length >= 2 && (
            <button style={styles.addBtn} onClick={onTimelapse}>
              <Play size={14} aria-hidden="true" /> タイムラプス
            </button>
          )}
          <PhotoCapture bedId={bed.id} dispatch={dispatch} say={say} compact={frames.length > 0} onCaptured={onAlign} />
        </div>
      </div>

      {frames.length === 0 ? (
        <div style={styles.empty}>
          <p style={styles.emptyText}>まだ写真がありません。毎回同じ位置から撮ると、タイムラプスがきれいにつながります。</p>
        </div>
      ) : mode === "grid" ? (
        <div style={styles.albumGrid}>
          {[...frames].reverse().map((p) => (
            <figure key={p.id} style={styles.albumItem}>
              <PhotoThumb id={p.id} alt={`${p.date} ${stageLine(p.stages)}`} style={styles.albumThumb} onClick={() => onOpenPhoto(p.id)} />
              <figcaption style={styles.albumCap}>
                <div style={styles.albumDate}>{p.date.slice(5).replace("-", "/")}</div>
                <div style={styles.albumStage}>{dayLabel(p)}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div style={styles.gazeWrap}>
          {cur && (
            <div style={styles.gazeBand} aria-live="polite">
              <span style={styles.gazeDay}>{dayLabel(cur)}</span>
              <span style={styles.gazeDate}>{fmt(cur.date)}</span>
            </div>
          )}
          <div ref={scroller} onScroll={onScroll} style={styles.gazeScroller} role="list" aria-label={`${bed.name}の成長（上が植えたて、下が今）`}>
            <div style={styles.gazeSpacer}>
              <span style={styles.gazeEnd}>▲ 植えたて</span>
            </div>
            {frames.map((p, i) => (
              <div key={p.id} ref={(el) => void (items.current[i] = el)} role="listitem" style={styles.gazeItem}>
                <button style={styles.gazeBtn} onClick={() => onOpenPhoto(p.id)} aria-label={`${p.date} ${stageLine(p.stages)}`}>
                  <AlignedPhoto id={p.id} align={p.align} alt="" lazy={!near.has(i)} style={{ height: "100%", borderRadius: 16 }} />
                </button>
                {i === center && (
                  <button style={styles.gazeAlignBtn} onClick={() => onAlign(p.id)} aria-label="この写真の位置を合わせる">
                    <Crosshair size={14} aria-hidden="true" /> 位置合わせ
                  </button>
                )}
              </div>
            ))}
            <div style={styles.gazeSpacer}>
              <span style={{ ...styles.gazeEnd, alignSelf: "flex-start" }}>今 ▼</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
