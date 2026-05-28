// Memo list + Memo edit (multiple format-switch variants)

const MEMO_KINDS = ["議事録", "TTメモ", "思いつきメモ", "調査メモ", "作業ログ"];

const SAMPLE_MEMOS = [
  { d: "11/26", t: "週次定例MTG", k: "議事録", c: "テーマA", p: "年間計画化" },
  { d: "11/26", t: "Next.js App Router の挙動", k: "調査メモ", c: "個人開発" },
  { d: "11/25", t: "ヒアリングのコツ（Aさん談）", k: "TTメモ", c: "テーマA" },
  { d: "11/25", t: "PC移行作業の作業ログ", k: "作業ログ", c: "テーマB", p: "新PCセットアップ" },
  { d: "11/24", t: "報告書テンプレ改善の思いつき", k: "思いつきメモ", c: "事務" },
  { d: "11/22", t: "Bさんからのレビュー観点", k: "TTメモ", c: "テーマA" },
  { d: "11/21", t: "AI連携の設計メモ", k: "思いつきメモ", c: "個人開発" },
];

function MemosScreen() {
  return (
    <Screen active="memos" title="メモ"
      topRight={<button className="sk-btn sk-btn-primary">＋ メモを書く</button>}>
      <div className="col gap-12" style={{ height: "100%" }}>
        {/* search row */}
        <div className="sk-card row aic gap-10" style={{ padding: "10px 12px" }}>
          <span className="hand">🔍</span>
          <input className="f1" placeholder="キーワード検索…" style={{ border: "none", outline: "none", background: "transparent", fontFamily: "var(--hand)", fontSize: 14 }} />
        </div>
        <div className="row aic gap-6 fwrap">
          <span className="hand t-13 muted">種別:</span>
          <span className="sk-chip solid">すべて</span>
          {MEMO_KINDS.map(k => <span key={k} className="sk-chip">{k}</span>)}
          <span style={{ width: 10 }} />
          <span className="hand t-13 muted">カテゴリ:</span>
          <span className="sk-chip">すべて▾</span>
          <span className="hand t-13 muted">期間:</span>
          <span className="sk-chip">今月</span>
        </div>

        {/* timeline list */}
        <div className="row gap-16 f1" style={{ overflow: "hidden" }}>
          <div className="col f1 gap-12" style={{ overflow: "auto" }}>
            {SAMPLE_MEMOS.map((m, i) => (
              <div key={i} className="row gap-12">
                <div className="col aic" style={{ width: 56 }}>
                  <div className="mono t-11 muted">{m.d}</div>
                  <div style={{ width: 1, flex: 1, background: "var(--ink-4)", marginTop: 4 }} />
                </div>
                <div className="sk-card col gap-6 f1" style={{ padding: 12 }}>
                  <div className="row aic between">
                    <span className="hand t-15 bold">{m.t}</span>
                    <span className="sk-chip">{m.k}</span>
                  </div>
                  <div className="row aic gap-6">
                    <Cat name={m.c} />
                    {m.p && <span className="hand t-11 muted">▸ {m.p}</span>}
                  </div>
                  <div className="hand t-12 muted" style={{ borderTop: "1px dashed var(--ink-4)", paddingTop: 6, marginTop: 2 }}>
                    <span className="sk-ph" style={{ display: "inline-block", width: 220, height: 9, marginRight: 6 }} />
                    <span className="sk-ph" style={{ display: "inline-block", width: 180, height: 9 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* right: groupings */}
          <div className="col gap-12" style={{ width: 220 }}>
            <div className="sk-card">
              <div className="hand t-14 bold mb-8">種別ごと</div>
              <div className="col gap-4 t-12 hand">
                {MEMO_KINDS.map(k => (
                  <div key={k} className="row between"><span>{k}</span><span className="muted">{Math.floor(Math.random()*9)+1}</span></div>
                ))}
              </div>
            </div>
            <div className="sk-card">
              <div className="hand t-14 bold mb-8">カテゴリごと</div>
              <div className="col gap-4 t-12 hand">
                {CATEGORIES.map(c => (
                  <div key={c.name} className="row between"><span>{c.name}</span><span className="muted">{c.count}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Screen>
  );
}

// ----- Memo edit with format switching — three variants -----

function MemoBody({ kind }) {
  // Field set per kind
  const fields = {
    "議事録": [
      { l: "日時", v: "11/27 14:00 - 15:00", inline: true },
      { l: "参加者", v: "Aさん, Bさん, Cさん, 自分", inline: true },
      { l: "目的", v: "" },
      { l: "議題" },
      { l: "決定事項" },
      { l: "宿題" },
      { l: "自分のNext Action" },
    ],
    "TTメモ": [
      { l: "誰から", v: "Aさん", inline: true },
      { l: "背景" },
      { l: "教えてもらった内容" },
      { l: "ファクト", k: "F" },
      { l: "抽象化", k: "A" },
      { l: "転用", k: "T" },
    ],
    "思いつきメモ": [
      { l: "内容" },
      { l: "ファクト", k: "F" },
      { l: "抽象化", k: "A" },
      { l: "転用", k: "T" },
      { l: "タスク化候補", v: "□ ・・・", inline: true },
      { l: "Someday候補", v: "□ ・・・", inline: true },
    ],
    "調査メモ": [
      { l: "調査テーマ", inline: true },
      { l: "調査内容" },
      { l: "分かったこと" },
      { l: "結論" },
      { l: "次に確認すること" },
    ],
    "作業ログ": [
      { l: "作業内容" },
      { l: "結果" },
      { l: "詰まった点" },
      { l: "対応内容" },
      { l: "次にやること" },
    ],
  }[kind] || [];

  return (
    <div className="col gap-10">
      {fields.map((f, i) => (
        <div key={i}>
          <div className="row aic gap-6 mb-4">
            {f.k && <span className="sk-chip accent" style={{ fontSize: 10 }}>{f.k}</span>}
            <span className="hand t-13 bold">{f.l}</span>
          </div>
          {f.inline
            ? <div className="sk-input" style={{ background: "#fff" }}>{f.v || <span className="muted">入力…</span>}</div>
            : <div className="sk-lined sk-input" style={{ height: 72, background: "transparent", border: "1.5px solid var(--ink)" }}>
                <span className="muted">{f.v || "ここに本文…"}</span>
              </div>}
        </div>
      ))}
    </div>
  );
}

function MemoEditCommon({ kind, children }) {
  return (
    <Screen active="memos" title="メモを書く"
      topRight={<>
        <button className="sk-btn sk-btn-ghost">下書き保存</button>
        <button className="sk-btn sk-btn-primary">保存</button>
      </>}>
      <div className="col gap-12" style={{ height: "100%" }}>
        <input className="sk-input" defaultValue="" placeholder="メモのタイトル…" style={{ fontSize: 22, fontFamily: "var(--hand)" }} />
        <div className="row gap-8 fwrap aic">
          <span className="hand t-13 muted">カテゴリ:</span>
          <span className="sk-chip">テーマA ▾</span>
          <span className="hand t-13 muted">関連プロジェクト:</span>
          <span className="sk-chip muted">なし ▾</span>
        </div>
        {/* variant-specific kind switcher */}
        {children}
        <div className="f1" style={{ overflow: "auto" }}>
          <MemoBody kind={kind} />
        </div>
      </div>
    </Screen>
  );
}

// Variant A: tabs along the top
function MemoEditTabs() {
  const active = "議事録";
  return (
    <MemoEditCommon kind={active}>
      <div className="row" style={{ borderBottom: "1.5px solid var(--ink)" }}>
        {MEMO_KINDS.map(k => {
          const on = k === active;
          return (
            <div key={k} className="hand t-13" style={{
              padding: "8px 14px",
              borderBottom: on ? "3px solid var(--accent)" : "none",
              background: on ? "var(--paper)" : "transparent",
              fontWeight: on ? 700 : 400,
              color: on ? "var(--ink)" : "var(--ink-3)",
              cursor: "pointer",
              marginBottom: -1.5,
            }}>{k}</div>
          );
        })}
      </div>
    </MemoEditCommon>
  );
}

// Variant B: dropdown selector → form swaps below
function MemoEditDropdown() {
  return (
    <MemoEditCommon kind="TTメモ">
      <div className="row aic gap-10">
        <span className="hand t-14 bold">メモ種別:</span>
        <div className="sk-input row aic between" style={{ width: 240, background: "#fff" }}>
          <span className="hand">TTメモ</span>
          <span className="muted">▾</span>
        </div>
        <span className="hand t-12 muted">↑ 種別を変えると入力フォーマットが切り替わります</span>
      </div>
    </MemoEditCommon>
  );
}

// Variant C: card pickers (visual choice up front, then form below)
function MemoEditCards() {
  const active = "調査メモ";
  return (
    <MemoEditCommon kind={active}>
      <div>
        <div className="hand t-13 muted mb-8">どんなメモを書きますか？</div>
        <div className="row gap-8 fwrap">
          {MEMO_KINDS.map(k => {
            const on = k === active;
            return (
              <div key={k} className="sk-card hand col aic gap-4"
                style={{ width: 110, padding: "12px 8px", textAlign: "center",
                  background: on ? "var(--accent-soft)" : "var(--paper)",
                  borderColor: on ? "var(--accent)" : "var(--ink)",
                  borderWidth: on ? 2 : 1.5,
                }}>
                <span style={{ fontSize: 22 }}>{ {"議事録":"📋","TTメモ":"💡","思いつきメモ":"✨","調査メモ":"🔍","作業ログ":"⚙"}[k] }</span>
                <span className="t-13" style={{ fontWeight: on ? 700 : 400 }}>{k}</span>
              </div>
            );
          })}
        </div>
      </div>
    </MemoEditCommon>
  );
}

Object.assign(window, { MemosScreen, MemoEditTabs, MemoEditDropdown, MemoEditCards });
