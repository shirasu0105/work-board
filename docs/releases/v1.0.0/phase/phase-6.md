# Phase 6: メモ管理（種別フォーマット切替）

## 目的

要件書 §10.8 メモ管理および §10.9 メモ種別別フォーマットを実装する。5 種類（議事録 / TTメモ / 思いつきメモ / 調査メモ / 作業ログ）の入力フォーマットを種別選択に応じて切り替え、タイトル＋カテゴリ＋種別を必須に保存できるようにする。一覧はタイムライン形式で時系列に並べる。

## 成果物

- `prisma/schema.prisma` ─ `Memo`（id, title, categoryId, kind enum, projectId nullable, body jsonb 相当の TEXT、createdAt, updatedAt）モデル追加。マイグレーション追加
- `lib/types/memo.ts` ─ `MemoKind` enum（`MEETING / TT / IDEA / RESEARCH / WORKLOG`）と各種別のフィールド定義
- `lib/db/memo.ts` ─ メモ CRUD のサーバー側関数
- `app/api/memos/route.ts` / `app/api/memos/[id]/route.ts` ─ 一覧/作成/取得/編集/削除 API
- `app/memos/page.tsx` ─ メモ一覧（タイムライン）
- `app/memos/new/page.tsx` ─ メモ新規作成画面（タブで種別切替）
- `app/memos/[id]/page.tsx` ─ メモ編集画面
- `components/memo/MemoKindTabs.tsx` ─ 上部タブで 5 種別切替
- `components/memo/MemoFormByKind.tsx` ─ 種別に応じてフィールドが切り替わるフォーム本体（議事録 / TT / 思いつき / 調査 / 作業ログ）
- `components/memo/MemoTimeline.tsx` ─ 日付付きタイムライン一覧

## 受入基準

- メモ作成画面の上部に 5 種別のタブ（議事録 / TTメモ / 思いつきメモ / 調査メモ / 作業ログ）が表示される
- 種別タブを切り替えると、下部の入力フィールド構成が以下の通りに切り替わる
  - 議事録: 日時 / 参加者 / 目的 / 議題 / 決定事項 / 宿題 / 自分のNext Action
  - TTメモ: 誰から / 背景 / 教えてもらった内容 / ファクト / 抽象化 / 転用
  - 思いつきメモ: 内容 / ファクト / 抽象化 / 転用 / タスク化候補 / Someday候補
  - 調査メモ: 調査テーマ / 調査内容 / 分かったこと / 結論 / 次に確認すること
  - 作業ログ: 作業内容 / 結果 / 詰まった点 / 対応内容 / 次にやること
- 共通入力としてタイトル・カテゴリ・関連プロジェクト（任意）が全種別で表示される
- 必須項目（タイトル・カテゴリ・種別）が揃わないと保存できない
- 保存に成功するとメモ一覧画面に戻り、追加したメモがタイムラインに表示される
- 既存メモを開くと作成時の種別フォーマットで編集画面が開き、内容が復元される
- メモは作成日時の降順でタイムライン表示され、各行に日付・タイトル・種別バッジ・カテゴリチップ・関連プロジェクト（あれば）が見える
- メモを削除でき、削除後一覧から消える
- すべて永続化される

## 検証シナリオ（Playwright）

1. **議事録メモの新規作成**
   - 前提: カテゴリ `テーマA` が存在、`/memos/new` を開く
   - 操作: 種別タブ「議事録」を選択 → タイトル `週次定例MTG` → カテゴリ `テーマA` → 日時 `2026-05-27 14:00-15:00` → 参加者 `Aさん, Bさん` → 決定事項に任意のテキスト → 保存
   - 期待: `/memos` に遷移し、タイムラインに `週次定例MTG`（議事録バッジ付き）が表示される
2. **種別切替によるフォーム変化**
   - 前提: `/memos/new` を開いた状態（初期種別: 議事録）
   - 操作: タブを「TTメモ」に切り替え
   - 期待: フォーム内のフィールドが「誰から / 背景 / 教えてもらった内容 / ファクト / 抽象化 / 転用」に切り替わり、「議題 / 決定事項 / 宿題」フィールドが消える
3. **必須バリデーション**
   - 前提: `/memos/new` を開く
   - 操作: タイトル空のまま種別を選んで保存を試みる
   - 期待: 保存ボタンが disabled もしくはエラーメッセージが表示される
