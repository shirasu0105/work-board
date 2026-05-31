# 仕事効率化Webアプリ（work-board）設計仕様書 v1.0

要件定義書: `docs/requirements.md` v0.1 を実装可能粒度に具体化したもの。
次工程（実装）は本書とマイルストーン計画に沿って段階的に構築する。

## 1. 技術スタックと前提

| 項目 | 採用 |
|---|---|
| フレームワーク | Next.js 16.2.6（App Router） |
| 言語 | TypeScript 5 / React 19 |
| スタイリング | Tailwind CSS v4（`@theme` トークン、ライト/ダーク両対応） |
| DB | SQLite（ファイル: `./data/work-board.db`） |
| DBアクセス | Drizzle ORM + better-sqlite3（同期ドライバ） |
| マイグレーション | drizzle-kit |
| データ処理 | Server Components（読み）+ Server Actions（書き）主軸 |
| 入力検証 | zod（Server Action 境界で検証） |
| D&D | @dnd-kit（@dnd-kit/core, @dnd-kit/sortable） |
| テスト | Vitest（ドメインロジック）+ Playwright（主要動線E2E） |

> **重要（AGENTS.md）**: 本リポジトリの Next.js は破壊的変更を含む版。コード記述前に `npm install` 後、`node_modules/next/dist/docs/` の該当ガイドを必ず読むこと。
> **better-sqlite3 はネイティブモジュール**。Next の `serverExternalPackages`（旧 `serverComponentsExternalPackages`）への登録が必要になる可能性が高い。導入時に最新ドキュメントで確認する。

## 2. ディレクトリ構成（src/ 集約）

現状ルートの `app/` を `src/app/` へ移動し、`tsconfig.json` の path alias を `@/* -> src/*` に設定する。

```
src/
  app/
    layout.tsx                 # ルートレイアウト（サイドバー / テーマ）
    globals.css                # Tailwind v4 @theme トークン（light/dark）
    page.tsx                   # ホーム（2カラム）
    inbox/page.tsx             # Inbox（追加 + D&D整理）
    tasks/page.tsx             # タスク（リスト/かんばんトグル、待ちフィルタ）
    projects/page.tsx
    memos/page.tsx             # メモ一覧 + 検索バー
    memos/new/page.tsx         # メモ作成（種別選択でフォーム切替）
    memos/[id]/page.tsx        # メモ閲覧/編集（専用ページ）
    journal/page.tsx           # 日次ジャーナル
    review/page.tsx            # 週次レビュー（1画面チェックリスト）
    settings/page.tsx          # カテゴリ管理
  components/
    layout/                    # Sidebar(固定), Header, ThemeToggle
    ui/                        # Button, Card, Input, Select, Textarea, Badge, Modal, Drawer, EmptyState …（light/dark対応）
    dnd/                       # DndContext ラッパ, SortableItem, DroppableColumn 等（@dnd-kit）
    tasks/                     # TaskListView, TaskBoardView, TaskCard, TaskFormDrawer, ViewToggle, StatusFilter
    <feature>/                 # 各機能のフォーム/一覧コンポーネント（作成編集はモーダル/ドロワー）
  lib/
    db/
      index.ts                 # drizzle クライアント（better-sqlite3）
      schema.ts                # 全テーブル定義
      seed.ts                  # サンプルシード
    actions/                   # Server Actions（ドメイン別: categories.ts, projects.ts, tasks.ts, inbox.ts, someday.ts, memos.ts, journal.ts, review.ts）
    domain/                    # 純粋ロジック（待ち日数, 今日やること抽出, Inbox整理, 経過日数 等）← ユニットテスト対象
    validation/                # zod スキーマ（種別別メモ含む）
drizzle/                       # 生成マイグレーション
drizzle.config.ts
data/                          # SQLite ファイル（.gitignore）
tests/
  unit/                        # Vitest
  e2e/                         # Playwright
```

## 3. データモデル（Drizzle / SQLite）

共通方針: `id` は文字列（cuid/uuid）。`created_at` / `updated_at` は ISO 文字列。論理削除/非表示は専用フラグで表現。

