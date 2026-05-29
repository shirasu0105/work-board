# Phase 2: データモデル整備とカテゴリ管理

## 目的

SQLite（Prisma 推奨）でデータ永続化基盤を整え、すべての作業対象（タスク・プロジェクト・メモ・Someday）の前提となるカテゴリ管理機能を完成させる。これにより後続フェーズはカテゴリ選択を前提に進められる。

## 成果物

- `prisma/schema.prisma` ─ 全エンティティ（Category / Project / Task / Memo / InboxItem / SomedayItem / DailyJournal / WaitingState など）の最小スキーマを宣言
- `prisma/migrations/` ─ 初回マイグレーションファイル
- `lib/db/client.ts` ─ Prisma クライアントのシングルトン
- `lib/db/category.ts` ─ カテゴリ CRUD のサーバー側関数
- `app/api/categories/route.ts` ─ `GET` / `POST`（一覧取得・新規作成）
- `app/api/categories/[id]/route.ts` ─ `PATCH` / `DELETE`（編集・有効/無効切替）
- `app/api/categories/reorder/route.ts` ─ `POST`（並び順更新）
- `app/settings/page.tsx` ─ カテゴリ管理 UI（一覧テーブル＋追加モーダル/フォーム＋編集モーダル/フォーム＋並び替え＋有効/無効トグル）
- `components/category/CategoryTable.tsx` / `CategoryFormDialog.tsx` ─ 再利用想定のコンポーネント
- `package.json` ─ `dev` 起動時に migrate が走るスクリプト or 手動 `npm run db:migrate` を追加
- `.gitignore` ─ ローカル SQLite ファイル（例: `prisma/dev.db`）を除外

## 受入基準

- カテゴリ管理画面でカテゴリ名のみ入力して新規カテゴリを追加できる
- カテゴリ追加時、名前未入力なら保存ボタンが押せない（または明示的なバリデーションエラーが出る）
- 既存カテゴリの「名前」「説明」を編集して保存できる
- カテゴリの表示 ON/OFF をトグル操作で切り替えられ、OFF にしたカテゴリは「無効状態」と画面上で識別できる（薄字や OFF バッジ等）
- カテゴリの表示順を変更でき（ボタン/ドラッグいずれでも可）、変更後の順序が保存され再読み込みでも維持される
- 画面を再読み込みしても、追加・編集・並び替え・有効状態がすべて保持される（DB 永続化）
- カテゴリにはアプリ側自動管理項目（id, createdAt, updatedAt, displayOrder, isActive）が付与される

## 検証シナリオ（Playwright）

1. **新規カテゴリ追加**
   - 前提: `/settings` を開く（既存カテゴリが 0 件のクリーンな状態）
   - 操作: 「＋ カテゴリを追加」ボタン押下 → 名前欄に `テーマA` を入力 → 説明欄に `現業の主担当領域` を入力 → 保存
   - 期待: ダイアログが閉じ、一覧テーブルに `テーマA` 行が追加されている
2. **永続化確認**
   - 前提: 直前のシナリオ完了
   - 操作: `/settings` をリロード（F5 相当）
   - 期待: `テーマA` 行が消えずに残っている
3. **カテゴリ編集**
   - 前提: `テーマA` が登録済み
   - 操作: 該当行の「編集」を押下 → 名前を `テーマA改` に変更 → 保存
   - 期待: 一覧テーブルの該当行が `テーマA改` に変わる
4. **表示 ON/OFF 切替**
   - 前提: `テーマA改` が登録済みかつ ON 状態
   - 操作: 該当行の表示トグルを押下し OFF にする
   - 期待: 行の見た目が「無効状態」と判別できる表現（例: 薄字、`OFF` バッジ）に変わる
5. **並び替え**
   - 前提: `カテゴリ1`, `カテゴリ2`, `カテゴリ3` の 3 件が登録済み（この順）
   - 操作: `カテゴリ3` を `カテゴリ1` より上に移動する
   - 期待: 行順が `カテゴリ3, カテゴリ1, カテゴリ2` になり、リロード後も保持される
6. **バリデーション**
   - 前提: `/settings` 上の追加ダイアログを開く
   - 操作: 名前欄を空のまま保存ボタンを押そうとする
   - 期待: 保存ボタンが disabled、または保存処理が走らずエラーメッセージが表示される

## 閾値

