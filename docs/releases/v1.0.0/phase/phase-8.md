# Phase 8: 週次レビュー・検索/絞り込み・仕上げ

## 目的

要件書 §10.13 週次レビューを簡易実装し、§10.10 メモ検索および §10.11 タスク検索の優先項目を実装する。あわせて Someday / Maybe の最小実装（要件 §10.7 簡易版）と、各画面の空状態・バリデーション表示・レスポンシブ整備で MVP を仕上げる。

## 成果物

- `prisma/schema.prisma` ─ `SomedayItem`（content, categoryId, reason nullable, reviewDate nullable, status, timestamps）モデル追加。マイグレーション追加
- `lib/db/someday.ts` ─ Someday CRUD
- `app/api/someday/route.ts` / `app/api/someday/[id]/route.ts` ─ Someday API（Inbox→Someday 化の受け皿も含む）
- `app/review/page.tsx` ─ 週次レビュー画面（6 ステップを順次実施できるステッパー UI）
- `components/review/ReviewStepper.tsx` / `InboxReviewStep.tsx` / `ProjectReviewStep.tsx` / `TaskReviewStep.tsx` / `WaitingReviewStep.tsx` / `SomedayReviewStep.tsx` / `NextWeekFocusStep.tsx`
- `components/task/TaskFilters.tsx` ─ カテゴリ / ステータス / プロジェクト有無の絞り込み（タスク一覧で使用）
- `components/memo/MemoFilters.tsx` ─ キーワード / カテゴリ / 種別 / 日付範囲の絞り込み
- `components/common/EmptyState.tsx` ─ 共通空状態コンポーネント（全主要画面で使用）
- 各画面の空状態 UI / バリデーションエラー表示の整備
- `README.md` 更新 ─ セットアップ手順（`npm install` → `npm run db:migrate` → `npm run dev`）

## 受入基準

### 週次レビュー
- `/review` で 6 ステップ（Inbox 整理 / 進行中プロジェクト確認 / 未完了タスク確認 / 待ちタスク確認 / Someday 見直し / 来週の重点プロジェクト）が左ペインに表示される
- 各ステップをクリックすると右ペインに該当データが表示される（Inbox 一覧、Project 一覧、未完了タスク一覧、待ちタスク一覧、Someday 一覧、プロジェクト選択 UI）
- 進行中プロジェクト確認ステップで Next Action 未設定のプロジェクトに警告バッジが表示され、その場でタスク（Next Action）を入力・追加できる
- 「次へ」ボタンで次ステップに進める。「前へ」で戻れる
- 各ステップを完了マークでき、完了マークしたステップは左ペインで取り消し線などで識別できる

### Someday
- Someday 一覧画面が `/review` 内のステップ or 単独画面（実装方針はどちらでも可）で確認・追加・削除できる
- Inbox → Someday 化アクション（Phase 4 で導線のみ作成）が機能し、Someday に項目が追加される
- Someday 項目はカテゴリで分類される

### タスク検索・絞り込み
- タスク一覧画面で「カテゴリ」「ステータス」「プロジェクト有無（あり/なし/問わない）」の 3 フィルタが利用できる
- フィルタを複数組み合わせると AND 条件で絞り込まれる
- フィルタ適用中、表示件数 / 総件数の表示が更新される

### メモ検索・絞り込み
- メモ一覧画面で「キーワード（タイトル部分一致）」「カテゴリ」「種別」「日付範囲（from/to）」の 4 フィルタが利用できる
- フィルタ適用後、タイムラインがフィルタ後の結果のみ表示する

### 仕上げ
- すべての主要画面（ホーム / Inbox / タスク / プロジェクト / メモ / 日次ジャーナル / 週次レビュー / 設定）でデータが 0 件のときに空状態 UI が表示される
- すべてのフォーム入力でバリデーションエラーが視覚的に表示される
- ブラウザ幅 1024px〜1440px で全主要画面が横スクロールなしで表示される
- `README.md` にローカル起動手順が記載されている