4. **TTメモのファクト・抽象化・転用フィールド**
   - 前提: 種別「TTメモ」を選択した状態
   - 操作: タイトル `ヒアリングのコツ` → カテゴリ → ファクト・抽象化・転用にそれぞれテキスト → 保存
   - 期待: 一覧に表示後、編集画面を開くと 3 フィールドの内容が保存されている
5. **編集**
   - 前提: 任意のメモが 1 件存在
   - 操作: 一覧から該当メモを開く → タイトルを変更 → 保存
   - 期待: 一覧の表示が更新される
6. **削除**
   - 前提: メモ 1 件
   - 操作: 削除アクション
   - 期待: 一覧から消え、リロード後も復活しない
7. **タイムライン順序**
   - 前提: 異なる日付で 3 件のメモを作成（DB に作成日時を意図的に差を付ける手段がない場合は、間隔をあけて作成）
   - 期待: タイムラインで新しい順に上から表示される

## 閾値

- `npm run lint` / `npx tsc --noEmit` / `npm run build` 緑
- 上記 Playwright シナリオ 7 件すべて PASS
- メモ作成・一覧画面で `console.error` 0 件
- メモ種別 enum は 5 値に限定（型レベルで保証）
- メモ本文は種別変更時にデータロスが発生しないこと（または「種別を変えると未保存フィールドは失われます」の明示警告を出すこと。どちらでも可）

## 関連要件

- §10.8 メモ管理
- §10.9 メモ種別別フォーマット（5 種すべて）
- §13.1 メモの必須入力（タイトル・カテゴリ・メモ種別）
- §16.1 作業中フロー（メモ記録）

## デザイン参照

- `docs/design-references/reference/screens-3.jsx` の `MemosScreen` ─ タイムライン＋種別/カテゴリ集計サイドの構成
- `docs/design-references/reference/screens-3.jsx` の `MemoEditTabs` / `MemoBody` ─ 上部タブ＋種別ごとフィールド構成（採用方針）
- `docs/design-references/README.md` の「メモ種別フォーマットの実装メモ」表 ─ フィールド対応の一次整理
- `DESIGN.md` §4「Buttons」「Cards & Containers」 ─ タブ・フォームの装飾トークン

## 実装計画

要件書 §10.8 / §10.9 / §13.1 に基づき、メモ管理を以下の方針で実装する。

- **データモデル**: `prisma/schema.prisma` の `Memo` モデルは Phase 2 の init 時点で既に宣言済み（id / title / kind / body(TEXT) / projectId nullable / categoryId / createdAt / updatedAt ＋ kind・createdAt 等の index）。init マイグレーション（`20260529131146_init`）に `Memo` テーブル・index が含まれているため、本フェーズでのスキーマ変更・追加マイグレーションは不要（既存スキーマで受入基準を満たせる）。SQLite は enum を持たないため、種別 5 値は TS 側の `as const` ユニオンで型レベル保証する。
- **型**: `lib/types/memo.ts` に `MemoKind`（meeting/tt/idea/research/worklog）と種別別フィールド定義 `MEMO_FIELDS`、本文正規化 `normalizeBody`、DTO を定義。フィールド構成は README の「メモ種別フォーマットの実装メモ」表と受入基準に厳密一致。
- **本文の持ち方**: 種別ごとにフィールドが異なるため、body は「フィールド key → 値」のオブジェクトを JSON 文字列で `Memo.body` に格納。読み出し時は種別に対応する許可キーへ正規化（未知キー除去）。
- **CRUD / API**: `lib/db/memo.ts`（一覧 createdAt 降順 / 取得 / 作成 / 更新 / 削除）＋ `app/api/memos/route.ts`・`app/api/memos/[id]/route.ts`。既存タスク API の構造（バリデーション・エラーステータス分岐）を踏襲。
- **UI**: `MemoKindTabs`（上部 5 タブ）＋ `MemoFormByKind`（共通: タイトル・カテゴリ・関連プロジェクト ＋ 種別固有フィールド。必須 3 点が揃うまで保存 disabled。種別切替時もクライアント側で各種別の入力値を保持しデータロス防止）＋ `MemoTimeline`（createdAt 降順、日付・タイトル・種別バッジ・カテゴリチップ・関連 Pj・削除・編集導線）。
- **画面**: `/memos`（タイムライン）/ `/memos/new`（新規・タブ切替）/ `/memos/[id]`（編集・作成時種別で復元）。

