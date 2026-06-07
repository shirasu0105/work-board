'use client';
/* ============================================================
   shell.tsx — アプリシェル（左サイドバー + トップバー + クイック追加）
   ルーティングは Next.js（next/link + usePathname）に置き換え。
   ============================================================ */
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, Logo } from './icons';
import { CategoryDot } from './ui';
import { useStore, useActions } from './store';
import { addDays, daysFromToday } from '@/lib/date';
import { QuickAddModal } from './screens/tasks';

type BadgeKind = 'accent' | 'soft' | 'warn';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'ホーム', '/inbox': 'Inbox', '/tasks': 'タスク', '/waiting': '待ち',
  '/projects': 'プロジェクト', '/someday': 'Someday / Maybe', '/memos': 'メモ',
  '/journal': '日次ジャーナル', '/review': '週次レビュー', '/settings': '設定',
};

function NavItem(props: { href: string; label: string; icon: string; active: boolean; badge?: number | null; badgeKind?: BadgeKind }) {
  const { active } = props;
  const badgeStyle: Record<BadgeKind, React.CSSProperties> = {
    accent: { background: 'var(--primary)', color: '#fff' },
    soft: { background: 'var(--surface-3)', color: 'var(--ink-muted)' },
    warn: { background: 'color-mix(in srgb, var(--st-progress) 24%, transparent)', color: 'var(--st-progress)' },
  };
  return (
    <Link href={props.href}
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', height: 34, padding: '0 10px',
        background: active ? 'var(--surface-3)' : 'transparent', color: active ? 'var(--ink)' : 'var(--ink-subtle)',
        borderRadius: 'var(--radius-md)', fontSize: 13.5, fontWeight: active ? 600 : 500, letterSpacing: '-0.01em',
        transition: 'background .12s, color .12s', textAlign: 'left' }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--ink-muted)'; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-subtle)'; } }}>
      <span style={{ color: active ? 'var(--primary)' : 'inherit', display: 'flex' }}><Icon name={props.icon} size={17} weight={active ? 2 : 1.8} /></span>
      <span style={{ flex: 1 }}>{props.label}</span>
      {props.badge ? <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 99, fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', ...badgeStyle[props.badgeKind || 'soft'] }}>{props.badge}</span> : null}
    </Link>
  );
}

function ThemeToggle() {
  const s = useStore();
  const actions = useActions();
  const theme = s.settings.theme;
  return (
    <button className="btn btn-icon" title={theme === 'dark' ? 'ライトに切替' : 'ダークに切替'}
      onClick={() => actions.setTheme(theme === 'dark' ? 'light' : 'dark')}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
    </button>
  );
}

function Sidebar({ onQuickAdd }: { onQuickAdd: () => void }) {
  const s = useStore();
  const pathname = usePathname();

  const counts = useMemo(() => {
    const inboxN = s.inbox.filter((i) => i.status === 'open').length;
    const yJ = s.journals.find((jn) => jn.date === addDays(-1));
    const todoIds = yJ ? yJ.tomorrowTaskIds : [];
    const todayN = s.tasks.filter((t) => todoIds.indexOf(t.id) >= 0 && t.status !== 'done').length;
    const waitingDue = s.tasks.filter((t) => t.status === 'waiting' && t.waiting && t.waiting.checkOn && (daysFromToday(t.waiting.checkOn) ?? 1) <= 0).length;
    return { inbox: inboxN, today: todayN, waitingDue };
  }, [s]);

  const nav: { href: string; label: string; icon: string; badge?: number | null; badgeKind?: BadgeKind }[] = [
    { href: '/', label: 'ホーム', icon: 'home', badge: counts.today || null, badgeKind: 'accent' },
    { href: '/inbox', label: 'Inbox', icon: 'inbox', badge: counts.inbox || null, badgeKind: 'soft' },
    { href: '/tasks', label: 'タスク', icon: 'task' },
    { href: '/waiting', label: '待ち', icon: 'clock', badge: counts.waitingDue || null, badgeKind: 'warn' },
    { href: '/projects', label: 'プロジェクト', icon: 'project' },
    { href: '/someday', label: 'Someday', icon: 'sparkle' },
    { href: '/memos', label: 'メモ', icon: 'memo' },
  ];
  const routines = [
    { href: '/journal', label: '日次ジャーナル', icon: 'journal' },
    { href: '/review', label: '週次レビュー', icon: 'review' },
  ];

  return (
    <aside style={{ width: 248, flex: 'none', background: 'var(--sidebar-bg)', borderRight: '1px solid var(--hairline)', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 14px 10px' }}>
        <Logo size={26} />
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.03em' }}>Flow</div>
          <div style={{ fontSize: 11, color: 'var(--ink-tertiary)' }}>個人ワークスペース</div>
        </div>
      </div>

      <div style={{ padding: '4px 12px 10px' }}>
        <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', height: 32 }} onClick={onQuickAdd}>
          <Icon name="plus" size={15} /> クイック追加
        </button>
      </div>

      <nav style={{ padding: '0 8px', overflowY: 'auto', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {nav.map((it) => <NavItem key={it.href} {...it} active={pathname === it.href} />)}
        </div>

        <div style={{ padding: '14px 10px 6px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--ink-tertiary)', textTransform: 'uppercase' }}>ルーティン</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {routines.map((it) => <NavItem key={it.href} {...it} active={pathname === it.href} />)}
        </div>

        <div style={{ padding: '14px 10px 6px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--ink-tertiary)', textTransform: 'uppercase' }}>カテゴリ</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {s.categories.filter((c) => c.active).map((c) => {
            const href = `/category/${c.id}`;
            const active = pathname === href;
            const n = s.tasks.filter((t) => t.categoryId === c.id && t.status !== 'done').length;
            return (
              <Link key={c.id} href={href}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', height: 32, padding: '0 10px',
                  background: active ? 'var(--surface-3)' : 'transparent', color: active ? 'var(--ink)' : 'var(--ink-subtle)',
                  borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: active ? 600 : 500, textAlign: 'left' }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--surface-2)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                <CategoryDot cat={c} size={9} />
                <span style={{ flex: 1 }}>{c.name}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)' }}>{n || ''}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div style={{ padding: 10, borderTop: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link href="/settings" className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'flex-start' }}>
          <Icon name="settings" size={15} /> 設定
        </Link>
        <ThemeToggle />
      </div>
    </aside>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const s = useStore();
  const pathname = usePathname();
  const [quickAdd, setQuickAdd] = useState(false);

  const crumb: string[] = useMemo(() => {
    if (pathname.startsWith('/category/')) {
      const id = pathname.split('/')[2];
      const c = s.categories.find((x) => x.id === id);
      return ['カテゴリ', c ? c.name : ''];
    }
    return [ROUTE_TITLES[pathname] || 'ホーム'];
  }, [pathname, s.categories]);

  return (
    <div className="app">
      <Sidebar onQuickAdd={() => setQuickAdd(true)} />
      <div className="main">
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {crumb.map((cpart, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Icon name="chevronRight" size={13} style={{ color: 'var(--ink-tertiary)' }} />}
                {i === crumb.length - 1 ? <h2>{cpart}</h2> : <span className="crumb">{cpart}</span>}
              </React.Fragment>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <button className="btn btn-secondary btn-sm" onClick={() => setQuickAdd(true)}><Icon name="plus" size={14} />追加</button>
        </div>
        <div className="main-scroll">
          {children}
        </div>
      </div>
      {quickAdd && <QuickAddModal onClose={() => setQuickAdd(false)} />}
    </div>
  );
}