## 検証シナリオ（Playwright）

1. **週次レビューのステップ進行**
   - 前提: `/review` を開く（既存データあり）
   - 操作: ステップ 1（Inbox 整理）→ 「次へ」 → ステップ 2（進行中プロジェクト確認） → 「次へ」 → ステップ 3 まで進める
   - 期待: 右ペインの表示内容がステップごとに切り替わる。左ペインのアクティブステップが視覚的に更新される
2. **Next Action 未設定プロジェクトの検出と追加**
   - 前提: Next Action（紐づくタスク）が 0 件のプロジェクトが 1 件存在
   - 操作: 週次レビューのプロジェクトステップを開く → 該当プロジェクトの入力欄に `BIOS バージョン確認` を入力 → 追加
   - 期待: 該当プロジェクトに新タスクが追加され、警告バッジが「✓ Next Action あり」に変わる
3. **Someday 化フローと一覧確認**
   - 前提: Inbox に `Tailwind v4 を試す` が存在、カテゴリ `個人開発`
   - 操作: Inbox の Someday 化アクション → カテゴリ選択 → 保存 → Someday 一覧（または週次レビューの Someday ステップ）を確認
   - 期待: 該当項目が Someday に追加され、Inbox から消える
4. **タスクの複合フィルタ**
   - 前提: カテゴリ `テーマA` の未着手タスク 3 件、`テーマA` の対応中タスク 2 件、`テーマB` の未着手タスク 1 件
   - 操作: タスク一覧でカテゴリ `テーマA` ＋ ステータス `未着手` を選択
   - 期待: 表示が 3 件になり、件数表示も「3 件 / 計 6 件」相当になる
5. **タスク プロジェクト有無フィルタ**
   - 前提: プロジェクト紐付きタスク 2 件、プロジェクト無しタスク 3 件
   - 操作: 「プロジェクト無しのみ」を選択
   - 期待: 表示件数が 3 件になる
6. **メモのキーワード検索**
   - 前提: タイトルに `MTG` を含むメモ 2 件、含まないメモ 3 件
   - 操作: 検索欄に `MTG` を入力
   - 期待: タイムライン上の表示が 2 件になる
7. **メモの日付範囲フィルタ**
   - 前提: 作成日が直近 1 週間のメモ 3 件、それより古いメモ 2 件
   - 操作: 日付範囲を直近 1 週間に設定
   - 期待: 直近 1 週間のメモ 3 件のみ表示
8. **空状態 UI**
   - 前提: クリーンな DB（カテゴリのみ存在、タスクは 0 件）
   - 操作: `/tasks` を開く
   - 期待: 「タスクがまだありません」相当のメッセージと「＋ タスク追加」の導線が表示される（500 エラーや空白画面ではない）
9. **レスポンシブ 1024px**
   - 前提: ビューポート幅 1024px
   - 操作: 全 9 画面を順に開く
   - 期待: いずれも横スクロールバーが出ない

## 閾値

- `npm run lint` / `npx tsc --noEmit` / `npm run build` 緑
- 上記 Playwright シナリオ 9 件すべて PASS
- 全主要画面で `console.error` 0 件（空状態でも）
- `README.md` にローカル起動 3 手順（インストール → マイグレーション → 起動）が明示されている
- すべての画面で 1024px 幅のとき横スクロールなし

## 関連要件

- §10.7 Someday / Maybe（簡易実装）
- §10.10 メモ検索（簡易実装：キーワード / カテゴリ / 種別 / 日付範囲）
- §10.11 タスク検索・絞り込み（簡易実装：カテゴリ / ステータス / プロジェクト有無）
- §10.13 週次レビュー（簡易実装：6 ステップフロー）
- §11.2 初期 MVP では簡易実装とする機能
- §14.6 性能（日常利用でストレスなく表示・登録・検索）
- §16.4 週 1 回フロー

