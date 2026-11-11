import { useEffect, useRef } from "react";
import { useEscape } from "../hooks/useEscape";
import type { Badge } from "../data/game";
import { styles } from "../styles";

export function BadgePopup({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEscape(onClose);
  useEffect(() => {
    ref.current?.focus();
  }, [badge.id]);

  return (
    <div
      style={styles.popupOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={`バッジ獲得：${badge.name}`}
        tabIndex={-1}
        style={styles.popupCard}
      >
        <div style={styles.popupBurst} aria-hidden="true">
          {badge.emoji}
        </div>
        <div style={styles.popupTitle}>バッジ獲得！</div>
        <div style={styles.popupName}>{badge.name}</div>
        <div style={styles.popupDesc}>{badge.desc}</div>
        <button style={styles.popupBtn} onClick={onClose}>
          やったー！
        </button>
      </div>
    </div>
  );
}
