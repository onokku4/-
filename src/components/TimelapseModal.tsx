import { useEffect, useRef, useState } from "react";
import { Download, Pause, Play, X } from "lucide-react";
import type { Bed, Photo } from "../types";
import { DEFAULT_FPS, FPS_CHOICES, dayLabel, durationSec, frameAt, framesFor, type Fps } from "../lib/timelapse";
import { useEscape } from "../hooks/useEscape";
import { drawCaption, renderFrame, videoMime } from "../ui/frameRender";
import { styles } from "../styles";

interface Props {
  bed: Bed;
  photos: Photo[];
  say: (m: string) => void;
  onClose: () => void;
}

/** 鉢の枠に合わせた写真をコマ送りにする疑似タイムラプス。動画として保存もできる */
export function TimelapseModal({ bed, photos, say, onClose }: Props) {
  const frames = framesFor(photos, bed.id);
  const size = frames.length > 120 ? 360 : 540;
  const canvas = useRef<HTMLCanvasElement>(null);
  const bitmaps = useRef<(ImageBitmap | null)[]>([]);
  const [ready, setReady] = useState(0);
  const [fps, setFps] = useState<Fps>(DEFAULT_FPS);
  const [playing, setPlaying] = useState(true);
  const [index, setIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const clock = useRef({ start: 0, offset: 0 });
  const mime = videoMime();
  useEscape(onClose);

  // コマを先に描いておく
  useEffect(() => {
    let alive = true;
    (async () => {
      for (let i = 0; i < frames.length; i++) {
        const f = frames[i]!;
        const bmp = await renderFrame(f, size).catch(() => null);
        if (!alive) {
          bmp?.close();
          return;
        }
        bitmaps.current[i] = bmp;
        setReady(i + 1);
      }
    })();
    return () => {
      alive = false;
      bitmaps.current.forEach((b) => b?.close());
      bitmaps.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bed.id, frames.length, size]);

  const draw = (i: number) => {
    const ctx = canvas.current?.getContext("2d");
    const f = frames[i];
    if (!ctx || !f) return;
    const bmp = bitmaps.current[i];
    if (bmp) ctx.drawImage(bmp, 0, 0, size, size);
    else {
      ctx.fillStyle = "#1d2419";
      ctx.fillRect(0, 0, size, size);
    }
    drawCaption(ctx, f, size, bed.name);
  };

  // 再生ループ
  const loaded = ready >= frames.length;
  useEffect(() => {
    if (!loaded || !playing || recording) {
      draw(index);
      return;
    }
    let raf = 0;
    clock.current.start = performance.now() - (index / fps) * 1000;
    const tick = (now: number) => {
      const i = frameAt((now - clock.current.start) / 1000, fps, frames.length);
      setIndex((cur) => (cur === i ? cur : i));
      draw(i);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, playing, fps, recording]);

  useEffect(() => {
    if (!playing) draw(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, playing, ready]);

  const exportVideo = async () => {
    const c = canvas.current;
    if (!c || !mime || typeof c.captureStream !== "function") return;
    setRecording(true);
    setPlaying(false);
    try {
      const stream = c.captureStream(fps);
      const rec = new MediaRecorder(stream, { mimeType: mime.mime, videoBitsPerSecond: 4_000_000 });
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      const done = new Promise<void>((r) => (rec.onstop = () => r()));
      rec.start();
      for (let i = 0; i < frames.length; i++) {
        setIndex(i);
        draw(i);
        await new Promise((r) => setTimeout(r, 1000 / fps));
      }
      // 最後のコマを約1秒見せる（描き直さないと録画に入らない）
      for (let k = 0; k < Math.ceil(fps * 0.8); k++) {
        draw(frames.length - 1);
        await new Promise((r) => setTimeout(r, 1000 / fps));
      }
      rec.stop();
      await done;
      const blob = new Blob(chunks, { type: mime.mime.split(";")[0] });
      // ファイル名は英数字に（一部のブラウザは日本語のファイル名を捨てる）。場所名は共有のタイトルに入れる
      const last = frames[frames.length - 1];
      const name = `sodateru-niwa-timelapse-${(last?.date ?? "").replace(/-/g, "")}.${mime.ext}`;
      const file = new File([blob], name, { type: blob.type });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${bed.name}のタイムラプス` }).catch(() => undefined);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
      say("🎬 タイムラプスを保存しました");
    } catch {
      say("動画を作れませんでした");
    } finally {
      setRecording(false);
    }
  };

  const cur = frames[index];
  return (
    <div style={styles.viewer} role="dialog" aria-modal="true" aria-label="タイムラプス">
      <div style={styles.viewerTop}>
        <button style={styles.viewerBtn} onClick={onClose} aria-label="閉じる">
          <X size={20} aria-hidden="true" />
        </button>
        <span style={{ ...styles.viewerCounter, textAlign: "center" }}>
          {bed.name}のタイムラプス
          <span style={{ display: "block", fontSize: 11, opacity: 0.8 }}>
            {frames.length}コマ・{fps}fps・約{durationSec(frames.length, fps)}秒
          </span>
        </span>
        <span style={{ width: 36 }} />
      </div>

      <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
        <div style={{ position: "relative", width: "min(100%, 70vh)", aspectRatio: "1 / 1" }}>
          <canvas ref={canvas} width={size} height={size} style={{ width: "100%", height: "100%", borderRadius: 14, display: "block" }} aria-label={cur ? `${cur.date} ${dayLabel(cur)}` : ""} />
          {!loaded && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, background: "rgba(0,0,0,.35)", borderRadius: 14 }}>
              準備中 {ready} / {frames.length}
            </div>
          )}
        </div>
      </div>

      <div style={{ ...styles.viewerCap, gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button style={{ ...styles.viewerBtn, background: "var(--mint)", borderColor: "var(--mint)" }} onClick={() => setPlaying((p) => !p)} disabled={!loaded || recording} aria-label={playing ? "一時停止" : "再生"}>
            {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
          </button>
          <input
            type="range"
            min={0}
            max={Math.max(0, frames.length - 1)}
            value={index}
            onChange={(e) => {
              setPlaying(false);
              setIndex(e.target.valueAsNumber);
            }}
            aria-label="コマ"
            style={{ flex: 1 }}
            disabled={recording}
          />
          <span style={styles.alignVal}>
            {index + 1}/{frames.length}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 700 }}>速さ</span>
          {FPS_CHOICES.map((f) => (
            <button key={f} aria-pressed={fps === f} style={{ ...styles.tagChip, ...(fps === f ? { background: "var(--mint-bg)", color: "var(--mint)", borderColor: "var(--mint)" } : {}) }} onClick={() => setFps(f)} disabled={recording}>
              {f}コマ/秒
            </button>
          ))}
          {mime && (
            <button style={{ ...styles.histBtn, marginLeft: "auto" }} onClick={() => void exportVideo()} disabled={!loaded || recording}>
              <Download size={14} aria-hidden="true" /> {recording ? "録画中…" : "動画で保存"}
            </button>
          )}
        </div>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>毎日1枚なら1か月で約30コマ（12コマ/秒で約2.5秒）。鉢の位置を合わせるほど、なめらかにつながります。</span>
      </div>
    </div>
  );
}
