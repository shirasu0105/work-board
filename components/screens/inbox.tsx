'use client';
/* ============================================================
   inbox.tsx — Inbox（素早く追加 → ドラッグ/ボタンで整理）
   （プロトタイプ docs/design/app/inbox.jsx 準拠）
   ============================================================ */
import React, { useState } from 'react';
import { Icon } from '../icons';
import { Empty, DropZone, makeDraggable } from '../ui';
import { useStore, useActions } from '../store';
import { toast } from '../toast';
import { fmtDate, fmtTime, daysFromToday } from '@/lib/date';
import type { InboxItem } from '@/lib/types';
import { PageHead, TaskEditModal } from './tasks';
import { ProjectEditModal, SomedayEditModal } from './projects';

type TriageType = 'task' | 'project' | 'someday' | 'delete';

export function InboxScreen() {
  const s = useStore();
  const actions = useActions();
  const open = s.inbox.filter((i) => i.status === 'open').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const [qv, setQv] = useState('');
  const [conv, setConv] = useState<{ type: TriageType; item: InboxItem } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  function add() { if (!qv.trim()) return; actions.addInbox(qv.trim()); setQv(''); toast('Inboxに追加', 'inbox'); }

  function triage(item: InboxItem, type: TriageType) {
    if (type === 'delete') { actions.deleteInbox(item.id); toast('削除しました', 'trash'); return; }
    setConv({ type, item });
  }
  function afterConvert() { if (conv) actions.deleteInbox(conv.item.id); setConv(null); }

  const zones: { type: TriageType; label: string; icon: string; desc: string; hue: string }[] = [
    { type: 'task', label: 'タスク化', icon: 'task', desc: '実行可能な作業として', hue: 'var(--primary)' },
    { type: 'project', label: 'プロジェクト化', icon: 'project', desc: '複数ステップの作業', hue: 'var(--st-waiting)' },
    { type: 'someday', label: 'Someday化', icon: 'sparkle', desc: 'いつかやるかも', hue: 'var(--st-progress)' },
    { type: 'delete', label: '削除', icon: 'trash', desc: '不要', hue: 'var(--danger)' },
  ];

  return (
    <div className="page page-wide fade-in">
      <PageHead icon="inbox" title="Inbox" count={open.length} sub="思いついたことを素早く置き、後でドラッグして整理する場所" />

      <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }}><Icon name="plus" size={16} /></span>
          <input className="input" style={{ paddingLeft: 38, height: 44, fontSize: 14.5 }} placeholder="思いついたことを書いて Enter…" value={qv}
            onChange={(e) => setQv(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} autoFocus />
        </div>
        <button className="btn btn-primary" style={{ height: 44, padding: '0 18px' }} onClick={add}><Icon name="plus" size={15} />追加</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, alignItems: 'start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span className="eyebrow">未整理</span>
            <span style={{ fontSize: 12, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)' }}>{open.length}</span>
          </div>
          {open.length === 0
            ? <Empty icon="check" title="Inboxは空です" sub="すべて整理済み。気持ちいいですね。" />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {open.map((item) => {
                  const days = daysFromToday(item.createdAt.slice(0, 10)) ?? 0;
                  return (
                    <div key={item.id} className="card" {...makeDraggable(item.id)}
                      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', item.id); } catch { /* noop */ } setDragging(item.id); }}
                      onDragEnd={() => setDragging(null)}
                      style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 11, cursor: 'grab', opacity: dragging === item.id ? 0.4 : 1 }}>
                      <span className="drag-handle" style={{ marginTop: 2 }}><Icon name="grip" size={15} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}>{item.text}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--ink-tertiary)', marginTop: 4 }}>{fmtDate(item.createdAt.slice(0, 10), 'md')} {fmtTime(item.createdAt)} 追加 · {days === 0 ? '今日' : Math.abs(days) + '日前'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 2, flex: 'none' }}>
                        {zones.slice(0, 3).map((z) => (
                          <button key={z.type} className="btn btn-icon" style={{ width: 28, height: 28 }} title={z.label} onClick={() => triage(item, z.type)}><Icon name={z.icon} size={14} /></button>
                        ))}
                        <button className="btn btn-icon" style={{ width: 28, height: 28, color: 'var(--ink-tertiary)' }} title="削除" onClick={() => triage(item, 'delete')}><Icon name="x" size={14} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>

        <div style={{ position: 'sticky', top: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span className="eyebrow">ここへドラッグして整理</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {zones.map((z) => (
              <DropZone key={z.type} accept="inbox" className="card" style={{ padding: 0, borderStyle: dragging ? 'dashed' : 'solid' }}
                onDrop={(id) => { const item = s.inbox.find((x) => x.id === id); if (item) triage(item, z.type); }}>
                {(isOver: boolean) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '15px 16px' }}>
                    <span style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', background: 'color-mix(in srgb, ' + z.hue + ' 14%, transparent)', color: z.hue }}><Icon name={z.icon} size={19} weight={1.9} /></span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{z.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-subtle)', marginTop: 1 }}>{z.desc}</div>
                    </div>
                    {isOver && <span style={{ color: z.hue }}><Icon name="arrowRight" size={18} /></span>}
                  </div>
                )}
              </DropZone>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 14, lineHeight: 1.6 }}>カードをドラッグして右のゾーンにドロップ、または各カードの小さなアイコンから整理できます。</p>
        </div>
      </div>

      {conv && conv.type === 'task' && <TaskEditModal task={{ title: conv.item.text }} onSaved={afterConvert} onClose={() => setConv(null)} />}
      {conv && conv.type === 'project' && <ProjectEditModal preset={{ name: conv.item.text }} onSaved={afterConvert} onClose={() => setConv(null)} />}
      {conv && conv.type === 'someday' && <SomedayEditModal preset={{ text: conv.item.text }} onSaved={afterConvert} onClose={() => setConv(null)} />}
    </div>
  );
}
