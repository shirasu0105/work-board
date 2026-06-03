/* ============================================================
   tasks.jsx — タスク行・各種モーダル・タスク一覧画面・クイック追加
   ============================================================ */

/* ---- 汎用ポップオーバー ---- */
function Popover(props) {
  var ref = useRef(null);
  useEffect(function () {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) props.onClose(); }
    function onKey(e) { if (e.key === 'Escape') props.onClose(); }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, []);
  var a = props.anchor;
  if (!a) return null;
  var w = props.width || 200;
  var left = Math.min(a.left, window.innerWidth - w - 12);
  var top = a.bottom + 6;
  if (top + (props.maxH || 280) > window.innerHeight) top = Math.max(12, a.top - (props.maxH || 280) - 6);
  return ReactDOM.createPortal(
    <div ref={ref} style={{ position: 'fixed', left: left, top: top, width: w, zIndex: 150, background: 'var(--surface-3)', border: '1px solid var(--hairline-strong)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-pop)', padding: 5, animation: 'pop .12s var(--ease)', maxHeight: props.maxH || 320, overflowY: 'auto' }}>
      {props.children}
    </div>, document.body);
}
function MenuItem(props) {
  return (
    <button onClick={props.onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '7px 9px', border: 0, background: props.active ? 'var(--surface-1)' : 'transparent', color: props.danger ? 'var(--danger)' : 'var(--ink-muted)', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500, textAlign: 'left' }}
      onMouseEnter={function (e) { e.currentTarget.style.background = 'var(--surface-1)'; e.currentTarget.style.color = props.danger ? 'var(--danger)' : 'var(--ink)'; }}
      onMouseLeave={function (e) { e.currentTarget.style.background = props.active ? 'var(--surface-1)' : 'transparent'; e.currentTarget.style.color = props.danger ? 'var(--danger)' : 'var(--ink-muted)'; }}>
      {props.children}{props.active && <Icon name="check" size={14} style={{ marginLeft: 'auto' }} />}
    </button>
  );
}

/* ---- ステータス選択ボタン（円アイコン→メニュー） ---- */
function StatusControl(props) {
  var open = useState(null); var anchor = open[0], setAnchor = open[1];
  var order = ['backlog', 'progress', 'waiting', 'hold', 'done'];
  return (
    <React.Fragment>
      <button className="btn btn-icon" style={{ width: 26, height: 26 }} title="ステータス変更"
        onClick={function (e) { e.stopPropagation(); setAnchor(e.currentTarget.getBoundingClientRect()); }}>
        <StatusIcon status={props.status} size={16} />
      </button>
      {anchor && (
        <Popover anchor={anchor} width={180} onClose={function () { setAnchor(null); }}>
          {order.map(function (st) {
            return <MenuItem key={st} active={props.status === st} onClick={function () {
              if (st === 'waiting') { setAnchor(null); props.onWaiting && props.onWaiting(); return; }
              Actions.setTaskStatus(props.id, st); setAnchor(null);
            }}><StatusIcon status={st} size={15} /> {window.Store.statusMeta[st].label}</MenuItem>;
          })}
        </Popover>
      )}
    </React.Fragment>
  );
}

