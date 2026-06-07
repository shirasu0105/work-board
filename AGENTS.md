<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# プロジェクト固有ルール

- データは `lib/db.ts`（SQLite / better-sqlite3、サーバ専用）に集約する。クライアントから
  DB を直接触らず、必ず `app/actions.ts` の Server Action を経由する。
- 状態管理は `components/store.tsx` の楽観的更新パターンに合わせる
  （ローカル即時更新 → Server Action で永続化）。新しいエンティティ操作もこの形に揃える。
- UI/UX は `docs/design/` のプロトタイプを基準とする。デザイントークン/クラスは
  `app/globals.css` を流用し、独自の色・余白を増やさない。
- `better-sqlite3` はネイティブモジュール。`next.config.ts` の `serverExternalPackages` から外さない。
- `data/`（SQLite 実体）はコミットしない。
