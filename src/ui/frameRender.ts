import type { Align, Photo } from "../types";
import { DEFAULT_ALIGN, coverSize, dayLabel } from "../lib/timelapse";
import { loadPhotoBlob } from "./photoStore";

/** 位置合わせを反映して、一辺 size の正方形に写真を描く */
export function drawAligned(ctx: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, align: Align | undefined, size: number) {
  const a = align ?? DEFAULT_ALIGN;
  const cover = coverSize(img.width, img.height);
  ctx.save();
  ctx.fillStyle = "#1d2419";
  ctx.fillRect(0, 0, size, size);
  ctx.translate(size / 2 + a.x * size, size / 2 + a.y * size);
  ctx.rotate((a.rotate * Math.PI) / 180);
  ctx.scale(a.scale, a.scale);
  const w = cover.w * size;
  const h = cover.h * size;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

/** 1コマを描いた画像（ImageBitmap）を作る。画像がなければ null */
export async function renderFrame(photo: Photo, size: number): Promise<ImageBitmap | null> {
  if (typeof document === "undefined" || typeof createImageBitmap !== "function") return null;
  const blob = await loadPhotoBlob(photo.id);
  if (!blob) return null;
  const src = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  drawAligned(ctx, src, photo.align, size);
  src.close();
  return createImageBitmap(canvas);
}

/** タイムラプスの字幕（日付と何日目）を描く */
export function drawCaption(ctx: CanvasRenderingContext2D, photo: Photo, size: number, title: string) {
  const pad = size * 0.04;
  const fs = Math.round(size * 0.045);
  ctx.save();
  const grad = ctx.createLinearGradient(0, size * 0.78, 0, size);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,.55)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, size * 0.78, size, size * 0.22);
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "bottom";
  ctx.font = `700 ${fs}px "Zen Maru Gothic", system-ui, sans-serif`;
  ctx.fillText(photo.date.replace(/-/g, "."), pad, size - pad);
  ctx.textAlign = "right";
  ctx.font = `700 ${Math.round(fs * 1.3)}px "Zen Maru Gothic", system-ui, sans-serif`;
  ctx.fillText(dayLabel(photo), size - pad, size - pad);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = `700 ${Math.round(fs * 0.8)}px "Zen Maru Gothic", system-ui, sans-serif`;
  ctx.fillStyle = "rgba(255,255,255,.85)";
  ctx.fillText(title, pad, pad);
  ctx.restore();
}

/** 動画に使える形式（Safari は mp4、Chrome などは webm） */
export const videoMime = (): { mime: string; ext: string } | null => {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") return null;
  for (const [mime, ext] of [
    ["video/mp4;codecs=avc1", "mp4"],
    ["video/mp4", "mp4"],
    ["video/webm;codecs=vp9", "webm"],
    ["video/webm", "webm"],
  ] as const) {
    if (MediaRecorder.isTypeSupported(mime)) return { mime, ext };
  }
  return null;
};
