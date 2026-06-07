'use client';
/* ============================================================
   tasks.tsx — タスク行 / 各種モーダル / 一覧(リスト・かんばん) / 待ち一覧 / クイック追加
   （プロトタイプ docs/design/app/tasks.jsx 準拠）
   ============================================================ */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon, StatusIcon } from '../icons';
import { Modal, Field, CategorySelect, ProjectSelect, DueBadge, CategoryTag, Empty, Avatar, makeDraggable, DropZone, useLiveSort, RowDragProps } from '../ui';
import { useStore, useActions, useLookup } from '../store';
import { toast } from '../toast';
import { statusMeta, statusOrder } from '@/lib/meta';
import { fmtDate, daysFromToday, parseD } from '@/lib/date';
import type { Task, Category, TaskStatus } from '@/lib/types';

/* ---- 汎用ポップオーバー ---- */
export function Popover(props: { anchor: DOMRect | null; width?: number; maxH?: number; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) props.onClose(); }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') props.onClose(); }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [props]);
  const a = props.anchor;
  if (!a || typeof document === 'undefined') return null;
  const w = props.width || 200;
  const left = Math.min(a.left, window.innerWidth - w - 12);
  let top = a.bottom + 6;
  if (top + (props.maxH || 280) > window.innerHeight) top = Math.max(12, a.top - (props.maxH || 280) - 6);
  return createPortal(
    <div ref={ref} style={{ position: 'fixed', left, top, width: w, zIndex: 150, background: 'var(--surface-3)', border: '1px solid var(--hairline-strong)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-pop)', padding: 5, animation: 'pop .12s var(--ease)', maxHeight: props.maxH || 320, overflowY: 'auto' }}>
      {props.children}
    </div>,
    document.body,
  );
}

export function MenuItem(props: { onClick: () => void; active?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={props.onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '7px 9px', border: 0, background: props.active ? 'var(--surface-1)' : 'transparent', color: props.danger ? 'var(--danger)' : 'var(--ink-muted)', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 500, textAlign: 'left' }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-1)'; e.currentTarget.style.color = props.danger ? 'var(--danger)' : 'var(--ink)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = props.active ? 'var(--surface-1)' : 'transparent'; e.currentTarget.style.color = props.danger ? 'var(--danger)' : 'var(--ink-muted)'; }}>
      {props.children}{props.active && <Icon name="check" size={14} style={{ marginLeft: 'auto' }} />}
    </button>
  );
}

/* ---- ステータス選択ボタン ---- */
export function StatusControl(props: { id: string; status: TaskStatus; onWaiting?: () => void }) {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const actions = useActions();
  return (
    <>
      <button className="btn btn-icon" style={{ width: 26, height: 26 }} title="ステータス変更"
        onClick={(e) => { e.stopPropagation(); setAnchor(e.currentTarget.getBoundingClientRect()); }}>
        <StatusIcon status={props.status} size={16} />
      </button>
      {anchor && (
        <Popover anchor={anchor} width={180} onClose={() => setAnchor(null)}>
          {statusOrder.map((st) => (
            <MenuItem key={st} active={props.status === st} onClick={() => {
              if (st === 'waiting') { setAnchor(null); props.onWaiting && props.onWaiting(); return; }
              actions.setTaskStatus(props.id, st); setAnchor(null);
            }}><StatusIcon status={st} size={15} /> {statusMeta[st].label}</MenuItem>
          ))}
        </Popover>
      )}
    </>
  );
}

