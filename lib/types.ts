/* ============================================================
   types.ts — アプリ全体のドメイン型
   プロトタイプ (docs/design/app/store.js) のデータ形状に準拠
   ============================================================ */

export type TaskStatus = 'backlog' | 'progress' | 'waiting' | 'hold' | 'done';
export type MemoKind = 'meeting' | 'tt' | 'idea' | 'research' | 'worklog';
export type ProjectStatus = 'active' | 'done';
export type Theme = 'dark' | 'light';

export interface Category {
  id: string;
  name: string;
  desc: string;
  order: number;
  active: boolean;
  color: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  categoryId: string;
  status: ProjectStatus;
  goal: string;
  done_def: string;
  due: string | null;
  order: number;
  createdAt: string;
  completedAt?: string | null;
  updatedAt?: string;
}

export interface Waiting {
  who: string;
  reason: string;
  since: string;
  checkOn?: string | null;
  memo?: string;
}

export interface Task {
  id: string;
  title: string;
  categoryId: string;
  projectId: string | null;
  status: TaskStatus;
  due: string | null;
  note: string;
  order: number;
  createdAt: string;
  completedAt?: string | null;
  waiting?: Waiting | null;
  updatedAt?: string;
}

export interface InboxItem {
  id: string;
  text: string;
  status: 'open' | string;
  createdAt: string;
  updatedAt?: string;
}

export interface SomedayItem {
  id: string;
  text: string;
  categoryId: string;
  reason: string;
  reviewOn: string | null;
  createdAt: string;
  updatedAt?: string;
}

/** メモ種別ごとに動的なフィールドを持つため、key->value の辞書で保持 */
export type MemoFields = Record<string, string>;

export interface Memo {
  id: string;
  kind: MemoKind;
  title: string;
  categoryId: string;
  projectId: string | null;
  fields: MemoFields;
  createdAt: string;
  updatedAt: string;
}

export interface Journal {
  date: string; // YYYY-MM-DD（主キー）
  oneLine: string;
  tomorrowTaskIds: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Settings {
  theme: Theme;
}

/** アプリ全体の状態。クライアントストアはこの形をそのまま保持する */
export interface AppState {
  categories: Category[];
  projects: Project[];
  tasks: Task[];
  inbox: InboxItem[];
  someday: SomedayItem[];
  memos: Memo[];
  journals: Journal[];
  settings: Settings;
}
