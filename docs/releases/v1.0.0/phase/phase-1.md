# Phase 1: アプリ基盤・サイドナビ・空画面雛形

## 目的

Next.js App Router の土台を作り、サイドナビゲーションから要件書 §12 で定義された全 9 画面の空ページへ遷移できる状態にする。デザイントークン（`DESIGN.md`）を Tailwind に反映し、後続フェーズが乗せる共通レイアウトを完成させる。

## 成果物

- `app/layout.tsx` ─ ルートレイアウト。サイドバー＋メイン領域の 2 カラム構成。`<html lang="ja">` 固定
- `app/page.tsx` ─ ホーム画面のプレースホルダ
- `app/inbox/page.tsx` / `app/tasks/page.tsx` / `app/projects/page.tsx` / `app/memos/page.tsx` / `app/memos/new/page.tsx` / `app/journal/page.tsx` / `app/review/page.tsx` / `app/settings/page.tsx` ─ それぞれ画面タイトルのみ表示する空ページ
- `components/layout/Sidebar.tsx` ─ ナビ項目 8 件（ホーム / Inbox / タスク / プロジェクト / メモ / 日次ジャーナル / 週次レビュー / 設定）
- `components/layout/TopBar.tsx` ─ 画面タイトル＋右寄せの汎用スロット
- `components/ui/` ─ Button / Card / Chip / Input / Badge 等の最小プリミティブ（後続フェーズで使い回す）
- `app/globals.css` ─ デザイントークンを CSS 変数として定義（`--ink`, `--paper`, `--paper-2`, `--accent` 等）
- `tailwind.config.ts` ─ `theme.extend.colors` に `ink / paper / accent / warm-gray` などを定義
- `lib/nav.ts` ─ ナビ項目定義（label, href, icon）の単一ソース

## 受入基準

- サイドバーに 8 件のナビ項目が表示され、それぞれクリックすると対応するページへ遷移する
- 現在閲覧中のページに対応するナビ項目がアクティブ表示（背景色やボーダーで視覚的に判別可能）になる
- 全 9 ページ（ホーム / Inbox / タスク / プロジェクト / メモ / メモ作成 / 日次ジャーナル / 週次レビュー / 設定）で画面タイトルが日本語で表示される
- ページ本体が空でも、サイドバー＋トップバー＋本文領域のレイアウトが崩れない
- ブラウザ幅 1280px で横スクロールが発生しない
- 表示テキストはすべて日本語
- `npm run dev` で起動し、`http://localhost:3000/` 〜 `/settings` まで全画面が 404 にならず開ける

## 検証シナリオ（Playwright）

1. **サイドナビ全画面遷移**
   - 前提: `npm run dev` で起動済み、`http://localhost:3000/`
   - 操作: サイドバー内の各ナビ項目を順に「Inbox → タスク → プロジェクト → メモ → 日次ジャーナル → 週次レビュー → 設定 → ホーム」とクリック
   - 期待: 各遷移後、URL がそれぞれ `/inbox`, `/tasks`, `/projects`, `/memos`, `/journal`, `/review`, `/settings`, `/` になり、トップバーに対応する日本語タイトル（「Inbox」「タスク」など）が表示される
2. **アクティブナビ強調表示**
   - 前提: `/tasks` を開いた状態
   - 操作: サイドバーの「タスク」項目を確認
   - 期待: 「タスク」項目の DOM に他項目と区別できる class または aria 属性（例: `aria-current="page"`）が付与される
3. **メモ作成画面への直接アクセス**
   - 前提: ブラウザで `/memos/new` を直接開く
   - 期待: ページタイトル「メモを書く」相当が表示され、404 にならない
4. **トップバー右スロットの存在確認**
   - 前提: ホーム画面 `/`
   - 期待: トップバーに右寄せスロット領域が存在し、後続フェーズで CTA ボタン等を差し込める構造になっている

## 閾値

- `npm run lint` エラー 0
- `npx tsc --noEmit` エラー 0
- `npm run build` 成功
- 上記検証シナリオ 4 件すべて PASS
- 全 9 ページで `console.error` 件数 0
- 1280px 幅で全 9 ページに横スクロールバーが出ない

## 関連要件

- §6.1 初期利用形態（Next.js + ブラウザ）
- §7 技術スタック（Next.js / TypeScript / Tailwind CSS）
- §12 画面一覧（9 画面）

