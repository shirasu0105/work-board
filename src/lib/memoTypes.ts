/**
 * メモ種別と種別別フィールド定義（SPEC §3.6）。
 * content JSON はこのフィールド定義に従って組み立て/表示する。クライアント・サーバ共用。
 */

export const MEMO_TYPES = [
  { value: "minutes", label: "議事録", titleLabel: "会議名" },
  { value: "tt", label: "TTメモ", titleLabel: "タイトル" },
  { value: "idea", label: "思いつきメモ", titleLabel: "タイトル" },
  { value: "research", label: "調査メモ", titleLabel: "調査テーマ" },
  { value: "worklog", label: "作業ログ", titleLabel: "タイトル" },
] as const;

export type MemoType = (typeof MEMO_TYPES)[number]["value"];

export const MEMO_TYPE_VALUES = MEMO_TYPES.map((t) => t.value) as MemoType[];

export interface MemoFieldDef {
  key: string;
  label: string;
  multiline?: boolean;
}

export const MEMO_FIELDS: Record<MemoType, MemoFieldDef[]> = {
  minutes: [
    { key: "datetime", label: "日時" },
    { key: "participants", label: "参加者" },
    { key: "purpose", label: "目的" },
    { key: "agenda", label: "議題", multiline: true },
    { key: "decisions", label: "決定事項", multiline: true },
    { key: "todos", label: "TODO", multiline: true },
    { key: "myNextAction", label: "自分の次アクション", multiline: true },
  ],
  tt: [
    { key: "from", label: "出典 / きっかけ" },
    { key: "background", label: "背景", multiline: true },
    { key: "learned", label: "学んだこと", multiline: true },
    { key: "fact", label: "事実", multiline: true },
    { key: "abstraction", label: "抽象化", multiline: true },
    { key: "application", label: "転用", multiline: true },
  ],
  idea: [
    { key: "content", label: "内容", multiline: true },
    { key: "fact", label: "事実", multiline: true },
    { key: "abstraction", label: "抽象化", multiline: true },
    { key: "application", label: "転用", multiline: true },
    { key: "taskCandidate", label: "タスク候補" },
    { key: "somedayCandidate", label: "Someday候補" },
  ],
  research: [
    { key: "content", label: "調査内容", multiline: true },
    { key: "findings", label: "分かったこと", multiline: true },
    { key: "conclusion", label: "結論", multiline: true },
    { key: "nextToConfirm", label: "次に確認すること", multiline: true },
  ],
  worklog: [
    { key: "work", label: "作業内容", multiline: true },
    { key: "result", label: "結果", multiline: true },
    { key: "blockers", label: "詰まったこと", multiline: true },
    { key: "handling", label: "対応", multiline: true },
    { key: "nextToDo", label: "次にやること", multiline: true },
  ],
};

export function memoTypeLabel(value: string): string {
  return MEMO_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function memoTitleLabel(value: string): string {
  return MEMO_TYPES.find((t) => t.value === value)?.titleLabel ?? "タイトル";
}

/** content JSON を安全にパースして key→string のレコードにする。 */
export function parseMemoContent(json: string | null): Record<string, string> {
  if (!json) return {};
  try {
    const obj = JSON.parse(json);
    if (obj && typeof obj === "object") {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === "string") out[k] = v;
      }
      return out;
    }
  } catch {
    // 壊れた JSON は空扱い
  }
  return {};
}
