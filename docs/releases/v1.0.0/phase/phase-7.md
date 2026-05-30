# Phase 7: ホーム集約と日次ジャーナル

## 目的

要件書 §10.1 ホーム画面と §10.12 日次ジャーナルを構築する。これまでのフェーズで蓄積したデータ（タスク・待ち・Inbox・プロジェクト・メモ）をホーム画面に集約表示し、日次ジャーナルで「明日やること」を選択すると翌日のホームに「今日やること」として反映される導線を完成させる。

## 成果物

- `prisma/schema.prisma` ─ `DailyJournal`（date unique, todayNote TEXT, createdAt, updatedAt）、`JournalSelection`（journalId, taskId）モデル追加。マイグレーション追加
- `lib/db/journal.ts` ─ 日次ジャーナル CRUD
- `lib/db/home.ts` ─ ホーム集約用のクエリ（今日やること / 確認予定日切れ待ち / Inbox 件数 / 進行中Pj / 最近のメモ）
- `app/api/journals/route.ts` / `app/api/journals/[date]/route.ts` ─ 日次ジャーナル API（日付キーで取得・保存）
- `app/page.tsx` ─ ホーム画面の本実装
- `app/journal/page.tsx` ─ 日次ジャーナル画面（左: 今日のひとこと＋完了タスク、右: 未完タスクから明日やること選択）
- `components/home/TodayTasks.tsx` / `WaitingAlerts.tsx` / `InboxCount.tsx` / `ActiveProjects.tsx` / `RecentMemos.tsx`
- `components/journal/JournalEditor.tsx` / `TomorrowTaskPicker.tsx`
- `lib/date.ts` ─ 「今日」「明日」「日付キー（YYYY-MM-DD）」のユーティリティを拡張

## 受入基準

- ホーム画面にトップバーで現在日付が表示される
- ホーム画面に以下のセクションがすべて表示される
  - 今日やること（前日の日次ジャーナルで選んだタスク。なければ「未設定」表示）
  - 確認予定日を迎えた待ち（確認予定日 <= 今日 の待ちタスク）
  - Inbox 未整理件数
  - 進行中プロジェクト一覧（status=進行中）
  - 最近のメモ（更新日時新しい順、上位 5 件程度）
  - 日次ジャーナル導線ボタン
  - 週次レビュー導線ボタン
- 今日やることのタスクをチェックすると完了状態になり、ホーム上で取り消し線などで表現される
- 日次ジャーナル画面で対象日（今日）の「今日のひとこと」を入力・保存できる
- 未完了タスクの一覧から「明日やること」を複数選択でき、選択数が表示される
- 日次ジャーナルを保存後、対象日 + 1 日のホーム画面で「今日やること」として選択タスクが表示される
- 同じ日の日次ジャーナルを再度開くと、入力済みの「今日のひとこと」と「選択済み明日タスク」が復元される
- ホームの「Inbox 未整理」が現在の Inbox 件数と一致する
- ホームの「確認予定日を迎えた待ち」セクションには、確認予定日 <= 今日 の待ちタスクのみが表示される

## 検証シナリオ（Playwright）

1. **ホーム画面の初期表示**
   - 前提: Phase 2〜6 のデータ（カテゴリ・タスク・Inbox・プロジェクト・メモ）が一通り入っている状態
   - 操作: `/` を開く
   - 期待: 上記 7 セクションがすべて表示される。Inbox 件数が実際の Inbox 件数と一致する
2. **日次ジャーナルの保存と復元**
   - 前提: 未完了タスク 3 件が存在、`/journal` を開く
   - 操作: 今日のひとことに `ヒアリング前の準備に時間がかかった` と入力 → 未完タスク 2 件を「明日やること」に選択 → 保存
   - 期待: 保存後ホームに遷移する、または成功フィードバックが表示される。再度 `/journal` を開くと入力した文と選択 2 件が復元されている
3. **明日やることがホームに反映**
   - 前提: 日次ジャーナルで対象日 = 今日として保存済み、選択タスク 2 件あり
   - 操作: システム日付を翌日に進めるか、テスト用に日付を切り替える仕組みで翌日のホームを表示（実装方針として「対象日 + 1 日」のホームを直接アクセスできる開発用クエリパラメータを設けるなど、Verifier が再現可能な方法を確保）
   - 期待: 翌日のホームの「今日やること」セクションに当該 2 件が表示される
