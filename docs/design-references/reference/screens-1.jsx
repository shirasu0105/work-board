// Home + Inbox screens

function HomeScreen() {
  const todays = [
    { t: "〇〇さんへのヒアリング項目をまとめる", cat: "テーマA", proj: "年間計画化", due: "今日" },
    { t: "新PCの初期セットアップ完了報告書を書く", cat: "テーマB", proj: "新PCセットアップ" },
    { t: "四半期報告書のドラフトレビュー", cat: "事務", proj: "四半期報告書作成", due: "今日" },
    { t: "AIモデル学習影響の検証ログをまとめる", cat: "テーマB" },
  ];
  const waits = [
    { t: "対応表の確認回答", who: "Aさん", since: "3日", due: "明日" },
    { t: "計画資料レビュー", who: "Bさん", since: "5日", due: "今日" },
  ];
  return (
    <Screen active="home" title="今日 — 11/27 (木)" topRight={<button className="sk-btn sk-btn-primary">＋ クイック追加</button>}>
      <div className="row gap-16" style={{ height: "100%" }}>
        {/* Left: today + waiting */}
        <div className="col f1 gap-16" style={{ flex: "1.6" }}>
          <section>
            <div className="row aic between mb-12">
              <h2 className="hand t-22" style={{ margin: 0 }}>● 今日やること <span className="muted t-14">— 前日に選んだもの</span></h2>
              <span className="hand t-13 muted">{todays.length} 件</span>
            </div>
            <div className="col gap-8">
              {todays.map((it, i) => (
                <div key={i} className="sk-card row aic gap-10">
                  <span className="sk-check" />
                  <div className="f1 col gap-4">
                    <div className="hand t-14">{it.t}</div>
                    <div className="row aic gap-6 t-12 muted">
                      <Cat name={it.cat} />
                      {it.proj && <span className="hand">▸ {it.proj}</span>}
                      {it.due && <span className="sk-chip accent" style={{ fontSize: 10 }}>期限 {it.due}</span>}
                    </div>
                  </div>
                  <span className="muted mono t-12">⋯</span>
                </div>
              ))}
            </div>
          </section>
          <section>
            <div className="row aic between mb-12">
              <h2 className="hand t-22" style={{ margin: 0 }}>◐ 確認予定日を迎えた待ち</h2>
            </div>
            <div className="col gap-8">
              {waits.map((w, i) => (
                <div key={i} className="sk-card row aic gap-10" style={{ background: "#fff8f3" }}>
                  <span style={{ fontFamily: "var(--mono)", color: "var(--accent)" }}>⏳</span>
                  <div className="f1">
                    <div className="hand t-14">{w.t}</div>
                    <div className="t-12 muted hand">待ち相手: {w.who} ／ 待ち日数 {w.since} ／ 確認予定 {w.due}</div>
                  </div>
                  <button className="sk-btn sk-btn-ghost t-12">解除</button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right: inbox count, projects, memos, routines */}
        <div className="col gap-16" style={{ flex: "1", minWidth: 280 }}>
          <div className="sk-card row aic between" style={{ background: "var(--paper-2)" }}>
            <div>
              <div className="mono t-12 muted">INBOX 未整理</div>
              <div className="hand" style={{ fontSize: 36, lineHeight: 1.1, fontWeight: 700 }}>7<span className="muted t-16"> 件</span></div>
            </div>
            <button className="sk-btn">整理する →</button>
          </div>
          <section>
            <h3 className="hand t-18 mb-8" style={{ margin: 0, marginBottom: 8 }}>進行中プロジェクト</h3>
            <div className="col gap-6">
              {[
                { n: "年間計画化", c: "テーマA", p: 60 },
                { n: "新PCセットアップ", c: "テーマB", p: 80 },
                { n: "四半期報告書作成", c: "事務", p: 30 },
              ].map((p, i) => (
                <div key={i} className="sk-card">
                  <div className="row aic between">
                    <span className="hand t-13">▸ {p.n}</span>
                    <span className="t-11 muted hand">{p.p}%</span>
                  </div>
                  <div style={{ height: 6, background: "var(--paper-2)", border: "1px solid var(--ink-4)", marginTop: 4, borderRadius: 3, position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0, width: `${p.p}%`, background: "var(--ink)" }} />
                  </div>
                  <div className="t-11 muted hand" style={{ marginTop: 4 }}>{p.c}</div>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h3 className="hand t-18 mb-8" style={{ margin: 0, marginBottom: 8 }}>最近のメモ</h3>
            <div className="col gap-4">
              {[
                { t: "11/26 定例MTG", k: "議事録" },
                { t: "Next.js App Router の挙動", k: "調査メモ" },
                { t: "ヒアリングのコツ（Aさん談）", k: "TTメモ" },
              ].map((m, i) => (
                <div key={i} className="row aic between" style={{ padding: "6px 0", borderBottom: "1px dashed var(--ink-4)" }}>
                  <span className="hand t-13">{m.t}</span>
                  <span className="sk-chip muted" style={{ fontSize: 10 }}>{m.k}</span>
                </div>
              ))}
            </div>
          </section>
          <div className="row gap-8">
            <button className="sk-btn f1">☾ 日次ジャーナル</button>
            <button className="sk-btn f1">↻ 週次レビュー</button>
          </div>
        </div>
      </div>
    </Screen>
  );
}

// Inbox screen — quick-add pattern variations are shown as panel variant
function InboxScreen({ quickAddVariant = "topbar" }) {
  const items = [
    { t: "ヒアリング前に背景資料を確認", age: "今" },
    { t: "新PCの BIOS バージョン確認", age: "1h" },
    { t: "四半期報告書のテンプレ更新案", age: "3h" },
    { t: "Aさんに礼を伝える", age: "昨日" },
    { t: "Tailwind v4 を試す", age: "2日" },
    { t: "副業準備：契約形態のリサーチ", age: "3日" },
    { t: "AIモデル学習の社内ガイドライン読む", age: "5日" },
  ];

  const QuickAdd = () => {
    if (quickAddVariant === "topbar") {
      // A: 全画面共通のトップバー内クイック入力
      return (
        <div className="sk-card row aic gap-8" style={{ borderColor: "var(--accent)", borderWidth: 2, padding: "14px 16px" }}>
          <span className="hand t-16">＋</span>
          <input className="sk-input f1" placeholder="思いついたことをそのまま書く… ⏎で追加" style={{ filter: "none", border: "none", background: "transparent" }} />
          <span className="mono t-11 muted">⌘ + ⇧ + N</span>
          <button className="sk-btn sk-btn-primary">追加</button>
        </div>
      );
    }
    if (quickAddVariant === "fab") {
      return (
        <>
          <div className="sk-card hand t-13 muted" style={{ borderStyle: "dashed" }}>右下のフローティング＋ボタンから素早く追加 →</div>
          <div style={{ position: "absolute", right: 32, bottom: 32, width: 64, height: 64, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, border: "2px solid var(--ink)", boxShadow: "3px 4px 0 rgba(0,0,0,.15)", filter: "url(#sketchy)" }}>＋</div>
        </>
      );
    }
    if (quickAddVariant === "palette") {
      return (
        <div className="sk-card" style={{ borderWidth: 2 }}>
          <div className="row aic between mb-8">
            <span className="mono t-11 muted">COMMAND PALETTE</span>
            <span className="mono t-11 muted">⌘K で起動</span>
          </div>
          <div className="sk-input" style={{ fontSize: 14, border: "none", borderBottom: "1.5px solid var(--ink)", borderRadius: 0, padding: "8px 4px" }}>{`> inbox 思いついたこと…`}</div>
          <div className="col gap-4 mt-8 t-12 hand">
            <div className="row aic between" style={{ background: "var(--paper-2)", padding: "4px 8px" }}><span>📥 Inboxに追加</span><span className="mono t-11 muted">⏎</span></div>
            <div className="row aic between" style={{ padding: "4px 8px" }}><span>✓ タスクとして追加</span><span className="mono t-11 muted">⌘T</span></div>
            <div className="row aic between" style={{ padding: "4px 8px" }}><span>✎ メモを作成</span><span className="mono t-11 muted">⌘M</span></div>
          </div>
        </div>
      );
    }
    // inline-only
    return (
      <div className="sk-input row aic gap-8" style={{ background: "var(--paper-2)" }}>
        <span className="hand">＋</span>
        <span className="muted">Inbox に追加…</span>
      </div>
    );
  };

  return (
    <Screen active="inbox" title="Inbox" topRight={<span className="hand muted t-13">未整理 {items.length} 件</span>}>
      <div className="col gap-16" style={{ height: "100%", position: "relative" }}>
        <QuickAdd />

        <div className="row aic gap-8 fwrap">
          <span className="hand t-13 muted">整理:</span>
          <span className="sk-chip solid">すべて</span>
          <span className="sk-chip">古い順</span>
          <span className="sk-chip">新しい順</span>
          <div className="f1" />
          <button className="sk-btn sk-btn-ghost">一括整理モード</button>
        </div>

        <div className="col gap-6 f1" style={{ overflow: "auto" }}>
          {items.map((it, i) => (
            <div key={i} className="sk-card row aic gap-10">
              <span className="hand muted t-12" style={{ width: 36 }}>{it.age}</span>
              <span className="f1 hand t-14">{it.t}</span>
              <div className="row gap-4">
                <button className="sk-btn t-11" title="タスク化">✓ タスク</button>
                <button className="sk-btn t-11" title="プロジェクト化">◷ プロジェクト</button>
                <button className="sk-btn t-11" title="Someday">☾ Someday</button>
                <button className="sk-btn sk-btn-ghost t-11">✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}

Object.assign(window, { HomeScreen, InboxScreen });
