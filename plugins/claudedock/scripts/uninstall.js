#!/usr/bin/env node
'use strict';
// ClaudeDock uninstaller: turns keep-awake off (restoring power settings), removes
// the hotkey, restores your previous status line and deletes ~/.claude/claudedock.

const L = require('./lib');
const hotkey = require('./hotkey');
const { setAwake, macRemoveNopass, SUDOERS } = require('./awake');
const { fs, APP_DIR, STATE_FILE, PREV_STATUSLINE_FILE } = L;

async function main() {
  const out = ['ClaudeDock removed.'];

  // Read settings first: a broken settings.json stops us before anything changes.
  const settings = L.readSettings();

  // 1. Keep-awake off first, so the computer can sleep normally again.
  if (L.readJSON(STATE_FILE, {}).awake) {
    try {
      await setAwake(false);
      out.push('  Keep-awake : turned OFF, normal sleep restored');
    } catch (err) {
      throw new Error(`could not turn keep-awake off (${err.message}). Run /claudedock:awake off, then try again.`);
    }
  }

  // 2. Status line: put back the one you had before, or remove ours.
  if (L.isOurStatusLine(settings.statusLine)) {
    const previous = L.readJSON(PREV_STATUSLINE_FILE, null);
    if (previous) settings.statusLine = previous;
    else delete settings.statusLine;
    L.writeSettings(settings);
    out.push(`  Status bar : ${previous ? 'your previous status line is restored' : 'removed'}`);
  } else {
    out.push('  Status bar : not ours, left untouched');
  }

  // 3. Hotkey.
  out.push(`  Hotkey     : ${hotkey.remove() ? 'removed' : 'nothing to remove'}`);

  // 4. macOS passwordless rule, if `nopass` was used.
  if (process.platform === 'darwin' && fs.existsSync(SUDOERS)) {
    try {
      macRemoveNopass();
      out.push('  Password rule : removed');
    } catch {
      out.push(`  Password rule : still there. Remove it with: sudo rm ${SUDOERS}`);
    }
  }

  // 5. Files.
  fs.rmSync(APP_DIR, { recursive: true, force: true });
  out.push(`  Files      : deleted ${APP_DIR}`);

  out.push(
    '',
    'If you installed it as a plugin, also run in Claude Code:',
    '  /plugin uninstall claudedock@claudedock',
    '  /plugin marketplace remove claudedock'
  );
  console.log(out.join('\n'));
}

main().catch((err) => {
  console.error(`ClaudeDock uninstall stopped: ${err.message}`);
  process.exit(1);
});
