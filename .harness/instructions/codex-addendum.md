# OpenAI Codex CLI 固有の追記

本ハーネスを Codex CLI 上で動かすときの固有事項。

## モデル割り当て

| エージェント | モデル | 推論レベル |
|---|---|---|
| Planner | gpt-5-codex | high |
| Implementer | gpt-5-codex | high |
| Verifier | gpt-5-codex | medium |

## サブエージェント

`.codex/agents/<name>.toml` として TOML 形式で配置される（1 ファイル 1 エージェント）。Codex は **明示呼び出しのみ** サブエージェントを起動するため、`/implement-phase` コマンドの本文に「次に implementer サブエージェントを呼ぶ」「次に verifier サブエージェントを呼ぶ」を明記する。

## サンドボックス・承認

- Implementer: `sandbox_mode = "workspace-write"`（プロジェクト内のみ書き込み可）
- Verifier: `sandbox_mode = "read-only"`（コード書換禁止、ドキュメントの追記は phase-N.md と roadmap.md のみホワイトリスト）
- Planner: `sandbox_mode = "workspace-write"`（docs/releases/ 配下のみ）
- 共通: `approval_policy = "on-request"`

## permissions

`.codex/config.toml` の `[sandbox]` と `[permissions]` セクションは `.harness/permissions/allow.json` から生成。Codex は Bash 単位でなくサンドボックス＋承認ポリシーで制御するため、Bash 個別の allow リストは Codex 側では使わない。

## MCP

`.codex/config.toml` の `[mcp_servers]` セクションに Playwright を登録（Codex は trusted projects のみプロジェクトスコープ MCP を読む）。aidesigner MCP は OAuth ベースで Codex から起動できないため除外する（`tools_only: ["claude"]` フラグで制御）。

## プロジェクト信頼

初回 Codex CLI 起動時に「Trust this project?」と訊かれる。`y` で trust するとプロジェクトスコープの `.codex/config.toml` が読まれる。
