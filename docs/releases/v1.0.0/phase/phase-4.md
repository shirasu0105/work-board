# Phase 4: Inbox とプロジェクト管理

## 目的

要件書 §10.2 Inbox と §10.4 プロジェクト管理を構築する。Inbox は「思いついたことを素早く入れて後で振り分ける一時置き場」、プロジェクトは「複数タスクを束ねる管理単位」として完成させる。Phase 3 で停留させていたタスクのプロジェクト紐付けもこのフェーズで活性化する。

## 成果物

- `prisma/schema.prisma` ─ `InboxItem`（content, status, createdAt, updatedAt）、`Project`（name, categoryId, goal nullable, dueDate nullable, purpose nullable, status, displayOrder）、および `Task.projectId` を nullable で活性化。マイグレーション追加
- `lib/db/inbox.ts` / `lib/db/project.ts` ─ サーバー側関数
- `app/api/inbox/route.ts` / `app/api/inbox/[id]/route.ts` / `app/api/inbox/[id]/convert/route.ts` ─ Inbox の作成・編集・削除・振り分け
- `app/api/projects/route.ts` / `app/api/projects/[id]/route.ts` ─ プロジェクト CRUD
- `app/inbox/page.tsx` ─ 上部クイック追加バー＋一覧＋振り分けボタン
- `app/projects/page.tsx` ─ プロジェクトカードグリッド（カテゴリチップ、完了条件、進捗、期限、編集導線）
- `components/inbox/QuickAddBar.tsx` / `components/inbox/InboxList.tsx`
- `components/project/ProjectCard.tsx` / `components/project/ProjectFormDialog.tsx`
- Phase 3 の `TaskFormDialog.tsx` の「プロジェクト」欄を活性化（任意選択）

## 受入基準

- Inbox 画面の上部に常設のクイック追加バー（入力欄＋追加ボタン）が表示される
- Inbox に「内容」のみで項目を追加できる。Enter キーまたは追加ボタンで追加可能
- Inbox 一覧で各項目に「タスク化」「プロジェクト化」「Someday 化」「削除」のアクションが並ぶ
- 「タスク化」を押すとタスク作成フォームが Inbox 内容入りで開き、保存するとタスクが新規追加され Inbox 項目が一覧から消える
- 「プロジェクト化」も同様に、内容入りでプロジェクト作成フォームが開き、保存後 Inbox から消える
- 「Someday 化」を押すと Inbox 項目が Someday に移動（または status 変更）し、一覧から消える
- 「削除」を押すと Inbox 項目が削除される
- プロジェクト画面で「＋ プロジェクト」から新規追加できる（必須: プロジェクト名・カテゴリ、任意: 完了条件・期限・目的）
- プロジェクトカードに「進捗 done/total タスク」と進捗バー（パーセンテージ）が表示される
- プロジェクトカードに紐づくタスクへの導線が存在し、押下するとそのプロジェクトに紐づくタスクのみが絞り込まれた状態でタスク一覧が表示される
- タスク作成・編集フォームで「プロジェクト」を任意選択でき、未選択（プロジェクト無し）も保存可能
- プロジェクトのステータス（進行中 / 未着手 / 保留 / 完了）を切替できる
- すべて永続化される（リロード後も保持）

## 検証シナリオ（Playwright）

1. **Inbox クイック追加と Enter キー**
   - 前提: `/inbox` を開く（空状態）
   - 操作: クイック追加入力欄に `ヒアリング前に背景資料を確認` を入力 → Enter キー押下
   - 期待: 入力欄が空になり、一覧に当該項目が追加される
2. **Inbox→タスク化**
   - 前提: Inbox に `Tailwind v4 を試す` が存在、カテゴリ `個人開発` が存在
   - 操作: 該当行の「タスク化」を押下 → 開いたフォームでカテゴリ `個人開発` を選択 → 保存
   - 期待: Inbox 一覧から該当行が消え、`/tasks` に遷移 or タスク一覧で `Tailwind v4 を試す` が確認できる
3. **Inbox→削除**
   - 前提: Inbox に項目 1 件
   - 操作: 削除ボタン押下
   - 期待: 一覧から消え、リロード後も復活しない
4. **プロジェクト新規作成**
   - 前提: `/projects` を開く、カテゴリ `テーマA` が存在
   - 操作: 「＋ プロジェクト」 → 名前 `年間計画化` → カテゴリ `テーマA` → 完了条件 `下期目標と整合する年間計画を確定する` → 保存
   - 期待: プロジェクトカードグリッドに `年間計画化` カードが表示される
