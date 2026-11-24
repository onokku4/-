import type { Align, Photo, PotShape, SoilTypeId, ViewAngle } from "../types";

/** 位置合わせしていない写真は、正方形にトリミングして中央 */
export const DEFAULT_ALIGN: Align = { x: 0, y: 0, scale: 1, rotate: 0 };

export const SCALE_MIN = 0.4;
export const SCALE_MAX = 4;
export const ROTATE_MAX = 45;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** 値を有効範囲に収める。壊れた値は既定に戻す */
export const clampAlign = (a: Partial<Align> | undefined | null): Align => {
  const n = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
  return {
    x: Math.round(clamp(n(a?.x, 0), -1, 1) * 1000) / 1000,
    y: Math.round(clamp(n(a?.y, 0), -1, 1) * 1000) / 1000,
    scale: Math.round(clamp(n(a?.scale, 1), SCALE_MIN, SCALE_MAX) * 1000) / 1000,
    rotate: Math.round(clamp(n(a?.rotate, 0), -ROTATE_MAX, ROTATE_MAX) * 10) / 10,
  };
};

export const isDefaultAlign = (a: Align | undefined): boolean =>
  !a || (a.x === 0 && a.y === 0 && a.scale === 1 && a.rotate === 0);

/** 場所の種類ごとの既定の鉢の形。プランターは長方形、畑は区画（四角） */
export const defaultPotShape = (type: SoilTypeId): PotShape => (type === "field" ? "square" : "rect");

export const POT_SHAPES: readonly { id: PotShape; label: string }[] = [
  { id: "round", label: "丸鉢" },
  { id: "square", label: "角鉢" },
  { id: "rect", label: "長方形プランター" },
];

/**
 * 画面（正方形・一辺1）の中での鉢の枠。中央に置く。
 * 上から見た形を想定し、写真の鉢をこの枠に合わせると毎回同じ位置・大きさになる
 */
export type PotFrame =
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "rect"; x: number; y: number; w: number; h: number; radius: number };

export const potFrame = (shape: PotShape): PotFrame => {
  switch (shape) {
    case "round":
      return { kind: "circle", cx: 0.5, cy: 0.5, r: 0.36 };
    case "square":
      return { kind: "rect", x: 0.17, y: 0.17, w: 0.66, h: 0.66, radius: 0.04 };
    case "rect":
      return { kind: "rect", x: 0.07, y: 0.3, w: 0.86, h: 0.4, radius: 0.03 };
  }
};

/**
 * 正方形の枠に写真を「覆うように」置いたときの写真の大きさ（枠の何倍か）。
 * 横長なら高さが枠に合い、幅がはみ出す
 */
export const coverSize = (w: number, h: number): { w: number; h: number } => {
  if (!(w > 0) || !(h > 0)) return { w: 1, h: 1 };
  return w >= h ? { w: w / h, h: 1 } : { w: 1, h: h / w };
};

/** タイムラプスのコマ（古い→新しい）。同じ日に複数あればすべて使う */
export const framesFor = (photos: Photo[], bedId: string): Photo[] =>
  photos.filter((p) => p.bedId === bedId).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

export const FPS_CHOICES = [6, 12, 24] as const;
export type Fps = (typeof FPS_CHOICES)[number];
export const DEFAULT_FPS: Fps = 12;

/** 再生時間（秒、小数1桁） */
export const durationSec = (frames: number, fps: number): number => (fps > 0 ? Math.round((frames / fps) * 10) / 10 : 0);

/** 経過時間（秒）から表示するコマ。ループ再生 */
export const frameAt = (elapsedSec: number, fps: number, frames: number): number =>
  frames <= 0 ? 0 : Math.floor(Math.max(0, elapsedSec) * fps) % frames;

export const VIEW_ANGLES: readonly { id: ViewAngle; label: string }[] = [
  { id: "oblique", label: "見下ろし" },
  { id: "top", label: "真上" },
];
export const DEFAULT_VIEW: ViewAngle = "oblique";

/** 枠を描く図形（正方形・一辺1の座標） */
export type GuideShape =
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { kind: "rect"; x: number; y: number; w: number; h: number; radius: number }
  | { kind: "poly"; points: [number, number][]; closed: boolean };

