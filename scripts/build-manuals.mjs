#!/usr/bin/env node
// .harness/manuals/*.md を docs/manuals/*.html に変換する。
// Notion 風のミニマルな読み物デザイン。
// 依存ゼロ（最小 MD→HTML コンバータ内蔵、Tailwind 等の外部 CSS フレームワークも不要）。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const SRC_DIR = path.join(ROOT, '.harness', 'manuals');
const DST_DIR = path.join(ROOT, 'docs', 'manuals');

const MANUALS = [
  { slug: 'developer-guide', title: '開発運用ガイド', emoji: '⚙️', subtitle: 'python-manager' },
  { slug: 'user-guide', title: '使い方ガイド', emoji: '📖', subtitle: 'python-manager' },
];

// ---- Minimal MD → HTML converter -------------------------------------------

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80) || 'section';
}

function renderInline(text) {
  let s = escapeHtml(text);
  // inline code first (insulates from other inline rules)
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  // links
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => `<a href="${u}">${t}</a>`);
  // bold
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // italic (avoid hitting **)
  s = s.replace(/(^|[^*])\*([^*\s][^*]*[^*\s]|[^*\s])\*(?!\*)/g, '$1<em>$2</em>');
  return s;
}

function mdToHtml(md, headings) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;
  const usedSlugs = new Map();

  function uniqueSlug(base) {
    const n = (usedSlugs.get(base) || 0) + 1;
    usedSlugs.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  }

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      out.push(
        `<div class="code-block"><div class="code-block-head"><span class="code-lang">${escapeHtml(lang || 'text')}</span><button class="code-copy" type="button" aria-label="copy">copy</button></div><pre><code data-lang="${escapeHtml(lang)}">${escapeHtml(buf.join('\n'))}</code></pre></div>`,
      );
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const slug = uniqueSlug(slugify(text));
      headings.push({ level, text, slug });
      // Render h1 only on page if it's the very first content line; else as h1
      out.push(`<h${level} id="${slug}"><a class="anchor" href="#${slug}" aria-hidden="true">#</a>${renderInline(text)}</h${level}>`);
      i++;
      continue;
    }

    // Table
    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
      const headerCells = splitTableRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      out.push(renderTable(headerCells, rows));
      continue;
    }

    // Blockquote (treat as Notion-style callout)
    if (line.startsWith('> ')) {
      const buf = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        buf.push(lines[i].slice(2));
        i++;
      }
      out.push(`<aside class="callout"><div class="callout-icon" aria-hidden="true">💡</div><div class="callout-body">${renderInline(buf.join(' '))}</div></aside>`);
      continue;
    }

    // Unordered list
    if (/^\s*-\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*-\s+/, ''));
        i++;
      }
      out.push(`<ul>${items.map((it) => `<li>${renderInline(it)}</li>`).join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      out.push(`<ol>${items.map((it) => `<li>${renderInline(it)}</li>`).join('')}</ol>`);
      continue;
    }

    // Horizontal rule
    if (/^\s*---\s*$/.test(line)) {
      out.push('<hr />');
      i++;
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== '' && !isBlockStart(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    out.push(`<p>${renderInline(buf.join(' '))}</p>`);
  }

  return out.join('\n');
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

function renderTable(headerCells, rows) {
  const thead = `<thead><tr>${headerCells.map((c) => `<th>${renderInline(c)}</th>`).join('')}</tr></thead>`;
  const tbody = `<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
  return `<div class="table-wrap"><table>${thead}${tbody}</table></div>`;
}

