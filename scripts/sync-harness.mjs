#!/usr/bin/env node
// .harness/ をソース・オブ・トゥルースとして、
// Claude Code / Codex CLI / GitHub Copilot 各ツール固有の設定ファイルを生成する。
//
// 使い方:
//   node scripts/sync-harness.mjs           # 各ツール用ファイルを生成・上書き
//   node scripts/sync-harness.mjs --check   # 生成物が手動編集で乖離していないか確認（差分があれば exit 1）
//   node scripts/sync-harness.mjs --tool=claude    # Claude のみ生成
//
// Phase 1-2: Claude / Codex 出力を実装。Copilot は Phase 3 で追加。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const HARNESS_DIR = path.join(ROOT, '.harness');
const CLAUDE_DIR = path.join(ROOT, '.claude');
const CODEX_DIR = path.join(ROOT, '.codex');
const COPILOT_DIR = path.join(ROOT, '.github');
const VSCODE_DIR = path.join(ROOT, '.vscode');

// ---- CLI argument parsing ---------------------------------------------------

const args = process.argv.slice(2);
const isCheck = args.includes('--check');
const toolArg = args.find((a) => a.startsWith('--tool='));
const onlyTool = toolArg ? toolArg.split('=')[1] : null;
const TOOLS = onlyTool ? [onlyTool] : ['claude', 'codex', 'copilot'];

// ---- Utility ----------------------------------------------------------------

const AUTOGEN_BANNER_MD = `<!-- AUTO-GENERATED FROM .harness/ — DO NOT EDIT.\n     Edit the source under .harness/ and run \`npm run sync:harness\`. -->\n`;

// preserve list: sync は触らない既存ファイル（aidesigner CLI が別管理）
const CLAUDE_PRESERVE = new Set([
  '.claude/agents/aidesigner-frontend.md',
  '.claude/commands/aidesigner.md',
  '.claude/skills/aidesigner-frontend/SKILL.md',
  '.claude/skills/aidesigner-frontend/references/api.md',
  '.claude/skills/aidesigner-frontend/references/frontend-rubric.md',
]);

const writes = []; // { path, content } collected, then flushed at the end (or diffed in --check mode)

function queueWrite(absPath, content) {
  writes.push({ path: absPath, content });
}

function readFileOrEmpty(absPath) {
  try {
    return fs.readFileSync(absPath, 'utf8');
  } catch {
    return null;
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function listFiles(dir, exts = null) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (!stat.isFile()) return false;
      if (exts && !exts.some((e) => name.endsWith(e))) return false;
      return true;
    })
    .sort();
}

// ---- Minimal YAML parser (subset sufficient for our schemas) ---------------
// We avoid adding js-yaml/@iarna/toml as deps in Phase 1 to keep the toolchain
// dependency-free. The schemas in .harness/ are intentionally constrained.

function parseYaml(text) {
  const lines = text.split(/\r?\n/);
  const root = {};
  const stack = [{ indent: -1, container: root, key: null }];

  for (let raw of lines) {
    if (raw.trim() === '' || raw.trim().startsWith('#')) continue;
    const indent = raw.match(/^ */)[0].length;
    let line = raw.slice(indent);

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }
    const top = stack[stack.length - 1];

    if (line.startsWith('- ')) {
      // list item
      const value = line.slice(2).trim();
      if (!Array.isArray(top.container)) {
        // need to convert top's value to array via parent
        throw new Error(`YAML parse: list item under non-list at line "${raw}"`);
      }
      top.container.push(parseScalar(value));
      continue;
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) {
      throw new Error(`YAML parse: missing colon in "${raw}"`);
    }
    const key = line.slice(0, colonIdx).trim();
    const rest = line.slice(colonIdx + 1).trim();

    if (rest === '') {
      // nested object or list follows
      // Look ahead to determine — but easier: create object placeholder and let next line decide
      const child = {};
      if (Array.isArray(top.container)) {
        throw new Error(`YAML parse: key under list at "${raw}"`);
      }
      top.container[key] = child;
      stack.push({ indent, container: child, key });
      // peek: is next non-blank line a "- " at greater indent? then convert to array
      // We do lazy conversion: if a list item is added under this key, replace child with [].
      // To support this cleanly, we mark the slot.
      // Simpler: scan ahead.
      // For our schemas, all nested lists are indented exactly 2 spaces beyond the key.
      // Convert if needed:
      const nextLine = peekNextNonBlank(lines, indexOfRaw(lines, raw));
      if (nextLine && nextLine.match(/^ +- /)) {
        const arr = [];
        top.container[key] = arr;
        stack.pop();
        stack.push({ indent, container: arr, key });
      }
    } else {
      if (Array.isArray(top.container)) {
        throw new Error(`YAML parse: key/value under list at "${raw}"`);
      }
      top.container[key] = parseScalar(rest);
    }
  }

  return root;
}

