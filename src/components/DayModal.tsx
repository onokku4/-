import { CloudRain, Droplets, Leaf, RotateCcw, Sprout, Thermometer } from "lucide-react";
import type { GardenState } from "../types";
import { resolve } from "../data/catalog";
import { dayInfo } from "../lib/calendar";
import { daysBetween } from "../lib/date";
import { stageLine } from "../lib/photos";
import { tempVerdict } from "../lib/temperature";
import { CONDITION_EMOJI, conditionInfo } from "../lib/weather";
import { styles } from "../styles";
import { Modal } from "./Modal";
import { PhotoThumb } from "./PhotoThumb";

interface Props {
  state: Pick<GardenState, "plants" | "beds" | "harvestLog" | "careLog" | "weatherLog" | "weather" | "photos">;
  date: string;
  today: string;
  onOpenPhoto: (id: string) => void;
  onClose: () => void;
}

const md = (date: string) => `${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日`;

/** その日のデータ画面：天気、株ごとの様子（何日目・気温・水やり・写真）、出来事 */
export function DayModal({ state, date, today, onOpenPhoto, onClose }: Props) {
  const info = dayInfo(state, date, today);
  const wx = info.weather;
  const watered = new Set(info.care.filter((c) => c.kind === "water").map((c) => c.label));
  // その日に植わっていた株（片付けた株は写真の記録だけ残る）
  const plants = state.plants.filter((p) => p.plantedDate <= date);

  return (
    <Modal title={`📅 ${md(date)}${date === today ? "（今日）" : ""}`} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {wx ? (
          <div style={{ ...styles.calDetailRow, fontSize: 13 }}>
            <span aria-hidden="true" style={{ fontSize: 22 }}>
              {CONDITION_EMOJI[wx.condition]}
            </span>
            {conditionInfo(wx.condition).label}　最高 {wx.maxC}℃ ／ 最低 {wx.minC}℃
            {wx.rainMm > 0 && (
              <>
                　<CloudRain size={13} aria-hidden="true" /> {wx.rainMm}mm
              </>
            )}
            {info.forecast && <span style={styles.calForecastTag}>予報</span>}
            {wx.source === "manual" && <span style={styles.calManualTag}>手入力</span>}
          </div>
        ) : (
          <div style={{ ...styles.calDetailRow, color: "var(--dim)" }}>この日の天気の記録はありません</div>
        )}

        {info.photos.length > 0 && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
            {info.photos.map((p) => (
              <div key={p.id} style={{ flex: "0 0 auto", width: 110 }}>
                <PhotoThumb id={p.id} alt={stageLine(p.stages)} style={{ width: 110, height: 110 }} onClick={() => onOpenPhoto(p.id)} />
                <div style={{ ...styles.albumCap, marginTop: 3 }}>
                  <div style={styles.albumDate}>{state.beds.find((b) => b.id === p.bedId)?.name ?? "（削除された場所）"}</div>
                  <div style={styles.albumStage}>{p.stages.length ? p.stages.map((s) => `${s.day}日目`).join("・") : "植え付け前"}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <div style={styles.eyebrow}>Plants</div>
          {plants.length === 0 ? (
            <div style={{ ...styles.calDetailRow, color: "var(--dim)" }}>この日はまだ何も植えていません</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {plants.map((p) => {
                const r = resolve(p);
                if (!r) return null;
                const day = daysBetween(p.plantedDate, date);
                const bed = state.beds.find((b) => b.id === p.bedId);
                const hot = wx ? tempVerdict(r.crop, wx.maxC) : null;
                const cold = wx ? tempVerdict(r.crop, wx.minC) : null;
                const temp = hot?.kind === "hot" ? hot : cold?.kind === "cold" ? cold : hot;
                const photo = info.photos.find((ph) => ph.bedId === p.bedId);
                const isDue = info.waterDue.some((d) => d.uid === p.uid);
                return (
                  <div key={p.uid} style={{ ...styles.bedRow, cursor: "default", padding: "10px 12px" }}>
                    {photo ? (
                      <PhotoThumb id={photo.id} alt="" style={{ width: 48, height: 48, borderRadius: 10 }} onClick={() => onOpenPhoto(photo.id)} />
                    ) : (
                      <span style={{ fontSize: 28, width: 48, textAlign: "center" }} aria-hidden="true">
                        {r.crop.emoji}
                      </span>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "var(--display)", fontSize: 15 }}>{p.projectName}</span>
                        <span style={{ ...styles.pill, background: "var(--mint-bg)", color: "var(--mint)" }}>{day}日目</span>
                        {temp && temp.kind !== "ok" && (
                          <span style={{ ...styles.pill, background: temp.kind === "hot" ? "var(--flame-bg)" : "var(--sky-bg)", color: temp.kind === "hot" ? "var(--flame)" : "var(--sky)" }}>
                            <Thermometer size={10} aria-hidden="true" style={{ verticalAlign: -1 }} /> {temp.label}
                          </span>
                        )}
                        {watered.has(p.projectName) && (
                          <span style={{ ...styles.pill, background: "var(--sky-bg)", color: "var(--sky)" }}>
                            <Droplets size={10} aria-hidden="true" style={{ verticalAlign: -1 }} /> 水やり済み
                          </span>
                        )}
                        {isDue && <span style={{ ...styles.pill, background: "var(--amber-bg)", color: "var(--amber)" }}>水やり{info.forecast ? "予定" : ""}</span>}
                      </div>
                      <div style={styles.bedRowMeta}>
                        {r.crop.name}・{r.variety.name.replace(/（.*）/, "")}
                        {bed && `・${bed.name}`}
                        {temp && temp.kind !== "ok" && `　${temp.advice}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {(info.care.length > 0 || info.harvests.length > 0 || info.planted.length > 0) && (
          <div>
            <div style={styles.eyebrow}>Events</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {info.planted.map((p) => (
                <div key={p.uid} style={styles.calDetailRow}>
                  <Sprout size={14} color="var(--mint)" aria-hidden="true" /> 植え付け：{p.projectName}
                </div>
              ))}
              {info.care.map((e) => (
                <div key={`${e.kind}-${e.label}`} style={styles.calDetailRow}>
                  {e.kind === "water" && <Droplets size={14} color="var(--sky)" aria-hidden="true" />}
                  {e.kind === "feed" && <Leaf size={14} color="var(--mint)" aria-hidden="true" />}
                  {e.kind === "refresh" && <RotateCcw size={14} color="var(--muted)" aria-hidden="true" />}
                  {e.kind === "water" ? "水やり" : e.kind === "feed" ? "追肥" : "土替え"}：{e.label}
                </div>
              ))}
              {info.harvests.map((h) => (
                <div key={h.id} style={styles.calDetailRow}>
                  <span aria-hidden="true">🧺</span> 収穫：{h.projectName || h.cropName}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