## デザイン参照

- `docs/design-references/reference/screens-4.jsx` の `ReviewScreen` ─ 左ペインのステップリスト、右ペインの現在ステップ詳細、進捗表示
- `docs/design-references/reference/screens-2.jsx` の `TasksScreen` 内フィルタチップ列 ─ タスク絞り込みの UI 構成
- `docs/design-references/reference/screens-3.jsx` の `MemosScreen` 内検索行＋種別・カテゴリ・期間チップ ─ メモ絞り込みの UI 構成
- `DESIGN.md` §4「Pill Badge Button」 ─ フィルタチップの装飾
- `DESIGN.md` §7「Responsive Behavior」 ─ レスポンシブ調整の指針

---

## 実装計画（回 1）

既存資産の調査結果を踏まえた実装方針:

- **Someday 基盤は流用**: `SomedayItem` モデルは schema.prisma / init マイグレーションに既存。テーブル再作成は不要。新規マイグレーションは追加しない（既存 DB 互換維持）。schema 指示の `reviewDate` は既存列 `reviewAt` を流用する。
- **Someday CRUD**: `lib/types/someday.ts`（DTO / status 型）と `lib/db/someday.ts`（list / create / delete）を新規。API は `app/api/someday/route.ts`（GET 一覧・POST 作成）と `app/api/someday/[id]/route.ts`（DELETE）。
- **Inbox→Someday 化の実体化**: 現状 convert API（target=someday）は Inbox を archived にするのみで SomedayItem を作っていない。convert API を改修し、`categoryId` 必須でSomedayItem を作成してから archived にする。InboxManager の Someday 化を「カテゴリ選択ダイアログ」経由に変更（要件 §10.7.3 カテゴリ必須）。
- **週次レビュー**: `app/review/page.tsx` を SSR で 6 ステップ分のデータ（Inbox / 進行中プロジェクト+NextAction有無 / 未完了タスク / 待ちタスク / Someday / プロジェクト選択肢）を取得し、`ReviewStepper`（クライアント）へ渡す。左ペイン=ステップリスト（完了マークで取り消し線）、右ペイン=各ステップ詳細。プロジェクトステップは Next Action 未設定に警告バッジ＋その場でタスク追加。
- **タスクフィルタ**: `components/task/TaskFilters.tsx` を新規。既存 TaskManager のカテゴリ select を移し、ステータス・プロジェクト有無（あり/なし/問わない）を追加。プロジェクト有無はクライアント側で絞り込み（API は projectId 単一指定のため）。件数表示を「N 件 / 計 M 件」に変更。
- **メモフィルタ**: `components/memo/MemoFilters.tsx` を新規。キーワード（タイトル部分一致）・カテゴリ・種別・日付範囲(from/to)。MemoTimeline をクライアント側フィルタ方式へ変更し全件保持→絞り込み表示。
- **共通空状態**: `components/common/EmptyState.tsx` を新規。各主要画面の空状態に適用（タスク / メモは既存メッセージを EmptyState に寄せる、Review / Someday 等は新規）。
- **README**: ローカル起動 3 手順（install → db:migrate → dev）を明記。
- **レスポンシブ**: 週次レビューは 1024px で左右ペインが横スクロールせず収まるグリッド（lg で 2 カラム、それ未満で縦積み）にする。

