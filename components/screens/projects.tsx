'use client';
/* ============================================================
   projects.tsx — プロジェクト一覧 / Someday / 各モーダル
   （プロトタイプ docs/design/app/projects.jsx 準拠）
   ============================================================ */
import React, { useState } from 'react';
import { Icon } from '../icons';
import { Modal, Field, CategorySelect, CategoryTag, DueBadge, Empty } from '../ui';
import { useStore, useActions, useLookup } from '../store';
import { toast } from '../toast';
import { fmtDate, parseD } from '@/lib/date';
import type { Project, SomedayItem, Task } from '@/lib/types';
import { PageHead, TaskRow, useTaskModals, Popover, MenuItem } from './tasks';

/* ---- プロジェクト編集モーダル ---- */
export function ProjectEditModal(props: { project?: Project; preset?: Partial<Project>; onSaved?: () => void; onClose: () => void }) {
  const actions = useActions();
  const init = props.project || props.preset || {};
  const [v, setV] = useState({ name: init.name || '', categoryId: init.categoryId || '', goal: init.goal || '', done_def: init.done_def || '', due: init.due || '' });
  function up<K extends keyof typeof v>(k: K, val: string) { setV((p) => ({ ...p, [k]: val })); }
  const valid = v.name.trim() && v.categoryId;
  function save() {
    if (!valid) return;
    const data = { name: v.name.trim(), categoryId: v.categoryId, goal: v.goal, done_def: v.done_def, due: v.due || null };
    if (props.project) { actions.updateProject(props.project.id, data); toast('プロジェクトを更新'); }
    else { actions.addProject(data); toast('プロジェクトを追加', 'plus'); }
    props.onSaved && props.onSaved();
    props.onClose();
  }
  return (
    <Modal title={props.project ? 'プロジェクトを編集' : '新しいプロジェクト'} icon={<Icon name="project" size={18} />} onClose={props.onClose}
      footer={(
        <>
          <button className="btn btn-ghost" onClick={props.onClose}>キャンセル</button>
          <button className="btn btn-primary" disabled={!valid} onClick={save}>{props.project ? '保存' : '追加'}</button>
        </>
      )}>
      <Field label="プロジェクト名" required><input className="input" autoFocus value={v.name} placeholder="例: 年間計画化" onChange={(e) => up('name', e.target.value)} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="カテゴリ" required><CategorySelect value={v.categoryId} onChange={(val) => up('categoryId', val || '')} /></Field>
        <Field label="期限" hint="任意"><input type="date" className="input" value={v.due} onChange={(e) => up('due', e.target.value)} /></Field>
      </div>
      <Field label="目的" hint="任意"><input className="input" value={v.goal} placeholder="何のためのプロジェクトか" onChange={(e) => up('goal', e.target.value)} /></Field>
      <Field label="完了条件" hint="推奨" gap={0}><textarea className="textarea" value={v.done_def} placeholder="どうなったら完了か（入力推奨）" onChange={(e) => up('done_def', e.target.value)} /></Field>
    </Modal>
  );
}

/* ---- プロジェクトカード ---- */
export function ProjectCard(props: {
  project: Project; onAddTask?: () => void; onEditTask?: (t: Task) => void; onWaiting?: (t: Task) => void; onMenu?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const p = props.project, s = useStore(), lk = useLookup();
  const cat = lk.cat[p.categoryId];
  const tasks = s.tasks.filter((t) => t.projectId === p.id);
  const done = tasks.filter((t) => t.status === 'done').length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const nextAction = tasks.filter((t) => t.status === 'progress' || t.status === 'backlog')
    .sort((a, b) => (a.due ? parseD(a.due)!.getTime() : 1e15) - (b.due ? parseD(b.due)!.getTime() : 1e15))[0];
  const [open, setOpen] = useState(false);
  const isDone = p.status === 'done';
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

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 6, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: pct + '%', height: '100%', background: isDone ? 'var(--st-done)' : 'var(--primary)', borderRadius: 99, transition: 'width .4s var(--ease)' }} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--ink-subtle)', fontFamily: 'var(--font-mono)', flex: 'none' }}>{done}/{tasks.length}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          {cat && <CategoryTag cat={cat} />}
          {p.due && <DueBadge due={p.due} />}
          {nextAction && !isDone && <span className="tag" style={{ background: 'var(--primary-soft)', border: 'none', color: 'var(--primary)', maxWidth: 260 }}><Icon name="arrowRight" size={12} weight={2} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>次: {nextAction.title}</span></span>}
          {tasks.length > 0 && <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setOpen(!open)}>{open ? '閉じる' : 'タスク ' + tasks.length + '件'} <Icon name={open ? 'chevronDown' : 'chevronRight'} size={13} /></button>}
        </div>
      </div>
      {open && (
        <div style={{ borderTop: '1px solid var(--hairline)', padding: 6 }}>
          {tasks.slice().sort((a, b) => (a.order || 0) - (b.order || 0)).map((t) => <TaskRow key={t.id} task={t} onOpen={props.onEditTask} onWaiting={props.onWaiting} hideCat />)}
        </div>
      )}
    </div>
  );
}

