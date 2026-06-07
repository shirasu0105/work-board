'use client';
/* ============================================================
   memo-editor.tsx — メモ種別テンプレート & 作成/編集モーダル
   （プロトタイプ docs/design/app/memo-editor.jsx 準拠）
   ============================================================ */
import React, { useState } from 'react';
import { Icon } from '../icons';
import { Modal, Field, CategorySelect, ProjectSelect } from '../ui';
import { useActions } from '../store';
import { toast } from '../toast';
import { memoKinds } from '@/lib/meta';
import type { Memo, MemoKind, MemoFields } from '@/lib/types';

export interface TplField { key: string; label: string; type: 'text' | 'area' | 'datetime'; col?: number; ph?: string; frame?: boolean; accent?: boolean }
export interface Tpl { titleLabel: string; fields: TplField[] }

export const MEMO_TEMPLATES: Record<MemoKind, Tpl> = {
  meeting: {
    titleLabel: '会議名',
    fields: [
      { key: 'datetime', label: '日時', type: 'datetime', col: 1 },
      { key: 'attendees', label: '参加者', type: 'text', col: 1, ph: '例: 自分, 田中M, 鈴木さん' },
      { key: 'purpose', label: '目的', type: 'text', ph: '会議の目的' },
      { key: 'agenda', label: '議題', type: 'area', ph: '・…' },
      { key: 'decisions', label: '決定事項', type: 'area', ph: '・…' },
      { key: 'todos', label: '宿題', type: 'area', ph: '・担当：内容' },
      { key: 'nextAction', label: '自分のNext Action', type: 'text', accent: true, ph: '会議後に自分がやること' },
    ],
  },
  tt: {
    titleLabel: 'タイトル',
    fields: [
      { key: 'from', label: '誰から', type: 'text', ph: '教えてくれた人' },
      { key: 'background', label: '背景', type: 'area', ph: 'どんな状況で出た話か' },
      { key: 'content', label: '教えてもらった内容', type: 'area', ph: '要点' },
      { key: 'fact', label: 'ファクト', type: 'area', frame: true, ph: '起きた事実・言われたこと' },
      { key: 'abstract', label: '抽象化', type: 'area', frame: true, ph: '本質・一般化すると' },
      { key: 'apply', label: '転用', type: 'area', frame: true, ph: '自分の仕事にどう活かすか' },
    ],
  },
  idea: {
    titleLabel: 'タイトル',
    fields: [
      { key: 'content', label: '内容', type: 'area', ph: '思いついたこと・気づき' },
      { key: 'fact', label: 'ファクト', type: 'area', frame: true, ph: 'きっかけ・観察した事実' },
      { key: 'abstract', label: '抽象化', type: 'area', frame: true, ph: '本質は何か' },
      { key: 'apply', label: '転用', type: 'area', frame: true, ph: 'どこで使えるか' },
      { key: 'taskCand', label: 'タスク化候補', type: 'text', ph: '行動に変えるなら' },
      { key: 'somedayCand', label: 'Someday候補', type: 'text', ph: 'いつかやるなら' },
    ],
  },
  research: {
    titleLabel: 'タイトル',
    fields: [
      { key: 'theme', label: '調査テーマ', type: 'text', ph: '何を調べたか' },
      { key: 'content', label: '調査内容', type: 'area', ph: '調べた範囲・手順' },
      { key: 'found', label: '分かったこと', type: 'area', ph: '判明した事実' },
      { key: 'conclusion', label: '結論', type: 'area', accent: true, ph: '現時点の結論' },
      { key: 'next', label: '次に確認すること', type: 'text', ph: '残課題' },
    ],
  },
  worklog: {
    titleLabel: 'タイトル',
    fields: [
      { key: 'work', label: '作業内容', type: 'area', ph: '何をやったか' },
      { key: 'result', label: '結果', type: 'area', ph: 'どうなったか' },
      { key: 'stuck', label: '詰まった点', type: 'area', ph: 'ハマったところ' },
      { key: 'handle', label: '対応内容', type: 'area', ph: 'どう解決したか' },
      { key: 'next', label: '次にやること', type: 'text', accent: true, ph: '次のアクション' },
    ],
  },
};