/* ---- 再利用タスク行 ---- */
function TaskRow(props) {
  var t = props.task, lk = useLookup();
  var cat = lk.cat[t.categoryId], pj = t.projectId ? lk.pj[t.projectId] : null;
  var menu = useState(null); var menuAnchor = menu[0], setMenuAnchor = menu[1];
  var dp = props.dragProps || {};
  var dragCls = dp.className || '';
  var rest = Object.assign({}, dp); delete rest.className;
  return (
    <div className={(props.boxed ? 'row-card ' : 'row-item ') + (props.rowClass || '') + ' ' + dragCls} {...rest}
      style={{ cursor: props.onOpen ? 'pointer' : 'default' }}
      onClick={function () { props.onOpen && props.onOpen(t); }}>
      {props.handle && <span className="drag-handle" onClick={function (e) { e.stopPropagation(); }}><Icon name="grip" size={15} /></span>}
      <StatusControl id={t.id} status={t.status} onWaiting={function () { props.onWaiting && props.onWaiting(t); }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: t.status === 'done' ? 'var(--ink-tertiary)' : 'var(--ink)', textDecoration: t.status === 'done' ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
        </div>
        {(t.status === 'waiting' && t.waiting) && (
          <div style={{ fontSize: 12, color: 'var(--st-waiting)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="clock" size={11} weight={2} /> {t.waiting.who}待ち · {t.waiting.reason}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }} onClick={function (e) { e.stopPropagation(); }}>
        {t.due && t.status !== 'done' && <DueBadge due={t.due} />}
        {pj && <span className="tag" style={{ maxWidth: 150 }}><Icon name="project" size={11} weight={2} style={{ color: 'var(--ink-tertiary)' }} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pj.name}</span></span>}
        {cat && !props.hideCat && <CategoryTag cat={cat} />}
        <button className="btn btn-icon" style={{ width: 26, height: 26 }} onClick={function (e) { setMenuAnchor(e.currentTarget.getBoundingClientRect()); }}><Icon name="dots" size={16} /></button>
        {menuAnchor && (
          <Popover anchor={menuAnchor} width={180} onClose={function () { setMenuAnchor(null); }}>
            <MenuItem onClick={function () { setMenuAnchor(null); props.onOpen && props.onOpen(t); }}><Icon name="edit" size={14} /> 編集</MenuItem>
            <MenuItem onClick={function () { Actions.toggleDone(t.id); setMenuAnchor(null); toast(t.status === 'done' ? '未完了に戻しました' : '完了にしました'); }}><Icon name="check" size={14} /> {t.status === 'done' ? '未完了に戻す' : '完了にする'}</MenuItem>
            <MenuItem danger onClick={function () { Actions.deleteTask(t.id); setMenuAnchor(null); toast('削除しました', 'trash'); }}><Icon name="trash" size={14} /> 削除</MenuItem>
          </Popover>
        )}
      </div>
    </div>
  );
}

/* ---- タスク編集モーダル ---- */
function TaskEditModal(props) {
  var init = props.task || {};
  var f = useState({ title: init.title || '', categoryId: init.categoryId || '', projectId: init.projectId || null, due: init.due || '', note: init.note || '', status: init.status || 'backlog' });
  var v = f[0], setV = f[1];
  function up(k, val) { setV(function (p) { return Object.assign({}, p, k === 'categoryId' ? { categoryId: val, projectId: null } : { [k]: val }); }); }
  var valid = v.title.trim() && v.categoryId;
  function save() {
    if (!valid) return;
    var data = { title: v.title.trim(), categoryId: v.categoryId, projectId: v.projectId, due: v.due || null, note: v.note };
    if (props.task) { Actions.updateTask(props.task.id, data); toast('タスクを更新しました'); }
    else { Actions.addTask(Object.assign(data, { status: 'backlog' })); toast('タスクを追加しました', 'plus'); }
    props.onSaved && props.onSaved();
    props.onClose();
  }
  return (
    <Modal title={props.task ? 'タスクを編集' : '新しいタスク'} icon={<Icon name="task" size={18} />} onClose={props.onClose}
      footer={<React.Fragment>
        <button className="btn btn-ghost" onClick={props.onClose}>キャンセル</button>
        <button className="btn btn-primary" disabled={!valid} onClick={save}>{props.task ? '保存' : '追加'}</button>
      </React.Fragment>}>
      <Field label="タスク名" required>
        <input className="input" autoFocus value={v.title} placeholder="例: 対応表のドラフトを作成する" onChange={function (e) { up('title', e.target.value); }} onKeyDown={function (e) { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save(); }} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="カテゴリ" required><CategorySelect value={v.categoryId} onChange={function (val) { up('categoryId', val); }} /></Field>
        <Field label="プロジェクト" hint="任意"><ProjectSelect value={v.projectId} categoryId={v.categoryId} onChange={function (val) { up('projectId', val); }} /></Field>
      </div>
      <Field label="期限" hint="任意"><input type="date" className="input" value={v.due} onChange={function (e) { up('due', e.target.value); }} /></Field>
      <Field label="メモ" hint="任意" gap={0}><textarea className="textarea" value={v.note} placeholder="補足や着手メモ" onChange={function (e) { up('note', e.target.value); }} /></Field>
    </Modal>
  );
}

/* ---- 待ち状態にする ---- */
function WaitingModal(props) {
  var f = useState({ who: '', reason: '', checkOn: '', memo: '' }); var v = f[0], setV = f[1];
  function up(k, val) { setV(function (p) { return Object.assign({}, p, { [k]: val }); }); }
  var valid = v.who.trim() && v.reason.trim();
  function save() { if (!valid) return; Actions.setWaiting(props.task.id, { who: v.who.trim(), reason: v.reason.trim(), checkOn: v.checkOn || null, memo: v.memo }); toast('待ち状態にしました', 'clock'); props.onClose(); }
  return (
    <Modal title="待ち状態にする" sub={props.task.title} icon={<Icon name="clock" size={18} />} onClose={props.onClose}
      footer={<React.Fragment>
        <button className="btn btn-ghost" onClick={props.onClose}>キャンセル</button>
        <button className="btn btn-primary" disabled={!valid} onClick={save}>待ちにする</button>
      </React.Fragment>}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="待ち相手" required><input className="input" autoFocus value={v.who} placeholder="例: 田中マネージャー" onChange={function (e) { up('who', e.target.value); }} /></Field>
        <Field label="確認予定日" hint="任意"><input type="date" className="input" value={v.checkOn} onChange={function (e) { up('checkOn', e.target.value); }} /></Field>
      </div>
      <Field label="待ち理由" required><input className="input" value={v.reason} placeholder="例: 計画ドラフトの承認待ち" onChange={function (e) { up('reason', e.target.value); }} /></Field>
      <Field label="依頼メモ" hint="任意" gap={0}><textarea className="textarea" value={v.memo} placeholder="依頼の経緯やリンクなど" onChange={function (e) { up('memo', e.target.value); }} /></Field>
    </Modal>
  );
}

/* ---- 待ち解除 ---- */
function WaitingResolveModal(props) {
  var f = useState({ status: 'backlog', memo: '' }); var v = f[0], setV = f[1];
  function save() { Actions.clearWaiting(props.task.id, { status: v.status }); toast('待ちを解除しました', 'check'); props.onClose(); }
  return (
    <Modal title="待ちを解除" sub={props.task.title} icon={<Icon name="check" size={18} />} onClose={props.onClose}
      footer={<React.Fragment>
        <button className="btn btn-ghost" onClick={props.onClose}>キャンセル</button>
        <button className="btn btn-primary" onClick={save}>解除する</button>
      </React.Fragment>}>
      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 16, fontSize: 13, color: 'var(--ink-muted)' }}>
        <span style={{ color: 'var(--st-waiting)' }}>{props.task.waiting.who}</span> からの返答を受けて、ボールが自分に戻りました。
      </div>
      <Field label="解除後のステータス">
        <div className="seg">
          {[['backlog', '未着手'], ['progress', '対応中']].map(function (o) {
            return <button key={o[0]} className={v.status === o[0] ? 'on' : ''} onClick={function () { setV(function (p) { return Object.assign({}, p, { status: o[0] }); }); }}>{o[1]}</button>;
          })}
        </div>
      </Field>
      <Field label="返答メモ" hint="任意" gap={0}><textarea className="textarea" value={v.memo} placeholder="返ってきた内容" onChange={function (e) { setV(function (p) { return Object.assign({}, p, { memo: e.target.value }); }); }} /></Field>
    </Modal>
  );
}

/* ---- クイック追加（Inbox/タスク） ---- */
function QuickAddModal(props) {
  var tab = useState('inbox'); var mode = tab[0], setMode = tab[1];
  var f = useState({ text: '', categoryId: '', due: '' }); var v = f[0], setV = f[1];
  function save() {
    if (!v.text.trim()) return;
    if (mode === 'inbox') { Actions.addInbox(v.text.trim()); toast('Inboxに追加しました', 'inbox'); }
    else { if (!v.categoryId) return; Actions.addTask({ title: v.text.trim(), categoryId: v.categoryId, due: v.due || null }); toast('タスクを追加しました', 'plus'); }
    props.onClose();
  }
  var valid = v.text.trim() && (mode === 'inbox' || v.categoryId);
  return (
    <Modal title="クイック追加" icon={<Icon name="plus" size={18} />} onClose={props.onClose}
      footer={<React.Fragment>
        <button className="btn btn-ghost" onClick={props.onClose}>キャンセル</button>
        <button className="btn btn-primary" disabled={!valid} onClick={save}>追加</button>
      </React.Fragment>}>
      <div className="seg" style={{ marginBottom: 16 }}>
        <button className={mode === 'inbox' ? 'on' : ''} onClick={function () { setMode('inbox'); }}>Inboxへ</button>
        <button className={mode === 'task' ? 'on' : ''} onClick={function () { setMode('task'); }}>タスクとして</button>
      </div>
      <Field label={mode === 'inbox' ? '内容' : 'タスク名'} required gap={mode === 'inbox' ? 0 : 16}>
        <input className="input" autoFocus value={v.text} placeholder={mode === 'inbox' ? '思いついたことを素早く…' : '例: 週報を提出する'}
          onChange={function (e) { setV(function (p) { return Object.assign({}, p, { text: e.target.value }); }); }}
          onKeyDown={function (e) { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save(); else if (e.key === 'Enter' && mode === 'inbox') save(); }} />
      </Field>
      {mode === 'task' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="カテゴリ" required gap={0}><CategorySelect value={v.categoryId} onChange={function (val) { setV(function (p) { return Object.assign({}, p, { categoryId: val }); }); }} /></Field>
          <Field label="期限" hint="任意" gap={0}><input type="date" className="input" value={v.due} onChange={function (e) { setV(function (p) { return Object.assign({}, p, { due: e.target.value }); }); }} /></Field>
        </div>
      )}
      {mode === 'inbox' && <p className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>Inboxは"とりあえず置く"場所。後でタスク・プロジェクト・Somedayに整理できます。</p>}
    </Modal>
  );
}

Object.assign(window, { Popover: Popover, MenuItem: MenuItem, StatusControl: StatusControl, TaskRow: TaskRow, TaskEditModal: TaskEditModal, WaitingModal: WaitingModal, WaitingResolveModal: WaitingResolveModal, QuickAddModal: QuickAddModal });

/* ---- タスク用モーダル制御フック（各画面で共有） ---- */
function useTaskModals() {
  var m = useState(null); var modal = m[0], setModal = m[1];
  var api = {
    newTask: function (preset) { setModal({ type: 'edit', task: preset || null }); },
    edit: function (t) { setModal({ type: 'edit', task: t }); },
    waiting: function (t) { setModal({ type: 'waiting', task: t }); },
    resolve: function (t) { setModal({ type: 'resolve', task: t }); },
    close: function () { setModal(null); }
  };
  var node = null;
  if (modal) {
    if (modal.type === 'edit') node = <TaskEditModal task={modal.task} onClose={api.close} />;
    else if (modal.type === 'waiting') node = <WaitingModal task={modal.task} onClose={api.close} />;
    else if (modal.type === 'resolve') node = <WaitingResolveModal task={modal.task} onClose={api.close} />;
  }
  api.node = node;
  return api;
}

/* ---- フィルタバー ---- */
function FilterBar(props) {
  var v = props.value, set = props.onChange;
  function up(k, val) { set(Object.assign({}, v, { [k]: val })); }
  var statuses = ['backlog', 'progress', 'waiting', 'hold', 'done'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
      <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
        <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-tertiary)' }}><Icon name="search" size={15} /></span>
        <input className="input" style={{ paddingLeft: 34 }} placeholder="タスクを検索…" value={v.q} onChange={function (e) { up('q', e.target.value); }} />
      </div>
      <select className="select" style={{ width: 'auto', minWidth: 130 }} value={v.cat} onChange={function (e) { up('cat', e.target.value); }}>
        <option value="">全カテゴリ</option>
        {props.cats.map(function (c) { return <option key={c.id} value={c.id}>{c.name}</option>; })}
      </select>
      <select className="select" style={{ width: 'auto', minWidth: 120 }} value={v.proj} onChange={function (e) { up('proj', e.target.value); }}>
        <option value="">PJ有無：全て</option>
        <option value="has">PJに紐づく</option>
        <option value="none">単発のみ</option>
      </select>
      {props.showStatus !== false && (
        <div style={{ display: 'flex', gap: 4 }}>
          {statuses.map(function (st) {
            var on = v.status === st;
            return <button key={st} className="btn btn-sm" title={window.Store.statusMeta[st].label}
              style={{ width: 30, padding: 0, background: on ? 'var(--primary-soft)' : 'var(--surface-2)', border: '1px solid ' + (on ? 'var(--primary)' : 'var(--hairline)') }}
              onClick={function () { up('status', on ? '' : st); }}><StatusIcon status={st} size={15} /></button>;
          })}
        </div>
      )}
    </div>
  );
}