/* ---- プロジェクト一覧画面 ---- */
export function ProjectsScreen() {
  const s = useStore();
  const actions = useActions();
  const tm = useTaskModals();
  const [pm, setPm] = useState<{ type: 'new' } | { type: 'edit'; project: Project } | null>(null);
  const [menu, setMenu] = useState<{ project: Project; anchor: DOMRect } | null>(null);
  const [sd, setSd] = useState(false);
  const active = s.projects.filter((p) => p.status === 'active').sort((a, b) => (a.order || 0) - (b.order || 0));
  const done = s.projects.filter((p) => p.status === 'done');

  return (
    <div className="page page-wide fade-in">
      <PageHead icon="project" title="プロジェクト" count={active.length}
        action={<button className="btn btn-primary" onClick={() => setPm({ type: 'new' })}><Icon name="plus" size={15} />新規プロジェクト</button>} />

      {active.length === 0
        ? <Empty icon="project" title="進行中のプロジェクトはありません" sub="複数ステップの作業はプロジェクトにまとめましょう。" action={<button className="btn btn-secondary" onClick={() => setPm({ type: 'new' })}><Icon name="plus" size={14} />プロジェクトを作る</button>} />
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 16 }}>
            {active.map((p) => (
              <ProjectCard key={p.id} project={p}
                onAddTask={() => tm.newTask({ categoryId: p.categoryId, projectId: p.id })}
                onEditTask={tm.edit} onWaiting={tm.waiting}
                onMenu={(e) => setMenu({ project: p, anchor: e.currentTarget.getBoundingClientRect() })} />
            ))}
          </div>
        )}

      {done.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setSd(!sd)}><Icon name={sd ? 'chevronDown' : 'chevronRight'} size={14} />完了したプロジェクト {done.length}件</button>
          {sd && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: 16, marginTop: 14 }}>
              {done.map((p) => <ProjectCard key={p.id} project={p} onMenu={(e) => setMenu({ project: p, anchor: e.currentTarget.getBoundingClientRect() })} onEditTask={tm.edit} onWaiting={tm.waiting} />)}
            </div>
          )}
        </div>
      )}

      {menu && (
        <Popover anchor={menu.anchor} onClose={() => setMenu(null)}>
          <MenuItem onClick={() => { setPm({ type: 'edit', project: menu.project }); setMenu(null); }}><Icon name="edit" size={14} />編集</MenuItem>
          {menu.project.status === 'active'
            ? <MenuItem onClick={() => { actions.completeProject(menu.project.id); setMenu(null); toast('プロジェクトを完了'); }}><Icon name="check" size={14} />完了にする</MenuItem>
            : <MenuItem onClick={() => { actions.reopenProject(menu.project.id); setMenu(null); toast('再開しました'); }}><Icon name="review" size={14} />再開する</MenuItem>}
        </Popover>
      )}
      {pm && pm.type === 'new' && <ProjectEditModal onClose={() => setPm(null)} />}
      {pm && pm.type === 'edit' && <ProjectEditModal project={pm.project} onClose={() => setPm(null)} />}
      {tm.node}
    </div>
  );
}

/* ============================================================
   Someday / Maybe
   ============================================================ */
