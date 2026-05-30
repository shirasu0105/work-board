# Phase 3: タスク管理（リスト CRUD＋ステータス）

## 目的

要件書 §10.5 のタスク管理機能をリスト表示中心で完成させる。ユーザーがタスクの追加・編集・ステータス変更・完了・削除を行え、カテゴリで分類した状態で永続化する。かんばん表示と待ち状態の詳細フィールドは Phase 5 で扱う。

## 成果物

- `prisma/schema.prisma` ─ `Task` モデル（status, dueDate, categoryId, projectId nullable, completedAt, displayOrder 等）を確定。マイグレーション追加
- `lib/db/task.ts` ─ タスク CRUD のサーバー側関数
- `app/api/tasks/route.ts` ─ `GET`（一覧、絞り込みクエリ対応）/ `POST`（新規作成）
- `app/api/tasks/[id]/route.ts` ─ `GET` / `PATCH`（編集・ステータス変更）/ `DELETE`
- `app/tasks/page.tsx` ─ タスク一覧（リスト表示）
- `components/task/TaskList.tsx` ─ チェックボックス＋タイトル＋ステータス＋カテゴリ＋プロジェクト＋期限の行表示
- `components/task/TaskFormDialog.tsx` ─ 新規/編集兼用フォーム（タスク名・カテゴリ・期限・メモ。プロジェクト欄は Phase 4 で活性化）
- `components/task/StatusBadge.tsx` ─ 「未着手 / 対応中 / 待ち / 保留 / 完了」のバッジ表示
- `lib/types/task.ts` ─ タスク関連型と Status enum

## 受入基準

- タスク一覧画面で「＋ タスク追加」を押すとフォームが開き、タスク名とカテゴリを指定して保存できる
- タスク名・カテゴリのいずれかが未入力だと保存ボタンが押せない
- 一覧の各行で現在のステータスがバッジで視覚的に確認できる（未着手 / 対応中 / 保留 / 完了）
- 一覧の各行でステータスを変更でき（プルダウンまたはバッジクリック等）、変更が永続化される
- チェックボックス操作でタスクを完了状態にできる。完了タスクは取り消し線等で他と区別される
- タスクを編集（タイトル・カテゴリ・期限・メモ）でき、保存が永続化される
- タスクを削除でき、削除後リロードしても復活しない
- カテゴリでタスク一覧を絞り込める（最低限のフィルタ）
- 完了タスクの表示/非表示をトグルで切り替えられる
- 期限が設定されているタスクは行に期限日が表示される

## 検証シナリオ（Playwright）

1. **タスク新規追加**
   - 前提: Phase 2 で `テーマA` カテゴリを 1 件作成済み、`/tasks` を開く
   - 操作: 「＋ タスク追加」 → タスク名 `ヒアリング項目をまとめる` → カテゴリ `テーマA` → 保存
   - 期待: 一覧に `ヒアリング項目をまとめる` 行が追加され、ステータスバッジが「未着手」になっている
2. **ステータス変更**
   - 前提: シナリオ 1 のタスクが存在
   - 操作: 該当行のステータスを「対応中」に変更
   - 期待: 行のステータスバッジが「対応中」表示に変わり、リロード後も維持される
3. **完了操作と取り消し線**
   - 前提: シナリオ 1 のタスクが存在（未着手状態）
   - 操作: 行のチェックボックスをクリック
   - 期待: ステータスバッジが「完了」になり、タイトルに取り消し線が引かれる
4. **カテゴリでの絞り込み**
   - 前提: `テーマA` のタスク 2 件、`テーマB` のタスク 1 件を作成済み
   - 操作: 絞り込みで `テーマA` を選択
   - 期待: 表示行が `テーマA` のタスク 2 件のみになり、件数表示も 2 件を示す
5. **編集**
   - 前提: タスクが 1 件存在
   - 操作: 該当タスクの編集を開く → タスク名を `〇〇さんへのヒアリング項目をまとめる` に変更 → 保存
   - 期待: 一覧の表示テキストが新タイトルに変わる
6. **削除**
   - 前提: タスクが 1 件存在
   - 操作: 該当タスクの削除アクションを実行（確認ダイアログがある場合は OK）
   - 期待: 一覧から消え、リロード後も再表示されない
7. **必須バリデーション**
   - 前提: 追加フォームを開いた状態
   - 操作: タスク名空のまま保存を試みる
   - 期待: 保存ボタンが disabled、または明示的なバリデーションエラーが表示される

## 閾値

- `npm run lint` / `npx tsc --noEmit` / `npm run build` 緑
- 上記 Playwright シナリオ 7 件すべて PASS
- タスク一覧画面で `console.error` 0 件
- `/api/tasks` 系 API が想定 HTTP ステータスを返す（200/201/204 系、4xx でバリデーションエラー）
- Status enum の値が「未着手 / 対応中 / 待ち / 保留 / 完了」の 5 つに限定される（型レベルで保証）

