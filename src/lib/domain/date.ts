/**
 * 日付関連の純粋ロジック（ユニットテスト対象）。
 * 基準日 today は省略時に実行時の現在日。テスト時は明示的に渡す。
 */

function toDateOnly(iso: string): Date {
  // "YYYY-MM-DD" もしくは ISO 文字列の日付部分を UTC 00:00 として扱う
  return new Date(iso.slice(0, 10) + "T00:00:00Z");
}

function todayDateOnly(today?: Date): Date {
  const d = today ?? new Date();
  return new Date(
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()),
  );
}

/** target までの残り日数。過去なら負。無効入力は null。 */
export function daysUntil(target: string | null | undefined, today?: Date): number | null {
  if (!target) return null;
  const t = toDateOnly(target);
  if (Number.isNaN(t.getTime())) return null;
  const base = todayDateOnly(today);
  return Math.round((t.getTime() - base.getTime()) / 86_400_000);
}

/** from から today までの経過日数（待ち日数など）。 */
export function daysSince(from: string | null | undefined, today?: Date): number | null {
  if (!from) return null;
  const f = toDateOnly(from);
  if (Number.isNaN(f.getTime())) return null;
  const base = todayDateOnly(today);
  return Math.round((base.getTime() - f.getTime()) / 86_400_000);
}

/** 表示用に "M/D" 形式へ整形。無効・空は空文字。 */
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = toDateOnly(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}
