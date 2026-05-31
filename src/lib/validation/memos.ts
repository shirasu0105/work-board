import { z } from "zod";
import { requiredText } from "./common";
import { MEMO_TYPE_VALUES, MEMO_FIELDS, type MemoType } from "@/lib/memoTypes";

export const memoBaseSchema = z.object({
  title: requiredText("タイトル", 200),
  categoryId: requiredText("カテゴリ", 100),
  memoType: z.enum(MEMO_TYPE_VALUES as [MemoType, ...MemoType[]]),
  projectId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
});

export type MemoBaseInput = z.infer<typeof memoBaseSchema>;

export interface MemoInput extends MemoBaseInput {
  content: Record<string, string>;
}

/** 種別に定義されたキーのみ採用し、空文字を除いた content を返す。 */
export function sanitizeMemoContent(
  type: MemoType,
  raw: Record<string, unknown>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of MEMO_FIELDS[type]) {
    const v = raw[f.key];
    if (typeof v === "string" && v.trim()) out[f.key] = v.trim();
  }
  return out;
}
