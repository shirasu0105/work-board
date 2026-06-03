/* ============================================================
   projects.jsx — プロジェクト一覧 / Someday / 各モーダル
   ============================================================ */

/* ---- プロジェクト編集モーダル ---- */
function ProjectEditModal(props) {
  var init = props.project || props.preset || {};
  var f = useState({ name: init.name || '', categoryId: init.categoryId || '', goal: init.goal || '', done_def: init.done_def || '', due: init.due || '' });
  var v = f[0], setV = f[1];
  function up(k, val) { setV(function (p) { return Object.assign({}, p, { [k]: val }); }); }
  var valid = v.name.trim() && v.categoryId;
  function save() {
    if (!valid) return;
    var data = { name: v.name.trim(), categoryId: v.categoryId, goal: v.goal, done_def: v.done_def, due: v.due || null };
    if (props.project) { Actions.updateProject(props.project.id, data); toast('プロジェクトを更新'); }
    else { Actions.addProject(data); toast('プロジェクトを追加', 'plus'); }
    props.onSaved && props.onSaved();
    props.onClose();
  }
  return (
    <Modal title={props.project ? 'プロジェクトを編集' : '新しいプロジェクト'} icon={<Icon name="project" size={18} />} onClose={props.onClose}
      footer={<React.Fragment>
        <button className="btn btn-ghost" onClick={props.onClose}>キャンセル</button>
        <button className="btn btn-primary" disabled={!valid} onClick={save}>{props.project ? '保存' : '追加'}</button>
      </React.Fragment>}>
      <Field label="プロジェクト名" required><input className="input" autoFocus value={v.name} placeholder="例: 年間計画化" onChange={function (e) { up('name', e.target.value); }} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="カテゴリ" required><CategorySelect value={v.categoryId} onChange={function (val) { up('categoryId', val); }} /></Field>
        <Field label="期限" hint="任意"><input type="date" className="input" value={v.due} onChange={function (e) { up('due', e.target.value); }} /></Field>
      </div>
      <Field label="目的" hint="任意"><input className="input" value={v.goal} placeholder="何のためのプロジェクトか" onChange={function (e) { up('goal', e.target.value); }} /></Field>
      <Field label="完了条件" hint="推奨" gap={0}><textarea className="textarea" value={v.done_def} placeholder="どうなったら完了か（入力推奨）" onChange={function (e) { up('done_def', e.target.value); }} /></Field>
    </Modal>
  );
}

