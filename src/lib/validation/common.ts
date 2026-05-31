import { z } from "zod";

/** 必須テキスト（前後空白を除去し、空文字を弾く）。 */
export const requiredText = (label: string, max = 200) =>
  z
    .string()
    .trim()
    .min(1, `${label}は必須です`)
    .max(max, `${label}は${max}文字以内で入力してください`);

/** 任意テキスト（空文字は undefined に正規化）。 */
export const optionalText = (max = 2000) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

/** 任意の日付（YYYY-MM-DD）。空は undefined。 */
export const optionalDate = () =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine(
      (v) => v === undefined || /^\d{4}-\d{2}-\d{2}$/.test(v),
      "日付は YYYY-MM-DD 形式で入力してください",
    );

/** Server Action の共通戻り値。 */
export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

/** zod のエラーを1行メッセージに整形。 */
export function formatZodError(error: z.ZodError): string {
  return error.issues.map((i) => i.message).join(" / ");
}
