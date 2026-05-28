// Tasks (Kanban) + Projects screens

const TASKS_BY_STATUS = {
  "未着手": [
    { t: "ヒアリング項目をまとめる", c: "テーマA", p: "年間計画化", d: "11/28" },
    { t: "新PCのBIOS確認", c: "テーマB", p: "新PCセットアップ" },
    { t: "対応表の初稿を書く", c: "テーマA", p: "年間計画化" },
    { t: "Tailwind v4 試用記録", c: "個人開発" },
  ],
  "対応中": [
    { t: "計画資料の構成案を作成", c: "テーマA", p: "年間計画化", d: "11/29" },
    { t: "四半期報告書の数値集計", c: "事務", p: "四半期報告書作成", d: "12/01" },
  ],
  "待ち": [
    { t: "対応表の確認回答待ち", c: "テーマA", who: "Aさん", since: "3日" },
    { t: "計画資料レビュー", c: "テーマA", who: "Bさん", since: "5日" },
  ],
  "保留": [
    { t: "副業向け契約形態リサーチ", c: "副業準備" },
  ],
  "完了": [
    { t: "新PC初期セットアップ", c: "テーマB", p: "新PCセットアップ" },
    { t: "11/26 定例MTG準備", c: "テーマA" },
  ],
};

function TasksScreen() {
  const cols = Object.entries(TASKS_BY_STATUS);
  return (
    <Screen active="tasks" title="タスク"
      topRight={<>
        <button className="sk-btn sk-btn-ghost">≡ リスト</button>
        <button className="sk-btn sk-btn-primary">▦ かんばん</button>
        <button className="sk-btn">＋ タスク追加</button>
      </>}>
      <div className="col gap-12" style={{ height: "100%" }}>
        {/* filter row */}
        <div className="row aic gap-6 fwrap">
          <span className="hand t-13 muted">絞り込み:</span>
          <span className="sk-chip solid">すべて</span>
          <span className="sk-chip">カテゴリ▾</span>
          <span className="sk-chip">プロジェクト▾</span>
          <span className="sk-chip">期限 ≤ 今週</span>
          <span className="sk-chip muted">＋ プロジェクト無しのみ</span>
          <div className="f1" />
          <span className="hand t-12 muted">表示 11 / 計 24 件</span>
        </div>

        {/* kanban */}
        <div className="row gap-12 f1" style={{ overflow: "auto", alignItems: "stretch" }}>
          {cols.map(([status, list]) => (
            <div key={status} className="col gap-8" style={{ flex: "1 1 0", minWidth: 200 }}>
              <div className="row aic between" style={{ padding: "0 4px" }}>
                <div className="row aic gap-6">
                  <StatusChip s={status} />
                  <span className="hand t-12 muted">{list.length}</span>
                </div>
                <span className="muted hand t-14">＋</span>
              </div>
              <div className="col gap-6 f1" style={{
                background: "var(--paper-2)",
                border: "1.5px dashed var(--ink-4)",
                borderRadius: 6,
                padding: 8,
                minHeight: 200,
              }}>
                {list.map((t, i) => (
                  <div key={i} className="sk-card col gap-4" style={{ padding: "8px 10px", background: status === "完了" ? "var(--paper-2)" : "var(--paper)" }}>
                    <div className="hand t-13" style={{ textDecoration: status === "完了" ? "line-through" : "none", color: status === "完了" ? "var(--ink-3)" : "var(--ink)" }}>{t.t}</div>
                    <div className="row aic gap-4 fwrap">
                      <Cat name={t.c} />
                      {t.p && <span className="hand t-11 muted">▸ {t.p}</span>}
                      {t.d && <span className="sk-chip" style={{ fontSize: 10 }}>📅 {t.d}</span>}
                      {t.who && <span className="sk-chip accent" style={{ fontSize: 10 }}>{t.who} ({t.since})</span>}
                    </div>
                  </div>
                ))}
                {list.length === 0 && <div className="hand t-12 muted tc" style={{ padding: 12 }}>(空)</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}

// Alt list-view for tasks (used in canvas as additional variant if needed)
function TasksListScreen() {
  const rows = [
    ...TASKS_BY_STATUS["対応中"].map(t => ({ ...t, s: "対応中" })),
    ...TASKS_BY_STATUS["未着手"].map(t => ({ ...t, s: "未着手" })),
    ...TASKS_BY_STATUS["待ち"].map(t => ({ ...t, s: "待ち" })),
  ];
  return (
    <Screen active="tasks" title="タスク（リスト）"
      topRight={<>
        <button className="sk-btn sk-btn-primary">≡ リスト</button>
        <button className="sk-btn sk-btn-ghost">▦ かんばん</button>
        <button className="sk-btn">＋ タスク追加</button>
      </>}>
      <div className="col gap-10">
        <div className="row aic gap-6 fwrap">
          <span className="sk-chip solid">未完了</span>
          <span className="sk-chip">完了含む</span>
          <span className="sk-chip">カテゴリ▾</span>
          <span className="sk-chip">期限▾</span>
        </div>
        <div className="sk-card" style={{ padding: 0 }}>
          {/* header row */}
          <div className="row" style={{ borderBottom: "1.5px solid var(--ink)", padding: "8px 12px", background: "var(--paper-2)" }}>
            <div style={{ width: 22 }} />
            <div className="hand t-12 muted f1">タスク名</div>
            <div className="hand t-12 muted" style={{ width: 110 }}>状態</div>
            <div className="hand t-12 muted" style={{ width: 100 }}>カテゴリ</div>
            <div className="hand t-12 muted" style={{ width: 130 }}>プロジェクト</div>
            <div className="hand t-12 muted" style={{ width: 70 }}>期限</div>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="row aic" style={{ borderBottom: "1px dashed var(--ink-4)", padding: "8px 12px" }}>
              <div style={{ width: 22 }}><span className="sk-check" /></div>
              <div className="hand t-13 f1">{r.t}</div>
              <div style={{ width: 110 }}><StatusChip s={r.s} /></div>
              <div style={{ width: 100 }}><Cat name={r.c} /></div>
              <div style={{ width: 130 }} className="hand t-12 muted">{r.p || "—"}</div>
              <div style={{ width: 70 }} className="hand t-12 muted">{r.d || "—"}</div>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}

function ProjectsScreen() {
  const projects = [
    { n: "年間計画化", c: "テーマA", goal: "下期目標と整合する年間計画を確定する", p: 60, tasks: 8, done: 5, due: "12/15", status: "進行中" },
    { n: "新PCセットアップ", c: "テーマB", goal: "業務PC移行完了とログイン環境再構築", p: 80, tasks: 6, done: 5, due: "11/30", status: "進行中" },
    { n: "四半期報告書作成", c: "事務", goal: "Q3報告書を承認まで通す", p: 30, tasks: 9, done: 3, due: "12/10", status: "進行中" },
    { n: "AIモデル影響確認", c: "テーマB", goal: "新PC環境でのモデル動作確認", p: 10, tasks: 4, done: 0, due: "12/20", status: "未着手" },
    { n: "副業準備", c: "副業準備", goal: "副業契約に必要な準備を整える", p: 5, tasks: 12, done: 1, status: "保留" },
  ];
  return (
    <Screen active="projects" title="プロジェクト"
      topRight={<>
        <button className="sk-btn sk-btn-ghost">完了済み</button>
        <button className="sk-btn">＋ プロジェクト</button>
      </>}>
      <div className="col gap-12">
        <div className="row aic gap-6">
          <span className="sk-chip solid">進行中</span>
          <span className="sk-chip">未着手</span>
          <span className="sk-chip">保留</span>
          <span className="sk-chip muted">完了</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {projects.map((p, i) => (
            <div key={i} className="sk-card col gap-8" style={{ padding: 14 }}>
              <div className="row aic between">
                <div className="row aic gap-8">
                  <span className="hand t-18 bold">▸ {p.n}</span>
                  <Cat name={p.c} />
                </div>
                <span className={"sk-chip " + (p.status === "保留" ? "muted" : "")}>{p.status}</span>
              </div>
              <div className="hand t-13 muted">完了条件: {p.goal}</div>
              {/* progress */}
              <div>
                <div className="row aic between mb-4">
                  <span className="hand t-12 muted">進捗 {p.done}/{p.tasks} タスク</span>
                  <span className="hand t-12 muted">{p.p}%</span>
                </div>
                <div style={{ height: 8, background: "var(--paper-2)", border: "1.2px solid var(--ink)", borderRadius: 4, position: "relative", filter: "url(#sketchy)" }}>
                  <div style={{ position: "absolute", inset: 0, width: `${p.p}%`, background: "var(--ink)" }} />
                </div>
              </div>
              <div className="row aic between">
                <span className="hand t-12 muted">{p.due ? `期限 ${p.due}` : "期限なし"}</span>
                <div className="row gap-4">
                  <button className="sk-btn t-11">タスクを見る</button>
                  <button className="sk-btn sk-btn-ghost t-11">編集</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}

Object.assign(window, { TasksScreen, TasksListScreen, ProjectsScreen });