## デザイン参照

- `docs/design-references/reference/sketch-prims.jsx` の `Sidebar` / `TopBar` / `Screen` ─ 画面骨格
- `docs/design-references/reference/screens-1.jsx` の `HomeScreen` ─ 2 カラム配置のイメージ
- `DESIGN.md` §2「Color Palette」§3「Typography」§5「Layout Principles」 ─ トークン定義の元

## 実装計画
- `app/globals.css` に `DESIGN.md` のカラートークン（`--ink` / `--paper` / `--paper-2` / `--accent` / `--warm-gray-*` 等）を CSS 変数で定義し、Tailwind 4 の `@theme inline` ブロックで `color-ink` / `color-paper` / `color-paper-2` / `color-accent` / `color-warm-gray-*` / `color-border-whisper` を公開する。フォントは Inter を `next/font/google` で読み込み、`--font-sans` として割り当て。
- `lib/nav.ts` に 8 ナビ項目（ホーム / Inbox / タスク / プロジェクト / メモ / 日次ジャーナル / 週次レビュー / 設定）を `{ key, label, href, icon }` の型付き配列で単一ソース定義。
- `components/layout/Sidebar.tsx` で `usePathname` から現在パスを取得し、一致するナビ項目に `aria-current="page"` ＋背景強調。`components/layout/TopBar.tsx` は `title` と任意 `children` を受ける軽量ヘッダ。
- `app/layout.tsx` を `<html lang="ja">` 固定、Sidebar＋（TopBar＋main）の 2 カラム構成に書き換え。各ページは `app/<route>/page.tsx` を作成し、TopBar に日本語タイトルを表示＋本文に空状態のプレースホルダ（`Card` 内テキスト）を置く。
- `components/ui/` に Button / Card / Chip / Input / Badge を最小プリミティブとして配置。後続フェーズで使い回せるよう `className` を受け取れるユーティリティ実装にする。
- Notion 風（whisper border `rgba(0,0,0,0.1)`、warm white `#f6f5f4`、Notion Blue `#0075de`）で統一。参考 JSX の手書き風（Yomogi / SVG ザラつき）は持ち込まない。

## 作業ログ
- 2026-05-29 着手
- 2026-05-29 既存リポジトリ構成（Next.js 16 + React 19 + Tailwind 4 のテンプレ状態）と参考 JSX（`docs/design-references/reference/sketch-prims.jsx` ほか）を把握
- 2026-05-29 `app/globals.css` を全面書き換え。`DESIGN.md` のトークンを CSS 変数化し、Tailwind 4 の `@theme inline` で `ink / paper / paper-2 / accent / warm-gray-*` 等を公開
- 2026-05-29 `lib/nav.ts`（8 ナビ単一ソース＋ `isNavActive`）と `lib/cn.ts`（軽量 cn）を作成
- 2026-05-29 `components/ui/` に Button / Card / Chip / Input / Badge の最小プリミティブを作成
- 2026-05-29 `components/layout/` に Sidebar / TopBar / PageShell / PagePlaceholder を作成
- 2026-05-29 `app/layout.tsx` を `<html lang="ja">` ＋サイドバー＋メインの 2 カラム構成に書き換え、Inter フォント注入
- 2026-05-29 9 ページ（ホーム / Inbox / タスク / プロジェクト / メモ / メモ作成 / 日次ジャーナル / 週次レビュー / 設定）を作成
- 2026-05-29 `eslint.config.mjs` で `docs/design-references/**` を ignore（参考用 JSX が `react/jsx-no-undef` を吐くため）
- 2026-05-29 lint / type-check / build をすべて緑で完走

## 自己評価（回 1、2026-05-29）

### コマンド結果
| コマンド | 結果 | 備考 |
|---|---|---|
| `npm run lint` | ✅ | 当初 `docs/design-references/reference/*.jsx` で 26 件のエラーが出たが、当該ディレクトリは実装には組み込まない参考資料のため `eslint.config.mjs` の `globalIgnores` に追加。再実行で 0 件 |
| `npx tsc --noEmit` | ✅ | エラー 0 |
| `npm run build` | ✅ | `/`, `/inbox`, `/tasks`, `/projects`, `/memos`, `/memos/new`, `/journal`, `/review`, `/settings` の全 9 ルート＋ `/_not-found` が Static で生成成功 |

### 受入基準セルフチェック

