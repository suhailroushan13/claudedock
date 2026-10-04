#!/usr/bin/env node
'use strict';
// ClaudeDock status line. Claude Code pipes session JSON on stdin; we print one line.
// Shows: model · effort │ 5-hour session limit progress │ context used/total │ AWAKE badge
// Self-contained on purpose (runs on every update, must be fast and never crash).

const fs = require('fs');
const os = require('os');
const path = require('path');

const APP_DIR = path.join(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude'), 'claudedock');
const STATE_FILE = path.join(APP_DIR, 'state.json');

const useColor = !process.env.NO_COLOR;
const paint = (code) => (s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
const dim = paint('2');
const bold = paint('1');
const cyan = paint('1;36');
const magenta = paint('35');
const yellow = paint('33');
const green = paint('32');
const red = paint('31');
const badge = paint('30;43;1'); // black on yellow

function readInput() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  } catch {
    return {};
  }
}

function modelName(model = {}) {
  const id = String(model.id || '');
  // claude-opus-5-5 -> Opus 5.5, claude-haiku-4-5-20251001 -> Haiku 4.5, claude-sonnet-4-20250514 -> Sonnet 4
  const m = id.match(/claude-([a-z]+)-(\d+)(?:-(\d{1,2})(?!\d))?/i);
  if (m) {
    const family = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase();
    return `${family} ${m[2]}${m[3] ? '.' + m[3] : ''}`;
  }
  return model.display_name || id || 'Claude';
}

const pctColor = (p) => (p >= 80 ? red : p >= 50 ? yellow : green);

function bar(pct, width) {
  const p = Math.max(0, Math.min(100, pct));
  const filled = Math.round((p / 100) * width);
  return pctColor(p)('█'.repeat(filled)) + dim('░'.repeat(width - filled));
}

function fmtTokens(n) {
  n = Number(n) || 0;
  if (n >= 1e6) return `${+(n / 1e6).toFixed(1)}M`;
  if (n >= 1e5) return `${Math.round(n / 1e3)}k`;
  if (n >= 1e3) return `${+(n / 1e3).toFixed(1)}k`;
  return String(n);
}

function fmtDuration(sec) {
  if (!(sec > 0)) return '0m';
  if (sec < 60) return '<1m';
  const m = Math.floor(sec / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d${h % 24}h`;
  if (h > 0) return `${h}h${String(m % 60).padStart(2, '0')}m`;
  return `${m}m`;
}

function awakeState() {
  try {
    const s = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (!s.awake) return null;
    if (s.pid) process.kill(s.pid, 0); // Linux: throws if the inhibitor process is gone
    return s;
  } catch {
    return null;
  }
}

function main() {
  const d = readInput();
  const cols = Number(process.env.COLUMNS) || 120;
  const tier = cols >= 110 ? 'wide' : cols >= 80 ? 'medium' : 'narrow';
  const barW = tier === 'wide' ? 10 : 6;
  const parts = [];

  // 1. Model + effort
  let model = cyan(modelName(d.model));
  if (d.effort && d.effort.level) model += ' ' + magenta(d.effort.level);
  if (d.fast_mode) model += ' ' + yellow('fast');
  parts.push(model);

  // 2. Session progress: the 5-hour usage window (Pro/Max, after the first reply)
  const five = d.rate_limits && d.rate_limits.five_hour;
  if (five && typeof five.used_percentage === 'number') {
    const pct = Math.round(five.used_percentage);
    const secsLeft = (Number(five.resets_at) || 0) - Date.now() / 1000;
    const left = secsLeft > 0 ? fmtDuration(secsLeft) : '';
    if (tier === 'narrow') {
      parts.push(`${dim('S')} ${pctColor(pct)(pct + '%')}`);
    } else {
      const label = tier === 'wide' ? 'Session' : 'Sess';
      parts.push(`${dim(label)} ${bar(pct, barW)} ${pctColor(pct)(pct + '%')}${left ? dim(` ↻ ${left}`) : ''}`);
    }
  }

  // 3. Context used / total
  const cw = d.context_window || {};
  const size = Number(cw.context_window_size) || 0;
  if (size) {
    const used = Number(cw.total_input_tokens) || 0;
    const pct = Math.round(typeof cw.used_percentage === 'number' ? cw.used_percentage : (used / size) * 100);
    const amount = `${fmtTokens(used)}/${fmtTokens(size)}`;
    if (tier === 'narrow') {
      parts.push(`${dim('C')} ${pctColor(pct)(amount)}`);
    } else {
      const label = tier === 'wide' ? 'Context' : 'Ctx';
      parts.push(`${dim(label)} ${bar(pct, barW)} ${bold(amount)} ${dim(`(${pct}%)`)}`);
    }
  }

  // 4. Keep-awake badge, so you never forget it is on
  const awake = awakeState();
  if (awake) {
    const since = awake.since ? ' ' + fmtDuration((Date.now() - awake.since) / 1000) : '';
    parts.push(badge(` AWAKE${tier === 'narrow' ? '' : since} `));
  }

  process.stdout.write(parts.join(dim(' │ ')) + '\n');
}

try {
  main();
} catch {
  process.stdout.write('ClaudeDock\n');
}
