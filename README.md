# python-manager

仕事効率化Webアプリ

## アプリの起動（ローカル）

仕事効率化Webアプリ（個人利用・ローカル起動）。SQLite に永続化する。
初回はマイグレーションで DB（`prisma/dev.db`）を作成してから起動する。

```bash
# 1. 依存関係をインストール
npm install

# 2. データベースをマイグレーション（初回・スキーマ変更時）
npm run db:migrate

# 3. 開発サーバーを起動
npm run dev
```

→ <http://localhost:3000> を開く。サイドナビからホーム / Inbox / タスク / 待ちタスク / プロジェクト / メモ / 日次ジャーナル / 週次レビュー / 設定の各画面に遷移できる。
カテゴリが未登録の場合は、まず「設定」画面でカテゴリを作成する。

ビルド／型チェック／lint:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

詳細な使い方は [`docs/manuals/user-guide.html`](docs/manuals/user-guide.html) を参照（編集元は `.harness/manuals/user-guide.md`、`npm run build:manuals` で生成）。

## 開発パイプライン（3 ツール対応ハーネス）

このリポジトリは **Planner / Implementer / Verifier** の 3 サブエージェントによる開発パイプラインを **Claude Code / OpenAI Codex CLI / GitHub Copilot（VS Code）** の 3 ツールから同等に動かせるように設計されている。

### ハーネスの編集ルール

ルートの `CLAUDE.md` `AGENTS.md`、`.claude/`、`.codex/`、`.github/`、`.vscode/` 配下のハーネス関連ファイルは **すべて自動生成物**。編集元は `.harness/` ディレクトリのみ。

ハーネスを変更したいとき：

```bash
# 1. .harness/ 配下を編集（agents/, commands/, instructions/, mcp/, permissions/）
# 2. 各ツール固有ファイルを再生成
npm run sync:harness

# 3. CI / pre-commit で乖離検出（差分があれば exit 1）
npm run check:harness
```

詳細は [`docs/manuals/developer-guide.html`](docs/manuals/developer-guide.html)（編集元は `.harness/manuals/developer-guide.md`、`npm run build:manuals` で生成）または `.harness/instructions/AGENTS.md` を参照。

### 起動コマンド早見表

| コマンド | 用途 |
|---|---|
| `/plan-mvp [追加要望]` | 新規プロダクトの初期 roadmap 生成（v1.0.0 用） |
| `/plan-release [要求リスト]` | 保守リリースのチケット化＋ roadmap 生成（v1.1.0 以降） |
| `/implement-phase` | アクティブリリースの次 TODO フェーズを実装→検証 |
| `/implement-phase 4` | フェーズ 4 を対象に実装→検証 |
| `/finalize-release` | アクティブリリースを確定（リリースノート生成＋ロック） |

各ツールでの呼び出し方:

- **Claude Code**: スラッシュコマンドとして上記がそのまま使える
- **OpenAI Codex CLI**: `/<command-name>` で同名のプロンプトが起動（`.codex/prompts/` を Codex CLI が自動検出）
- **GitHub Copilot（VS Code）**: Copilot Chat 入力で `/<command-name>` 候補から選択（`.github/prompts/`）。サブエージェントは chat mode セレクタから `planner` / `implementer` / `verifier` を切替

### Codex CLI での使い方

1. Codex CLI をインストール（公式ドキュメント参照）
2. リポジトリで `codex` を起動
3. 初回は `Trust this project?` で `y` を選択（プロジェクトスコープの `.codex/config.toml` を読み込ませる）
4. `/` を入力してコマンド一覧を確認 → `plan-release` `implement-phase` `finalize-release` `plan-mvp` が候補に出る
5. サブエージェントは「明示呼び出し」のみ動くため、各コマンドの本文がそのとおりサブエージェントを起動するように書かれている

### GitHub Copilot（VS Code）での使い方

1. VS Code で本リポジトリを開く（GitHub Copilot 拡張＋ Copilot Chat 拡張が必要）
2. Copilot Chat ペインを開く
3. `.vscode/mcp.json` に基づき Playwright MCP サーバが自動接続される（初回はユーザー承認）
4. 「mode」セレクタから `planner` / `implementer` / `verifier` の chat mode を選んで実行
5. 入力欄で `/plan-release` `/implement-phase` `/finalize-release` `/plan-mvp` がプロンプト候補に出る
6. 引数を求められたら入力（`${input:arguments}` がプロンプト経由で取得される）

**注意**: VS Code Copilot にはサブエージェント自動呼び出しがないため、`/implement-phase` の Implementer→Verifier ループは **手動でモード切替** して進める。

## ディレクトリ構造

```
.harness/                # ハーネスの単一ソース（編集する場所）
├─ instructions/         # AGENTS.md ＋ 各ツール addendum
├─ agents/               # planner/implementer/verifier の中立定義
├─ commands/             # plan-mvp/plan-release/implement-phase/finalize-release
├─ mcp/servers.json      # MCP サーバ正規定義
└─ permissions/allow.json

.claude/                 # ↑から生成（Claude Code が読む）
.codex/                  # ↑から生成（Codex CLI が読む）
.github/                 # ↑から生成（Copilot が読む：copilot-instructions/chatmodes/prompts）
.vscode/                 # ↑から生成（VS Code Copilot 用 mcp.json）

docs/
├─ requirements.md       # 要件の一次情報（不変）
├─ design-references/    # UI 参考画像（任意）
├─ DESIGN.md             # デザイントークン（任意）
├─ releases/             # リリース履歴
│  ├─ v1.0.0/            # MVP（released）
│  └─ v1.1.0/            # 保守リリース（released）
└─ manuals/              # .harness/manuals/ から生成
   ├─ developer-guide.html
   └─ user-guide.html

scripts/
├─ sync-harness.mjs      # .harness → 各ツール固有ファイル生成
└─ build-manuals.mjs     # .harness/manuals/*.md → docs/manuals/*.html

app/, components/, lib/  # アプリ本体（Next.js App Router）
```