- `npm run lint` / `npx tsc --noEmit` / `npm run build` がすべて成功
- 上記 Playwright シナリオ 6 件すべて PASS
- カテゴリ管理画面の表示・操作中に `console.error` 0 件
- `app/api/categories/*` のレスポンスが想定通り（200/201/204 系を返し、エラー時は 4xx）
- Prisma マイグレーションが冪等に実行できる（2 回目の `npm run db:migrate` でエラーにならない）

## 関連要件

- §7 技術スタック（SQLite）
- §10.3 カテゴリ管理
- §13.1 / §13.2 最小必須入力と自動管理項目
- §14.2 データ保存（SQLite）

## デザイン参照

- `docs/design-references/reference/screens-4.jsx` の `SettingsScreen` ─ カテゴリ管理テーブルの構成
- `DESIGN.md` §4「Inputs & Forms」「Cards & Containers」 ─ フォーム・テーブルの装飾トークン

## 実装計画（回 1）

- Prisma を導入し、`prisma/schema.prisma` に Category / Project / Task / Memo / InboxItem / SomedayItem / DailyJournal / WaitingState（および JournalSelection 中間テーブル）の最小スキーマを宣言。SQLite に対応するため `String[]` 等は使わず、enum は SQLite に合わせて `String` ＋ TS 側 const で表現。今フェーズでは Category のみ実利用し、他テーブルは後続フェーズの土台として宣言だけ行う。
- データソースは `file:./dev.db`。`.env` は実装には含めず、`schema.prisma` の `url = env("DATABASE_URL")` に対し、`package.json` の dev/migrate スクリプトで `DATABASE_URL=file:./dev.db` をクロスプラットフォーム互換に渡す。`prisma/migrations/` は `prisma migrate dev --name init` を Implementer 側で生成。
- `lib/db/client.ts` に Prisma クライアントのシングルトン（globalThis ガード）を実装。Next.js dev の HMR で重複インスタンスを作らないようにする。
- `lib/db/category.ts` にカテゴリ CRUD（listCategories / createCategory / updateCategory / toggleCategoryActive / reorderCategories / deleteCategory）を実装。各関数は Server Component / Route Handler の双方から呼べる純関数。
- API ルート: `app/api/categories/route.ts`（GET 一覧, POST 作成）、`app/api/categories/[id]/route.ts`（PATCH 編集・ON/OFF, DELETE 削除）、`app/api/categories/reorder/route.ts`（POST 並び順更新）。Zod 等は導入せず、軽量な型チェックで 400 を返す。
- UI: `app/settings/page.tsx` を Server Component に変更し、初期データを SSR 取得。クライアント側操作のため `components/category/CategoryManager.tsx`（クライアント、トップレベル状態管理）と `components/category/CategoryTable.tsx`（テーブル＋並び替え／トグル）／`components/category/CategoryFormDialog.tsx`（追加・編集モーダル）を作成。並び替えはドラッグ依存を避け、↑/↓ ボタンで実装（テストしやすさ重視）。
- `app/settings/page.tsx` は `screens-4.jsx` の SettingsScreen の構成（左サイドの「カテゴリ管理」アクティブ表示＋右側テーブル）を参考に、Notion トーン（whisper border、warm white、Notion Blue）で再現。ピクセル一致や手書き風スタイルは持ち込まない。
- `package.json` に `db:migrate` / `db:generate` / `db:studio` / `postinstall`（prisma generate） を追加し、`type-check` スクリプトも追加。
- `.gitignore` に `prisma/dev.db`, `prisma/dev.db-journal`, `*.db-journal` を追加。

