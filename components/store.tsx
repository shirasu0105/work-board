'use client';
/* ============================================================
   store.tsx — クライアントストア
   - サーバから受け取った初期状態を保持（即時・楽観的更新）
   - 変更は Server Action 経由で SQLite に永続化
   ============================================================ */
import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import type {
  AppState, Category, Project, Task, InboxItem, SomedayItem, Memo, Journal, TaskStatus, Theme, Waiting,
} from '@/lib/types';
import { setToday, today as todayFn } from '@/lib/date';
import { toast } from './toast';
import * as server from '@/app/actions';

/* ---- ユーティリティ ---- */
let _uidn = Date.now();
function uid(prefix = 'id'): string { _uidn += 1; return `${prefix}_${_uidn.toString(36)}`; }
function nowISO(): string { return new Date().toISOString(); }
function fail() { toast('保存に失敗しました', 'x'); }

export interface Actions {
  addTask(data: Partial<Task> & { title: string; categoryId: string }): Task;
  updateTask(id: string, patch: Partial<Task> | ((t: Task) => Partial<Task>)): void;
  deleteTask(id: string): void;
  setTaskStatus(id: string, status: TaskStatus): void;
  toggleDone(id: string): void;
  setWaiting(id: string, w: Omit<Waiting, 'since'> & { since?: string }): void;
  clearWaiting(id: string, res: { status?: TaskStatus }): void;
  reorderTasks(ids: string[]): void;
  addInbox(text: string): InboxItem;
  deleteInbox(id: string): void;
  updateInbox(id: string, patch: Partial<InboxItem>): void;
  addProject(data: Partial<Project> & { name: string; categoryId: string }): Project;
  updateProject(id: string, patch: Partial<Project>): void;
  completeProject(id: string): void;
  reopenProject(id: string): void;
  addCategory(data: Partial<Category> & { name: string }): Category;
  updateCategory(id: string, patch: Partial<Category>): void;
  reorderCategories(ids: string[]): void;
  addMemo(data: Partial<Memo> & { kind: Memo['kind']; title: string; categoryId: string }): Memo;
  updateMemo(id: string, patch: Partial<Memo>): void;
  deleteMemo(id: string): void;
  addSomeday(data: Partial<SomedayItem> & { text: string; categoryId: string }): SomedayItem;
  updateSomeday(id: string, patch: Partial<SomedayItem>): void;
  deleteSomeday(id: string): void;
  saveJournal(date: string, data: { oneLine: string; tomorrowTaskIds: string[] }): void;
  setTheme(theme: Theme): void;
  reset(): void;
}

