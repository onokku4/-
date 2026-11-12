import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // 相対パスで出力し、サブディレクトリ配信（GitHub Pages 等）でも動くようにする
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "そだてる庭",
        short_name: "そだてる庭",
        description: "家庭菜園・果樹の管理アプリ。水やりアラート、土の栄養、受粉相性診断、収穫履歴。",
        lang: "ja",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "portrait",
        background_color: "#08090c",
        theme_color: "#08090c",
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            // 天気は常に最新を取りに行く。失敗時は state に残った前回値を使う
            urlPattern: /^https:\/\/api\.open-meteo\.com\//,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
  ],
  test: { environment: "jsdom", include: ["tests/**/*.test.{ts,tsx}"] },
});
