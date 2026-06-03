/* ============================================================
   journal.jsx — 日次ジャーナル（今日のひとこと + 明日やることをD&D選択）
   ============================================================ */
function JournalScreen() {
  var s = useStore();
  var today = window.Store.today();
  var existing = s.journals.find(function (j) { return j.date === today; });
  var line = useState(existing ? existing.oneLine : ''); var oneLine = line[0], setOneLine = line[1];
  var sel = useState(existing ? existing.tomorrowTaskIds.slice() : []); var selected = sel[0], setSelected = sel[1];
  var saved = useState(false); var didSave = saved[0], setDidSave = saved[1];
  var lk = useLookup();

  var incomplete = s.tasks.filter(function (t) { return t.status !== 'done' && t.status !== 'waiting'; });
  var available = incomplete.filter(function (t) { return selected.indexOf(t.id) < 0; });
  var selectedTasks = selected.map(function (id) { return s.tasks.find(function (t) { return t.id === id; }); }).filter(Boolean);

  function add(id) { setSelected(function (p) { return p.indexOf(id) < 0 ? p.concat([id]) : p; }); setDidSave(false); }
  function remove(id) { setSelected(function (p) { return p.filter(function (x) { return x !== id; }); }); setDidSave(false); }
  function save() { Actions.saveJournal(today, { oneLine: oneLine, tomorrowTaskIds: selected }); setDidSave(true); toast('ジャーナルを保存しました', 'journal'); }

  var past = s.journals.filter(function (j) { return j.date !== today; }).sort(function (a, b) { return b.date.localeCompare(a.date); });
  var showPast = useState(false); var sp = showPast[0], setSp = showPast[1];

  return (
    <div className="page page-wide fade-in">
      <PageHead icon="journal" title="日次ジャーナル" sub={fmtDate(today, 'wd') + ' · 一日の終わりに、明日やることを決める'} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* 左：未完了タスク */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span className="eyebrow">未完了のタスク</span>
            <span style={{ fontSize: 12, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)' }}>{available.length}</span>
            <span className="muted" style={{ fontSize: 12, marginLeft: 'auto' }}>右へドラッグ →</span>
          </div>
          {available.length === 0
            ? <Empty icon="check" title="未完了タスクはありません" />
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {available.map(function (t) {
                  var cat = lk.cat[t.categoryId];
                  return (
                    <div key={t.id} className="card" {...makeDraggable(t.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'grab' }}>
                      <span className="drag-handle"><Icon name="grip" size={14} /></span>
                      <StatusIcon status={t.status} size={15} />
                      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                      {cat && <CategoryDot cat={cat} />}
                      {t.due && <DueBadge due={t.due} />}
                      <button className="btn btn-icon" style={{ width: 26, height: 26 }} title="明日やることに追加" onClick={function () { add(t.id); }}><Icon name="arrowRight" size={15} /></button>
                    </div>
                  );
                })}
              </div>}
        </div>

        {/* 右：今日のひとこと + 明日やること */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 16 }}>
          <div className="card card-pad">
            <div className="field-label" style={{ marginBottom: 8 }}>今日のひとこと<span className="field-req">*</span></div>
            <textarea className="textarea" value={oneLine} placeholder="今日はどんな一日だった？ 一言で振り返り。" onChange={function (e) { setOneLine(e.target.value); setDidSave(false); }} style={{ minHeight: 70 }} />
          </div>

          <DropZone accept="task" className="card" style={{ padding: 0 }} onDrop={function (id) { if (id) add(id); }}>
            {function (isOver) { return (
              <div style={{ padding: 16, minHeight: 160 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="arrowUpRight" size={15} weight={2} /></span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>明日やること</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)' }}>{selected.length}</span>
                  <span className="field-req" style={{ marginLeft: -4 }}>*</span>
                </div>
                {selectedTasks.length === 0
                  ? <div style={{ border: '1.5px dashed var(--hairline-strong)', borderRadius: 'var(--radius-md)', padding: '24px 16px', textAlign: 'center', color: 'var(--ink-tertiary)', fontSize: 13, background: isOver ? 'var(--drop-glow)' : 'transparent' }}>ここにタスクをドラッグ<br />明日「今日やること」として表示されます</div>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {selectedTasks.map(function (t, i) {
                        var cat = lk.cat[t.categoryId];
                        return (
                          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--hairline)' }}>
                            <span style={{ width: 20, height: 20, borderRadius: 6, background: 'var(--primary)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)' }}>{i + 1}</span>
                            <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                            {cat && <CategoryDot cat={cat} />}
                            <button className="btn btn-icon" style={{ width: 24, height: 24, color: 'var(--ink-tertiary)' }} onClick={function () { remove(t.id); }}><Icon name="x" size={14} /></button>
                          </div>
                        );
                      })}
                    </div>}
              </div>
            ); }}
          </DropZone>

          <button className="btn btn-primary" style={{ height: 42 }} disabled={!oneLine.trim() || selected.length === 0} onClick={save}>
            <Icon name={didSave ? 'check' : 'journal'} size={16} />{didSave ? '保存済み（更新する）' : 'ジャーナルを保存'}
          </button>
        </div>
      </div>

      {/* 過去のジャーナル */}
      {past.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <button className="btn btn-ghost btn-sm" onClick={function () { setSp(!sp); }}><Icon name={sp ? 'chevronDown' : 'chevronRight'} size={14} />過去のジャーナル {past.length}件</button>
          {sp && <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            {past.map(function (j) {
              return (
                <div key={j.date} className="card card-pad">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span className="tag"><Icon name="calendar" size={11} weight={2} />{fmtDate(j.date, 'wd')}</span>
                    <span style={{ fontSize: 12, color: 'var(--ink-tertiary)' }}>明日やること {j.tomorrowTaskIds.length}件</span>
                  </div>
                  <div style={{ fontSize: 13.5, color: 'var(--ink-muted)', lineHeight: 1.55 }}>{j.oneLine}</div>
                </div>
              );
            })}
          </div>}
        </div>
      )}
    </div>
  );
}
window.JournalScreen = JournalScreen;
