import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Camera, ChevronLeft, ChevronRight, Images, Leaf, Plus, Sprout } from "lucide-react";
import type { Bed, GardenState } from "../types";
import type { Action } from "../lib/garden";
import { findCrop, soilType } from "../data/catalog";
import { stageLine } from "../lib/photos";
import { feedSchedule, nutrientsOn, soilHealth } from "../lib/soil";
import { styles } from "../styles";
import { BedCard } from "./BedCard";
import { PhotoCapture } from "./PhotoCapture";
import { PhotoThumb } from "./PhotoThumb";
import { PlantCard } from "./PlantCard";
import type { PlantView } from "./plantView";

type SubTab = "status" | "plants" | "photos";

interface Props {
  state: GardenState;
  views: PlantView[];
  today: string;
  /** 開いている場所。null なら一覧 */
  openBedId: string | null;
  onOpenBed: (id: string | null) => void;
  /** 追肥アラートから来たとき、その場所の肥料選択を開く */
  feedTarget: string | null;
  onFeedTargetDone: () => void;
  onAddBed: () => void;
  onPlant: (bedId: string) => void;
  onOpenPhoto: (id: string) => void;
  say: (m: string) => void;
  dispatch: (a: Action) => void;
}

/** 「場所」タブ。一覧 → 場所を選ぶと、状態／作物／写真の下位タブ */
export function BedsView(props: Props) {
  const { state, openBedId, onOpenBed } = props;
  const bed = state.beds.find((b) => b.id === openBedId);
  if (bed) return <BedDetail {...props} bed={bed} onBack={() => onOpenBed(null)} />;
  return <BedList {...props} />;
}

