'use client';
/* ============================================================
   review.tsx — 週次レビュー（ガイド付きウィザード）
   （プロトタイプ docs/design/app/review.jsx 準拠）
   ============================================================ */
import React, { useState } from 'react';
import { Icon } from '../icons';
import { Avatar, CategoryTag, DueBadge } from '../ui';
import { useStore, useActions, useLookup } from '../store';
import { toast } from '../toast';
import { daysFromToday, parseD } from '@/lib/date';
import type { InboxItem, Project } from '@/lib/types';
import { PageHead, TaskRow, TaskEditModal, useTaskModals } from './tasks';
import { SomedayEditModal } from './projects';

function ReviewDone(props: { text: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '40px 20px', color: 'var(--ink-subtle)' }}>
      <span style={{ width: 44, height: 44, borderRadius: 99, background: 'color-mix(in srgb,var(--st-done) 16%,transparent)', color: 'var(--st-done)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={22} weight={2.4} /></span>
      <div style={{ fontSize: 14, fontWeight: 500 }}>{props.text}</div>
    </div>
  );
}

export function ReviewScreen() {
  const s = useStore();
  const actions = useActions();
  const tm = useTaskModals();
  const lk = useLookup();
  const [step, setStep] = useState(0);
  const [conv, setConv] = useState<{ type: 'task' | 'someday'; item: InboxItem } | null>(null);

  const openInbox = s.inbox.filter((i) => i.status === 'open');
  const activePjs = s.projects.filter((p) => p.status === 'active');
  const staleTasks = s.tasks.filter((t) => (t.status === 'backlog' || t.status === 'hold') && (!t.due || (daysFromToday(t.due) ?? 0) < 0));
  const waiting = s.tasks.filter((t) => t.status === 'waiting');
  const someday = s.someday;

  const steps = [
    { key: 'inbox', label: 'Inbox整理', icon: 'inbox', count: openInbox.length, desc: '未整理の項目をタスク・プロジェクト・Somedayへ振り分ける' },
    { key: 'projects', label: '進行中PJ', icon: 'project', count: activePjs.length, desc: '各プロジェクトにNext Actionがあるか確認する' },
    { key: 'tasks', label: '未完了タスク', icon: 'task', count: staleTasks.length, desc: '放置・期限切れのタスクを整理する' },
    { key: 'waiting', label: '待ち', icon: 'clock', count: waiting.length, desc: '相手のボールが止まっていないか確認する' },
    { key: 'someday', label: 'Someday', icon: 'sparkle', count: someday.length, desc: 'いつかやることを見直し、今やるなら引き上げる' },
    { key: 'focus', label: '来週の重点', icon: 'flag', count: null as number | null, desc: '来週フォーカスするプロジェクトを確認する' },
  ];
  const cur = steps[step];
  const isLast = step === steps.length - 1;

  const nextActionOf = (pj: Project) => s.tasks.find((t) => t.projectId === pj.id && (t.status === 'progress' || t.status === 'backlog'));

  return (
    <div className="page fade-in">
      <PageHead icon="review" title="週次レビュー" sub="週に一度、全体を整える棚卸し" />

      <div style={{ display: 'flex', gap: 6, marginBottom: 22, flexWrap: 'wrap' }}>
        {steps.map((st, i) => {
          const done = i < step, active = i === step;
          return (
            <button key={st.key} onClick={() => setStep(i)}
              style={{ flex: '1 1 0', minWidth: 92, display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid ' + (active ? 'var(--primary)' : 'var(--hairline)'), background: active ? 'var(--primary-soft)' : 'var(--surface-1)', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 20, height: 20, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? 'var(--st-done)' : (active ? 'var(--primary)' : 'var(--surface-3)'), color: done || active ? '#fff' : 'var(--ink-subtle)', fontSize: 11, fontWeight: 700 }}>
                  {done ? <Icon name="check" size={12} weight={3} /> : (i + 1)}
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--ink-tertiary)' }}>{st.count != null ? st.count : ''}</span>
              </div>
              <span style={{ fontSize: 12.5, fontWeight: active ? 600 : 500, color: active ? 'var(--ink)' : 'var(--ink-subtle)' }}>{st.label}</span>
            </button>
          );
        })}
      </div>

      <div className="card" style={{ minHeight: 320 }}>
        <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={cur.icon} size={19} weight={1.9} /></span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em' }}>{step + 1}. {cur.label}</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{cur.desc}</div>
          </div>
        </div>

        <div style={{ padding: 16 }}>
          {cur.key === 'inbox' && (openInbox.length === 0
            ? <ReviewDone text="Inboxは空です。整理済み。" />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {openInbox.map((it) => (
                  <div key={it.id} className="row-item" style={{ background: 'var(--surface-2)' }}>
                    <Icon name="inbox" size={15} style={{ color: 'var(--ink-subtle)' }} />
                    <span style={{ flex: 1, fontSize: 13.5 }}>{it.text}</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => setConv({ type: 'task', item: it })}><Icon name="task" size={13} />タスク</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setConv({ type: 'someday', item: it })}><Icon name="sparkle" size={13} />Someday</button>
                    <button className="btn btn-icon" style={{ width: 28, height: 28, color: 'var(--ink-tertiary)' }} onClick={() => { actions.deleteInbox(it.id); toast('削除', 'trash'); }}><Icon name="trash" size={14} /></button>
                  </div>
                ))}
              </div>
            ))}

          {cur.key === 'projects' && (activePjs.length === 0
            ? <ReviewDone text="進行中のプロジェクトはありません。" />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activePjs.map((p) => {
                  const na = nextActionOf(p), cat = lk.cat[p.categoryId];
                  return (
                    <div key={p.id} className="row-item" style={{ background: 'var(--surface-2)' }}>
                      <span style={{ color: cat ? cat.color : 'var(--primary)' }}><Icon name="project" size={16} weight={1.9} /></span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: 12, marginTop: 2, color: na ? 'var(--ink-subtle)' : 'var(--danger)' }}>{na ? '次: ' + na.title : 'Next Actionがありません'}</div>
                      </div>
                      {!na && <button className="btn btn-secondary btn-sm" onClick={() => tm.newTask({ categoryId: p.categoryId, projectId: p.id })}><Icon name="plus" size={13} />Next Action</button>}
                    </div>
                  );
                })}
              </div>
            ))}

          {cur.key === 'tasks' && (staleTasks.length === 0
            ? <ReviewDone text="放置・期限切れのタスクはありません。" />
            : (
              <div className="card" style={{ padding: 6, background: 'var(--surface-2)' }}>
                {staleTasks.map((t) => <TaskRow key={t.id} task={t} onOpen={tm.edit} onWaiting={tm.waiting} />)}
              </div>
            ))}

          {cur.key === 'waiting' && (waiting.length === 0
            ? <ReviewDone text="待ちタスクはありません。" />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {waiting.map((t) => {
                  const overdue = t.waiting!.checkOn && (daysFromToday(t.waiting!.checkOn) ?? 1) <= 0;
                  return (
                    <div key={t.id} className="row-item" style={{ background: 'var(--surface-2)' }}>
                      <Avatar name={t.waiting!.who} size={28} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.title}</div>
                        <div style={{ fontSize: 12, marginTop: 2, color: 'var(--st-waiting)' }}>{t.waiting!.who}待ち · {Math.abs(daysFromToday(t.waiting!.since) ?? 0)}日経過{overdue ? ' · 確認予定日超過' : ''}</div>
                      </div>
                      {overdue && <span className="pill" style={{ background: 'color-mix(in srgb,var(--danger) 14%,transparent)', color: 'var(--danger)', border: 'none' }}>要確認</span>}
                      <button className="btn btn-secondary btn-sm" onClick={() => tm.resolve(t)}><Icon name="check" size={13} />解除</button>
                    </div>
                  );
                })}
              </div>
            ))}

          {cur.key === 'someday' && (someday.length === 0
            ? <ReviewDone text="Somedayは空です。" />
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {someday.map((it) => {
                  const cat = lk.cat[it.categoryId];
                  return (
                    <div key={it.id} className="row-item" style={{ background: 'var(--surface-2)' }}>
                      <Icon name="sparkle" size={15} style={{ color: 'var(--st-progress)' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{it.text}</div>
                        {cat && <div style={{ fontSize: 12, marginTop: 2, color: 'var(--ink-subtle)' }}>{cat.name}</div>}
                      </div>
                      <button className="btn btn-secondary btn-sm" onClick={() => { actions.addTask({ title: it.text, categoryId: it.categoryId }); actions.deleteSomeday(it.id); toast('タスク化', 'task'); }}><Icon name="task" size={13} />今やる</button>
                      <button className="btn btn-icon" style={{ width: 28, height: 28, color: 'var(--ink-tertiary)' }} onClick={() => { actions.deleteSomeday(it.id); toast('削除', 'trash'); }}><Icon name="trash" size={14} /></button>
                    </div>
                  );
                })}
              </div>
            ))}

          {cur.key === 'focus' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="muted" style={{ fontSize: 13, marginBottom: 4 }}>来週フォーカスするプロジェクト（期限が近い順）</div>
              {activePjs.slice().sort((a, b) => (a.due ? parseD(a.due)!.getTime() : 1e15) - (b.due ? parseD(b.due)!.getTime() : 1e15)).slice(0, 4).map((p) => {
                const cat = lk.cat[p.categoryId];
                return (
                  <div key={p.id} className="row-item" style={{ background: 'var(--surface-2)' }}>
                    <span style={{ color: cat ? cat.color : 'var(--primary)' }}><Icon name="flag" size={16} weight={1.9} /></span>
                    <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{p.name}</span>
                    {p.due && <DueBadge due={p.due} />}
                    {cat && <CategoryTag cat={cat} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
        <button className="btn btn-secondary" disabled={step === 0} onClick={() => setStep(step - 1)}><Icon name="chevronLeft" size={15} />戻る</button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 12.5, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-mono)' }}>{step + 1} / {steps.length}</div>
        {isLast
          ? <button className="btn btn-primary" onClick={() => { toast('週次レビュー完了！お疲れさまでした', 'check'); setStep(0); }}><Icon name="check" size={15} />レビュー完了</button>
          : <button className="btn btn-primary" onClick={() => setStep(step + 1)}>次へ<Icon name="chevronRight" size={15} /></button>}
      </div>

      {conv && conv.type === 'task' && <TaskEditModal task={{ title: conv.item.text }} onSaved={() => { actions.deleteInbox(conv.item.id); setConv(null); }} onClose={() => setConv(null)} />}
      {conv && conv.type === 'someday' && <SomedayEditModal preset={{ text: conv.item.text }} onSaved={() => { actions.deleteInbox(conv.item.id); setConv(null); }} onClose={() => setConv(null)} />}
      {tm.node}
    </div>
  );
}
