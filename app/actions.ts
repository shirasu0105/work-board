'use server';
/* ============================================================
   actions.ts — Server Actions（SQLite 永続化の入口）
   クライアントが完全なオブジェクトを生成して送り、サーバはそれを保存する。
   ============================================================ */
import * as db from '@/lib/db';
import type {
  AppState, Category, Project, Task, InboxItem, SomedayItem, Memo, Journal,
} from '@/lib/types';

export async function loadState(): Promise<AppState> {
  return db.loadAll();
}

export async function saveCategory(c: Category): Promise<void> { db.upsertCategory(c); }
export async function saveProject(p: Project): Promise<void> { db.upsertProject(p); }
export async function saveTask(t: Task): Promise<void> { db.upsertTask(t); }
export async function saveInbox(i: InboxItem): Promise<void> { db.upsertInbox(i); }
export async function saveSomeday(s: SomedayItem): Promise<void> { db.upsertSomeday(s); }
export async function saveMemo(m: Memo): Promise<void> { db.upsertMemo(m); }
export async function saveJournal(jn: Journal): Promise<void> { db.upsertJournal(jn); }
export async function setTheme(theme: string): Promise<void> { db.setSetting('theme', theme); }

export async function removeTask(id: string): Promise<void> { db.deleteTask(id); }
export async function removeInbox(id: string): Promise<void> { db.deleteInbox(id); }
export async function removeSomeday(id: string): Promise<void> { db.deleteSomeday(id); }
export async function removeMemo(id: string): Promise<void> { db.deleteMemo(id); }

export async function reorderTasks(ids: string[]): Promise<void> { db.reorderTasks(ids); }
export async function reorderCategories(ids: string[]): Promise<void> { db.reorderCategories(ids); }

export async function resetState(): Promise<AppState> { return db.resetAll(); }