interface Ctx { state: AppState; today: string; actions: Actions }
const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ initial, today, children }: { initial: AppState; today: string; children: React.ReactNode }) {
  setToday(today); // 日付ヘルパへ反映（SSR/CSR 共通）
  const [state, setState] = useState<AppState>(initial);
  const ref = useRef(state);
  ref.current = state;

  const actions = useMemo<Actions>(() => {
    const findTask = (id: string) => ref.current.tasks.find((t) => t.id === id);

    function patchTaskLocal(id: string, patch: Partial<Task> | ((t: Task) => Partial<Task>)): Task | undefined {
      const old = findTask(id);
      if (!old) return undefined;
      const p = typeof patch === 'function' ? patch(old) : patch;
      const next: Task = { ...old, ...p, updatedAt: nowISO() };
      setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? next : t)) }));
      return next;
    }

    return {
      /* ---- タスク ---- */
      addTask(data) {
        const t: Task = {
          id: uid('tk'), status: 'backlog', projectId: null, due: null, note: '', order: -Date.now(),
          createdAt: nowISO(), ...data,
        } as Task;
        setState((s) => ({ ...s, tasks: [t, ...s.tasks] }));
        server.saveTask(t).catch(fail);
        return t;
      },
      updateTask(id, patch) {
        const next = patchTaskLocal(id, patch);
        if (next) server.saveTask(next).catch(fail);
      },
      deleteTask(id) {
        setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
        server.removeTask(id).catch(fail);
      },
      setTaskStatus(id, status) {
        const old = findTask(id); if (!old) return;
        const p: Partial<Task> = { status };
        if (status === 'done') p.completedAt = nowISO();
        if (old.status === 'waiting' && status !== 'waiting') p.waiting = null;
        this.updateTask(id, p);
      },
      toggleDone(id) {
        const old = findTask(id); if (!old) return;
        this.updateTask(id, old.status === 'done'
          ? { status: 'backlog', completedAt: null }
          : { status: 'done', completedAt: nowISO(), waiting: null });
      },
      setWaiting(id, w) {
        this.updateTask(id, { status: 'waiting', waiting: { since: todayFn(), ...w } });
      },
      clearWaiting(id, res) {
        this.updateTask(id, { status: res.status || 'backlog', waiting: null });
      },
      reorderTasks(ids) {
        const pos: Record<string, number> = {};
        ids.forEach((id, i) => { pos[id] = i; });
        setState((s) => ({ ...s, tasks: s.tasks.map((t) => (pos[t.id] != null ? { ...t, order: pos[t.id] } : t)) }));
        server.reorderTasks(ids).catch(fail);
      },
      /* ---- Inbox ---- */
      addInbox(text) {
        const it: InboxItem = { id: uid('in'), text, status: 'open', createdAt: nowISO() };
        setState((s) => ({ ...s, inbox: [it, ...s.inbox] }));
        server.saveInbox(it).catch(fail);
        return it;
      },
      deleteInbox(id) {
        setState((s) => ({ ...s, inbox: s.inbox.filter((i) => i.id !== id) }));
        server.removeInbox(id).catch(fail);
      },
      updateInbox(id, patch) {
        let next: InboxItem | undefined;
        setState((s) => ({ ...s, inbox: s.inbox.map((i) => { if (i.id === id) { next = { ...i, ...patch, updatedAt: nowISO() }; return next; } return i; }) }));
        if (next) server.saveInbox(next).catch(fail);
      },
      /* ---- プロジェクト ---- */
      addProject(data) {
        const p: Project = {
          id: uid('pj'), status: 'active', order: -Date.now(), createdAt: nowISO(),
          goal: '', done_def: '', due: null, ...data,
        } as Project;
        setState((s) => ({ ...s, projects: [p, ...s.projects] }));
        server.saveProject(p).catch(fail);
        return p;
      },
      updateProject(id, patch) {
        let next: Project | undefined;
        setState((s) => ({ ...s, projects: s.projects.map((p) => { if (p.id === id) { next = { ...p, ...patch, updatedAt: nowISO() }; return next; } return p; }) }));
        if (next) server.saveProject(next).catch(fail);
      },
      completeProject(id) { this.updateProject(id, { status: 'done', completedAt: nowISO() }); },
      reopenProject(id) { this.updateProject(id, { status: 'active', completedAt: null }); },
      /* ---- カテゴリ ---- */
      addCategory(data) {
        const c: Category = {
          id: uid('cat'), active: true, order: 999, color: '#5e6ad2', createdAt: nowISO(),
          desc: '', ...data,
        } as Category;
        setState((s) => ({ ...s, categories: [...s.categories, c] }));
        server.saveCategory(c).catch(fail);
        return c;
      },
      updateCategory(id, patch) {
        let next: Category | undefined;
        setState((s) => ({ ...s, categories: s.categories.map((c) => { if (c.id === id) { next = { ...c, ...patch, updatedAt: nowISO() }; return next; } return c; }) }));
        if (next) server.saveCategory(next).catch(fail);
      },
      reorderCategories(ids) {
        const pos: Record<string, number> = {};
        ids.forEach((id, i) => { pos[id] = i; });
        setState((s) => ({
          ...s,
          categories: s.categories.slice()
            .sort((a, b) => (pos[a.id] != null ? pos[a.id] : 99) - (pos[b.id] != null ? pos[b.id] : 99))
            .map((c, i) => ({ ...c, order: i })),
        }));
        server.reorderCategories(ids).catch(fail);
      },
      /* ---- メモ ---- */
      addMemo(data) {
        const m: Memo = {
          id: uid('mm'), projectId: null, fields: {}, createdAt: nowISO(), updatedAt: nowISO(),
          ...data,
        } as Memo;
        setState((s) => ({ ...s, memos: [m, ...s.memos] }));
        server.saveMemo(m).catch(fail);
        return m;
      },
      updateMemo(id, patch) {
        let next: Memo | undefined;
        setState((s) => ({ ...s, memos: s.memos.map((m) => { if (m.id === id) { next = { ...m, ...patch, updatedAt: nowISO() }; return next; } return m; }) }));
        if (next) server.saveMemo(next).catch(fail);
      },
      deleteMemo(id) {
        setState((s) => ({ ...s, memos: s.memos.filter((m) => m.id !== id) }));
        server.removeMemo(id).catch(fail);
      },
      /* ---- Someday ---- */
      addSomeday(data) {
        const sd: SomedayItem = {
          id: uid('sd'), createdAt: nowISO(), reason: '', reviewOn: null, ...data,
        } as SomedayItem;
        setState((s) => ({ ...s, someday: [sd, ...s.someday] }));
        server.saveSomeday(sd).catch(fail);
        return sd;
      },
      updateSomeday(id, patch) {
        let next: SomedayItem | undefined;
        setState((s) => ({ ...s, someday: s.someday.map((x) => { if (x.id === id) { next = { ...x, ...patch, updatedAt: nowISO() }; return next; } return x; }) }));
        if (next) server.saveSomeday(next).catch(fail);
      },
      deleteSomeday(id) {
        setState((s) => ({ ...s, someday: s.someday.filter((x) => x.id !== id) }));
        server.removeSomeday(id).catch(fail);
      },
      /* ---- ジャーナル ---- */
      saveJournal(date, data) {
        let next: Journal | undefined;
        setState((s) => {
          const exists = s.journals.some((jn) => jn.date === date);
          const journals = exists
            ? s.journals.map((jn) => { if (jn.date === date) { next = { ...jn, ...data, updatedAt: nowISO() }; return next; } return jn; })
            : (() => { next = { date, createdAt: nowISO(), ...data }; return [next, ...s.journals]; })();
          return { ...s, journals };
        });
        if (next) server.saveJournal(next).catch(fail);
      },
      /* ---- テーマ ---- */
      setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        setState((s) => ({ ...s, settings: { ...s.settings, theme } }));
        server.setTheme(theme).catch(fail);
      },
      /* ---- 初期化 ---- */
      reset() {
        server.resetState().then((fresh) => {
          document.documentElement.setAttribute('data-theme', fresh.settings.theme || 'dark');
          setState(fresh);
        }).catch(fail);
      },
    };
  }, []);

  return (
    <StoreContext.Provider value={{ state, today, actions }}>
      {children}
    </StoreContext.Provider>
  );
}

function useCtx(): Ctx {
  const c = useContext(StoreContext);
  if (!c) throw new Error('StoreProvider が見つかりません');
  return c;
}

export function useStore(): AppState { return useCtx().state; }
export function useActions(): Actions { return useCtx().actions; }
export function useToday(): string { return useCtx().today; }

export function useLookup() {
  const s = useStore();
  return useMemo(() => {
    const cat: Record<string, Category> = {}, pj: Record<string, Project> = {};
    s.categories.forEach((c) => { cat[c.id] = c; });
    s.projects.forEach((p) => { pj[p.id] = p; });
    return { cat, pj };
  }, [s]);
}

export { uid };