| # | 受入基準 | 自己判定 | 根拠 |
|---|---|---|---|
| 1 | サイドバーに 8 件のナビ項目が表示され、クリックで対応ページへ遷移 | ✅ | `lib/nav.ts` に 8 項目を定義、`components/layout/Sidebar.tsx` で `next/link` の `<Link>` を生成。`npm run build` で対応 9 ルートの static 生成成功（メモ作成除く 8 ナビ先＋メモ作成画面） |
| 2 | 現在閲覧中のページに対応するナビ項目がアクティブ表示（背景色/ボーダー＋ `aria-current="page"`） | ✅ | Sidebar.tsx で `usePathname` ＋ `isNavActive` を使い、一致時に `aria-current="page"` ＋ 背景 `bg-paper` ＋ whisper border ＋ shadow-card で視覚強調 |
| 3 | 全 9 ページで画面タイトルが日本語表示 | ✅ | 各 `app/.../page.tsx` で `<PageShell title="..." />` に「ホーム」「Inbox」「タスク」「プロジェクト」「メモ」「メモを書く」「日次ジャーナル」「週次レビュー」「設定」を渡している。TopBar が `<h1>` でレンダリング |
| 4 | ページ本体が空でも、サイドバー＋トップバー＋本文領域のレイアウトが崩れない | ✅ | `app/layout.tsx` が `flex min-h-screen` の 2 カラム、`PageShell` 内で `<main class="flex-1 overflow-auto">`。Sidebar は `w-[220px] shrink-0`、メインは `min-w-0 flex-1` |
| 5 | ブラウザ幅 1280px で横スクロールが発生しない | ✅（要検証） | サイドバー 220px ＋メイン残り（最大幅 1100px の中央寄せ）。固定幅・浮き要素なし。Verifier の Playwright で実機確認推奨 |
| 6 | 表示テキストはすべて日本語 | ✅ | ブランド `work-board` の英数字のみ。ナビラベル・タイトル・サブタイトル・プレースホルダはすべて日本語 |
| 7 | `npm run dev` で 9 画面すべて 404 にならず開ける | ✅ | build で 9 ルート＋ `/_not-found` が static 生成成功＝ルーティング解決済み |

### 検証シナリオ（Playwright）対応状況
| # | シナリオ | 対応 | 備考 |
|---|---|---|---|
| 1 | サイドナビ全画面遷移 | ✅ | NAV_ITEMS の `href` がすべて build で確認済み |
| 2 | アクティブナビ強調表示 | ✅ | `aria-current="page"` ＋ `data-active="true"` 属性。視覚的にも背景／枠／影で差異あり |
| 3 | `/memos/new` 直接アクセス | ✅ | build に `/memos/new` 含む。タイトル「メモを書く」を表示 |
| 4 | トップバー右スロット存在 | ✅ | `TopBar` 内に `<div data-slot="topbar-right">` を常設。children 未指定でも要素自体は存在 |

### 変更ファイル
- `app/layout.tsx`: ルートレイアウト全面書き換え。`<html lang="ja">` ＋ Inter フォント＋ 2 カラム構成
- `app/page.tsx`: ホーム画面プレースホルダ（テンプレを置き換え）
- `app/globals.css`: デザイントークン（CSS 変数）と Tailwind 4 `@theme inline` 定義に書き換え。`shadow-card` / `border-whisper` ユーティリティ
- `app/inbox/page.tsx`, `app/tasks/page.tsx`, `app/projects/page.tsx`, `app/memos/page.tsx`, `app/memos/new/page.tsx`, `app/journal/page.tsx`, `app/review/page.tsx`, `app/settings/page.tsx`: 新規空ページ 8 件
- `components/layout/Sidebar.tsx`: 8 ナビ＋アクティブ強調＋ `aria-current="page"`
- `components/layout/TopBar.tsx`: タイトル＋右スロット
- `components/layout/PageShell.tsx`: TopBar ＋本文ラッパ
- `components/layout/PagePlaceholder.tsx`: Phase 1 用の空状態カード
- `components/ui/Button.tsx`, `Card.tsx`, `Chip.tsx`, `Input.tsx`, `Badge.tsx`, `index.ts`: 最小 UI プリミティブ 5 種
- `lib/nav.ts`: ナビ単一ソース＋ `isNavActive`
- `lib/cn.ts`: 軽量 className 結合ユーティリティ
- `eslint.config.mjs`: `docs/design-references/**` を ignore に追加（参考 JSX が `react/jsx-no-undef` 等を出すため）