5. **タスクのプロジェクト紐付け**
   - 前提: プロジェクト `年間計画化` が存在、カテゴリ `テーマA` が存在
   - 操作: `/tasks` で新規タスク追加 → タスク名 `対応表の初稿を書く` → カテゴリ `テーマA` → プロジェクト `年間計画化` → 保存
   - 期待: タスク一覧の該当行にプロジェクト名 `年間計画化` が表示される
6. **プロジェクト進捗反映**
   - 前提: プロジェクト `年間計画化` に紐付くタスクが 2 件（1 件完了、1 件未着手）
   - 操作: `/projects` を開く
   - 期待: `年間計画化` カードの進捗表示が `1/2` 相当（50%）と表示される
7. **プロジェクトのタスク一覧導線**
   - 前提: 上記状態
   - 操作: プロジェクトカードの「タスクを見る」を押下
   - 期待: `/tasks` に遷移し、プロジェクト `年間計画化` で絞り込まれた状態で表示される

## 閾値

- `npm run lint` / `npx tsc --noEmit` / `npm run build` 緑
- 上記 Playwright シナリオ 7 件すべて PASS
- Inbox / プロジェクト画面で `console.error` 0 件
- Inbox→タスク化 / プロジェクト化変換時、元の Inbox 項目が DB から消えるか status が `archived` 等になって一覧から確実に外れる
- プロジェクト進捗 % 計算が完了タスク数 / 全タスク数で正しく算出される（小数点以下は要件未定、四捨五入で可）

## 関連要件

- §10.2 Inbox 管理
- §10.4 プロジェクト管理
- §9.2 プロジェクトとタスクの関係（任意紐付け）
- §13.1 Inbox / プロジェクトの必須入力
- §16.1 作業中フロー（Inbox 追加 → 後で整理）

## デザイン参照

- `docs/design-references/reference/screens-1.jsx` の `InboxScreen`（quickAddVariant="topbar"）─ 上部常設クイック追加バーの構成
- `docs/design-references/reference/screens-2.jsx` の `ProjectsScreen` ─ 2 カラムプロジェクトカードの構成・進捗バー
- `DESIGN.md` §4「Cards & Containers」「Primary Blue」 ─ カード装飾・追加ボタン

## 実装計画

`prisma/schema.prisma` の `InboxItem` / `Project` / `Task.projectId` は Phase 2 の init マイグレーションで既に DB に存在（テーブル・カラム作成済み）。本フェーズではスキーマのコメントを「実装済み」に更新し、サーバー層・API・UI を活性化する。新規マイグレーションは不要（フィールド追加なし）。

実装順序:
1. `lib/types/inbox.ts` / `lib/types/project.ts` ─ ステータス定数・DTO・型ガード
2. `lib/db/inbox.ts` / `lib/db/project.ts` ─ CRUD＋振り分け＋進捗集計（完了タスク数/全タスク数）
3. API routes（inbox の作成/編集/削除/convert、projects の CRUD）。既存 tasks API と同じ検証パターンを踏襲
4. Inbox UI（QuickAddBar: Enter/ボタン追加、InboxList: タスク化/プロジェクト化/Someday化/削除）。タスク化・プロジェクト化は内容入りで既存フォームを開き、保存後 convert で InboxItem を processed に
5. Project UI（ProjectCard: カテゴリチップ/完了条件/進捗バー/期限/タスクを見る導線、ProjectFormDialog: 名前・カテゴリ必須、完了条件・期限・目的任意、ステータス切替）
6. `TaskFormDialog` にプロジェクト欄（任意選択）を追加し、`tasks` ページで projectId クエリ絞り込み＋プロジェクト名表示バナーを実装

プロジェクトステータス: `active`(進行中) / `todo`(未着手) / `paused`(保留) / `done`(完了)。進捗 % = round(done / total * 100)（total=0 のとき 0%）。Inbox 振り分け時は InboxItem を削除せず status を `processed`／`archived` 等にして一覧（pending のみ表示）から外す。

## 作業ログ
- 2026-05-30 着手
- 2026-05-30 lib 層（types/db）→ API → UI（Inbox/Project/TaskForm 拡張）→ ページ結線の順で実装
- 2026-05-30 lint / type-check / build すべて緑、prisma migrate status は up to date を確認

## 自己評価（回 1、2026-05-30）

