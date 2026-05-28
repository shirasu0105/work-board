/**
 * 軽量な className 結合ユーティリティ。
 * 依存を増やさないため classnames / clsx は使わず、最低限の実装で済ます。
 */
export type ClassValue =
  | string
  | number
  | null
  | false
  | undefined
  | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const v of inputs) {
    if (!v && v !== 0) continue;
    if (Array.isArray(v)) {
      const s = cn(...v);
      if (s) out.push(s);
    } else {
      out.push(String(v));
    }
  }
  return out.join(" ");
}
