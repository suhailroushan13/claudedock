'use strict';
// Shared paths and helpers for ClaudeDock. No dependencies: Node built-ins only.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const HOME = os.homedir();
const CLAUDE_DIR = process.env.CLAUDE_CONFIG_DIR || path.join(HOME, '.claude');
const APP_DIR = path.join(CLAUDE_DIR, 'claudedock');           // stable install location
const STATE_FILE = path.join(APP_DIR, 'state.json');          // keep-awake state
const PREV_STATUSLINE_FILE = path.join(APP_DIR, 'previous-statusline.json');
const SETTINGS_FILE = path.join(CLAUDE_DIR, 'settings.json');

const HOTKEY_LABEL = {
  darwin: 'Ctrl + Option + Cmd + K',
  win32: 'Ctrl + Alt + K',
  linux: '(bind it yourself, see README)',
};

// macOS Quick Action (gives us a system-wide hotkey without extra apps)
const MAC_SERVICE_NAME = 'ClaudeDock Toggle Awake';
const MAC_WORKFLOW = path.join(HOME, 'Library', 'Services', `${MAC_SERVICE_NAME}.workflow`);
const MAC_PBS_KEY = `(null) - ${MAC_SERVICE_NAME} - runWorkflowAsService`;
const MAC_KEY_EQUIVALENT = '@~^k'; // @ = Cmd, ~ = Option, ^ = Control

// Windows Start Menu shortcut (a .lnk with a Hotkey is system-wide)
const WIN_LNK = path.join(
  process.env.APPDATA || path.join(HOME, 'AppData', 'Roaming'),
  'Microsoft', 'Windows', 'Start Menu', 'Programs', `${MAC_SERVICE_NAME}.lnk`
);

function readJSON(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n');
  fs.renameSync(tmp, file);
}

// Reads ~/.claude/settings.json. Throws (instead of returning {}) when the file
// exists but is not valid JSON, so we never overwrite someone's settings.
function readSettings() {
  if (!fs.existsSync(SETTINGS_FILE)) return {};
  const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`${SETTINGS_FILE} is not valid JSON (${err.message}). Fix it first; nothing was changed.`);
  }
}

// Written in place (not tmp+rename) so a symlinked settings.json stays a symlink.
function writeSettings(settings) {
  fs.mkdirSync(CLAUDE_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2) + '\n');
}

const toSlash = (p) => p.replace(/\\/g, '/');

function isOurStatusLine(statusLine) {
  return Boolean(statusLine && typeof statusLine.command === 'string' && /claudedock[\\/]+statusline\.js/.test(statusLine.command));
}

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { encoding: 'utf8', windowsHide: true, ...opts });
}

// AppleScript string literal escaping
const asString = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

// Runs a shell command as root through the standard macOS password dialog.
function macAdminShell(shellCmd, prompt) {
  const script = `do shell script ${asString(shellCmd)} with prompt ${asString(prompt)} with administrator privileges`;
  const r = run('/usr/bin/osascript', ['-e', script]);
  if (r.status !== 0) {
    const why = (r.stderr || '').includes('-128') ? 'password dialog was cancelled' : (r.stderr || '').trim();
    throw new Error(`macOS did not allow it (${why || 'unknown error'})`);
  }
  return r.stdout;
}

function notify(message) {
  try {
    if (process.platform === 'darwin') {
      run('/usr/bin/osascript', ['-e', `display notification ${asString(message)} with title "ClaudeDock"`]);
    } else if (process.platform === 'linux') {
      run('notify-send', ['ClaudeDock', message]);
    } else if (process.platform === 'win32') {
      const msg = message.replace(/'/g, "''");
      const ps =
        "Add-Type -AssemblyName System.Windows.Forms; $n = New-Object System.Windows.Forms.NotifyIcon; " +
        "$n.Icon = [System.Drawing.SystemIcons]::Information; $n.Visible = $true; " +
        `$n.ShowBalloonTip(4000, 'ClaudeDock', '${msg}', 'Info'); Start-Sleep -Seconds 5; $n.Dispose()`;
      run('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', ps]);
    }
  } catch {
    // notifications are best effort
  }
}

module.exports = {
  fs, os, path, execFileSync,
  HOME, CLAUDE_DIR, APP_DIR, STATE_FILE, PREV_STATUSLINE_FILE, SETTINGS_FILE,
  HOTKEY_LABEL, MAC_SERVICE_NAME, MAC_WORKFLOW, MAC_PBS_KEY, MAC_KEY_EQUIVALENT, WIN_LNK,
  readJSON, writeJSON, readSettings, writeSettings, toSlash, isOurStatusLine, run, asString, macAdminShell, notify,
};
