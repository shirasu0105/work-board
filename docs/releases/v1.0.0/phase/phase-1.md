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