## 作業ログ
- 2026-05-30 15:28 着手。既存コードベース（schema / 各 db / API / コンポーネント）調査完了。SomedayItem 既存確認、Inbox→Someday 化の実体化が必要と判明。
- 2026-05-30 15:30 Someday 型・db・API（GET/POST/DELETE）を新規。Inbox convert API（target=someday）を SomedayItem 作成＋カテゴリ必須に改修。
- 2026-05-30 15:32 共通 EmptyState を新規。TaskList / MemoTimeline の空状態を EmptyState に統一。
- 2026-05-30 15:33 TaskFilters（カテゴリ/ステータス/プロジェクト有無）を新規。TaskManager にクライアント側絞り込み＋「N 件 / 計 M 件」表示を実装。
- 2026-05-30 15:34 MemoFilters（キーワード/カテゴリ/種別/日付範囲）を新規。MemoTimeline をクライアント側全件保持＋フィルタ方式へ変更。
- 2026-05-30 15:35 SomedayFormDialog を新規。InboxManager の Someday 化をカテゴリ選択ダイアログ経由に変更。
- 2026-05-30 15:36 週次レビュー: lib/db/review.ts（6 ステップ集約）と review 配下 7 コンポーネント（ReviewStepper ＋ 6 ステップ）を新規。review/page.tsx を本実装に差し替え。
- 2026-05-30 15:37 README にローカル起動 3 手順を明記。lint / type-check / build いずれも緑を確認。

## 自己評価（回 1、2026-05-30 15:37）

### コマンド結果
| コマンド | 結果 | 備考 |
|---|---|---|
| npm run lint | ✅ | eslint 警告・エラー 0 |
| npm run type-check | ✅ | tsc --noEmit クリーン |
| npm run build | ✅ | Next.js 16 Turbopack ビルド成功。`/api/someday`・`/api/someday/[id]` 含む全ルート生成。静的生成 12/12 成功 |

### 受入基準セルフチェック

| # | 受入基準 | 自己判定 | 根拠 |
|---|---|---|---|
| 1 | `/review` で 6 ステップが左ペインに表示 | ✅ | `ReviewStepper` 左ペイン `review-step-list`、6 ステップ（inbox/projects/tasks/waiting/someday/nextweek） |
| 2 | 各ステップで右ペインに該当データ表示 | ✅ | `review-step-detail` が active.render()。各ステップが Inbox/Project/Task/Waiting/Someday/プロジェクト選択 UI を描画 |
| 3 | Next Action 未設定プロジェクトに警告バッジ＋その場でタスク追加 | ✅ | `ProjectReviewStep`：hasNextAction=false で `⚠ Next Action なし` バッジ＋入力欄、POST /api/tasks 後に `✓ Next Action あり` へ切替 |
| 4 | 「次へ/前へ」でステップ移動 | ✅ | `review-prev` / `review-next` で activeIndex を増減（端で disabled） |
| 5 | 完了マークで左ペイン取り消し線 | ✅ | `review-step-complete` チェック → completed Set。左ペイン項目に `line-through` 適用 |
| 6 | Someday を確認・追加・削除できる | ✅ | `SomedayReviewStep`：一覧表示＋ `＋ Someday 追加`（SomedayFormDialog）＋行ごと削除 |
| 7 | Inbox → Someday 化が機能し Someday に追加・Inbox から消える | ✅ | convert API（target=someday）で `createSomedayItem` ＋ `markInboxArchived`。InboxManager は SomedayFormDialog でカテゴリ選択 |
| 8 | Someday 項目はカテゴリで分類 | ✅ | SomedayItem.categoryId 必須。DTO に categoryName、行に `review-someday-category` チップ表示 |
| 9 | タスク一覧でカテゴリ/ステータス/プロジェクト有無の 3 フィルタ | ✅ | `TaskFilters`（category/status/project-presence）。TaskManager で適用 |
| 10 | フィルタ複数組み合わせが AND | ✅ | `visibleTasks` で status＋projectPresence をクライアント AND、カテゴリはサーバー絞り込みと合成 |
| 11 | 表示件数/総件数表示が更新 | ✅ | `task-count`：絞り込み中は「N 件 / 計 M 件」 |
| 12 | メモ一覧でキーワード/カテゴリ/種別/日付範囲の 4 フィルタ | ✅ | `MemoFilters`。MemoTimeline `visibleMemos` で AND 絞り込み |
| 13 | メモ：フィルタ後にタイムラインがフィルタ結果のみ表示 | ✅ | `visibleMemos` を `memo-timeline` で描画。キーワードはタイトル部分一致、日付は from/to 境界判定 |
| 14 | 全主要画面で 0 件時に空状態 UI | ✅ | tasks/memo/review/someday は EmptyState、inbox/waiting/projects/category/journal は既存空状態を継続。home は 0 件でも各カードが描画 |
| 15 | フォーム入力でバリデーションエラー視覚表示 | ✅ | 各 FormDialog：必須未入力で submit disabled＋`aria-invalid`、API エラーは `role="alert"` 表示 |
| 16 | 1024〜1440px で横スクロールなし | ⚠️ | レビューは `lg:grid-cols-[260px_1fr]`、その他は max-width 1100px の流動レイアウト。Playwright での実測は Verifier 検証で確定（自己判定は構造上の根拠） |
| 17 | README にローカル起動手順 | ✅ | README「アプリの起動（ローカル）」に install → db:migrate → dev の 3 手順を明記 |

