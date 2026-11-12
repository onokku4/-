import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2, X } from "lucide-react";
import type { Bed, Photo, WeatherLog } from "../types";
import type { Action } from "../lib/garden";
import { soilType } from "../data/catalog";
import { stageLine } from "../lib/photos";
import { CONDITION_EMOJI } from "../lib/weather";
import { useEscape } from "../hooks/useEscape";
import { deletePhotoBlob } from "../ui/photoStore";
import { styles } from "../styles";
import { PhotoThumb } from "./PhotoThumb";

interface Props {
  /** 表示する順番（古い→新しい） */
  photos: Photo[];
  startId: string;
  beds: Bed[];
  weatherLog: WeatherLog;
  dispatch: (a: Action) => void;
  onClose: () => void;
}

const fmt = (date: string) => `${date.slice(0, 4)}.${date.slice(5, 7)}.${date.slice(8, 10)}`;

/** 全画面の写真ビューア。横スワイプ（scroll-snap）でページ送り。キーボードの←→も効く */
export function PhotoViewer({ photos, startId, beds, weatherLog, dispatch, onClose }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(() => Math.max(0, photos.findIndex((p) => p.id === startId)));
  useEscape(onClose);

  // 最初の表示位置へ（アニメーションなし）
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "instant" as ScrollBehavior });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // スワイプで止まった位置を現在のページにする
  const onScroll = () => {
    const el = track.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index && i >= 0 && i < photos.length) setIndex(i);
  };

  const go = (i: number) => {
    const el = track.current;
    const next = Math.max(0, Math.min(photos.length - 1, i));
    setIndex(next);
    el?.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const cur = photos[index];
  if (!cur) return null;
  const bed = beds.find((b) => b.id === cur.bedId);
  const wx = weatherLog[cur.date];

  const remove = () => {
    if (!window.confirm("この写真を削除しますか？")) return;
    void deletePhotoBlob(cur.id);
    dispatch({ type: "removePhoto", id: cur.id });
    if (photos.length <= 1) onClose();
    else if (index >= photos.length - 1) setIndex(photos.length - 2);
  };

  return (
    <div style={styles.viewer} role="dialog" aria-modal="true" aria-label="写真">
      <div style={styles.viewerTop}>
        <button style={styles.viewerBtn} onClick={onClose} aria-label="閉じる">
          <X size={20} aria-hidden="true" />
        </button>
        <span style={styles.viewerCounter}>
          {index + 1} / {photos.length}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={styles.viewerBtn} onClick={() => go(index - 1)} disabled={index === 0} aria-label="前の写真">
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <button style={styles.viewerBtn} onClick={() => go(index + 1)} disabled={index >= photos.length - 1} aria-label="次の写真">
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div ref={track} className="swipe-track" onScroll={onScroll} style={{ flex: 1, minHeight: 0 }}>
        {photos.map((p, i) => (
          <div key={p.id} className="swipe-page" aria-hidden={i !== index}>
            {/* 前後1枚だけ実体を読み込み、残りは軽い枠にしておく */}
            {Math.abs(i - index) <= 1 ? <PhotoThumb id={p.id} alt={stageLine(p.stages)} style={{ ...styles.viewerImg, width: "100%", height: "100%", borderRadius: 0, border: "none", background: "transparent" }} /> : <div />}
          </div>
        ))}
      </div>

      <div style={styles.viewerCap}>
        <div style={styles.viewerDate}>
          {fmt(cur.date)}
          {wx && `　${CONDITION_EMOJI[wx.condition]} ${wx.maxC}℃`}
        </div>
        <div style={styles.viewerStage}>{stageLine(cur.stages)}</div>
        <div style={styles.viewerMeta}>
          <span>{bed ? `${soilType(bed.type).emoji} ${bed.name}` : "（削除された場所）"}</span>
        </div>
        <textarea
          style={{ ...styles.photoNote, background: "var(--panel-2)" }}
          placeholder="メモ（花が咲いた、葉が黄色い、など）"
          value={cur.note}
          rows={1}
          onChange={(e) => dispatch({ type: "setPhotoNote", id: cur.id, note: e.target.value })}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={styles.viewerDots} aria-hidden="true">
            {photos.length <= 12 &&
              photos.map((p, i) => <i key={p.id} style={{ width: 6, height: 6, borderRadius: 3, background: i === index ? "var(--flame)" : "var(--line)" }} />)}
          </div>
          <button style={{ ...styles.histBtn, color: "var(--flame-soft)", padding: "6px 10px" }} onClick={remove}>
            <Trash2 size={14} aria-hidden="true" /> 削除
          </button>
        </div>
      </div>
    </div>
  );
}
