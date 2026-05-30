---
release: v1.0.0
generated_at: 2026-05-30 08:30:37Z
source: .harness/manuals/user-guide.md
---

# 説明書（user-guide.md）と実装の乖離チェック

## ルート整合

| 実装ルート | user-guide.md | 結果 |
|---|---|---|
| (なし) | /history | ⚠️ 実装に存在しない（古い記述？） |
| (なし) | /import | ⚠️ 実装に存在しない（古い記述？） |
| (なし) | /new | ⚠️ 実装に存在しない（古い記述？） |
| (なし) | /settings | ⚠️ 実装に存在しない（古い記述？） |
| (なし) | /tools | ⚠️ 実装に存在しない（古い記述？） |
| (なし) | /tools/[toolId]/edit | ⚠️ 実装に存在しない（古い記述？） |
| (なし) | /tools/[toolId]/run | ⚠️ 実装に存在しない（古い記述？） |

## 解決手順

1. `.harness/manuals/user-guide.md` を編集して未記載項目を追記する
2. `npm run build:manuals` を実行して `docs/manuals/user-guide.html` を再生成
3. `npm run check:manual` を再実行して「✅ 差分なし」になることを確認
4. その後 `/finalize-release` を再実行
