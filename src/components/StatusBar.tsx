import { Droplets, Flame, Leaf, Trophy } from "lucide-react";
import { levelFor } from "../data/game";
import { styles } from "../styles";

interface Props {
  xp: number;
  streak: number;
  waterCount: number;
  plantCount: number;
}

export function StatusBar({ xp, streak, waterCount, plantCount }: Props) {
  const { level, next, progressPct } = levelFor(xp);
  return (
    <section className="stat-grid" aria-label="ステータス">
      <div style={styles.levelCard}>
        <div style={styles.levelTop}>
          <div>
            <div style={styles.levelLv}>Lv.{level.lv}</div>
            <div style={styles.levelTitle}>{level.title}</div>
          </div>
          <Trophy size={30} color="var(--amber)" aria-hidden="true" />
        </div>
        <div
          style={styles.xpTrack}
          role="progressbar"
          aria-label="次のレベルまで"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPct}
        >
          <div style={{ ...styles.xpFill, width: `${progressPct}%` }} />
        </div>
        <div style={styles.xpText}>
          {xp} XP {next ? `／ 次まで ${next.min - xp}` : "（最高ランク！）"}
        </div>
      </div>
      <Mini icon={<Flame size={22} color="var(--flame)" aria-hidden="true" />} value={streak} label="連続日数" />
      <Mini icon={<Droplets size={22} color="var(--sky)" aria-hidden="true" />} value={waterCount} label="水やり回数" />
      <Mini icon={<Leaf size={22} color="var(--mint)" aria-hidden="true" />} value={plantCount} label="育成中" />
    </section>
  );
}

function Mini({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div style={styles.miniStat}>
      {icon}
      <div style={styles.miniNum}>{value}</div>
      <div style={styles.miniLabel}>{label}</div>
    </div>
  );
}
