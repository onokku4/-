import { CalendarDays, Home, Mountain, Settings, type LucideIcon } from "lucide-react";
import { styles } from "../styles";

export type Tab = "home" | "beds" | "calendar" | "settings";

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "ホーム", icon: Home },
  { id: "beds", label: "場所", icon: Mountain },
  { id: "calendar", label: "カレンダー", icon: CalendarDays },
  { id: "settings", label: "設定", icon: Settings },
];

interface Props {
  tab: Tab;
  onChange: (t: Tab) => void;
  /** タブに出す件数（ホーム＝今日やること） */
  badges?: Partial<Record<Tab, number>>;
}

export function TabBar({ tab, onChange, badges = {} }: Props) {
  return (
    <nav style={styles.tabBar} aria-label="メニュー">
      <div style={styles.tabBarInner}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = id === tab;
          const n = badges[id] ?? 0;
          return (
            <button key={id} style={{ ...styles.tabBtn, color: active ? "var(--mint)" : "var(--dim)" }} aria-current={active ? "page" : undefined} onClick={() => onChange(id)}>
              <Icon size={22} aria-hidden="true" strokeWidth={active ? 2.4 : 1.8} />
              <span>{label}</span>
              {n > 0 && (
                <span style={styles.tabBadge} aria-label={`${n}件`}>
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
