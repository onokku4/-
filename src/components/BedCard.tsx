import { useEffect, useState } from "react";
import { AlertTriangle, Beaker, Droplets, Leaf, Mountain, RotateCcw, X } from "lucide-react";
import type { Bed, Photo, Plant } from "../types";
import type { Action } from "../lib/garden";
import { findCrop, soilType } from "../data/catalog";
import { FERTILIZERS } from "../data/fertilizers";
import { SOIL_MIXES, findSoilMix } from "../data/soils";
import { localDate } from "../lib/date";
import { NUTRIENTS, OVERUSE_THRESHOLD, acidMismatch, feedSchedule, nutrientsOn, soilHealth } from "../lib/soil";
import { stageLine } from "../lib/photos";
import { styles } from "../styles";
import { PhotoCapture } from "./PhotoCapture";
import { PhotoThumb } from "./PhotoThumb";

type Picking = "soil" | "feed" | null;

interface CardProps {
  bed: Bed;
  plants: Plant[];
  photos: Photo[];
  today: string;
  say: (m: string) => void;
  onOpenPhoto: (id: string) => void;
  openFeed: boolean;
  onOpened: () => void;
  dispatch: (a: Action) => void;
}

export function BedCard({ bed, plants, photos, today, say, onOpenPhoto, openFeed, onOpened, dispatch }: CardProps) {
  const [picking, setPicking] = useState<Picking>(null);
  useEffect(() => {
    if (openFeed) {
      setPicking("feed");
      onOpened();
    }
  }, [openFeed, onOpened]);

  const st = soilType(bed.type);
  const growing = plants.length;
  const now = nutrientsOn(bed, growing, today);
  const h = soilHealth(now);
  const accent = st.hasNutrient ? h.color : "var(--sky)";
  const overused = st.hasNutrient && bed.uses >= OVERUSE_THRESHOLD;
  const mix = findSoilMix(bed.soilMix);
  const feed = feedSchedule(bed, growing, today);
  const crops = plants.flatMap((p) => findCrop(p.cropId) ?? []);
  const acidWarn = acidMismatch(bed, crops);
  const mixes = SOIL_MIXES.filter((m) => !m.fieldOnly || bed.type === "field");

  const refresh = () => dispatch({ type: "refreshBed", bedId: bed.id, today: localDate() });
  const pickSoil = (soilMix: string) => {
    dispatch({ type: "refreshBed", bedId: bed.id, today: localDate(), soilMix });
    setPicking(null);
  };
  const pickFeed = (fertilizer: string) => {
    dispatch({ type: "feedBed", bedId: bed.id, fertilizer, today: localDate() });
    setPicking(null);
  };

  return (
    <article style={{ ...styles.bedCard, borderColor: accent + "55" }}>
      <div style={styles.bedHead}>
        <div>
          <h3 style={{ ...styles.bedName, margin: 0, fontWeight: "normal" }}>
            {st.emoji} {bed.name}
          </h3>
          <div style={styles.bedSub}>
            {st.label} ・ 育成中 {growing} 株
          </div>
        </div>
        <div style={{ ...styles.bedHealthBadge, background: accent }}>{st.hasNutrient ? h.label : "水耕"}</div>
      </div>

      <div style={styles.usesRow}>
        <RotateCcw size={13} color="var(--muted)" aria-hidden="true" />
        <span>
          ここで <b style={{ color: overused ? "var(--flame)" : "var(--muted)" }}>{bed.uses}回</b> 連続栽培
        </span>
        {overused && <span style={styles.usesWarn}>使いすぎ</span>}
      </div>

      <div style={styles.photoStrip}>
        {[...photos].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3).map((p) => (
          <PhotoThumb key={p.id} id={p.id} alt={`${p.date} ${stageLine(p.stages)}`} style={{ width: 52, height: 52 }} onClick={() => onOpenPhoto(p.id)} />
        ))}
        {photos.length > 3 && (
          <button style={styles.photoStripMore} onClick={() => onOpenPhoto(photos[photos.length - 1]!.id)}>
            ほか{photos.length - 3}枚
          </button>
        )}
        <span style={{ marginLeft: "auto" }}>
          <PhotoCapture bedId={bed.id} dispatch={dispatch} say={say} compact={photos.length > 0} />
        </span>
      </div>

      {st.hasNutrient ? (
        <>
          <div style={styles.soilMixRow}>
            <Mountain size={13} color="var(--muted)" aria-hidden="true" />
            <span>土：{mix ? mix.name : "未設定"}</span>
            <button style={styles.soilMixLink} onClick={() => setPicking(picking === "soil" ? null : "soil")}>
              {mix ? "変更・入れ替え" : "使っている土を選ぶ"}
            </button>
          </div>
          {picking === "soil" && (
            <PickList
              title="使っている土を選ぶ（栄養はその土の値になります）"
              items={mixes.map((m) => ({ id: m.id, name: m.name, desc: m.desc }))}
              onPick={pickSoil}
              onClose={() => setPicking(null)}
            />
          )}
          {acidWarn && (
            <div style={styles.acidWarn} role="alert">
              <AlertTriangle size={14} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
              <span>ブルーベリーは酸性土（pH4.5前後）が必要です。ピートモス主体の専用土に植え替えると実つきが安定します。</span>
            </div>
          )}

          <div style={styles.npkBox}>
            {NUTRIENTS.map((nut) => {
              const val = Math.round(now[nut.key]);
              return (
                <div key={nut.key} style={styles.npkRow}>
                  <span style={{ ...styles.npkBadge, background: nut.color }} aria-hidden="true">
                    {nut.short}
                  </span>
                  <div style={styles.npkInfo}>
                    <div style={styles.npkLabelRow}>
                      <span style={styles.npkLabel}>
                        {nut.label}
                        <span style={styles.npkRole}>（{nut.role}）</span>
                      </span>
                      <span style={{ ...styles.npkVal, color: val < 30 ? "var(--flame)" : "var(--muted)" }}>{val}</span>
                    </div>
                    <div
                      style={styles.npkTrack}
                      role="progressbar"
                      aria-label={`${nut.label}の残量`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={val}
                    >
                      <div style={{ ...styles.npkFill, width: `${val}%`, background: nut.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ ...styles.soilAdvice, color: h.color }}>
            <Beaker size={13} aria-hidden="true" /> {h.advice}
          </div>

          <div
            style={{
              ...styles.feedBox,
              color: feed.due ? "var(--flame)" : "var(--muted)",
              background: feed.due ? "var(--flame-bg)" : "var(--mint-bg)",
              borderColor: feed.due ? "var(--line)" : "var(--line)",
            }}
          >
            <Leaf size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
            <span>{feed.note}</span>
          </div>
          {growing > 0 && picking !== "feed" && (
            <button style={styles.feedBtn} onClick={() => setPicking("feed")}>
              <Leaf size={15} aria-hidden="true" /> 追肥した
            </button>
          )}
          {picking === "feed" && (
            <PickList
              title="何を追肥しましたか？"
              items={FERTILIZERS.map((f) => ({ id: f.id, name: f.name, desc: f.desc }))}
              onPick={pickFeed}
              onClose={() => setPicking(null)}
            />
          )}

          {(h.label !== "肥沃" || bed.uses > 0) && (
            <button style={styles.refreshBtn} onClick={refresh}>
              <RotateCcw size={15} aria-hidden="true" /> 土をリフレッシュ（堆肥・土替え）
            </button>
          )}
        </>
      ) : (
        <>
          <div style={styles.hydroBox}>
            <Droplets size={15} color="var(--sky)" aria-hidden="true" style={{ flexShrink: 0, marginTop: 3 }} />
            <span>
              培養液で栄養を管理します。土の栄養消費はありません。週1回ほど液を交換し、EC・pHを保つと安定します。
            </span>
          </div>
          <button style={{ ...styles.refreshBtn, ...styles.hydroRefreshBtn }} onClick={refresh}>
            <RotateCcw size={15} aria-hidden="true" /> 培養液を交換
          </button>
        </>
      )}
    </article>
  );
}

interface PickListProps {
  title: string;
  items: { id: string; name: string; desc: string }[];
  onPick: (id: string) => void;
  onClose: () => void;
}

function PickList({ title, items, onPick, onClose }: PickListProps) {
  return (
    <div style={styles.pickList} role="group" aria-label={title}>
      <div style={styles.pickTitle}>
        <span>{title}</span>
        <button style={styles.soilMixLink} onClick={onClose} aria-label="閉じる">
          <X size={14} aria-hidden="true" />
        </button>
      </div>
      {items.map((it) => (
        <button key={it.id} style={styles.pickItem} onClick={() => onPick(it.id)}>
          <span style={styles.pickName}>{it.name}</span>
          <span style={styles.pickDesc}>{it.desc}</span>
        </button>
      ))}
    </div>
  );
}
