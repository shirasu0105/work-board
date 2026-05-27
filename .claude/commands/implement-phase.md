---
description: アクティブリリースの次の TODO フェーズ（または引数で指定したフェーズ）を Implementer→Verifier の自動ループで完了させる。最大 3 反復。
argument-hint: [フェーズ番号 / 省略で次の TODO]
---


アクティブリリースを解決し、対象フェーズを決定して Implementer ↔ Verifier ループを最大 3 回実行してください。

## アクティブリリースの解決

`docs/releases/` 配下の semver ディレクトリを `Glob` で列挙:

- 各ディレクトリの `roadmap.md` を Read し、frontmatter の `status` と進捗チェックボックスを確認。
- `status: released` のリリースはスキップ（過去の確定済み）。
- 残りで semver が最大、かつ `[ ]` を 1 つ以上含むディレクトリを「アクティブリリース」とする。
- アクティブリリースが見つからない場合: ユーザーに `/plan-mvp`（リリース履歴ゼロのとき）または `/plan-release`（前リリース完了済みで次が未生成のとき）または `/finalize-release`（draft が全 `[x]` のとき）を促して中断。

`<release-dir>` = `docs/releases/v<x.y.z>/`

`<release-dir>/roadmap.md` の frontmatter で mode を確認（`mvp` or `release`）。

## 対象フェーズの決定

- `$ARGUMENTS` が空: `<release-dir>/roadmap.md` の最初の `- [ ] Phase <N>: ...` を採用。
- `$ARGUMENTS` が数字: そのフェーズ番号を採用（既に `[x]` でも上書き再実装してよいが、ユーザーへ「再実装になりますが続けますか？」と確認）。

`<release-dir>/phase/` ディレクトリが無ければ `Bash` で作る（`mkdir -p`）。

## ループ仕様

最大 3 回反復:

```
for iteration in 1..3:
    # ① 実装
    Implementer を呼び出し、以下を渡す:
        active_release=v<x.y.z>
        mode=<mvp|release>
        phase=<N>
        iteration=<iteration>
        feedback=<前回NG時のVerifierフィードバック要約、初回は空>
        手順は implementer の prompt に従う

    # ② 自己評価のゲート
    <release-dir>/phase/phase-<N>.md の最新「自己評価（回 <iteration>）」を Read。
    lint/type/build のいずれかが ❌ なら:
        - Verifier には渡さない
        - iteration をカウントして次の反復へ
        - 次の Implementer 起動時に「lint/type/build を緑にせよ」をフィードバックに加える
        - iteration が 3 なら停止してユーザーへ報告

    # ③ 検証
    Verifier を呼び出し、以下を渡す:
        active_release=v<x.y.z>
        mode=<mvp|release>
        phase=<N>
        iteration=<iteration>
        手順は verifier の prompt に従う

    # ④ 判定
    <release-dir>/phase/phase-<N>.md の最新「検証結果（回 <iteration>）」を Read。
    総合判定が ✅ OK:
        roadmap.md の Phase <N> が `[x]` になっているか確認（Verifier が更新する想定）。
        release モードのときは含まれるチケット行も `[x]` になっているか確認。
        ユーザーへ完了報告。break。
    総合判定が ❌ NG:
        iteration が 3 なら停止してユーザーへ報告。
        そうでなければ次の反復へ。Verifier の「Implementer への修正依頼」を要約して次回 feedback に渡す。
```

### ツール別の呼び出し方

- **Claude Code**: `Agent` ツールで `subagent_type: implementer` / `subagent_type: verifier` を呼ぶ。
- **OpenAI Codex CLI**: 明示的にサブエージェントを起動する（Codex は明示呼び出しのみ）。
- **GitHub Copilot（VS Code）**: 自動ループは持たないため、ユーザーが chat mode を `implementer` ↔ `verifier` で手動切替して進める（このコマンドは「やるべき手順」を提示する案内役）。

## 完了時の報告フォーマット

```
✅ / ❌ [<active_release> / <mode>] Phase <N>: <フェーズ名>
- 反復回数: <1-3>
- 最終結果: 合格 / 3回NG停止 / lint-build エラー継続
- release モード時: 完了チケット <N> 件 / 関連過去シナリオ併走 <M> 件（うち FAIL <K>）
- 変更ファイル: <主要パス数件>
- 次の `/implement-phase` で着手される次フェーズ: Phase <N+1> または「全フェーズ完了 → /finalize-release を実行可能」
- ユーザー TODO: 動作確認のうえ `git add ... && git commit` してください
```

全フェーズ `[x]` になった場合は、次のアクションとして `/finalize-release` を案内する。

## 注意

- Implementer / Verifier の中身を勝手に書き換えない。プロンプトで指示するだけ。
- 並行実行は禁止。Implementer → Verifier は必ず順次。
- 検証中に dev サーバが落ちないよう、Verifier 完了の応答に「dev shell を停止した」と書かれていることを確認。書かれていなければ親側で念のため確認する（ただし `node.exe` 一括 kill は厳禁）。
- ユーザーが Ctrl+C で中断したら、dev サーバを停止して終了する。
- **過去 released リリース**（`<release-dir>` 以外の `docs/releases/v<過去>/`）は絶対に書き換えない。Verifier は `regression_targets` 経由で Read のみ。