function indexOfRaw(lines, raw) {
  return lines.indexOf(raw);
}

function peekNextNonBlank(lines, fromIndex) {
  for (let i = fromIndex + 1; i < lines.length; i++) {
    if (lines[i].trim() !== '' && !lines[i].trim().startsWith('#')) return lines[i];
  }
  return null;
}

function parseScalar(s) {
  if (s === '' || s === '~' || s === 'null') return null;
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
  if (s.startsWith('[') && s.endsWith(']')) {
    const inner = s.slice(1, -1).trim();
    if (inner === '') return [];
    return inner.split(',').map((x) => parseScalar(x.trim()));
  }
  // Strip optional surrounding quotes
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

// ---- Markdown frontmatter helpers ------------------------------------------

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { meta: {}, body: text };
  const meta = parseYaml(m[1]);
  return { meta, body: m[2] };
}

// ---- Loaders ---------------------------------------------------------------

function loadAgent(agentName) {
  const yamlPath = path.join(HARNESS_DIR, 'agents', `${agentName}.yaml`);
  const promptPath = path.join(HARNESS_DIR, 'agents', `${agentName}.prompt.md`);
  const meta = parseYaml(fs.readFileSync(yamlPath, 'utf8'));
  const prompt = fs.readFileSync(promptPath, 'utf8');
  return { meta, prompt };
}

function loadCommand(commandName) {
  const mdPath = path.join(HARNESS_DIR, 'commands', `${commandName}.md`);
  const text = fs.readFileSync(mdPath, 'utf8');
  return parseFrontmatter(text);
}

function loadInstructions() {
  return {
    agents: fs.readFileSync(path.join(HARNESS_DIR, 'instructions', 'AGENTS.md'), 'utf8'),
    claudeAddendum: readFileOrEmpty(path.join(HARNESS_DIR, 'instructions', 'claude-addendum.md')) || '',
    codexAddendum: readFileOrEmpty(path.join(HARNESS_DIR, 'instructions', 'codex-addendum.md')) || '',
    copilotAddendum: readFileOrEmpty(path.join(HARNESS_DIR, 'instructions', 'copilot-addendum.md')) || '',
  };
}

function loadMcp() {
  return JSON.parse(fs.readFileSync(path.join(HARNESS_DIR, 'mcp', 'servers.json'), 'utf8'));
}

function loadPermissions() {
  return JSON.parse(fs.readFileSync(path.join(HARNESS_DIR, 'permissions', 'allow.json'), 'utf8'));
}

function listAgents() {
  return listFiles(path.join(HARNESS_DIR, 'agents'), ['.yaml']).map((f) => f.replace(/\.yaml$/, ''));
}

function listCommands() {
  return listFiles(path.join(HARNESS_DIR, 'commands'), ['.md']).map((f) => f.replace(/\.md$/, ''));
}

// ---- Tool: Claude ----------------------------------------------------------

