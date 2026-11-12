import { Award, Check } from "lucide-react";
import type { BadgeId } from "../types";
import { BADGES } from "../data/game";
import { styles } from "../styles";

export function BadgeGrid({ earned }: { earned: readonly BadgeId[] }) {
  return (
    <section style={{ marginTop: 32 }}>
      <h2 style={styles.sectionTitle}>
        <Award size={20} color="var(--amber)" aria-hidden="true" /> 実績バッジ
      </h2>
      <div style={styles.badgeGrid}>
        {BADGES.map((b) => {
          const got = earned.includes(b.id);
          return (
            <div
              key={b.id}
              style={{ ...styles.badge, opacity: got ? 1 : 0.42, filter: got ? "none" : "grayscale(1)" }}
            >
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
        })}
      </div>
    </section>
  );
}
