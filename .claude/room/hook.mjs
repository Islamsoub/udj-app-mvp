// Agent Room event writer — a Claude Code hook.
//
// Reads one hook payload (JSON) on stdin and appends at most one event line to
// events.ndjson next to this file. The room page (index.html) polls that file.
//
// Harmless by construction:
// - Never prints anything. PreToolUse stdout can be read as a decision and
//   UserPromptSubmit stdout is added to the conversation, so silence is a rule.
// - Always exits 0, including on uncaught errors and unhandled rejections.
// - Kills itself after 1.5s whatever it is doing.
// - Any failure means no line is written. The room is decoration; a run is not.
//
// Attribution: tool events fired inside a subagent carry `agent_type` (the
// agent's name from .claude/agents/*.md). The orchestrator's own events carry
// none and are dropped — the orchestrator is not one of the four agents.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const quit = () => process.exit(0);
process.on('uncaughtException', quit);
process.on('unhandledRejection', quit);
setTimeout(quit, 1500);

const DIR = path.dirname(fileURLToPath(import.meta.url));
const EVENTS = path.join(DIR, 'events.ndjson');
const STATE = path.join(DIR, 'state.json');

// The page drives its "new events" check off line count. Trimming to exactly
// MAX on every write would hold the count at MAX and the page would stop
// seeing anything new. Trimming down to KEEP makes the count drop, which the
// page treats as a fresh file and replays.
const MAX_LINES = 500;
const KEEP_LINES = 300;

const AGENTS = { lead: 'lead', builder: 'builder', reviewer: 'reviewer', 'design-checker': 'checker' };

// Tools that never produce a line anyone wants to read.
const SKIP_TOOLS = new Set([
  'Glob', 'LS', 'TodoWrite', 'TodoRead', 'ToolSearch', 'SubagentHandback',
  'TaskCreate', 'TaskUpdate', 'TaskList', 'TaskGet', 'TaskOutput', 'TaskStop',
  'Agent', 'Task', 'ListAgents', 'SendMessage', 'BashOutput', 'KillShell',
]);

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; if (raw.length > 4_000_000) quit(); });
process.stdin.on('error', quit);
process.stdin.on('end', () => {
  try {
    const p = JSON.parse(raw);
    const ev = toEvent(p);
    if (ev) write(ev);
  } catch { /* write nothing */ }
  quit();
});

// ---------- payload → event ----------

function agentOf(type) {
  if (typeof type !== 'string' || !type) return null;
  const name = type.slice(type.lastIndexOf(':') + 1); // tolerate "plugin:builder"
  return AGENTS[name] || null;
}

function toEvent(p) {
  const hook = p.hook_event_name;
  const cwd = typeof p.cwd === 'string' ? p.cwd : process.cwd();

  if (hook === 'UserPromptSubmit') {
    const t = typeof p.prompt === 'string' ? p.prompt.trim() : '';
    // Hand-backs and notifications from subagents also arrive as prompts. They
    // start with a tag or a bracketed marker; a human message does not.
    if (!t || t.startsWith('<') || t.startsWith('[')) return null;
    return ev('you', '', firstLine(t, 100));
  }

  if (hook === 'SubagentStart') {
    const a = agentOf(p.agent_type);
    if (a && p.agent_id) remember(p.agent_id, a, true);
    return null; // the orchestrator's Agent call already wrote the start line
  }

  if (hook === 'SubagentStop') {
    const a = agentOf(p.agent_type);
    if (!a) return null;
    if (p.agent_id) remember(p.agent_id, a, false);
    const report = finalReport(p.agent_transcript_path);
    const flagged = isFlag(a, report, cwd);
    const text = report ? firstLine(report, 110) : flagged ? 'stopped with a problem' : 'finished';
    return ev(a, 'idle', text, flagged ? 'flag' : 'done');
  }

  if (hook === 'Notification') {
    // "waiting" only when a human is being asked something by one of the four.
    const kind = p.notification_type || '';
    if (kind === 'idle_prompt' || kind === 'auth_success') return null;
    const a = agentOf(p.agent_type) || soleActive();
    if (!a) return null;
    return ev(a, 'waiting', firstLine(p.message || 'needs your approval', 110));
  }

  if (hook === 'PreToolUse' || hook === 'PostToolUseFailure') {
    const tool = p.tool_name || '';
    const input = p.tool_input && typeof p.tool_input === 'object' ? p.tool_input : {};

    // The orchestrator launching one of the four: attributable by subagent_type.
    if (hook === 'PreToolUse' && (tool === 'Agent' || tool === 'Task') && !p.agent_type) {
      const a = agentOf(input.subagent_type);
      if (!a) return null;
      return ev(a, 'working', firstLine(input.description || 'starting', 100));
    }

    const a = agentOf(p.agent_type);
    if (!a) return null;

    if (hook === 'PostToolUseFailure') {
      if (tool !== 'Bash' && tool !== 'PowerShell') return null;
      return ev(a, 'working', 'failed: ' + command(input.command));
    }

    if (tool === 'AskUserQuestion') {
      const q = Array.isArray(input.questions) && input.questions[0] ? input.questions[0].question : '';
      return ev(a, 'waiting', firstLine(q || 'asking you a question', 110));
    }
    const text = describeTool(tool, input, cwd);
    return text ? ev(a, 'working', text) : null;
  }

  return null;
}