function generateClaude() {
  // 1. Root CLAUDE.md and AGENTS.md (combined instructions)
  const ins = loadInstructions();
  const claudeInstructions = `${AUTOGEN_BANNER_MD}\n${ins.agents.trimEnd()}\n\n---\n\n${ins.claudeAddendum.trimEnd()}\n`;
  queueWrite(path.join(ROOT, 'CLAUDE.md'), claudeInstructions);

  // Root AGENTS.md is the neutral instructions, used by Codex CLI and Copilot's auto-detect.
  // Even in Claude-only mode we emit it because AGENTS.md is the cross-tool default.
  const rootAgentsMd = `${AUTOGEN_BANNER_MD}\n${ins.agents.trimEnd()}\n`;
  queueWrite(path.join(ROOT, 'AGENTS.md'), rootAgentsMd);

  // 2. .claude/agents/*.md
  for (const name of listAgents()) {
    const { meta, prompt } = loadAgent(name);
    if ((meta.tools_only || []).length && !meta.tools_only.includes('claude')) continue;

    const sharedTools = meta.tools?.shared || [];
    const claudeOnlyTools = meta.tools?.claude || [];
    const allTools = [...sharedTools, ...claudeOnlyTools];

    const fm = [
      '---',
      `name: ${meta.name}`,
      `description: ${meta.description}`,
      `model: ${meta.model?.claude || 'opus'}`,
      `tools: ${allTools.join(', ')}`,
      '---',
      '',
    ].join('\n');

    queueWrite(path.join(CLAUDE_DIR, 'agents', `${name}.md`), `${fm}\n${prompt.trimEnd()}\n`);
  }

  // 3. .claude/commands/*.md
  for (const name of listCommands()) {
    const { meta, body } = loadCommand(name);
    const fm = ['---'];
    if (meta.description) fm.push(`description: ${meta.description}`);
    if (meta.argument_hint) fm.push(`argument-hint: ${meta.argument_hint}`);
    fm.push('---', '');
    // Replace neutral {{ARGUMENTS}} with Claude's $ARGUMENTS
    const claudeBody = body.replace(/\{\{ARGUMENTS\}\}/g, '$ARGUMENTS');
    queueWrite(path.join(CLAUDE_DIR, 'commands', `${name}.md`), `${fm.join('\n')}\n${claudeBody.trimEnd()}\n`);
  }

  // 4. .claude/settings.local.json
  const perms = loadPermissions();
  const mcp = loadMcp();
  const claudeMcpEnabled = mcp.servers
    .filter((s) => (s.tools_only || []).length === 0 || s.tools_only.includes('claude'))
    .filter((s) => s.type === 'external-managed') // only OAuth-style enabledMcpjsonServers
    .map((s) => s.id);

  const settings = {
    permissions: { allow: perms.claude.allow },
    enableAllProjectMcpServers: perms.claude.enableAllProjectMcpServers,
    enabledMcpjsonServers: perms.claude.enabledMcpjsonServers || claudeMcpEnabled,
  };
  queueWrite(
    path.join(CLAUDE_DIR, 'settings.local.json'),
    JSON.stringify(settings, null, 2) + '\n',
  );
}

// ---- TOML serializer (subset sufficient for Codex config / agents) ---------
// Supports: top-level scalars (string/number/bool), arrays of scalars,
// multi-line strings via """...""", nested tables via [a.b.c].

function tomlEscapeBasicString(s) {
  // Basic strings: \" and \\ must be escaped; control chars escaped too.
  // We use multi-line basic strings for long text to preserve newlines verbatim.
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function tomlValue(v) {
  if (v === null || v === undefined) return '""';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) {
    return '[' + v.map((x) => tomlValue(x)).join(', ') + ']';
  }
  if (typeof v === 'string') {
    if (v.includes('\n')) {
      // Use multi-line basic string. Escape \ and any literal """ only.
      const escaped = v.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"');
      // Leading newline after opening """ is trimmed by TOML spec — desirable here.
      return '"""\n' + escaped + '\n"""';
    }
    return '"' + tomlEscapeBasicString(v) + '"';
  }
  throw new Error(`tomlValue: unsupported type for ${JSON.stringify(v)}`);
}

function tomlSerialize(obj) {
  // obj shape:
  //   { scalars: { key: value, ... },
  //     tables: [ { name: "section.subsection", scalars: { ... } }, ... ] }
  const out = [];
  for (const [k, v] of Object.entries(obj.scalars || {})) {
    out.push(`${k} = ${tomlValue(v)}`);
  }
  for (const t of obj.tables || []) {
    if (out.length > 0) out.push('');
    out.push(`[${t.name}]`);
    for (const [k, v] of Object.entries(t.scalars || {})) {
      out.push(`${k} = ${tomlValue(v)}`);
    }
  }
  return out.join('\n') + '\n';
}

// ---- Tool: Codex -----------------------------------------------------------

