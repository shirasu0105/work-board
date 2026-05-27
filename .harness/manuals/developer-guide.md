# 開発運用ガイド — python-manager

このリポジトリを保守運用するための完全ガイド。誰でもこのドキュメントだけを読めば、ハーネスの構造を理解し、機能追加・バグ修正・リリースを最後まで遂行できることを目指す。

---

## 1. このリポジトリの全体像

`python-manager` は **Next.js 16 + React 19 + Tailwind 4 + TypeScript + Node.js** の単一ローカルアプリケーションだが、その上に **3 つの AI コーディングツールを横断で使える開発パイプライン（ハーネス）** が組み込まれている。

```
プロジェクト
├─ アプリ本体          : app/, components/, lib/   ← Next.js App Router
├─ 要件・履歴          : docs/                       ← requirements / 各リリース成果物
├─ ハーネス単一ソース  : .harness/                   ← 編集する場所
├─ ツール固有設定      : .claude/, .codex/, .github/, .vscode/  ← 自動生成
├─ 説明書             : docs/manuals/               ← 本ドキュメントの HTML 化先
└─ 補助スクリプト     : scripts/                    ← sync-harness, build-manuals
```

### 設計思想

- **単一ソース・複数ミラー**：ルール／コマンド／サブエージェント／MCP 設定は `.harness/` に 1 か所だけ書く。Claude Code・Codex CLI・GitHub Copilot 各ツールが読む実体ファイルは `npm run sync:harness` で機械的に生成される。
- **編集してよいファイル／してはいけないファイル**：`.harness/` 配下のみが編集対象。生成物には冒頭に `AUTO-GENERATED` コメントが入っており、手で書き換えると次回 sync で消える。
- **CI で乖離を検出**：`npm run check:harness` は生成物が手で改変されていないかを diff し、改変があれば exit 1。
- **3 ツールで同じパイプラインを動かせる**：Planner → Implementer → Verifier の 3 段は概念として共通。各ツールの実体ファイルへの変換は sync スクリプトが吸収する。

---

## 2. クイックスタート

### 開発者として最初にやること

```bash
git clone <this-repo>
cd python-manager
npm install
```

### ハーネスの動作確認

```bash
# 全 3 ツール用の設定を再生成
npm run sync:harness

# 生成物が .harness/ と一致しているか確認（CI でも実行）
npm run check:harness

# 説明書 HTML を生成
npm run build:manuals
```

### アプリ自体の起動

```bash
npm run dev      # localhost:3000
npm run lint
npx tsc --noEmit
npm run build
```

---

## 3. ハーネスのアーキテクチャ

### 3.1 単一ソース（`.harness/`）

| パス | 役割 | 編集者 |
|---|---|---|
| `.harness/instructions/AGENTS.md` | ハーネス全体のルール（階層・命名・semver・運用フロー）。クロスツール標準 | 人手 |
| `.harness/instructions/{claude,codex,copilot}-addendum.md` | ツール固有の追記（モデル名・サンドボックス・chat mode 挙動など） | 人手 |
| `.harness/agents/{name}.yaml` | サブエージェントのメタ（モデル・ツール権限・サンドボックス） | 人手 |
| `.harness/agents/{name}.prompt.md` | サブエージェントの本文プロンプト | 人手 |
| `.harness/commands/{name}.md` | スラッシュコマンドの本文。`{{ARGUMENTS}}` プレースホルダを使う | 人手 |
| `.harness/mcp/servers.json` | MCP サーバ一覧。`tools_only` で対象ツール限定可 | 人手 |
| `.harness/permissions/allow.json` | 各ツールの権限モデルへ展開する許可リスト | 人手 |
| `.harness/manuals/{user,developer}-guide.md` | 説明書本文。`build:manuals` で HTML 化 | 人手 |

### 3.2 ツール別生成先（自動生成）

| ツール | 生成先 | 形式 |
|---|---|---|
| Claude Code | `CLAUDE.md`、`.claude/agents/*.md`、`.claude/commands/*.md`、`.claude/settings.local.json` | Markdown + YAML frontmatter / JSON |
| Codex CLI | `AGENTS.md`、`.codex/agents/*.toml`、`.codex/prompts/*.md`、`.codex/config.toml` | TOML / Markdown |
| GitHub Copilot | `.github/copilot-instructions.md`、`.github/chatmodes/*.chatmode.md`、`.github/prompts/*.prompt.md`、`.vscode/mcp.json` | Markdown + YAML frontmatter / JSON |

### 3.3 sync スクリプトの仕組み

`scripts/sync-harness.mjs` は依存ゼロの Node 製スクリプト。最小 YAML パーサと最小 TOML シリアライザを内蔵している。動作モード：

- **write モード**（既定）：`.harness/` を読み、各ツール用ファイルを生成・上書き
- **check モード** (`--check`)：生成物と「今あるべき内容」の diff を取り、差分があれば exit 1
- **個別ツールモード** (`--tool=claude|codex|copilot`)：対象ツールだけ処理

