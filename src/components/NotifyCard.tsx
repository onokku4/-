import { Bell, BellOff, Clock } from "lucide-react";
import type { Action } from "../lib/garden";
import { requestNotifyPermission } from "../ui/notify";
import { styles } from "../styles";

interface Props {
  notifyOn: boolean;
  notifyTime: string;
  dispatch: (a: Action) => void;
  say: (m: string) => void;
}

export function NotifyCard({ notifyOn, notifyTime, dispatch, say }: Props) {
  const turnOn = async () => {
    const result = await requestNotifyPermission();
    dispatch({ type: "setNotify", on: true });
    if (result === "granted") say("🔔 水やり通知をオンにしました");
    else if (result === "denied") say("🔔 通知が許可されていないため、アプリを開いている間はトーストでお知らせします");
    else say("🔔 この端末は通知に未対応のため、アプリを開いている間はトーストでお知らせします");
  };

  return (
    <section style={styles.notifyCard} aria-label="水やり通知の設定">
      <div style={styles.notifyLeft}>
        {notifyOn ? (
          <Bell size={20} color="var(--amber)" aria-hidden="true" />
        ) : (
          <BellOff size={20} color="var(--muted)" aria-hidden="true" />
        )}
        <div>
          <div style={styles.notifyTitle}>水やり通知</div>
          <div style={styles.notifySub}>{notifyOn ? `毎日 ${notifyTime} に必要な株をお知らせ` : "オフ"}</div>
        </div>
      </div>
      <div style={styles.notifyRight}>
        <div style={styles.timeWrap}>
          <Clock size={14} color="var(--muted)" aria-hidden="true" />
          <input
            type="time"
            aria-label="通知時刻"
            value={notifyTime}
            onChange={(e) => dispatch({ type: "setNotifyTime", time: e.target.value })}
            style={styles.timeInput}
          />
        </div>
        <button
          onClick={() => (notifyOn ? dispatch({ type: "setNotify", on: false }) : void turnOn())}
          style={{ ...styles.notifyToggleBtn, background: notifyOn ? "var(--amber)" : "var(--mint)" }}
        >
          {notifyOn ? "オフにする" : "オンにする"}
        </button>
      </div>
    </section>
  );
}
