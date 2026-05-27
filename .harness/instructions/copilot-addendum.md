# GitHub Copilot（VS Code）固有の追記

本ハーネスを GitHub Copilot 上で動かすときの固有事項。

## サブエージェント

`.github/chatmodes/<name>.chatmode.md` として Custom Chat Mode 形式で配置される。VS Code Copilot Chat の「mode」セレクタから `planner` / `implementer` / `verifier` を選んで実行する。

Copilot は Claude Code の `Agent` ツールのような「サブエージェント自動呼び出し」を持たないため、`/implement-phase` の最大 3 反復ループは **手動でモード切替**して進める：

1. `implementer` モードで「Phase N を実装して」と指示
2. 完了したら `verifier` モードに切替して「Phase N を検証して」と指示
3. NG なら再度 `implementer` モードに戻る

## プロンプトファイル

`.github/prompts/*.prompt.md` として配置される。VS Code の Copilot Chat 入力で `/` を打つと候補に出る。Copilot はプロンプトファイル内の `${input:argument}` 形式でユーザー入力を受け取れる（Claude Code の `$ARGUMENTS` とは形式が違うため sync スクリプトが変換する）。

## MCP

`.vscode/mcp.json` に Playwright MCP サーバ設定を生成。VS Code Copilot Chat の「Tools」セクションに Playwright のツールが現れる。aidesigner MCP は OAuth フローが Copilot Chat の MCP 対応と整合していないため除外する。

## 制約

- Copilot Coding Agent (GitHub.com 上で動く方) は別系統で、本ハーネスでは VS Code 拡張のみを対象とする
- VS Code 上で「サブエージェントが完了通知してメインスレッドへ戻る」フローは持たないため、自動ループ性は Claude Code・Codex CLI に劣る
- 自動 dev サーバ起動・Playwright での自動検証はユーザーがチャットを介して都度操作する