### コマンド結果
| コマンド | 結果 | 備考 |
|---|---|---|
| npm run lint | ✅ | 警告・エラー 0 |
| npx tsc --noEmit (type-check) | ✅ | エラー 0 |
| npm run build | ✅ | 13 ルート生成成功。/inbox /projects /tasks /api/inbox* /api/projects* がビルドされた |
| prisma migrate status | ✅ | 既存 init マイグレーションで全テーブル作成済み。新規マイグレーション不要（DB schema up to date） |

### 受入基準セルフチェック

| # | 受入基準 | 自己判定 | 根拠 |
|---|---|---|---|
| 1 | Inbox 上部に常設クイック追加バー | ✅ | `QuickAddBar.tsx`（入力欄＋追加ボタン、`data-testid=inbox-quickadd`） |
| 2 | 内容のみで追加、Enter またはボタンで追加 | ✅ | `QuickAddBar` の `handleKeyDown`（Enter、IME 変換中は無視）＋ submit ボタン。POST /api/inbox |
| 3 | 各項目に「タスク化/プロジェクト化/Someday化/削除」が並ぶ | ✅ | `InboxList.tsx` の 4 ボタン |
| 4 | タスク化 → 内容入りフォーム → 保存でタスク追加＆Inbox から消える | ✅ | `InboxManager.openTask`＋`TaskFormDialog`（lockTitle, 内容を title に）→ POST /api/inbox/[id]/convert(target=task) が createTask＋markInboxProcessed。保存後 /tasks へ遷移 |
| 5 | プロジェクト化も同様 | ✅ | `openProject`＋`ProjectFormDialog`（lockName）→ convert(target=project) が createProject＋markInboxProcessed。保存後 /projects へ遷移 |
| 6 | Someday 化で一覧から消える | ✅ | `handleSomeday` → convert(target=someday) が markInboxArchived（status=archived）。一覧は pending のみ表示 |
| 7 | 削除で項目削除 | ✅ | `handleDelete` → DELETE /api/inbox/[id]（物理削除）。listInboxItems は pending のみ＝復活しない |
| 8 | プロジェクト「＋プロジェクト」から新規追加（名前・カテゴリ必須、完了条件・期限・目的任意） | ✅ | `ProjectManager`＋`ProjectFormDialog`（name/category 必須、submit disabled 制御）→ POST /api/projects |
| 9 | カードに進捗 done/total＋進捗バー（%） | ✅ | `ProjectCard`（taskDone/taskTotal、progressbar、%）。集計は `lib/db/project.ts` toDTO（round(done/total*100)） |
| 10 | カードからプロジェクト絞り込みタスク一覧への導線 | ✅ | `ProjectCard` の「タスクを見る」= `/tasks?projectId=...` Link。tasks ページが searchParams で絞り込み＋バナー表示 |
| 11 | タスクフォームでプロジェクト任意選択（未選択も保存可） | ✅ | `TaskFormDialog` にプロジェクト select（先頭「プロジェクト無し」=空）。空は payload で null 化 |
| 12 | プロジェクトのステータス（進行中/未着手/保留/完了）切替 | ✅ | `ProjectFormDialog` のステータス select（編集時）。PROJECT_STATUS_LABELS の 4 値。PATCH /api/projects/[id] |
| 13 | すべて永続化（リロード後も保持） | ✅ | 全操作が REST→Prisma→SQLite。各ページ `dynamic = "force-dynamic"` で SSR 再取得 |

### 変更ファイル
- `prisma/schema.prisma`: Project/InboxItem のコメントを実装済みに更新（テーブル構造変更なし）
- `lib/types/project.ts`（新規）: ProjectStatus 定数・ラベル・型ガード・ProjectDTO（進捗集計フィールド込み）
- `lib/types/inbox.ts`（新規）: InboxStatus / InboxConvertTarget 定数・型ガード・InboxItemDTO
- `lib/db/project.ts`（新規）: list/get/create/update/delete＋進捗集計（done/total/%）
- `lib/db/inbox.ts`（新規）: list(pending のみ)/get/create/update/delete＋markInboxProcessed/markInboxArchived
- `lib/db/task.ts`: listTasks に projectId フィルタ追加
- `app/api/inbox/route.ts` / `app/api/inbox/[id]/route.ts` / `app/api/inbox/[id]/convert/route.ts`（新規）
- `app/api/projects/route.ts` / `app/api/projects/[id]/route.ts`（新規）
- `app/api/tasks/route.ts`: GET に projectId クエリ追加
- `app/inbox/page.tsx`: PagePlaceholder → InboxManager 結線
- `app/projects/page.tsx`: PagePlaceholder → ProjectManager 結線
- `app/tasks/page.tsx`: projects 取得＋ searchParams.projectId で絞り込み・バナー用データを TaskManager へ
- `components/inbox/QuickAddBar.tsx` / `components/inbox/InboxList.tsx` / `components/inbox/InboxManager.tsx`（新規）
- `components/project/ProjectCard.tsx` / `components/project/ProjectFormDialog.tsx` / `components/project/ProjectManager.tsx`（新規）
- `components/task/TaskFormDialog.tsx`: プロジェクト欄（任意 select）＋ lockTitle 追加。TaskFormValue に projectId
- `components/task/TaskManager.tsx`: projects 受領、projectId フィルタ＋解除バナー、submit に projectId 反映

