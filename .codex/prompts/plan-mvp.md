---
description: Planner サブエージェントを起動し、新規プロダクト初版（v1.0.0）の roadmap を生成する
argument-hint: [追加要望があれば自由記述]
---


Planner サブエージェントを `mvp` モードで起動し、`docs/releases/v1.0.0/roadmap.md` と配下の `phase/phase-N.md` の枠を生成（または再生成）してください。

## 前提チェック

実行前に以下を確認:

1. `docs/releases/` 配下に既存ディレクトリが無いこと（あれば `/plan-release` の対象。`/plan-mvp` は新規プロダクト専用）。
2. `docs/requirements.md` が存在すること。なければユーザーに作成を促して中断。

## 手順

1. Planner サブエージェントを呼び出す（Claude Code は `Agent` ツール、Codex CLI はサブエージェント呼び出し、Copilot は chat mode 切替）。
2. 渡すプロンプトには以下を含める:
   - `mode: mvp`
   - `requests: $ARGUMENTS`（追加要望があれば）
   - `docs/requirements.md` を必ず読む指示
   - `docs/design-references/*.png` があれば参考にする指示（ピクセル一致は要求しない）
   - `DESIGN.md` があれば実装トーンとして言及する指示
   - 6〜8 フェーズに分割し、各フェーズに「目的・成果物・受入基準・Playwright 検証シナリオ・閾値・関連要件」を含める指示
   - 出力先は `docs/releases/v1.0.0/`
   - 既存があれば上書き可（git で履歴は残る）
   - チケット概念は使わない（mvp モードなので `ticket/` ディレクトリは作らない）

## 完了後にユーザーへ報告すること

- 生成された `docs/releases/v1.0.0/roadmap.md` のフェーズ数とフェーズ名一覧
- 各フェーズに受入基準・検証シナリオ・閾値が揃っているかチェック結果（机上）
- 次のアクション: `/implement-phase` で Phase 1 を着手できる旨

実装は行いません。Planner の出力を確認するだけです。