4. **確認予定日切れ待ちの抽出**
   - 前提: 確認予定日が「昨日」の待ちタスク 1 件、「来週」の待ちタスク 1 件が存在
   - 操作: ホームを開く
   - 期待: 「確認予定日を迎えた待ち」セクションに「昨日」のタスクのみが表示され、「来週」のタスクは表示されない
5. **Inbox 件数連動**
   - 前提: Inbox 件数 5 件
   - 操作: ホームを開く → Inbox に 1 件追加 → ホームに戻る
   - 期待: Inbox 件数表示が 6 件に更新される
6. **今日のひとこと必須**
   - 前提: 日次ジャーナル画面を開く
   - 操作: 今日のひとことを空のまま明日タスクのみ選択して保存を試みる
   - 期待: 保存ボタンが disabled もしくはバリデーションエラーが表示される（要件 §13.1）
7. **完了タスクの取り消し線**
   - 前提: ホームの「今日やること」に未完了タスク 1 件
   - 操作: チェックボックスを押下
   - 期待: 当該タスクに取り消し線が付き、ステータスが完了になる

## 閾値

- `npm run lint` / `npx tsc --noEmit` / `npm run build` 緑
- 上記 Playwright シナリオ 7 件すべて PASS
- ホーム画面・日次ジャーナル画面で `console.error` 0 件
- ホーム集約クエリが N+1 にならない（プロジェクト件数 × タスク件数 が 100 件程度でも 1 秒以内に表示完了）
- 日次ジャーナルは「対象日」に対して一意（同じ日に複数 journal は作れない、UPSERT 動作）

## 関連要件

- §10.1 ホーム画面
- §10.12 日次ジャーナル
- §16.2 作業日の最後フロー
- §16.3 翌日の作業開始時フロー
- §13.1 日次ジャーナルの必須入力（今日のひとこと・明日やること）

## デザイン参照

- `docs/design-references/reference/screens-1.jsx` の `HomeScreen` ─ 2 カラム集約（左: 今日やること＋待ち、右: Inbox 件数＋プロジェクト＋メモ＋導線）
- `docs/design-references/reference/screens-4.jsx` の `JournalScreen` ─ 左: 今日のひとこと、右: 明日やること選択
- `DESIGN.md` §4「Metric Cards」 ─ Inbox 件数表示の装飾トークン
- `DESIGN.md` §5「Layout Principles」 ─ 2 カラムのスペーシング

## 実装計画（回 1）

ホーム集約と日次ジャーナル連携を構築する。スキーマ（`DailyJournal` / `JournalSelection`）と init マイグレーションは Phase 2 時点で先行宣言済みのため、本フェーズではスキーマ変更・新規マイグレーションは不要（既存テーブルをそのまま使用）。

実装順序:

1. `lib/date.ts` を拡張し、日付キー（YYYY-MM-DD）ユーティリティ（`todayKey` / `addDaysToKey` / `nextDayKey` / `dateKeyToUtcDate` / `isDateKey` / `formatDateKeyLabel`）を追加。対象日は UTC 00:00 の Date として保存し、TZ に依存せず往復できるようにする。
2. 型定義 `lib/types/journal.ts`・`lib/types/home.ts` を追加。
3. `lib/db/journal.ts`（getJournalByDate / saveJournal[UPSERT＋選択洗い替え] / getSelectedTaskIdsForDate / getJournalPageData）と `lib/db/home.ts`（getHomeData: 今日やること＝前日ジャーナル選択 / 確認予定日切れ待ち / Inbox 件数 / 進行中Pj / 最近メモ を `Promise.all` 並列で 1 ショットずつ取得し N+1 回避）を実装。
4. API: `app/api/journals/route.ts`（POST 保存・必須バリデーション）/ `app/api/journals/[date]/route.ts`（GET 取得）。
5. ホーム部品（`components/home/*`）と日次ジャーナル部品（`components/journal/*`）を実装。今日やることは完了でも表示し取り消し線で表現、チェックで完了トグル（既存 `/api/tasks/:id` PATCH を流用）。
6. `app/page.tsx` / `app/journal/page.tsx` を本実装。検証シナリオ3 再現のため、両画面に開発用クエリ `?date=YYYY-MM-DD` を設け、対象日（および対象日+1のホーム）を直接表示できるようにする。

## 作業ログ
- 2026-05-30 着手
- 2026-05-30 lib/date 拡張・型・db・API・コンポーネント・ページ実装完了。lint / type-check / build すべて緑。

## 自己評価（回 1、2026-05-30）