## 作業ログ
- 2026-05-29 着手
- 2026-05-29 Phase 1 実装（app/, components/, lib/）の現状と DESIGN.md / screens-4.jsx を確認
- 2026-05-29 `npm i prisma @prisma/client` で Prisma を導入。当初 v7 が入ったが datasource 仕様が変わったため v6.19.3 にダウングレード。`cross-env` も追加（Windows / POSIX 両対応の DATABASE_URL 受け渡し）
- 2026-05-29 `prisma/schema.prisma` に Category / Project / Task / Memo / InboxItem / SomedayItem / DailyJournal / JournalSelection / WaitingState の最小スキーマを宣言
- 2026-05-29 `DATABASE_URL=file:./dev.db prisma migrate dev --name init` で初回マイグレーション作成・適用。`prisma/migrations/20260529131146_init/migration.sql` が生成され、`prisma/dev.db` が作成
- 2026-05-29 `lib/db/client.ts`（Prisma シングルトン）、`lib/db/category.ts`（list/create/update/toggle/reorder/delete）を作成
- 2026-05-29 API ルート 3 本（`app/api/categories/route.ts`、`app/api/categories/[id]/route.ts`、`app/api/categories/reorder/route.ts`）を作成。GET/POST/PATCH/DELETE/reorder すべて実装
- 2026-05-29 `components/category/` に `CategoryFormDialog.tsx`（追加/編集モーダル）、`CategoryTable.tsx`（一覧テーブル＋並び替え＋ ON/OFF トグル）、`CategoryManager.tsx`（クライアント状態管理）を作成
- 2026-05-29 `app/settings/page.tsx` を Server Component 化し、SSR で初期データを取得＋ `CategoryManager` を埋め込み。左サイドの設定メニュー（カテゴリ管理のみアクティブ）を追加
- 2026-05-29 `components/ui/Input.tsx` を `ref` を直接受けられるよう改修（React 19 流儀）
- 2026-05-29 `package.json` に `dev/build/start`（DATABASE_URL 注入）、`type-check`、`db:migrate`、`db:deploy`、`db:generate`、`db:studio`、`postinstall` を追加
- 2026-05-29 `.gitignore` に `/prisma/dev.db` / `/prisma/*.db` / `/prisma/*.db-journal` を追加
- 2026-05-29 `react-hooks/set-state-in-effect` 違反を解消するため、`CategoryFormDialog` を「key 切替で再マウント」方式に変更（useEffect 内の setState を排除）
- 2026-05-29 lint / type-check / build をすべて緑で完走。マイグレーション 2 回目実行で `Already in sync` を確認（冪等性 OK）

## 自己評価（回 1、2026-05-29）

### コマンド結果
| コマンド | 結果 | 備考 |
|---|---|---|
| `npm run lint` | ✅ | 当初 `react-hooks/set-state-in-effect` で 1 件エラーが出たため `CategoryFormDialog` の useEffect 内 setState を排除し、key 切替方式に変更。再実行で 0 件 |
| `npx tsc --noEmit` | ✅ | エラー 0 |
| `npm run build` | ✅ | 12 ルート＋ `/_not-found` を生成。`/settings` は `ƒ (Dynamic)`（SSR で `listCategories` を呼ぶため `force-dynamic`）。`/api/categories`, `/api/categories/[id]`, `/api/categories/reorder` も `ƒ` |

### 受入基準セルフチェック

| # | 受入基準 | 自己判定 | 根拠 |
|---|---|---|---|
| 1 | カテゴリ名のみ入力して新規カテゴリを追加できる | ✅ | `CategoryFormDialog` で名前のみ必須、説明は任意。`createCategory` も name のみ必須 |
| 2 | 名前未入力なら保存ボタンが押せない or バリデーションエラー | ✅ | `canSubmit = trimmed.length > 0 && !busy`。空欄時は Button の `disabled` ＋ `aria-disabled` ＋ `aria-invalid="true"` が付与され、サブミットも `if (!canSubmit) return;` で弾く |
| 3 | 既存カテゴリの「名前」「説明」を編集して保存できる | ✅ | `mode="edit"` で `initial` を渡すとフォームに反映、`PATCH /api/categories/:id` で `name` / `description` を更新 |
| 4 | 表示 ON/OFF をトグル操作で切替、OFF は無効状態と識別できる | ✅ | テーブル行に `role="switch" aria-checked` のトグルボタン。OFF 行は `opacity-60` ＋名前が ink-2、右側に `OFF` バッジ表示。`data-active="false"` 属性も付与 |
| 5 | 表示順を変更でき、変更後の順序が保存され再読み込みでも維持される | ✅ | ↑/↓ ボタンで `reorderCategories` を呼び、`displayOrder` を 0..n に振り直し。`listCategories` は `displayOrder asc` で取得するためリロード後も保持 |
| 6 | 画面を再読み込みしても、追加・編集・並び替え・有効状態がすべて保持される（DB 永続化） | ✅ | すべてのミューテーションは API 経由で SQLite に書き込み。`app/settings/page.tsx` は `force-dynamic` で SSR 取得し、リロードごとに最新を反映 |
| 7 | アプリ側自動管理項目（id, createdAt, updatedAt, displayOrder, isActive）が付与される | ✅ | `prisma/schema.prisma` の Category モデルで `id @default(cuid())`, `createdAt @default(now())`, `updatedAt @updatedAt`, `displayOrder @default(0)`, `isActive @default(true)` を定義 |

