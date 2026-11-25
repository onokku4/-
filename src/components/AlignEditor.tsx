import { useRef, useState } from "react";
import { Bookmark, Check, Layers, Plus, RotateCcw, X } from "lucide-react";
import type { Align, Bed, FrameAdjust, FramePreset, Photo } from "../types";
import type { Action } from "../lib/garden";
import { stageLine } from "../lib/photos";
import { newId } from "../ui/id";
import { DEFAULT_ALIGN, DEFAULT_FRAME, DEFAULT_VIEW, FRAME_LIMITS, POT_SHAPES, ROTATE_MAX, SCALE_MAX, SCALE_MIN, VIEW_ANGLES, baseAnchorY, clampAlign, clampFrame, framesFor, potGuide, remapAlign } from "../lib/timelapse";
import { useEscape } from "../hooks/useEscape";
import { styles } from "../styles";
import { AlignedPhoto } from "./AlignedPhoto";
import { PotFrame } from "./PotFrame";

interface Props {
  photo: Photo;
  bed: Bed | undefined;
  photos: Photo[];
  presets: FramePreset[];
  dispatch: (a: Action) => void;
  onClose: () => void;
}

type Pt = { x: number; y: number };

/**
 * 写真の鉢を、画面の鉢の枠に合わせる。ドラッグで移動、2本指（またはスライダー）で拡大・回転。
 * 前回の写真を薄く重ねて、同じ位置にそろえられる
 */