### 3.1 categories（カテゴリ）
| 列 | 型 | 備考 |
|---|---|---|
| id | text PK | |
| name | text NOT NULL | カテゴリ名（必須） |
| description | text | 説明（任意） |
| display_order | integer | 表示順 |
| is_active | integer(bool) default 1 | 非表示=0（編集・非表示対応、物理削除しない） |
| created_at / updated_at | text | |

### 3.2 projects（プロジェクト）
| 列 | 型 | 備考 |
|---|---|---|
| id | text PK | |
| name | text NOT NULL | 必須 |
| category_id | text FK→categories NOT NULL | 必須 |
| purpose | text | 目的（任意） |
| completion_condition | text | 完了条件（任意・推奨） |
| due_date | text | 期限（任意） |
| status | text default 'active' | active / completed |
| display_order | integer | |
| created_at / updated_at / completed_at | text | completed_at は完了時 |

### 3.3 tasks（タスク）— 待ち状態カラムを内包
| 列 | 型 | 備考 |
|---|---|---|
| id | text PK | |
| name | text NOT NULL | 必須 |
| category_id | text FK NOT NULL | 必須 |
| project_id | text FK nullable | 任意 |
| due_date | text | 期限（任意） |
| planned_date | text nullable | **「今日/明日やること」の予定日** |
| memo | text | 任意 |
| status | text default '未着手' | 未着手/対応中/待ち/保留/完了 |
| display_order | integer | |
| source_inbox_id | text nullable | 関連元 Inbox |
| waiting_for | text | 待ち相手（status=待ち時に必須） |
| waiting_reason | text | 待ち理由（同上） |
| waiting_check_date | text | 確認予定日（任意） |
| waiting_request_memo | text | 依頼メモ（任意） |
| waiting_started_at | text | 待ち開始日（自動） |
| waiting_ended_at | text | 待ち終了日（自動） |
| waiting_reply_memo | text | 返答メモ（任意） |
| created_at / updated_at / completed_at | text | |

### 3.4 inbox_items（Inbox）
| 列 | 型 | 備考 |
|---|---|---|
| id | text PK | |
| content | text NOT NULL | 必須 |
| status | text default '未整理' | 未整理 / 整理済み |
| organized_to | text nullable | task / project / someday / deleted |
| related_id | text nullable | 整理先のID（関連元として残す） |
| organized_at | text nullable | |
| created_at / updated_at | text | |

### 3.5 someday_items（Someday/Maybe・簡易）
| 列 | 型 | 備考 |
|---|---|---|
| id | text PK | |
| content | text NOT NULL | 必須 |
| category_id | text FK NOT NULL | 必須 |
| reason | text | 任意 |
| review_date | text | 見直し日（任意） |
| status | text default 'active' | active / promoted / dropped |
| source_inbox_id | text nullable | |
| created_at / updated_at | text | |

### 3.6 memos（メモ）— 共通列 + 種別別 JSON
| 列 | 型 | 備考 |
|---|---|---|
| id | text PK | |
| title | text NOT NULL | タイトル（議事録=会議名/調査=調査テーマ も title に格納） |
| category_id | text FK NOT NULL | 必須 |
| memo_type | text NOT NULL | minutes / tt / idea / research / worklog |
| project_id | text FK nullable | 関連プロジェクト（任意） |
| content | text(JSON) | 種別別項目を JSON で保持 |
| created_at / updated_at | text | |

種別別 `content` JSON スキーマ（zod で定義・検証）:
- minutes（議事録）: `{ datetime, participants, purpose, agenda, decisions, todos, myNextAction }`
- tt（TTメモ）: `{ from, background, learned, fact, abstraction, application }`
- idea（思いつきメモ）: `{ content, fact, abstraction, application, taskCandidate, somedayCandidate }`
- research（調査メモ）: `{ content, findings, conclusion, nextToConfirm }`（テーマは title）
- worklog（作業ログ）: `{ work, result, blockers, handling, nextToDo }`

### 3.7 daily_journals（日次ジャーナル）
| 列 | 型 | 備考 |
|---|---|---|
| id | text PK | |
| journal_date | text UNIQUE NOT NULL | 対象日 |
| today_comment | text NOT NULL | 今日のひとこと（必須） |
| created_at / updated_at | text | |

