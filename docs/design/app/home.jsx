/* ============================================================
   home.jsx — ホーム（レイアウト3案を切り替えて比較）
   ============================================================ */
function useHomeData() {
  var s = useStore();
  return useMemo(function () {
    var yJ = s.journals.find(function (j) { return j.date === window.Store.addDays(-1); });
    var todoIds = yJ ? yJ.tomorrowTaskIds : [];
    var todayTasks = todoIds.map(function (id) { return s.tasks.find(function (t) { return t.id === id; }); }).filter(function (t) { return t && t.status !== 'done'; });
    var todayDone = todoIds.map(function (id) { return s.tasks.find(function (t) { return t.id === id; }); }).filter(function (t) { return t && t.status === 'done'; });
    var waitingDue = s.tasks.filter(function (t) { return t.status === 'waiting' && t.waiting && t.waiting.checkOn && daysFromToday(t.waiting.checkOn) <= 0; });
    var inboxN = s.inbox.filter(function (i) { return i.status === 'open'; }).length;
    var activePjs = s.projects.filter(function (p) { return p.status === 'active'; }).sort(function (a, b) { return (a.due ? parseD(a.due) : 1e15) - (b.due ? parseD(b.due) : 1e15); });
    var recentMemos = s.memos.slice().sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); }).slice(0, 4);
    var waitingN = s.tasks.filter(function (t) { return t.status === 'waiting'; }).length;
    return { todayTasks: todayTasks, todayDone: todayDone, totalToday: todoIds.length, waitingDue: waitingDue, waitingN: waitingN, inboxN: inboxN, activePjs: activePjs, recentMemos: recentMemos, hasJournalToday: s.journals.some(function (j) { return j.date === window.Store.today(); }) };
  }, [s]);
}

function Greeting() {
  var today = window.Store.today();
  return (
    <div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{fmtDate(today, 'wd')}</div>
      <h1 className="display" style={{ fontSize: 30 }}>おはようございます</h1>
    </div>
  );
}

function ProjectMini(props) {
  var p = props.project, s = useStore(), lk = useLookup();
  var cat = lk.cat[p.categoryId];
  var tasks = s.tasks.filter(function (t) { return t.projectId === p.id; });
  var done = tasks.filter(function (t) { return t.status === 'done'; }).length;
  var pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  return (
    <button className="row-item" onClick={function () { props.go('projects'); }} style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}>
      <span style={{ color: cat ? cat.color : 'var(--primary)', flex: 'none' }}><Icon name="project" size={16} weight={1.9} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
        <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 99, marginTop: 6, overflow: 'hidden' }}><div style={{ width: pct + '%', height: '100%', background: cat ? cat.color : 'var(--primary)' }} /></div>
      </div>
      <span style={{ fontSize: 11.5, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)', flex: 'none' }}>{done}/{tasks.length}</span>
      {p.due && <DueBadge due={p.due} />}
    </button>
  );
}

function MemoMini(props) {
  var m = props.memo; var meta = window.Store.memoKinds[m.kind];
  return (
    <button className="row-item" onClick={props.onClick} style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}>
      <span style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb,' + meta.hue + ' 16%,transparent)', color: meta.hue, flex: 'none' }}><Icon name={meta.icon} size={14} weight={1.9} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
      </div>
      <span style={{ fontSize: 11, color: 'var(--ink-tertiary)' }}>{meta.label}</span>
      <span style={{ fontSize: 11, color: 'var(--ink-tertiary)' }}>{fmtDate(m.createdAt.slice(0, 10))}</span>
    </button>
  );
}