## 作業ログ
- 2026-05-30 12:32 着手。既存スキーマ・タスク/カテゴリ実装パターン・design-references の screens-3.jsx を確認。
- 2026-05-30 12:32 `lib/types/memo.ts` / `lib/db/memo.ts` / `app/api/memos/route.ts` / `app/api/memos/[id]/route.ts` を新規作成。
- 2026-05-30 12:32 `components/memo/MemoKindTabs.tsx` / `MemoFormByKind.tsx` / `MemoTimeline.tsx` を新規作成。
- 2026-05-30 12:32 `app/memos/page.tsx`（タイムライン化）/ `app/memos/new/page.tsx`（フォーム化）/ `app/memos/[id]/page.tsx`（編集・新規）を実装。
- 2026-05-30 12:32 Memo モデル・マイグレーションは init 時点で既存と確認 → スキーマ変更不要。

## 自己評価（回 1、2026-05-30 12:32）

### コマンド結果
| コマンド | 結果 | 備考 |
|---|---|---|
| npm run lint | ✅ | 警告・エラーなし（出力なし） |
| npm run type-check | ✅ | `tsc --noEmit` エラーなし |
| npm run build | ✅ | `next build` 成功。`/memos` `/memos/[id]` `/memos/new` `/api/memos` `/api/memos/[id]` を含む 13 ルート生成 |

### 受入基準セルフチェック

| # | 受入基準 | 自己判定 | 根拠 |
|---|---|---|---|
| 1 | メモ作成画面の上部に 5 種別のタブが表示される | ✅ | `MemoKindTabs`（`MEMO_KIND_ORDER` の 5 値をボタン化、`role="tablist"`）を `MemoFormByKind` 上部に配置 |
| 2 | 種別タブ切替で入力フィールド構成が 5 種別それぞれ規定どおり切り替わる | ✅ | `lib/types/memo.ts` の `MEMO_FIELDS` が議事録/TT/思いつき/調査/作業ログのフィールドを受入基準どおり定義。`MemoFormByKind` が `MEMO_FIELDS[kind]` を描画 |
| 3 | 共通入力（タイトル・カテゴリ・関連プロジェクト）が全種別で表示 | ✅ | `MemoFormByKind` の共通セクション（種別非依存）に 3 項目を配置。プロジェクトは任意 |
| 4 | 必須（タイトル・カテゴリ・種別）が揃わないと保存できない | ✅ | `canSubmit = trimmedTitle.length>0 && categoryId!=="" && !busy`、種別は常に選択状態。保存ボタン `disabled={!canSubmit}`。API/DB 層でも必須検証 |
| 5 | 保存成功で一覧に戻り、追加メモがタイムラインに表示 | ✅ | 保存後 `router.push("/memos")`＋`router.refresh()`。一覧は `dynamic="force-dynamic"` で再取得 |
| 6 | 既存メモを開くと作成時種別で編集画面が開き内容復元 | ✅ | `/memos/[id]` が `getMemo` で `initial` を渡し、`MemoFormByKind` が `initial.kind` を初期種別、`initial.body` を初期値に展開 |
| 7 | createdAt 降順タイムライン。各行に日付・タイトル・種別バッジ・カテゴリチップ・関連 Pj | ✅ | `listMemos` が `orderBy createdAt desc`。`MemoTimeline` 各行に日付/種別 Badge/タイトル/カテゴリ Chip/プロジェクト Chip（あれば） |
| 8 | メモを削除でき、削除後一覧から消える | ✅ | `MemoTimeline` の削除（confirm → DELETE → refresh）。`deleteMemo` で永続削除 |
| 9 | すべて永続化される | ✅ | `prisma.memo` で SQLite 永続化。body は JSON 文字列で保存 |

閾値の追加項目:
- メモ種別 enum は 5 値に型レベル限定 ✅（`MEMO_KINDS as const` ＋ `MemoKind` ユニオン ＋ `isMemoKind` ガード）
- 種別変更時のデータロス対策 ✅（`MemoFormByKind` は `values` を `${kind}.${fieldKey}` でキー保持し、種別を戻すと入力が復元される。保存 body は選択中種別のフィールドのみ）

