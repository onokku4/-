/** ブラウザ通知（Notification API）の薄いラッパー。未対応・拒否の判断をここに集める */

export type PermissionResult = "granted" | "denied" | "unsupported";

const supported = (): boolean => typeof Notification !== "undefined";

export const canNotifyNatively = (): boolean => supported() && Notification.permission === "granted";

export async function requestNotifyPermission(): Promise<PermissionResult> {
  if (!supported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    return (await Notification.requestPermission()) === "granted" ? "granted" : "denied";
  } catch {
    return "denied";
  }
}

/** 送れたら true。コンストラクタが例外を投げる環境（一部のモバイル）では false */
export function showNativeNotification(title: string, body: string): boolean {
  if (!canNotifyNatively()) return false;
  try {
    new Notification(title, { body });
    return true;
  } catch {
    return false;
  }
}
