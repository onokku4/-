import { Beaker, Droplets, Mountain, Plus, RotateCcw } from "lucide-react";
import type { Bed, Plant } from "../types";
import type { Action } from "../lib/garden";
import { soilType } from "../data/catalog";
import { localDate } from "../lib/date";
import { NUTRIENTS, OVERUSE_THRESHOLD, soilHealth } from "../lib/soil";
import { styles } from "../styles";

interface Props {
  beds: Bed[];
  plants: Plant[];
  dispatch: (a: Action) => void;
  onAdd: () => void;
}

export function BedSection({ beds, plants, dispatch, onAdd }: Props) {
  return (
    <section style={{ marginTop: 26 }}>
      <div style={styles.sectionHead}>
        <h2 style={styles.sectionTitle}>
          <Mountain size={20} color="#9c7a4a" aria-hidden="true" /> 育てる場所の状態
        </h2>
        <button style={styles.histBtn} onClick={onAdd}>
          <Plus size={16} aria-hidden="true" /> 場所を追加
        </button>
      </div>
      <div style={styles.bedGrid}>
        {beds.map((b) => (
          <BedCard
            key={b.id}
            bed={b}
            planted={plants.filter((p) => p.bedId === b.id).length}
            onRefresh={() => dispatch({ type: "refreshBed", bedId: b.id, today: localDate() })}
          />
        ))}
      </div>
    </section>
  );
}

function BedCard({ bed, planted, onRefresh }: { bed: Bed; planted: number; onRefresh: () => void }) {
  const st = soilType(bed.type);
  const h = soilHealth(bed);
  const accent = st.hasNutrient ? h.color : "#5b8aa6";
  const overused = st.hasNutrient && bed.uses >= OVERUSE_THRESHOLD;
  return (
    <article style={{ ...styles.bedCard, borderColor: accent + "55" }}>
      <div style={styles.bedHead}>
        <div>
          <h3 style={{ ...styles.bedName, margin: 0, fontWeight: "normal" }}>
            {st.emoji} {bed.name}
          </h3>
          <div style={styles.bedSub}>
            {st.label} ・ 育成中 {planted} 株
          </div>
        </div>
        <div style={{ ...styles.bedHealthBadge, background: accent }}>{st.hasNutrient ? h.label : "水耕"}</div>
      </div>

      <div style={styles.usesRow}>
        <RotateCcw size={13} color="#9c7a4a" aria-hidden="true" />
        <span>
          ここで <b style={{ color: overused ? "#c0432a" : "#7a6a45" }}>{bed.uses}回</b> 連続栽培
        </span>
        {overused && <span style={styles.usesWarn}>使いすぎ</span>}
      </div>

      {st.hasNutrient ? (
        <>
          <div style={styles.npkBox}>
            {NUTRIENTS.map((nut) => {
              const val = Math.round(bed[nut.key]);
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
                      <span style={{ ...styles.npkVal, color: val < 30 ? "#c0432a" : "#7a6a45" }}>{val}</span>
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
          {(h.label !== "肥沃" || bed.uses > 0) && (
            <button style={styles.refreshBtn} onClick={onRefresh}>
              <RotateCcw size={15} aria-hidden="true" /> 土をリフレッシュ（堆肥・土替え）
            </button>
          )}
        </>
      ) : (
        <>
          <div style={styles.hydroBox}>
            <Droplets size={15} color="#5b8aa6" aria-hidden="true" style={{ flexShrink: 0, marginTop: 3 }} />
            <span>
              培養液で栄養を管理します。土の栄養消費はありません。週1回ほど液を交換し、EC・pHを保つと安定します。
            </span>
          </div>
          <button style={{ ...styles.refreshBtn, ...styles.hydroRefreshBtn }} onClick={onRefresh}>
            <RotateCcw size={15} aria-hidden="true" /> 培養液を交換
          </button>
        </>
      )}
    </article>
  );
}