### 変更ファイル
- `lib/types/memo.ts`（新規）: MemoKind / フィールド定義 / 正規化 / DTO
- `lib/db/memo.ts`（新規）: メモ CRUD サーバー関数
- `app/api/memos/route.ts`（新規）: 一覧 GET / 作成 POST
- `app/api/memos/[id]/route.ts`（新規）: 取得 GET / 更新 PATCH / 削除 DELETE
- `components/memo/MemoKindTabs.tsx`（新規）: 5 種別タブ
- `components/memo/MemoFormByKind.tsx`（新規）: 種別切替フォーム本体
- `components/memo/MemoTimeline.tsx`（新規）: タイムライン一覧＋絞り込み＋削除
- `app/memos/page.tsx`（改修）: プレースホルダ → タイムライン
- `app/memos/new/page.tsx`（改修）: プレースホルダ → 新規フォーム
- `app/memos/[id]/page.tsx`（新規）: 編集画面

### スキーマ／マイグレーション
- `prisma/schema.prisma` の `Memo` モデルは Phase 2 init 時点で宣言済み、`prisma/migrations/20260529131146_init/migration.sql` に `Memo` テーブル・index 含む。本フェーズでスキーマ変更・追加マイグレーションは不要と判断（成果物欄の「モデル追加・マイグレーション追加」は init で充足済み）。

### 引き継ぎメモ（Verifier 向け）
- dev 起動前に DB が空の場合、メモ作成にはカテゴリが 1 件必要。`/settings` でカテゴリ（例: `テーマA`）を先に作成すること。プロジェクトは任意。
- 種別切替の検証（シナリオ2）: タブ「TTメモ」選択で `data-testid="memo-form-fields"` の `data-kind="tt"` になり、フィールドが「誰から/背景/教えてもらった内容/ファクト/抽象化/転用」に変わる。議事録固有（議題/決定事項/宿題 = `memo-field-agenda` 等）は DOM から消える。
- 各フィールドは `data-testid="memo-field-<key>"`（例: 決定事項=`memo-field-decisions`、ファクト=`memo-field-fact`、抽象化=`memo-field-abstraction`、転用=`memo-field-transfer`）。
- タイムライン各行は `data-testid="memo-row"`、種別バッジ `memo-kind-badge`、タイトルリンク `memo-title`、削除 `memo-delete`、編集リンク `memo-edit-link`、新規導線 `memo-new-link`。
- 必須バリデーション（シナリオ3）: タイトル空 or カテゴリ未選択で保存ボタン `memo-form-submit` が `disabled`（`aria-disabled` も付与）。
- タイムライン順序（シナリオ7）: createdAt 降順。同一秒内の連続作成では作成順の逆転が見えにくいため、各作成の間に数秒空けること推奨。

## 検証結果（回 1、2026-05-30 12:45）

### dev 起動
- 結果: OK
- ポート: 3000
- 起動時間: 約 5 秒（既存プロセス PID 13728 が listen 済みを確認）

### シナリオ別結果

#### 当該フェーズのシナリオ
| # | シナリオ | 結果 | 観測値 / 失敗理由 |
|---|---|---|---|
| 1 | 議事録メモの新規作成 | OK | `/memos` に遷移し「週次定例MTG」が議事録バッジ付きでタイムラインに表示 |
| 2 | 種別切替によるフォーム変化 | OK | TTメモ選択で data-kind="tt" になり 6 フィールドに切替。議題/決定事項/宿題が DOM から消えた |
| 3 | 必須バリデーション | OK | タイトル空の状態で memo-form-submit が disabled=true かつ aria-disabled="true" |
| 4 | TTメモのファクト・抽象化・転用フィールド | OK | 保存後、編集画面で data-kind="tt" が復元され 3 フィールド（質問は5W1H / 構造化により / 次回の1on1）が正しく表示 |
| 5 | 編集 | OK | タイトルを「ヒアリングのコツ（編集済）」に変更→保存後、一覧に更新済みタイトルが反映 |
| 6 | 削除 | OK | confirm ダイアログ承認→削除後 1 件に減少。リロード後も復活なし |
| 7 | タイムライン順序 | OK | 作業ログ（最新）→思いつきメモ→週次定例MTG（最古）の降順で表示。3 件の作成間に 3 秒以上の間隔あり |

### 閾値判定
- 必須シナリオ全合格（7/7）: OK
- console.error 0 件: OK（all=true で取得し Errors: 0）
- lint/type/build 緑（Implementer 自己評価より）: OK
- MemoKind enum 5 値に型レベル限定: OK（`MEMO_KINDS as const` + `MemoKind` ユニオン + `isMemoKind` ガード）
- 種別変更時データロス対策: OK（種別を切り替えて戻すと入力内容が復元される。`values` を `${kind}.${fieldKey}` キーで保持）

### 総合判定: OK

### Implementer への修正依頼（NG のみ）
なし