/* ---- プロジェクトカード ---- */
function ProjectCard(props) {
  var p = props.project, s = useStore(), lk = useLookup();
  var cat = lk.cat[p.categoryId];
  var tasks = s.tasks.filter(function (t) { return t.projectId === p.id; });
  var done = tasks.filter(function (t) { return t.status === 'done'; }).length;
  var pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  var nextAction = tasks.filter(function (t) { return t.status === 'progress' || t.status === 'backlog'; }).sort(function (a, b) { return (a.due ? parseD(a.due) : 1e15) - (b.due ? parseD(b.due) : 1e15); })[0];
  var exp = useState(false); var open = exp[0], setOpen = exp[1];
  var isDone = p.status === 'done';
  return (
    <div className="card" style={{ opacity: isDone ? 0.7 : 1 }}>
      <div className="card-pad" style={{ paddingBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ width: 36, height: 36, borderRadius: 9, background: 'color-mix(in srgb, ' + (cat ? cat.color : 'var(--primary)') + ' 16%, transparent)', color: cat ? cat.color : 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Icon name="project" size={18} weight={1.9} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: '-0.02em' }}>{p.name}</span>
              {isDone && <span className="pill" style={{ background: 'color-mix(in srgb, var(--st-done) 16%, transparent)', color: 'var(--st-done)', border: 'none' }}><Icon name="check" size={11} weight={2.5} />完了</span>}
            </div>
            {p.goal && <div style={{ fontSize: 13, color: 'var(--ink-subtle)', marginTop: 4 }}>{p.goal}</div>}
          </div>
          <div style={{ display: 'flex', gap: 4, flex: 'none' }}>
            {!isDone && <button className="btn btn-secondary btn-sm" onClick={props.onAddTask}><Icon name="plus" size={13} />タスク</button>}
            <button className="btn btn-icon" style={{ width: 30, height: 30 }} onClick={props.onMenu}><Icon name="dots" size={16} /></button>
          </div>
        </div>

        {/* progress */}
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 6, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: pct + '%', height: '100%', background: isDone ? 'var(--st-done)' : 'var(--primary)', borderRadius: 99, transition: 'width .4s var(--ease)' }} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--ink-subtle)', fontFamily: 'var(--font-mono)', flex: 'none' }}>{done}/{tasks.length}</span>
        </div>

        {/* meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          {cat && <CategoryTag cat={cat} />}
          {p.due && <DueBadge due={p.due} />}
          {nextAction && !isDone && <span className="tag" style={{ background: 'var(--primary-soft)', border: 'none', color: 'var(--primary)', maxWidth: 260 }}><Icon name="arrowRight" size={12} weight={2} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>次: {nextAction.title}</span></span>}
          {tasks.length > 0 && <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={function () { setOpen(!open); }}>{open ? '閉じる' : 'タスク ' + tasks.length + '件'} <Icon name={open ? 'chevronDown' : 'chevronRight'} size={13} /></button>}
        </div>
      </div>
      {open && (
        <div style={{ borderTop: '1px solid var(--hairline)', padding: 6 }}>
          {tasks.sort(function (a, b) { return (a.order || 0) - (b.order || 0); }).map(function (t) { return <TaskRow key={t.id} task={t} onOpen={props.onEditTask} onWaiting={props.onWaiting} hideCat />; })}
        </div>
      )}
    </div>
  );
}

/* ---- プロジェクト一覧画面 ---- */
function ProjectsScreen() {
  var s = useStore();
  var tm = useTaskModals();
  var modal = useState(null); var pm = modal[0], setPm = modal[1]; // {type, project}
  var menu = useState(null); var menuFor = menu[0], setMenuFor = menu[1]; var menuAnchor = useState(null);
  var active = s.projects.filter(function (p) { return p.status === 'active'; }).sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  var done = s.projects.filter(function (p) { return p.status === 'done'; });
  var showDone = useState(false); var sd = showDone[0], setSd = showDone[1];

  function menuOpen(p, e) { setMenuFor(p); menuAnchor[1](e.currentTarget.getBoundingClientRect()); }

  return (
    <div className="page page-wide fade-in">
      <PageHead icon="project" title="プロジェクト" count={active.length}
        action={<button className="btn btn-primary" onClick={function () { setPm({ type: 'new' }); }}><Icon name="plus" size={15} />新規プロジェクト</button>} />

      {active.length === 0
        ? <Empty icon="project" title="進行中のプロジェクトはありません" sub="複数ステップの作業はプロジェクトにまとめましょう。" action={<button className="btn btn-secondary" onClick={function () { setPm({ type: 'new' }); }}><Icon name="plus" size={14} />プロジェクトを作る</button>} />
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 16 }}>
            {active.map(function (p) {
              return <ProjectCard key={p.id} project={p}
                onAddTask={function () { tm.newTask({ categoryId: p.categoryId, projectId: p.id }); }}
                onEditTask={tm.edit} onWaiting={tm.waiting}
                onMenu={function (e) { menuOpen(p, e); }} />;
            })}
          </div>}

      {done.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <button className="btn btn-ghost btn-sm" onClick={function () { setSd(!sd); }}><Icon name={sd ? 'chevronDown' : 'chevronRight'} size={14} />完了したプロジェクト {done.length}件</button>
          {sd && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 16, marginTop: 14 }}>
            {done.map(function (p) { return <ProjectCard key={p.id} project={p} onMenu={function (e) { menuOpen(p, e); }} onEditTask={tm.edit} onWaiting={tm.waiting} />; })}
          </div>}
        </div>
      )}

      {menuAnchor[0] && menuFor && (
        <Popover anchor={menuAnchor[0]} onClose={function () { menuAnchor[1](null); }}>
          <MenuItem onClick={function () { setPm({ type: 'edit', project: menuFor }); menuAnchor[1](null); }}><Icon name="edit" size={14} />編集</MenuItem>
          {menuFor.status === 'active'
            ? <MenuItem onClick={function () { Actions.completeProject(menuFor.id); menuAnchor[1](null); toast('プロジェクトを完了'); }}><Icon name="check" size={14} />完了にする</MenuItem>
            : <MenuItem onClick={function () { Actions.reopenProject(menuFor.id); menuAnchor[1](null); toast('再開しました'); }}><Icon name="review" size={14} />再開する</MenuItem>}
        </Popover>
      )}
      {pm && pm.type === 'new' && <ProjectEditModal onClose={function () { setPm(null); }} />}
      {pm && pm.type === 'edit' && <ProjectEditModal project={pm.project} onClose={function () { setPm(null); }} />}
      {tm.node}
    </div>
  );
}

