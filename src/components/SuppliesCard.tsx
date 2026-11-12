import { useState } from "react";
import { ChevronDown, ChevronUp, ShoppingBasket } from "lucide-react";
import type { Recommendation } from "../lib/supplies";
import { styles } from "../styles";

/** 今そろえる・補充する物。緊急のものだけ最初に見せる */
export function SuppliesCard({ items }: { items: Recommendation[] }) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  const now = items.filter((i) => i.urgency === "now");
  const shown = open ? items : now.length > 0 ? now : items.slice(0, 3);
  return (
    <section style={{ ...styles.notifyCard, display: "block", marginBottom: 14 }} aria-label="そろえる物">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div style={styles.notifyLeft}>
          <ShoppingBasket size={20} color="var(--amber)" aria-hidden="true" />
          <div>
            <div style={styles.notifyTitle}>そろえる物・補充</div>
            <div style={styles.notifySub}>
              今すぐ {now.length}・そのうち {items.length - now.length}
            </div>
          </div>
        </div>
        <button style={styles.histBtn} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />} {open ? "閉じる" : "すべて"}
        </button>
      </div>
      <ul style={{ ...styles.guideList, marginTop: 10, listStyle: "none", paddingLeft: 0 }}>
        {shown.map((i) => (
          <li key={`${i.name}-${i.for}`} style={styles.gearRow}>
            <span style={{ ...styles.pill, background: i.urgency === "now" ? "var(--flame-bg)" : "var(--panel-2)", color: i.urgency === "now" ? "var(--flame)" : "var(--muted)" }}>{i.urgency === "now" ? "今すぐ" : "そのうち"}</span>
            <span>
              <b>{i.name}</b>
              <span style={styles.gearWhy}>
                {i.for}：{i.reason}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
