/**
 * メモ種別とフォーマット定義（Phase 6 / 要件書 §10.8・§10.9）。
 *
 * SQLite は enum を持たないため、kind は String 列に保存する。
 * ここで `as const` の値オブジェクトとユニオン型で
 * 「議事録 / TTメモ / 思いつきメモ / 調査メモ / 作業ログ」の 5 値に型レベルで限定する。
 *
 * 各種別のフィールド構成は `docs/design-references/README.md` の
 * 「メモ種別フォーマットの実装メモ」表を一次情報とする。本文（body）は
 * フィールド key → 文字列値のオブジェクトとして JSON 文字列で永続化する。
 */

export const MEMO_KINDS = [
  "meeting",
  "tt",
  "idea",
  "research",
  "worklog",
] as const;

export type MemoKind = (typeof MEMO_KINDS)[number];

/** 種別の日本語ラベル。 */
export const MEMO_KIND_LABELS: Record<MemoKind, string> = {
  meeting: "議事録",
  tt: "TTメモ",
  idea: "思いつきメモ",
  research: "調査メモ",
  worklog: "作業ログ",
};

/** タブ表示順（議事録 → TT → 思いつき → 調査 → 作業ログ）。 */
export const MEMO_KIND_ORDER: readonly MemoKind[] = MEMO_KINDS;

/** 任意の値が MemoKind かどうかの型ガード。 */
export function isMemoKind(value: unknown): value is MemoKind {
  return (
    typeof value === "string" &&
    (MEMO_KINDS as readonly string[]).includes(value)
  );
}

/**
 * 種別ごとのフィールド定義。
 * - `key`: body オブジェクト内のキー（種別内で一意）
 * - `label`: 画面表示ラベル
 * - `multiline`: true なら textarea、false なら 1 行 input
 * - `chip`: ファクト → 抽象化 → 転用 の F/A/T バッジ（任意）
 */
export type MemoFieldDef = {
  key: string;
  label: string;
  multiline: boolean;
  chip?: "F" | "A" | "T";
};

/**
 * 種別 → フィールド定義一覧。
 * README「メモ種別フォーマットの実装メモ」表および
 * 受入基準のフィールド構成に厳密に一致させる。
 */
export const MEMO_FIELDS: Record<MemoKind, readonly MemoFieldDef[]> = {
  meeting: [
    { key: "datetime", label: "日時", multiline: false },
    { key: "participants", label: "参加者", multiline: false },
    { key: "purpose", label: "目的", multiline: true },
    { key: "agenda", label: "議題", multiline: true },
    { key: "decisions", label: "決定事項", multiline: true },
    { key: "homework", label: "宿題", multiline: true },
    { key: "nextAction", label: "自分のNext Action", multiline: true },
  ],
  tt: [
    { key: "from", label: "誰から", multiline: false },
    { key: "background", label: "背景", multiline: true },
    { key: "taught", label: "教えてもらった内容", multiline: true },
    { key: "fact", label: "ファクト", multiline: true, chip: "F" },
    { key: "abstraction", label: "抽象化", multiline: true, chip: "A" },
    { key: "transfer", label: "転用", multiline: true, chip: "T" },
  ],
  idea: [
    { key: "content", label: "内容", multiline: true },
    { key: "fact", label: "ファクト", multiline: true, chip: "F" },
    { key: "abstraction", label: "抽象化", multiline: true, chip: "A" },
    { key: "transfer", label: "転用", multiline: true, chip: "T" },
    { key: "taskCandidate", label: "タスク化候補", multiline: false },
    { key: "somedayCandidate", label: "Someday候補", multiline: false },
  ],
  research: [
    { key: "theme", label: "調査テーマ", multiline: false },
    { key: "detail", label: "調査内容", multiline: true },
    { key: "findings", label: "分かったこと", multiline: true },
    { key: "conclusion", label: "結論", multiline: true },
    { key: "nextCheck", label: "次に確認すること", multiline: true },
  ],
  worklog: [
    { key: "work", label: "作業内容", multiline: true },
    { key: "result", label: "結果", multiline: true },
    { key: "stuck", label: "詰まった点", multiline: true },
    { key: "handling", label: "対応内容", multiline: true },
    { key: "next", label: "次にやること", multiline: true },
  ],
};

/** メモ本文（フィールド key → 値）。種別ごとにキー集合が異なる。 */
export type MemoBody = Record<string, string>;

/** API / Server から UI へ渡すメモ DTO。日時は ISO 文字列で正規化する。 */
export type MemoDTO = {
  id: string;
  title: string;
  kind: MemoKind;
  /** 種別別フォーマットの内容（フィールド key → 値）。 */
  body: MemoBody;
  createdAt: string;
  updatedAt: string;
  categoryId: string;
  categoryName: string;
  projectId: string | null;
  projectName: string | null;
};

/**
 * 任意の入力を、指定種別の許可フィールドだけに絞った安全な body へ正規化する。
 * - 未知キーは捨てる（種別変更で混入したゴミの除去）
 * - 値は文字列化＋トリム。空文字のキーは保持しない（保存サイズ削減）
 */
export function normalizeBody(kind: MemoKind, raw: unknown): MemoBody {
  const out: MemoBody = {};
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return out;
  }
  const source = raw as Record<string, unknown>;
  for (const field of MEMO_FIELDS[kind]) {
    const v = source[field.key];
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed !== "") out[field.key] = trimmed;
    }
  }
  return out;
}
