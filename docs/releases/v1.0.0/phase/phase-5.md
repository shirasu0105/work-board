# Phase 5: 待ち状態管理とタスクかんばん表示

## 目的

要件書 §10.6 待ち状態管理を実装する。「待ち」はステータスではなくサブ状態であり、待ち相手・待ち理由を必須で持つ。あわせて §10.5 のタスクかんばん表示（5 列）を追加し、リスト/かんばんを切替可能にする。

## 成果物

- `prisma/schema.prisma` ─ `WaitingState`（taskId, partner, reason, expectedDate nullable, requestNote nullable, startedAt, endedAt nullable, responseNote nullable）モデル追加。マイグレーション追加
- `lib/db/waiting.ts` ─ 待ち状態の作成・解除関数
- `app/api/tasks/[id]/wait/route.ts` ─ `POST`（待ち化）/ `DELETE`（待ち解除）
- `components/task/WaitingStartDialog.tsx` ─ 待ち化フォーム（待ち相手・待ち理由必須、確認予定日・依頼メモ任意）
- `components/task/WaitingReleaseDialog.tsx` ─ 待ち解除フォーム（解除後ステータス選択：未着手 or 対応中、返答メモ任意）
- `components/task/WaitingTaskList.tsx` ─ 待ち専用一覧コンポーネント（待ち相手・理由・開始日・確認予定日・待ち日数）
- `app/tasks/waiting/page.tsx` ─ 待ちタスク専用画面
- `app/tasks/page.tsx` ─ リスト/かんばん切替トグル（クエリパラメータ `?view=kanban` か state で保持）
- `components/task/TaskKanban.tsx` ─ 5 列（未着手 / 対応中 / 待ち / 保留 / 完了）の縦並びカード表示
- `lib/date.ts` ─ 「待ち日数」計算ユーティリティ（startedAt から本日までの日数）

## 受入基準

- タスクのステータスを「待ち」に変更しようとすると、待ち化フォーム（待ち相手・待ち理由必須）が開き、両方入力しないと確定できない
- 待ち化したタスクには「待ち相手」「待ち理由」が紐づき、タスク一覧で行内に待ち相手と待ち日数が表示される
- 専用画面 `/tasks/waiting` で待ちタスクのみが一覧表示され、各行に「タスク名 / 待ち相手 / 待ち理由 / 待ち開始日 / 確認予定日 / 待ち日数」が表示される
- 待ち日数は当日基準で自動計算される（開始日との差分日数）
- 待ち解除アクションを実行すると解除ダイアログが開き、解除後ステータス（初期値「未着手」）を選択して解除できる
- 待ち解除時、解除後ステータスが「未着手」または「対応中」に切り替わり、待ち日数表示が消える
- タスク画面でリスト表示とかんばん表示をボタンで切り替えられる
- かんばん表示は「未着手 / 対応中 / 待ち / 保留 / 完了」の 5 列で、各タスクが現在のステータスの列に表示される
- かんばん表示でもタスククリックで編集ダイアログが開き、編集できる
- 待ち化・待ち解除はすべて永続化される

## 検証シナリオ（Playwright）

1. **待ち化フォーム必須バリデーション**
   - 前提: 未着手タスク `対応表の確認回答待ち` が存在
   - 操作: 該当タスクのステータスを「待ち」に変更しようとする → 開いたダイアログで待ち相手のみ入力（理由は空）→ 保存を試みる
   - 期待: 保存ボタンが disabled もしくはバリデーションエラーが表示され、タスクのステータスは「待ち」にならない
2. **待ち化成功**
   - 前提: 同タスクが存在
   - 操作: 待ち化ダイアログで待ち相手 `Aさん`、待ち理由 `対応表レビュー依頼中`、確認予定日 `2026-06-05` を入力 → 保存
   - 期待: タスクのステータスが「待ち」になり、リスト行に `Aさん` と待ち日数が表示される
3. **待ち専用一覧の表示**
   - 前提: シナリオ 2 のタスクが待ち状態
   - 操作: `/tasks/waiting` を開く
   - 期待: 該当タスクが行に「タスク名 / Aさん / 対応表レビュー依頼中 / 開始日 / 確認予定日 / 待ち日数」を含めて表示される
4. **待ち解除（未着手に戻す）**
   - 前提: 上記の待ちタスク
   - 操作: 待ち解除アクション実行 → ダイアログで解除後ステータス「未着手」（初期値）を確認 → 解除
   - 期待: タスクのステータスが「未着手」になり、`/tasks/waiting` の一覧から消える
