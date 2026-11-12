import { useState } from "react";
import { BookOpen, Bug, Package, Scissors, Wrench } from "lucide-react";
import type { Crop } from "../types";
import { CATEGORY_GUIDES, CROP_GUIDES } from "../data/guides";
import { gearFor } from "../lib/supplies";
import { tempRangeOf } from "../lib/temperature";
import { formatMonths } from "../ui/format";
import { styles } from "../styles";
import { Modal } from "./Modal";

type Tab = "how" | "gear" | "pests";

/** 作物の育て方ヘルプ：育て方／道具と資材／病害虫 */
export function GuideModal({ crop, onClose }: { crop: Crop; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("how");
  const cat = CATEGORY_GUIDES[crop.category];
  const own = CROP_GUIDES[crop.id];
  const { tools, supplies } = gearFor(crop.id);
  const range = tempRangeOf(crop);

  return (
    <Modal title={`${crop.emoji} ${crop.name}の育て方`} onClose={onClose}>
      <div style={{ ...styles.calNote, marginBottom: 10 }}>
        {crop.category}・{crop.sun}・水やり目安 {crop.waterEvery}日おき・適温 {range.min}〜{range.max}℃
        {crop.harvestMonths && `・収穫期 ${formatMonths(crop.harvestMonths)}`}
      </div>
      <div style={styles.subTabs} role="tablist">
        {(
          [
            ["how", "育て方", <BookOpen key="b" size={14} aria-hidden="true" />],
            ["gear", "道具と資材", <Wrench key="w" size={14} aria-hidden="true" />],
            ["pests", "病害虫", <Bug key="g" size={14} aria-hidden="true" />],
          ] as const
        ).map(([id, label, icon]) => (
          <button key={id} role="tab" aria-selected={tab === id} style={{ ...styles.subTab, ...(tab === id ? styles.subTabActive : {}) }} onClick={() => setTab(id)}>
            {icon} {label}
          </button>
        ))}
      </div>

      {tab === "how" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {own && (
            <section>
              <div style={styles.eyebrow}>{crop.name}のポイント</div>
              <ul style={styles.guideList}>
                {own.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </section>
          )}
          <section>
            <div style={styles.eyebrow}>{crop.category}の基本</div>
            <ol style={{ ...styles.guideList, listStyle: "decimal" }}>
              {cat.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </section>
          {own && (
            <section>
              <div style={styles.eyebrow}>
                <Scissors size={12} aria-hidden="true" /> 収穫
              </div>
              <p style={{ ...styles.guideText, margin: 0 }}>{own.harvest}</p>
            </section>
          )}
          <section>
            <div style={styles.eyebrow}>品種ごとのコツ</div>
            <ul style={styles.guideList}>
              {crop.varieties.map((v) => (
                <li key={v.id}>
                  <b>{v.name}</b>：{v.tip}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {tab === "gear" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <section>
            <div style={styles.eyebrow}>
              <Wrench size={12} aria-hidden="true" /> 道具
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {tools.map((t) => (
                <div key={t.name} style={styles.gearRow}>
                  <span style={{ ...styles.pill, background: t.essential ? "var(--mint-bg)" : "var(--panel-2)", color: t.essential ? "var(--mint)" : "var(--muted)" }}>{t.essential ? "必須" : "あると楽"}</span>
                  <span>
                    <b>{t.name}</b>
                    <span style={styles.gearWhy}>{t.why}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section>
            <div style={styles.eyebrow}>
              <Package size={12} aria-hidden="true" /> 補充する資材
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {supplies.map((s) => (
                <div key={s.name} style={styles.gearRow}>
                  <span style={{ ...styles.pill, background: "var(--amber-bg)", color: "var(--amber)" }}>消耗品</span>
                  <span>
                    <b>{s.name}</b>
                    <span style={styles.gearWhy}>{s.when}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === "pests" && (
        <section>
          <div style={styles.eyebrow}>出やすい病害虫と対処</div>
          {own ? (
            <ul style={styles.guideList}>
              {own.pests.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          ) : (
            <p style={styles.guideText}>この作物の情報はまだありません。</p>
          )}
          <p style={{ ...styles.calNote, marginTop: 10 }}>基本は「早く見つけて早く取る」。毎朝の水やりのときに葉裏を見るのが一番の予防です。</p>
        </section>
      )}
    </Modal>
  );
}