function BedList({ state, views, today, onOpenBed, onAddBed }: Props) {
  return (
    <section aria-label="育てる場所">
      <div style={styles.sectionHead}>
        <div>
          <div style={styles.eyebrow}>Places</div>
          <h2 style={styles.sectionTitle}>育てる場所</h2>
        </div>
        <button style={styles.histBtn} onClick={onAddBed}>
          <Plus size={16} aria-hidden="true" /> 場所を追加
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {state.beds.map((b) => {
          const st = soilType(b.type);
          const plants = state.plants.filter((p) => p.bedId === b.id);
          const h = soilHealth(nutrientsOn(b, plants.length, today));
          const feed = feedSchedule(b, plants.length, today);
          const due = views.filter((v) => v.plant.bedId === b.id && v.status.due).length;
          const photos = state.photos.filter((p) => p.bedId === b.id);
          const latest = [...photos].sort((x, y) => y.date.localeCompare(x.date))[0];
          return (
            <button key={b.id} style={styles.bedRow} onClick={() => onOpenBed(b.id)} aria-label={`${b.name}を開く`}>
              {latest ? (
                <PhotoThumb id={latest.id} alt="" style={{ width: 56, height: 56, borderRadius: 12 }} />
              ) : (
                <span style={{ fontSize: 30, width: 56, textAlign: "center" }} aria-hidden="true">
                  {st.emoji}
                </span>
              )}
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={styles.bedRowName}>{b.name}</span>
                  {st.hasNutrient && <span style={{ ...styles.pill, background: h.color + "22", color: h.color }}>{h.label}</span>}
                  {feed.due && <span style={{ ...styles.pill, background: "var(--flame-bg)", color: "var(--flame-soft)" }}>追肥</span>}
                  {due > 0 && <span style={{ ...styles.pill, background: "var(--sky-bg)", color: "var(--sky)" }}>水やり {due}</span>}
                </span>
                <span style={{ ...styles.bedRowMeta, display: "block" }}>
                  {st.label}・{plants.length}株{photos.length > 0 && `・📷 ${photos.length}`}
                </span>
                <span style={{ ...styles.bedRowPlants, display: "block" }} aria-hidden="true">
                  {plants.map((p) => findCrop(p.cropId)?.emoji ?? "🌱").join("")}
                </span>
              </span>
              <ChevronRight size={18} color="var(--dim)" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </section>
  );
}

function BedDetail({ state, views, today, bed, onBack, feedTarget, onFeedTargetDone, onPlant, onOpenPhoto, say, dispatch }: Props & { bed: Bed; onBack: () => void }) {
  const [sub, setSub] = useState<SubTab>(feedTarget === bed.id ? "status" : "plants");
  const plants = state.plants.filter((p) => p.bedId === bed.id);
  const bedViews = views.filter((v) => v.plant.bedId === bed.id);
  const photos = [...state.photos.filter((p) => p.bedId === bed.id)].sort((a, b) => b.date.localeCompare(a.date));
  const st = soilType(bed.type);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(bed.name);
  const saveName = () => {
    dispatch({ type: "renameBed", bedId: bed.id, name: nameDraft });
    setRenaming(false);
  };

  return (
    <section aria-label={bed.name}>
      <button style={styles.navBack} onClick={onBack}>
        <ChevronLeft size={16} aria-hidden="true" /> 場所の一覧
      </button>
      <div style={styles.sectionHead}>
        <div>
          <div style={styles.eyebrow}>{st.label}</div>
          {renaming ? (
            <form
              style={{ display: "flex", gap: 6, alignItems: "center" }}
              onSubmit={(e) => {
                e.preventDefault();
                saveName();
              }}
            >
              <input style={{ ...styles.editInput, width: 180 }} value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} aria-label="場所の名前" autoFocus />
              <button type="submit" style={styles.editBtn} aria-label="名前を保存">
                <Check size={14} aria-hidden="true" />
              </button>
              <button type="button" style={styles.editBtn} aria-label="名前の編集をやめる" onClick={() => setRenaming(false)}>
                <X size={14} aria-hidden="true" />
              </button>
            </form>
          ) : (
            <h2 style={{ ...styles.sectionTitle, gap: 6 }}>
              {st.emoji} {bed.name}
              <button
                style={styles.editBtn}
                aria-label="場所の名前を編集"
                onClick={() => {
                  setNameDraft(bed.name);
                  setRenaming(true);
                }}
              >
                <Pencil size={13} aria-hidden="true" />
              </button>
            </h2>
          )}
        </div>
        <button style={styles.addBtn} onClick={() => onPlant(bed.id)}>
          <Plus size={16} aria-hidden="true" /> ここに植える
        </button>
      </div>

      <div style={styles.subTabs} role="tablist" aria-label={`${bed.name}の表示`}>
        {(
          [
            ["plants", "作物", <Sprout key="s" size={14} aria-hidden="true" />, plants.length],
            ["status", "状態", <Leaf key="l" size={14} aria-hidden="true" />, 0],
            ["photos", "写真", <Images key="i" size={14} aria-hidden="true" />, photos.length],
          ] as const
        ).map(([id, label, icon, n]) => (
          <button key={id} role="tab" aria-selected={sub === id} style={{ ...styles.subTab, ...(sub === id ? styles.subTabActive : {}) }} onClick={() => setSub(id)}>
            {icon} {label}
            {n > 0 && <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--dim)" }}>{n}</span>}
          </button>
        ))}
      </div>

      {sub === "plants" &&
        (bedViews.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: 44, marginBottom: 8 }} aria-hidden="true">
              {st.emoji}
            </div>
            <p style={styles.emptyText}>この場所にはまだ何も植えていません。</p>
            <button style={styles.addBtnBig} onClick={() => onPlant(bed.id)}>
              <Plus size={18} aria-hidden="true" /> ここに植える
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {bedViews.map((v) => (
              <PlantCard key={v.plant.uid} view={v} beds={state.beds} dispatch={dispatch} />
            ))}
          </div>
        ))}

      {sub === "status" && (
        <BedCard bed={bed} plants={plants} photos={photos} today={today} say={say} onOpenPhoto={onOpenPhoto} openFeed={feedTarget === bed.id} onOpened={onFeedTargetDone} dispatch={dispatch} />
      )}

      {sub === "photos" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={styles.calNote}>{photos.length > 0 ? `${photos.length}枚。タップで大きく、横にスワイプでページ送り。` : "撮影すると、植え付けから何日目かと一緒に残ります。"}</span>
            <PhotoCapture bedId={bed.id} dispatch={dispatch} say={say} compact={photos.length > 0} />
          </div>
          {photos.length === 0 ? (
            <div style={styles.empty}>
              <Camera size={36} color="var(--dim)" aria-hidden="true" />
              <p style={styles.emptyText}>まだ写真がありません。</p>
            </div>
          ) : (
            <div style={styles.albumGrid}>
              {photos.map((p) => (
                <figure key={p.id} style={styles.albumItem}>
                  <PhotoThumb id={p.id} alt={`${p.date} ${stageLine(p.stages)}`} style={styles.albumThumb} onClick={() => onOpenPhoto(p.id)} />
                  <figcaption style={styles.albumCap}>
                    <div style={styles.albumDate}>{p.date.slice(5).replace("-", "/")}</div>
                    <div style={styles.albumStage}>{p.stages.length ? p.stages.map((s) => `${s.day}日目`).join("・") : "植え付け前"}</div>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