5. **待ち解除（対応中に変更）**
   - 前提: 別の待ち状態タスクが存在
   - 操作: 解除ダイアログで「対応中」を選択 → 解除
   - 期待: タスクのステータスが「対応中」になる
6. **かんばん表示切替**
   - 前提: 5 ステータスにまたがる複数タスクが存在（最低各 1 件）
   - 操作: `/tasks` でリスト→かんばんに切替
   - 期待: 5 列が表示され、各タスクが対応する列に配置される
7. **かんばん列の件数**
   - 前提: シナリオ 6 と同条件
   - 期待: 各列のヘッダにその列のタスク件数が表示され、合計がタスク総数と一致する

## 閾値

- `npm run lint` / `npx tsc --noEmit` / `npm run build` 緑
- 上記 Playwright シナリオ 7 件すべて PASS
- タスク／待ち画面で `console.error` 0 件
- 待ち日数表示の計算ロジックがタイムゾーン依存で 1 日ズレない（システムタイムゾーン基準で良い）
- かんばん表示で 1280px 幅のとき 5 列が横並びになり、各列内のスクロールは縦のみ

## 関連要件

- §10.5.4 タスクステータス（待ちを含む 5 種）
- §10.6 待ち状態管理（全節）
- §13.1 待ち状態の必須入力（待ち相手・待ち理由）
- §16.1 作業中フロー（待ち化）

## デザイン参照

- `docs/design-references/reference/screens-2.jsx` の `TasksScreen`（かんばん表示）─ 5 列の配置・各カード内の情報密度
- `docs/design-references/reference/sketch-prims.jsx` の `StatusChip` ─ 「待ち」バッジの配色
- `docs/design-references/reference/screens-1.jsx` の HomeScreen 内「確認予定日を迎えた待ち」セクション ─ 待ち情報の表示要素
- `DESIGN.md` §4「Pill Badge Button」 ─ ステータスバッジ

## 実装計画（回 1）

受入基準（待ち化フォーム必須バリデーション／待ち化成功→リスト表示／待ち専用一覧／待ち日数自動計算／待ち解除ダイアログ＋ステータス選択／リスト⇔かんばん切替／5 列配置＋件数／永続化）を満たすため、以下の順で実装する。

1. データ層: `prisma/schema.prisma` の `WaitingState` は init マイグレーションで既に宣言・テーブル化済み（partner/reason/reviewAt/requestNote/startedAt/endedAt/replyNote/taskId）。フィールド名はスキーマ（reviewAt / requestNote / replyNote）を真とし、phase 記述の `expectedDate / responseNote` は同義として扱う。新規マイグレーションは不要。
2. ユーティリティ: `lib/date.ts` に待ち日数計算（ローカル TZ の暦日差。当日 0 日）と日付整形を実装。
3. 型: `lib/types/waiting.ts`（WaitingStateDTO / WaitingTaskDTO / 解除後ステータス）。`lib/types/task.ts` の TaskDTO に `waiting` フィールドを追加（待ち中のみ非 null）。
4. DB 関数: `lib/db/waiting.ts`（startWaiting / releaseWaiting / listWaitingTasks / getActiveWaiting）。Task と WaitingState をトランザクションで整合。`lib/db/task.ts` の `updateTask` は status="waiting" の直接設定を拒否し、待ち中→他ステータスへの汎用変更時は待ちを自動解除。
5. API: `app/api/tasks/[id]/wait/route.ts`（POST 待ち化 / DELETE 解除）、`app/api/tasks/waiting/route.ts`（GET 一覧）。
6. UI: `WaitingStartDialog`（待ち相手・理由必須で保存 disabled 制御）、`WaitingReleaseDialog`（解除後ステータス初期値「未着手」）、`WaitingTaskList` ＋ `WaitingManager`、専用画面 `app/tasks/waiting/page.tsx`。
7. かんばん: `TaskKanban`（5 列・各列件数・縦スクロール）。`TaskManager` にリスト/かんばん切替トグル（`?view=kanban` 同期）と待ちダイアログ連携、`TaskList` に待ち情報表示と待ち解除ボタンを追加。
8. 導線: サイドナビに「待ちタスク」（/tasks/waiting）を追加し、`isNavActive` を最長一致優先に修正（/tasks との二重ハイライト防止）。

## 作業ログ
- 2026-05-30 11:30 着手。既存スキーマ・タスク UI・API パターンを確認
- 2026-05-30 11:40 データ層〜API〜UI〜かんばん〜専用画面を実装
- 2026-05-30 11:46 lint / type-check / build 実行、すべて緑