### コマンド結果
| コマンド | 結果 | 備考 |
|---|---|---|
| npm run lint | ✅ | エラー・警告 0 |
| npx tsc --noEmit | ✅ | エラー 0 |
| npm run build | ✅ | `/`・`/journal`・`/api/journals`・`/api/journals/[date]` を含め 12 ページ生成成功 |

### 受入基準セルフチェック

| # | 受入基準 | 自己判定 | 根拠 |
|---|---|---|---|
| 1 | ホーム画面トップバーに現在日付表示 | ✅ | `app/page.tsx` タイトル `今日 — M/D (曜)` ＋ `topBarRight` に `data-testid="home-date"`。`formatDateKeyLabel` で整形 |
| 2 | 今日やること（前日ジャーナル選択。なければ「未設定」） | ✅ | `getHomeData` が `prevDate=対象日-1` のジャーナル選択を引く。`TodayTasks` 空時に「未設定」(`home-today-empty`) を表示 |
| 3 | 確認予定日を迎えた待ち表示 | ✅ | `getHomeData` の `dueWaitings`（status=waiting・未解除・reviewAt<対象日翌日0:00）。`WaitingAlerts` で表示 |
| 4 | Inbox 未整理件数 | ✅ | `prisma.inboxItem.count({status:"pending"})` → `InboxCount`（`home-inbox-count`） |
| 5 | 進行中プロジェクト一覧（status=進行中） | ✅ | `where:{status:"active"}` → `ActiveProjects`（進捗バー付き） |
| 6 | 最近のメモ（更新新しい順・上位5件） | ✅ | `orderBy updatedAt desc, take:5` → `RecentMemos` |
| 7 | 日次ジャーナル導線ボタン | ✅ | `home-journal-link`（→ /journal） |
| 8 | 週次レビュー導線ボタン | ✅ | `home-review-link`（→ /review） |
| 9 | 今日やることのチェックで完了＋取り消し線 | ✅ | `TodayTasks` チェックで `/api/tasks/:id` PATCH status=done。`done` のとき `line-through`（`data-done` 属性付与） |
| 10 | 今日のひとこと入力・保存 | ✅ | `JournalEditor` の textarea（`journal-oneliner`）→ POST `/api/journals` |
| 11 | 未完了タスクから明日やること複数選択＋選択数表示 | ✅ | `TomorrowTaskPicker`（複数トグル）＋ `journal-selected-count`「選択中: N 件」 |
| 12 | 保存後、対象日+1 のホームに「今日やること」として反映 | ✅ | ホームは前日ジャーナルを参照。`?date=対象日+1` で翌日ホームを直接表示し確認可能（開発用クエリ） |
| 13 | 同じ日のジャーナル再表示で入力・選択が復元 | ✅ | `getJournalPageData` が `journal` を返し、`JournalEditor` が初期 state に反映 |
| 14 | Inbox 件数がホーム表示と一致 | ✅ | 同一の `inboxItem.count(pending)` を使用。`force-dynamic` で都度取得 |
| 15 | 待ちセクションは reviewAt<=今日 のみ | ✅ | `reviewAt: { not:null, lt:対象日翌日0:00 }`。来週分は境界外で除外 |

### 変更ファイル
- `lib/date.ts`: 日付キー（YYYY-MM-DD）ユーティリティ群を追加（既存 `waitingDays`/`formatLocalDate` は不変）
- `lib/types/journal.ts`（新規）: `JournalDTO` / `JournalPageData`
- `lib/types/home.ts`（新規）: `HomeData` / `ActiveProjectSummary` / `RecentMemoSummary`
- `lib/db/journal.ts`（新規）: ジャーナル CRUD（UPSERT・選択洗い替え）＋ `getJournalPageData`
- `lib/db/home.ts`（新規）: ホーム集約クエリ（Promise.all 並列・N+1 回避）
- `app/api/journals/route.ts`（新規）: POST 保存（必須バリデーション）
- `app/api/journals/[date]/route.ts`（新規）: GET 取得
- `components/home/TodayTasks.tsx`（新規・client）: 今日やること＋完了トグル
- `components/home/WaitingAlerts.tsx`（新規）: 確認予定日切れ待ち
- `components/home/InboxCount.tsx`（新規）: Inbox メトリックカード
- `components/home/ActiveProjects.tsx`（新規）: 進行中プロジェクト
- `components/home/RecentMemos.tsx`（新規）: 最近のメモ
- `components/journal/JournalEditor.tsx`（新規・client）: ジャーナル本体（ひとこと＋完了振り返り＋保存）
- `components/journal/TomorrowTaskPicker.tsx`（新規・client）: 明日やること選択
- `app/page.tsx`: ホーム本実装（`?date=` 開発用クエリ対応）
- `app/journal/page.tsx`: 日次ジャーナル本実装（`?date=` 開発用クエリ対応）