function generateCodex() {
  // Codex は AGENTS.md をルートから自動検出するため、ここでは追加生成不要。
  // ただし codex 用の addendum を含める「ルート AGENTS.md は claude 関数で既に生成済み」。

  // 1. .codex/agents/*.toml — 1 ファイル 1 サブエージェント
  for (const name of listAgents()) {
    const { meta, prompt } = loadAgent(name);
    if ((meta.tools_only || []).length && !meta.tools_only.includes('codex')) continue;

    const toml = tomlSerialize({
      scalars: {
        name: meta.name,
        description: meta.description,
        model: meta.model?.codex || 'gpt-5-codex',
        sandbox_mode: meta.sandbox_mode || 'workspace-write',
        developer_instructions: prompt.trimEnd(),
      },
    });

    const banner = `# AUTO-GENERATED FROM .harness/ — DO NOT EDIT.\n# Edit .harness/agents/${name}.{yaml,prompt.md} and run \`npm run sync:harness\`.\n\n`;
    queueWrite(path.join(CODEX_DIR, 'agents', `${name}.toml`), banner + toml);
  }

  // 2. .codex/prompts/*.md — Codex のスラッシュコマンド本体
  for (const name of listCommands()) {
    const { meta, body } = loadCommand(name);
    const fm = ['---'];
    if (meta.description) fm.push(`description: ${meta.description}`);
    if (meta.argument_hint) fm.push(`argument-hint: ${meta.argument_hint}`);
    fm.push('---', '');
    // Codex も Claude と同様に $ARGUMENTS プレースホルダを使う
    const codexBody = body.replace(/\{\{ARGUMENTS\}\}/g, '$ARGUMENTS');
    queueWrite(path.join(CODEX_DIR, 'prompts', `${name}.md`), `${fm.join('\n')}\n${codexBody.trimEnd()}\n`);
  }

  // 3. .codex/config.toml — MCP サーバ + サンドボックス既定値
  const mcp = loadMcp();
  const perms = loadPermissions();

  const codexMcpServers = mcp.servers.filter((s) => {
    if (!s.tools_only || s.tools_only.length === 0) return s.type === 'stdio';
    return s.tools_only.includes('codex') && s.type === 'stdio';
  });

  const tables = [];
  for (const s of codexMcpServers) {
    tables.push({
      name: `mcp_servers.${s.id}`,
      scalars: {
        command: s.command,
        args: s.args || [],
      },
    });
  }

  const config = tomlSerialize({
    scalars: {
      sandbox_mode: perms.codex.default_sandbox_mode,
      approval_policy: perms.codex.default_approval_policy,
    },
    tables,
  });

  const configBanner = `# AUTO-GENERATED FROM .harness/ — DO NOT EDIT.\n# Edit .harness/{permissions,mcp}/ and run \`npm run sync:harness\`.\n\n`;
  queueWrite(path.join(CODEX_DIR, 'config.toml'), configBanner + config);
}

// ---- Tool: Copilot ---------------------------------------------------------

// VS Code Copilot のツール ID と本ハーネスの中立ツール ID のマッピング。
// 細粒度の MCP ツールは VS Code 側で MCP 接続時に自動で利用可能になるため
// chatmode の tools フィールドに個別列挙はしない。
const COPILOT_TOOL_MAP = {
  Read: 'codebase',
  Write: 'editFiles',
  Edit: 'editFiles',
  Glob: 'search',
  Grep: 'search',
  Bash: 'runCommands',
  AskUserQuestion: null, // built-in
};

function copilotToolsFromAgent(meta) {
  const sharedTools = meta.tools?.shared || [];
  const set = new Set();
  for (const t of sharedTools) {
    const mapped = COPILOT_TOOL_MAP[t];
    if (mapped) set.add(mapped);
  }
  // mcp__ide__getDiagnostics 相当を入れる（Copilot は problems で対応）
  const claudeOnly = meta.tools?.claude || [];
  if (claudeOnly.includes('mcp__ide__getDiagnostics')) set.add('problems');
  return [...set].sort();
}

