/** crypto.randomUUID は非セキュアコンテキスト（http）では使えないのでフォールバックを持つ */
export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
