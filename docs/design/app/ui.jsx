/* ============================================================
   ui.jsx — 共有フック & UIコンポーネント
   ============================================================ */
var useState = React.useState, useEffect = React.useEffect, useRef = React.useRef, useMemo = React.useMemo, useCallback = React.useCallback;

/* ---- ストア購読フック ---- */
function useStore() {
  var sub = useCallback(function (cb) { return window.Store.subscribe(cb); }, []);
  var get = useCallback(function () { return window.Store.get(); }, []);
  return React.useSyncExternalStore(sub, get);
}

/* ---- 日付ヘルパ ---- */
var WD = ['日', '月', '火', '水', '木', '金', '土'];
function parseD(s) { return s ? new Date(s.length > 10 ? s : s + 'T00:00:00') : null; }
function fmtDate(s, opt) {
  var dt = parseD(s); if (!dt) return '';
  var m = dt.getMonth() + 1, day = dt.getDate();
  if (opt === 'md') return m + '月' + day + '日';
  if (opt === 'wd') return m + '/' + day + '(' + WD[dt.getDay()] + ')';
  return m + '/' + day;
}
function fmtTime(s) { var dt = parseD(s); if (!dt) return ''; return ('0' + dt.getHours()).slice(-2) + ':' + ('0' + dt.getMinutes()).slice(-2); }
function daysFromToday(s) {
  if (!s) return null;
  var a = parseD(window.Store.today()), b = parseD(s);
  return Math.round((b - a) / 86400000);
}
function relDay(s) {
  var n = daysFromToday(s);
  if (n === null) return '';
  if (n === 0) return '今日';
  if (n === 1) return '明日';
  if (n === -1) return '昨日';
  if (n < 0) return Math.abs(n) + '日前';
  return n + '日後';
}

/* ---- カテゴリ/プロジェクト参照 ---- */
function useLookup() {
  var s = useStore();
  return useMemo(function () {
    var cat = {}, pj = {};
    s.categories.forEach(function (c) { cat[c.id] = c; });
    s.projects.forEach(function (p) { pj[p.id] = p; });
    return { cat: cat, pj: pj };
  }, [s]);
}

/* ---- 小物 ---- */
function CategoryDot(props) {
  var c = props.cat;
  if (!c) return null;
  return <span style={{ width: props.size || 8, height: props.size || 8, borderRadius: 99, background: c.color, flex: 'none', display: 'inline-block' }} />;
}
function CategoryTag(props) {
  var c = props.cat; if (!c) return null;
  return (
    <span className="tag" style={props.style}>
      <CategoryDot cat={c} />{c.name}
    </span>
  );
}
function StatusBadge(props) {
  var meta = window.Store.statusMeta[props.status] || {};
  return (
    <span className="pill" style={{ paddingLeft: 7 }}>
      <StatusIcon status={props.status} size={13} />
      <span style={{ color: 'var(--ink-muted)' }}>{meta.label}</span>
    </span>
  );
}
function DueBadge(props) {
  var n = daysFromToday(props.due);
  if (n === null) return null;
  var color = 'var(--ink-subtle)', bg = 'var(--surface-2)';
  if (n < 0) { color = 'var(--danger)'; bg = 'color-mix(in srgb, var(--danger) 12%, transparent)'; }
  else if (n === 0) { color = 'var(--st-progress)'; bg = 'color-mix(in srgb, var(--st-progress) 14%, transparent)'; }
  return (
    <span className="pill" style={{ background: bg, border: 'none', color: color, gap: 5 }}>
      <Icon name="clock" size={11} weight={2} />{relDay(props.due)}
    </span>
  );
}
function Avatar(props) {
  var name = props.name || '?', size = props.size || 26;
  var ch = name.replace(/[^一-龯ぁ-んァ-ヶa-zA-Z]/g, '').slice(0, 1) || '?';
  var hue = 0; for (var i = 0; i < name.length; i++) hue = (hue * 31 + name.charCodeAt(i)) % 360;
  return (
    <span style={{ width: size, height: size, borderRadius: 99, flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 600, color: '#fff', background: 'hsl(' + hue + ' 42% 48%)' }}>{ch}</span>
  );
}

/* ---- Empty ---- */
function Empty(props) {
  return (
    <div className="empty fade-in">
      <Icon name={props.icon || 'inbox'} size={40} className="empty-ico" weight={1.4} />
      <div style={{ fontWeight: 600, color: 'var(--ink-muted)', fontSize: 14 }}>{props.title}</div>
      {props.sub && <div style={{ fontSize: 13, maxWidth: 320 }}>{props.sub}</div>}
      {props.action}
    </div>
  );
}

