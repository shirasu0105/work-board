---
description: アクティブリリースを確定する。全チケット/フェーズ [x] を確認し、release-notes.md を生成、roadmap.md の status を released にロックする。
argument-hint: （引数なし）
---


アクティブリリースを「draft → released」に確定し、リリースノートを生成してください。git tag や push は人手なので案内のみ。

## アクティブリリースの解決

`docs/releases/` 配下を `Glob` で列挙し、frontmatter `status: draft` のディレクトリを探す。

- 見つからない場合: 「確定可能な draft リリースがない」とユーザーに報告して中断。
- 複数あった場合: 最大 semver を採用（通常は 1 つしか存在しないはず）。

`<release-dir>` = `docs/releases/v<x.y.z>/`

## 完了チェック

`<release-dir>/roadmap.md` を Read し、以下を機械的にチェック:

- すべてのフェーズが `- [x]` か
- release モードのときは、すべてのチケット行も `- [x]` か
- すべての `<release-dir>/ticket/ticket-<id>.md` の frontmatter `status: done` か

未完了がある場合は、未完了のフェーズ・チケット ID を列挙してユーザーに報告し、中断。

## 使い方説明書との乖離チェック（軽量チェックリスト方式）

`Bash` で以下を実行する:

```bash
node scripts/check-manual-drift.mjs
```

このスクリプトは以下を行う（`scripts/check-manual-drift.mjs` 本体に詳細）：

1. `app/(app)/**/page.tsx` を列挙してアプリの実装ルート一覧を取得
2. `.harness/manuals/user-guide.md` の `## 画面・機能チェックリスト` セクションから `### /<route>` 形式の項目を抽出
3. アクティブリリースの `ticket/ticket-*.md` のうち type が `feature` / `ui-ux` のチケットを抽出
4. 突合し、結果を `<release-dir>/manual-drift.md` として出力（差分なしなら「✅ 差分なし」の 1 セクションのみ）

manual-drift.md に ❌ が含まれていても `/finalize-release` 自体は中断しない（軽量指摘のみ）。ユーザーへ「`.harness/manuals/user-guide.md` を更新 → `npm run build:manuals` → 再 finalize」を案内する。

CI で乖離検出だけしたい場合は `npm run check:manual` で exit 1 になる（ファイル出力なし）。

## release-notes.md の生成

`<release-dir>/release-notes.md` に以下を書く:

```markdown
---
version: v<x.y.z>
released_at: <yyyy-MM-dd>
based_on: v<前バージョン>
mode: <mvp | release>
---

# Release v<x.y.z>

## 概要
<1〜3 文。リリースの目的と主な変更>

## 変更内容

### 機能追加（feature）
- ticket-<id>: <チケットタイトル>
- ...

### バグ修正（bugfix）
- ticket-<id>: <チケットタイトル>
- ...

### UI/UX 改善（ui-ux）
- ticket-<id>: <チケットタイトル>
- ...

### リファクタリング（refactor）
- ticket-<id>: <チケットタイトル>
- ...

## 影響範囲（チケット横断サマリ）
- 主要な変更ファイル群
- API スキーマ変更
- DB / 永続データの変更

## 検証
- 当該リリースのフェーズ数: <N>
- 当該リリースのチケット数: <M>
- 関連過去シナリオ併走数（regression_targets）: <K>
- すべて PASS

## 説明書整合
- `docs/manuals/user-guide.md` との差分: なし / `manual-drift.md` 参照

## アップグレードノート（あれば）
<破壊的変更がある場合の移行手順。なければ「特になし」>
```

#### mvp モードの場合

チケット概念がないので、変更内容セクションは「フェーズ別」に置き換える:

```markdown
## 変更内容（フェーズ別）
- Phase 1: <名前> ─ <成果サマリ>
- Phase 2: <名前> ─ <成果サマリ>
- ...
```

## roadmap.md のロック

`<release-dir>/roadmap.md` の frontmatter `status: draft` を `status: released` に書き換え、ヘッダの `**現時点**` を「リリース確定（yyyy-MM-dd）」に更新。

## 完了報告（メインスレッドへ）

- 確定したバージョン（v<x.y.z>）
- フェーズ数 / チケット数 / type 別チケット内訳
- 生成した release-notes.md のパス
- `manual-drift.md` の有無（あれば「user-guide.md 更新が必要」と案内）
- ユーザー TODO:
  - 必要なら `.harness/manuals/user-guide.md` を更新 → `npm run build:manuals`
  - `git add docs/releases/v<x.y.z>/ docs/manuals/` でステージング
  - `git commit -m "chore: finalize v<x.y.z>"` で確定
  - `git tag v<x.y.z>` でタグ付け（任意）
  - 必要なら `git push` と `git push --tags`
- 次のリリースは `/plan-release` で開始できる旨

## 注意

- 既に released のリリースに対しては実行しない（draft のみ対象）。
- ロック後は `/implement-phase` で書き換えられない（過去 released として扱われる）。
- git 操作は一切しない。コミット・タグ付けはユーザー手動。