export function AlignEditor({ photo, bed, photos, presets, dispatch, onClose }: Props) {
  const [align, setAlign] = useState<Align>(photo.align ?? DEFAULT_ALIGN);
  const [ghost, setGhost] = useState(true);
  /** 写真を動かすか、枠を調整するか */
  const [mode, setMode] = useState<"photo" | "frame">("photo");
  /** 枠は保存を押すまで下書き。保存時に、この場所の他の写真も新しい枠へ一緒に動かす */
  const [frame, setFrame] = useState<FrameAdjust>(bed?.frame ?? DEFAULT_FRAME);
  const [presetName, setPresetName] = useState<string | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Pt>());
  const pinch = useRef<{ dist: number; angle: number; mid: Pt } | null>(null);
  useEscape(onClose);

  const shape = bed?.potShape ?? "rect";
  const view = bed?.viewAngle ?? DEFAULT_VIEW;
  const guide = potGuide(shape, view, frame);
  const savedFrame = bed?.frame ?? DEFAULT_FRAME;
  const series = bed ? framesFor(photos, bed.id) : [];
  const idx = series.findIndex((p) => p.id === photo.id);
  const prev = idx > 0 ? series[idx - 1] : undefined;

  const size = () => stage.current?.clientWidth || 1;
  const update = (f: (a: Align) => Partial<Align>) => setAlign((a) => clampAlign({ ...a, ...f(a) }));
  const updateFrame = (f: (fr: FrameAdjust) => Partial<FrameAdjust>) => setFrame((fr) => clampFrame({ ...fr, ...f(fr) }));
  // 前回の写真は、下書きの枠に合わせて動かして重ねる
  const ghostAlign = prev?.align ? remapAlign(prev.align, baseAnchorY(shape, view), savedFrame, frame) : prev?.align;

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
    if (mode === "frame") {
      if (pointers.current.size === 1) updateFrame((fr) => ({ y: fr.y + (e.clientY - before.y) / L }));
      else if (pointers.current.size === 2 && pinch.current) {
        const now = twoFinger();
        if (!now) return;
        const p = pinch.current;
        updateFrame((fr) => ({ size: fr.size * (now.dist / (p.dist || 1)), y: fr.y + (now.mid.y - p.mid.y) / L }));
        pinch.current = now;
      }
      return;
    }
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
  const onWheel = (e: React.WheelEvent) =>
    mode === "frame"
      ? updateFrame((fr) => ({ size: fr.size * (e.deltaY < 0 ? 1.04 : 1 / 1.04) }))
      : update((a) => ({ scale: a.scale * (e.deltaY < 0 ? 1.05 : 1 / 1.05) }));

  const save = () => {
    // 枠を先に（他の写真も一緒に動く）、そのあとこの写真の位置合わせを上書き
    if (bed && (frame.size !== savedFrame.size || frame.y !== savedFrame.y || frame.tilt !== savedFrame.tilt)) dispatch({ type: "setFrame", bedId: bed.id, frame });
    dispatch({ type: "setPhotoAlign", id: photo.id, align });
    onClose();
  };
  const savePreset = () => {
    const name = (presetName ?? "").trim();
    if (!name) return;
    dispatch({ type: "saveFramePreset", id: newId(), name, shape, view, frame });
    setPresetName(null);
  };
  const applyPreset = (p: FramePreset) => {
    if (!bed) return;
    if (p.shape !== shape) dispatch({ type: "setPotShape", bedId: bed.id, shape: p.shape });
    if (p.view !== view) dispatch({ type: "setViewAngle", bedId: bed.id, view: p.view });
    setFrame(p.frame);
  };

  return (
    <div style={styles.viewer} role="dialog" aria-modal="true" aria-label="鉢の位置合わせ">
      <div style={styles.viewerTop}>
        <button style={styles.viewerBtn} onClick={onClose} aria-label="位置合わせをやめる">
          <X size={20} aria-hidden="true" />
        </button>
        <span style={{ ...styles.viewerCounter, textAlign: "center", flex: 1, minWidth: 0, fontSize: 11.5, lineHeight: 1.4 }}>
          {guide.hint}
          <span style={{ display: "block", fontSize: 11, opacity: 0.8 }}>{stageLine(photo.stages)}</span>
        </span>
        <button style={{ ...styles.viewerBtn, width: "auto", padding: "0 12px", background: "var(--mint)", borderColor: "var(--mint)", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }} onClick={save}>
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
          aria-label={mode === "frame" ? "上下ドラッグで枠を移動、2本指で枠の大きさ" : "ドラッグで移動、2本指で拡大・回転"}
        >
          <AlignedPhoto id={photo.id} align={align} alt={stageLine(photo.stages)} style={{ position: "absolute", inset: 0 }} />
          {ghost && prev && <AlignedPhoto id={prev.id} align={ghostAlign} alt="" opacity={0.4} style={{ position: "absolute", inset: 0, background: "transparent", pointerEvents: "none" }} />}
          <PotFrame shape={shape} view={view} frame={frame} active={mode === "frame"} />
        </div>
      </div>

      <div style={{ ...styles.viewerCap, gap: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }} role="group" aria-label="撮る角度">
          {VIEW_ANGLES.map((v) => (
            <button
              key={v.id}
              aria-pressed={view === v.id}
              disabled={!bed}
              style={{ ...styles.tagChip, ...(view === v.id ? { background: "var(--sky-bg)", color: "var(--sky)", borderColor: "var(--sky)" } : {}) }}
              onClick={() => bed && dispatch({ type: "setViewAngle", bedId: bed.id, view: v.id })}
            >
              {v.id === "oblique" ? "📐 " : "⬇️ "}
              {v.label}
            </button>
          ))}
        </div>
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
        <div style={styles.subTabs} role="tablist" aria-label="調整するもの">
          <button role="tab" aria-selected={mode === "photo"} style={{ ...styles.subTab, ...(mode === "photo" ? styles.subTabActive : {}) }} onClick={() => setMode("photo")}>
            写真を合わせる
          </button>
          <button role="tab" aria-selected={mode === "frame"} style={{ ...styles.subTab, ...(mode === "frame" ? styles.subTabActive : {}) }} onClick={() => setMode("frame")}>
            枠を調整
          </button>
        </div>
        {mode === "frame" ? (
          <>
            <label style={styles.alignRow}>
              <span style={styles.alignLabel}>枠の大きさ</span>
              <input type="range" min={FRAME_LIMITS.size[0]} max={FRAME_LIMITS.size[1]} step={0.01} value={frame.size} onChange={(e) => updateFrame(() => ({ size: e.target.valueAsNumber }))} aria-label="枠の大きさ" style={{ flex: 1 }} />
              <span style={styles.alignVal}>{Math.round(frame.size * 100)}%</span>
            </label>
            <label style={styles.alignRow}>
              <span style={styles.alignLabel}>上下の位置</span>
              <input type="range" min={FRAME_LIMITS.y[0]} max={FRAME_LIMITS.y[1]} step={0.005} value={frame.y} onChange={(e) => updateFrame(() => ({ y: e.target.valueAsNumber }))} aria-label="枠の上下の位置" style={{ flex: 1 }} />
              <span style={styles.alignVal}>{frame.y > 0 ? "+" : ""}{Math.round(frame.y * 100)}</span>
            </label>
            <label style={styles.alignRow}>
              <span style={styles.alignLabel}>{view === "oblique" ? "縁の厚み" : "縦の長さ"}</span>
              <input type="range" min={FRAME_LIMITS.tilt[0]} max={FRAME_LIMITS.tilt[1]} step={0.01} value={frame.tilt} onChange={(e) => updateFrame(() => ({ tilt: e.target.valueAsNumber }))} aria-label={view === "oblique" ? "縁の厚み" : "枠の縦の長さ"} style={{ flex: 1 }} />
              <span style={styles.alignVal}>×{frame.tilt.toFixed(2)}</span>
            </label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }} role="group" aria-label="枠のプリセット">
              <Bookmark size={13} color="var(--muted)" aria-hidden="true" />
              {presets.length === 0 && presetName === null && <span style={{ fontSize: 11, color: "var(--muted)" }}>よく使う枠を保存しておけます</span>}
              {presets.map((p) => (
                <span key={p.id} style={{ display: "inline-flex", alignItems: "center" }}>
                  <button style={{ ...styles.tagChip, borderTopRightRadius: 0, borderBottomRightRadius: 0 }} onClick={() => applyPreset(p)} aria-label={`枠「${p.name}」を使う`}>
                    {p.name}
                  </button>
                  <button
                    style={{ ...styles.tagChip, borderLeft: "none", borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: "3px 6px" }}
                    onClick={() => window.confirm(`枠「${p.name}」を削除しますか？`) && dispatch({ type: "removeFramePreset", id: p.id })}
                    aria-label={`枠「${p.name}」を削除`}
                  >
                    <X size={10} aria-hidden="true" />
                  </button>
                </span>
              ))}
              {presetName === null ? (
                <button style={{ ...styles.tagChip, color: "var(--mint)", borderColor: "var(--mint)" }} onClick={() => setPresetName(`${POT_SHAPES.find((x) => x.id === shape)?.label ?? ""}・${VIEW_ANGLES.find((v) => v.id === view)?.label ?? ""}`)}>
                  <Plus size={10} aria-hidden="true" style={{ verticalAlign: -1 }} /> この枠を保存
                </button>
              ) : (
                <form
                  style={{ display: "inline-flex", gap: 4, alignItems: "center" }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    savePreset();
                  }}
                >
                  <input style={{ ...styles.editInput, width: 150, padding: "4px 8px", fontSize: 12 }} value={presetName} onChange={(e) => setPresetName(e.target.value)} aria-label="プリセットの名前" autoFocus />
                  <button type="submit" style={styles.editBtn} aria-label="プリセットを保存" disabled={!presetName.trim()}>
                    <Check size={13} aria-hidden="true" />
                  </button>
                  <button type="button" style={styles.editBtn} aria-label="保存をやめる" onClick={() => setPresetName(null)}>
                    <X size={13} aria-hidden="true" />
                  </button>
                </form>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>上下ドラッグで枠を移動・2本指で大きさ。保存すると、この場所の他の写真も新しい枠に合わせて動きます。</span>
              <button style={{ ...styles.histBtn, whiteSpace: "nowrap", flexShrink: 0 }} onClick={() => setFrame(DEFAULT_FRAME)}>
                <RotateCcw size={14} aria-hidden="true" /> 枠を戻す
              </button>
            </div>
          </>
        ) : (
          <>
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
          <span style={{ fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
            ドラッグで移動・2本指で拡大と回転。
            {view === "oblique" && "毎回だいたい同じ立ち位置・高さから撮ると、角度までそろいます。"}
          </span>
          <button style={{ ...styles.histBtn, whiteSpace: "nowrap", flexShrink: 0 }} onClick={() => setAlign(DEFAULT_ALIGN)}>
            <RotateCcw size={14} aria-hidden="true" /> リセット
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
}