## 自己評価（回 1、2026-05-30 11:46）

### コマンド結果
| コマンド | 結果 | 備考 |
|---|---|---|
| npm run lint | ✅ | 初回 `Prisma.WaitingStateGetPayload<{}>` の empty-object-type で 1 件エラー→ select: undefined 指定で解消 |
| npm run type-check | ✅ | エラーなし |
| npm run build | ✅ | 全 14 ページ生成成功。`/tasks/waiting`・`/api/tasks/[id]/wait`・`/api/tasks/waiting` を確認。`[id]` と `waiting` の静的優先で競合なし |

### 受入基準セルフチェック

| # | 受入基準 | 自己判定 | 根拠 |
|---|---|---|---|
| 1 | ステータスを「待ち」に変更しようとすると待ち化フォームが開き、待ち相手・待ち理由を両方入れないと確定不可 | ✅ | `TaskManager.handleChangeStatus` が status==="waiting" を検知して `WaitingStartDialog` を開く（直接 PATCH しない）。同ダイアログは partner/reason trim 後どちらか空なら保存ボタン disabled |
| 2 | 待ち化タスクに待ち相手・理由が紐づき、一覧行に待ち相手と待ち日数が表示される | ✅ | `startWaiting` で WaitingState 作成＋Task.status=waiting。`TaskList` に `task-waiting-partner`/`task-waiting-days` を表示。TaskDTO.waiting を `lib/db/task.ts` で付与 |
| 3 | `/tasks/waiting` で待ちのみ一覧表示、各行にタスク名/待ち相手/理由/開始日/確認予定日/待ち日数 | ✅ | `app/tasks/waiting/page.tsx`＋`WaitingTaskList`。`listWaitingTasks` が endedAt=null かつ status=waiting を抽出。行に全要素を `waiting-*` testid 付きで表示 |
| 4 | 待ち日数は当日基準で自動計算（開始日との差分日数） | ✅ | `lib/date.ts waitingDays` がローカル TZ の暦日差を返す（当日 0 日）。listWaitingTasks / TaskDTO 双方で利用 |
| 5 | 待ち解除アクションで解除ダイアログが開き、解除後ステータス（初期値「未着手」）を選択して解除 | ✅ | リスト行の `task-release-waiting-button`／専用一覧の `waiting-release-button` で `WaitingReleaseDialog` 起動。初期 state は "todo"（未着手） |
| 6 | 待ち解除時、ステータスが未着手/対応中へ切替、待ち日数表示が消える | ✅ | `releaseWaiting` が endedAt 打刻＋Task.status を nextStatus に。TaskDTO.waiting は endedAt!=null で null になり日数表示が消える。専用一覧は再フェッチで行が消える |
| 7 | リスト表示とかんばん表示をボタンで切替できる | ✅ | `TaskManager` の `task-view-toggle`（リスト/かんばん）。`?view=kanban` を replaceState で URL 同期 |
| 8 | かんばんは未着手/対応中/待ち/保留/完了の 5 列で各タスクが現在ステータスの列に表示 | ✅ | `TaskKanban` が TASK_STATUSES（5 種）でグルーピングし `grid-cols-5`。各カードに data-status |
| 9 | かんばんでもタスククリックで編集ダイアログが開き編集できる | ✅ | `kanban-card` ボタン onClick→`openEdit`→`TaskFormDialog` |
| 10 | 待ち化・待ち解除はすべて永続化される | ✅ | すべて Prisma 経由で SQLite に保存。POST/DELETE `/api/tasks/[id]/wait` がトランザクションで Task と WaitingState を更新 |

閾値（lint/type/build 緑）は達成。Playwright 7 シナリオ・console.error 0 件・1280px 5 列横並びは Verifier 検証範囲。