function generateCopilot() {
  // 1. .github/copilot-instructions.md（ワークスペース全体への指示）
  const ins = loadInstructions();
  const copilotInstructions = `${AUTOGEN_BANNER_MD}\n${ins.agents.trimEnd()}\n\n---\n\n${ins.copilotAddendum.trimEnd()}\n`;
  queueWrite(path.join(COPILOT_DIR, 'copilot-instructions.md'), copilotInstructions);

  // 2. .github/chatmodes/*.chatmode.md（Custom Chat Mode）
  for (const name of listAgents()) {
    const { meta, prompt } = loadAgent(name);
    if ((meta.tools_only || []).length && !meta.tools_only.includes('copilot')) continue;

    const tools = copilotToolsFromAgent(meta);
    const fm = [
      '---',
      `description: ${meta.description}`,
      `model: ${meta.model?.copilot || 'claude-sonnet-4.6'}`,
      `tools: [${tools.map((t) => `'${t}'`).join(', ')}]`,
      '---',
      '',
    ].join('\n');

    queueWrite(
      path.join(COPILOT_DIR, 'chatmodes', `${name}.chatmode.md`),
      `${AUTOGEN_BANNER_MD}\n${fm}\n${prompt.trimEnd()}\n`,
    );
  }

  // 3. .github/prompts/*.prompt.md（再利用プロンプト）
  for (const name of listCommands()) {
    const { meta, body } = loadCommand(name);
    const fm = ['---'];
    if (meta.description) fm.push(`description: ${meta.description}`);
    fm.push(`mode: agent`);
    fm.push('---', '');
    // Copilot は ${input:arguments} 形式で対話的に引数を取る
    const copilotBody = body.replace(/\{\{ARGUMENTS\}\}/g, '${input:arguments:任意の引数}');
    queueWrite(
      path.join(COPILOT_DIR, 'prompts', `${name}.prompt.md`),
      `${fm.join('\n')}\n${copilotBody.trimEnd()}\n`,
    );
  }

  // 4. .vscode/mcp.json（MCP サーバ設定）
  const mcp = loadMcp();
  const copilotMcpServers = mcp.servers.filter((s) => {
    if (!s.tools_only || s.tools_only.length === 0) return s.type === 'stdio';
    return s.tools_only.includes('copilot') && s.type === 'stdio';
  });

  const mcpConfig = { servers: {} };
  for (const s of copilotMcpServers) {
    mcpConfig.servers[s.id] = {
      type: 'stdio',
      command: s.command,
      args: s.args || [],
    };
  }
  queueWrite(
    path.join(VSCODE_DIR, 'mcp.json'),
    JSON.stringify(mcpConfig, null, 2) + '\n',
  );
}

// ---- Flush / check ----------------------------------------------------------

function flushOrCheck() {
  let driftCount = 0;

  for (const { path: p, content } of writes) {
    const rel = path.relative(ROOT, p).replace(/\\/g, '/');
    if (CLAUDE_PRESERVE.has(rel)) {
      console.log(`  preserve (skip): ${rel}`);
      continue;
    }

    if (isCheck) {
      const existing = readFileOrEmpty(p);
      if (existing === null) {
        console.error(`  DRIFT (missing): ${rel}`);
        driftCount++;
      } else if (normalize(existing) !== normalize(content)) {
        console.error(`  DRIFT (modified): ${rel}`);
        driftCount++;
      } else {
        console.log(`  ok: ${rel}`);
      }
    } else {
      ensureDir(path.dirname(p));
      const existing = readFileOrEmpty(p);
      if (existing !== null && normalize(existing) === normalize(content)) {
        console.log(`  unchanged: ${rel}`);
      } else {
        fs.writeFileSync(p, content, 'utf8');
        console.log(`  wrote: ${rel}`);
      }
    }
  }

  if (isCheck) {
    if (driftCount > 0) {
      console.error(`\nERROR: ${driftCount} file(s) drifted from .harness/. Run \`npm run sync:harness\` to regenerate.`);
      process.exit(1);
    }
    console.log('\nOK: all generated files are in sync with .harness/.');
  }
}

function normalize(s) {
  // Treat \r\n and \n as equivalent so editors that LF/CRLF differently don't trigger drift.
  return s.replace(/\r\n/g, '\n');
}

// ---- Main -------------------------------------------------------------------

console.log(`sync-harness: mode=${isCheck ? 'check' : 'write'} tools=${TOOLS.join(',')}\n`);

if (TOOLS.includes('claude')) {
  console.log('[claude]');
  generateClaude();
}
if (TOOLS.includes('codex')) {
  console.log('[codex]');
  generateCodex();
}
if (TOOLS.includes('copilot')) {
  console.log('[copilot]');
  generateCopilot();
}

flushOrCheck();