### 引き継ぎメモ（Verifier 向け）
- スキーマ・マイグレーション変更なし。既存 `dev.db` のまま `npm run dev` で起動可能（マイグレーション再実行不要）。
- 検証シナリオ3「明日やることがホームに反映」の再現方法:
  1. `/journal`（対象日=今日）で今日のひとこと入力＋未完タスク 2 件選択＋保存。
  2. ホームを `/?date=<今日+1日>`（例 今日が 2026-05-30 なら `/?date=2026-05-31`）で開くと、「今日やること」に当該 2 件が表示される。日付キーは YYYY-MM-DD。
  - `/journal?date=<日付>` で対象日自体も切り替え可能。
- 「今日やること」は前日ジャーナルの選択を表示する。完了済みタスクも表示し取り消し線にする仕様（シナリオ7のため意図的）。
- 必須バリデーション（シナリオ6）: 今日のひとこと空 or 明日タスク 0 件のとき保存ボタンが `disabled`。API 側でも 400 を返す二重防御。
- 完了トグル（シナリオ7）は `/api/tasks/:id` PATCH を流用。トグル後 `router.refresh()` でサーバー状態と同期。
- ホーム / ジャーナルとも `export const dynamic = "force-dynamic"` で常に最新を SSR 取得（Inbox 件数連動シナリオ5 のため）。

## 検証結果（回 1、2026-05-30 13:26）

### dev 起動
- 結果: ✅
- ポート: 3000
- 起動時間: 約 5 秒

### シナリオ別結果

#### 当該フェーズのシナリオ

| # | シナリオ | 結果 | 観測値 / 備考 |
|---|---|---|---|
| 1 | ホーム画面の初期表示 | ✅ | 今日やること（0件・未設定）／確認予定日切れ待ち（0件）／INBOX未整理（0件）／進行中プロジェクト（1件）／最近のメモ（3件）／日次ジャーナル導線／週次レビュー導線、すべて表示確認。トップバーに「5/30 (土)」表示。コンソールエラー 0 件 |
| 2 | 日次ジャーナルの保存と復元 | ✅ | ひとこと「ヒアリング前の準備に時間がかかった」入力 → タスク2件選択 → 保存。「保存しました。明日（5/31 (日)）のホームに 2 件が表示されます。」が表示。再ロードで入力・選択が完全復元 |
| 3 | 明日やることがホームに反映 | ✅ | `/?date=2026-05-31` で翌日ホームを開くと「今日やること 2件」として「〇〇さんへのヒアリング項目をまとめる」「資料を整理する」が表示 |
| 4 | 確認予定日切れ待ちの抽出 | ✅ | 昨日（2026-05-29）確認予定のタスクのみ「確認予定日を迎えた待ち」セクションに表示。来週（2026-06-06）分は非表示 |
| 5 | Inbox 件数連動 | ✅ | Inbox に1件追加後、ホームの「INBOX 未整理」が0件→1件に更新 |
| 6 | 今日のひとこと必須バリデーション | ✅ | ひとこと空・タスク0件→保存ボタン `[disabled]`。ひとこと空・タスク1件→保存ボタン引き続き `[disabled]`（ひとこと必須） |
| 7 | 完了タスクの取り消し線 | ✅ | チェックボックス押下 → `checked` 状態になり、ステータスが「完了」に変化。タスクタイトル要素に `line-through` クラス付与を DOM 確認 |

### 閾値判定

- 必須シナリオ全合格（7/7）: ✅
- ホーム画面・日次ジャーナル画面で console.error 0件: ✅ （画面遷移ごとに確認、ユーザー操作に起因するエラーなし）
- ホーム集約クエリ 1秒以内: ✅ （SSR レスポンス約 79ms）
- 日次ジャーナル UPSERT 動作: ✅ （同じ日に再保存で内容が更新され、複数 journal レコードは作成されない）
- lint/type/build 緑（Implementer 自己評価より）: ✅

### 総合判定: ✅ OK

### スクリーンショット参照
- `screenshots/phase-7-1-scenario1-home.png` — ホーム画面初期表示
- `screenshots/phase-7-1-scenario7-linethrough.png` — チェック後の取り消し線表示