/* ---- Modal ---- */
function Modal(props) {
  useEffect(function () {
    function onKey(e) { if (e.key === 'Escape') props.onClose && props.onClose(); }
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('keydown', onKey); };
  }, []);
  return ReactDOM.createPortal(
    <div className="scrim" onMouseDown={function (e) { if (e.target === e.currentTarget) props.onClose && props.onClose(); }}>
      <div className={'modal ' + (props.wide ? 'modal-lg' : '')} role="dialog">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 22px', borderBottom: '1px solid var(--hairline)' }}>
          {props.icon && <span style={{ color: 'var(--ink-subtle)' }}>{props.icon}</span>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: '-0.02em' }}>{props.title}</div>
            {props.sub && <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>{props.sub}</div>}
          </div>
          <button className="btn btn-icon" onClick={props.onClose} aria-label="閉じる"><Icon name="x" size={16} /></button>
        </div>
        <div style={{ padding: '20px 22px', maxHeight: '64vh', overflowY: 'auto' }}>{props.children}</div>
        {props.footer && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 22px', borderTop: '1px solid var(--hairline)' }}>{props.footer}</div>}
      </div>
    </div>, document.body);
}

/* ---- Field ---- */
function Field(props) {
  return (
    <label style={{ display: 'block', marginBottom: props.gap == null ? 16 : props.gap }}>
      {props.label && <span className="field-label">{props.label}{props.required && <span className="field-req">*</span>}{props.hint && <span className="muted" style={{ fontWeight: 400, marginLeft: 8, fontSize: 11.5 }}>{props.hint}</span>}</span>}
      {props.children}
    </label>
  );
}

/* ---- Select（カテゴリ/プロジェクト） ---- */
function CategorySelect(props) {
  var s = useStore();
  var cats = s.categories.filter(function (c) { return c.active; });
  return (
    <select className="select" value={props.value || ''} onChange={function (e) { props.onChange(e.target.value || null); }}>
      <option value="">{props.placeholder || 'カテゴリを選択'}</option>
      {cats.map(function (c) { return <option key={c.id} value={c.id}>{c.name}</option>; })}
    </select>
  );
}
function ProjectSelect(props) {
  var s = useStore();
  var pjs = s.projects.filter(function (p) { return p.status === 'active' && (!props.categoryId || p.categoryId === props.categoryId); });
  return (
    <select className="select" value={props.value || ''} onChange={function (e) { props.onChange(e.target.value || null); }}>
      <option value="">プロジェクトなし</option>
      {pjs.map(function (p) { return <option key={p.id} value={p.id}>{p.name}</option>; })}
    </select>
  );
}

/* ---- Toast ---- */
var _toastFn = null;
function toast(msg, icon) { if (_toastFn) _toastFn(msg, icon); }
function ToastHost() {
  var arr = useState([])[0], set = useState([])[1];
  var listRef = useRef([]);
  useEffect(function () {
    _toastFn = function (msg, icon) {
      var id = Math.random();
      listRef.current = listRef.current.concat([{ id: id, msg: msg, icon: icon }]);
      set(listRef.current);
      setTimeout(function () { listRef.current = listRef.current.filter(function (t) { return t.id !== id; }); set(listRef.current); }, 2400);
    };
    return function () { _toastFn = null; };
  }, []);
  return ReactDOM.createPortal(
    <div className="toast-wrap">
      {listRef.current.map(function (t) {
        return <div className="toast" key={t.id}><span style={{ color: 'var(--st-done)' }}><Icon name={t.icon || 'check'} size={15} weight={2.4} /></span>{t.msg}</div>;
      })}
    </div>, document.body);
}

/* ---- Confirm ---- */
function ConfirmDialog(props) {
  return (
    <Modal title={props.title} sub={props.sub} onClose={props.onCancel}
      footer={<React.Fragment>
        <button className="btn btn-ghost" onClick={props.onCancel}>キャンセル</button>
        <button className={'btn ' + (props.danger ? 'btn-danger btn-secondary' : 'btn-primary')} onClick={props.onConfirm}>{props.confirmLabel || 'OK'}</button>
      </React.Fragment>}>
      <div style={{ color: 'var(--ink-muted)', fontSize: 14 }}>{props.children}</div>
    </Modal>
  );
}

/* ============================================================
   Actions — ストア変更ヘルパ
   ============================================================ */