### 引き継ぎメモ（Verifier 向け）
- dev サーバ起動は `npm run dev`（Turbopack）。初回コンパイル待ちが数秒あるため、Playwright で `/` に navigate した直後に DOMContentLoaded ではなく `networkidle` 相当で待つと安定。
- アクティブ判定の検証は `aria-current="page"` 属性（ARIA セレクタ）または `[data-active="true"]` で取得可能。
- 横スクロール検証はビューポート 1280×800 でスクロールバー幅を考慮。`document.documentElement.scrollWidth <= window.innerWidth` で判定可能。
- `console.error` 0 件チェック対象は 9 ページ（`/`, `/inbox`, `/tasks`, `/projects`, `/memos`, `/memos/new`, `/journal`, `/review`, `/settings`）。Inter フォントを `next/font/google` 経由で取得するため、オフライン環境では初回ビルド時に外部通信を行う（ビルド済みなので Verifier 段階では問題なし）。
- `app/memos/new` のタイトルは「メモを書く」。要件の `app/memos/new/page.tsx` に対応。
- ホーム `/` だけは `isNavActive` が完全一致判定（他は前方一致）。`/inbox` で「ホーム」がアクティブにならないことを確認済み（`isNavActive` の実装）。

## 検証結果（回 1、2026-05-29 00:14）

### dev 起動
- 結果: OK
- ポート: 3000
- 起動時間: 約 5 秒（Turbopack）

### シナリオ別結果

#### 当該フェーズのシナリオ
| # | シナリオ | 結果 | 観測値 / 根拠 |
|---|---|---|---|
| 1 | サイドナビ全画面遷移（8 遷移） | PASS | /inbox: heading「Inbox」確認、[active]付与 / /tasks: heading「タスク」確認 / /projects: heading「プロジェクト」確認 / /memos: heading「メモ」確認 / /journal: heading「日次ジャーナル」確認 / /review: heading「週次レビュー」確認 / /settings: heading「設定」確認 / /: heading「ホーム」確認。全 8 遷移で URL・タイトルが期待通り |
| 2 | アクティブナビ強調（/tasks） | PASS | `a[href="/tasks"]` に `aria-current="page"`、`data-active="true"` を取得確認。他ナビ項目には未付与 |
| 3 | /memos/new 直接アクセス | PASS | URL が /memos/new のまま、heading「メモを書く」を取得。404 なし |
| 4 | トップバー右スロット存在確認 | PASS | `[data-slot="topbar-right"]` の div（className: flex shrink-0 items-center gap-2）が DOM 上に存在 |

#### 追加チェック（全 9 ページ）
| ページ | console.error | 横スクロール（scrollWidth <= innerWidth） |
|---|---|---|
| / | 0 件 | OK（1280 == 1280） |
| /inbox | 0 件 | OK（1280 == 1280） |
| /tasks | 0 件 | OK（1280 == 1280） |
| /projects | 0 件 | OK（1280 == 1280） |
| /memos | 0 件 | OK（1280 == 1280） |
| /memos/new | 0 件 | OK（1280 == 1280） |
| /journal | 0 件 | OK（1280 == 1280） |
| /review | 0 件 | OK（1280 == 1280） |
| /settings | 0 件 | OK（1280 == 1280） |

全テキストの日本語表記: snapshot 確認により、ブランド名「work-board」以外のナビラベル・タイトル・説明文はすべて日本語表記であることを確認（ホーム・Inbox・タスク・プロジェクト・メモ・日次ジャーナル・週次レビュー・設定・メモを書く 等）。

### 閾値判定
| 閾値 | 結果 |
|---|---|
| `npm run lint` エラー 0（Implementer 自己評価） | OK |
| `npx tsc --noEmit` エラー 0（Implementer 自己評価） | OK |
| `npm run build` 成功（Implementer 自己評価） | OK |
| 検証シナリオ 4 件すべて PASS | OK |
| 全 9 ページで `console.error` 件数 0 | OK |
| 1280px 幅で全 9 ページに横スクロールバーなし | OK |

## 総合判定（回 1）

TOTAL: OK

全シナリオ PASS、全閾値クリア。Phase 1 の受入基準をすべて満たしている。
