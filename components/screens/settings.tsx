'use client';
/* ============================================================
   settings.tsx — 設定（カテゴリ管理：追加/編集/並べ替え/非表示 + テーマ + 初期化）
   （プロトタイプ docs/design/app/settings.jsx 準拠）
   ============================================================ */
import React, { useState } from 'react';
import { Icon } from '../icons';
import { Modal, Field, ConfirmDialog, useLiveSort } from '../ui';
import { useStore, useActions } from '../store';
import { toast } from '../toast';
import type { Category, Theme } from '@/lib/types';
import { PageHead } from './tasks';

const CAT_COLORS = ['#5e6ad2', '#26b5a8', '#e0a13a', '#d96aa6', '#7f8a99', '#4aa3df', '#9b8afb', '#5fb37a', '#e07a5f'];

function CategoryEditModal(props: { category?: Category; onClose: () => void }) {
  const actions = useActions();
  const init = props.category || ({} as Partial<Category>);
  const [v, setV] = useState({ name: init.name || '', desc: init.desc || '', color: init.color || CAT_COLORS[0] });
  function up<K extends keyof typeof v>(k: K, val: string) { setV((p) => ({ ...p, [k]: val })); }
  const valid = v.name.trim();
  function save() {
    if (!valid) return;
    const data = { name: v.name.trim(), desc: v.desc, color: v.color };
    if (props.category) { actions.updateCategory(props.category.id, data); toast('カテゴリを更新'); }
    else { actions.addCategory(data); toast('カテゴリを追加', 'plus'); }
    props.onClose();
  }
  return (
    <Modal title={props.category ? 'カテゴリを編集' : '新しいカテゴリ'} icon={<Icon name="folder" size={18} />} onClose={props.onClose}
      footer={(
        <>
          <button className="btn btn-ghost" onClick={props.onClose}>キャンセル</button>
          <button className="btn btn-primary" disabled={!valid} onClick={save}>{props.category ? '保存' : '追加'}</button>
        </>
      )}>
      <Field label="カテゴリ名" required><input className="input" autoFocus value={v.name} placeholder="例: テーマA" onChange={(e) => up('name', e.target.value)} /></Field>
      <Field label="説明" hint="任意"><input className="input" value={v.desc} placeholder="この領域の説明" onChange={(e) => up('desc', e.target.value)} /></Field>
      <Field label="カラー" gap={0}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {CAT_COLORS.map((c) => {
            const on = v.color === c;
            return <button key={c} onClick={() => up('color', c)} style={{ width: 28, height: 28, borderRadius: 99, background: c, border: on ? '2px solid var(--ink)' : '2px solid transparent', boxShadow: on ? '0 0 0 2px var(--canvas), 0 0 0 3px ' + c : 'none', cursor: 'pointer' }} />;
          })}
        </div>
      </Field>
    </Modal>
  );
}

export function SettingsScreen() {
  const s = useStore();
  const actions = useActions();
  const [cm, setCm] = useState<{ type: 'new' } | { type: 'edit'; category: Category } | null>(null);
  const [cr, setCr] = useState(false);
  const ordered = s.categories.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const ids = ordered.map((c) => c.id);
  const byId: Record<string, Category> = {}; ordered.forEach((c) => { byId[c.id] = c; });
  const ls = useLiveSort(ids, (o) => actions.reorderCategories(o));

  return (
    <div className="page fade-in">
      <PageHead icon="settings" title="設定" sub="カテゴリ管理と表示設定" />

      <div className="card card-pad" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>外観テーマ</div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>ダーク / ライトを切り替えます</div>
          </div>
          <div className="seg">
            {([['dark', 'ダーク', 'moon'], ['light', 'ライト', 'sun']] as [Theme, string, string][]).map((o) => (
              <button key={o[0]} className={s.settings.theme === o[0] ? 'on' : ''} onClick={() => actions.setTheme(o[0])} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon name={o[2]} size={14} />{o[1]}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', borderBottom: '1px solid var(--hairline)' }}>
          <Icon name="folder" size={17} style={{ color: 'var(--ink-subtle)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>カテゴリ</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 1 }}>ドラッグで並べ替え · 1年以上続く業務領域</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setCm({ type: 'new' })}><Icon name="plus" size={14} />追加</button>
        </div>
        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ls.ids.map((id) => {
            const c = byId[id]; if (!c) return null;
            const taskN = s.tasks.filter((t) => t.categoryId === c.id && t.status !== 'done').length;
            const pjN = s.projects.filter((p) => p.categoryId === c.id && p.status === 'active').length;
            const rp = ls.rowProps(id);
            return (
              <div key={id} className={'row-card ' + (rp.className || '')} draggable
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
                <button className="btn btn-icon" style={{ width: 30, height: 30 }} title={c.active ? '非表示にする' : '表示する'} onClick={() => actions.updateCategory(c.id, { active: !c.active })}><Icon name={c.active ? 'eyeOff' : 'review'} size={15} /></button>
                <button className="btn btn-icon" style={{ width: 30, height: 30 }} onClick={() => setCm({ type: 'edit', category: c })}><Icon name="edit" size={15} /></button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card card-pad" style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>デモデータ</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>変更内容はSQLiteに保存されます。初期状態に戻せます。</div>
        </div>
        <button className="btn btn-danger btn-secondary btn-sm" onClick={() => setCr(true)}><Icon name="review" size={14} />初期化</button>
      </div>

      {cm && cm.type === 'new' && <CategoryEditModal onClose={() => setCm(null)} />}
      {cm && cm.type === 'edit' && <CategoryEditModal category={cm.category} onClose={() => setCm(null)} />}
      {cr && <ConfirmDialog title="デモデータを初期化しますか？" danger confirmLabel="初期化する" onCancel={() => setCr(false)} onConfirm={() => { actions.reset(); setCr(false); toast('初期化しました', 'review'); }}>すべての変更が破棄され、サンプルデータに戻ります。</ConfirmDialog>}
    </div>
  );
}
