/* ============================================================
   review.jsx — 週次レビュー（ガイド付きウィザード）
   ============================================================ */
function ReviewScreen() {
  var s = useStore();
  var tm = useTaskModals();
  var stepSt = useState(0); var step = stepSt[0], setStep = stepSt[1];
  var convSt = useState(null); var conv = convSt[0], setConv = convSt[1];
  var lk = useLookup();

  var openInbox = s.inbox.filter(function (i) { return i.status === 'open'; });
  var activePjs = s.projects.filter(function (p) { return p.status === 'active'; });
  var staleTasks = s.tasks.filter(function (t) { return (t.status === 'backlog' || t.status === 'hold') && (!t.due || daysFromToday(t.due) < 0); });
  var waiting = s.tasks.filter(function (t) { return t.status === 'waiting'; });
  var someday = s.someday;

  var steps = [
    { key: 'inbox', label: 'Inbox整理', icon: 'inbox', count: openInbox.length, desc: '未整理の項目をタスク・プロジェクト・Somedayへ振り分ける' },
    { key: 'projects', label: '進行中PJ', icon: 'project', count: activePjs.length, desc: '各プロジェクトにNext Actionがあるか確認する' },
    { key: 'tasks', label: '未完了タスク', icon: 'task', count: staleTasks.length, desc: '放置・期限切れのタスクを整理する' },
    { key: 'waiting', label: '待ち', icon: 'clock', count: waiting.length, desc: '相手のボールが止まっていないか確認する' },
    { key: 'someday', label: 'Someday', icon: 'sparkle', count: someday.length, desc: 'いつかやることを見直し、今やるなら引き上げる' },
    { key: 'focus', label: '来週の重点', icon: 'flag', count: null, desc: '来週フォーカスするプロジェクトを確認する' }
  ];
  var cur = steps[step];
  var isLast = step === steps.length - 1;

  function NextAction(pj) {
    var na = s.tasks.find(function (t) { return t.projectId === pj.id && (t.status === 'progress' || t.status === 'backlog'); });
    return na;
  }

  return (
    <div className="page fade-in">
      <PageHead icon="review" title="週次レビュー" sub="週に一度、全体を整える棚卸し" />

      {/* stepper */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 22, flexWrap: 'wrap' }}>
        {steps.map(function (st, i) {
          var done = i < step, active = i === step;
          return (
            <button key={st.key} onClick={function () { setStep(i); }}
              style={{ flex: '1 1 0', minWidth: 92, display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid ' + (active ? 'var(--primary)' : 'var(--hairline)'), background: active ? 'var(--primary-soft)' : 'var(--surface-1)', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 20, height: 20, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? 'var(--st-done)' : (active ? 'var(--primary)' : 'var(--surface-3)'), color: done || active ? '#fff' : 'var(--ink-subtle)', fontSize: 11, fontWeight: 700 }}>
                  {done ? <Icon name="check" size={12} weight={3} /> : (i + 1)}
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--ink-tertiary)' }}>{st.count != null ? st.count : ''}</span>
              </div>
              <span style={{ fontSize: 12.5, fontWeight: active ? 600 : 500, color: active ? 'var(--ink)' : 'var(--ink-subtle)' }}>{st.label}</span>
            </button>
          );
        })}
      </div>

      {/* step body */}
      <div className="card" style={{ minHeight: 320 }}>
        <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={cur.icon} size={19} weight={1.9} /></span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em' }}>{step + 1}. {cur.label}</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{cur.desc}</div>
          </div>
        </div>

        <div style={{ padding: 16 }}>
          {cur.key === 'inbox' && (openInbox.length === 0
            ? <ReviewDone text="Inboxは空です。整理済み。" />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {openInbox.map(function (it) {
                  return (
                    <div key={it.id} className="row-item" style={{ background: 'var(--surface-2)' }}>
                      <Icon name="inbox" size={15} style={{ color: 'var(--ink-subtle)' }} />
                      <span style={{ flex: 1, fontSize: 13.5 }}>{it.text}</span>
                      <button className="btn btn-secondary btn-sm" onClick={function () { setConv({ type: 'task', item: it }); }}><Icon name="task" size={13} />タスク</button>
                      <button className="btn btn-secondary btn-sm" onClick={function () { setConv({ type: 'someday', item: it }); }}><Icon name="sparkle" size={13} />Someday</button>
                      <button className="btn btn-icon" style={{ width: 28, height: 28, color: 'var(--ink-tertiary)' }} onClick={function () { Actions.deleteInbox(it.id); toast('削除', 'trash'); }}><Icon name="trash" size={14} /></button>
                    </div>
                  );
                })}
              </div>)}

          {cur.key === 'projects' && (activePjs.length === 0
            ? <ReviewDone text="進行中のプロジェクトはありません。" />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activePjs.map(function (p) {
                  var na = NextAction(p), cat = lk.cat[p.categoryId];
                  return (
                    <div key={p.id} className="row-item" style={{ background: 'var(--surface-2)' }}>
                      <span style={{ color: cat ? cat.color : 'var(--primary)' }}><Icon name="project" size={16} weight={1.9} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 12, marginTop: 2, color: na ? 'var(--ink-subtle)' : 'var(--danger)' }}>{na ? '次: ' + na.title : 'Next Actionがありません'}</div>
                      </div>
                      {!na && <button className="btn btn-secondary btn-sm" onClick={function () { tm.newTask({ categoryId: p.categoryId, projectId: p.id }); }}><Icon name="plus" size={13} />Next Action</button>}
                    </div>
                  );
                })}
              </div>)}

          {cur.key === 'tasks' && (staleTasks.length === 0
            ? <ReviewDone text="放置・期限切れのタスクはありません。" />
            : <div className="card" style={{ padding: 6, background: 'var(--surface-2)' }}>
                {staleTasks.map(function (t) { return <TaskRow key={t.id} task={t} onOpen={tm.edit} onWaiting={tm.waiting} />; })}
              </div>)}

          {cur.key === 'waiting' && (waiting.length === 0
            ? <ReviewDone text="待ちタスクはありません。" />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {waiting.map(function (t) {
                  var overdue = t.waiting.checkOn && daysFromToday(t.waiting.checkOn) <= 0;
                  return (
                    <div key={t.id} className="row-item" style={{ background: 'var(--surface-2)' }}>
                      <Avatar name={t.waiting.who} size={28} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.title}</div>
                        <div style={{ fontSize: 12, marginTop: 2, color: 'var(--st-waiting)' }}>{t.waiting.who}待ち · {Math.abs(daysFromToday(t.waiting.since))}日経過{overdue ? ' · 確認予定日超過' : ''}</div>
                      </div>
                      {overdue && <span className="pill" style={{ background: 'color-mix(in srgb,var(--danger) 14%,transparent)', color: 'var(--danger)', border: 'none' }}>要確認</span>}
                      <button className="btn btn-secondary btn-sm" onClick={function () { tm.resolve(t); }}><Icon name="check" size={13} />解除</button>
                    </div>
                  );
                })}
              </div>)}

          {cur.key === 'someday' && (someday.length === 0
            ? <ReviewDone text="Somedayは空です。" />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {someday.map(function (it) {
                  var cat = lk.cat[it.categoryId];
                  return (
                    <div key={it.id} className="row-item" style={{ background: 'var(--surface-2)' }}>
                      <Icon name="sparkle" size={15} style={{ color: 'var(--st-progress)' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{it.text}</div>
                        {cat && <div style={{ fontSize: 12, marginTop: 2, color: 'var(--ink-subtle)' }}>{cat.name}</div>}
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={function () { Actions.addTask({ title: it.text, categoryId: it.categoryId }); Actions.deleteSomeday(it.id); toast('タスク化', 'task'); }}><Icon name="task" size={13} />今やる</button>
                      <button className="btn btn-icon" style={{ width: 28, height: 28, color: 'var(--ink-tertiary)' }} onClick={function () { Actions.deleteSomeday(it.id); toast('削除', 'trash'); }}><Icon name="trash" size={14} /></button>
                    </div>
                  );
                })}
              </div>)}

          {cur.key === 'focus' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="muted" style={{ fontSize: 13, marginBottom: 4 }}>来週フォーカスするプロジェクト（期限が近い順）</div>
              {activePjs.slice().sort(function (a, b) { return (a.due ? parseD(a.due) : 1e15) - (b.due ? parseD(b.due) : 1e15); }).slice(0, 4).map(function (p) {
                var cat = lk.cat[p.categoryId];
                return (
                  <div key={p.id} className="row-item" style={{ background: 'var(--surface-2)' }}>
                    <span style={{ color: cat ? cat.color : 'var(--primary)' }}><Icon name="flag" size={16} weight={1.9} /></span>
                    <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{p.name}</span>
                    {p.due && <DueBadge due={p.due} />}
                    {cat && <CategoryTag cat={cat} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
        <button className="btn btn-secondary" disabled={step === 0} onClick={function () { setStep(step - 1); }}><Icon name="chevronLeft" size={15} />戻る</button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 12.5, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)' }}>{step + 1} / {steps.length}</div>
        {isLast
          ? <button className="btn btn-primary" onClick={function () { toast('週次レビュー完了！お疲れさまでした', 'check'); setStep(0); }}><Icon name="check" size={15} />レビュー完了</button>
          : <button className="btn btn-primary" onClick={function () { setStep(step + 1); }}>次へ<Icon name="chevronRight" size={15} /></button>}
      </div>

      {conv && conv.type === 'task' && <TaskEditModal task={{ title: conv.item.text }} onSaved={function () { Actions.deleteInbox(conv.item.id); setConv(null); }} onClose={function () { setConv(null); }} />}
      {conv && conv.type === 'someday' && <SomedayEditModal preset={{ text: conv.item.text }} onSaved={function () { Actions.deleteInbox(conv.item.id); setConv(null); }} onClose={function () { setConv(null); }} />}
      {tm.node}
    </div>
  );
}
function ReviewDone(props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '40px 20px', color: 'var(--ink-subtle)' }}>
      <span style={{ width: 44, height: 44, borderRadius: 99, background: 'color-mix(in srgb,var(--st-done) 16%,transparent)', color: 'var(--st-done)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={22} weight={2.4} /></span>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{props.text}</div>
    </div>
  );
}
window.ReviewScreen = ReviewScreen;