function applyFilters(tasks, v) {
  return tasks.filter(function (t) {
    if (v.q && t.title.toLowerCase().indexOf(v.q.toLowerCase()) < 0) return false;
    if (v.cat && t.categoryId !== v.cat) return false;
    if (v.status && t.status !== v.status) return false;
    if (v.proj === 'has' && !t.projectId) return false;
    if (v.proj === 'none' && t.projectId) return false;
    return true;
  });
}

/* ---- タスク一覧画面 ---- */
function TasksScreen(props) {
  var s = useStore();
  var tm = useTaskModals();
  var view = useState('list'); var mode = view[0], setMode = view[1];
  var fl = useState({ q: '', cat: props.fixedCat || '', status: '', proj: '' }); var filter = fl[0], setFilter = fl[1];
  var filtered = useMemo(function () { return applyFilters(s.tasks, filter); }, [s.tasks, filter]);

  return (
    <div className={'page fade-in' + (mode === 'board' ? ' page-wide' : '')} style={mode === 'board' ? { maxWidth: 'none' } : null}>
      <PageHead icon="task" title={props.title || 'タスク'} count={filtered.length}
        action={<button className="btn btn-primary" onClick={function () { tm.newTask(props.fixedCat ? { categoryId: props.fixedCat } : null); }}><Icon name="plus" size={15} />新規タスク</button>}>
        <div className="seg">
          <button className={mode === 'board' ? 'on' : ''} onClick={function () { setMode('board'); }}>かんばん</button>
          <button className={mode === 'list' ? 'on' : ''} onClick={function () { setMode('list'); }}>リスト</button>
        </div>
      </PageHead>

      <FilterBar value={filter} onChange={setFilter} cats={s.categories.filter(function (c) { return c.active; })} showStatus={mode === 'list'} />

      {mode === 'board'
        ? <TaskBoard tasks={filtered} tm={tm} />
        : <TaskList tasks={filtered} tm={tm} />}
      {tm.node}
    </div>
  );
}

