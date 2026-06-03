/* ============================================================
   sidebar.jsx — 左サイドバー（Linearアプリ風）
   ============================================================ */
function Sidebar(props) {
  var route = props.route, go = props.go;
  var s = useStore();

  var counts = useMemo(function () {
    var inboxN = s.inbox.filter(function (i) { return i.status === 'open'; }).length;
    var today = s.today ? s.today() : window.Store.today();
    // 今日やること = 昨日のジャーナルで選んだ未完了タスク
    var yJ = s.journals.find(function (j) { return j.date === window.Store.addDays(-1); });
    var todoIds = yJ ? yJ.tomorrowTaskIds : [];
    var todayN = s.tasks.filter(function (t) { return todoIds.indexOf(t.id) >= 0 && t.status !== 'done'; }).length;
    var waitingDue = s.tasks.filter(function (t) { return t.status === 'waiting' && t.waiting && t.waiting.checkOn && daysFromToday(t.waiting.checkOn) <= 0; }).length;
    var waitingN = s.tasks.filter(function (t) { return t.status === 'waiting'; }).length;
    return { inbox: inboxN, today: todayN, waitingDue: waitingDue, waiting: waitingN };
  }, [s]);

  var nav = [
    { id: 'home', label: 'ホーム', icon: 'home', badge: counts.today || null, badgeKind: 'accent' },
    { id: 'inbox', label: 'Inbox', icon: 'inbox', badge: counts.inbox || null, badgeKind: 'soft' },
    { id: 'tasks', label: 'タスク', icon: 'task' },
    { id: 'waiting', label: '待ち', icon: 'clock', badge: counts.waitingDue || null, badgeKind: 'warn' },
    { id: 'projects', label: 'プロジェクト', icon: 'project' },
    { id: 'someday', label: 'Someday', icon: 'sparkle' },
    { id: 'memos', label: 'メモ', icon: 'memo' }
  ];
  var routines = [
    { id: 'journal', label: '日次ジャーナル', icon: 'journal' },
    { id: 'review', label: '週次レビュー', icon: 'review' }
  ];

  function NavItem(it) {
    var active = route.name === it.id;
    var badgeStyle = { accent: { background: 'var(--primary)', color: '#fff' }, soft: { background: 'var(--surface-3)', color: 'var(--ink-muted)' }, warn: { background: 'color-mix(in srgb, var(--st-progress) 24%, transparent)', color: 'var(--st-progress)' } }[it.badgeKind] || {};
    return (
      <button key={it.id} onClick={function () { go(it.id); }}
        style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', height: 34, padding: '0 10px', border: 0,
          background: active ? 'var(--surface-3)' : 'transparent', color: active ? 'var(--ink)' : 'var(--ink-subtle)',
          borderRadius: 'var(--radius-md)', fontSize: 13.5, fontWeight: active ? 600 : 500, letterSpacing: '-0.01em',
          transition: 'background .12s, color .12s', textAlign: 'left' }}
        onMouseEnter={function (e) { if (!active) { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--ink-muted)'; } }}
        onMouseLeave={function (e) { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-subtle)'; } }}>
        <span style={{ color: active ? 'var(--primary)' : 'inherit', display: 'flex' }}><Icon name={it.icon} size={17} weight={active ? 2 : 1.8} /></span>
        <span style={{ flex: 1 }}>{it.label}</span>
        {it.badge ? <span style={Object.assign({ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 99, fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)' }, badgeStyle)}>{it.badge}</span> : null}
      </button>
    );
  }

  return (
    <aside style={{ width: 248, flex: 'none', background: 'var(--sidebar-bg)', borderRight: '1px solid var(--hairline)', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 14px 10px' }}>
        <Logo size={26} />
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.03em' }}>Flow</div>
          <div style={{ fontSize: 11, color: 'var(--ink-tertiary)' }}>個人ワークスペース</div>
        </div>
      </div>

      {/* quick add */}
      <div style={{ padding: '4px 12px 10px' }}>
        <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', height: 32 }} onClick={props.onQuickAdd}>
          <Icon name="plus" size={15} /> クイック追加
        </button>
      </div>

      <nav style={{ padding: '0 8px', overflowY: 'auto', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>{nav.map(NavItem)}</div>

        <div style={{ padding: '14px 10px 6px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--ink-tertiary)', textTransform: 'uppercase' }}>ルーティン</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>{routines.map(NavItem)}</div>

        <div style={{ padding: '14px 10px 6px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--ink-tertiary)', textTransform: 'uppercase' }}>カテゴリ</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {s.categories.filter(function (c) { return c.active; }).map(function (c) {
            var active = route.name === 'category' && route.id === c.id;
            var n = s.tasks.filter(function (t) { return t.categoryId === c.id && t.status !== 'done'; }).length;
            return (
              <button key={c.id} onClick={function () { go('category', c.id); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', height: 32, padding: '0 10px', border: 0,
                  background: active ? 'var(--surface-3)' : 'transparent', color: active ? 'var(--ink)' : 'var(--ink-subtle)',
                  borderRadius: 'var(--radius-md)', fontSize: 13, fontWeight: active ? 600 : 500, textAlign: 'left' }}
                onMouseEnter={function (e) { if (!active) e.currentTarget.style.background = 'var(--surface-2)'; }}
                onMouseLeave={function (e) { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                <CategoryDot cat={c} size={9} />
                <span style={{ flex: 1 }}>{c.name}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)' }}>{n || ''}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* footer */}
      <div style={{ padding: 10, borderTop: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={function () { go('settings'); }} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'flex-start' }}>
          <Icon name="settings" size={15} /> 設定
        </button>
        <ThemeToggle />
      </div>
    </aside>
  );
}

function ThemeToggle() {
  var s = useStore();
  var theme = s.settings.theme;
  return (
    <button className="btn btn-icon" title={theme === 'dark' ? 'ライトに切替' : 'ダークに切替'}
      onClick={function () { Actions.setTheme(theme === 'dark' ? 'light' : 'dark'); }}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
    </button>
  );
}

window.Sidebar = Sidebar;