aidesigner 関連（`.claude/agents/aidesigner-frontend.md`、`.claude/skills/aidesigner-frontend/`、`.claude/commands/aidesigner.md`）は `CLAUDE_PRESERVE` セットに登録されており、sync は触らない。これらは `npx -y @aidesigner/agent-skills upgrade` で別系統で更新する。

### 3.4 プレースホルダ変換

| 中立 | Claude | Codex | Copilot |
|---|---|---|---|
| `{{ARGUMENTS}}` | `$ARGUMENTS` | `$ARGUMENTS` | `${input:arguments:任意の引数}` |

---

## 4. リリース運用フロー

### 4.1 起動コマンド

| コマンド | 用途 | 起動者 |
|---|---|---|
| `/plan-mvp [追加要望]` | v1.0.0 初版の roadmap 生成 | 人手 |
| `/plan-release [要求リスト]` | v1.1.0 以降の保守リリース企画 | 人手 |
| `/implement-phase [N]` | アクティブリリースの 1 フェーズを実装→検証 | 人手起動、内部は自動 |
| `/finalize-release` | リリース確定＋ release-notes.md 生成 | 人手 |

### 4.2 フェーズの自動ループ（`/implement-phase`）

```
Implementer
   ↓ phase-N.md 作成・実装・lint/type/build 自己評価
   ↓ lint/type/build がいずれか赤 → 同じ Implementer を再起動（最大 3 反復）
Verifier
   ↓ Playwright で検証シナリオ実行
   ↓ NG → Implementer に差し戻し（最大 3 反復）
   ↓ OK → roadmap.md にチェック付与
```

ツール別の挙動：

- **Claude Code**：Agent ツールでサブエージェントを直接呼び出して全自動
- **Codex CLI**：`/implement-phase` のプロンプト本文がサブエージェントを順次起動
- **GitHub Copilot（VS Code）**：自動ループ非対応。chat mode を `implementer` ↔ `verifier` で手動切替して進める

### 4.3 階層と責務

```
リリース（v1.0.0、v1.1.0、…）
  ⊃ フェーズ（dev で結合テスト可能な単位、phase-N.md）
    ⊃ チケット（ユーザー要求の最小単位、ticket-N.md。受入基準と検証シナリオはここ）
```

- v1.0.0（MVP）はチケット概念なし、フェーズに直接受入基準を書く
- v1.1.0 以降は Planner がチケット化

### 4.4 進行の真実

`docs/releases/v<x.y.z>/roadmap.md` のチェックボックスがソース・オブ・トゥルース。

- フェーズ `[x]` は Verifier が全シナリオ＋ regression_targets を合格判定したときだけ
- チケット `[x]` はそのチケットを含むフェーズが `[x]` になったとき自動付与
- リリース `released` ステータスは `/finalize-release` 実行時のみ

### 4.5 semver ルール

| 変更内容 | 桁 |
|---|---|
| バグ修正のみ | patch |
| 機能追加・UI 改善 | minor |
| 破壊的変更（API・スキーマ・既存挙動の意味変更） | major |

Planner が `/plan-release` 時にチケットタグから推定してユーザー承認を取る。

---

## 5. ハーネスを変更したいとき

### 5.1 既存サブエージェントのプロンプトを書き換える

```bash
# 1. .harness/agents/<name>.prompt.md を編集
# 2. 再生成
npm run sync:harness
# 3. git diff で .claude/agents/, .codex/agents/, .github/chatmodes/ の変更を確認
```

### 5.2 新しいスラッシュコマンドを追加する

```bash
# 1. .harness/commands/<new-command>.md を作成（frontmatter に description / argument_hint / agent / followup_agent など）
# 2. 本文に {{ARGUMENTS}} で引数を参照
# 3. npm run sync:harness で 3 ツール分が一斉生成
```

### 5.3 MCP サーバを追加する

```bash
# 1. .harness/mcp/servers.json に新エントリ追加
#    - id, type (stdio/external-managed), command, args
#    - tools_only で対象ツール限定可
# 2. npm run sync:harness
```

### 5.4 サブエージェントを 1 つ追加する

```bash
# 1. .harness/agents/<new>.yaml と .harness/agents/<new>.prompt.md を作成
# 2. npm run sync:harness
# 3. .claude/agents/, .codex/agents/, .github/chatmodes/ に新ファイルが生成されるのを確認
```

### 5.5 4 つ目のツールに対応したい（将来）

`scripts/sync-harness.mjs` に `generateXxx()` 関数を追加し、`TOOLS` 既定リストに `'xxx'` を加える。中立スキーマ（`.harness/`）は変更不要。

---

## 6. 説明書 HTML の運用

### 6.1 ファイル配置