/* ---- 再利用タスク行 ---- */
export function TaskRow(props: {
  task: Task; onOpen?: (t: Task) => void; onWaiting?: (t: Task) => void;
  handle?: boolean; boxed?: boolean; rowClass?: string; dragProps?: RowDragProps; hideCat?: boolean;
}) {
  const t = props.task, lk = useLookup(), actions = useActions();
  const cat = lk.cat[t.categoryId], pj = t.projectId ? lk.pj[t.projectId] : null;
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null);
  const dp = props.dragProps;
  const dragCls = dp?.className || '';
  const rest = dp ? { draggable: dp.draggable, onDragStart: dp.onDragStart, onDragOver: dp.onDragOver, onDragEnd: dp.onDragEnd } : {};
  return (
    <div className={(props.boxed ? 'row-card ' : 'row-item ') + (props.rowClass || '') + ' ' + dragCls} {...rest}
      style={{ cursor: props.onOpen ? 'pointer' : 'default' }}
      onClick={() => props.onOpen && props.onOpen(t)}>
      {props.handle && <span className="drag-handle" onClick={(e) => e.stopPropagation()}><Icon name="grip" size={15} /></span>}
      <StatusControl id={t.id} status={t.status} onWaiting={() => props.onWaiting && props.onWaiting(t)} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: t.status === 'done' ? 'var(--ink-tertiary)' : 'var(--ink)', textDecoration: t.status === 'done' ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
        </div>
        {t.status === 'waiting' && t.waiting && (
          <div style={{ fontSize: 12, color: 'var(--st-waiting)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="clock" size={11} weight={2} /> {t.waiting.who}待ち · {t.waiting.reason}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }} onClick={(e) => e.stopPropagation()}>
        {t.due && t.status !== 'done' && <DueBadge due={t.due} />}
        {pj && <span className="tag" style={{ maxWidth: 150 }}><Icon name="project" size={11} weight={2} style={{ color: 'var(--ink-tertiary)' }} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pj.name}</span></span>}
        {cat && !props.hideCat && <CategoryTag cat={cat} />}
        <button className="btn btn-icon" style={{ width: 26, height: 26 }} onClick={(e) => setMenuAnchor(e.currentTarget.getBoundingClientRect())}><Icon name="dots" size={16} /></button>
        {menuAnchor && (
          <Popover anchor={menuAnchor} width={180} onClose={() => setMenuAnchor(null)}>
            <MenuItem onClick={() => { setMenuAnchor(null); props.onOpen && props.onOpen(t); }}><Icon name="edit" size={14} /> 編集</MenuItem>
            <MenuItem onClick={() => { actions.toggleDone(t.id); setMenuAnchor(null); toast(t.status === 'done' ? '未完了に戻しました' : '完了にしました'); }}><Icon name="check" size={14} /> {t.status === 'done' ? '未完了に戻す' : '完了にする'}</MenuItem>
            <MenuItem danger onClick={() => { actions.deleteTask(t.id); setMenuAnchor(null); toast('削除しました', 'trash'); }}><Icon name="trash" size={14} /> 削除</MenuItem>
          </Popover>
        )}
      </div>
    </div>
  );
}

/* ---- タスク編集モーダル ---- */
export function TaskEditModal(props: { task?: Partial<Task> | null; onSaved?: () => void; onClose: () => void }) {
  const actions = useActions();
  const init = props.task || {};
  const editing = !!(props.task && props.task.id); // id があれば既存タスクの編集
  const [v, setV] = useState({ title: init.title || '', categoryId: init.categoryId || '', projectId: (init.projectId ?? null) as string | null, due: init.due || '', note: init.note || '', status: (init.status || 'backlog') as TaskStatus });
  function up<K extends keyof typeof v>(k: K, val: (typeof v)[K]) {
    setV((p) => (k === 'categoryId' ? { ...p, categoryId: val as string, projectId: null } : { ...p, [k]: val }));
  }
  const valid = v.title.trim() && v.categoryId;
  function save() {
    if (!valid) return;
    const data = { title: v.title.trim(), categoryId: v.categoryId, projectId: v.projectId, due: v.due || null, note: v.note };
    if (editing) { actions.updateTask(props.task!.id!, data); toast('タスクを更新しました'); }
    else { actions.addTask({ ...data, status: v.status }); toast('タスクを追加しました', 'plus'); }
    props.onSaved && props.onSaved();
    props.onClose();
  }
  return (
    <Modal title={editing ? 'タスクを編集' : '新しいタスク'} icon={<Icon name="task" size={18} />} onClose={props.onClose}
      footer={(
        <>
          <button className="btn btn-ghost" onClick={props.onClose}>キャンセル</button>
          <button className="btn btn-primary" disabled={!valid} onClick={save}>{editing ? '保存' : '追加'}</button>
        </>
      )}>
      <Field label="タスク名" required>
        <input className="input" autoFocus value={v.title} placeholder="例: 対応表のドラフトを作成する" onChange={(e) => up('title', e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save(); }} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="カテゴリ" required><CategorySelect value={v.categoryId} onChange={(val) => up('categoryId', val || '')} /></Field>
        <Field label="プロジェクト" hint="任意"><ProjectSelect value={v.projectId} categoryId={v.categoryId} onChange={(val) => up('projectId', val)} /></Field>
      </div>
      <Field label="期限" hint="任意"><input type="date" className="input" value={v.due} onChange={(e) => up('due', e.target.value)} /></Field>
      <Field label="メモ" hint="任意" gap={0}><textarea className="textarea" value={v.note} placeholder="補足や着手メモ" onChange={(e) => up('note', e.target.value)} /></Field>
    </Modal>
  );
}

/* ---- 待ち状態にする ---- */
export function WaitingModal(props: { task: Task; onClose: () => void }) {
  const actions = useActions();
  const [v, setV] = useState({ who: '', reason: '', checkOn: '', memo: '' });
  function up<K extends keyof typeof v>(k: K, val: string) { setV((p) => ({ ...p, [k]: val })); }
  const valid = v.who.trim() && v.reason.trim();
  function save() { if (!valid) return; actions.setWaiting(props.task.id, { who: v.who.trim(), reason: v.reason.trim(), checkOn: v.checkOn || null, memo: v.memo }); toast('待ち状態にしました', 'clock'); props.onClose(); }
  return (
    <Modal title="待ち状態にする" sub={props.task.title} icon={<Icon name="clock" size={18} />} onClose={props.onClose}
      footer={(
        <>
          <button className="btn btn-ghost" onClick={props.onClose}>キャンセル</button>
          <button className="btn btn-primary" disabled={!valid} onClick={save}>待ちにする</button>
        </>
      )}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="待ち相手" required><input className="input" autoFocus value={v.who} placeholder="例: 田中マネージャー" onChange={(e) => up('who', e.target.value)} /></Field>
        <Field label="確認予定日" hint="任意"><input type="date" className="input" value={v.checkOn} onChange={(e) => up('checkOn', e.target.value)} /></Field>
      </div>
      <Field label="待ち理由" required><input className="input" value={v.reason} placeholder="例: 計画ドラフトの承認待ち" onChange={(e) => up('reason', e.target.value)} /></Field>
      <Field label="依頼メモ" hint="任意" gap={0}><textarea className="textarea" value={v.memo} placeholder="依頼の経緯やリンクなど" onChange={(e) => up('memo', e.target.value)} /></Field>
    </Modal>
  );
}

/* ---- 待ち解除 ---- */
export function WaitingResolveModal(props: { task: Task; onClose: () => void }) {
  const actions = useActions();
  const [v, setV] = useState<{ status: TaskStatus; memo: string }>({ status: 'backlog', memo: '' });
  function save() { actions.clearWaiting(props.task.id, { status: v.status }); toast('待ちを解除しました', 'check'); props.onClose(); }
  return (
    <Modal title="待ちを解除" sub={props.task.title} icon={<Icon name="check" size={18} />} onClose={props.onClose}
      footer={(
        <>
          <button className="btn btn-ghost" onClick={props.onClose}>キャンセル</button>
          <button className="btn btn-primary" onClick={save}>解除する</button>
        </>
      )}>
      <div style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 16, fontSize: 13, color: 'var(--ink-muted)' }}>
        <span style={{ color: 'var(--st-waiting)' }}>{props.task.waiting?.who}</span> からの返答を受けて、ボールが自分に戻りました。
      </div>
      <Field label="解除後のステータス">
        <div className="seg">
          {([['backlog', '未着手'], ['progress', '対応中']] as [TaskStatus, string][]).map((o) => (
            <button key={o[0]} className={v.status === o[0] ? 'on' : ''} onClick={() => setV((p) => ({ ...p, status: o[0] }))}>{o[1]}</button>
          ))}
        </div>
      </Field>
      <Field label="返答メモ" hint="任意" gap={0}><textarea className="textarea" value={v.memo} placeholder="返ってきた内容" onChange={(e) => setV((p) => ({ ...p, memo: e.target.value }))} /></Field>
    </Modal>
  );
}

