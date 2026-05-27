---
description: Planner サブエージェントを起動し、保守リリース（v1.1.0 以降）のチケット化と roadmap を生成する
argument-hint: 今回のリリースに含めたい要求リスト（例: "①削除ボタンをアイコン化 ②実行ボタン連打エラー改修 ③.law対応"）
---


Planner サブエージェントを `release` モードで起動し、保守リリースのチケット化＋ `docs/releases/v<次バージョン>/` 配下のドキュメントを生成してください。

## 前提チェック

実行前に以下を確認:

1. `docs/releases/` 配下に既存リリース（少なくとも `v1.0.0`）が存在し、その `roadmap.md` がすべて `[x]`（完成済み）であること。なければ `/plan-mvp` を促して中断。
2. アクティブな draft リリース（未完了 `[ ]` を持つもの）が既にあれば、Planner には「再生成」を指示するか、ユーザーに `/finalize-release` を促す。

## 手順

1. Planner サブエージェントを呼び出す（Claude Code は `Agent` ツール、Codex CLI はサブエージェント呼び出し、Copilot は chat mode 切替）。
2. 渡すプロンプトには以下を含める:
   - `mode: release`
   - `requests: $ARGUMENTS`（要求リストの生テキスト）
   - `docs/requirements.md` を読む指示（プロダクト全体像の把握用）
   - `docs/releases/` 配下を `Glob` で列挙し、最大 semver と各リリースの roadmap/ticket を確認する指示（影響範囲調査と regression_targets 抽出のため）
   - `DESIGN.md` / `docs/design-references/`（あれば）を参考にする指示
   - 生成手順は Planner の release モード節（インテイク → semver 推定 → 影響範囲調査 → チケット化 → フェーズグルーピング → 出力）に従う
   - チケット必須タグ: `feature` / `bugfix` / `ui-ux` / `refactor`
   - 子チケットは `ticket-<親>-<子>.md`、frontmatter で `parent` / `depends_on` / `regression_targets` を明示
   - フェーズは「dev で結合テスト可能な単位」で切る
   - 出力先は `docs/releases/v<推定バージョン>/`

## 完了後にユーザーへ報告すること

- 推定バージョン（v<x.y.z>）と semver 根拠
- 生成されたチケット数（type 別の内訳）
- フェーズ数とフェーズ→チケットのマッピング
- 各チケットの影響範囲調査結果サマリ
- regression_targets で引き当てた過去シナリオの件数
- 次のアクション: `/implement-phase` で Phase 1 を着手できる旨

実装は行いません。Planner の出力を確認するだけです。