「明日やること」は中間テーブルを設けず、選択タスクの `tasks.planned_date` を対象日の翌日にセットして表現する。

### 3.8 weekly_reviews（週次レビュー・実施記録のみ）
| 列 | 型 | 備考 |
|---|---|---|
| id | text PK | |
| week_of | text | 対象週（週初日） |
| reviewed_at | text NOT NULL | 実施日時 |
| note | text nullable | 任意メモ |
| created_at | text | |

## 4. ドメインロジック（lib/domain・ユニットテスト対象）

- 待ち日数 = 今日 − `waiting_started_at`（待ち一覧表示用）
- 経過日数 / Inbox未整理日数 / 期限までの日数の算出
- 今日やること抽出: `status != 完了 && planned_date == 今日` のタスク
- 確認予定日を迎えた待ちタスク抽出: `status == 待ち && waiting_check_date <= 今日`
- Inbox整理: 指定 Inbox から task/project/someday を生成し、元 Inbox を `整理済み` + `related_id` 更新（トランザクション）
- 待ち開始/解除の状態遷移（解除後は未着手/対応中、初期値=未着手）
- 並び替え: D&D結果から `display_order` を再採番（リスト内・かんばん列内）
- ステータス遷移: かんばん列間ドロップで `status` 更新（`待ち` へ移すときは待ち必須項目の入力を促す）

## 4.5 D&D・表示インタラクション（UI仕様）

- ライブラリ: @dnd-kit。`待ち`含む全操作はサーバ更新後に再検証（`revalidatePath`）。
- **タスクかんばん**: 列=ステータス5種（未着手/対応中/待ち/保留/完了）。カードを列間D&Dで `status` 変更、列内D&Dで `display_order` 並び替え。`待ち` へドロップ時は待ち相手/理由の入力ドロワーを開く。
- **タスクリスト**: 行のD&Dで `display_order` 並び替え。`/tasks` 上部の **ViewToggle** でリスト⇔かんばんを切替（選択状態を保持）、隣に **StatusFilter**（待ち選択時は待ち相手/理由/開始日/確認予定日/待ち日数の列を追加表示＝要件10.6.4を充足）。
- **Inbox整理D&D**: Inbox項目を「タスク化/プロジェクト化/Someday化/削除」のドロップ先（DroppableColumn）へドラッグして整理。
- **今日やることD&D**: タスクを「今日/明日やること」領域へドロップして `planned_date` をセット。
- **作成・編集**: タスク/プロジェクト/Inbox はモーダルまたは右ドロワー（一覧の文脈を保持）。メモは項目が多いため専用ページ。
- **クイック追加**: グローバルには設けない。Inbox は `/inbox` 画面の入力欄から追加。

## 5. 画面仕様（要件 §12 準拠 + 待ち一覧追加）

| ルート | 画面 | 主な内容 |
|---|---|---|
| `/` | ホーム | **2カラム**。左=今日やること（主役・D&D対応）、右=確認予定日を迎えた待ちタスク / Inbox未整理件数 / 進行中プロジェクト / 最近のメモ / 日次ジャーナル導線 / 週次レビュー導線 をサイドカードで集約 |
| `/inbox` | Inbox | 入力欄から追加。各項目を**D&Dでタスク化/プロジェクト化/Someday化/削除**のドロップ先へ整理（ボタンでも可） |
| `/tasks` | タスク | **ViewToggleでリスト⇔かんばん**。かんばん=ステータス5列でD&D状態遷移＋並び替え、リスト=D&D並び替え。StatusFilter（待ち選択時は待ち専用列を追加）。作成/編集はモーダル/ドロワー |
| `/projects` | プロジェクト一覧 | 作成/編集/完了（モーダル/ドロワー） |
| `/memos` | メモ一覧・検索 | 上部に検索バー（キーワード/カテゴリ/メモ種別/日付範囲）、下に一覧。クリックで `/memos/[id]` へ |
| `/memos/new`・`/memos/[id]` | メモ作成/編集（専用ページ） | 種別選択でフォーム自動切替（§3.6） |
| `/journal` | 日次ジャーナル | 今日のひとこと入力 + 未完了タスクから明日やること選択（D&Dまたはチェックで planned_date セット） |
| `/review` | 週次レビュー | **1画面チェックリスト**。Inbox→PJ→タスク→待ち→Someday→来週重点 の6セクションを縦に並べ確認、最後に実施記録を保存 |
| `/settings` | 設定 | カテゴリ管理（作成/編集/非表示）。MVPでは設定対象はカテゴリのみ |

