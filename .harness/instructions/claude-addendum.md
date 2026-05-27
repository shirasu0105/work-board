# Claude Code 固有の追記

本ハーネスを Claude Code 上で動かすときの固有事項。

## モデル割り当て

| エージェント | モデル |
|---|---|
| Planner | Opus |
| Implementer | Opus |
| Verifier | Sonnet（4.6） |

## ツール権限

各サブエージェントの `tools:` フィールドは `.harness/agents/<name>.yaml` の `tools.shared` ＋ `tools.claude` の和集合。代表的なものは以下。

- Planner: Read, Write, Edit, Glob, Grep, AskUserQuestion
- Implementer: Read, Write, Edit, Glob, Grep, Bash, mcp__ide__getDiagnostics
- Verifier: Read, Edit, Bash, Glob, Grep, mcp__ide__getDiagnostics, Playwright MCP 全種

## permissions

`.claude/settings.local.json` の `permissions.allow` は `.harness/permissions/allow.json` から生成。Playwright MCP・IDE 診断・npm/npx・git mv・PowerShell（プロセス停止用）が許可される。

## MCP

`enabledMcpjsonServers` には `aidesigner` が入る（OAuth 経由）。Playwright MCP は Claude Code 標準で利用可能。