/* ============================================================
   Someday / Maybe
   ============================================================ */
function SomedayEditModal(props) {
  var init = props.item || props.preset || {};
  var f = useState({ text: init.text || '', categoryId: init.categoryId || '', reason: init.reason || '', reviewOn: init.reviewOn || '' });
  var v = f[0], setV = f[1];
  function up(k, val) { setV(function (p) { return Object.assign({}, p, { [k]: val }); }); }
  var valid = v.text.trim() && v.categoryId;
  function save() {
    if (!valid) return;
    var data = { text: v.text.trim(), categoryId: v.categoryId, reason: v.reason, reviewOn: v.reviewOn || null };
    if (props.item) { Actions.updateSomeday(props.item.id, data); toast('更新しました'); }
    else { Actions.addSomeday(data); toast('Somedayに追加', 'sparkle'); }
    props.onSaved && props.onSaved();
    props.onClose();
  }
  return (
    <Modal title={props.item ? 'Somedayを編集' : 'Someday / Maybe'} icon={<Icon name="sparkle" size={18} />} onClose={props.onClose}
      footer={<React.Fragment>
        <button className="btn btn-ghost" onClick={props.onClose}>キャンセル</button>
        <button className="btn btn-primary" disabled={!valid} onClick={save}>{props.item ? '保存' : '追加'}</button>
      </React.Fragment>}>
      <Field label="内容" required><input className="input" autoFocus value={v.text} placeholder="いつかやりたいこと" onChange={function (e) { up('text', e.target.value); }} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="カテゴリ" required><CategorySelect value={v.categoryId} onChange={function (val) { up('categoryId', val); }} /></Field>
        <Field label="見直し日" hint="任意"><input type="date" className="input" value={v.reviewOn} onChange={function (e) { up('reviewOn', e.target.value); }} /></Field>
      </div>
      <Field label="理由" hint="任意" gap={0}><textarea className="textarea" value={v.reason} placeholder="なぜやりたいのか" onChange={function (e) { up('reason', e.target.value); }} /></Field>
    </Modal>
  );
}

function SomedayScreen() {
  var s = useStore(); var lk = useLookup();
  var modal = useState(null); var sm = modal[0], setSm = modal[1];
  var items = s.someday.slice().sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  return (
    <div className="page fade-in">
      <PageHead icon="sparkle" title="Someday / Maybe" count={items.length} sub="今はやらないが、将来やる可能性があること"
        action={<button className="btn btn-primary" onClick={function () { setSm({ type: 'new' }); }}><Icon name="plus" size={15} />追加</button>} />
      {items.length === 0
        ? <Empty icon="sparkle" title="まだありません" sub="アイデアの保管庫。週次レビューで見直します。" />
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {items.map(function (it) {
              var cat = lk.cat[it.categoryId];
              return (
                <div key={it.id} className="card card-pad card-hover" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.45 }}>{it.text}</div>
                  {it.reason && <div style={{ fontSize: 12.5, color: 'var(--ink-subtle)', lineHeight: 1.5 }}>{it.reason}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                    {cat && <CategoryTag cat={cat} />}
                    {it.reviewOn && <span className="tag"><Icon name="review" size={11} weight={2} />{fmtDate(it.reviewOn, 'md')} 見直し</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, borderTop: '1px solid var(--hairline)', paddingTop: 12 }}>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={function () { Actions.addTask({ title: it.text, categoryId: it.categoryId }); Actions.deleteSomeday(it.id); toast('タスク化しました', 'task'); }}><Icon name="task" size={13} />タスク化</button>
                    <button className="btn btn-icon" style={{ width: 30, height: 30 }} onClick={function () { setSm({ type: 'edit', item: it }); }}><Icon name="edit" size={14} /></button>
                    <button className="btn btn-icon" style={{ width: 30, height: 30, color: 'var(--ink-tertiary)' }} onClick={function () { Actions.deleteSomeday(it.id); toast('削除しました', 'trash'); }}><Icon name="trash" size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>}
      {sm && sm.type === 'new' && <SomedayEditModal onClose={function () { setSm(null); }} />}
      {sm && sm.type === 'edit' && <SomedayEditModal item={sm.item} onClose={function () { setSm(null); }} />}
    </div>
  );
}

Object.assign(window, { ProjectEditModal: ProjectEditModal, ProjectCard: ProjectCard, ProjectsScreen: ProjectsScreen, SomedayEditModal: SomedayEditModal, SomedayScreen: SomedayScreen });