/* ---- クイック追加（Inbox/タスク） ---- */
export function QuickAddModal(props: { onClose: () => void }) {
  const actions = useActions();
  const [mode, setMode] = useState<'inbox' | 'task'>('inbox');
  const [v, setV] = useState({ text: '', categoryId: '', due: '' });
  function save() {
    if (!v.text.trim()) return;
    if (mode === 'inbox') { actions.addInbox(v.text.trim()); toast('Inboxに追加しました', 'inbox'); }
    else { if (!v.categoryId) return; actions.addTask({ title: v.text.trim(), categoryId: v.categoryId, due: v.due || null }); toast('タスクを追加しました', 'plus'); }
    props.onClose();
  }
  const valid = v.text.trim() && (mode === 'inbox' || v.categoryId);
  return (
    <Modal title="クイック追加" icon={<Icon name="plus" size={18} />} onClose={props.onClose}
      footer={(
        <>
          <button className="btn btn-ghost" onClick={props.onClose}>キャンセル</button>
          <button className="btn btn-primary" disabled={!valid} onClick={save}>追加</button>
        </>
      )}>
      <div className="seg" style={{ marginBottom: 16 }}>
        <button className={mode === 'inbox' ? 'on' : ''} onClick={() => setMode('inbox')}>Inboxへ</button>
        <button className={mode === 'task' ? 'on' : ''} onClick={() => setMode('task')}>タスクとして</button>
      </div>
      <Field label={mode === 'inbox' ? '内容' : 'タスク名'} required gap={mode === 'inbox' ? 0 : 16}>
        <input className="input" autoFocus value={v.text} placeholder={mode === 'inbox' ? '思いついたことを素早く…' : '例: 週報を提出する'}
          onChange={(e) => setV((p) => ({ ...p, text: e.target.value }))}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save(); else if (e.key === 'Enter' && mode === 'inbox') save(); }} />
      </Field>
      {mode === 'task' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="カテゴリ" required gap={0}><CategorySelect value={v.categoryId} onChange={(val) => setV((p) => ({ ...p, categoryId: val || '' }))} /></Field>
          <Field label="期限" hint="任意" gap={0}><input type="date" className="input" value={v.due} onChange={(e) => setV((p) => ({ ...p, due: e.target.value }))} /></Field>
        </div>
      )}
      {mode === 'inbox' && <p className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>Inboxは&quot;とりあえず置く&quot;場所。後でタスク・プロジェクト・Somedayに整理できます。</p>}
    </Modal>
  );
}