共通: **左サイドバー固定ナビ**（ホーム/Inbox/タスク/プロジェクト/メモ/ジャーナル/レビュー/設定）+ ヘッダー（テーマ切替）。ライト/ダーク両対応のデザイントークンを `globals.css` の `@theme` に定義（既存 `DESIGN.md` の配色・角丸・余白トークンを参考に整理）。**待ち専用画面は設けず**、待ちは `/tasks` の待ちフィルタとホームのサイドカードで充足。

## 6. 実装マイルストーン（段階的・各段階で検証可能）

- **M0 基盤**: `app/`→`src/app/` 移行、path alias、Drizzle + better-sqlite3 セットアップ、`schema.ts`、初回マイグレーション、`seed.ts`、左サイドバー固定レイアウト/ヘッダー/テーマ切替/UIコンポーネント（Modal・Drawer含む）、zod 基盤、@dnd-kit 導入と DnD ラッパ（`components/dnd/`）
- **M1 カテゴリ管理**（`/settings`）: CRUD + 非表示
- **M2 プロジェクト管理**（`/projects`）: CRUD + 完了（モーダル/ドロワー）
- **M3 タスク管理（リスト）**（`/tasks`）: CRUD（モーダル/ドロワー）+ ステータス + StatusFilter + リストD&D並び替え（display_order）
- **M4 タスクかんばん + 待ち**: ステータス5列のかんばん、ViewToggle、列間D&Dでステータス遷移、`待ち` ドロップ時の待ち入力ドロワー、待ち解除、待ち日数/確認予定日と待ちフィルタ列
- **M5 Inbox**（`/inbox`）: 追加 + D&D整理（タスク/プロジェクト/Someday化・削除のドロップ先、関連元保持）
- **M6 Someday/Maybe**（簡易）
- **M7 メモ**（`/memos` 系）: 種別テンプレ作成/編集（専用ページ）+ 一覧 + 検索バー
- **M8 日次ジャーナル**（`/journal`）: 今日のひとこと + 明日やること（planned_date、D&D/チェック選択）
- **M9 ホーム**（`/`）: 2カラム（今日やること主役 + サイドカード）+ 今日やることへのD&D
- **M10 週次レビュー**（`/review`）: 1画面チェックリスト + 実施記録保存
- **M11 仕上げ**: ユニット/E2E（D&D動線含む）、手動バックアップ手順、README/DESIGN/AGENTS 整合更新

## 7. 非機能・運用

- ローカルPCでブラウザ動作（`npm run dev`）。OS固有機能に非依存。
- データ保全: SQLite ファイルの手動バックアップ手順を README に記載（初期版は手動可）。
- 拡張性: 認証・AI連携・複数端末は対象外だが、構造化データ + 本書で将来拡張に備える。

## 8. MVP範囲（要件 §11 準拠）

含める: ホーム / Inbox / カテゴリ / プロジェクト / タスク / 待ち / メモ + 種別テンプレ / 日次ジャーナル。
簡易実装: Someday/Maybe・週次レビュー・タスク絞り込み・メモ検索。
対象外: タグ / 添付 / 通知 / AI連携 / 認証 / 複数ユーザー / クラウド同期 / 依存・繰り返し・優先度 / 工数管理。

## 9. 検証方法

- `npm run dev` で `http://localhost:3000`、シード済みデータでホーム表示確認
- ユニット（Vitest）: §4 のドメインロジック（待ち日数・今日やること抽出・Inbox整理・display_order再採番・ステータス遷移）
- E2E（Playwright）主要動線: タスク作成→完了 / かんばんで列間D&D→ステータス変更が永続化 / 日次ジャーナルで明日やること選択→翌日ホームに今日やること表示 / タスクを待ちに→`/tasks` 待ちフィルタで待ち列表示→解除 / Inbox項目をD&Dでタスク化（関連元保持）/ メモ種別作成→検索ヒット
