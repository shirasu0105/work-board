// Mobile variants — single column with bottom tab bar

const MOBILE_TABS = [
  { key: "home", label: "ホーム", icon: "▦" },
  { key: "inbox", label: "Inbox", icon: "✉" },
  { key: "add", label: "", icon: "＋", center: true },
  { key: "tasks", label: "タスク", icon: "✓" },
  { key: "memos", label: "メモ", icon: "✎" },
];

function MobileFrame({ active = "home", title, right, children, hideTopBar }) {
  return (
    <div className="col" style={{ width: "100%", height: "100%", background: "var(--paper)" }}>
      {/* status bar mock */}
      <div className="row aic between" style={{ padding: "8px 18px 4px", fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink)" }}>
        <span>9:41</span>
        <span>●●● ⌃</span>
      </div>
      {!hideTopBar && (
        <div className="row aic between" style={{ padding: "10px 16px", borderBottom: "1.5px solid var(--ink)" }}>
          <span className="hand t-22" style={{ fontWeight: 700 }}>
            <span className="sk-hl">{title}</span>
          </span>
          <div className="row gap-8">{right}</div>
        </div>
      )}
      <div className="f1" style={{ overflow: "auto", padding: 14 }}>{children}</div>
      {/* bottom tab bar */}
      <div className="row" style={{ borderTop: "1.5px solid var(--ink)", padding: "4px 0 10px", background: "var(--paper-2)" }}>
        {MOBILE_TABS.map(t => {
          const on = t.key === active;
          if (t.center) {
            return (
              <div key={t.key} className="f1 col aic" style={{ position: "relative" }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "var(--accent)", color: "#fff",
                  border: "1.8px solid var(--ink)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, marginTop: -16,
                  filter: "url(#sketchy)",
                  boxShadow: "2px 3px 0 rgba(0,0,0,.1)",
                }}>＋</div>
                <span className="mono" style={{ fontSize: 9, color: "var(--ink-3)", marginTop: 2 }}>QUICK</span>
              </div>
            );
          }
          return (
            <div key={t.key} className="f1 col aic gap-2" style={{ padding: "4px 0" }}>
              <span className="mono t-14" style={{ color: on ? "var(--accent)" : "var(--ink-2)" }}>{t.icon}</span>
              <span className="hand" style={{ fontSize: 10, color: on ? "var(--ink)" : "var(--ink-3)", fontWeight: on ? 700 : 400 }}>{t.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MobileHome() {
  return (
    <MobileFrame active="home" title="今日 11/27" right={<span className="hand t-12 muted">木</span>}>
      <div className="col gap-12">
        <div className="sk-card row aic between" style={{ background: "var(--paper-2)" }}>
          <span className="hand t-13 muted">Inbox 未整理</span>
          <span className="hand t-18 bold">7 →</span>
        </div>
        <div>
          <div className="row aic between mb-8">
            <span className="hand t-16 bold">● 今日やること</span>
            <span className="hand t-12 muted">4 件</span>
          </div>
          <div className="col gap-6">
            {[
              { t: "ヒアリング項目をまとめる", c: "テーマA", due: true },
              { t: "新PCセットアップ完了報告", c: "テーマB" },
              { t: "四半期報告書ドラフト", c: "事務", due: true },
              { t: "AIモデル検証ログ", c: "テーマB" },
            ].map((x, i) => (
              <div key={i} className="sk-card row aic gap-8">
                <span className="sk-check" />
                <div className="f1">
                  <div className="hand t-13">{x.t}</div>
                  <div className="row aic gap-4 mt-4">
                    <Cat name={x.c} />
                    {x.due && <span className="sk-chip accent" style={{ fontSize: 9 }}>期限 今日</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <span className="hand t-16 bold">◐ 待ち</span>
          <div className="sk-card mt-8">
            <div className="hand t-13">対応表の確認回答</div>
            <div className="hand t-11 muted">Aさん ／ 3日経過 ／ 確認 明日</div>
          </div>
        </div>
        <div className="row gap-8">
          <button className="sk-btn f1">☾ 日次ジャーナル</button>
        </div>
      </div>
    </MobileFrame>
  );
}

function MobileInbox() {
  return (
    <MobileFrame active="inbox" title="Inbox" right={<span className="hand t-12 muted">7件</span>}>
      <div className="col gap-12">
        <div className="sk-card row aic gap-6" style={{ borderColor: "var(--accent)", borderWidth: 2, padding: "10px 12px" }}>
          <span className="hand t-16">＋</span>
          <span className="hand t-13 muted f1">思いついたことを書く…</span>
          <span className="mono t-11 muted">⏎</span>
        </div>
        <div className="col gap-6">
          {[
            "ヒアリング前に背景資料を確認", "新PCの BIOS バージョン確認",
            "四半期報告書のテンプレ更新案", "Aさんに礼を伝える",
            "Tailwind v4 を試す", "副業準備：契約形態のリサーチ",
          ].map((t, i) => (
            <div key={i} className="sk-card col gap-6">
              <div className="hand t-13">{t}</div>
              <div className="row gap-4 fwrap">
                <button className="sk-btn t-11">✓ タスク</button>
                <button className="sk-btn t-11">◷ プロジェクト</button>
                <button className="sk-btn t-11">☾ Someday</button>
                <button className="sk-btn sk-btn-ghost t-11">✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileFrame>
  );
}

function MobileTasks() {
  return (
    <MobileFrame active="tasks" title="タスク" right={<span className="hand t-12 muted">▦</span>}>
      <div className="col gap-10">
        <div className="row gap-4 fwrap">
          <span className="sk-chip solid">未完了</span>
          <span className="sk-chip">対応中</span>
          <span className="sk-chip">待ち</span>
          <span className="sk-chip">期限あり</span>
        </div>
        {[
          { s: "対応中", items: [
            { t: "計画資料の構成案", c: "テーマA", p: "年間計画化", d: "11/29" },
            { t: "四半期報告書の数値集計", c: "事務", d: "12/01" },
          ]},
          { s: "未着手", items: [
            { t: "ヒアリング項目をまとめる", c: "テーマA", d: "11/28" },
            { t: "新PCのBIOS確認", c: "テーマB" },
            { t: "対応表の初稿", c: "テーマA" },
          ]},
          { s: "待ち", items: [
            { t: "対応表の確認回答待ち", c: "テーマA", who: "Aさん(3日)" },
          ]},
        ].map((g, gi) => (
          <div key={gi}>
            <div className="row aic gap-6 mb-6">
              <StatusChip s={g.s} />
              <span className="hand t-11 muted">{g.items.length}</span>
            </div>
            <div className="col gap-6">
              {g.items.map((t, i) => (
                <div key={i} className="sk-card row aic gap-8">
                  <span className="sk-check" />
                  <div className="f1">
                    <div className="hand t-13">{t.t}</div>
                    <div className="row aic gap-4 mt-4 fwrap">
                      <Cat name={t.c} />
                      {t.p && <span className="hand t-10 muted">▸ {t.p}</span>}
                      {t.d && <span className="sk-chip" style={{ fontSize: 9 }}>📅 {t.d}</span>}
                      {t.who && <span className="sk-chip accent" style={{ fontSize: 9 }}>{t.who}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </MobileFrame>
  );
}

function MobileMemoNew() {
  return (
    <MobileFrame active="memos" title="メモを書く" right={<span className="hand t-12 bold">保存</span>}>
      <div className="col gap-10">
        {/* horizontal scroll kind picker */}
        <div className="row gap-6 fwrap">
          {MEMO_KINDS.map((k, i) => (
            <div key={k} className="sk-card hand t-12"
              style={{ padding: "6px 10px", background: i === 0 ? "var(--accent-soft)" : "var(--paper)", borderColor: i === 0 ? "var(--accent)" : "var(--ink)" }}>
              {k}
            </div>
          ))}
        </div>
        <input className="sk-input" placeholder="会議名…" style={{ fontFamily: "var(--hand)", fontSize: 18 }} />
        <div className="row gap-6">
          <span className="sk-chip">テーマA ▾</span>
          <span className="sk-chip muted">プロジェクト ▾</span>
        </div>
        {[
          { l: "日時", v: "11/27 14:00" },
          { l: "参加者", v: "Aさん, Bさん…" },
          { l: "目的" }, { l: "議題" }, { l: "決定事項" }, { l: "宿題" }, { l: "Next Action" },
        ].map((f, i) => (
          <div key={i}>
            <div className="hand t-12 bold mb-4">{f.l}</div>
            <div className="sk-input" style={{ background: "#fff", fontSize: 13 }}>{f.v || <span className="muted">入力…</span>}</div>
          </div>
        ))}
      </div>
    </MobileFrame>
  );
}

function MobileJournal() {
  return (
    <MobileFrame active="home" title="日次ジャーナル" right={<span className="hand t-12 muted">11/27</span>}>
      <div className="col gap-12">
        <div>
          <div className="hand t-14 bold mb-6"><span className="sk-hl-accent">① 今日のひとこと</span></div>
          <div className="sk-lined sk-input" style={{ height: 80, background: "transparent" }}>
            <span className="muted">例: ヒアリング準備に時間がかかった…</span>
          </div>
        </div>
        <div>
          <div className="hand t-14 bold mb-6"><span className="sk-hl-accent">② 明日やること</span></div>
          <div className="hand t-11 muted mb-6">未完了から選ぶ（タップで選択）</div>
          <div className="col gap-6">
            {[
              { t: "ヒアリング項目をまとめる", c: "テーマA", sel: true },
              { t: "対応表の初稿を書く", c: "テーマA", sel: true },
              { t: "新PCのBIOS確認", c: "テーマB" },
              { t: "四半期報告書の数値集計", c: "事務", sel: true },
              { t: "Tailwind v4 試用記録", c: "個人開発" },
              { t: "Aさんに礼を伝える", c: "テーマA" },
            ].map((u, i) => (
              <div key={i} className="sk-card row aic gap-8"
                style={{ background: u.sel ? "var(--accent-soft)" : "var(--paper)", borderColor: u.sel ? "var(--accent)" : "var(--ink)" }}>
                <span className={"sk-check" + (u.sel ? " done" : "")} />
                <div className="f1">
                  <div className="hand t-13">{u.t}</div>
                  <Cat name={u.c} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <button className="sk-btn sk-btn-primary">保存して明日を準備 →</button>
      </div>
    </MobileFrame>
  );
}

Object.assign(window, { MobileHome, MobileInbox, MobileTasks, MobileMemoNew, MobileJournal });
