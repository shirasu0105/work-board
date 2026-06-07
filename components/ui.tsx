'use client';
/* ============================================================
   ui.tsx — 共有UIコンポーネント & D&Dヘルパ
   （プロトタイプ docs/design/app/ui.jsx 準拠）
   ============================================================ */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon, StatusIcon } from './icons';
import { useStore } from './store';
import { statusMeta } from '@/lib/meta';
import { daysFromToday, relDay } from '@/lib/date';
import type { Category, TaskStatus } from '@/lib/types';

/* ---- 小物 ---- */
export function CategoryDot({ cat, size }: { cat?: Category; size?: number }) {
  if (!cat) return null;
  return <span style={{ width: size || 8, height: size || 8, borderRadius: 99, background: cat.color, flex: 'none', display: 'inline-block' }} />;
}

export function CategoryTag({ cat, style }: { cat?: Category; style?: React.CSSProperties }) {
  if (!cat) return null;
  return <span className="tag" style={style}><CategoryDot cat={cat} />{cat.name}</span>;
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const meta = statusMeta[status] || { label: '' };
  return (
    <span className="pill" style={{ paddingLeft: 7 }}>
      <StatusIcon status={status} size={13} />
      <span style={{ color: 'var(--ink-muted)' }}>{meta.label}</span>
    </span>
  );
}

export function DueBadge({ due }: { due?: string | null }) {
  const n = daysFromToday(due);
  if (n === null) return null;
  let color = 'var(--ink-subtle)', bg = 'var(--surface-2)';
  if (n < 0) { color = 'var(--danger)'; bg = 'color-mix(in srgb, var(--danger) 12%, transparent)'; }
  else if (n === 0) { color = 'var(--st-progress)'; bg = 'color-mix(in srgb, var(--st-progress) 14%, transparent)'; }
  return (
    <span className="pill" style={{ background: bg, border: 'none', color, gap: 5 }}>
      <Icon name="clock" size={11} weight={2} />{relDay(due)}
    </span>
  );
}

export function Avatar({ name = '?', size = 26 }: { name?: string; size?: number }) {
  const ch = name.replace(/[^一-龯ぁ-んァ-ヶa-zA-Z]/g, '').slice(0, 1) || '?';
  let hue = 0; for (let i = 0; i < name.length; i++) hue = (hue * 31 + name.charCodeAt(i)) % 360;
  return (
    <span style={{
      width: size, height: size, borderRadius: 99, flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 600, color: '#fff', background: `hsl(${hue} 42% 48%)`,
    }}>{ch}</span>
  );
}

/* ---- Empty ---- */
export function Empty({ icon, title, sub, action }: { icon?: string; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="empty fade-in">
      <Icon name={icon || 'inbox'} size={40} className="empty-ico" weight={1.4} />
      <div style={{ fontWeight: 600, color: 'var(--ink-muted)', fontSize: 14 }}>{title}</div>
      {sub && <div style={{ fontSize: 13, maxWidth: 320 }}>{sub}</div>}
      {action}
    </div>
  );
}

/* ---- Modal ---- */
export function Modal(props: {
  title: React.ReactNode; sub?: React.ReactNode; icon?: React.ReactNode; onClose?: () => void;
  footer?: React.ReactNode; wide?: boolean; children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') props.onClose && props.onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [props]);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) props.onClose && props.onClose(); }}>
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
    </div>,
    document.body,
  );
}

/* ---- Field ---- */
export function Field(props: { label?: React.ReactNode; required?: boolean; hint?: React.ReactNode; gap?: number; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: props.gap == null ? 16 : props.gap }}>
      {props.label && (
        <span className="field-label">
          {props.label}{props.required && <span className="field-req">*</span>}
          {props.hint && <span className="muted" style={{ fontWeight: 400, marginLeft: 8, fontSize: 11.5 }}>{props.hint}</span>}
        </span>
      )}
      {props.children}
    </label>
  );
}

