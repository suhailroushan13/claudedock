#!/usr/bin/env node
'use strict';
// ClaudeDock installer: copies the scripts to ~/.claude/claudedock, points the
// Claude Code statusLine at them and sets up the keep-awake hotkey.
//
//   node install.js [--no-hotkey]

const L = require('./lib');
const hotkey = require('./hotkey');
const { fs, path, APP_DIR, SETTINGS_FILE, PREV_STATUSLINE_FILE } = L;

function main() {
  const major = Number(process.versions.node.split('.')[0]);
  if (major < 16) throw new Error(`Node ${process.versions.node} is too old. Install Node 18 or newer.`);

  // Read settings first: a broken settings.json stops us before anything changes.
  const settings = L.readSettings();

  // 1. Copy the scripts to a stable place (plugin cache paths change on every update).
  fs.mkdirSync(APP_DIR, { recursive: true });
  if (path.resolve(__dirname) !== path.resolve(APP_DIR)) {
    for (const f of fs.readdirSync(__dirname).filter((f) => f.endsWith('.js'))) {
      fs.copyFileSync(path.join(__dirname, f), path.join(APP_DIR, f));
    }
  }

  // 2. Remember the status line you had before, so uninstall can put it back.
  if (settings.statusLine && !L.isOurStatusLine(settings.statusLine)) {
    L.writeJSON(PREV_STATUSLINE_FILE, settings.statusLine);
  } else if (!settings.statusLine) {
    fs.rmSync(PREV_STATUSLINE_FILE, { force: true });
  }

  const backup = `${SETTINGS_FILE}.claudedock-backup`;
  if (fs.existsSync(SETTINGS_FILE) && !fs.existsSync(backup)) fs.copyFileSync(SETTINGS_FILE, backup);

  // Windows: bare `node` works in both Git Bash and PowerShell. macOS/Linux: the
  // absolute path, because nvm/asdf shims are often missing from Claude Code's shell.
  const statusScript = L.toSlash(path.join(APP_DIR, 'statusline.js'));
  const nodeCmd = process.platform === 'win32' ? 'node' : `"${process.execPath}"`;
  settings.statusLine = {
    type: 'command',
    command: `${nodeCmd} "${statusScript}"`,
    padding: 0,
    refreshInterval: 10,
  };
  L.writeSettings(settings);

  // 3. Hotkey for keep-awake.
  const awakeScript = path.join(APP_DIR, 'awake.js');
  const hotkeyResult = process.argv.includes('--no-hotkey') ? 'skipped (--no-hotkey)' : hotkey.install(process.execPath, awakeScript);

  const lines = [
    'ClaudeDock installed.',
    `  Status bar : ON. It appears after Claude's next reply (no restart needed).`,
    `  Files      : ${APP_DIR}`,
    `  Keep-awake : /claudedock:awake [on|off|status]   (or: node "${awakeScript}" on)`,
    `  Hotkey     : ${hotkeyResult}`,
  ];
  if (process.platform === 'darwin') {
    lines.push('  macOS tip  : run /claudedock:awake nopass once so the toggle stops asking for your password.');
  }
  lines.push(`  Remove     : /claudedock:remove   (or: node "${path.join(APP_DIR, 'uninstall.js')}")`);
  console.log(lines.join('\n'));
}

try {
  main();
} catch (err) {
  console.error(`ClaudeDock install failed: ${err.message}`);
  process.exit(1);
}
