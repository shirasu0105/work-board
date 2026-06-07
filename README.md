# Flow — 仕事効率化Webアプリ

タスク管理（GTD）とメモ管理（メモの魔力）を統合した、個人向けのワークスペースアプリです。
`docs/requirements.md` の要件定義と `docs/design/` のプロトタイプ（UI/UX）に基づき実装しています。

> 「入力は軽く / 整理はレビュー時にまとめる / 明日やることを明確にする / 待ち状態を見逃さない / メモは種別ごとのテンプレートで迷わず書ける」

## 主な機能（MVP）

| 画面 | 役割 |
|---|---|
| ホーム | 今日やること・確認予定の待ち・進行中PJ・Inbox・最近のメモ |
| Inbox | 思いつきを素早く登録し、タスク/プロジェクト/Someday へ整理 |
| タスク | 一覧（リスト/かんばん）・検索・絞り込み・並べ替え |
| 待ち | 自分以外がボールを持つタスクの可視化と解除 |
| プロジェクト | 複数タスクを束ねる作業単位（進捗・Next Action） |
| Someday / Maybe | いつかやることの保管庫 |
| メモ | 種別別テンプレート（議事録/TT/思いつき/調査/作業ログ）・検索 |
| 日次ジャーナル | 今日のひとこと＋「明日やること」を選ぶ |
| 週次レビュー | Inbox→PJ→タスク→待ち→Someday→重点 を順に棚卸し |
| 設定 | カテゴリ管理・テーマ切替・データ初期化 |

## 技術スタック

| 項目 | 技術 |
|---|---|
| フレームワーク | Next.js 16（App Router）|
| 言語 | TypeScript |
| UI | React 19 + 素のCSS（デザイントークン）/ Tailwind v4 を導入 |
| データベース | SQLite（`better-sqlite3`）|
| 永続化 | Server Actions 経由で `data/flow.db` に保存 |

## アーキテクチャ

- **データ層** `lib/db.ts` … SQLite 接続・スキーマ・シード・CRUD（サーバ専用）。
- **Server Actions** `app/actions.ts` … クライアントからの永続化入口（`'use server'`）。
- **クライアントストア** `components/store.tsx` … サーバから受け取った初期状態を保持し、
  操作は「楽観的にUI更新 → Server Action で SQLite に保存」。プロトタイプと同じ即応性を維持。
- **シェル/ルーティング** `components/shell.tsx` + `app/**/page.tsx` … サイドバー＋トップバーは
  ルートレイアウトに常駐し、各画面は Next.js のルートとして実装。
- **画面** `components/screens/*` … プロトタイプ（`docs/design/app/*.jsx`）を TSX へ移植。
- **デザイン** `app/globals.css` … プロトタイプの CSS 変数・コンポーネントクラスを移植（ダーク/ライト）。

```
app/            ルート（layout / page / actions）
components/      shell, store, ui, icons, toast, screens/*
lib/            db, types, meta, date
docs/           requirements.md, design/（オリジナルのプロトタイプ）
data/           SQLite 実体（gitignore。初回起動時にシード生成）
```

## 開発

```bash
npm install
npm run dev      # http://localhost:3000
```

初回起動時に `data/flow.db` を作成し、デモデータ（カテゴリ/プロジェクト/タスク/メモ/ジャーナル等）を
「今日」を基準とした相対日付で自動投入します。設定画面の「初期化」でいつでも初期状態に戻せます。

```bash
npm run build && npm run start   # 本番ビルド/起動
npm run lint                     # ESLint
```

## バックアップ / データ保全

データは単一の SQLite ファイル `data/flow.db` に保存されます。バックアップはこのファイル
（および `-wal` / `-shm`）をコピーするだけで完了します。

## 対象外（初期MVP）

認証・認可、複数ユーザー、クラウド同期、通知、タグ、添付ファイル、AI連携、繰り返し/依存タスク、
優先度・工数管理 は対象外です（要件定義書 11.3）。将来の Web 公開・AI 活用を見据え、データを
構造化して保持しています。
