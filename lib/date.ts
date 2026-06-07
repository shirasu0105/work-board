/* ============================================================
   date.ts — 日付ヘルパ（クライアント用）
   「今日」はサーバから渡された値を setToday で保持し、各関数が参照する。
   単一ユーザのローカル利用前提のためモジュールレベルで保持する。
   ============================================================ */

function pad(n: number): string { return String(n).padStart(2, '0'); }
function isoToday(): string { const x = new Date(); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; }

let CURRENT_TODAY = isoToday();
export function setToday(t: string): void { if (t) CURRENT_TODAY = t; }
export function today(): string { return CURRENT_TODAY; }

export const WD = ['日', '月', '火', '水', '木', '金', '土'];

export function parseD(s?: string | null): Date | null {
  return s ? new Date(s.length > 10 ? s : s + 'T00:00:00') : null;
}

export function fmtDate(s?: string | null, opt?: 'md' | 'wd'): string {
  const dt = parseD(s); if (!dt) return '';
  const m = dt.getMonth() + 1, day = dt.getDate();
  if (opt === 'md') return m + '月' + day + '日';
  if (opt === 'wd') return m + '/' + day + '(' + WD[dt.getDay()] + ')';
  return m + '/' + day;
}

export function fmtTime(s?: string | null): string {
  const dt = parseD(s); if (!dt) return '';
  return pad(dt.getHours()) + ':' + pad(dt.getMinutes());
}

export function daysFromToday(s?: string | null): number | null {
  if (!s) return null;
  const a = parseD(today()), b = parseD(s);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function relDay(s?: string | null): string {
  const n = daysFromToday(s);
  if (n === null) return '';
  if (n === 0) return '今日';
  if (n === 1) return '明日';
  if (n === -1) return '昨日';
  if (n < 0) return Math.abs(n) + '日前';
  return n + '日後';
}

/** 今日からの相対日付（YYYY-MM-DD）。プロトタイプの addDays 相当。 */
export function addDays(off = 0): string {
  const base = parseD(today())!;
  base.setDate(base.getDate() + off);
  return `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`;
}