function WaitingAlert(props) {
  if (!props.tasks.length) return null;
  return (
    <div className="card card-pad" style={{ borderColor: 'color-mix(in srgb,var(--st-progress) 40%,var(--hairline))', background: 'color-mix(in srgb,var(--st-progress) 7%,var(--surface-1))' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
        <span style={{ color: 'var(--st-progress)' }}><Icon name="bell" size={16} weight={2} /></span>
        <span style={{ fontSize: 13.5, fontWeight: 600 }}>確認予定日を迎えた待ち</span>
        <span style={{ fontSize: 12, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)' }}>{props.tasks.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {props.tasks.map(function (t) {
          return (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={t.waiting.who} size={26} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--st-waiting)' }}>{t.waiting.who}待ち</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={function () { props.onResolve(t); }}>確認した</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TodayHero(props) {
  var d = props.data, tm = props.tm;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ color: 'var(--primary)' }}><Icon name="home" size={18} weight={2} /></span>
        <h2 style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em' }}>今日やること</h2>
        <span style={{ fontSize: 13, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)' }}>{d.todayDone.length}/{d.totalToday}</span>
        <span className="muted" style={{ fontSize: 12, marginLeft: 'auto' }}>前日のジャーナルで選択</span>
      </div>
      {d.todayTasks.length === 0 && d.todayDone.length === 0
        ? <div className="card card-pad"><Empty icon="journal" title="今日やることが未設定です" sub="日次ジャーナルで「明日やること」を選ぶと、ここに表示されます。" action={<button className="btn btn-secondary btn-sm" onClick={function () { props.go('journal'); }}><Icon name="journal" size={14} />ジャーナルを開く</button>} /></div>
        : <div className="card" style={{ padding: 6 }}>
            {d.todayTasks.map(function (t) { return <TaskRow key={t.id} task={t} onOpen={tm.edit} onWaiting={tm.waiting} />; })}
            {d.todayDone.map(function (t) { return <TaskRow key={t.id} task={t} onOpen={tm.edit} onWaiting={tm.waiting} />; })}
          </div>}
    </div>
  );
}

function RoutineCTAs(props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <button className="card card-hover" onClick={function () { props.go('journal'); }} style={{ padding: 16, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Icon name="journal" size={19} weight={1.9} /></span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>日次ジャーナル</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 1 }}>{props.hasJournalToday ? '今日は記録済み' : '一日を振り返る'}</div>
        </div>
        <Icon name="chevronRight" size={16} style={{ color: 'var(--ink-tertiary)' }} />
      </button>
      <button className="card card-hover" onClick={function () { props.go('review'); }} style={{ padding: 16, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 38, height: 38, borderRadius: 10, background: 'color-mix(in srgb,var(--st-waiting) 16%,transparent)', color: 'var(--st-waiting)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Icon name="review" size={19} weight={1.9} /></span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>週次レビュー</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 1 }}>全体を整える</div>
        </div>
        <Icon name="chevronRight" size={16} style={{ color: 'var(--ink-tertiary)' }} />
      </button>
    </div>
  );
}

function SectionCard(props) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <button onClick={props.onTitle} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '13px 16px', background: 'transparent', border: 0, borderBottom: '1px solid var(--hairline)', cursor: props.onTitle ? 'pointer' : 'default', textAlign: 'left' }}>
        <span style={{ color: props.hue || 'var(--ink-subtle)' }}><Icon name={props.icon} size={16} weight={1.9} /></span>
        <span style={{ fontSize: 13.5, fontWeight: 600, flex: 1 }}>{props.title}</span>
        {props.badge != null && <span style={{ fontSize: 12, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)' }}>{props.badge}</span>}
        {props.onTitle && <Icon name="chevronRight" size={14} style={{ color: 'var(--ink-tertiary)' }} />}
      </button>
      <div style={{ padding: props.flush ? 6 : 14 }}>{props.children}</div>
    </div>
  );
}

/* ---------- ホーム：アジェンダ（左：今日 / 右：コンテキスト） ---------- */
function HomeAgenda(props) {
  var d = props.data, go = props.go, tm = props.tm;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 0, border: '1px solid var(--hairline)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'var(--surface-1)' }}>
      {/* left rail */}
      <div style={{ padding: 28, borderRight: '1px solid var(--hairline)' }}>
        <Greeting />
        <div style={{ marginTop: 22 }}><TodayHero data={d} tm={tm} go={go} /></div>
        {d.waitingDue.length > 0 && <div style={{ marginTop: 20 }}><WaitingAlert tasks={d.waitingDue} onResolve={tm.resolve} /></div>}
      </div>
      {/* right rail */}
      <div style={{ padding: 22, background: 'var(--canvas)', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>ルーティン</div>
          <RoutineCTAs go={go} hasJournalToday={d.hasJournalToday} />
        </div>
        <SectionCard icon="project" title="進行中PJ" badge={d.activePjs.length} hue="var(--primary)" flush onTitle={function () { go('projects'); }}>
          {d.activePjs.slice(0, 3).map(function (p) { return <ProjectMini key={p.id} project={p} go={go} />; })}
        </SectionCard>
        <SectionCard icon="inbox" title="Inbox" badge={d.inboxN} hue="var(--st-progress)" onTitle={function () { go('inbox'); }}>
          <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{d.inboxN > 0 ? d.inboxN + '件の未整理項目があります' : '整理済みです'}</div>
        </SectionCard>
        <SectionCard icon="memo" title="最近のメモ" badge={d.recentMemos.length} hue="var(--st-waiting)" flush onTitle={function () { go('memos'); }}>
          {d.recentMemos.slice(0, 3).map(function (m) { return <MemoMini key={m.id} memo={m} onClick={function () { go('memos'); }} />; })}
        </SectionCard>
      </div>
    </div>
  );
}

function HomeScreen(props) {
  var d = useHomeData();
  var tm = useTaskModals();
  return (
    <div className="page page-wide fade-in" style={{ paddingTop: 28 }}>
      <HomeAgenda data={d} go={props.go} tm={tm} />
      {tm.node}
    </div>
  );
}
window.HomeScreen = HomeScreen;