/* ---- タスク用モーダル制御フック ---- */
type ModalState =
  | { type: 'edit'; task: Partial<Task> | null }
  | { type: 'waiting'; task: Task }
  | { type: 'resolve'; task: Task }
  | null;

export function useTaskModals() {
  const [modal, setModal] = useState<ModalState>(null);
  const close = () => setModal(null);
  const api = {
    newTask: (preset?: Partial<Task> | null) => setModal({ type: 'edit', task: preset || null }),
    edit: (t: Task) => setModal({ type: 'edit', task: t }),
    waiting: (t: Task) => setModal({ type: 'waiting', task: t }),
    resolve: (t: Task) => setModal({ type: 'resolve', task: t }),
    close,
    node: null as React.ReactNode,
  };
  if (modal) {
    if (modal.type === 'edit') api.node = <TaskEditModal task={modal.task} onClose={close} />;
    else if (modal.type === 'waiting') api.node = <WaitingModal task={modal.task} onClose={close} />;
    else if (modal.type === 'resolve') api.node = <WaitingResolveModal task={modal.task} onClose={close} />;
  }
  return api;
}

/* ---- フィルタバー ---- */
export interface FilterValue { q: string; cat: string; status: string; proj: string }
export function FilterBar(props: { value: FilterValue; onChange: (v: FilterValue) => void; cats: Category[]; showStatus?: boolean }) {
  const v = props.value;
  function up<K extends keyof FilterValue>(k: K, val: FilterValue[K]) { props.onChange({ ...v, [k]: val }); }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
      <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
        <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-tertiary)' }}><Icon name="search" size={15} /></span>
        <input className="input" style={{ paddingLeft: 34 }} placeholder="タスクを検索…" value={v.q} onChange={(e) => up('q', e.target.value)} />
      </div>
      <select className="select" style={{ width: 'auto', minWidth: 130 }} value={v.cat} onChange={(e) => up('cat', e.target.value)}>
        <option value="">全カテゴリ</option>
        {props.cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select className="select" style={{ width: 'auto', minWidth: 120 }} value={v.proj} onChange={(e) => up('proj', e.target.value)}>
        <option value="">PJ有無：全て</option>
        <option value="has">PJに紐づく</option>
        <option value="none">単発のみ</option>
      </select>
      {props.showStatus !== false && (
        <div style={{ display: 'flex', gap: 4 }}>
          {statusOrder.map((st) => {
            const on = v.status === st;
            return (
              <button key={st} className="btn btn-sm" title={statusMeta[st].label}
                style={{ width: 30, padding: 0, background: on ? 'var(--primary-soft)' : 'var(--surface-2)', border: '1px solid ' + (on ? 'var(--primary)' : 'var(--hairline)') }}
                onClick={() => up('status', on ? '' : st)}><StatusIcon status={st} size={15} /></button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function applyFilters(tasks: Task[], v: FilterValue): Task[] {
  return tasks.filter((t) => {
    if (v.q && t.title.toLowerCase().indexOf(v.q.toLowerCase()) < 0) return false;
    if (v.cat && t.categoryId !== v.cat) return false;
    if (v.status && t.status !== v.status) return false;
    if (v.proj === 'has' && !t.projectId) return false;
    if (v.proj === 'none' && t.projectId) return false;
    return true;
  });
}

/* ---- タスク一覧画面 ---- */
export function TasksScreen(props: { fixedCat?: string; title?: string }) {
  const s = useStore();
  const tm = useTaskModals();
  const [mode, setMode] = useState<'list' | 'board'>('list');
  const [filter, setFilter] = useState<FilterValue>({ q: '', cat: props.fixedCat || '', status: '', proj: '' });
  const filtered = useMemo(() => applyFilters(s.tasks, filter), [s.tasks, filter]);

  return (
    <div className={'page fade-in' + (mode === 'board' ? ' page-wide' : '')} style={mode === 'board' ? { maxWidth: 'none' } : undefined}>
      <PageHead icon="task" title={props.title || 'タスク'} count={filtered.length}
        action={<button className="btn btn-primary" onClick={() => tm.newTask(props.fixedCat ? { categoryId: props.fixedCat } : null)}><Icon name="plus" size={15} />新規タスク</button>}>
        <div className="seg">
          <button className={mode === 'board' ? 'on' : ''} onClick={() => setMode('board')}>かんばん</button>
          <button className={mode === 'list' ? 'on' : ''} onClick={() => setMode('list')}>リスト</button>
        </div>
      </PageHead>

      <FilterBar value={filter} onChange={setFilter} cats={s.categories.filter((c) => c.active)} showStatus={mode === 'list'} />

      {mode === 'board' ? <TaskBoard tasks={filtered} tm={tm} /> : <TaskList tasks={filtered} tm={tm} />}
      {tm.node}
    </div>
  );
}

/* ---- かんばんカード ---- */
function KanbanCard(props: { task: Task; tm: ReturnType<typeof useTaskModals> }) {
  const t = props.task, lk = useLookup();
  const cat = lk.cat[t.categoryId], pj = t.projectId ? lk.pj[t.projectId] : null;
  const [dragging, setDragging] = useState(false);
  return (
    <div className="kanban-card" {...makeDraggable(t.id)}
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', t.id); } catch { /* noop */ } setDragging(true); }}
      onDragEnd={() => setDragging(false)}
      style={{ opacity: dragging ? 0.4 : 1 }}
      onClick={() => props.tm.edit(t)}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
        <span style={{ marginTop: 1 }} onClick={(e) => e.stopPropagation()}>
          <StatusControl id={t.id} status={t.status} onWaiting={() => props.tm.waiting(t)} />
        </span>
        <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, lineHeight: 1.45, color: t.status === 'done' ? 'var(--ink-tertiary)' : 'var(--ink)', textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</span>
      </div>
      {t.status === 'waiting' && t.waiting && (
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

/* ---- かんばん ---- */
function TaskBoard(props: { tasks: Task[]; tm: ReturnType<typeof useTaskModals> }) {
  const actions = useActions();
  return (
    <div className="kanban-scroll">
      {statusOrder.map((st) => {
        const items = props.tasks.filter((t) => t.status === st).sort((a, b) => (a.order || 0) - (b.order || 0));
        const meta = statusMeta[st];
        return (
          <DropZone key={st} accept="task" className="kanban-col"
            onDrop={(id) => {
              const t = props.tasks.find((x) => x.id === id) || undefined;
              const cur = t ?? null;
              if (!cur || cur.status === st) return;
              if (st === 'waiting') { props.tm.waiting(cur); return; }
              actions.setTaskStatus(id, st); toast(meta.label + 'に移動', 'arrowRight');
            }}>
            <div className="kanban-col-head">
              <StatusIcon status={st} size={15} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{meta.label}</span>
              <span style={{ fontSize: 12, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)' }}>{items.length}</span>
              <button className="btn btn-icon" style={{ width: 24, height: 24, marginLeft: 'auto' }} title="このステータスで追加"
                onClick={() => props.tm.newTask({ status: st === 'waiting' ? 'backlog' : st })}><Icon name="plus" size={15} /></button>
            </div>
            <div className="kanban-body">
              {items.map((t) => <KanbanCard key={t.id} task={t} tm={props.tm} />)}
              {items.length === 0 && <div style={{ padding: '18px 8px', textAlign: 'center', fontSize: 12, color: 'var(--ink-tertiary)' }}>ここにドラッグ</div>}
            </div>
          </DropZone>
        );
      })}
    </div>
  );
}

/* ---- リスト（並べ替え） ---- */
function TaskList(props: { tasks: Task[]; tm: ReturnType<typeof useTaskModals> }) {
  const actions = useActions();
  const sorted = useMemo(() => props.tasks.slice().sort((a, b) => (a.order || 0) - (b.order || 0)), [props.tasks]);
  const ids = useMemo(() => sorted.map((t) => t.id), [sorted]);
  const byId: Record<string, Task> = {}; sorted.forEach((t) => { byId[t.id] = t; });
  const ls = useLiveSort(ids, (ordered) => actions.reorderTasks(ordered));
  if (sorted.length === 0) return <Empty icon="task" title="該当するタスクがありません" sub="フィルタを変えるか、新しいタスクを追加してください。" />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {ls.ids.map((id) => {
        const t = byId[id]; if (!t) return null;
        return <TaskRow key={id} task={t} handle boxed dragProps={ls.rowProps(id)} onOpen={props.tm.edit} onWaiting={props.tm.waiting} />;
      })}
    </div>
  );
}

/* ---- 待ち一覧画面 ---- */
export function WaitingScreen() {
  const s = useStore();
  const tm = useTaskModals();
  const waiting = s.tasks.filter((t) => t.status === 'waiting' && t.waiting)
    .sort((a, b) => parseD(a.waiting!.since)!.getTime() - parseD(b.waiting!.since)!.getTime());
  return (
    <div className="page fade-in">
      <PageHead icon="clock" title="待ち" count={waiting.length} sub="自分以外がボールを持っているタスク" />
      {waiting.length === 0
        ? <Empty icon="clock" title="待ちタスクはありません" sub="誰かの返答待ちになったタスクはここに集まります。" />
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {waiting.map((t) => <WaitingCard key={t.id} task={t} onResolve={() => tm.resolve(t)} onEdit={() => tm.edit(t)} />)}
          </div>
        )}
      {tm.node}
    </div>
  );
}

function WaitingCard(props: { task: Task; onResolve: () => void; onEdit: () => void }) {
  const t = props.task, w = t.waiting!, lk = useLookup();
  const cat = lk.cat[t.categoryId];
  const since = daysFromToday(w.since); const elapsed = since != null ? Math.abs(since) : 0;
  const due = w.checkOn ? daysFromToday(w.checkOn) : null;
  const overdue = due != null && due <= 0;
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
export function PageHead(props: { icon: string; title: string; count?: number; sub?: string; action?: React.ReactNode; children?: React.ReactNode }) {
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