function isBlockStart(line) {
  if (line.startsWith('```')) return true;
  if (/^#{1,6}\s+/.test(line)) return true;
  if (/^\s*-\s+/.test(line)) return true;
  if (/^\s*\d+\.\s+/.test(line)) return true;
  if (line.startsWith('> ')) return true;
  if (/^\s*---\s*$/.test(line)) return true;
  if (line.includes('|')) return true;
  return false;
}

// ---- TOC -------------------------------------------------------------------

function renderToc(headings) {
  // Skip the first h1 (page title we hoist into the header)
  const items = headings.filter((h) => h.level >= 2 && h.level <= 3);
  if (items.length === 0) return '';
  const lis = items
    .map((h) => {
      const cls = h.level === 3 ? 'toc-item toc-l3' : 'toc-item toc-l2';
      return `<li class="${cls}"><a href="#${h.slug}" data-target="${h.slug}">${escapeHtml(h.text)}</a></li>`;
    })
    .join('');
  return `<nav class="toc" aria-label="目次">
    <div class="toc-title">On this page</div>
    <ul>${lis}</ul>
  </nav>`;
}

// ---- Page wrapper ----------------------------------------------------------

function wrapPage(meta, contentHtml, tocHtml, generatedAt) {
  const css = pageCss();
  const js = pageJs();
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(meta.title)} — ${escapeHtml(meta.subtitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+JP:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>${css}</style>
</head>
<body>
  <header class="topbar">
    <div class="topbar-inner">
      <a class="brand" href="./user-guide.html">
        <span class="brand-mark">📦</span>
        <span class="brand-name">python-manager</span>
        <span class="brand-divider">/</span>
        <span class="brand-section">docs</span>
      </a>
      <nav class="topnav">
        <a href="./user-guide.html">使い方ガイド</a>
        <a href="./developer-guide.html">開発運用ガイド</a>
      </nav>
    </div>
  </header>

  <div class="layout">
    <main class="content">
      <article>
        <header class="page-header">
          <div class="page-emoji">${meta.emoji}</div>
          <h1 class="page-title">${escapeHtml(meta.title)}</h1>
          <p class="page-meta">${escapeHtml(meta.subtitle)} · 最終更新 ${generatedAt}</p>
        </header>
        ${contentHtml}
      </article>
    </main>
    <aside class="sidebar">${tocHtml}</aside>
  </div>

  <footer class="footer">
    <div class="footer-inner">
      Generated by <code>scripts/build-manuals.mjs</code> · 編集元 <code>.harness/manuals/</code> · 再生成 <code>npm run build:manuals</code>
    </div>
  </footer>

  <script>${js}</script>
</body>
</html>
`;
}

function pageCss() {
  return `
:root {
  --bg: #FBFBFA;
  --surface: #FFFFFF;
  --text: #37352F;
  --text-muted: #6F6E69;
  --text-subtle: #9B9A97;
  --border: #E9E9E7;
  --border-light: #F1F1EF;
  --hover: #F4F4F2;
  --code-bg: #F4F2EE;
  --code-text: #B05E5E;
  --accent: #2E72D2;
  --accent-soft: #DCE9F8;
  --pre-bg: #2F3437;
  --pre-text: #E8E8E6;
  --pre-comment: #8B928F;
  --callout-bg: #FBF9F4;
  --callout-border: #E9D9B6;
  --table-row-hover: #FAF9F7;
  --shadow: 0 1px 2px rgba(15, 15, 15, 0.04), 0 4px 12px rgba(15, 15, 15, 0.04);
  --radius: 6px;
  --radius-lg: 10px;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; scroll-padding-top: 84px; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 15.5px;
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* ----- Topbar ----- */
.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(251, 251, 250, 0.85);
  backdrop-filter: saturate(180%) blur(8px);
  -webkit-backdrop-filter: saturate(180%) blur(8px);
  border-bottom: 1px solid var(--border-light);
}
.topbar-inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 12px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--text);
  font-weight: 600;
  font-size: 14px;
}
.brand-mark { font-size: 18px; }
.brand-divider { color: var(--text-subtle); font-weight: 400; margin: 0 2px; }
.brand-section { color: var(--text-muted); font-weight: 500; }
.topnav { display: flex; gap: 4px; }
.topnav a {
  padding: 6px 12px;
  font-size: 13.5px;
  color: var(--text-muted);
  text-decoration: none;
  border-radius: var(--radius);
  transition: background 0.15s, color 0.15s;
}
.topnav a:hover { background: var(--hover); color: var(--text); }

/* ----- Layout ----- */
.layout {
  max-width: 1080px;
  margin: 0 auto;
  padding: 32px 32px 64px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 232px;
  gap: 56px;
  align-items: start;
}
.content { min-width: 0; }
.sidebar { position: sticky; top: 84px; max-height: calc(100vh - 100px); overflow-y: auto; }
@media (max-width: 960px) {
  .layout { grid-template-columns: 1fr; gap: 0; padding: 24px 20px 48px; }
  .sidebar { display: none; }
}

/* ----- Page header ----- */
.page-header { margin-bottom: 28px; }
.page-emoji { font-size: 56px; line-height: 1; margin-bottom: 12px; }
.page-title {
  font-size: 40px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 8px;
  color: var(--text);
}
.page-meta {
  margin: 0;
  font-size: 13px;
  color: var(--text-subtle);
}

/* ----- Content typography ----- */
article { max-width: 760px; }
article h1, article h2, article h3, article h4, article h5, article h6 {
  position: relative;
  color: var(--text);
  letter-spacing: -0.01em;
  scroll-margin-top: 84px;
}
article h2 {
  font-size: 28px;
  font-weight: 700;
  margin: 44px 0 12px;
  padding-top: 8px;
}
article h3 {
  font-size: 21px;
  font-weight: 600;
  margin: 32px 0 10px;
}
article h4 {
  font-size: 17px;
  font-weight: 600;
  margin: 24px 0 8px;
}
article h5, article h6 {
  font-size: 15px;
  font-weight: 600;
  margin: 20px 0 6px;
  color: var(--text-muted);
}
article h2 .anchor, article h3 .anchor, article h4 .anchor {
  position: absolute;
  left: -1.2em;
  color: var(--text-subtle);
  text-decoration: none;
  font-weight: 400;
  opacity: 0;
  transition: opacity 0.15s;
}
article h2:hover .anchor, article h3:hover .anchor, article h4:hover .anchor { opacity: 0.5; }
article h2:hover .anchor:hover, article h3:hover .anchor:hover { opacity: 1; }

article p { margin: 0.6em 0; }
article a { color: var(--accent); text-decoration: none; border-bottom: 1px solid var(--accent-soft); transition: border-color 0.15s; }
article a:hover { border-bottom-color: var(--accent); }
article strong { font-weight: 600; color: var(--text); }
article em { font-style: italic; color: var(--text); }

article hr { border: none; border-top: 1px solid var(--border); margin: 36px 0; }

/* Inline code */
article code {
  font-family: 'JetBrains Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
  font-size: 0.88em;
  background: var(--code-bg);
  color: var(--code-text);
  padding: 0.15em 0.4em;
  border-radius: 4px;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

/* Lists */
article ul, article ol { margin: 0.6em 0; padding-left: 1.5em; }
article li { margin: 0.2em 0; }
article li > ul, article li > ol { margin: 0.2em 0; }
article ul { list-style: disc; }
article ol { list-style: decimal; }
article li::marker { color: var(--text-subtle); }

/* Code block */
.code-block {
  margin: 18px 0;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--pre-bg);
  border: 1px solid #1F2326;
  box-shadow: var(--shadow);
}
.code-block-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: #2A2E31;
  border-bottom: 1px solid #1F2326;
}
.code-lang {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px;
  color: var(--pre-comment);
  text-transform: lowercase;
  letter-spacing: 0.04em;
}
.code-copy {
  background: transparent;
  border: 1px solid #3A3F43;
  color: var(--pre-comment);
  font-family: inherit;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.code-copy:hover { background: #3A3F43; color: var(--pre-text); }
.code-copy.copied { background: #2D5A3D; border-color: #2D5A3D; color: #C8E6CF; }
.code-block pre { margin: 0; padding: 16px 18px; overflow-x: auto; }
.code-block code {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  background: transparent;
  color: var(--pre-text);
  padding: 0;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre;
}

/* Callout (blockquote) */
.callout {
  display: flex;
  gap: 12px;
  margin: 18px 0;
  padding: 14px 16px;
  background: var(--callout-bg);
  border: 1px solid var(--callout-border);
  border-radius: var(--radius-lg);
}
.callout-icon { font-size: 18px; line-height: 1.6; flex-shrink: 0; }
.callout-body { flex: 1; min-width: 0; color: var(--text); }
.callout-body :first-child { margin-top: 0; }
.callout-body :last-child { margin-bottom: 0; }

/* Table */
.table-wrap { margin: 18px 0; overflow-x: auto; border: 1px solid var(--border); border-radius: var(--radius-lg); }
article table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  background: var(--surface);
}
article th, article td {
  text-align: left;
  vertical-align: top;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-light);
}
article th {
  font-weight: 600;
  color: var(--text);
  background: #FAFAF9;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}
article tbody tr:last-child td { border-bottom: none; }
article tbody tr:hover { background: var(--table-row-hover); }
article td code { white-space: nowrap; }

/* ----- Sidebar TOC ----- */
.toc {
  font-size: 13px;
  color: var(--text-muted);
  padding: 8px 0 16px;
}
.toc-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-subtle);
  margin-bottom: 10px;
  padding-left: 12px;
}
.toc ul { list-style: none; margin: 0; padding: 0; border-left: 1px solid var(--border-light); }
.toc-item { margin: 0; }
.toc-item a {
  display: block;
  padding: 4px 12px;
  color: var(--text-muted);
  text-decoration: none;
  border-left: 2px solid transparent;
  margin-left: -1px;
  transition: color 0.15s, border-color 0.15s;
  line-height: 1.5;
}
.toc-l3 a { padding-left: 24px; font-size: 12.5px; color: var(--text-subtle); }
.toc-item a:hover { color: var(--text); }
.toc-item a.active {
  color: var(--accent);
  border-left-color: var(--accent);
  font-weight: 500;
}

