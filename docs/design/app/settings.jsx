/* ============================================================
   settings.jsx — 設定（カテゴリ管理：追加/編集/並べ替え/非表示）
   ============================================================ */
var CAT_COLORS = ['#5e6ad2', '#26b5a8', '#e0a13a', '#d96aa6', '#7f8a99', '#4aa3df', '#9b8afb', '#5fb37a', '#e07a5f'];

function CategoryEditModal(props) {
  var init = props.category || {};
  var f = useState({ name: init.name || '', desc: init.desc || '', color: init.color || CAT_COLORS[0] });
  var v = f[0], setV = f[1];
  function up(k, val) { setV(function (p) { return Object.assign({}, p, { [k]: val }); }); }
  var valid = v.name.trim();
  function save() {
    if (!valid) return;
    var data = { name: v.name.trim(), desc: v.desc, color: v.color };
    if (props.category) { Actions.updateCategory(props.category.id, data); toast('カテゴリを更新'); }
    else { Actions.addCategory(data); toast('カテゴリを追加', 'plus'); }
    props.onClose();
  }
  return (
    <Modal title={props.category ? 'カテゴリを編集' : '新しいカテゴリ'} icon={<Icon name="folder" size={18} />} onClose={props.onClose}
      footer={<React.Fragment>
        <button className="btn btn-ghost" onClick={props.onClose}>キャンセル</button>
        <button className="btn btn-primary" disabled={!valid} onClick={save}>{props.category ? '保存' : '追加'}</button>
      </React.Fragment>}>
      <Field label="カテゴリ名" required><input className="input" autoFocus value={v.name} placeholder="例: テーマA" onChange={function (e) { up('name', e.target.value); }} /></Field>
      <Field label="説明" hint="任意"><input className="input" value={v.desc} placeholder="この領域の説明" onChange={function (e) { up('desc', e.target.value); }} /></Field>
      <Field label="カラー" gap={0}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CAT_COLORS.map(function (c) {
            var on = v.color === c;
            return <button key={c} onClick={function () { up('color', c); }} style={{ width: 28, height: 28, borderRadius: 99, background: c, border: on ? '2px solid var(--ink)' : '2px solid transparent', boxShadow: on ? '0 0 0 2px var(--canvas), 0 0 0 3px ' + c : 'none', cursor: 'pointer' }} />;
          })}
        </div>
      </Field>
    </Modal>
  );
}

function SettingsScreen() {
  var s = useStore();
  var modal = useState(null); var cm = modal[0], setCm = modal[1];
  var confirmReset = useState(false); var cr = confirmReset[0], setCr = confirmReset[1];
  var ordered = s.categories.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  var ids = ordered.map(function (c) { return c.id; });
  var byId = {}; ordered.forEach(function (c) { byId[c.id] = c; });
  var ls = useLiveSort(ids, function (o) { Actions.reorderCategories(o); });

  return (
    <div className="page fade-in">
      <PageHead icon="settings" title="設定" sub="カテゴリ管理と表示設定" />

      {/* 外観 */}
      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>外観テーマ</div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>ダーク / ライトを切り替えます</div>
          </div>
          <div className="seg">
            {[['dark', 'ダーク', 'moon'], ['light', 'ライト', 'sun']].map(function (o) {
              return <button key={o[0]} className={s.settings.theme === o[0] ? 'on' : ''} onClick={function () { Actions.setTheme(o[0]); }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name={o[2]} size={14} />{o[1]}</button>;
            })}
          </div>
        </div>
      </div>

      {/* カテゴリ */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', borderBottom: '1px solid var(--hairline)' }}>
          <Icon name="folder" size={17} style={{ color: 'var(--ink-subtle)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>カテゴリ</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 1 }}>ドラッグで並べ替え · 1年以上続く業務領域</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={function () { setCm({ type: 'new' }); }}><Icon name="plus" size={14} />追加</button>
        </div>
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ls.ids.map(function (id) {
            var c = byId[id]; if (!c) return null;
            var taskN = s.tasks.filter(function (t) { return t.categoryId === c.id && t.status !== 'done'; }).length;
            var pjN = s.projects.filter(function (p) { return p.categoryId === c.id && p.status === 'active'; }).length;
            var rp = ls.rowProps(id);
            return (
              <div key={id} className={'row-card ' + (rp.className || '')} draggable={true}
                onDragStart={rp.onDragStart} onDragOver={rp.onDragOver} onDragEnd={rp.onDragEnd}
                style={{ opacity: c.active ? 1 : 0.5 }}>
                <span className="drag-handle"><Icon name="grip" size={15} /></span>
                <span style={{ width: 11, height: 11, borderRadius: 99, background: c.color, flex: 'none' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</span>
                    {!c.active && <span className="pill" style={{ height: 18, fontSize: 11 }}>非表示</span>}
                  </div>
                  {c.desc && <div style={{ fontSize: 12, color: 'var(--ink-subtle)', marginTop: 2 }}>{c.desc}</div>}
                </div>
                <span style={{ fontSize: 11.5, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)' }}>タスク{taskN} · PJ{pjN}</span>
                <button className="btn btn-icon" style={{ width: 30, height: 30 }} title={c.active ? '非表示にする' : '表示する'} onClick={function () { Actions.updateCategory(c.id, { active: !c.active }); }}><Icon name={c.active ? 'eyeOff' : 'review'} size={15} /></button>
                <button className="btn btn-icon" style={{ width: 30, height: 30 }} onClick={function () { setCm({ type: 'edit', category: c }); }}><Icon name="edit" size={15} /></button>
              </div>
            );
          })}
        </div>
      </div>

      {/* データ */}
      <div className="card card-pad" style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>デモデータ</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>変更内容はこのブラウザに保存されます。初期状態に戻せます。</div>
        </div>
        <button className="btn btn-danger btn-secondary btn-sm" onClick={function () { setCr(true); }}><Icon name="review" size={14} />初期化</button>
      </div>

      {cm && cm.type === 'new' && <CategoryEditModal onClose={function () { setCm(null); }} />}
      {cm && cm.type === 'edit' && <CategoryEditModal category={cm.category} onClose={function () { setCm(null); }} />}
      {cr && <ConfirmDialog title="デモデータを初期化しますか？" danger confirmLabel="初期化する" onCancel={function () { setCr(false); }} onConfirm={function () { window.Store.reset(); setCr(false); toast('初期化しました', 'review'); }}>すべての変更が破棄され、サンプルデータに戻ります。</ConfirmDialog>}
    </div>
  );
}
window.SettingsScreen = SettingsScreen;
