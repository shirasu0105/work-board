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