### 変更ファイル
- `lib/date.ts`（新規）: 待ち日数計算・日付整形ユーティリティ
- `lib/types/waiting.ts`（新規）: WaitingStateDTO / WaitingTaskDTO / 解除後ステータス型
- `lib/types/task.ts`: TaskDTO に `waiting`（待ち情報 or null）を追加
- `lib/db/waiting.ts`（新規）: startWaiting / releaseWaiting / listWaitingTasks / getActiveWaiting
- `lib/db/task.ts`: toDTO に waiting 付与、updateTask で status="waiting" 直接設定を拒否＋待ち中→他状態の自動解除
- `app/api/tasks/[id]/wait/route.ts`（新規）: POST 待ち化 / DELETE 解除
- `app/api/tasks/waiting/route.ts`（新規）: GET 待ち一覧
- `components/task/WaitingStartDialog.tsx`（新規）: 待ち化フォーム（相手・理由必須）
- `components/task/WaitingReleaseDialog.tsx`（新規）: 待ち解除フォーム（解除後ステータス・返答メモ）
- `components/task/WaitingTaskList.tsx`（新規）: 待ち専用一覧
- `components/task/WaitingManager.tsx`（新規）: 待ち専用画面の状態コンテナ
- `components/task/TaskKanban.tsx`（新規）: 5 列かんばん
- `components/task/TaskManager.tsx`: 表示切替トグル・待ちダイアログ連携・かんばん描画
- `components/task/TaskList.tsx`: 待ち情報表示・待ち解除ボタン
- `app/tasks/page.tsx`: `?view` を受けて initialView を TaskManager に渡す
- `app/tasks/waiting/page.tsx`（新規）: 待ち専用画面
- `lib/nav.ts`: サイドナビに「待ちタスク」追加＋ isNavActive を最長一致優先に修正

### 引き継ぎメモ（Verifier 向け）
- 待ちは「ステータス」ではなくサブ状態。`/api/tasks/[id]` の PATCH で `status: "waiting"` を送ると 400（「待ち化フォームから行ってください」）。待ち化は必ず `/api/tasks/[id]/wait` POST 経由。
- 待ち日数はローカル TZ の暦日差で、同日内は 0 日。日付が変わると 1 日進む（時刻差では増えない）。
- シナリオ 5（別タスクを対応中に解除）は、待ちタスクが 2 件以上必要。待ち化を 2 件作ってから検証すると確実。
- かんばんの 5 列は親に `overflow-x-auto`、内側 grid に `min-w-[1000px]` を設定。1280px 幅では横スクロールなしで 5 列が収まり、各列内は縦スクロールのみ（`max-h-[70vh] overflow-y-auto`）。
- 待ち専用一覧の「確認予定日」は未設定時「未設定」と表示する（シナリオ 3 では確認予定日 2026-06-05 を入力済みなので日付が出る）。
- DB は既存 `prisma/dev.db`。WaitingState テーブルは init マイグレーションで作成済みのため追加マイグレーションは無し。dev サーバ起動後の初回アクセスで SSR される。

## 検証結果（回 1、2026-05-30 02:51）

### dev 起動
- 結果: OK
- ポート: 3000
- 起動時間: 約 5 秒（Ready in 593ms）

### シナリオ別結果

#### 当該フェーズのシナリオ
| # | シナリオ | 結果 | 観測値 / 失敗理由 |
|---|---|---|---|
| 1 | 待ち化フォーム必須バリデーション | OK | 待ち相手のみ入力（理由空）の状態で「待ちにする」ボタンが disabled のまま。ステータスも「未着手」を維持 |
| 2 | 待ち化成功 | OK | ステータスが「待ち」に変わり、リスト行に「Aさん 待ち」と「0 日」が表示された |
| 3 | 待ち専用一覧の表示 | OK | `/tasks/waiting` でタスク名・「Aさん」・「対応表レビュー依頼中」・開始日「2026/05/30」・確認予定日「2026/06/05」・待ち日数「0 日」がすべて表示された |
| 4 | 待ち解除（未着手に戻す） | OK | 解除後ステータス初期値「未着手」を確認して解除。一覧から消え「0 件の待ち」と表示。タスクのステータスが「未着手」になり待ち情報表示も消えた |
| 5 | 待ち解除（対応中に変更） | OK | 別タスクを待ち化後、解除ダイアログで「対応中（doing）」を選択して解除。ステータスが「doing」（対応中）になり待ち情報表示が消えた |
| 6 | かんばん表示切替 | OK | リスト→かんばん切替で 5 列（未着手/対応中/待ち/保留/完了）が表示され URL も `?view=kanban` に更新された。各タスクが対応する列に配置された |
| 7 | かんばん列の件数 | OK | 未着手 2・対応中 1・待ち 1・保留 1・完了 1 の合計 6 件がヘッダに表示され、タスク総数「6 件」と一致 |

### 閾値判定
- 必須シナリオ全合格（7/7）: OK
- lint/type/build 緑（Implementer 自己評価より）: OK
- console.error 0 件（タスク画面・待ち専用画面通じてセッション全体）: OK
- 1280px 幅で 5 列横並び（`grid grid-cols-5 gap-3 min-w-[1000px]` / 各列 left 座標が別々・top が同一・横スクロールなし）: OK
- 待ち日数はローカル TZ の暦日差（同日内 0 日）: OK（当日開始で 0 日を確認）

### 総合判定: OK
