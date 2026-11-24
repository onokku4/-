import { useRef, useState } from "react";
import { Check, Layers, RotateCcw, X } from "lucide-react";
import type { Align, Bed, Photo } from "../types";
import type { Action } from "../lib/garden";
import { stageLine } from "../lib/photos";
import { DEFAULT_ALIGN, POT_SHAPES, ROTATE_MAX, SCALE_MAX, SCALE_MIN, clampAlign, framesFor } from "../lib/timelapse";
import { useEscape } from "../hooks/useEscape";
import { styles } from "../styles";
import { AlignedPhoto } from "./AlignedPhoto";
import { PotFrame } from "./PotFrame";

interface Props {
  photo: Photo;
  bed: Bed | undefined;
  photos: Photo[];
  dispatch: (a: Action) => void;
  onClose: () => void;
}

type Pt = { x: number; y: number };

/**
 * 写真の鉢を、画面の鉢の枠に合わせる。ドラッグで移動、2本指（またはスライダー）で拡大・回転。
 * 前回の写真を薄く重ねて、同じ位置にそろえられる
 */
export function AlignEditor({ photo, bed, photos, dispatch, onClose }: Props) {
  const [align, setAlign] = useState<Align>(photo.align ?? DEFAULT_ALIGN);
  const [ghost, setGhost] = useState(true);
  const stage = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Pt>());
  const pinch = useRef<{ dist: number; angle: number; mid: Pt } | null>(null);
  useEscape(onClose);

  const shape = bed?.potShape ?? "rect";
  const series = bed ? framesFor(photos, bed.id) : [];
  const idx = series.findIndex((p) => p.id === photo.id);
  const prev = idx > 0 ? series[idx - 1] : undefined;

  const size = () => stage.current?.clientWidth || 1;
  const update = (f: (a: Align) => Partial<Align>) => setAlign((a) => clampAlign({ ...a, ...f(a) }));

  const twoFinger = () => {
    const [a, b] = [...pointers.current.values()];
    if (!a || !b) return null;
    return {
      dist: Math.hypot(b.x - a.x, b.y - a.y),
      angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    };
  };

  const onDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    pinch.current = pointers.current.size === 2 ? twoFinger() : null;
  };
  const onMove = (e: React.PointerEvent) => {
    const before = pointers.current.get(e.pointerId);
    if (!before) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const L = size();
    if (pointers.current.size === 1) {
      const dx = (e.clientX - before.x) / L;
      const dy = (e.clientY - before.y) / L;
      update((a) => ({ x: a.x + dx, y: a.y + dy }));
    } else if (pointers.current.size === 2 && pinch.current) {
      const now = twoFinger();
      if (!now) return;
      const p = pinch.current;
      update((a) => ({
        scale: a.scale * (now.dist / (p.dist || 1)),
        rotate: a.rotate + (now.angle - p.angle),
        x: a.x + (now.mid.x - p.mid.x) / L,
        y: a.y + (now.mid.y - p.mid.y) / L,
      }));
      pinch.current = now;
    }
  };
  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    pinch.current = pointers.current.size === 2 ? twoFinger() : null;
  };
  const onWheel = (e: React.WheelEvent) => update((a) => ({ scale: a.scale * (e.deltaY < 0 ? 1.05 : 1 / 1.05) }));

  const save = () => {
    dispatch({ type: "setPhotoAlign", id: photo.id, align });
    onClose();
  };

  return (
    <div style={styles.viewer} role="dialog" aria-modal="true" aria-label="鉢の位置合わせ">
      <div style={styles.viewerTop}>
        <button style={styles.viewerBtn} onClick={onClose} aria-label="位置合わせをやめる">
          <X size={20} aria-hidden="true" />
        </button>
        <span style={{ ...styles.viewerCounter, textAlign: "center" }}>
          鉢を枠に合わせる
          <span style={{ display: "block", fontSize: 11, opacity: 0.8 }}>{stageLine(photo.stages)}</span>
        </span>
        <button style={{ ...styles.viewerBtn, width: "auto", padding: "0 12px", background: "var(--mint)", borderColor: "var(--mint)", fontWeight: 700 }} onClick={save}>
          <Check size={18} aria-hidden="true" /> 保存
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
        <div
          ref={stage}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onWheel={onWheel}
          style={{ position: "relative", width: "min(100%, 70vh)", aspectRatio: "1 / 1", touchAction: "none", cursor: "grab", borderRadius: 12, overflow: "hidden" }}
          aria-label="ドラッグで移動、2本指で拡大・回転"
        >
          <AlignedPhoto id={photo.id} align={align} alt={stageLine(photo.stages)} style={{ position: "absolute", inset: 0 }} />
          {ghost && prev && <AlignedPhoto id={prev.id} align={prev.align} alt="" opacity={0.4} style={{ position: "absolute", inset: 0, background: "transparent", pointerEvents: "none" }} />}
          <PotFrame shape={shape} />
        </div>
      </div>

      <div style={{ ...styles.viewerCap, gap: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }} role="group" aria-label="鉢の形">
          {POT_SHAPES.map((s) => (
            <button
              key={s.id}
              aria-pressed={shape === s.id}
              disabled={!bed}
              style={{ ...styles.tagChip, ...(shape === s.id ? { background: "var(--mint-bg)", color: "var(--mint)", borderColor: "var(--mint)" } : {}) }}
              onClick={() => bed && dispatch({ type: "setPotShape", bedId: bed.id, shape: s.id })}
            >
              {s.label}
            </button>
          ))}
          {prev && (
            <button aria-pressed={ghost} style={{ ...styles.tagChip, marginLeft: "auto", ...(ghost ? styles.tagChipOn : {}) }} onClick={() => setGhost((g) => !g)}>
              <Layers size={11} aria-hidden="true" style={{ verticalAlign: -1 }} /> 前回を重ねる
            </button>
          )}
        </div>
        <label style={styles.alignRow}>
          <span style={styles.alignLabel}>大きさ</span>
          <input type="range" min={SCALE_MIN} max={SCALE_MAX} step={0.01} value={align.scale} onChange={(e) => update(() => ({ scale: e.target.valueAsNumber }))} aria-label="大きさ" style={{ flex: 1 }} />
          <span style={styles.alignVal}>×{align.scale.toFixed(2)}</span>
        </label>
        <label style={styles.alignRow}>
          <span style={styles.alignLabel}>傾き</span>
          <input type="range" min={-ROTATE_MAX} max={ROTATE_MAX} step={0.5} value={align.rotate} onChange={(e) => update(() => ({ rotate: e.target.valueAsNumber }))} aria-label="傾き" style={{ flex: 1 }} />
          <span style={styles.alignVal}>{align.rotate.toFixed(1)}°</span>
        </label>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>ドラッグで移動・2本指で拡大と回転</span>
          <button style={styles.histBtn} onClick={() => setAlign(DEFAULT_ALIGN)}>
            <RotateCcw size={14} aria-hidden="true" /> リセット
          </button>
        </div>
      </div>
    </div>
  );
}