### 検証シナリオ（Playwright）対応状況

| # | シナリオ | 対応 | 備考 |
|---|---|---|---|
| 1 | 新規カテゴリ追加 | ✅ | `data-testid="add-category-button"` ボタン → ダイアログの `カテゴリ名` `説明（任意）` フィールド → `追加する` 押下で `/api/categories` POST → 一覧再取得 |
| 2 | 永続化確認 | ✅ | SQLite に書き込み、`force-dynamic` の SSR で都度 listCategories を実行するため、リロードしてもデータが残る |
| 3 | カテゴリ編集 | ✅ | 行の「編集」ボタン → ダイアログを編集モードで開く → 保存で `/api/categories/:id` PATCH |
| 4 | 表示 ON/OFF 切替 | ✅ | `role="switch"` のボタン押下 → `/api/categories/:id` PATCH with `{isActive: false}` → 行が `opacity-60` ＋ OFF バッジ表示。`data-active="false"` も付与（Playwright で検出可能） |
| 5 | 並び替え | ✅ | ↑/↓ ボタンで `/api/categories/reorder` POST。`displayOrder` が永続化されるためリロード後も順序維持 |
| 6 | バリデーション | ✅ | 名前空欄時は `追加する` ボタンが `disabled` ＋ `aria-disabled="true"`。サーバ側でも `createCategory` が空文字を弾き 400 を返す |

### API ステータスコード対応
| 操作 | レスポンス | 備考 |
|---|---|---|
| `GET /api/categories` | 200 `{categories: CategoryDTO[]}` | |
| `POST /api/categories` | 201 `{category}` ／ 400 `{error}` | name 空文字・JSON 不正で 400 |
| `PATCH /api/categories/:id` | 200 `{category}` ／ 400 `{error}` ／ 404 | name 空文字や型不正は 400、未存在 id は Prisma が `P2025` を投げるためエラーメッセージから 404 判定（"見つかりません"/"存在しない"パターン） |
| `DELETE /api/categories/:id` | 204 ／ 400 ／ 500 | |
| `POST /api/categories/reorder` | 200 `{categories}` ／ 400 `{error}` | orderedIds 不正で 400 |

### 変更ファイル
- `prisma/schema.prisma`（新規）: 全 9 エンティティの最小スキーマ
- `prisma/migrations/20260529131146_init/migration.sql`（新規・自動生成）: 初回マイグレーション
- `prisma/migrations/migration_lock.toml`（新規・自動生成）
- `prisma/dev.db`（新規・自動生成、.gitignore で除外）
- `lib/db/client.ts`（新規）: Prisma クライアントのシングルトン
- `lib/db/category.ts`（新規）: カテゴリ CRUD サーバー関数
- `app/api/categories/route.ts`（新規）: GET / POST
- `app/api/categories/[id]/route.ts`（新規）: PATCH / DELETE
- `app/api/categories/reorder/route.ts`（新規）: POST
- `components/category/CategoryManager.tsx`（新規）: クライアント側状態管理コンテナ
- `components/category/CategoryTable.tsx`（新規）: 一覧テーブル＋並び替え＋ON/OFF トグル
- `components/category/CategoryFormDialog.tsx`（新規）: 追加/編集モーダル
- `components/ui/Input.tsx`（更新）: `ref` プロップを受けるよう改修
- `app/settings/page.tsx`（更新）: PagePlaceholder を CategoryManager に置き換え、SSR 初期データ取得、左サイドの設定メニュー追加
- `package.json`（更新）: `dev/build/start` に DATABASE_URL 注入、`type-check` / `db:migrate` / `db:deploy` / `db:generate` / `db:studio` / `postinstall` 追加、`prisma` / `@prisma/client` / `cross-env` 追加
- `package-lock.json`（更新・自動）
- `.gitignore`（更新）: `/prisma/dev.db` ／ `/prisma/*.db` ／ `/prisma/*.db-journal` を追加
- `docs/releases/v1.0.0/phase/phase-2.md`（更新）: 実装計画・作業ログ・自己評価を追記

