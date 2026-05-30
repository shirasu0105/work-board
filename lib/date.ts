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

// ---------------------------------------------------------------------------
// 日付キー（YYYY-MM-DD）ユーティリティ（Phase 7 / 日次ジャーナル・ホーム連携）
//
// 日次ジャーナルは「対象日（暦日）」に対して一意（schema の targetDate @unique）。
// 暦日の同一性をブレなく扱うため、対象日は「YYYY-MM-DD」の文字列キーを正規表現とし、
// DB には UTC 00:00 の Date として保存する。タイムゾーンに依存せず往復できる。
// ---------------------------------------------------------------------------

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** 日付キー（YYYY-MM-DD）として妥当な文字列か判定する。 */
export function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_KEY_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return false;
  // "2026-02-31" のような不正日付を弾く（往復で一致するか確認）
  return toDateKeyFromUtc(d) === value;
}

/** Date のローカル暦日を YYYY-MM-DD 文字列にする。 */
export function toDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Date の UTC 暦日を YYYY-MM-DD 文字列にする（DB 保存値の読み出し用）。 */
export function toDateKeyFromUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 「今日」の日付キー（ローカル暦日）。`now` で基準日時を差し替え可能。 */
export function todayKey(now: Date = new Date()): string {
  return toDateKey(now);
}

/** 日付キーに日数を足した新しい日付キーを返す（UTC 基準で計算するので DST に影響されない）。 */
export function addDaysToKey(key: string, days: number): string {
  const base = new Date(`${key}T00:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return toDateKeyFromUtc(base);
}

/** 日付キーから「翌日」の日付キーを返す。 */
export function nextDayKey(key: string): string {
  return addDaysToKey(key, 1);
}

/** 日付キー（YYYY-MM-DD）を DB 保存用の Date（UTC 00:00）へ変換する。不正なら例外。 */
export function dateKeyToUtcDate(key: string): Date {
  if (!isDateKey(key)) {
    throw new Error("日付キーの形式が不正です（YYYY-MM-DD）");
  }
  return new Date(`${key}T00:00:00.000Z`);
}

const WEEKDAY_JP = ["日", "月", "火", "水", "木", "金", "土"] as const;

/** 日付キーを「M/D (曜)」形式に整形（トップバー表示用）。 */
export function formatDateKeyLabel(key: string): string {
  if (!isDateKey(key)) return key;
  const d = new Date(`${key}T00:00:00.000Z`);
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const w = WEEKDAY_JP[d.getUTCDay()];
  return `${m}/${day} (${w})`;
}
