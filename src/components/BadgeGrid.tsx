import { useState } from "react";
import { Award, Check } from "lucide-react";
import type { BadgeId } from "../types";
import { CROPS } from "../data/catalog";
import { BADGES, cropBadges, type Badge } from "../data/game";
import { styles } from "../styles";

function Tile({ b, got }: { b: Badge; got: boolean }) {
  return (
    <div style={{ ...styles.badge, opacity: got ? 1 : 0.42, filter: got ? "none" : "grayscale(1)" }}>
      <div style={styles.badgeEmoji} aria-hidden="true">
        {b.emoji}
      </div>
      <div style={styles.badgeName}>{b.name}</div>
      <div style={styles.badgeDesc}>{b.desc}</div>
      {got && (
        <div style={styles.badgeGot}>
          <Check size={12} aria-hidden="true" /> 獲得
        </div>
      )}
    </div>
  );
}

export function BadgeGrid({ earned }: { earned: readonly BadgeId[] }) {
  const [showAll, setShowAll] = useState(false);
  const crop = CROPS.flatMap((c) => cropBadges(c));
  const gotCrop = crop.filter((b) => earned.includes(b.id));
  const shown = showAll ? crop : gotCrop;
  return (
    <section style={{ marginTop: 32 }}>
      <h2 style={styles.sectionTitle}>
        <Award size={20} color="var(--amber)" aria-hidden="true" /> 実績バッジ
      </h2>
      <div style={styles.badgeGrid}>
        {BADGES.map((b) => (
          <Tile key={b.id} b={b} got={earned.includes(b.id)} />
        ))}
      </div>

      <div style={{ ...styles.sectionHead, marginTop: 22 }}>
        <h3 style={{ ...styles.sectionTitle, fontSize: 17 }}>
          作物ごとの実績{" "}
          <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--muted)" }}>
            {gotCrop.length} / {crop.length}
          </span>
        </h3>
        <button style={styles.histBtn} onClick={() => setShowAll((v) => !v)}>
          {showAll ? "獲得したものだけ" : "すべて表示"}
        </button>
      </div>
      {shown.length === 0 ? (
        <p style={{ ...styles.calNote, margin: 0 }}>作物を収穫すると、その作物の実績が増えます（初収穫・10回収穫）。</p>
      ) : (
        <div style={styles.badgeGrid}>
          {shown.map((b) => (
            <Tile key={b.id} b={b} got={earned.includes(b.id)} />
          ))}
        </div>
      )}
    </section>
  );
}
