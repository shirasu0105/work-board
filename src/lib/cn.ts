/** 軽量クラス結合ヘルパ（falsy を除去して join するだけ）。 */
export type ClassValue = string | number | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