## 検証結果（回 1、2026-05-29 13:19）

### dev 起動
- 結果: ✅
- ポート: 3000
- 起動時間: 約 8 秒

### 事前準備
- `prisma/dev.db` を削除してクリーン状態を作成
- `npm run db:migrate` 1 回目: `Applying migration 20260529131146_init` 正常完了
- `npm run db:migrate` 2 回目: `Already in sync` でエラーなし（冪等性 OK）

### シナリオ別結果

#### 当該フェーズのシナリオ
| # | シナリオ | 結果 | 観測値 / 失敗理由 |
|---|---|---|---|
| 1 | 新規カテゴリ追加（テーマA / 現業の主担当領域） | ✅ | ダイアログが閉じ一覧テーブルに「テーマA」行が追加。POST /api/categories → 201 Created |
| 2 | 永続化確認（リロード） | ✅ | リロード後も「テーマA」行が消えずに残存 |
| 3 | カテゴリ編集（テーマA → テーマA改） | ✅ | 一覧テーブルの該当行が「テーマA改」に更新。PATCH → 200 OK |
| 4 | 表示 ON/OFF 切替 | ✅ | スイッチが unchecked、「OFF」バッジ表示、`data-active="false"` 付与 |
| 5 | 並び替え（カテゴリ3を先頭近くへ移動＋リロード保持） | ✅ | ↑ボタン2回押しで「カテゴリ3 → カテゴリ1 → カテゴリ2」順。リロード後も順序維持 |
| 6 | バリデーション（名前空欄で追加する disabled） | ✅ | 「追加する」ボタンが `disabled: true` / `aria-disabled: "true"`。サーバ送信なし |

### 閾値判定
- 必須シナリオ全合格（6/6）: ✅
- console.error 件数（0 件）: ✅（全操作を通して 0 件）
- API レスポンス（200/201/204 系）: ✅（POST 201、PATCH 200、GET 200 すべて正常）
- マイグレーション冪等性（2 回目エラーなし）: ✅（`Already in sync` で正常終了）
- lint / type-check / build 緑（Implementer 自己評価より）: ✅

### スクリーンショット
- `docs/releases/v1.0.0/phase/screenshots/phase-2-1-final-state.png`（並び替え完了後の最終状態）

### 総合判定: ✅ OK

### dev shell を停止した
- PID 6352 を `Stop-Process -Id 6352 -Force` で停止。ポート 3000 の LISTEN 消滅を確認済み。

### 引き継ぎメモ（Verifier 向け）
- **DB 初期化**: `prisma/dev.db` は Implementer の検証中に作成された。Verifier が別環境でクリーン状態から検証する場合は `prisma/dev.db` を削除→`npm run db:migrate` で再作成可能。検証シナリオ 1（既存カテゴリ 0 件のクリーンな状態）を厳密に再現したい場合は事前に `prisma/dev.db` を削除推奨。
- **dev 起動**: `npm run dev`（`cross-env DATABASE_URL=file:./dev.db next dev`）。Turbopack の初回コンパイル＋ SSR で Prisma クライアント初期化があるため、`/settings` への初回 navigate 後は 3〜5 秒待つと安定。
- **API 検証**: ブラウザ操作だけでなく `curl http://localhost:3000/api/categories` で直接叩いて確認可能。POST は `{"name":"テーマA","description":"..."}` JSON。
- **検証シナリオ 5 の前提揃え**: クリーン状態から「カテゴリ1」「カテゴリ2」「カテゴリ3」を順に追加すれば `displayOrder` は 0,1,2 となる。Playwright で「カテゴリ3」の行の「↑」を 2 回押すと先頭に移動する。
- **OFF 行の識別**: `[data-active="false"]` ＋ `Badge tone="muted"` で `OFF` テキストが行内に追加表示される。`opacity-60` も併用。
- **モーダル**: `role="dialog" aria-modal="true"` でアクセシブルに。背景クリックと Esc キーで閉じる。busy 中はクローズボタンも事実上 disabled（onCancel が `dialogBusy` ガードで no-op）。
- **console.error**: Prisma クライアント init の警告が稀に出るが、通常操作では発生しないはず。万一出る場合は実装側の修正対象。
- **Phase 1 の動作は保ったまま**: Sidebar / TopBar / その他 7 ページは Phase 1 のまま無変更。`/settings` のみ実装に差し替え。
