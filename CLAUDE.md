# そだてる庭 — 家庭菜園・果樹管理アプリ

鉢植え1個から小さな庭畑まで。一株を「プロジェクト」として管理し、水やりアラート・土の栄養・受粉相性・収穫履歴をゲーム感覚で記録する。

## コマンド

```
npm run dev        # 開発サーバー (http://localhost:5173)
npm test           # Vitest（1回実行）
npm run typecheck  # tsc --noEmit
npm run build      # 型チェック + 本番ビルド
```

変更後は必ず `npm run typecheck && npm test` を通す。

## 構成

```
public/                 PWA アイコン・manifest 素材（icon.svg が原本）
vite.config.ts          Vite + vite-plugin-pwa（manifest と Service Worker の設定）
src/types.ts            ドメイン型（Pollination は判別共用体）
src/data/               作物カタログ（データのみ、ロジックなし）
  vegetables.ts         定番野菜・ハーブ・イチゴ
  moreVegetables.ts     追加野菜（ズッキーニ、トウモロコシ等）
  fruits.ts             果樹・ベリー
  catalog.ts            上記を束ねる。findCrop / resolve / soilType / canGrowIn
  game.ts               レベル・バッジ・XP
src/lib/                純粋関数。React にも現在時刻にも依存しない
  garden.ts             apply(state, action) — 状態遷移はすべてここ
  pollination.ts        diagnose(target, others) — 受粉相性診断
  watering.ts           plantStatus — 水やり間隔・成長・収穫期・防寒
  weather.ts            天気区分・気温補正・位置情報からの自動取得
  soil.ts               NPK と連用回数
  storage.ts            localStorage 読み書き + normalize（旧形式・壊れた値の救済）
  date.ts               ローカル日付
src/hooks/useGarden.ts  状態保持と副作用（保存・トースト・バッジ）
src/components/         表示のみ。計算は lib を呼ぶ
tests/                  lib の単体テスト + 画面の統合テスト
legacy/garden.jsx       移行前の単一ファイル版（参照用。編集しない）
```

## 設計ルール

- **状態を変えるのは `apply()` だけ。** 新しい操作は `Action` に型を足し、`apply` の switch に分岐を足す。日付とIDは引数で渡す（テスト可能に保つ）。
- **ロジックを components に書かない。** 計算は `src/lib`、データは `src/data`。
- `any` 禁止。不正な状態は型で表現できないようにする。`switch` は網羅させる。
- 日付は `localDate()` を使う。`toISOString().slice(0,10)` はUTCなので日本の朝に前日になる。
- 保存形式を変えたら `storage.ts` の `normalize` と往復テストを更新する。

## 作物を足すとき

`src/data/*.ts` に `Crop` を追加するだけ。`tests/catalog.test.ts` が以下を検証する。

- ID の重複がない
- 相手が必要な品種（`cross` / `dioecious` / `selfHelped`）には、カタログ内に受粉相手がいる
- 提案された相手を植えれば診断が ◎ になる

受粉の `kind`:

| kind | 意味 | 例 |
|---|---|---|
| `none` | 受粉不要（葉・根） | レタス、ニンジン |
| `parthenocarpic` | 受粉なしで実る | イチジク、温州ミカン、キュウリ |
| `self` | 1株で実る | トマト、レモン |
| `selfHelped` | 1株でも実るが別品種で向上 | ハイブッシュ系ブルーベリー |
| `cross` | 同系統の別品種が必須 | ラビットアイ系ブルーベリー、オリーブ |
| `dioecious` | 雌木と雄木が必要 | キウイ |
| `monoecious` | 雌雄異花、人工授粉推奨 | ズッキーニ、カボチャ |
| `wind` | 風媒、同品種をまとめ植え | トウモロコシ |

相手になる条件は「別品種・同じ `group`・`bloom` が隣接以内」。

## プライバシー

位置情報は天気取得の瞬間だけ使う。座標は約1kmに丸めて Open-Meteo に送り、state にも localStorage にも保存しない。保存するのは天気と気温の結果だけ。

## 既知の制約・今後の候補

- 受粉診断は庭全体で判定しており、株どうしの距離は見ていない。
- 受粉特性と開花期は一般的な園芸指針による目安（地域・年で変わる）。
- PWA 対応済み（ホーム画面に追加・オフライン起動）。ただし水やり通知はアプリを開いている間だけ届く。常時通知にはプッシュ通知用のサーバーが別途必要。
- Service Worker は本番ビルド（`npm run build` → `npm run preview`）でのみ有効。`npm run dev` では動かない。
- 配信先は https か localhost が必須（Service Worker の制約）。`base: "./"` なのでサブディレクトリ配信でも動く。
- 候補: 連作障害の警告、収穫量の記録とグラフ、写真・メモ、データの書き出し/読み込み。