var S = window.Store;
function patchList(list, id, patch) {
  return list.map(function (x) { return x.id === id ? Object.assign({}, x, typeof patch === 'function' ? patch(x) : patch, { updatedAt: new Date().toISOString() }) : x; });
}
var Actions = {
  /* タスク */
  addTask: function (data) {
    var t = Object.assign({ id: S.uid('tk'), status: 'backlog', projectId: null, due: null, note: '', createdAt: new Date().toISOString(), order: -Date.now() }, data);
    S.set(function (s) { return Object.assign({}, s, { tasks: [t].concat(s.tasks) }); });
    return t;
  },
  updateTask: function (id, patch) { S.set(function (s) { return Object.assign({}, s, { tasks: patchList(s.tasks, id, patch) }); }); },
  deleteTask: function (id) { S.set(function (s) { return Object.assign({}, s, { tasks: s.tasks.filter(function (t) { return t.id !== id; }) }); }); },
  setTaskStatus: function (id, status) {
    S.set(function (s) { return Object.assign({}, s, { tasks: patchList(s.tasks, id, function (t) {
      var p = { status: status }; if (status === 'done') p.completedAt = new Date().toISOString(); if (t.status === 'waiting' && status !== 'waiting') p.waiting = null; return p;
    }) }); });
  },
  toggleDone: function (id) { S.set(function (s) { return Object.assign({}, s, { tasks: patchList(s.tasks, id, function (t) {
    return t.status === 'done' ? { status: 'backlog', completedAt: null } : { status: 'done', completedAt: new Date().toISOString(), waiting: null }; }) }); }); },
  setWaiting: function (id, w) { S.set(function (s) { return Object.assign({}, s, { tasks: patchList(s.tasks, id, { status: 'waiting', waiting: Object.assign({ since: S.today() }, w) }) }); }); },
  clearWaiting: function (id, res) { S.set(function (s) { return Object.assign({}, s, { tasks: patchList(s.tasks, id, { status: res.status || 'backlog', waiting: null }) }); }); },
  reorderTasks: function (orderedIds) { S.set(function (s) {
    var pos = {}; orderedIds.forEach(function (id, i) { pos[id] = i; });
    return Object.assign({}, s, { tasks: s.tasks.map(function (t) { return pos[t.id] != null ? Object.assign({}, t, { order: pos[t.id] }) : t; }) }); }); },
  /* Inbox */
  addInbox: function (text) { var it = { id: S.uid('in'), text: text, status: 'open', createdAt: new Date().toISOString() };
    S.set(function (s) { return Object.assign({}, s, { inbox: [it].concat(s.inbox) }); }); return it; },
  deleteInbox: function (id) { S.set(function (s) { return Object.assign({}, s, { inbox: s.inbox.filter(function (i) { return i.id !== id; }) }); }); },
  updateInbox: function (id, patch) { S.set(function (s) { return Object.assign({}, s, { inbox: patchList(s.inbox, id, patch) }); }); },
  /* プロジェクト */
  addProject: function (data) { var p = Object.assign({ id: S.uid('pj'), status: 'active', order: -Date.now(), createdAt: new Date().toISOString() }, data);
    S.set(function (s) { return Object.assign({}, s, { projects: [p].concat(s.projects) }); }); return p; },
  updateProject: function (id, patch) { S.set(function (s) { return Object.assign({}, s, { projects: patchList(s.projects, id, patch) }); }); },
  completeProject: function (id) { S.set(function (s) { return Object.assign({}, s, { projects: patchList(s.projects, id, { status: 'done', completedAt: new Date().toISOString() }) }); }); },
  reopenProject: function (id) { S.set(function (s) { return Object.assign({}, s, { projects: patchList(s.projects, id, { status: 'active', completedAt: null }) }); }); },
  /* カテゴリ */
  addCategory: function (data) { var c = Object.assign({ id: S.uid('cat'), active: true, order: 999, color: '#5e6ad2', createdAt: new Date().toISOString() }, data);
    S.set(function (s) { return Object.assign({}, s, { categories: s.categories.concat([c]) }); }); return c; },
  updateCategory: function (id, patch) { S.set(function (s) { return Object.assign({}, s, { categories: patchList(s.categories, id, patch) }); }); },
  reorderCategories: function (orderedIds) { S.set(function (s) {
    var pos = {}; orderedIds.forEach(function (id, i) { pos[id] = i; });
    return Object.assign({}, s, { categories: s.categories.slice().sort(function (a, b) { return (pos[a.id] != null ? pos[a.id] : 99) - (pos[b.id] != null ? pos[b.id] : 99); }).map(function (c, i) { return Object.assign({}, c, { order: i }); }) }); }); },
  /* メモ */
  addMemo: function (data) { var m = Object.assign({ id: S.uid('mm'), projectId: null, fields: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, data);
    S.set(function (s) { return Object.assign({}, s, { memos: [m].concat(s.memos) }); }); return m; },
  updateMemo: function (id, patch) { S.set(function (s) { return Object.assign({}, s, { memos: patchList(s.memos, id, patch) }); }); },
  deleteMemo: function (id) { S.set(function (s) { return Object.assign({}, s, { memos: s.memos.filter(function (m) { return m.id !== id; }) }); }); },
  /* Someday */
  addSomeday: function (data) { var sd = Object.assign({ id: S.uid('sd'), createdAt: new Date().toISOString() }, data);
    S.set(function (s) { return Object.assign({}, s, { someday: [sd].concat(s.someday) }); }); return sd; },
  updateSomeday: function (id, patch) { S.set(function (s) { return Object.assign({}, s, { someday: patchList(s.someday, id, patch) }); }); },
  deleteSomeday: function (id) { S.set(function (s) { return Object.assign({}, s, { someday: s.someday.filter(function (x) { return x.id !== id; }) }); }); },
  /* ジャーナル */
  saveJournal: function (date, data) { S.set(function (s) {
    var exists = s.journals.some(function (j) { return j.date === date; });
    var journals = exists ? s.journals.map(function (j) { return j.date === date ? Object.assign({}, j, data, { updatedAt: new Date().toISOString() }) : j; })
      : [Object.assign({ date: date, createdAt: new Date().toISOString() }, data)].concat(s.journals);
    return Object.assign({}, s, { journals: journals }); }); },
  /* テーマ */
  setTheme: function (theme) { document.documentElement.setAttribute('data-theme', theme); S.set(function (s) { return Object.assign({}, s, { settings: Object.assign({}, s.settings, { theme: theme }) }); }); }
};
window.Actions = Actions;

/* ============================================================
   DnD — 並べ替え(useLiveSort) と ドロップ先(DropZone)
   ============================================================ */
function useLiveSort(initialIds, onCommit) {
  var st = useState(initialIds); var ids = st[0], setIds = st[1];
  var idsRef = useRef(initialIds);
  var dragId = useRef(null);
  var draggingState = useState(null); var draggingId = draggingState[0], setDraggingId = draggingState[1];
  useEffect(function () { idsRef.current = initialIds; setIds(initialIds); }, [initialIds.join('|')]);
  function setBoth(next) { idsRef.current = next; setIds(next); }
  function rowProps(id) {
    return {
      draggable: true,
      onDragStart: function (e) { dragId.current = id; setDraggingId(id); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', id); } catch (x) {} },
      onDragOver: function (e) {
        e.preventDefault();
        var cur = idsRef.current; var from = cur.indexOf(dragId.current), to = cur.indexOf(id);
        if (from < 0 || to < 0 || from === to) return;
        var next = cur.slice(); next.splice(to, 0, next.splice(from, 1)[0]); setBoth(next);
      },
      onDragEnd: function () { dragId.current = null; setDraggingId(null); onCommit && onCommit(idsRef.current); },
      className: draggingId === id ? 'dragging' : ''
    };
  }
  return { ids: ids, rowProps: rowProps, draggingId: draggingId };
}

function DropZone(props) {
  var st = useState(0); var over = st[0], setOver = st[1];
  var accept = props.accept || 'item';
  return (
    <div
      className={(props.className || '') + (over ? ' drop-active' : '')}
      style={props.style}
      onDragOver={function (e) { if (props.canDrop === false) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
      onDragEnter={function (e) { e.preventDefault(); setOver(function (n) { return n + 1; }); }}
      onDragLeave={function () { setOver(function (n) { return Math.max(0, n - 1); }); }}
      onDrop={function (e) { e.preventDefault(); setOver(0); var id = ''; try { id = e.dataTransfer.getData('text/plain'); } catch (x) {} props.onDrop && props.onDrop(id, accept); }}>
      {typeof props.children === 'function' ? props.children(over > 0) : props.children}
    </div>
  );
}
function makeDraggable(id) {
  return {
    draggable: true,
    onDragStart: function (e) { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', id); } catch (x) {} }
  };
}
window.useLiveSort = useLiveSort; window.DropZone = DropZone; window.makeDraggable = makeDraggable;

Object.assign(window, {
  useStore: useStore, useLookup: useLookup, useState: useState, useEffect: useEffect, useRef: useRef, useMemo: useMemo, useCallback: useCallback,
  fmtDate: fmtDate, fmtTime: fmtTime, daysFromToday: daysFromToday, relDay: relDay, parseD: parseD,
  CategoryDot: CategoryDot, CategoryTag: CategoryTag, StatusBadge: StatusBadge, DueBadge: DueBadge, Avatar: Avatar,
  Empty: Empty, Modal: Modal, Field: Field, CategorySelect: CategorySelect, ProjectSelect: ProjectSelect,
  toast: toast, ToastHost: ToastHost, ConfirmDialog: ConfirmDialog
});
