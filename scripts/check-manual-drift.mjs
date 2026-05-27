#!/usr/bin/env node
// アプリ実装と user-guide.md の「## 画面・機能チェックリスト」セクションを照合し、
// 乖離があればアクティブリリース配下の docs/releases/v<x.y.z>/manual-drift.md に出力する。
//
// 使い方:
//   node scripts/check-manual-drift.mjs                 # アクティブリリース（draft）に対して実行
//   node scripts/check-manual-drift.mjs --release=v1.2.0  # リリース指定
//   node scripts/check-manual-drift.mjs --check         # 差分があれば exit 1（CI 用、出力ファイルは作らない）
//   node scripts/check-manual-drift.mjs --src=docs/manuals/user-guide.md  # 既定は .harness/manuals/user-guide.md

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// ---- CLI ------------------------------------------------------------------

const args = process.argv.slice(2);
const isCheck = args.includes('--check');
const releaseArg = args.find((a) => a.startsWith('--release='));
const srcArg = args.find((a) => a.startsWith('--src='));
const explicitRelease = releaseArg ? releaseArg.split('=')[1] : null;
const guideSrcPath = srcArg
  ? path.join(ROOT, srcArg.split('=')[1])
  : path.join(ROOT, '.harness', 'manuals', 'user-guide.md');

// ---- 1. ルート抽出（app/(app)/**/page.tsx） --------------------------------

function listRoutesFromApp() {
  const appDir = path.join(ROOT, 'app', '(app)');
  if (!fs.existsSync(appDir)) return [];
  const routes = [];
  walk(appDir, [], routes);
  return routes.map(normalizeRoute).sort();
}

function walk(dir, segments, acc) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      walk(path.join(dir, e.name), [...segments, e.name], acc);
    } else if (e.isFile() && e.name === 'page.tsx') {
      acc.push('/' + segments.join('/'));
    }
  }
}

function normalizeRoute(r) {
  // 動的セグメントは Next.js 既定の [xxx] 表記をそのまま保つ
  // （user-guide.md 側もこの表記で書く規約）
  return r;
}

// ---- 2. user-guide.md からチェックリストルート抽出 -------------------------

function listRoutesFromGuide(srcPath) {
  if (!fs.existsSync(srcPath)) return { routes: [], error: `guide not found: ${srcPath}` };
  const md = fs.readFileSync(srcPath, 'utf8');
  const lines = md.split(/\r?\n/);

  // セクション「## 画面・機能チェックリスト」を探す
  let inSection = false;
  const routes = [];
  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      inSection = /画面・機能チェックリスト/.test(line);
      continue;
    }
    if (!inSection) continue;
    // ### /xxx — 説明  の形式から /xxx を抜く
    const m = line.match(/^###\s+(\/\S*)/);
    if (m) routes.push(m[1].replace(/—.*$/, '').trim());
  }
  return { routes: routes.sort() };
}

// ---- 3. アクティブリリースの解決 -------------------------------------------

function resolveActiveRelease() {
  if (explicitRelease) return explicitRelease;

  const releasesDir = path.join(ROOT, 'docs', 'releases');
  if (!fs.existsSync(releasesDir)) return null;
  const candidates = fs
    .readdirSync(releasesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^v\d+\.\d+\.\d+$/.test(d.name))
    .map((d) => d.name);

  // status: draft かつ未完了 [ ] を含むもの → 採用
  // それも無ければ最新 released（既存 release-notes 参照用にフォールバック）
  const drafts = [];
  const released = [];
  for (const v of candidates) {
    const roadmap = path.join(releasesDir, v, 'roadmap.md');
    if (!fs.existsSync(roadmap)) continue;
    const text = fs.readFileSync(roadmap, 'utf8');
    const isDraft = /^status:\s*draft/m.test(text);
    const hasOpen = /- \[ \]/.test(text);
    if (isDraft || hasOpen) drafts.push(v);
    else released.push(v);
  }
  if (drafts.length > 0) return semverMax(drafts);
  if (released.length > 0) return semverMax(released);
  return null;
}