/* ---- かんばんカード ---- */
function KanbanCard(props) {
  var t = props.task, lk = useLookup();
  var cat = lk.cat[t.categoryId], pj = t.projectId ? lk.pj[t.projectId] : null;
  var dragSt = useState(false); var dragging = dragSt[0], setDragging = dragSt[1];
  return (
    <div className="kanban-card" {...makeDraggable(t.id)}
      onDragStart={function (e) { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', t.id); } catch (x) {} setDragging(true); }}
      onDragEnd={function () { setDragging(false); }}
      style={{ opacity: dragging ? 0.4 : 1 }}
      onClick={function () { props.tm.edit(t); }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
        <span style={{ marginTop: 1 }} onClick={function (e) { e.stopPropagation(); }}>
          <StatusControl id={t.id} status={t.status} onWaiting={function () { props.tm.waiting(t); }} />
        </span>
        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, lineHeight: 1.45, color: t.status === 'done' ? 'var(--ink-tertiary)' : 'var(--ink)', textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</span>
      </div>
      {(t.status === 'waiting' && t.waiting) && (
        <div style={{ fontSize: 11.5, color: 'var(--st-waiting)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon name="clock" size={11} weight={2} /> {t.waiting.who}待ち
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
        {cat && <CategoryTag cat={cat} />}
        {pj && <span className="tag" style={{ maxWidth: 150 }}><Icon name="project" size={11} weight={2} style={{ color: 'var(--ink-tertiary)' }} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pj.name}</span></span>}
        {t.due && t.status !== 'done' && <DueBadge due={t.due} />}
      </div>
    </div>
  );
}

/* ---- かんばん（横並びカラム・ドラッグで状態変更） ---- */
function TaskBoard(props) {
  var columns = ['backlog', 'progress', 'waiting', 'hold', 'done'];
  return (
    <div className="kanban-scroll">
      {columns.map(function (st) {
        var items = props.tasks.filter(function (t) { return t.status === st; }).sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        var meta = window.Store.statusMeta[st];
        return (
          <DropZone key={st} accept="task" className="kanban-col"
            onDrop={function (id) {
              var t = window.Store.get().tasks.find(function (x) { return x.id === id; });
              if (!t || t.status === st) return;
              if (st === 'waiting') { props.tm.waiting(t); return; }
              Actions.setTaskStatus(id, st); toast(meta.label + 'に移動', 'arrowRight');
            }}>
            <div className="kanban-col-head">
              <StatusIcon status={st} size={15} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{meta.label}</span>
              <span style={{ fontSize: 12, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)' }}>{items.length}</span>
              <button className="btn btn-icon" style={{ width: 24, height: 24, marginLeft: 'auto' }} title="このステータスで追加"
                onClick={function () { props.tm.newTask({ status: st === 'waiting' ? 'backlog' : st }); }}><Icon name="plus" size={15} /></button>
            </div>
            <div className="kanban-body">
              {items.map(function (t) { return <KanbanCard key={t.id} task={t} tm={props.tm} />; })}
              {items.length === 0 && <div style={{ padding: '18px 8px', textAlign: 'center', fontSize: 12, color: 'var(--ink-tertiary)' }}>ここにドラッグ</div>}
            </div>
          </DropZone>
        );
      })}
    </div>
  );
}

/* ---- リスト（ドラッグで並べ替え） ---- */
function TaskList(props) {
  var sorted = useMemo(function () { return props.tasks.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); }); }, [props.tasks]);
  var ids = useMemo(function () { return sorted.map(function (t) { return t.id; }); }, [sorted]);
  var byId = {}; sorted.forEach(function (t) { byId[t.id] = t; });
  var ls = useLiveSort(ids, function (ordered) { Actions.reorderTasks(ordered); });
  if (sorted.length === 0) return <Empty icon="task" title="該当するタスクがありません" sub="フィルタを変えるか、新しいタスクを追加してください。" />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {ls.ids.map(function (id) {
        var t = byId[id]; if (!t) return null;
        return <TaskRow key={id} task={t} handle boxed dragProps={ls.rowProps(id)} onOpen={props.tm.edit} onWaiting={props.tm.waiting} />;
      })}
    </div>
  );
}

/* ---- 待ち一覧画面 ---- */
function WaitingScreen() {
  var s = useStore();
  var tm = useTaskModals();
  var waiting = s.tasks.filter(function (t) { return t.status === 'waiting' && t.waiting; })
    .sort(function (a, b) { return parseD(a.waiting.since) - parseD(b.waiting.since); });
  return (
    <div className="page fade-in">
      <PageHead icon="clock" title="待ち" count={waiting.length} sub="自分以外がボールを持っているタスク" />
      {waiting.length === 0
        ? <Empty icon="clock" title="待ちタスクはありません" sub="誰かの返答待ちになったタスクはここに集まります。" />
        : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {waiting.map(function (t) { return <WaitingCard key={t.id} task={t} onResolve={function () { tm.resolve(t); }} onEdit={function () { tm.edit(t); }} />; })}
          </div>}
      {tm.node}
    </div>
  );
}
function WaitingCard(props) {
  var t = props.task, w = t.waiting, lk = useLookup();
  var cat = lk.cat[t.categoryId];
  var since = daysFromToday(w.since); var elapsed = since != null ? Math.abs(since) : 0;
  var due = w.checkOn ? daysFromToday(w.checkOn) : null;
  var overdue = due != null && due <= 0;
  return (
    <div className="card card-pad" style={{ borderLeft: '3px solid var(--st-waiting)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <Avatar name={w.who} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{t.title}</span>
            {cat && <CategoryTag cat={cat} />}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 5 }}>
            <span style={{ color: 'var(--st-waiting)', fontWeight: 600 }}>{w.who}</span> 待ち · {w.reason}
          </div>
          {w.memo && <div style={{ fontSize: 12.5, color: 'var(--ink-subtle)', marginTop: 6, background: 'var(--surface-2)', borderRadius: 6, padding: '7px 10px' }}>{w.memo}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 10, fontSize: 12, color: 'var(--ink-subtle)' }}>
            <span><Icon name="clock" size={11} weight={2} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4 }} />待ち {elapsed}日</span>
            <span>開始 {fmtDate(w.since, 'md')}</span>
            {w.checkOn && <span style={{ color: overdue ? 'var(--danger)' : 'var(--ink-subtle)', fontWeight: overdue ? 600 : 400 }}>確認予定 {fmtDate(w.checkOn, 'md')}{overdue ? '（要確認）' : ''}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 'none' }}>
          <button className="btn btn-primary btn-sm" onClick={props.onResolve}><Icon name="check" size={14} />解除</button>
          <button className="btn btn-ghost btn-sm" onClick={props.onEdit}>詳細</button>
        </div>
      </div>
    </div>
  );
}

/* ---- 共通ページヘッダ ---- */
function PageHead(props) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 22 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <span style={{ color: 'var(--ink-subtle)' }}><Icon name={props.icon} size={20} weight={1.9} /></span>
          <h1 className="display" style={{ fontSize: 26 }}>{props.title}</h1>
          {props.count != null && <span style={{ fontSize: 14, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{props.count}</span>}
        </div>
        {props.sub && <p className="muted" style={{ fontSize: 13.5, marginTop: 6, marginLeft: 31 }}>{props.sub}</p>}
      </div>
      {props.children}
      {props.action}
    </div>
  );
}

Object.assign(window, { useTaskModals: useTaskModals, FilterBar: FilterBar, applyFilters: applyFilters, TasksScreen: TasksScreen, WaitingScreen: WaitingScreen, PageHead: PageHead });
