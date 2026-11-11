import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./App";
import "./global.css";

const root = document.getElementById("root");
if (!root) throw new Error("#root が見つかりません");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// オフライン対応・ホーム画面追加のための Service Worker。
// 新バージョンが配信されたら自動で入れ替わる（autoUpdate）。
registerSW({ immediate: true });