function semverMax(arr) {
  return arr.sort((a, b) => {
    const pa = a.slice(1).split('.').map(Number);
    const pb = b.slice(1).split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if (pa[i] !== pb[i]) return pb[i] - pa[i];
    }
    return 0;
  })[0];
}

// ---- 4. 直近リリースのチケット抽出（feature / ui-ux） ---------------------

function listFeatureTickets(release) {
  const ticketDir = path.join(ROOT, 'docs', 'releases', release, 'ticket');
  if (!fs.existsSync(ticketDir)) return [];
  const items = [];
  for (const f of fs.readdirSync(ticketDir)) {
    if (!f.endsWith('.md')) continue;
    const text = fs.readFileSync(path.join(ticketDir, f), 'utf8');
    const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fmMatch) continue;
    const fm = fmMatch[1];
    const idMatch = fm.match(/^id:\s*(.+)$/m);
    const titleMatch = fm.match(/^title:\s*(.+)$/m);
    const typeMatch = fm.match(/^type:\s*(\w+)/m);
    if (!typeMatch) continue;
    const type = typeMatch[1];
    if (type !== 'feature' && type !== 'ui-ux') continue;
    items.push({
      id: idMatch ? idMatch[1].trim() : f.replace(/\.md$/, ''),
      title: titleMatch ? titleMatch[1].trim() : '(no title)',
      type,
    });
  }
  return items.sort((a, b) => a.id.localeCompare(b.id));
}

// ---- 5. 比較とレポート生成 -------------------------------------------------

function compareRoutes(implRoutes, guideRoutes) {
  const inGuide = new Set(guideRoutes);
  const inImpl = new Set(implRoutes);
  const missingInGuide = implRoutes.filter((r) => !inGuide.has(r));
  const staleInGuide = guideRoutes.filter((r) => !inImpl.has(r));
  return { missingInGuide, staleInGuide };
}

function checkTicketsInGuide(tickets, guideText) {
  // チケットのタイトル中にある主要キーワードが guide 本文に含まれているかの粗いチェック。
  // フル一致 → ID 一致 → タイトル先頭の名詞句（粒子で分割）→ 先頭名詞句の前方一致縮約
  // の順に試す。1 つでも当たれば mentioned: true。
  return tickets.map((c) => {
    const candidates = [c.title, c.id];
    const prefix = c.title.split(/[をがにでへとは、。\s]/)[0].trim();
    if (prefix) {
      for (let len = Math.min(prefix.length, 8); len >= 4; len--) {
        candidates.push(prefix.slice(0, len));
      }
    }
    const hit = candidates.some((s) => s && guideText.includes(s));
    return { ...c, mentioned: hit };
  });
}

