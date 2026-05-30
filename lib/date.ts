/**
 * 日付ユーティリティ（Phase 5）。
 *
 * 「待ち日数」はシステムタイムゾーン基準で、開始日と本日（基準日）の
 * 「暦日（カレンダー上の日付）」の差で算出する。時刻成分は無視するため、
 * 同日中の時刻差でズレることはなく、日付が変われば 1 日進む。
 */

/** ローカルタイムゾーンの「その日の 0:00」へ正規化（時刻成分を捨てる）。 */
function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * 待ち日数を計算する。
 *
 * - `startedAt`: 待ち開始日時（ISO 文字列 or Date）
 * - `now`: 基準日時（省略時は現在）。テスト容易性のため引数化。
 *
 * 返り値は「開始日から本日まで何日経過したか」を表す非負整数。
 * 当日に開始したものは 0 日とする。タイムゾーンはシステム基準。
 */
export function waitingDays(
  startedAt: string | Date,
  now: Date = new Date()
): number {
  const start = startedAt instanceof Date ? startedAt : new Date(startedAt);
  if (Number.isNaN(start.getTime())) return 0;

  const startDay = startOfLocalDay(start).getTime();
  const today = startOfLocalDay(now).getTime();
  const diffMs = today - startDay;
  if (diffMs <= 0) return 0;

  // 1 日 = 86400000ms。DST 等での端数は四捨五入で吸収（暦日差を返す）。
  return Math.round(diffMs / 86_400_000);
}

/** ISO 文字列を YYYY/MM/DD 形式（ローカル）に整形。null は空文字。 */
export function formatLocalDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}