| 編集元 | 生成先 |
|---|---|
| `.harness/manuals/developer-guide.md` | `docs/manuals/developer-guide.html` |
| `.harness/manuals/user-guide.md` | `docs/manuals/user-guide.html` |

### 6.2 ビルド

```bash
npm run build:manuals
```

`scripts/build-manuals.mjs` が依存ゼロで MD→HTML 変換し、Tailwind CDN を head に挿入し、見出しから目次（TOC）を自動生成する。

### 6.3 user-guide.md と実装の乖離チェック

`/finalize-release` 内で軽量チェックリスト方式の差分検出が走る。

1. `app/(app)/**/page.tsx` を列挙してアプリのルート一覧を取得
2. user-guide.md の `## 画面・機能チェックリスト` セクションを取得
3. 直近のリリースノート（feature / ui-ux チケット）を取得
4. 未記載の項目があれば `docs/releases/v<x.y.z>/manual-drift.md` に出力
5. 人手で `.harness/manuals/user-guide.md` を更新 → `npm run build:manuals` → 再 finalize で PASS

> **重要**：user-guide.md の `## 画面・機能チェックリスト` セクションは Phase 5 で導入された差分検出が必須前提とする「契約セクション」。フォーマットを変えると検出が機能しなくなる。

---

## 7. ファイル責務まとめ

| ファイル | 書き手 | 読み手 |
|---|---|---|
| `docs/requirements.md` | ユーザー（不変） | Planner / Implementer / Verifier |
| `docs/design-references/*.png` | ユーザー（任意） | Planner |
| `DESIGN.md` | ユーザー（任意） | Planner / Implementer |
| `docs/releases/<v>/roadmap.md` | Planner（生成）/ Verifier（合格時 `[x]`）/ `/finalize-release`（`released` に） | 全員 |
| `docs/releases/<v>/ticket/ticket-N.md` | Planner（生成）/ Implementer（影響範囲を追記） | Implementer / Verifier |
| `docs/releases/<v>/phase/phase-N.md` | Implementer（実装ログ・自己評価）/ Verifier（検証結果） | 両者＋メインスレッド |
| `docs/releases/<v>/release-notes.md` | `/finalize-release`（生成） | ユーザー |
| `docs/releases/<v>/manual-drift.md` | `/finalize-release`（生成、必要時のみ） | ユーザー |
| 実装コード（`app/**`, `components/**`, `lib/**`） | Implementer | Verifier |
| `.harness/**` | 人手 | sync スクリプト |
| 生成物（`.claude/`, `.codex/`, `.github/`, `.vscode/`, ルートの CLAUDE.md / AGENTS.md） | sync スクリプト | 各 AI ツール |
| `docs/manuals/*.html` | build-manuals スクリプト | 人 |

---

## 8. アクティブリリースの解決ロジック

エージェント・コマンドが「今どのリリースを触るべきか」を判断するルール：

```
docs/releases/ 配下のディレクトリを Glob で列挙
↓
各 roadmap.md を Read し frontmatter の status を見る
  - status: released → スキップ（過去確定）
  - status: draft かつ [ ] が 1 つ以上残っている → 候補
↓
候補のうち最大 semver を採用 = アクティブリリース
↓
候補ゼロ → /plan-mvp（履歴ゼロ時）/ /plan-release（前 release 完了時）/ /finalize-release（draft 全 [x] 時）を案内して中断
```

---

## 9. 規約

- **企画は人手起動のみ**：`/plan-mvp` `/plan-release` は人が叩いた時しか動かない
- **コミット・git は人手**：エージェントは git に触らない。粒度（チケット単位／フェーズ単位）はユーザー裁量
- **過去 released リリースは不変**：`docs/releases/v<過去>/` の中身は regression_targets での Read のみ。書き換え禁止
- **AIDesigner は Claude 限定**：`tools_only: ["claude"]` フラグで Codex/Copilot 出力からは除外
- **`node.exe` 一括 kill 禁止**：dev サーバ停止は port 指定または KillShell。MCP サーバを巻き添えにしない

---

## 10. トラブルシューティング

### `npm run check:harness` が exit 1 する

生成物に手動編集が混入している。`npm run sync:harness` で再生成し、差分内容を確認したうえで `.harness/` 側を修正する。

### Codex CLI で `.codex/config.toml` が読まれない

初回起動時に `Trust this project?` で `y` を選んでいない可能性がある。`codex --reset-trust` で再選択。

### VS Code Copilot で chat mode が選択肢に出ない

VS Code を再読み込みするか、Copilot Chat 拡張のバージョンを最新化。Custom Chat Mode は比較的新しい機能。

### Verifier が dev サーバを止め損ねた

ポート 3000 を listen している node プロセスを個別停止：

```powershell
$pid_ = (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue).OwningProcess
if ($pid_) { Stop-Process -Id $pid_ -Force }
```

`taskkill /F /IM node.exe` は MCP サーバごと殺すので絶対に使わない。