/* ---- Select（カテゴリ/プロジェクト） ---- */
export function CategorySelect(props: { value?: string | null; onChange: (v: string | null) => void; placeholder?: string }) {
  const s = useStore();
  const cats = s.categories.filter((c) => c.active);
  return (
    <select className="select" value={props.value || ''} onChange={(e) => props.onChange(e.target.value || null)}>
      <option value="">{props.placeholder || 'カテゴリを選択'}</option>
      {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
    </select>
  );
}

export function ProjectSelect(props: { value?: string | null; onChange: (v: string | null) => void; categoryId?: string | null }) {
  const s = useStore();
  const pjs = s.projects.filter((p) => p.status === 'active' && (!props.categoryId || p.categoryId === props.categoryId));
  return (
    <select className="select" value={props.value || ''} onChange={(e) => props.onChange(e.target.value || null)}>
      <option value="">プロジェクトなし</option>
      {pjs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
  );
}

/* ---- Confirm ---- */
export function ConfirmDialog(props: {
  title: React.ReactNode; sub?: React.ReactNode; danger?: boolean; confirmLabel?: string;
  onCancel: () => void; onConfirm: () => void; children?: React.ReactNode;
}) {
  return (
    <Modal title={props.title} sub={props.sub} onClose={props.onCancel}
      footer={(
        <>
          <button className="btn btn-ghost" onClick={props.onCancel}>キャンセル</button>
          <button className={'btn ' + (props.danger ? 'btn-danger btn-secondary' : 'btn-primary')} onClick={props.onConfirm}>{props.confirmLabel || 'OK'}</button>
        </>
      )}>
      <div style={{ color: 'var(--ink-muted)', fontSize: 14 }}>{props.children}</div>
    </Modal>
  );
}

/* ============================================================
   DnD — 並べ替え(useLiveSort) と ドロップ先(DropZone)
   ============================================================ */
export interface RowDragProps {
  draggable: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  className: string;
}

export function useLiveSort(initialIds: string[], onCommit?: (ids: string[]) => void) {
  const [ids, setIds] = useState<string[]>(initialIds);
  const idsRef = useRef<string[]>(initialIds);
  const dragId = useRef<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const key = initialIds.join('|');
  useEffect(() => { idsRef.current = initialIds; setIds(initialIds); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  function setBoth(next: string[]) { idsRef.current = next; setIds(next); }
  function rowProps(id: string): RowDragProps {
    return {
      draggable: true,
      onDragStart: (e) => { dragId.current = id; setDraggingId(id); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', id); } catch { /* noop */ } },
      onDragOver: (e) => {
        e.preventDefault();
        const cur = idsRef.current; const from = cur.indexOf(dragId.current!), to = cur.indexOf(id);
        if (from < 0 || to < 0 || from === to) return;
        const next = cur.slice(); next.splice(to, 0, next.splice(from, 1)[0]); setBoth(next);
      },
      onDragEnd: () => { dragId.current = null; setDraggingId(null); onCommit && onCommit(idsRef.current); },
      className: draggingId === id ? 'dragging' : '',
    };
  }
  return { ids, rowProps, draggingId };
}

export function DropZone(props: {
  accept?: string; className?: string; style?: React.CSSProperties; canDrop?: boolean;
  onDrop?: (id: string, accept: string) => void;
  children: React.ReactNode | ((over: boolean) => React.ReactNode);
}) {
  const [over, setOver] = useState(0);
  const accept = props.accept || 'item';
  return (
    <div
      className={(props.className || '') + (over ? ' drop-active' : '')}
      style={props.style}
      onDragOver={(e) => { if (props.canDrop === false) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
      onDragEnter={(e) => { e.preventDefault(); setOver((n) => n + 1); }}
      onDragLeave={() => setOver((n) => Math.max(0, n - 1))}
      onDrop={(e) => { e.preventDefault(); setOver(0); let id = ''; try { id = e.dataTransfer.getData('text/plain'); } catch { /* noop */ } props.onDrop && props.onDrop(id, accept); }}
    >
      {typeof props.children === 'function' ? (props.children as (o: boolean) => React.ReactNode)(over > 0) : props.children}
    </div>
  );
}

export function makeDraggable(id: string) {
  return {
    draggable: true,
    onDragStart: (e: React.DragEvent) => { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', id); } catch { /* noop */ } },
  };
}

export { useMemo };
