# そだてる庭

家庭菜園・果樹の管理アプリ。水やりアラート、土の栄養、受粉相性診断、収穫履歴。

```
npm install
npm run dev     # http://localhost:5173
npm test
npm run build && npm run preview   # PWA（オフライン・インストール）の確認は本番ビルドで
```

`main` に push すると GitHub Actions が GitHub Pages へ自動デプロイする。`dist/` を https で配信すれば、スマホの「ホーム画面に追加」でアプリとして使える。

開発の進め方と設計ルールは [CLAUDE.md](./CLAUDE.md) を参照。
