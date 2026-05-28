// Shared sketch primitives — sidebar, topbar, small UI shapes

const NAV_ITEMS = [
  { key: "home", label: "ホーム", icon: "▦" },
  { key: "inbox", label: "Inbox", icon: "✉", badge: 7 },
  { key: "tasks", label: "タスク", icon: "✓" },
  { key: "projects", label: "プロジェクト", icon: "◷" },
  { key: "memos", label: "メモ", icon: "✎" },
  { key: "journal", label: "日次ジャーナル", icon: "☾" },
  { key: "review", label: "週次レビュー", icon: "↻" },
  { key: "settings", label: "設定", icon: "⚙" },
];

const CATEGORIES = [
  { name: "テーマA", count: 12 },
  { name: "テーマB", count: 8 },
  { name: "事務", count: 5 },
  { name: "個人開発", count: 3 },
  { name: "副業準備", count: 2 },
];

function Sidebar({ active = "home", width = 200 }) {
  return (
    <aside style={{
      width, flex: `0 0 ${width}px`,
      borderRight: "1.5px solid var(--ink)",
      background: "var(--paper-2)",
      padding: "18px 14px",
      display: "flex", flexDirection: "column", gap: 18,
    }}>
      <div style={{ fontFamily: "var(--hand)", fontSize: 20, fontWeight: 700, letterSpacing: ".02em" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 14, color: "var(--ink-3)" }}>{"//"}</span>{" "}
        work-board
      </div>
      <nav className="col gap-4">
        {NAV_ITEMS.map(it => {
          const on = it.key === active;
          return (
            <div key={it.key} className="row aic gap-8"
              style={{
                padding: "6px 8px",
                borderRadius: 4,
                background: on ? "var(--paper)" : "transparent",
                border: on ? "1.5px solid var(--ink)" : "1.5px solid transparent",
                filter: on ? "url(#sketchy)" : "none",
                position: "relative",
              }}>
              <span style={{ fontFamily: "var(--mono)", width: 14, textAlign: "center", color: on ? "var(--accent)" : "var(--ink-2)" }}>{it.icon}</span>
              <span className="hand t-14 f1" style={{ color: on ? "var(--ink)" : "var(--ink-2)", fontWeight: on ? 700 : 400 }}>
                {on ? <span className="sk-squig">{it.label}</span> : it.label}
              </span>
              {it.badge ? <span className="sk-chip accent" style={{ fontSize: 10, padding: "1px 6px" }}>{it.badge}</span> : null}
            </div>
          );
        })}
      </nav>
      <div className="sk-div-dash" />
      <div>
        <div className="mono t-12 muted" style={{ letterSpacing: ".08em", marginBottom: 8 }}>CATEGORIES</div>
        <div className="col gap-6">
          {CATEGORIES.map(c => (
            <div key={c.name} className="row aic between" style={{ padding: "2px 4px" }}>
              <span className="hand t-13">▸ {c.name}</span>
              <span className="hand t-12 muted">{c.count}</span>
            </div>
          ))}
          <div className="hand t-12 muted" style={{ padding: "2px 4px" }}>＋ カテゴリを追加</div>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ title, right }) {
  return (
    <div className="row aic between" style={{
      padding: "14px 24px",
      borderBottom: "1.5px solid var(--ink)",
      background: "var(--paper)",
    }}>
      <div className="row aic gap-12">
        <h1 style={{ margin: 0, fontFamily: "var(--hand)", fontSize: 26, fontWeight: 700 }}>
          <span className="sk-hl">{title}</span>
        </h1>
      </div>
      <div className="row aic gap-10">
        {right}
        <div className="sk-input" style={{ width: 220, fontSize: 12 }}>🔍 検索…</div>
        <div className="sk-ph" style={{ width: 32, height: 32, borderRadius: "50%" }}>me</div>
      </div>
    </div>
  );
}

// Full screen scaffold — sidebar + topbar + content
function Screen({ active, title, topRight, children, sidebarWidth }) {
  return (
    <div className="row" style={{ width: "100%", height: "100%", background: "var(--paper)" }}>
      <Sidebar active={active} width={sidebarWidth} />
      <div className="col f1" style={{ overflow: "hidden" }}>
        <TopBar title={title} right={topRight} />
        <div className="f1" style={{ overflow: "hidden", padding: "20px 24px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Small chips
function Cat({ name, color }) {
  return <span className="sk-chip" style={{ background: color || "var(--paper)" }}>● {name}</span>;
}

function StatusChip({ s }) {
  const colors = {
    "未着手": { bg: "#fff", color: "var(--ink-2)" },
    "対応中": { bg: "#dcebff", color: "#2a4f8a" },
    "待ち": { bg: "#fde6dd", color: "#a8442a" },
    "保留": { bg: "#f0eee9", color: "var(--ink-3)" },
    "完了": { bg: "#e0e0e0", color: "var(--ink-3)" },
  };
  const c = colors[s] || colors["未着手"];
  return <span className="sk-chip" style={{ background: c.bg, color: c.color, borderColor: c.color }}>{s}</span>;
}

// SVG arrow doodle
function Arrow({ dir = "down", size = 16 }) {
  const path = dir === "down" ? "M8 1 V14 M3 9 L8 14 L13 9" : "M1 8 H14 M9 3 L14 8 L9 13";
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ flex: "0 0 auto" }}>
      <path d={path} stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

Object.assign(window, { Sidebar, TopBar, Screen, Cat, StatusChip, Arrow, NAV_ITEMS, CATEGORIES });