export function SomedayEditModal(props: { item?: SomedayItem; preset?: Partial<SomedayItem>; onSaved?: () => void; onClose: () => void }) {
  const actions = useActions();
  const init = props.item || props.preset || {};
  const [v, setV] = useState({ text: init.text || '', categoryId: init.categoryId || '', reason: init.reason || '', reviewOn: init.reviewOn || '' });
  function up<K extends keyof typeof v>(k: K, val: string) { setV((p) => ({ ...p, [k]: val })); }
  const valid = v.text.trim() && v.categoryId;
  function save() {
    if (!valid) return;
    const data = { text: v.text.trim(), categoryId: v.categoryId, reason: v.reason, reviewOn: v.reviewOn || null };
    if (props.item) { actions.updateSomeday(props.item.id, data); toast('更新しました'); }
    else { actions.addSomeday(data); toast('Somedayに追加', 'sparkle'); }
    props.onSaved && props.onSaved();
    props.onClose();
  }
  return (
    <Modal title={props.item ? 'Somedayを編集' : 'Someday / Maybe'} icon={<Icon name="sparkle" size={18} />} onClose={props.onClose}
      footer={(
        <>
          <button className="btn btn-ghost" onClick={props.onClose}>キャンセル</button>
          <button className="btn btn-primary" disabled={!valid} onClick={save}>{props.item ? '保存' : '追加'}</button>
        </>
      )}>
      <Field label="内容" required><input className="input" autoFocus value={v.text} placeholder="いつかやりたいこと" onChange={(e) => up('text', e.target.value)} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="カテゴリ" required><CategorySelect value={v.categoryId} onChange={(val) => up('categoryId', val || '')} /></Field>
        <Field label="見直し日" hint="任意"><input type="date" className="input" value={v.reviewOn} onChange={(e) => up('reviewOn', e.target.value)} /></Field>
      </div>
      <Field label="理由" hint="任意" gap={0}><textarea className="textarea" value={v.reason} placeholder="なぜやりたいのか" onChange={(e) => up('reason', e.target.value)} /></Field>
    </Modal>
  );
}

export function SomedayScreen() {
  const s = useStore(); const lk = useLookup(); const actions = useActions();
  const [sm, setSm] = useState<{ type: 'new' } | { type: 'edit'; item: SomedayItem } | null>(null);
  const items = s.someday.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return (
    <div className="page fade-in">
      <PageHead icon="sparkle" title="Someday / Maybe" count={items.length} sub="今はやらないが、将来やる可能性があること"
        action={<button className="btn btn-primary" onClick={() => setSm({ type: 'new' })}><Icon name="plus" size={15} />追加</button>} />
      {items.length === 0
        ? <Empty icon="sparkle" title="まだありません" sub="アイデアの保管庫。週次レビューで見直します。" />
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {items.map((it) => {
              const cat = lk.cat[it.categoryId];
              return (
                <div key={it.id} className="card card-pad card-hover" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.45 }}>{it.text}</div>
                  {it.reason && <div style={{ fontSize: 12.5, color: 'var(--ink-subtle)', lineHeight: 1.5 }}>{it.reason}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                    {cat && <CategoryTag cat={cat} />}
                    {it.reviewOn && <span className="tag"><Icon name="review" size={11} weight={2} />{fmtDate(it.reviewOn, 'md')} 見直し</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, borderTop: '1px solid var(--hairline)', paddingTop: 12 }}>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => { actions.addTask({ title: it.text, categoryId: it.categoryId }); actions.deleteSomeday(it.id); toast('タスク化しました', 'task'); }}><Icon name="task" size={13} />タスク化</button>
                    <button className="btn btn-icon" style={{ width: 30, height: 30 }} onClick={() => setSm({ type: 'edit', item: it })}><Icon name="edit" size={14} /></button>
                    <button className="btn btn-icon" style={{ width: 30, height: 30, color: 'var(--ink-tertiary)' }} onClick={() => { actions.deleteSomeday(it.id); toast('削除しました', 'trash'); }}><Icon name="trash" size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      {sm && sm.type === 'new' && <SomedayEditModal onClose={() => setSm(null)} />}
      {sm && sm.type === 'edit' && <SomedayEditModal item={sm.item} onClose={() => setSm(null)} />}
    </div>
  );
}
