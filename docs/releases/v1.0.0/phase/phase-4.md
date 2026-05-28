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
