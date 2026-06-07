/* ============================================================
   meta.ts — 種別・ステータスのメタ情報（サーバ/クライアント共用の定数）
   ============================================================ */
import type { TaskStatus, MemoKind } from './types';

export const statusMeta: Record<TaskStatus, { label: string; color: string }> = {
  backlog: { label: '未着手', color: 'var(--st-backlog)' },
  progress: { label: '対応中', color: 'var(--st-progress)' },
  waiting: { label: '待ち', color: 'var(--st-waiting)' },
  hold: { label: '保留', color: 'var(--st-hold)' },
  done: { label: '完了', color: 'var(--st-done)' },
};

export const statusOrder: TaskStatus[] = ['backlog', 'progress', 'waiting', 'hold', 'done'];

export const memoKinds: Record<MemoKind, { label: string; icon: string; hue: string }> = {
  meeting: { label: '議事録', icon: 'mk_meeting', hue: '#5e6ad2' },
  tt: { label: 'TTメモ', icon: 'mk_tt', hue: '#26b5a8' },
  idea: { label: '思いつき', icon: 'mk_idea', hue: '#e0a13a' },
  research: { label: '調査メモ', icon: 'mk_research', hue: '#d96aa6' },
  worklog: { label: '作業ログ', icon: 'mk_worklog', hue: '#7f8a99' },
};