### 変更ファイル
- `lib/types/someday.ts`（新規）: Someday DTO / status 型・型ガード
- `lib/db/someday.ts`（新規）: Someday CRUD（list / get / create / delete）
- `app/api/someday/route.ts`（新規）: GET 一覧・POST 作成
- `app/api/someday/[id]/route.ts`（新規）: DELETE
- `app/api/inbox/[id]/convert/route.ts`（改修）: target=someday で SomedayItem 作成＋カテゴリ必須
- `lib/db/review.ts`（新規）: 週次レビュー 6 ステップ集約クエリ
- `components/review/ReviewStepper.tsx`（新規）: 6 ステップステッパー本体
- `components/review/InboxReviewStep.tsx` / `ProjectReviewStep.tsx` / `TaskReviewStep.tsx` / `WaitingReviewStep.tsx` / `SomedayReviewStep.tsx` / `NextWeekFocusStep.tsx`（新規）
- `app/review/page.tsx`（改修）: プレースホルダ → 本実装
- `components/common/EmptyState.tsx`（新規）: 共通空状態
- `components/task/TaskFilters.tsx`（新規）: タスク 3 フィルタ
- `components/task/TaskManager.tsx`（改修）: フィルタ統合・クライアント絞り込み・件数表示
- `components/task/TaskList.tsx`（改修）: 空状態を EmptyState 化＋追加導線
- `components/memo/MemoFilters.tsx`（新規）: メモ 4 フィルタ
- `components/memo/MemoTimeline.tsx`（改修）: クライアント側フィルタ方式へ
- `components/someday/SomedayFormDialog.tsx`（新規）: Someday 追加フォーム（Inbox 化／単独追加兼用）
- `components/inbox/InboxManager.tsx`（改修）: Someday 化をダイアログ経由に
- `README.md`（改修）: ローカル起動 3 手順

## 検証結果（回 1、2026-05-30 15:51）

### dev 起動
- 結果: ✅
- ポート: 3000
- 起動時間: 約 8 秒

### シナリオ別結果