function renderReport(release, implRoutes, guideRoutes, routeDiff, ticketsCheck, guideAvailable) {
  const lines = [];
  lines.push('---');
  lines.push(`release: ${release || '(none)'}`);
  lines.push(`generated_at: ${new Date().toISOString().slice(0, 19).replace('T', ' ')}Z`);
  lines.push(`source: ${path.relative(ROOT, guideSrcPath).replace(/\\/g, '/')}`);
  lines.push('---');
  lines.push('');
  lines.push('# 説明書（user-guide.md）と実装の乖離チェック');
  lines.push('');

  if (!guideAvailable) {
    lines.push('## ❌ user-guide.md が見つからない');
    lines.push('');
    lines.push(`- 期待パス: \`${path.relative(ROOT, guideSrcPath).replace(/\\/g, '/')}\``);
    lines.push('- `npm run build:manuals` の前に `.harness/manuals/user-guide.md` を作成してください。');
    return lines.join('\n') + '\n';
  }

  const allOk =
    routeDiff.missingInGuide.length === 0 &&
    routeDiff.staleInGuide.length === 0 &&
    ticketsCheck.every((c) => c.mentioned);

  if (allOk) {
    lines.push('## ✅ 差分なし');
    lines.push('');
    lines.push('実装ルートと user-guide.md の「画面・機能チェックリスト」、および直近リリースの feature/ui-ux チケットがすべて user-guide に反映されています。');
    return lines.join('\n') + '\n';
  }

  // ルート整合
  lines.push('## ルート整合');
  lines.push('');
  lines.push('| 実装ルート | user-guide.md | 結果 |');
  lines.push('|---|---|---|');
  const allRoutes = [...new Set([...implRoutes, ...guideRoutes])].sort();
  for (const r of allRoutes) {
    const inImpl = implRoutes.includes(r);
    const inGuide = guideRoutes.includes(r);
    if (inImpl && inGuide) lines.push(`| ${r} | ${r} | ✅ OK |`);
    else if (inImpl) lines.push(`| ${r} | (なし) | ❌ user-guide.md に追記が必要 |`);
    else lines.push(`| (なし) | ${r} | ⚠️ 実装に存在しない（古い記述？） |`);
  }
  lines.push('');

  // チケット整合
  if (ticketsCheck.length > 0) {
    lines.push('## 直近リリースのチケット整合（feature / ui-ux）');
    lines.push('');
    lines.push('| ID | type | タイトル | user-guide に記述あり |');
    lines.push('|---|---|---|---|');
    for (const c of ticketsCheck) {
      lines.push(`| ${c.id} | ${c.type} | ${c.title} | ${c.mentioned ? '✅' : '❌'} |`);
    }
    lines.push('');
    lines.push('チケットタイトル等が user-guide.md 本文に含まれているかを文字列マッチで判定（軽量チェック）。誤検出があれば手動で確認してください。');
    lines.push('');
  }

  lines.push('## 解決手順');
  lines.push('');
  lines.push('1. `.harness/manuals/user-guide.md` を編集して未記載項目を追記する');
  lines.push('2. `npm run build:manuals` を実行して `docs/manuals/user-guide.html` を再生成');
  lines.push('3. `npm run check:manual` を再実行して「✅ 差分なし」になることを確認');
  lines.push('4. その後 `/finalize-release` を再実行');

  return lines.join('\n') + '\n';
}

// ---- Main ------------------------------------------------------------------

const release = resolveActiveRelease();
const implRoutes = listRoutesFromApp();
const { routes: guideRoutes, error: guideError } = listRoutesFromGuide(guideSrcPath);
const guideAvailable = !guideError;
const routeDiff = compareRoutes(implRoutes, guideRoutes);

let ticketsCheck = [];
if (release && guideAvailable) {
  const guideText = fs.readFileSync(guideSrcPath, 'utf8');
  const tickets = listFeatureTickets(release);
  ticketsCheck = checkTicketsInGuide(tickets, guideText);
}

const report = renderReport(release, implRoutes, guideRoutes, routeDiff, ticketsCheck, guideAvailable);
const hasDrift =
  !guideAvailable ||
  routeDiff.missingInGuide.length > 0 ||
  routeDiff.staleInGuide.length > 0 ||
  ticketsCheck.some((c) => !c.mentioned);

console.log(`check-manual-drift: release=${release || '(none)'} routes_impl=${implRoutes.length} routes_guide=${guideRoutes.length}`);
if (hasDrift) {
  console.log('  status: DRIFT detected');
} else {
  console.log('  status: ok (no drift)');
}

if (isCheck) {
  // CI モード：ファイル出力なし、exit code のみ
  console.log(report);
  process.exit(hasDrift ? 1 : 0);
}

// 通常モード：アクティブリリース配下に manual-drift.md を出力
if (release) {
  const dst = path.join(ROOT, 'docs', 'releases', release, 'manual-drift.md');
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, report, 'utf8');
  console.log(`  wrote: ${path.relative(ROOT, dst).replace(/\\/g, '/')}`);
} else {
  console.log('  no active release — printing report to stdout');
  console.log(report);
}
