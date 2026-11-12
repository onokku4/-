import { useState } from "react";
import { ChevronLeft, Trash2 } from "lucide-react";
import type { Bed, Photo } from "../types";
import type { Action } from "../lib/garden";
import { soilType } from "../data/catalog";
import { photosByBed, stageLine } from "../lib/photos";
import { deletePhotoBlob } from "../ui/photoStore";
import { styles } from "../styles";
import { Modal } from "./Modal";
import { PhotoThumb } from "./PhotoThumb";

interface Props {
  photos: Photo[];
  beds: Bed[];
  initialPhotoId?: string | null;
  dispatch: (a: Action) => void;
  onClose: () => void;
}

const fmt = (date: string) => `${date.slice(0, 4)}年${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日`;

/** 場所ごとの成長アーカイブ。1枚選ぶと大きく表示し、メモの編集と削除ができる */
export function AlbumModal({ photos, beds, initialPhotoId = null, dispatch, onClose }: Props) {
  const [openId, setOpenId] = useState<string | null>(initialPhotoId);
  const byBed = photosByBed(photos);
  const open = photos.find((p) => p.id === openId);

  if (open) {
    const bed = beds.find((b) => b.id === open.bedId);
    const series = byBed.get(open.bedId) ?? [];
    const idx = series.findIndex((p) => p.id === open.id);
    return (
      <Modal title="📷 成長の記録" onClose={onClose}>
        <button style={styles.histBtn} onClick={() => setOpenId(null)}>
          <ChevronLeft size={16} aria-hidden="true" /> アルバムへ戻る
        </button>
        <div style={styles.photoLargeWrap}>
          <PhotoThumb id={open.id} alt={`${bed?.name ?? ""} ${fmt(open.date)}`} style={styles.photoLarge} />
        </div>
        <div style={styles.photoCaption}>
          <div style={styles.photoCaptionHead}>
            {bed ? `${soilType(bed.type).emoji} ${bed.name}` : "（削除された場所）"}　{fmt(open.date)}
            <span style={styles.photoIndex}>
              {idx + 1} / {series.length}枚目
            </span>
          </div>
          <div style={styles.photoStage}>{stageLine(open.stages)}</div>
          <textarea
            style={styles.photoNote}
            placeholder="メモ（花が咲いた、葉が黄色い、など）"
            value={open.note}
            rows={2}
            onChange={(e) => dispatch({ type: "setPhotoNote", id: open.id, note: e.target.value })}
          />
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={styles.histBtn} disabled={idx <= 0} onClick={() => setOpenId(series[idx - 1]!.id)}>
                ← 前
              </button>
              <button style={styles.histBtn} disabled={idx >= series.length - 1} onClick={() => setOpenId(series[idx + 1]!.id)}>
                次 →
              </button>
            </div>
            <button
              style={{ ...styles.histBtn, color: "#c0432a" }}
              onClick={() => {
                if (!window.confirm("この写真を削除しますか？")) return;
                void deletePhotoBlob(open.id);
                dispatch({ type: "removePhoto", id: open.id });
                setOpenId(null);
              }}
            >
              <Trash2 size={15} aria-hidden="true" /> 削除
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="📷 成長アルバム" onClose={onClose}>
      {photos.length === 0 ? (
        <div style={styles.histEmpty}>
          <div style={{ fontSize: 40, marginBottom: 8 }} aria-hidden="true">
            🌱
          </div>
          まだ写真がありません。
          <br />
          「育てる場所」のカードから撮影すると、植え付けから何日目かと一緒に残ります。
        </div>
      ) : (
        [...byBed.entries()].map(([bedId, list]) => {
          const bed = beds.find((b) => b.id === bedId);
          return (
            <section key={bedId} style={{ marginBottom: 18 }}>
              <h3 style={styles.albumBedTitle}>
                {bed ? `${soilType(bed.type).emoji} ${bed.name}` : "（削除された場所）"}
                <span style={styles.albumCount}>{list.length}枚</span>
              </h3>
              <div style={styles.albumGrid}>
                {list.map((p) => (
                  <figure key={p.id} style={styles.albumItem}>
                    <PhotoThumb id={p.id} alt={`${fmt(p.date)} ${stageLine(p.stages)}`} style={styles.albumThumb} onClick={() => setOpenId(p.id)} />
                    <figcaption style={styles.albumCap}>
                      <div style={styles.albumDate}>{p.date.slice(5).replace("-", "/")}</div>
                      <div style={styles.albumStage}>{p.stages.length ? p.stages.map((s) => `${s.day}日目`).join("・") : "植え付け前"}</div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          );
        })
      )}
    </Modal>
  );
}
