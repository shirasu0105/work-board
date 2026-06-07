/* ============================================================
   db.ts — SQLite 永続化レイヤ（better-sqlite3 / サーバ専用）
   - 単一ユーザのローカル利用を前提とした構造化ストレージ
   - 主要スカラーはカラム、入れ子オブジェクトは JSON カラムで保持
   ============================================================ */
import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import type {
  AppState, Category, Project, Task, InboxItem, SomedayItem, Memo, Journal, Theme,
} from './types';

/* ---- 接続（HMR を跨いだ多重オープンを防ぐためグローバルに保持）---- */
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'flow.db');

declare global {
  // eslint-disable-next-line no-var
  var __flowDb: Database.Database | undefined;
}

function getDb(): Database.Database {
  if (globalThis.__flowDb) return globalThis.__flowDb;
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  // 先にグローバルへ登録する（seed 内の upsert* が getDb() を再入しても
  // 既存インスタンスを返し、再シードの無限再帰を防ぐ）
  globalThis.__flowDb = db;
  initSchema(db);
  seedIfEmpty(db);
  return db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, descr TEXT, color TEXT,
      ord INTEGER, active INTEGER, createdAt TEXT, updatedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, categoryId TEXT, status TEXT,
      goal TEXT, done_def TEXT, due TEXT, ord INTEGER,
      createdAt TEXT, completedAt TEXT, updatedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, categoryId TEXT, projectId TEXT,
      status TEXT, due TEXT, note TEXT, ord INTEGER,
      createdAt TEXT, completedAt TEXT, waiting TEXT, updatedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS inbox (
      id TEXT PRIMARY KEY, txt TEXT NOT NULL, status TEXT, createdAt TEXT, updatedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS someday (
      id TEXT PRIMARY KEY, txt TEXT NOT NULL, categoryId TEXT, reason TEXT,
      reviewOn TEXT, createdAt TEXT, updatedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS memos (
      id TEXT PRIMARY KEY, kind TEXT, title TEXT NOT NULL, categoryId TEXT,
      projectId TEXT, fields TEXT, createdAt TEXT, updatedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS journals (
      date TEXT PRIMARY KEY, oneLine TEXT, tomorrowTaskIds TEXT,
      createdAt TEXT, updatedAt TEXT
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY, value TEXT
    );
  `);
}

/* ============================================================
   行 <-> オブジェクト 変換
   ============================================================ */
type Row = Record<string, unknown>;
const j = (v: unknown): string => JSON.stringify(v ?? null);
const pj = <T,>(v: unknown, fallback: T): T => {
  if (typeof v !== 'string' || v === '') return fallback;
  try { const p = JSON.parse(v); return (p == null ? fallback : p) as T; } catch { return fallback; }
};

function rowToCategory(r: Row): Category {
  return {
    id: r.id as string, name: r.name as string, desc: (r.descr as string) ?? '',
    color: (r.color as string) ?? '#5e6ad2', order: (r.ord as number) ?? 0,
    active: !!r.active, createdAt: r.createdAt as string, updatedAt: (r.updatedAt as string) ?? undefined,
  };
}
function rowToProject(r: Row): Project {
  return {
    id: r.id as string, name: r.name as string, categoryId: r.categoryId as string,
    status: (r.status as Project['status']) ?? 'active', goal: (r.goal as string) ?? '',
    done_def: (r.done_def as string) ?? '', due: (r.due as string) ?? null, order: (r.ord as number) ?? 0,
    createdAt: r.createdAt as string, completedAt: (r.completedAt as string) ?? null,
    updatedAt: (r.updatedAt as string) ?? undefined,
  };
}
function rowToTask(r: Row): Task {
  return {
    id: r.id as string, title: r.title as string, categoryId: r.categoryId as string,
    projectId: (r.projectId as string) ?? null, status: (r.status as Task['status']) ?? 'backlog',
    due: (r.due as string) ?? null, note: (r.note as string) ?? '', order: (r.ord as number) ?? 0,
    createdAt: r.createdAt as string, completedAt: (r.completedAt as string) ?? null,
    waiting: pj(r.waiting, null), updatedAt: (r.updatedAt as string) ?? undefined,
  };
}
function rowToInbox(r: Row): InboxItem {
  return { id: r.id as string, text: r.txt as string, status: (r.status as string) ?? 'open', createdAt: r.createdAt as string, updatedAt: (r.updatedAt as string) ?? undefined };
}
function rowToSomeday(r: Row): SomedayItem {
  return {
    id: r.id as string, text: r.txt as string, categoryId: r.categoryId as string,
    reason: (r.reason as string) ?? '', reviewOn: (r.reviewOn as string) ?? null,
    createdAt: r.createdAt as string, updatedAt: (r.updatedAt as string) ?? undefined,
  };
}
function rowToMemo(r: Row): Memo {
  return {
    id: r.id as string, kind: r.kind as Memo['kind'], title: r.title as string,
    categoryId: r.categoryId as string, projectId: (r.projectId as string) ?? null,
    fields: pj(r.fields, {}), createdAt: r.createdAt as string, updatedAt: r.updatedAt as string,
  };
}
function rowToJournal(r: Row): Journal {
  return {
    date: r.date as string, oneLine: (r.oneLine as string) ?? '',
    tomorrowTaskIds: pj(r.tomorrowTaskIds, [] as string[]),
    createdAt: r.createdAt as string, updatedAt: (r.updatedAt as string) ?? undefined,
  };
}

/* ============================================================
   読み取り
   ============================================================ */
export function loadAll(): AppState {
  const db = getDb();
  const categories = (db.prepare('SELECT * FROM categories ORDER BY ord').all() as Row[]).map(rowToCategory);
  const projects = (db.prepare('SELECT * FROM projects').all() as Row[]).map(rowToProject);
  const tasks = (db.prepare('SELECT * FROM tasks').all() as Row[]).map(rowToTask);
  const inbox = (db.prepare('SELECT * FROM inbox').all() as Row[]).map(rowToInbox);
  const someday = (db.prepare('SELECT * FROM someday').all() as Row[]).map(rowToSomeday);
  const memos = (db.prepare('SELECT * FROM memos').all() as Row[]).map(rowToMemo);
  const journals = (db.prepare('SELECT * FROM journals').all() as Row[]).map(rowToJournal);
  const themeRow = db.prepare("SELECT value FROM settings WHERE key='theme'").get() as Row | undefined;
  const theme = ((themeRow?.value as Theme) || 'dark') as Theme;
  return { categories, projects, tasks, inbox, someday, memos, journals, settings: { theme } };
}

/* ============================================================
   書き込み（UPSERT / DELETE）— クライアントが完全なオブジェクトを送る
   ============================================================ */
export function upsertCategory(c: Category): void {
  getDb().prepare(`INSERT OR REPLACE INTO categories (id,name,descr,color,ord,active,createdAt,updatedAt)
    VALUES (@id,@name,@desc,@color,@order,@active,@createdAt,@updatedAt)`)
    .run({ ...c, active: c.active ? 1 : 0, updatedAt: c.updatedAt ?? null });
}
export function upsertProject(p: Project): void {
  getDb().prepare(`INSERT OR REPLACE INTO projects (id,name,categoryId,status,goal,done_def,due,ord,createdAt,completedAt,updatedAt)
    VALUES (@id,@name,@categoryId,@status,@goal,@done_def,@due,@order,@createdAt,@completedAt,@updatedAt)`)
    .run({ ...p, due: p.due ?? null, completedAt: p.completedAt ?? null, updatedAt: p.updatedAt ?? null });
}
export function upsertTask(t: Task): void {
  getDb().prepare(`INSERT OR REPLACE INTO tasks (id,title,categoryId,projectId,status,due,note,ord,createdAt,completedAt,waiting,updatedAt)
    VALUES (@id,@title,@categoryId,@projectId,@status,@due,@note,@order,@createdAt,@completedAt,@waiting,@updatedAt)`)
    .run({ ...t, projectId: t.projectId ?? null, due: t.due ?? null, completedAt: t.completedAt ?? null, waiting: j(t.waiting ?? null), updatedAt: t.updatedAt ?? null });
}
export function upsertInbox(i: InboxItem): void {
  getDb().prepare(`INSERT OR REPLACE INTO inbox (id,txt,status,createdAt,updatedAt) VALUES (@id,@text,@status,@createdAt,@updatedAt)`)
    .run({ ...i, updatedAt: i.updatedAt ?? null });
}
export function upsertSomeday(s: SomedayItem): void {
  getDb().prepare(`INSERT OR REPLACE INTO someday (id,txt,categoryId,reason,reviewOn,createdAt,updatedAt)
    VALUES (@id,@text,@categoryId,@reason,@reviewOn,@createdAt,@updatedAt)`)
    .run({ ...s, reviewOn: s.reviewOn ?? null, updatedAt: s.updatedAt ?? null });
}
export function upsertMemo(m: Memo): void {
  getDb().prepare(`INSERT OR REPLACE INTO memos (id,kind,title,categoryId,projectId,fields,createdAt,updatedAt)
    VALUES (@id,@kind,@title,@categoryId,@projectId,@fields,@createdAt,@updatedAt)`)
    .run({ ...m, projectId: m.projectId ?? null, fields: j(m.fields ?? {}) });
}
export function upsertJournal(jn: Journal): void {
  getDb().prepare(`INSERT OR REPLACE INTO journals (date,oneLine,tomorrowTaskIds,createdAt,updatedAt)
    VALUES (@date,@oneLine,@tomorrowTaskIds,@createdAt,@updatedAt)`)
    .run({ ...jn, tomorrowTaskIds: j(jn.tomorrowTaskIds ?? []), updatedAt: jn.updatedAt ?? null });
}
export function setSetting(key: string, value: string): void {
  getDb().prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run(key, value);
}

export const deleteTask = (id: string) => { getDb().prepare('DELETE FROM tasks WHERE id=?').run(id); };
export const deleteInbox = (id: string) => { getDb().prepare('DELETE FROM inbox WHERE id=?').run(id); };
export const deleteSomeday = (id: string) => { getDb().prepare('DELETE FROM someday WHERE id=?').run(id); };
export const deleteMemo = (id: string) => { getDb().prepare('DELETE FROM memos WHERE id=?').run(id); };

export function reorderTasks(ids: string[]): void {
  const db = getDb();
  const stmt = db.prepare('UPDATE tasks SET ord=? WHERE id=?');
  db.transaction(() => { ids.forEach((id, i) => stmt.run(i, id)); })();
}
export function reorderCategories(ids: string[]): void {
  const db = getDb();
  const stmt = db.prepare('UPDATE categories SET ord=? WHERE id=?');
  db.transaction(() => { ids.forEach((id, i) => stmt.run(i, id)); })();
}

/* ============================================================
   初期データ（プロトタイプ準拠。日付は「今日」基準で相対生成）
   ============================================================ */
function resetAll(): AppState {
  const db = getDb();
  db.exec('DELETE FROM categories; DELETE FROM projects; DELETE FROM tasks; DELETE FROM inbox; DELETE FROM someday; DELETE FROM memos; DELETE FROM journals; DELETE FROM settings;');
  seed(db);
  return loadAll();
}
export { resetAll };

function seedIfEmpty(db: Database.Database): void {
  const n = (db.prepare('SELECT COUNT(*) AS c FROM categories').get() as Row).c as number;
  if (!n) seed(db);
}

function seed(db: Database.Database): void {
  // 基準日 = 今日（サーバ時刻）。プロトタイプの d()/ts() を踏襲。
  const now = new Date();
  const baseY = now.getFullYear(), baseM = now.getMonth(), baseD = now.getDate();
  const d = (off = 0): string => {
    const x = new Date(baseY, baseM, baseD + off, 9, 0, 0);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  };
  const ts = (off = 0, hh = 9, mm = 0): string => new Date(baseY, baseM, baseD + off, hh, mm, 0).toISOString();

  const categories: Category[] = [
    { id: 'cat_a', name: 'テーマA', desc: '主要プロダクトの年間運用', order: 0, active: true, color: '#5e6ad2', createdAt: ts(-120) },
    { id: 'cat_b', name: 'テーマB', desc: '社内インフラ・環境整備', order: 1, active: true, color: '#26b5a8', createdAt: ts(-110) },
    { id: 'cat_jimu', name: '事務', desc: '定例報告・庶務', order: 2, active: true, color: '#e0a13a', createdAt: ts(-110) },
    { id: 'cat_dev', name: '個人開発', desc: 'サイドプロジェクト', order: 3, active: true, color: '#d96aa6', createdAt: ts(-90) },
    { id: 'cat_side', name: '副業準備', desc: '将来の選択肢づくり', order: 4, active: true, color: '#7f8a99', createdAt: ts(-60) },
  ];
  const projects: Project[] = [
    { id: 'pj_plan', name: '年間計画化', categoryId: 'cat_a', status: 'active', goal: 'テーマAの年間ロードマップを確定し関係者合意を得る', done_def: '計画資料が承認され全関係者に共有された状態', due: d(11), order: 0, createdAt: ts(-40) },
    { id: 'pj_pc', name: '新PCセットアップ', categoryId: 'cat_b', status: 'active', goal: '開発用新PCを業務利用可能な状態にする', done_def: '全ツール導入・AIモデル学習影響確認が完了', due: d(4), order: 1, createdAt: ts(-15) },
    { id: 'pj_report', name: '四半期報告書作成', categoryId: 'cat_jimu', status: 'active', goal: 'Q1実績の報告書を期日までに提出', done_def: '上長レビュー済みの報告書を提出', due: d(6), order: 2, createdAt: ts(-10) },
    { id: 'pj_blog', name: '技術ブログ立ち上げ', categoryId: 'cat_dev', status: 'active', goal: '学習記録を発信する場をつくる', done_def: '初回記事を公開', due: d(21), order: 3, createdAt: ts(-25) },
    { id: 'pj_archive', name: '旧環境アーカイブ', categoryId: 'cat_b', status: 'done', goal: '旧サーバのデータを退避', done_def: 'バックアップ完了・停止', due: d(-8), order: 4, createdAt: ts(-50), completedAt: ts(-6) },
  ];
  const tasks: Task[] = [
    { id: 'tk_1', title: '〇〇さんに年間方針をヒアリングする', categoryId: 'cat_a', projectId: 'pj_plan', status: 'progress', due: d(0), note: '前回会議の論点を整理してから臨む', order: 0, createdAt: ts(-3) },
    { id: 'tk_2', title: '対応表のドラフトを作成する', categoryId: 'cat_a', projectId: 'pj_plan', status: 'backlog', due: d(2), note: '', order: 1, createdAt: ts(-3) },
    { id: 'tk_3', title: '計画資料のアウトラインを作る', categoryId: 'cat_a', projectId: 'pj_plan', status: 'backlog', due: d(3), note: '', order: 2, createdAt: ts(-2) },
    { id: 'tk_4', title: '新PCに開発ツール一式を導入する', categoryId: 'cat_b', projectId: 'pj_pc', status: 'progress', due: d(0), note: 'エディタ・ランタイム・CLI', order: 3, createdAt: ts(-4) },
    { id: 'tk_5', title: 'AIモデル学習影響を確認する', categoryId: 'cat_b', projectId: 'pj_pc', status: 'backlog', due: d(1), note: '社内ポリシー要確認', order: 4, createdAt: ts(-4) },
    { id: 'tk_6', title: '四半期報告書の数値を集計する', categoryId: 'cat_jimu', projectId: 'pj_report', status: 'progress', due: d(0), note: '', order: 5, createdAt: ts(-2) },
    { id: 'tk_7', title: '作業完了報告書を作成する', categoryId: 'cat_jimu', projectId: null, status: 'backlog', due: d(2), note: '単発作業', order: 6, createdAt: ts(-1) },
    { id: 'tk_8', title: 'デザインレビューの回答を待つ', categoryId: 'cat_a', projectId: 'pj_plan', status: 'waiting', due: null, note: '', order: 7, createdAt: ts(-5), waiting: { who: '田中マネージャー', reason: '計画ドラフトの方針承認待ち', since: d(-2), checkOn: d(1), memo: 'Slackで依頼済み。木曜の定例で確認予定。' } },
    { id: 'tk_9', title: '情シスにVPN申請の承認をもらう', categoryId: 'cat_b', projectId: 'pj_pc', status: 'waiting', due: null, note: '', order: 8, createdAt: ts(-6), waiting: { who: '情報システム部', reason: 'アカウント発行待ち', since: d(-5), checkOn: d(-1), memo: '申請番号 REQ-2041' } },
    { id: 'tk_10', title: '経費精算フローの見直し案を相談', categoryId: 'cat_jimu', projectId: null, status: 'waiting', due: null, note: '', order: 9, createdAt: ts(-4), waiting: { who: '経理 佐藤さん', reason: '新フローの可否確認待ち', since: d(-3), checkOn: d(2), memo: '' } },
    { id: 'tk_11', title: 'ブログの技術スタックを選定する', categoryId: 'cat_dev', projectId: 'pj_blog', status: 'hold', due: null, note: '新PC準備後に着手', order: 10, createdAt: ts(-8) },
    { id: 'tk_12', title: '副業に関する就業規則を確認する', categoryId: 'cat_side', projectId: null, status: 'backlog', due: d(5), note: '', order: 11, createdAt: ts(-7) },
    { id: 'tk_13', title: '週報を提出する', categoryId: 'cat_jimu', projectId: null, status: 'done', due: d(-1), note: '', order: 12, createdAt: ts(-1), completedAt: ts(-1, 17, 30) },
    { id: 'tk_14', title: 'キックオフ議事録を共有する', categoryId: 'cat_a', projectId: 'pj_plan', status: 'done', due: d(-2), note: '', order: 13, createdAt: ts(-3), completedAt: ts(-2, 16, 0) },
    { id: 'tk_15', title: '旧環境の最終バックアップを取得', categoryId: 'cat_b', projectId: 'pj_archive', status: 'done', due: d(-6), note: '', order: 14, createdAt: ts(-7), completedAt: ts(-6, 11, 0) },
    { id: 'tk_16', title: 'ブログ記事ネタを3つ書き出す', categoryId: 'cat_dev', projectId: 'pj_blog', status: 'backlog', due: null, note: '', order: 15, createdAt: ts(-2) },
  ];
  const inbox: InboxItem[] = [
    { id: 'in_1', text: '会議で出た「権限設計を見直す」案、後で検討する', status: 'open', createdAt: ts(-1, 14, 20) },
    { id: 'in_2', text: 'Notionのテンプレ、業務メモに転用できそう', status: 'open', createdAt: ts(-1, 16, 5) },
    { id: 'in_3', text: '来月の登壇、資料の骨子だけ先に', status: 'open', createdAt: ts(0, 9, 12) },
    { id: 'in_4', text: '請求書フォーマットの統一について経理に相談', status: 'open', createdAt: ts(0, 10, 40) },
  ];
  const someday: SomedayItem[] = [
    { id: 'sd_1', text: '英語の技術ドキュメント読解を習慣化する', categoryId: 'cat_side', reason: '海外案件の選択肢を広げたい', reviewOn: d(20), createdAt: ts(-30) },
    { id: 'sd_2', text: '自宅サーバでホームラボを構築する', categoryId: 'cat_dev', reason: 'インフラの実地学習', reviewOn: d(40), createdAt: ts(-22) },
    { id: 'sd_3', text: 'タスク管理アプリを自作して公開する', categoryId: 'cat_dev', reason: 'まさに今これ', reviewOn: d(14), createdAt: ts(-12) },
  ];
  const memos: Memo[] = [
    { id: 'mm_1', kind: 'meeting', title: 'テーマA キックオフMTG', categoryId: 'cat_a', projectId: 'pj_plan', createdAt: ts(-3, 15, 0), updatedAt: ts(-3, 16, 30), fields: { datetime: ts(-3, 14, 0), attendees: '自分, 田中M, 鈴木さん, 山本さん', purpose: '年間計画化の進め方を合意する', agenda: '・現状整理\n・体制\n・スケジュール', decisions: '・隔週で進捗確認\n・ドラフトは自分が起票', todos: '・対応表のたたきを作る（自分）\n・関係者リスト共有（鈴木さん）', nextAction: '対応表ドラフトを今週中に作成' } },
    { id: 'mm_2', kind: 'tt', title: 'Gitのrebase運用について', categoryId: 'cat_dev', projectId: null, createdAt: ts(-5, 11, 0), updatedAt: ts(-5, 11, 20), fields: { from: '先輩エンジニア 高橋さん', background: 'PRが大きくなりがちで履歴が追いづらい', content: '小さくrebaseして履歴を整える。feature単位でsquash。', fact: 'rebaseで履歴を線形に保てる', abstract: '後から読む人のために情報を整流化する', apply: 'メモも同じ。書く時に構造を整えると後で効く' } },
    { id: 'mm_3', kind: 'idea', title: '待ち状態を色で区別したい', categoryId: 'cat_a', projectId: null, createdAt: ts(-2, 13, 30), updatedAt: ts(-2, 13, 40), fields: { content: '誰がボールを持っているか一目で分かると良い', fact: '付箋だと待ちが埋もれる', abstract: '状態の可視性が行動の速さを決める', apply: 'アプリでは待ちを専用ビュー＋色分けにする', taskCand: '待ち一覧の色分けを実装', somedayCand: '' } },
    { id: 'mm_4', kind: 'research', title: 'SQLiteのバックアップ方式の調査', categoryId: 'cat_dev', projectId: 'pj_blog', createdAt: ts(-6, 10, 0), updatedAt: ts(-6, 10, 45), fields: { theme: 'ローカルDBの安全な退避方法', content: 'VACUUM INTO / .backup コマンド / ファイルコピーの比較', found: 'VACUUM INTOは稼働中でも一貫性のあるコピーが取れる', conclusion: '定期VACUUM INTO + 世代管理が手軽', next: 'cronで日次取得できるか確認' } },
    { id: 'mm_5', kind: 'worklog', title: '新PC 開発環境セットアップ作業', categoryId: 'cat_b', projectId: 'pj_pc', createdAt: ts(-1, 17, 0), updatedAt: ts(-1, 17, 30), fields: { work: 'エディタ・ランタイム・CLIを導入', result: '基本ツールは導入完了', stuck: 'プロキシ環境でパッケージ取得が失敗', handle: '社内ミラーのURLに切替で解決', next: 'AIモデル学習影響の確認' } },
    { id: 'mm_6', kind: 'meeting', title: '四半期報告 事前すり合わせ', categoryId: 'cat_jimu', projectId: 'pj_report', createdAt: ts(0, 11, 0), updatedAt: ts(0, 11, 15), fields: { datetime: ts(0, 10, 30), attendees: '自分, 田中M', purpose: '報告書の構成確認', agenda: '・必要な数値\n・締切', decisions: '・来週月曜提出', todos: '・数値集計（自分）', nextAction: '数値の集計を進める' } },
  ];
  const journals: Journal[] = [
    { date: d(-1), oneLine: 'ヒアリング準備で午後が溶けた。明日は午前にまとめて片付ける。', tomorrowTaskIds: ['tk_1', 'tk_4', 'tk_6'], createdAt: ts(-1, 18, 0) },
    { date: d(-2), oneLine: 'キックオフ完了。良い滑り出し。', tomorrowTaskIds: ['tk_14'], createdAt: ts(-2, 18, 30) },
  ];

  db.transaction(() => {
    categories.forEach(upsertCategory);
    projects.forEach(upsertProject);
    tasks.forEach(upsertTask);
    inbox.forEach(upsertInbox);
    someday.forEach(upsertSomeday);
    memos.forEach(upsertMemo);
    journals.forEach(upsertJournal);
    setSetting('theme', 'dark');
  })();
}