### 引き継ぎメモ（Verifier 向け）
- Playwright 検証前に `npm run dev`（DATABASE_URL=file:./dev.db で起動）。dev.db には既存データが残っている可能性があるため、シナリオ前提のカテゴリ（個人開発 / テーマA など）は「設定」画面で先に作成すること。
- Inbox→タスク化／プロジェクト化は保存後に自動で `/tasks` ／ `/projects` へ遷移する（`router.push`）。シナリオ 2 の「`/tasks` で確認」はこの遷移で満たされる。
- タスク化・プロジェクト化フォームではタスク名／プロジェクト名は Inbox 内容で固定（読み取り専用）。カテゴリ選択が必須。
- Someday 化は SomedayItem を作らず InboxItem の status を `archived` にして一覧から外す簡易実装（Someday 画面整備は Phase 8）。閾値「status が archived 等になって一覧から確実に外れる」を満たす。
- プロジェクトカードの「タスクを見る」は `/tasks?projectId=<id>` への遷移。遷移先で青いバナー（`data-testid=task-project-filter-banner`）＋絞り込み済みリスト＋「絞り込みを解除」ボタンが出る。
- 進捗 % は完了タスク数/全タスク数の四捨五入。タスク 0 件のプロジェクトは 0%。
- 主要 data-testid: inbox-quickadd-input / inbox-quickadd-button / inbox-row / inbox-to-task / inbox-to-project / inbox-to-someday / inbox-delete / add-project-button / project-card / project-progress-count / project-progress-percent / project-view-tasks / task-form-project / task-project-filter-banner。

## 検証結果（回 1、2026-05-30 01:21）

### dev 起動
- 結果: ✅
- ポート: 3000
- 起動時間: 約 8 秒

### シナリオ別結果

#### 当該フェーズのシナリオ
| # | シナリオ | 結果 | 観測値 / 失敗理由 |
|---|---|---|---|
| 1 | Inbox クイック追加と Enter キー | ✅ | 「ヒアリング前に背景資料を確認」を入力→Enter 後、入力欄が空になり一覧に追加（未整理 1 件）|
| 2 | Inbox→タスク化 | ✅ | 「Tailwind v4 を試す」タスク化ボタン→内容入りフォーム（カテゴリ「個人開発」選択）→保存後 /tasks へ遷移、タスク一覧に表示。Inbox は未整理 1 件に減少 |
| 3 | Inbox→削除 | ✅ | 「ヒアリング前に背景資料を確認」削除確認後に消え、リロード後も復活しない（0 件） |
| 4 | プロジェクト新規作成 | ✅ | 「年間計画化」/「テーマA」/完了条件入力→保存後カードが表示（完了条件・カテゴリチップ・進捗 0/0・0%） |
| 5 | タスクのプロジェクト紐付け | ✅ | 「対応表の初稿を書く」タスクにプロジェクト「年間計画化」を選択→保存後タスク行にプロジェクト名「年間計画化」表示 |
| 6 | プロジェクト進捗反映 | ✅ | 2 件中 1 件完了後に /projects を表示、「進捗 1/2 タスク」「50%」を確認 |
| 7 | プロジェクトのタスク一覧導線 | ✅ | 「タスクを見る」クリックで `/tasks?projectId=...` に遷移、「プロジェクト『年間計画化』で絞り込み中」バナー＋絞り込み 2 件表示 |

### 閾値判定
- 必須シナリオ全合格（7/7 PASS）: ✅
- lint/type/build 緑（Implementer 自己評価より）: ✅
- Inbox / プロジェクト画面で console.error 0 件: ✅（セッション全体で error 0 件）
- Inbox→タスク化変換時の項目消失確認: ✅（タスク化後 Inbox 未整理が 2→1 件に減少、リロード後も復活なし）
- プロジェクト進捗 % = 完了/全タスクの四捨五入: ✅（1/2 = 50%）

### 総合判定: ✅ OK