## 関連要件

- §10.5 タスク管理
- §10.5.4 タスクステータス（5 種）
- §13.1 タスクの必須入力（タスク名・カテゴリ）
- §13.2 自動管理項目
- §16.1 作業中フロー（タスク追加・完了）

## デザイン参照

- `docs/design-references/reference/screens-2.jsx` の `TasksListScreen` ─ リスト表示の構成・列幅・チェックボックス位置
- `docs/design-references/reference/sketch-prims.jsx` の `StatusChip` ─ ステータスバッジの色分けイメージ
- `DESIGN.md` §4「Pill Badge Button」 ─ ステータスバッジの装飾トークン

## 実装計画（回 1）

受入基準（タスク名・カテゴリ必須での追加、ステータスバッジ表示、ステータス変更、完了チェック＋取り消し線、編集、削除、カテゴリ絞り込み、完了表示トグル、期限表示）を満たすため、以下の順で実装する。

1. `lib/types/task.ts`: `TASK_STATUSES`（todo/doing/waiting/paused/done）を `as const` で定義し、`TaskStatus` ユニオン型・日本語ラベル・型ガード `isTaskStatus` で 5 値を型レベル保証（閾値）。`TaskDTO`（日時 ISO 化、カテゴリ/プロジェクト名同梱）。
2. `lib/db/task.ts`: 既存 `category.ts` のパターンに倣い CRUD を実装。`createTask` は status=todo・displayOrder 末尾・カテゴリ存在チェック。`updateTask` は status→done で `completedAt` 打刻、done→他で null クリア。`listTasks` はカテゴリ・完了除外フィルタ＋未完了→完了の順ソート。
3. API: `app/api/tasks/route.ts`（GET 一覧・絞り込みクエリ / POST 201）、`app/api/tasks/[id]/route.ts`（GET / PATCH 200 / DELETE 204）。category API と同じバリデーション・HTTP ステータス方針。
4. UI: `StatusBadge`（5 種色分けピル）、`TaskFormDialog`（CategoryFormDialog 流用。タスク名・カテゴリ必須で保存 disabled、期限 date、メモ。プロジェクト欄は Phase 4 まで非表示）、`TaskList`（チェックボックス＋タイトル＋カテゴリ/プロジェクト/期限＋バッジ＋ステータス select＋編集/削除）、`TaskManager`（状態コンテナ。category 管理の再フェッチ方式を踏襲）。
5. `app/tasks/page.tsx`: SSR で `listTasks` ＋有効カテゴリを取得し `TaskManager` へ。`force-dynamic`。

Phase 2 の Prisma スキーマ（Task モデルは init マイグレーションに既存）・カテゴリ管理・UI コンポーネントには手を加えず流用する。スキーマ変更が不要だったため新規マイグレーションは追加していない。

## 作業ログ
- 2026-05-30 着手。既存 Phase 1/2 実装（schema.prisma / lib/db/category.ts / categories API / UI 群 / DESIGN.md）を読み、規約とパターンを把握。
- 2026-05-30 lib/types・lib/db・API・コンポーネント・page を実装。
- 2026-05-30 `db:generate` 後に lint / type-check / build を実行し全緑を確認。

## 自己評価（回 1、2026-05-30）

### コマンド結果
| コマンド | 結果 | 備考 |
|---|---|---|
| npm run lint | ✅ | エラー・警告なし |
| npm run type-check | ✅ | `tsc --noEmit` エラーなし |
| npm run build | ✅ | `/api/tasks`・`/api/tasks/[id]`・`/tasks` を含め全 13 ルート生成成功 |

### 受入基準セルフチェック

| # | 受入基準 | 自己判定 | 根拠 |
|---|---|---|---|
| 1 | 「＋ タスク追加」でフォームが開き、タスク名＋カテゴリ指定で保存できる | ✅ | `TaskManager.openAdd`→`TaskFormDialog`→`POST /api/tasks`（201）。`add-task-button` / `task-form-submit` |
| 2 | タスク名・カテゴリ未入力だと保存ボタンが押せない | ✅ | `TaskFormDialog.canSubmit = trimmedTitle>0 && category!=="" && !busy`。submit ボタン `disabled` |
| 3 | 各行で現在ステータスがバッジで視覚確認できる | ✅ | `StatusBadge`（5 種色分け、`task-status-badge`/`data-status`）を各行に表示 |
| 4 | 各行でステータスを変更でき永続化される | ✅ | `task-status-select`→`PATCH {status}`→再フェッチ。SQLite 永続。 |
| 5 | チェックボックスで完了にでき、完了は取り消し線で区別 | ✅ | `task-complete-checkbox`→status=done。完了行は `line-through text-ink-3`（`TaskList`） |
| 6 | タスクを編集（タイトル・カテゴリ・期限・メモ）でき永続化 | ✅ | `task-edit-button`→編集フォーム→`PATCH`。`editingInitial` で既存値プリセット |
| 7 | タスクを削除でき、リロード後も復活しない | ✅ | `task-delete-button`→`window.confirm`→`DELETE`（204）→再フェッチ。DB から物理削除 |
| 8 | カテゴリでタスク一覧を絞り込める | ✅ | `task-filter-category`→`GET /api/tasks?categoryId=...`。`listTasks` の where 絞り込み |
| 9 | 完了タスクの表示/非表示をトグル切替 | ✅ | `task-filter-showdone`→`includeDone=false` クエリ→`listTasks` で `status not done` 除外 |
| 10 | 期限設定タスクは行に期限日表示 | ✅ | `dueDate` あれば `期限 YYYY/MM/DD`（`task-due`） |

