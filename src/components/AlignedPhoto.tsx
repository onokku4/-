import { useState, type CSSProperties } from "react";
import { ImageOff } from "lucide-react";
import type { Align } from "../types";
import { DEFAULT_ALIGN, coverSize } from "../lib/timelapse";
import { usePhotoUrl } from "../hooks/usePhotoUrl";

interface Props {
  id: string;
  align?: Align;
  alt: string;
  style?: CSSProperties;
  /** 読み込まない（画面外）。枠だけ出す */
  lazy?: boolean;
  /** 重ねて表示するときの不透明度 */
  opacity?: number;
}

/** 位置合わせを反映した正方形の写真。canvas の drawAligned と同じ見え方になる */
export function AlignedPhoto({ id, align, alt, style, lazy, opacity }: Props) {
  return (
    <div style={{ position: "relative", aspectRatio: "1 / 1", overflow: "hidden", background: "#1d2419", ...style }}>
      {!lazy && <Inner id={id} align={align ?? DEFAULT_ALIGN} alt={alt} opacity={opacity} />}
    </div>
  );
}

function Inner({ id, align, alt, opacity }: { id: string; align: Align; alt: string; opacity?: number }) {
  const url = usePhotoUrl(id);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  if (url === "loading") return null;
  if (url === null)
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.5)" }} title="この端末に画像がありません">
        <ImageOff size={24} aria-hidden="true" />
      </div>
    );
  const cover = size ? coverSize(size.w, size.h) : { w: 1, h: 1 };
  return (
    <img
      src={url}
      alt={alt}
      draggable={false}
      onLoad={(e) => setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
      style={{
        position: "absolute",
        left: `calc(50% + ${align.x * 100}%)`,
        top: `calc(50% + ${align.y * 100}%)`,
        width: `${cover.w * 100}%`,
        height: `${cover.h * 100}%`,
        maxWidth: "none",
        transform: `translate(-50%, -50%) rotate(${align.rotate}deg) scale(${align.scale})`,
        transformOrigin: "center",
        opacity: size ? (opacity ?? 1) : 0,
        userSelect: "none",
        pointerEvents: "none",
      }}
    />
  );
}
