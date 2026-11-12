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
  soils.ts              市販の培養土カタログ（初期栄養・元肥の持続日数・酸性）
  fertilizers.ts        追肥の種類（戻る栄養・持続日数）
src/lib/                純粋関数。React にも現在時刻にも依存しない
  garden.ts             apply(state, action) — 状態遷移はすべてここ
  pollination.ts        diagnose(target, others) — 受粉相性診断
  watering.ts           plantStatus — 水やり間隔・成長・収穫期・防寒
  weather.ts            天気区分・気温補正・位置情報からの自動取得（過去92日＋予報16日の日別も取得）
  soil.ts               NPK と連用回数。nutrientsOn（日数経過での減り）、fed（追肥）、feedSchedule（次の追肥日）
  storage.ts            localStorage 読み書き + normalize（旧形式・壊れた値の救済）
  calendar.ts           月のマス目と、日ごとの天気・世話・水やり予定・写真
  photos.ts             成長記録（植え付けから何日目）の計算と並べ替え
  backup.ts             バックアップ形式（封筒・検証・ファイル名）
  temperature.ts        作物ごとの適温と、今日／過去の日の暑すぎ・寒すぎ判定
  date.ts               ローカル日付
src/hooks/useGarden.ts  状態保持と副作用（保存・トースト・バッジ）
src/ui/photoStore.ts    写真本体の IndexedDB 保存と端末内縮小（長辺1280px JPEG）
src/ui/backupFile.ts    zip の作成・読み込み（fflate）。共有シート or ダウンロード
src/components/         表示のみ。計算は lib を呼ぶ
  TabBar / App          下部メニュータブ（ホーム・場所・カレンダー・設定）
  BedsView              場所の一覧 → 詳細（作物／状態／写真の下位タブ）
  CalendarView          写真がある日はマスが写真（Instagram アーカイブ風）
  PhotoViewer           全画面・横スワイプ（scroll-snap）でページ送り
  SettingsView          天気の位置・通知・バックアップ・履歴・バッジ
  DayModal              カレンダーの日を押したときの「その日のデータ」（株ごとの何日目・気温・水やり・写真）
  WeatherPanel          iPhone のウィジェット風の天気（大きな気温・天気ごとの空色）と調整・位置登録
tests/                  lib の単体テスト + 画面の統合テスト
legacy/garden.jsx       移行前の単一ファイル版（参照用。編集しない）
```

## 見た目

- 画面構造（下部タブ・パネル・下位タブ・アイブロウ）は CREW OS 準拠。色味は「そだてる庭」本来の生成り×緑×琥珀。
- 配色・字体は `src/global.css` の CSS 変数で定義（地 `--ground`、パネル `--panel`、罫線 `--line`、アクセント `--mint`（緑・主ボタン）/ `--amber` / `--sky` / `--flame`（警告））。色を直書きしない。
- 見出しは `--display`（Yuji Syuku）、本文は `--body`（Zen Maru Gothic）、ラベル・数値は `--mono`。
- ホームは「今日やること」と手を入れる株だけ。全部の株は「場所」→ 作物タブ。

## 設計ルール

- **状態を変えるのは `apply()` だけ。** 新しい操作は `Action` に型を足し、`apply` の switch に分岐を足す。日付とIDは引数で渡す（テスト可能に保つ）。
- **ロジックを components に書かない。** 計算は `src/lib`、データは `src/data`。
- `any` 禁止。不正な状態は型で表現できないようにする。`switch` は網羅させる。
- 日付は `localDate()` を使う。`toISOString().slice(0,10)` はUTCなので日本の朝に前日になる。
- 保存形式を変えたら `storage.ts` の `normalize` と往復テストを更新する。
- 土の栄養（n/p/k）は「記録日 `nutrientsAt` 時点の値」。今日の値は `nutrientsOn()` で導出し、保存値を変える操作（収穫・追肥）の前に経過ぶんを反映する。
- 天気は `weatherLog`（日付→天気）に溜める。自動取得は手入力の日を上書きしない。十分な雨（地植え5mm・鉢10mm）は水やり扱い（`lastWaterOrRain`）。
- 写真は本体を IndexedDB（`ui/photoStore.ts`）、メタ情報（場所・日付・何日目・メモ）を `photos` に分けて持つ。`stages` は撮影時点のスナップショットで、株を片付けても残す。
- 適温は `crop.tempRange`、なければ `TEMP_BY_CATEGORY`。落葉果樹・ベリーの寒さは休眠として扱い、`coldTenderBelowC` がある作物だけ寒さを出す。
- 実績は固定の `BADGES` ＋ 作物ごとの `crop:<id>`（初収穫）/ `crop10:<id>`（10回収穫）。`award()` が収穫履歴から数える。
- 名前・植え付け日・場所は `editPlant` / `renameBed` で後から直せる。
- アプリは土の成分を**測れない**。`soils.ts` の値は一般的な目安で、袋の表示が優先。

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

- 座標は常に約1km（小数2桁）に丸めてから Open-Meteo に送る。
- 「庭の位置を登録」した場合だけ、その丸めた座標を `location` として端末の localStorage に保存する（毎日の自動取得と、植え付け以降の過去天気の取り込みに使う）。「解除」で消える。
- 登録しない場合は従来どおり、位置情報は取得の瞬間だけ使い保存しない。

## 既知の制約・今後の候補

- 受粉診断は庭全体で判定しており、株どうしの距離は見ていない。
- 受粉特性と開花期は一般的な園芸指針による目安（地域・年で変わる）。
- PWA 対応済み（ホーム画面に追加・オフライン起動）。ただし水やり通知はアプリを開いている間だけ届く。常時通知にはプッシュ通知用のサーバーが別途必要。
- Service Worker は本番ビルド（`npm run build` → `npm run preview`）でのみ有効。`npm run dev` では動かない。
- 配信先は https か localhost が必須（Service Worker の制約）。`base: "./"` なのでサブディレクトリ配信でも動く。
- 天気の記録：通常取得は過去92日＋予報16日。庭の位置を登録していれば、植え付け日（収穫済みの株も含む）以降の欠けを archive API で埋める（`backfillRange`）。
- 土の種類・肥料の持続日数は一般的な目安。製品ごとの差は反映していない。
- 写真はこの端末の IndexedDB にだけある。別端末では「画像なし」になり、ブラウザのサイトデータ削除で消える。バックアップ zip（backup.json + photos/*.jpg）で持ち出せる。復元は丸ごと置き換え（マージしない）。
- バックアップ形式を変えるときは `BACKUP_VERSION` を上げ、`parseBackup` で旧版を読めるようにする。
- 候補: 連作障害の警告、収穫量の記録とグラフ、iCloud/Drive への自動バックアップ。
