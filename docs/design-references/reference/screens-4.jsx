// Journal + Weekly Review + Settings

function JournalScreen() {
  const undone = [
    { t: "ヒアリング項目をまとめる", c: "テーマA", p: "年間計画化", sel: true },
    { t: "対応表の初稿を書く", c: "テーマA", p: "年間計画化", sel: true },
    { t: "新PCのBIOS確認", c: "テーマB", p: "新PCセットアップ" },
    { t: "四半期報告書の数値集計", c: "事務", p: "四半期報告書作成", sel: true },
    { t: "Tailwind v4 試用記録", c: "個人開発" },
    { t: "Aさんに礼を伝える", c: "テーマA" },
    { t: "AIモデル学習の社内ガイドライン読む", c: "テーマB" },
  ];
  const done = [
    { t: "11/26 定例MTGの議事録を書く", c: "テーマA" },
    { t: "新PC初期セットアップ", c: "テーマB" },
    { t: "対応表の構成を整理", c: "テーマA" },
  ];
  return (
    <Screen active="journal" title="日次ジャーナル — 11/27 (木)"
      topRight={<button className="sk-btn sk-btn-primary">保存して明日を準備 →</button>}>
      <div className="row gap-16" style={{ height: "100%" }}>
        {/* left: today summary + 今日のひとこと */}
        <div className="col gap-16" style={{ flex: "1" }}>
          <section>
            <h2 className="hand t-22" style={{ margin: 0, marginBottom: 8 }}>
              <span className="sk-hl-accent">① 今日のひとこと</span>
            </h2>
            <div className="hand t-13 muted mb-8">軽い振り返り。長く書かなくてよい。</div>
            <div className="sk-lined sk-input" style={{ height: 120, background: "transparent", border: "1.5px solid var(--ink)" }}>
              <span className="muted">例: ヒアリング前の準備に時間がかかった。明日は朝イチで対応表を進める。</span>
            </div>
          </section>
          <section>
            <h2 className="hand t-22" style={{ margin: 0, marginBottom: 8 }}>今日完了したタスク</h2>
            <div className="col gap-6">
              {done.map((d, i) => (
                <div key={i} className="row aic gap-8 hand t-13" style={{ color: "var(--ink-3)" }}>
                  <span className="sk-check done" />
                  <span style={{ textDecoration: "line-through" }}>{d.t}</span>
                  <Cat name={d.c} />
                </div>
              ))}
            </div>
            <div className="hand t-12 muted mt-8">3件完了 ✓</div>
          </section>
          <div className="sk-stick" style={{ maxWidth: 360 }}>
            日次ジャーナルでは、棚卸しはしない。<br />
            それは週次レビューで！
          </div>
        </div>

        {/* right: tomorrow's tasks selection */}
        <div className="col gap-12" style={{ flex: "1.2", borderLeft: "1.5px dashed var(--ink-3)", paddingLeft: 16 }}>
          <h2 className="hand t-22" style={{ margin: 0 }}>
            <span className="sk-hl-accent">② 明日やること を選ぶ</span>
          </h2>
          <div className="hand t-13 muted">未完了タスクから、明日(11/28) に取り組むものを選ぶ。<br />選んだものは翌朝ホームの「今日やること」に表示される。</div>
          <div className="col gap-6 f1" style={{ overflow: "auto" }}>
            {undone.map((u, i) => (
              <div key={i} className="sk-card row aic gap-8"
                style={{
                  background: u.sel ? "var(--accent-soft)" : "var(--paper)",
                  borderColor: u.sel ? "var(--accent)" : "var(--ink)",
                  borderWidth: u.sel ? 2 : 1.5,
                }}>
                <span className={"sk-check" + (u.sel ? " done" : "")} />
                <div className="f1 col gap-4">
                  <span className="hand t-13">{u.t}</span>
                  <div className="row aic gap-6">
                    <Cat name={u.c} />
                    {u.p && <span className="hand t-11 muted">▸ {u.p}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="row aic between sk-card" style={{ background: "var(--paper-2)" }}>
            <span className="hand t-13">選択中: <span className="bold">3 件</span></span>
            <span className="hand t-12 muted">→ 翌朝ホームに表示</span>
          </div>
        </div>
      </div>
    </Screen>
  );
}

function ReviewScreen() {
  const steps = [
    { n: 1, t: "Inbox を全件整理", c: 7, done: false, hint: "未整理項目を タスク / プロジェクト / Someday / 削除 へ振り分ける" },
    { n: 2, t: "進行中プロジェクトを確認", c: 4, done: false, hint: "Next Action が無いものを発見する" },
    { n: 3, t: "未完了タスクを確認", c: 18, done: false, hint: "古すぎるもの・放置中のものを整理" },
    { n: 4, t: "待ちタスクを確認", c: 2, done: false, hint: "確認予定日切れ / 催促タイミング" },
    { n: 5, t: "Someday を見直す", c: 6, done: false, hint: "タスク化 / 継続 / 削除 を判断" },
    { n: 6, t: "来週の重点プロジェクトを決める", c: null, done: false, hint: "1-2 個に絞る" },
  ];
  const activeStep = 2;
  return (
    <Screen active="review" title="週次レビュー — 第48週"
      topRight={<>
        <span className="hand t-13 muted">進捗 1 / 6</span>
        <button className="sk-btn sk-btn-ghost">一時保存</button>
        <button className="sk-btn sk-btn-primary">完了</button>
      </>}>
      <div className="row gap-16" style={{ height: "100%" }}>
        {/* left: step list */}
        <div className="col gap-8" style={{ width: 300 }}>
          <div className="hand t-13 muted">ステップ</div>
          {steps.map((s) => {
            const isActive = s.n === activeStep;
            const isDone = s.n < activeStep;
            return (
              <div key={s.n} className="sk-card row aic gap-10"
                style={{
                  background: isActive ? "var(--accent-soft)" : (isDone ? "var(--paper-2)" : "var(--paper)"),
                  borderColor: isActive ? "var(--accent)" : "var(--ink)",
                  borderWidth: isActive ? 2 : 1.5,
                }}>
                <span className={"sk-check" + (isDone ? " done" : "")} />
                <span className="hand t-13 f1" style={{ color: isDone ? "var(--ink-3)" : "var(--ink)", textDecoration: isDone ? "line-through" : "none" }}>
                  {s.n}. {s.t}
                </span>
                {s.c !== null && <span className="sk-chip" style={{ fontSize: 10 }}>{s.c}</span>}
              </div>
            );
          })}
          <div className="sk-stick mt-12">
            毎週1回でOK。<br />全部やろうとしすぎない。
          </div>
        </div>

        {/* right: current step content */}
        <div className="col gap-12 f1" style={{ overflow: "hidden" }}>
          <div className="row aic gap-10">
            <span className="hand t-28 bold">② 進行中プロジェクトを確認</span>
          </div>
          <div className="hand t-13 muted">各プロジェクトに「次にやること(Next Action)」が登録されているかを確認する。</div>
          <div className="col gap-8 f1" style={{ overflow: "auto" }}>
            {[
              { n: "年間計画化", c: "テーマA", na: "ヒアリング項目をまとめる", ok: true },
              { n: "新PCセットアップ", c: "テーマB", na: "BIOS バージョン確認", ok: true },
              { n: "四半期報告書作成", c: "事務", na: null, ok: false },
              { n: "AIモデル影響確認", c: "テーマB", na: null, ok: false },
            ].map((p, i) => (
              <div key={i} className="sk-card col gap-6">
                <div className="row aic between">
                  <div className="row aic gap-8">
                    <span className="hand t-15 bold">▸ {p.n}</span>
                    <Cat name={p.c} />
                  </div>
                  {p.ok
                    ? <span className="sk-chip" style={{ background: "#e0f0e0" }}>✓ Next Action あり</span>
                    : <span className="sk-chip accent">⚠ Next Action 未設定</span>}
                </div>
                {p.na
                  ? <div className="hand t-13 muted">→ {p.na}</div>
                  : <div className="row aic gap-8">
                      <input className="f1 sk-input" placeholder="次にやることを入力…" style={{ fontSize: 13 }} />
                      <button className="sk-btn sk-btn-primary t-12">追加</button>
                    </div>}
              </div>
            ))}
          </div>
          <div className="row gap-8 jce">
            <button className="sk-btn sk-btn-ghost">← 前へ</button>
            <button className="sk-btn sk-btn-primary">次へ →</button>
          </div>
        </div>
      </div>
    </Screen>
  );
}

function SettingsScreen() {
  return (
    <Screen active="settings" title="設定 — カテゴリ管理"
      topRight={<button className="sk-btn sk-btn-primary">＋ カテゴリを追加</button>}>
      <div className="row gap-16" style={{ height: "100%" }}>
        <aside style={{ width: 180 }} className="col gap-4">
          <div className="sk-card hand t-13 bold" style={{ background: "var(--accent-soft)", borderColor: "var(--accent)" }}>カテゴリ管理</div>
          <div className="hand t-13 muted" style={{ padding: "6px 12px" }}>表示設定（後で）</div>
          <div className="hand t-13 muted" style={{ padding: "6px 12px" }}>バックアップ（後で）</div>
          <div className="hand t-13 muted" style={{ padding: "6px 12px" }}>データエクスポート（後で）</div>
        </aside>

        <div className="col gap-12 f1">
          <div className="hand t-13 muted">ドラッグで並び替え。非表示にすると一覧から消えるが、過去のデータは残ります。</div>
          <div className="sk-card" style={{ padding: 0 }}>
            <div className="row" style={{ borderBottom: "1.5px solid var(--ink)", padding: "8px 12px", background: "var(--paper-2)" }}>
              <div style={{ width: 22 }} />
              <div className="hand t-12 muted" style={{ width: 160 }}>カテゴリ名</div>
              <div className="hand t-12 muted f1">説明</div>
              <div className="hand t-12 muted" style={{ width: 80, textAlign: "center" }}>表示</div>
              <div className="hand t-12 muted" style={{ width: 80, textAlign: "center" }}>件数</div>
              <div style={{ width: 60 }} />
            </div>
            {[
              { n: "テーマA", desc: "現業の主担当領域", on: true, c: 12 },
              { n: "テーマB", desc: "新PC・AI関連の検証", on: true, c: 8 },
              { n: "事務", desc: "報告書・各種事務作業", on: true, c: 5 },
              { n: "個人開発", desc: "夜に進める自主プロジェクト", on: true, c: 3 },
              { n: "副業準備", desc: "副業に向けた準備", on: true, c: 2 },
              { n: "旧プロジェクトX", desc: "(完了したテーマ)", on: false, c: 24 },
            ].map((r, i) => (
              <div key={i} className="row aic" style={{ borderBottom: "1px dashed var(--ink-4)", padding: "10px 12px", opacity: r.on ? 1 : 0.5 }}>
                <div style={{ width: 22 }} className="mono muted">⋮⋮</div>
                <div style={{ width: 160 }} className="hand t-14 bold">{r.n}</div>
                <div className="f1 hand t-13 muted">{r.desc}</div>
                <div style={{ width: 80, textAlign: "center" }}>
                  <div className="sk-chip" style={{ background: r.on ? "var(--paper)" : "var(--paper-2)" }}>
                    {r.on ? "● ON" : "○ OFF"}
                  </div>
                </div>
                <div style={{ width: 80, textAlign: "center" }} className="hand t-13 muted">{r.c}</div>
                <div style={{ width: 60 }} className="hand t-13 muted tr">編集</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Screen>
  );
}

Object.assign(window, { JournalScreen, ReviewScreen, SettingsScreen });
