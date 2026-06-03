/* ============================================================
   memos.jsx — メモ一覧 / 検索 / 詳細表示
   ============================================================ */
function MemoDetailModal(props) {
  var m = props.memo, lk = useLookup();
  var meta = window.Store.memoKinds[m.kind];
  var tpl = window.MEMO_TEMPLATES[m.kind];
  var cat = lk.cat[m.categoryId], pj = m.projectId ? lk.pj[m.projectId] : null;
  return (
    <Modal wide title={m.title}
      icon={<span style={{ color: meta.hue }}><Icon name={meta.icon} size={19} weight={1.9} /></span>}
      sub={meta.label}
      onClose={props.onClose}
      footer={<React.Fragment>
        <button className="btn btn-danger btn-secondary" style={{ marginRight: 'auto' }} onClick={function () { Actions.deleteMemo(m.id); toast('削除しました', 'trash'); props.onClose(); }}><Icon name="trash" size={14} />削除</button>
        <button className="btn btn-ghost" onClick={props.onClose}>閉じる</button>
        <button className="btn btn-primary" onClick={props.onEdit}><Icon name="edit" size={14} />編集</button>
      </React.Fragment>}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {cat && <CategoryTag cat={cat} />}
        {pj && <span className="tag"><Icon name="project" size={11} weight={2} />{pj.name}</span>}
        <span className="tag"><Icon name="calendar" size={11} weight={2} />{fmtDate(m.createdAt.slice(0, 10), 'md')} 作成</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {tpl.fields.map(function (f) {
          var val = m.fields[f.key];
          if (!val) return null;
          if (f.type === 'datetime') val = fmtDate(val.slice(0, 10), 'md') + ' ' + fmtTime(val);
          return (
            <div key={f.key} style={f.frame ? { borderLeft: '3px solid ' + meta.hue, paddingLeft: 12 } : null}>
              <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink-tertiary)', marginBottom: 5 }}>{f.label}</div>
              <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{val}</div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

function MemoCard(props) {
  var m = props.memo, lk = useLookup();
  var meta = window.Store.memoKinds[m.kind];
  var cat = lk.cat[m.categoryId];
  var tpl = window.MEMO_TEMPLATES[m.kind];
  // preview: first non-empty field
  var preview = '';
  for (var i = 0; i < tpl.fields.length; i++) { var v = m.fields[tpl.fields[i].key]; if (v && tpl.fields[i].type !== 'datetime') { preview = v; break; } }
  return (
    <button className="card card-hover" onClick={props.onClick}
      style={{ textAlign: 'left', padding: 0, display: 'flex', flexDirection: 'column', cursor: 'pointer', overflow: 'hidden' }}>
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb,' + meta.hue + ' 16%, transparent)', color: meta.hue, flex: 'none' }}><Icon name={meta.icon} size={15} weight={1.9} /></span>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: meta.hue }}>{meta.label}</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-tertiary)' }}>{fmtDate(m.createdAt.slice(0, 10), 'md')}</span>
      </div>
      <div style={{ padding: '10px 16px 16px', flex: 1 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 6, lineHeight: 1.4 }}>{m.title}</div>
        {preview && <div style={{ fontSize: 12.5, color: 'var(--ink-subtle)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{preview}</div>}
      </div>
      <div style={{ padding: '0 16px 14px' }}>{cat && <CategoryTag cat={cat} />}</div>
    </button>
  );
}

function MemosScreen() {
  var s = useStore();
  var filt = useState({ q: '', cat: '', kind: '', from: '', to: '' }); var f = filt[0], setF = filt[1];
  function up(k, val) { setF(function (p) { return Object.assign({}, p, { [k]: val }); }); }
  var detail = useState(null); var dv = detail[0], setDv = detail[1];
  var editor = useState(null); var ev = editor[0], setEv = editor[1];

  var filtered = useMemo(function () {
    return s.memos.filter(function (m) {
      if (f.kind && m.kind !== f.kind) return false;
      if (f.cat && m.categoryId !== f.cat) return false;
      var day = m.createdAt.slice(0, 10);
      if (f.from && day < f.from) return false;
      if (f.to && day > f.to) return false;
      if (f.q) {
        var hay = (m.title + ' ' + Object.values(m.fields).join(' ')).toLowerCase();
        if (hay.indexOf(f.q.toLowerCase()) < 0) return false;
      }
      return true;
    }).sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
  }, [s.memos, f]);

  var hasFilter = f.q || f.cat || f.kind || f.from || f.to;

  return (
    <div className="page page-wide fade-in">
      <PageHead icon="memo" title="メモ" count={s.memos.length}
        action={<button className="btn btn-primary" onClick={function () { setEv({ mode: 'new' }); }}><Icon name="plus" size={15} />メモを書く</button>} />

      {/* search */}
      <div className="card card-pad" style={{ marginBottom: 18, padding: 14 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-tertiary)' }}><Icon name="search" size={15} /></span>
            <input className="input" style={{ paddingLeft: 34 }} placeholder="キーワード検索…" value={f.q} onChange={function (e) { up('q', e.target.value); }} />
          </div>
          <select className="select" style={{ width: 'auto', minWidth: 110 }} value={f.kind} onChange={function (e) { up('kind', e.target.value); }}>
            <option value="">全種別</option>
            {Object.keys(s ? window.Store.memoKinds : {}).map(function (k) { return <option key={k} value={k}>{window.Store.memoKinds[k].label}</option>; })}
          </select>
          <select className="select" style={{ width: 'auto', minWidth: 120 }} value={f.cat} onChange={function (e) { up('cat', e.target.value); }}>
            <option value="">全カテゴリ</option>
            {s.categories.filter(function (c) { return c.active; }).map(function (c) { return <option key={c.id} value={c.id}>{c.name}</option>; })}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--ink-subtle)' }}>
            <input type="date" className="input" style={{ width: 'auto', padding: '7px 9px' }} value={f.from} onChange={function (e) { up('from', e.target.value); }} />
            <span>〜</span>
            <input type="date" className="input" style={{ width: 'auto', padding: '7px 9px' }} value={f.to} onChange={function (e) { up('to', e.target.value); }} />
          </div>
          {hasFilter && <button className="btn btn-ghost btn-sm" onClick={function () { setF({ q: '', cat: '', kind: '', from: '', to: '' }); }}><Icon name="x" size={13} />クリア</button>}
        </div>
      </div>

      {filtered.length === 0
        ? <Empty icon="search" title="該当するメモがありません" sub={hasFilter ? '検索条件を変えてみてください。' : '最初のメモを書いてみましょう。'} />
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {filtered.map(function (m) { return <MemoCard key={m.id} memo={m} onClick={function () { setDv(m); }} />; })}
          </div>}

      {dv && <MemoDetailModal memo={s.memos.find(function (x) { return x.id === dv.id; }) || dv} onClose={function () { setDv(null); }} onEdit={function () { setEv({ mode: 'edit', memo: dv }); setDv(null); }} />}
      {ev && ev.mode === 'new' && <MemoEditorModal onClose={function () { setEv(null); }} />}
      {ev && ev.mode === 'edit' && <MemoEditorModal memo={ev.memo} onClose={function () { setEv(null); }} />}
    </div>
  );
}

Object.assign(window, { MemosScreen: MemosScreen, MemoDetailModal: MemoDetailModal, MemoCard: MemoCard });
