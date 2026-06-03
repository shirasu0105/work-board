/* ============================================================
   Flow — モックデータ & 簡易ストア（localStorage 永続化 + 購読）
   ============================================================ */
(function () {
  'use strict';

  // ---- 日付ユーティリティ（"今日" = 2026-06-03 固定基準）----
  var TODAY = '2026-06-03';
  function d(offsetDays) {
    var base = new Date('2026-06-03T09:00:00');
    base.setDate(base.getDate() + (offsetDays || 0));
    return base.toISOString().slice(0, 10);
  }
  function ts(offsetDays, hh, mm) {
    var base = new Date('2026-06-03T09:00:00');
    base.setDate(base.getDate() + (offsetDays || 0));
    if (hh != null) base.setHours(hh, mm || 0, 0, 0);
    return base.toISOString();
  }
  var uid = (function () { var n = 100; return function (p) { n += 1; return (p || 'id') + '_' + n; }; })();

  // ---- カテゴリ ----
  var categories = [
    { id: 'cat_a', name: 'テーマA', desc: '主要プロダクトの年間運用', order: 0, active: true, color: '#5e6ad2', createdAt: ts(-120) },
    { id: 'cat_b', name: 'テーマB', desc: '社内インフラ・環境整備', order: 1, active: true, color: '#26b5a8', createdAt: ts(-110) },
    { id: 'cat_jimu', name: '事務', desc: '定例報告・庶務', order: 2, active: true, color: '#e0a13a', createdAt: ts(-110) },
    { id: 'cat_dev', name: '個人開発', desc: 'サイドプロジェクト', order: 3, active: true, color: '#d96aa6', createdAt: ts(-90) },
    { id: 'cat_side', name: '副業準備', desc: '将来の選択肢づくり', order: 4, active: true, color: '#7f8a99', createdAt: ts(-60) }
  ];

  // ---- プロジェクト ----
  var projects = [
    { id: 'pj_plan', name: '年間計画化', categoryId: 'cat_a', status: 'active', goal: 'テーマAの年間ロードマップを確定し関係者合意を得る', done_def: '計画資料が承認され全関係者に共有された状態', due: d(11), order: 0, createdAt: ts(-40) },
    { id: 'pj_pc', name: '新PCセットアップ', categoryId: 'cat_b', status: 'active', goal: '開発用新PCを業務利用可能な状態にする', done_def: '全ツール導入・AIモデル学習影響確認が完了', due: d(4), order: 1, createdAt: ts(-15) },
    { id: 'pj_report', name: '四半期報告書作成', categoryId: 'cat_jimu', status: 'active', goal: 'Q1実績の報告書を期日までに提出', done_def: '上長レビュー済みの報告書を提出', due: d(6), order: 2, createdAt: ts(-10) },
    { id: 'pj_blog', name: '技術ブログ立ち上げ', categoryId: 'cat_dev', status: 'active', goal: '学習記録を発信する場をつくる', done_def: '初回記事を公開', due: d(21), order: 3, createdAt: ts(-25) },
    { id: 'pj_archive', name: '旧環境アーカイブ', categoryId: 'cat_b', status: 'done', goal: '旧サーバのデータを退避', done_def: 'バックアップ完了・停止', due: d(-8), order: 4, createdAt: ts(-50), completedAt: ts(-6) }
  ];

  // ---- タスク ----
  // status: backlog(未着手) / progress(対応中) / waiting(待ち) / hold(保留) / done(完了)
  var tasks = [
    { id: 'tk_1', title: '〇〇さんに年間方針をヒアリングする', categoryId: 'cat_a', projectId: 'pj_plan', status: 'progress', due: d(0), note: '前回会議の論点を整理してから臨む', order: 0, createdAt: ts(-3) },
    { id: 'tk_2', title: '対応表のドラフトを作成する', categoryId: 'cat_a', projectId: 'pj_plan', status: 'backlog', due: d(2), note: '', order: 1, createdAt: ts(-3) },
    { id: 'tk_3', title: '計画資料のアウトラインを作る', categoryId: 'cat_a', projectId: 'pj_plan', status: 'backlog', due: d(3), note: '', order: 2, createdAt: ts(-2) },
    { id: 'tk_4', title: '新PCに開発ツール一式を導入する', categoryId: 'cat_b', projectId: 'pj_pc', status: 'progress', due: d(0), note: 'エディタ・ランタイム・CLI', order: 3, createdAt: ts(-4) },
    { id: 'tk_5', title: 'AIモデル学習影響を確認する', categoryId: 'cat_b', projectId: 'pj_pc', status: 'backlog', due: d(1), note: '社内ポリシー要確認', order: 4, createdAt: ts(-4) },
    { id: 'tk_6', title: '四半期報告書の数値を集計する', categoryId: 'cat_jimu', projectId: 'pj_report', status: 'progress', due: d(0), note: '', order: 5, createdAt: ts(-2) },
    { id: 'tk_7', title: '作業完了報告書を作成する', categoryId: 'cat_jimu', projectId: null, status: 'backlog', due: d(2), note: '単発作業', order: 6, createdAt: ts(-1) },
    { id: 'tk_8', title: 'デザインレビューの回答を待つ', categoryId: 'cat_a', projectId: 'pj_plan', status: 'waiting', due: null, note: '', order: 7, createdAt: ts(-5),
      waiting: { who: '田中マネージャー', reason: '計画ドラフトの方針承認待ち', since: d(-2), checkOn: d(1), memo: 'Slackで依頼済み。木曜の定例で確認予定。' } },
    { id: 'tk_9', title: '情シスにVPN申請の承認をもらう', categoryId: 'cat_b', projectId: 'pj_pc', status: 'waiting', due: null, note: '', order: 8, createdAt: ts(-6),
      waiting: { who: '情報システム部', reason: 'アカウント発行待ち', since: d(-5), checkOn: d(-1), memo: '申請番号 REQ-2041' } },
    { id: 'tk_10', title: '経費精算フローの見直し案を相談', categoryId: 'cat_jimu', projectId: null, status: 'waiting', due: null, note: '', order: 9, createdAt: ts(-4),
      waiting: { who: '経理 佐藤さん', reason: '新フローの可否確認待ち', since: d(-3), checkOn: d(2), memo: '' } },
    { id: 'tk_11', title: 'ブログの技術スタックを選定する', categoryId: 'cat_dev', projectId: 'pj_blog', status: 'hold', due: null, note: '新PC準備後に着手', order: 10, createdAt: ts(-8) },
    { id: 'tk_12', title: '副業に関する就業規則を確認する', categoryId: 'cat_side', projectId: null, status: 'backlog', due: d(5), note: '', order: 11, createdAt: ts(-7) },
    { id: 'tk_13', title: '週報を提出する', categoryId: 'cat_jimu', projectId: null, status: 'done', due: d(-1), note: '', order: 12, createdAt: ts(-1), completedAt: ts(-1, 17, 30) },
    { id: 'tk_14', title: 'キックオフ議事録を共有する', categoryId: 'cat_a', projectId: 'pj_plan', status: 'done', due: d(-2), note: '', order: 13, createdAt: ts(-3), completedAt: ts(-2, 16, 0) },
    { id: 'tk_15', title: '旧環境の最終バックアップを取得', categoryId: 'cat_b', projectId: 'pj_archive', status: 'done', due: d(-6), note: '', order: 14, createdAt: ts(-7), completedAt: ts(-6, 11, 0) },
    { id: 'tk_16', title: 'ブログ記事ネタを3つ書き出す', categoryId: 'cat_dev', projectId: 'pj_blog', status: 'backlog', due: null, note: '', order: 15, createdAt: ts(-2) }
  ];

  // ---- Inbox（未整理） ----
  var inbox = [
    { id: 'in_1', text: '会議で出た「権限設計を見直す」案、後で検討する', status: 'open', createdAt: ts(-1, 14, 20) },
    { id: 'in_2', text: 'Notionのテンプレ、業務メモに転用できそう', status: 'open', createdAt: ts(-1, 16, 5) },
    { id: 'in_3', text: '来月の登壇、資料の骨子だけ先に', status: 'open', createdAt: ts(0, 9, 12) },
    { id: 'in_4', text: '請求書フォーマットの統一について経理に相談', status: 'open', createdAt: ts(0, 10, 40) }
  ];

  // ---- Someday / Maybe ----
  var someday = [
    { id: 'sd_1', text: '英語の技術ドキュメント読解を習慣化する', categoryId: 'cat_side', reason: '海外案件の選択肢を広げたい', reviewOn: d(20), createdAt: ts(-30) },
    { id: 'sd_2', text: '自宅サーバでホームラボを構築する', categoryId: 'cat_dev', reason: 'インフラの実地学習', reviewOn: d(40), createdAt: ts(-22) },
    { id: 'sd_3', text: 'タスク管理アプリを自作して公開する', categoryId: 'cat_dev', reason: 'まさに今これ', reviewOn: d(14), createdAt: ts(-12) }
  ];

  // ---- メモ ----
  // kind: meeting / tt / idea / research / worklog
  var memos = [
    { id: 'mm_1', kind: 'meeting', title: 'テーマA キックオフMTG', categoryId: 'cat_a', projectId: 'pj_plan', createdAt: ts(-3, 15, 0), updatedAt: ts(-3, 16, 30),
      fields: { datetime: ts(-3, 14, 0), attendees: '自分, 田中M, 鈴木さん, 山本さん', purpose: '年間計画化の進め方を合意する', agenda: '・現状整理\n・体制\n・スケジュール', decisions: '・隔週で進捗確認\n・ドラフトは自分が起票', todos: '・対応表のたたきを作る（自分）\n・関係者リスト共有（鈴木さん）', nextAction: '対応表ドラフトを今週中に作成' } },
    { id: 'mm_2', kind: 'tt', title: 'Gitのrebase運用について', categoryId: 'cat_dev', projectId: null, createdAt: ts(-5, 11, 0), updatedAt: ts(-5, 11, 20),
      fields: { from: '先輩エンジニア 高橋さん', background: 'PRが大きくなりがちで履歴が追いづらい', content: '小さくrebaseして履歴を整える。feature単位でsquash。', fact: 'rebaseで履歴を線形に保てる', abstract: '後から読む人のために情報を整流化する', apply: 'メモも同じ。書く時に構造を整えると後で効く' } },
    { id: 'mm_3', kind: 'idea', title: '待ち状態を色で区別したい', categoryId: 'cat_a', projectId: null, createdAt: ts(-2, 13, 30), updatedAt: ts(-2, 13, 40),
      fields: { content: '誰がボールを持っているか一目で分かると良い', fact: '付箋だと待ちが埋もれる', abstract: '状態の可視性が行動の速さを決める', apply: 'アプリでは待ちを専用ビュー＋色分けにする', taskCand: '待ち一覧の色分けを実装', somedayCand: '' } },
    { id: 'mm_4', kind: 'research', title: 'SQLiteのバックアップ方式の調査', categoryId: 'cat_dev', projectId: 'pj_blog', createdAt: ts(-6, 10, 0), updatedAt: ts(-6, 10, 45),
      fields: { theme: 'ローカルDBの安全な退避方法', content: 'VACUUM INTO / .backup コマンド / ファイルコピーの比較', found: 'VACUUM INTOは稼働中でも一貫性のあるコピーが取れる', conclusion: '定期VACUUM INTO + 世代管理が手軽', next: 'cronで日次取得できるか確認' } },
    { id: 'mm_5', kind: 'worklog', title: '新PC 開発環境セットアップ作業', categoryId: 'cat_b', projectId: 'pj_pc', createdAt: ts(-1, 17, 0), updatedAt: ts(-1, 17, 30),
      fields: { work: 'エディタ・ランタイム・CLIを導入', result: '基本ツールは導入完了', stuck: 'プロキシ環境でパッケージ取得が失敗', handle: '社内ミラーのURLに切替で解決', next: 'AIモデル学習影響の確認' } },
    { id: 'mm_6', kind: 'meeting', title: '四半期報告 事前すり合わせ', categoryId: 'cat_jimu', projectId: 'pj_report', createdAt: ts(0, 11, 0), updatedAt: ts(0, 11, 15),
      fields: { datetime: ts(0, 10, 30), attendees: '自分, 田中M', purpose: '報告書の構成確認', agenda: '・必要な数値\n・締切', decisions: '・来週月曜提出', todos: '・数値集計（自分）', nextAction: '数値の集計を進める' } }
  ];

  // ---- 日次ジャーナル ----
  // 昨日(=6/2)のジャーナルで「明日やること」に選んだ tk が、今日のホームに出る
  var journals = [
    { date: d(-1), oneLine: 'ヒアリング準備で午後が溶けた。明日は午前にまとめて片付ける。', tomorrowTaskIds: ['tk_1', 'tk_4', 'tk_6'], createdAt: ts(-1, 18, 0) },
    { date: d(-2), oneLine: 'キックオフ完了。良い滑り出し。', tomorrowTaskIds: ['tk_14'], createdAt: ts(-2, 18, 30) }
  ];

  // ---- 種別メタ ----
  var memoKinds = {
    meeting:  { label: '議事録',     icon: 'mk_meeting',  hue: '#5e6ad2' },
    tt:       { label: 'TTメモ',     icon: 'mk_tt',       hue: '#26b5a8' },
    idea:     { label: '思いつき',   icon: 'mk_idea',     hue: '#e0a13a' },
    research: { label: '調査メモ',   icon: 'mk_research', hue: '#d96aa6' },
    worklog:  { label: '作業ログ',   icon: 'mk_worklog',  hue: '#7f8a99' }
  };
  var statusMeta = {
    backlog:  { label: '未着手', color: 'var(--st-backlog)' },
    progress: { label: '対応中', color: 'var(--st-progress)' },
    waiting:  { label: '待ち',   color: 'var(--st-waiting)' },
    hold:     { label: '保留',   color: 'var(--st-hold)' },
    done:     { label: '完了',   color: 'var(--st-done)' }
  };

  var initial = { categories: categories, projects: projects, tasks: tasks, inbox: inbox, someday: someday, memos: memos, journals: journals, settings: { theme: 'dark' } };

  // ---------- ストア ----------
  var KEY = 'flow_app_state_v1';
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { var p = JSON.parse(raw); if (p && p.tasks) return p; }
    } catch (e) {}
    return JSON.parse(JSON.stringify(initial));
  }
  var state = load();
  var listeners = new Set();
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  function emit() { listeners.forEach(function (l) { l(); }); persist(); }

  var Store = {
    TODAY: TODAY,
    memoKinds: memoKinds,
    statusMeta: statusMeta,
    get: function () { return state; },
    subscribe: function (fn) { listeners.add(fn); return function () { listeners.delete(fn); }; },
    set: function (updater) { state = typeof updater === 'function' ? updater(state) : updater; emit(); },
    uid: uid,
    today: function () { return TODAY; },
    addDays: d,
    reset: function () { state = JSON.parse(JSON.stringify(initial)); emit(); }
  };

  window.Store = Store;
})();