/* ----- Footer ----- */
.footer {
  border-top: 1px solid var(--border-light);
  background: var(--surface);
}
.footer-inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 20px 32px;
  font-size: 12px;
  color: var(--text-subtle);
}
.footer code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11.5px;
  background: var(--code-bg);
  color: var(--text-muted);
  padding: 1px 5px;
  border-radius: 3px;
}

/* ----- Print ----- */
@media print {
  .topbar, .sidebar, .footer, .code-copy { display: none; }
  body { background: white; }
  .layout { grid-template-columns: 1fr; padding: 0; }
  article { max-width: 100%; }
  .code-block { box-shadow: none; }
}
`.trim();
}

function pageJs() {
  return `
(function () {
  // Click-to-copy on code blocks
  document.querySelectorAll('.code-copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var pre = btn.closest('.code-block').querySelector('pre code');
      if (!pre) return;
      var text = pre.textContent;
      var done = function () {
        var orig = btn.textContent;
        btn.textContent = 'copied';
        btn.classList.add('copied');
        setTimeout(function () { btn.textContent = orig; btn.classList.remove('copied'); }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(done);
      } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta);
        done();
      }
    });
  });

  // TOC active section tracking via IntersectionObserver
  var tocLinks = document.querySelectorAll('.toc a[data-target]');
  if (tocLinks.length === 0 || !('IntersectionObserver' in window)) return;
  var linkMap = {};
  tocLinks.forEach(function (a) { linkMap[a.dataset.target] = a; });

  var visible = new Set();
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) visible.add(e.target.id);
      else visible.delete(e.target.id);
    });
    // Pick the first heading still in view (top-most)
    var headings = Array.from(document.querySelectorAll('article h2[id], article h3[id]'));
    var current = null;
    for (var i = 0; i < headings.length; i++) {
      if (visible.has(headings[i].id)) { current = headings[i].id; break; }
    }
    if (!current) {
      // Fallback: nearest above viewport
      var scrollTop = window.scrollY + 120;
      for (var j = 0; j < headings.length; j++) {
        if (headings[j].offsetTop <= scrollTop) current = headings[j].id;
      }
    }
    tocLinks.forEach(function (a) { a.classList.remove('active'); });
    if (current && linkMap[current]) linkMap[current].classList.add('active');
  }, { rootMargin: '-80px 0px -70% 0px', threshold: 0 });

  document.querySelectorAll('article h2[id], article h3[id]').forEach(function (h) { observer.observe(h); });
})();
`.trim();
}

// ---- Main -------------------------------------------------------------------

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

console.log('build-manuals: starting');
ensureDir(DST_DIR);

const stamp = new Date().toISOString().slice(0, 10);

for (const m of MANUALS) {
  const srcPath = path.join(SRC_DIR, `${m.slug}.md`);
  const dstPath = path.join(DST_DIR, `${m.slug}.html`);
  if (!fs.existsSync(srcPath)) {
    console.warn(`  skip (missing): ${path.relative(ROOT, srcPath)}`);
    continue;
  }
  const md = fs.readFileSync(srcPath, 'utf8');
  const headings = [];
  // Drop the first H1 (it becomes the page-title in the header) — we still need
  // it parsed so anchors stay consistent if referenced elsewhere.
  const contentHtml = mdToHtml(stripFirstH1(md), headings);
  const tocHtml = renderToc(headings);
  const html = wrapPage(m, contentHtml, tocHtml, stamp);
  fs.writeFileSync(dstPath, html, 'utf8');
  console.log(`  wrote: ${path.relative(ROOT, dstPath).replace(/\\/g, '/')}`);
}

console.log('build-manuals: done');

function stripFirstH1(md) {
  const lines = md.split(/\r?\n/);
  let removed = false;
  const out = [];
  for (const ln of lines) {
    if (!removed && /^#\s+/.test(ln)) { removed = true; continue; }
    if (!removed && ln.trim() === '') continue; // skip leading blanks before the first h1
    out.push(ln);
  }
  return out.join('\n');
}
