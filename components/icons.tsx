/* ============================================================
   icons.tsx — 線アイコン + ステータス円 + ブランドマーク
   （プロトタイプ docs/design/app/icons.jsx 準拠）
   ============================================================ */
import React from 'react';
import { statusMeta } from '@/lib/meta';
import type { TaskStatus } from '@/lib/types';

export interface IconProps {
  name: string;
  size?: number;
  className?: string;
  weight?: number;
  style?: React.CSSProperties;
}

export function Icon({ name, size = 16, className = '', weight, style: extra }: IconProps) {
  const s: React.CSSProperties = { width: size, height: size, display: 'block', flex: 'none', ...extra };
  const common = {
    viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: weight || 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    style: s, className,
  };
  const P: Record<string, React.ReactNode> = {
    home: <path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
    inbox: <g><path d="M3 12h4l2 3h6l2-3h4" /><path d="M5 5h14l2 7v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6z" /></g>,
    task: <g><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h10" /></g>,
    check: <polyline points="20 6 9 17 4 12" />,
    project: <g><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></g>,
    memo: <g><path d="M5 3h9l5 5v13a0 0 0 0 1 0 0H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M14 3v5h5" /><path d="M8 13h8" /><path d="M8 17h5" /></g>,
    journal: <g><path d="M4 5a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1v15l-3-2-3 2-3-2-3 2-3-2z" /><path d="M9 9h6" /><path d="M9 13h6" /></g>,
    review: <g><path d="M21 12a9 9 0 1 1-3-6.7" /><polyline points="21 4 21 9 16 9" /></g>,
    settings: <g><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></g>,
    clock: <g><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></g>,
    plus: <g><path d="M12 5v14M5 12h14" /></g>,
    search: <g><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></g>,
    chevronRight: <polyline points="9 6 15 12 9 18" />,
    chevronDown: <polyline points="6 9 12 15 18 9" />,
    chevronLeft: <polyline points="15 6 9 12 15 18" />,
    x: <g><path d="M6 6l12 12M18 6 6 18" /></g>,
    grip: <g><circle cx="9" cy="6" r="1.1" fill="currentColor" stroke="none" /><circle cx="15" cy="6" r="1.1" fill="currentColor" stroke="none" /><circle cx="9" cy="12" r="1.1" fill="currentColor" stroke="none" /><circle cx="15" cy="12" r="1.1" fill="currentColor" stroke="none" /><circle cx="9" cy="18" r="1.1" fill="currentColor" stroke="none" /><circle cx="15" cy="18" r="1.1" fill="currentColor" stroke="none" /></g>,
    dots: <g><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" /></g>,
    sun: <g><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></g>,
    moon: <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z" />,
    arrowRight: <g><path d="M5 12h14" /><polyline points="13 6 19 12 13 18" /></g>,
    calendar: <g><rect x="3" y="4.5" width="18" height="17" rx="2" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></g>,
    user: <g><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></g>,
    flag: <g><path d="M5 21V4M5 4h12l-2 4 2 4H5" /></g>,
    folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
    trash: <g><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /></g>,
    edit: <g><path d="M4 20h4l10-10-4-4L4 16z" /><path d="M13.5 6.5l4 4" /></g>,
    eyeOff: <g><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.4 5.2A9.5 9.5 0 0 1 12 5c5 0 9 5 9 7a12 12 0 0 1-2.2 2.8M6.3 6.3C3.9 7.8 2 10.5 2 12c0 1 2 4 5 5.4" /></g>,
    filter: <path d="M3 5h18l-7 8v6l-4-2v-4z" />,
    arrowUpRight: <g><path d="M7 17 17 7" /><polyline points="8 7 17 7 17 16" /></g>,
    sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
    handoff: <g><path d="M16 3h5v5" /><path d="M21 3 11 13" /><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /></g>,
    bell: <g><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z" /><path d="M10 19a2 2 0 0 0 4 0" /></g>,
    // メモ種別アイコン
    mk_meeting: <g><circle cx="9" cy="8" r="3" /><circle cx="16" cy="9" r="2.4" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M14.5 19a4.5 4.5 0 0 1 6 0" /></g>,
    mk_tt: <g><path d="M21 12a8 8 0 0 1-8 8H7l-4 2 1.4-4.2A8 8 0 1 1 21 12z" /><path d="M9 11h6M9 14h4" /></g>,
    mk_idea: <g><path d="M9 18h6" /><path d="M10 21h4" /><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.3 1 2.5h6c0-1.2.3-1.8 1-2.5A6 6 0 0 0 12 3z" /></g>,
    mk_research: <g><circle cx="11" cy="11" r="6" /><path d="m20 20-3.5-3.5" /><path d="M11 8v6M8 11h6" /></g>,
    mk_worklog: <g><path d="M3 7h18M3 12h18M3 17h12" /></g>,
  };
  return React.createElement('svg', common, P[name] || P.task);
}

/* Linear風ステータス円 */
export function StatusIcon({ status, size = 16 }: { status: TaskStatus; size?: number }) {
  const c = statusMeta[status]?.color;
  const common = { width: size, height: size, viewBox: '0 0 16 16', style: { display: 'block', flex: 'none' } as React.CSSProperties };
  if (status === 'done') {
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="7" fill={c} />
        <path d="M4.6 8.2 7 10.5l4.4-4.6" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === 'backlog') {
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="6.4" fill="none" stroke={c} strokeWidth="1.4" strokeDasharray="2.4 2.4" />
      </svg>
    );
  }
  if (status === 'progress') {
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="6.4" fill="none" stroke={c} strokeWidth="1.6" />
        <path d="M8 8 V1.6 A6.4 6.4 0 0 1 13.5 5.2 Z" fill={c} stroke="none" />
        <path d="M8 8 L13.5 5.2 A6.4 6.4 0 0 1 13.5 10.8 Z" fill={c} stroke="none" opacity="0.55" />
      </svg>
    );
  }
  if (status === 'waiting') {
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="6.4" fill="none" stroke={c} strokeWidth="1.6" />
        <circle cx="8" cy="8" r="2.4" fill={c} />
      </svg>
    );
  }
  // hold
  return (
    <svg {...common}>
      <circle cx="8" cy="8" r="6.4" fill="none" stroke={c} strokeWidth="1.6" />
      <rect x="5.6" y="5.2" width="1.7" height="5.6" rx="0.6" fill={c} />
      <rect x="8.7" y="5.2" width="1.7" height="5.6" rx="0.6" fill={c} />
    </svg>
  );
}

/* ブランドマーク（幾何形のみ） */
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" style={{ display: 'block' }}>
      <rect x="2" y="2" width="24" height="24" rx="7" fill="var(--primary)" />
      <path d="M9 8.5h10M9 14h10M9 19.5h6" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" />
    </svg>
  );
}