function MemoKindPicker(props: { value: MemoKind; onChange: (k: MemoKind) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', gap: 10 }}>
      {(Object.keys(memoKinds) as MemoKind[]).map((k) => {
        const meta = memoKinds[k];
        const on = props.value === k;
        return (
          <button key={k} onClick={() => props.onChange(k)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, padding: 14, borderRadius: 'var(--radius-lg)', textAlign: 'left', border: '1px solid ' + (on ? meta.hue : 'var(--hairline)'), background: on ? 'color-mix(in srgb,' + meta.hue + ' 12%, transparent)' : 'var(--surface-1)', transition: 'all .14s' }}>
            <span style={{ width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'color-mix(in srgb,' + meta.hue + ' 16%, transparent)', color: meta.hue }}><Icon name={meta.icon} size={18} weight={1.9} /></span>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function MemoEditorModal(props: { memo?: Memo; presetKind?: MemoKind; onSaved?: () => void; onClose: () => void }) {
  const actions = useActions();
  const editing = props.memo;
  const [stage, setStage] = useState<'kind' | 'form'>(editing || props.presetKind ? 'form' : 'kind');
  const [kind, setKind] = useState<MemoKind>(editing ? editing.kind : (props.presetKind || 'meeting'));
  const [cv, setCv] = useState<{ title: string; categoryId: string; projectId: string | null }>({ title: editing ? editing.title : '', categoryId: editing ? editing.categoryId : '', projectId: editing ? editing.projectId : null });
  const [fv, setFv] = useState<MemoFields>(editing ? { ...editing.fields } : {});
  const tpl = MEMO_TEMPLATES[kind];
  const meta = memoKinds[kind];
  function upC(k: 'title' | 'categoryId' | 'projectId', val: string | null) { setCv((p) => (k === 'categoryId' ? { ...p, categoryId: (val as string) || '', projectId: null } : { ...p, [k]: val })); }
  function upF(k: string, val: string) { setFv((p) => ({ ...p, [k]: val })); }
  const valid = cv.title.trim() && cv.categoryId;
  function save() {
    if (!valid) return;
    const data = { kind, title: cv.title.trim(), categoryId: cv.categoryId, projectId: cv.projectId, fields: fv };
    if (editing) { actions.updateMemo(editing.id, data); toast('メモを更新'); }
    else { actions.addMemo(data); toast('メモを保存', meta.icon); }
    props.onSaved && props.onSaved();
    props.onClose();
  }

  if (stage === 'kind') {
    return (
      <Modal title="メモの種別を選ぶ" sub="種別に応じて入力フォーマットが切り替わります" icon={<Icon name="memo" size={18} />} onClose={props.onClose}>
        <MemoKindPicker value={kind} onChange={setKind} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-primary" onClick={() => setStage('form')}>次へ：{meta.label}を書く<Icon name="arrowRight" size={15} /></button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal wide
      title={editing ? 'メモを編集' : meta.label + 'を書く'}
      icon={<span style={{ color: meta.hue }}><Icon name={meta.icon} size={19} weight={1.9} /></span>}
      onClose={props.onClose}
      footer={(
        <>
          {!editing && !props.presetKind && <button className="btn btn-ghost" style={{ marginRight: 'auto' }} onClick={() => setStage('kind')}><Icon name="chevronLeft" size={14} />種別を変える</button>}
          <button className="btn btn-ghost" onClick={props.onClose}>キャンセル</button>
          <button className="btn btn-primary" disabled={!valid} onClick={save}>{editing ? '保存' : 'メモを保存'}</button>
        </>
      )}>
      <Field label={tpl.titleLabel} required>
        <input className="input" autoFocus value={cv.title} placeholder={tpl.titleLabel + 'を入力'} onChange={(e) => upC('title', e.target.value)} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="カテゴリ" required><CategorySelect value={cv.categoryId} onChange={(val) => upC('categoryId', val)} /></Field>
        <Field label="関連プロジェクト" hint="任意"><ProjectSelect value={cv.projectId} categoryId={cv.categoryId} onChange={(val) => upC('projectId', val)} /></Field>
      </div>
      <div style={{ height: 1, background: 'var(--hairline)', margin: '6px 0 18px' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
        {tpl.fields.map((f) => {
          const span = (f.type === 'area' || f.col == null) ? 2 : 1;
          let inner: React.ReactNode;
          if (f.type === 'area') inner = <textarea className="textarea" value={fv[f.key] || ''} placeholder={f.ph} onChange={(e) => upF(f.key, e.target.value)} style={f.frame ? { borderLeft: '3px solid ' + meta.hue } : undefined} />;
          else if (f.type === 'datetime') inner = <input type="datetime-local" className="input" value={(fv[f.key] || '').slice(0, 16)} onChange={(e) => upF(f.key, e.target.value)} />;
          else inner = <input className="input" value={fv[f.key] || ''} placeholder={f.ph} onChange={(e) => upF(f.key, e.target.value)} style={f.accent ? { borderColor: meta.hue } : undefined} />;
          return (
            <div key={f.key} style={{ gridColumn: 'span ' + span }}>
              <Field label={f.label} hint={f.frame ? '（メモの魔力）' : undefined}>{inner}</Field>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