function describeTool(tool, i, cwd) {
  if (SKIP_TOOLS.has(tool) || tool.startsWith('mcp__')) return null;
  switch (tool) {
    case 'Read': return i.file_path ? 'reading ' + shortPath(i.file_path, cwd) : null;
    case 'Write': return i.file_path ? 'writing ' + shortPath(i.file_path, cwd) : null;
    case 'Edit':
    case 'MultiEdit': return i.file_path ? 'editing ' + shortPath(i.file_path, cwd) : null;
    case 'NotebookEdit': return i.notebook_path ? 'editing ' + shortPath(i.notebook_path, cwd) : null;
    case 'Grep': return i.pattern ? 'searching for "' + clip(String(i.pattern), 50) + '"' : null;
    case 'Bash':
    case 'PowerShell': { const c = command(i.command); return c || null; }
    case 'WebFetch': try { return 'fetching ' + new URL(i.url).host; } catch { return null; }
    case 'WebSearch': return i.query ? 'searching the web: ' + clip(String(i.query), 60) : null;
    default: return null; // unknown tool: no line rather than a meaningless one
  }
}

// "cd backend && npm run typecheck" → "npm run typecheck"
function command(c) {
  let s = typeof c === 'string' ? c.split(/\r?\n/)[0].trim() : '';
  for (let n = 0; n < 4; n++) {
    const m = s.match(/^(?:cd|Set-Location)\s+(?:"[^"]*"|'[^']*'|\S+)\s*(?:&&|;)\s*/i);
    if (!m) break;
    s = s.slice(m[0].length);
  }
  return clip(s, 100);
}

function shortPath(f, cwd) {
  let rel = String(f);
  try {
    const r = path.relative(cwd, f);
    if (r && !r.startsWith('..') && !path.isAbsolute(r)) rel = r;
    else rel = path.basename(f);
  } catch { rel = path.basename(String(f)); }
  rel = rel.replace(/\\/g, '/');
  if (rel.length > 56) rel = '…/' + rel.split('/').slice(-2).join('/');
  return rel;
}

// ---------- the final report and flag detection ----------

// Last assistant text (or SubagentHandback message) in the subagent's
// transcript. Reads only the last 128 KB.
function finalReport(file) {
  if (typeof file !== 'string' || !file) return '';
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const size = fs.fstatSync(fd).size;
    const len = Math.min(size, 128 * 1024);
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, size - len);
    const ls = buf.toString('utf8').split('\n');
    for (let k = ls.length - 1; k >= 0; k--) {
      let o; try { o = JSON.parse(ls[k]); } catch { continue; }
      if (o.type !== 'assistant' || !Array.isArray(o.message?.content)) continue;
      for (let j = o.message.content.length - 1; j >= 0; j--) {
        const b = o.message.content[j];
        if (b.type === 'tool_use' && b.name === 'SubagentHandback' && b.input?.message) return String(b.input.message);
        if (b.type === 'text' && b.text?.trim()) return b.text;
      }
    }
  } catch { /* fall through */ } finally { try { if (fd !== undefined) fs.closeSync(fd); } catch {} }
  return '';
}