閾値補足:
- Status enum 5 値（未着手/対応中/待ち/保留/完了）を `TASK_STATUSES as const` ＋ `TaskStatus` ユニオン ＋ `isTaskStatus` 型ガードで型レベル保証。
- `/api/tasks` 系は 200（GET/PATCH）/ 201（POST）/ 204（DELETE）/ 400（バリデーション）/ 404（不存在）を返す。

### 変更ファイル
- `lib/types/task.ts`（新規）: TaskStatus enum 相当・ラベル・型ガード・TaskDTO
- `lib/db/task.ts`（新規）: タスク CRUD（list/get/create/update/delete、完了日時の打刻ロジック）
- `app/api/tasks/route.ts`（新規）: GET 一覧（カテゴリ/完了フィルタ）・POST
- `app/api/tasks/[id]/route.ts`（新規）: GET / PATCH / DELETE
- `components/task/StatusBadge.tsx`（新規）: 5 種色分けステータスバッジ
- `components/task/TaskFormDialog.tsx`（新規）: 新規/編集兼用フォーム
- `components/task/TaskList.tsx`（新規）: タスク行リスト表示
- `components/task/TaskManager.tsx`（新規）: 状態管理コンテナ
- `app/tasks/page.tsx`（更新）: プレースホルダ → TaskManager の SSR ページ

Phase 1/2 の既存ファイル（schema.prisma、lib/db/category.ts、categories API、共通 UI、レイアウト）は未変更。Task モデルは init マイグレーションに既存のためマイグレーション追加なし。

### 引き継ぎメモ
- 検証前提: Phase 2 の `/settings` で `テーマA`・`テーマB` 等の有効カテゴリを作成しておくこと（カテゴリが 0 件だとフォームの select が「カテゴリがありません」になり保存不可）。
- 完了操作は「未着手↔完了」のトグル。チェックを外すと status=todo に戻り `completedAt` は null クリアされる。
- 削除は `window.confirm` を経由するため、Playwright では dialog を accept する必要あり。
- 一覧の並びは「未完了→完了」の順（完了タスクは下に寄る）。絞り込み・完了トグルはサーバ再フェッチ方式（楽観更新なし）。
- `task-status-select` は `data-testid` で各行に存在。バッジクリックではなく select 変更でステータス変更する設計。

## 検証結果（回 1、2026-05-30 00:20）

### dev 起動
- 結果: ✅
- ポート: 3000
- 起動時間: 約 8 秒（Ready in 528ms）

### シナリオ別結果

#### 当該フェーズのシナリオ
| # | シナリオ | 結果 | 観測値 / 失敗理由 |
|---|---|---|---|
| 1 | タスク新規追加 | ✅ | 「ヒアリング項目をまとめる」が一覧に追加され、ステータスバッジ「未着手」表示を確認 |
| 2 | ステータス変更 | ✅ | select で「対応中」に変更後、リロード後も「対応中」が維持される（永続化確認）|
| 3 | 完了操作と取り消し線 | ✅ | チェックボックス checked=true でステータスバッジが「完了」になり、`line-through text-ink-3` クラスにより取り消し線を確認 |
| 4 | カテゴリでの絞り込み | ✅ | テーマA選択後2件のみ表示（テーマB の「資料を整理する」が非表示）、件数「2 件」表示 |
| 5 | 編集 | ✅ | 「〇〇さんへのヒアリング項目をまとめる」に更新後、一覧のタイトルが新名称に変更 |
| 6 | 削除 | ✅ | window.confirm で OK → 一覧から消え、リロード後も復活しない（永続削除確認）|
| 7 | 必須バリデーション | ✅ | タスク名空・カテゴリ選択済み状態で「追加する」ボタンが disabled |

### 閾値判定
- 必須シナリオ全合格（7/7）: ✅
- lint/type/build 緑（Implementer 自己評価より）: ✅
- タスク一覧画面で console.error 0 件: ✅（確認済み: エラー 0 件）
- `/api/tasks` GET が 200 + JSON 配列を返す: ✅（確認済み）
- Status enum 5 値（todo/doing/waiting/paused/done）が `as const` + ユニオン型 + 型ガードで型レベル保証: ✅（`lib/types/task.ts` で確認）

### 総合判定: ✅ OK