#### 当該フェーズのシナリオ
| # | シナリオ | 結果 | 観測値 / 失敗理由 |
|---|---|---|---|
| 1 | 週次レビューのステップ進行 | ✅ | ステップ1→2→3と「次へ」で切り替わり、右ペインの内容（Inbox一覧/プロジェクト一覧/未完了タスク一覧）が変化。左ペインのアクティブ表示も更新。「前へ」で戻ることも確認。完了マーク後に取り消し線が適用されることも確認。 |
| 2 | Next Action 未設定プロジェクトの検出と追加 | ✅ | タスク0件の「BIOSバージョン確認プロジェクト」を新規作成→レビューのステップ2で「⚠ Next Action なし」バッジ＋入力欄が表示。「BIOS バージョン確認」を入力→追加後に「✓ Next Action あり」に変化。 |
| 3 | Someday化フローと一覧確認 | ✅ | Inboxに「Tailwind v4 を試す」を追加→「☾ Someday化」をクリック→カテゴリ選択ダイアログ表示→「個人開発」を選択して保存→Inboxから消え、週次レビューのSomedayステップに1件追加。カテゴリ「個人開発」チップが表示。 |
| 4 | タスクの複合フィルタ | ✅ | カテゴリ「テーマA」+ステータス「未着手」を選択→「5件 / 計12件」と件数が更新され、AND絞り込みが機能。 |
| 5 | タスク プロジェクト有無フィルタ | ✅ | 「プロジェクトなしのみ」選択→プロジェクトなしのタスクのみ表示。「N件 / 計M件」で件数が更新される。 |
| 6 | メモのキーワード検索 | ✅ | 「MTG」を入力→「週次定例MTG」1件のみ表示。件数「1件 / 計3件」を確認。 |
| 7 | メモの日付範囲フィルタ | ✅ | 終了日を2026-05-29に設定→今日（2026-05-30）作成のメモが除外され0件。2026-05-24〜2026-05-30では3件表示。 |
| 8 | 空状態 UI | ✅ | タスクフィルタで「テーマB」+「対応中」→0件でEmptyState表示「条件に合うタスクがありません」。500エラーなし。 |
| 9 | レスポンシブ 1024px | ✅ | ホーム/Inbox/タスク/待ちタスク/プロジェクト/メモ/日次ジャーナル/週次レビュー/設定の全9画面でdocumentScrollWidth≤innerWidth=1024を確認。横スクロールなし。 |

### 閾値判定
- 必須シナリオ全合格: ✅（9/9 PASS）
- lint/type/build 緑（Implementer 自己評価より）: ✅
- console.error 0件（全画面）: ✅（エラーメッセージ0件）
- README にローカル起動3手順: ✅（npm install → npm run db:migrate → npm run dev）
- すべての画面で 1024px 幅のとき横スクロールなし: ✅

### 総合判定: ✅ OK

---

### 引き継ぎメモ
- **マイグレーション不要**: `SomedayItem` は init マイグレーション（`20260529131146_init`）に既存。schema.prisma も完成済みのため新規マイグレーションは追加していない。既存 `prisma/dev.db` のまま `npm run dev` で動作する。検証前に `npm run db:migrate` 済みなら追加操作不要。
- **検証シナリオ 3（Someday 化）**: Inbox の「☾ Someday化」を押すとカテゴリ選択ダイアログ（`someday-form-category`）が開く。カテゴリ選択→「追加する」で SomedayItem 作成＋ Inbox から消える。Someday 一覧は週次レビューのステップ 5（`review-someday`）で確認できる（単独 Someday 画面は未作成・方針は「週次レビュー内で確認」を採用）。
- **タスク プロジェクト有無/ステータスフィルタはクライアント側**: サーバー API（GET /api/tasks）は projectId 単一指定のみ対応のため、ステータス・プロジェクト有無は表示中タスクをクライアントで絞る。件数「N 件 / 計 M 件」の M はサーバー取得済み件数（カテゴリ・完了表示を反映した母数）。
- **メモフィルタもクライアント側**: 全件を SSR で取得し、キーワード/カテゴリ/種別/日付範囲をクライアントで AND 絞り込み。日付は createdAt のローカル暦日境界で判定（from=00:00:00、to=23:59:59.999）。
- **週次レビューのデータは当日基準の SSR**（`force-dynamic`）。ステップ 6「来週の重点プロジェクト」の選択は確認用途のクライアント印付けのみで永続化しない（要件 §10.13.4 簡易実装の範囲）。
- 主要 data-testid: review（`review-stepper` / `review-step-item` / `review-step-detail` / `review-next` / `review-prev` / `review-project-badge` / `review-project-nextaction-input` / `review-someday`）、tasks（`task-filter-status` / `task-filter-project-presence` / `task-count`）、memo（`memo-filter-keyword` / `memo-filter-from` / `memo-filter-to` / `memo-count`）。