export interface PotGuide {
  /** 点線で描く輪郭 */
  outline: GuideShape[];
  /** 枠の外を暗くするときの穴（null なら暗くしない） */
  hole: GuideShape[] | null;
  /** 合わせる目印（鉢の縁の中心） */
  anchor: [number, number];
  /** 位置合わせ画面のひとこと */
  hint: string;
}

/**
 * 鉢の枠。
 * 真上：鉢の縁を画面の中央に。
 * 見下ろし：鉢を画面の下寄りに置き、上は株が伸びる余白にする。縁は奥が狭い楕円・台形に見える
 */
export const potGuide = (shape: PotShape, view: ViewAngle): PotGuide => {
  if (view === "top") {
    const f = potFrame(shape);
    const s: GuideShape = f.kind === "circle" ? { kind: "ellipse", cx: f.cx, cy: f.cy, rx: f.r, ry: f.r } : f;
    return { outline: [s], hole: [s], anchor: [0.5, 0.5], hint: "鉢の縁を枠に合わせる" };
  }
  switch (shape) {
    case "round": {
      // 縁（楕円）と、下へすぼまる胴
      const cx = 0.5, cy = 0.66, rx = 0.27, ry = 0.085;
      const bottomY = 0.93, bottomHalf = 0.2;
      return {
        outline: [
          { kind: "ellipse", cx, cy, rx, ry },
          { kind: "poly", points: [[cx - rx, cy], [cx - bottomHalf, bottomY], [cx + bottomHalf, bottomY], [cx + rx, cy]], closed: false },
        ],
        hole: null,
        anchor: [cx, cy],
        hint: "鉢の縁（楕円）と左右の側面を枠に合わせる",
      };
    }
    case "square": {
      const far = 0.6, near = 0.75, farHalf = 0.2, nearHalf = 0.25, bottom = 0.93, bottomHalf = 0.23;
      return {
        outline: [
          { kind: "poly", points: [[0.5 - farHalf, far], [0.5 + farHalf, far], [0.5 + nearHalf, near], [0.5 - nearHalf, near]], closed: true },
          { kind: "poly", points: [[0.5 - nearHalf, near], [0.5 - bottomHalf, bottom], [0.5 + bottomHalf, bottom], [0.5 + nearHalf, near]], closed: false },
        ],
        hole: null,
        anchor: [0.5, (far + near) / 2],
        hint: "鉢の縁（台形）と手前の面を枠に合わせる",
      };
    }
    case "rect": {
      const far = 0.64, near = 0.78, farHalf = 0.36, nearHalf = 0.44, bottom = 0.92, bottomHalf = 0.43;
      return {
        outline: [
          { kind: "poly", points: [[0.5 - farHalf, far], [0.5 + farHalf, far], [0.5 + nearHalf, near], [0.5 - nearHalf, near]], closed: true },
          { kind: "poly", points: [[0.5 - nearHalf, near], [0.5 - bottomHalf, bottom], [0.5 + bottomHalf, bottom], [0.5 + nearHalf, near]], closed: false },
        ],
        hole: null,
        anchor: [0.5, (far + near) / 2],
        hint: "プランターの縁（台形）と手前の面を枠に合わせる",
      };
    }
  }
};

/**
 * 縦スクロールの透明度。画面中央からの距離（0=中央、1=画面の端）で、
 * 中央は不透明、離れるほど薄くなる。端の手前で最小値に落ち着く
 */
export const FADE_MIN = 0.12;
export const fadeOpacity = (distance: number): number => {
  const d = Math.min(1, Math.abs(distance));
  const t = 1 - d;
  const smooth = t * t * (3 - 2 * t); // smoothstep
  return Math.round((FADE_MIN + (1 - FADE_MIN) * smooth) * 1000) / 1000;
};

/** 写真の「植え付けから◯日目」を短く。複数株なら最も古い株の日数 */
export const dayLabel = (p: Photo): string => {
  if (p.stages.length === 0) return "植え付け前";
  const max = Math.max(...p.stages.map((s) => s.day));
  return `${max}日目`;
};

/** 2つのアラインの中間（コマ間をなめらかにしたいとき用） */
export const lerpAlign = (a: Align, b: Align, t: number): Align => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  scale: a.scale + (b.scale - a.scale) * t,
  rotate: a.rotate + (b.rotate - a.rotate) * t,
});
