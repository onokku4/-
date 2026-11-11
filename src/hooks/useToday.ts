import { useEffect, useState } from "react";
import { localDate } from "../lib/date";

/** ローカル日付。日をまたいだら1分以内に更新する */
export function useToday(): string {
  const [today, setToday] = useState(() => localDate());
  useEffect(() => {
    const id = setInterval(() => setToday(localDate()), 60_000);
    return () => clearInterval(id);
  }, []);
  return today;
}