const PROBLEM = /\b(flag(ged|s)?|block(ed|er|ing)|could ?n[o']t|cannot|can't|unable|fail(ed|s|ing|ure)?|reject(ed)?|does ?n[o']t meet|not met|needs? (a )?(human|decision)|question for you)\b/i;

function isFlag(agent, report, cwd) {
  if (!report) return false;
  if (agent === 'lead') {
    // The lead returns only the mission path. Its problems live in MISSION.md
    // under "## Flags"; anything there other than "none" is a flag.
    const m = report.match(/\.claude[\\/]missions[\\/][^\s`'")]+/);
    if (m) {
      try {
        const dir = path.resolve(cwd, m[0].replace(/[\\/]+$/, ''));
        const md = fs.readFileSync(path.join(dir, 'MISSION.md'), 'utf8');
        const sec = md.split(/^##\s+Flags\s*$/m)[1];
        if (sec !== undefined) {
          const body = sec.split(/^##\s/m)[0].replace(/[\s\-*_.]/g, '').toLowerCase();
          return !!body && body !== 'none' && body !== 'n/a';
        }
      } catch { /* fall back to the text */ }
    }
  }
  if (agent === 'checker' && /\bspec\b[^\n]*\bvs\b[^\n]*\bbuilt\b/i.test(report)) return true;
  return PROBLEM.test(report);
}

// ---------- active subagents (only used to attribute Notification) ----------

function readState() {
  try { const s = JSON.parse(fs.readFileSync(STATE, 'utf8')); return s && typeof s === 'object' ? s : {}; } catch { return {}; }
}
function remember(id, agent, on) {
  try {
    const s = readState(), now = Date.now();
    for (const k of Object.keys(s)) if (!s[k] || now - s[k].t > 6 * 3600e3) delete s[k];
    if (on) s[id] = { a: agent, t: now }; else delete s[id];
    fs.writeFileSync(STATE, JSON.stringify(s));
  } catch { /* ignore */ }
}
function soleActive() {
  const v = Object.values(readState());
  return v.length === 1 ? v[0].a : null;
}

// ---------- writing ----------

function ev(agent, state, text, kind = '') {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (!t) return null;
  return { ts: Math.floor(Date.now() / 1000), agent, state, text: t, kind };
}

function write(e) {
  let lines = [];
  try { lines = fs.readFileSync(EVENTS, 'utf8').split(/\r?\n/).filter((l) => l.trim()); } catch { /* new file */ }

  // Drop an exact repeat of the agent's previous line (same file read twice).
  for (let k = lines.length - 1; k >= 0; k--) {
    let o; try { o = JSON.parse(lines[k]); } catch { continue; }
    if (o.agent === e.agent) {
      if (o.text === e.text && o.state === e.state && o.kind === e.kind) return;
      break;
    }
  }

  const line = JSON.stringify(e);
  if (lines.length + 1 > MAX_LINES) {
    const kept = lines.slice(-(KEEP_LINES - 1)).concat(line).join('\n') + '\n';
    const tmp = EVENTS + '.' + process.pid + '.tmp';
    try { fs.writeFileSync(tmp, kept); fs.renameSync(tmp, EVENTS); }
    catch { try { fs.unlinkSync(tmp); } catch {} try { fs.writeFileSync(EVENTS, kept); } catch {} }
  } else {
    fs.appendFileSync(EVENTS, line + '\n');
  }
}

function firstLine(s, n) {
  const l = String(s).split(/\r?\n/).map((x) => x.trim()).find((x) => x && !/^#+\s*$/.test(x)) || '';
  return clip(l.replace(/^#+\s*/, '').replace(/\*\*/g, ''), n);
}
function clip(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }
