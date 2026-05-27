<!-- AUTO-GENERATED FROM .harness/ — DO NOT EDIT.
     Edit the source under .harness/ and run `npm run sync:harness`. -->

# 開発パイプライン: 3エージェント自立開発

このリポジトリは **Planner / Implementer / Verifier** の 3 サブエージェントによるパイプラインで、

- **新規プロダクトの 0→1 開発（MVP）**
- **保守運用フェーズのバージョン管理開発**

の両方を扱う。両系統で同じ Implementer / Verifier を共有し、起点コマンドだけが分岐する。

このハーネスは **Claude Code / OpenAI Codex CLI / GitHub Copilot（VS Code）** の 3 ツールに対応する。各ツール用の設定ファイル（`.claude/`、`.codex/`、`.github/`、`.vscode/`、ルート直下の `CLAUDE.md` / `.github/copilot-instructions.md`）はすべてこの `.harness/` ディレクトリから自動生成される。**編集する場所は `.harness/` だけ**である。

## エージェント構成

| エージェント | 役割 | 起動 |
|---|---|---|
| Planner | アクティブリリースの `roadmap.md` とチケット/フェーズ群を生成 | `/plan-mvp` または `/plan-release`（人手） |
| Implementer | フェーズ単位で実装＋自己評価（lint/type/build＋受入セルフチェック） | `/implement-phase` 内（自動） |
| Verifier | Playwright MCP で実動作検証、閾値で合否判定、進捗更新、関連過去シナリオ併走 | `/implement-phase` 内（自動） |

各エージェントの具体的なモデル名・ツール権限は、各ツール固有の addendum（`claude-addendum.md` / `codex-addendum.md` / `copilot-addendum.md`）に書く。

## 二系統の運用フロー

### 新規プロダクト（v1.0.0）

```
/plan-mvp [追加要望]
   └─ Planner: docs/requirements.md と docs/design-references/（任意）から
              docs/releases/v1.0.0/roadmap.md と phase/phase-N.md の枠を生成
/implement-phase [N]
   └─ Implementer → Verifier（最大 3 反復）
   └─ 全フェーズ [x] でリリース完成
```

### 保守リリース（v1.1.0 以降）

```
/plan-release [要求リスト]
   └─ Planner: 引数の要求＋不足分インタビューで整理
              → semver 推定（ユーザー承認）
              → 影響範囲調査
              → チケット化（ticket-N.md）＋フェーズグルーピング（roadmap.md）
              → docs/releases/v<x.y.z>/ に出力
/implement-phase [N]
   └─ Implementer → Verifier（フェーズ単位ループ）
   └─ Verifier はチケットの regression_targets で関連過去シナリオも併走
/finalize-release
   └─ 全チケット [x] を確認 → release-notes.md 生成 → status を released にロック
```

## 運用ルール

1. **企画は人手起動のみ**。`/plan-mvp` または `/plan-release` を明示的に叩いた時だけ Planner が動く。
2. **フェーズ起動は人手、フェーズ内の実装↔検証は自動**。`/implement-phase` で対象フェーズが Implementer→Verifier ループに入る（番号指定可、省略で次の `[ ]`）。
3. **最大 3 反復で停止**。3 回連続 NG ならユーザーへエスカレーション。
4. **コミット・git 操作は人手**。エージェントは git に触らない。粒度（チケット単位/フェーズ単位）はユーザー裁量。
5. **既存の aidesigner エージェント／コマンドと共存**。それらは触らない。

## ディレクトリ構造（リリース履歴）

```
docs/
├─ requirements.md                # プロジェクト固有・不変。要件の一次情報
├─ design-references/             # 任意。UI 参考画像。なくても動く
├─ DESIGN.md                      # 任意。デザイントークン定義
└─ releases/
   ├─ v1.0.0/                     # MVP（過去リリース、履歴として温存）
   │  ├─ roadmap.md
   │  └─ phase/
   │     ├─ phase-1.md 〜 phase-N.md
   │     └─ screenshots/
   └─ v1.1.0/                     # 保守リリース
      ├─ roadmap.md
      ├─ phase/
      │  └─ phase-1.md 〜
      ├─ ticket/
      │  ├─ ticket-1.md
      │  ├─ ticket-3.md           # 親チケット
      │  ├─ ticket-3-1.md         # 子チケット（parent: ticket-3）
      │  └─ ticket-3-2.md
      └─ release-notes.md         # /finalize-release で生成
```

## アクティブリリースの解決

「現在作業中のリリース」 = `docs/releases/` 配下で最後の semver（major.minor.patch 比較で最大）かつ `roadmap.md` に未完了 `[ ]` を含むディレクトリ。

- すべて `[x]` のリリースは「完成済み」。`/plan-release` で次バージョンが追加される。
- エージェントは作業開始時にこの規則でアクティブリリースを 1 つに絞る。

## 階層と責務

**リリース ⊃ フェーズ ⊃ チケット** の 3 層。

| 階層 | 単位 | 持つもの |
|---|---|---|
| リリース | `docs/releases/v<x.y.z>/` | semver、status（draft/released）、配下チケット束 |
| フェーズ | `phase/phase-<N>.md` | dev 起動して目に見える結合テスト可能な単位、配下チケットの束と依存順序 |
| チケット | `ticket/ticket-<N>.md` | ユーザー要求の最小単位。**受入基準・検証シナリオ・閾値はここに書く** |

MVP（v1.0.0）はチケット概念を持たず、フェーズに直接受入基準・検証シナリオを書く後方互換形式。Planner / Verifier は両形式を読める。

## semver ルール

| 変更内容 | 上げる桁 |
|---|---|
| バグ修正のみ | patch |
| 機能追加・UI 改善（バグ修正混在含む） | minor |
| 破壊的変更（API・DB スキーマ・既存挙動の意味変更） | major |

Planner が `/plan-release` 時にチケットタグから推定し、ユーザーに承認を取る。

## ファイル責務

| ファイル | 書き手 | 読み手 |
|---|---|---|
| `docs/requirements.md` | ユーザー（不変） | Planner / Implementer / Verifier |
| `docs/design-references/*.png` | ユーザー（任意） | Planner |
| `DESIGN.md` | ユーザー（任意） | Planner（言及）/ Implementer（実装トークン） |
| `docs/releases/<v>/roadmap.md` | Planner（生成）/ Verifier（合格時 `[x]`、`/finalize-release` で `released` に） | 全員 |
| `docs/releases/<v>/ticket/ticket-N.md` | Planner（生成）/ Implementer（影響範囲の可変更新） | Implementer / Verifier |
| `docs/releases/<v>/phase/phase-N.md` | Implementer（作成・自己評価）/ Verifier（検証結果追記） | 両者＋メインスレッド |
| `docs/releases/<v>/release-notes.md` | `/finalize-release`（生成） | ユーザー |
| 実装コード（`app/**`, `components/**`, `lib/**` 等） | Implementer | Verifier |

## 進行の真実

`docs/releases/<v>/roadmap.md` のチェックボックスがソース・オブ・トゥルース。

- フェーズ `[x]` は Verifier がフェーズ全シナリオ＋関連過去シナリオを合格判定したときだけ付く。
- チケット `[x]` は当該チケットを含むフェーズが `[x]` になったときに自動的に付与される。
- リリース全体の status は `/finalize-release` で `draft` → `released` に変わる。

## 命名規則

- リリース: `v<major>.<minor>.<patch>`（semver）
- フェーズファイル: `phase-<N>.md`（ゼロ埋めなし）
- チケットファイル: `ticket-<N>.md`、子チケットは `ticket-<親N>-<子N>.md`

## 起動コマンド早見表

| コマンド | 用途 |
|---|---|
| `/plan-mvp [追加要望]` | 新規プロダクトの初期 roadmap 生成 |
| `/plan-release [要求リスト]` | 保守リリースのチケット化＋ roadmap 生成 |
| `/implement-phase` | アクティブリリースの次 TODO フェーズを実装→検証 |
| `/implement-phase 4` | フェーズ 4 を対象に実装→検証 |
| `/finalize-release` | アクティブリリースを確定（リリースノート生成＋ロック） |

## ハーネスの編集ルール

`.claude/`、`.codex/`、`.github/`、`.vscode/`、ルートの `CLAUDE.md` と `.github/copilot-instructions.md`、ルートの `AGENTS.md` は **すべて自動生成物**。各ファイル冒頭に `AUTO-GENERATED` コメントが入っている。

ハーネスを変更したいときは：

1. `.harness/` 配下の正規ファイル（このファイル / `agents/*.yaml` / `commands/*.md` / `mcp/servers.json` / `permissions/allow.json`）を編集する
2. `npm run sync:harness` を実行する（各ツール用ファイルが再生成される）
3. 必要なら `npm run check:harness` で乖離がないことを CI レベルで確認する

aidesigner 関連のスキル・エージェント・コマンドは `npx -y @aidesigner/agent-skills upgrade` で別系統管理されている。ハーネス sync はそれらを上書きしない。

## 技術スタックの前提（このハーネス固有）

このリポジトリは **Next.js 16 + React 19 + Tailwind 4 + TypeScript + Node.js** 専用ハーネス。表示・出力言語は **日本語** 固定。

- Implementer の検証コマンドは `npm run lint` / `npx tsc --noEmit`（または `npm run type-check`）/ `npm run build` 固定。
- Verifier の dev サーバ起動は `npm run dev`、検証は Playwright MCP 固定。
- フォルダ構成は Next.js App Router（`app/`, `components/`, `lib/`）前提。

スタックを差し替えたい場合は別ハーネスとしてフォークすること。

## プロジェクト固有設定の置き場所

ハーネスから抽象化した「プロジェクトごとに変動する」要素は以下のように渡す。

| 項目 | 渡し方 |
|---|---|
| デザイントークン | `DESIGN.md` を置けば Planner / Implementer が読む。なければスルー |
| UI 参考画像 | `docs/design-references/` に任意枚数の PNG。なければスルー |
| フレームワーク固有の注意 | `.harness/instructions/AGENTS.md` 末尾の「プロジェクト備考」セクションに追記 |
| 要件のスコープ章 | `docs/requirements.md` 内に「初版スコープ」「初版スコープ外」相当の節を設ける（節名は任意） |

## プロジェクト備考

（プロジェクト固有のフレームワーク注意・規約があればここに記載。現時点では特になし）
