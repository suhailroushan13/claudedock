#!/usr/bin/env node
'use strict';
// SuhailBar keep-awake: stops the computer from sleeping (even with the lid closed)
// so a running Claude Code session keeps working.
//
//   node awake.js [toggle|on|off|status|nopass] [--notify]
//
// macOS   : pmset -a disablesleep 1/0 (needs admin: password dialog, or run `nopass` once)
// Windows : powercfg lid action "Do nothing" + no idle sleep; old values restored on off
// Linux   : systemd-inhibit (sleep, idle, lid switch) held by a background process

const { spawn } = require('child_process');
const L = require('./lib');
const { fs, os, path, STATE_FILE, HOTKEY_LABEL, run, macAdminShell, notify, readJSON, writeJSON } = L;

const DRY_RUN = process.env.SUHAILBAR_DRY_RUN === '1'; // for testing: change state only, not the OS

const loadState = () => readJSON(STATE_FILE, { awake: false });
const saveState = (s) => writeJSON(STATE_FILE, s);

// ---------------------------------------------------------------- macOS
const PMSET = '/usr/bin/pmset';
const SUDOERS = '/etc/sudoers.d/suhailbar';

const mac = {
  isOn: () => /SleepDisabled\s+1/.test(run(PMSET, ['-g']).stdout || ''),
  set(on) {
    const v = on ? '1' : '0';
    // Passwordless if `nopass` was run (sudoers rule limited to exactly these two commands)
    if (run('/usr/bin/sudo', ['-n', PMSET, '-a', 'disablesleep', v]).status === 0) return;
    macAdminShell(`${PMSET} -a disablesleep ${v}`, `SuhailBar wants to turn keep-awake ${on ? 'ON' : 'OFF'}.`);
  },
};

function macNopass() {
  const user = os.userInfo().username;
  if (!/^[A-Za-z0-9._-]+$/.test(user)) throw new Error(`unexpected username "${user}"`);
  const tmp = path.join(os.tmpdir(), `suhailbar-sudoers-${process.pid}`);
  fs.writeFileSync(
    tmp,
    `# Added by SuhailBar (removed by /suhailbar:remove)\n` +
      `${user} ALL=(root) NOPASSWD: ${PMSET} -a disablesleep 0, ${PMSET} -a disablesleep 1\n`
  );
  try {
    macAdminShell(
      `/usr/sbin/visudo -cf '${tmp}' && /usr/bin/install -m 0440 -o root -g wheel '${tmp}' ${SUDOERS}`,
      'SuhailBar wants to let you toggle keep-awake without typing your password every time.'
    );
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

function macRemoveNopass() {
  if (!fs.existsSync(SUDOERS)) return false;
  macAdminShell(`/bin/rm -f ${SUDOERS}`, 'SuhailBar wants to remove its passwordless keep-awake rule.');
  return true;
}

// ---------------------------------------------------------------- Windows
const win = {
  // Returns {ac, dc} or null. The last two hex numbers in powercfg output are the
  // current AC and DC values, which works on every Windows language.
  query(sub, setting) {
    const r = run('powercfg', ['/query', 'SCHEME_CURRENT', sub, setting]);
    const hex = (r.status === 0 && (r.stdout || '').match(/0x[0-9a-f]+/gi)) || [];
    return hex.length >= 2 ? { ac: parseInt(hex[hex.length - 2], 16), dc: parseInt(hex[hex.length - 1], 16) } : null;
  },
  apply(sub, setting, v) {
    for (const [flag, val] of [['/setacvalueindex', v.ac], ['/setdcvalueindex', v.dc]]) {
      const r = run('powercfg', [flag, 'SCHEME_CURRENT', sub, setting, String(val)]);
      if (r.status !== 0) {
        throw new Error(`powercfg failed: ${(r.stderr || r.stdout || '').trim()} (try again from a terminal opened "as Administrator")`);
      }
    }
  },
  isOn: (state) => Boolean(state.awake),
  set(on, state) {
    if (on) {
      state.prev = { lid: win.query('SUB_BUTTONS', 'LIDACTION'), standby: win.query('SUB_SLEEP', 'STANDBYIDLE') };
      if (state.prev.lid) win.apply('SUB_BUTTONS', 'LIDACTION', { ac: 0, dc: 0 }); // 0 = Do nothing
      win.apply('SUB_SLEEP', 'STANDBYIDLE', { ac: 0, dc: 0 }); // 0 = Never
    } else {
      const prev = state.prev || {};
      if (prev.lid || win.query('SUB_BUTTONS', 'LIDACTION')) win.apply('SUB_BUTTONS', 'LIDACTION', prev.lid || { ac: 1, dc: 1 });
      win.apply('SUB_SLEEP', 'STANDBYIDLE', prev.standby || { ac: 1800, dc: 900 });
      delete state.prev;
    }
    run('powercfg', ['/setactive', 'SCHEME_CURRENT']);
  },
};

// ---------------------------------------------------------------- Linux
const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const linux = {
  isOn: (state) => Boolean(state.pid && alive(state.pid)),
  async set(on, state) {
    if (on) {
      const child = spawn(
        'systemd-inhibit',
        ['--what=sleep:idle:handle-lid-switch', '--who=SuhailBar', '--why=Keep Claude Code running', '--mode=block', 'sleep', 'infinity'],
        { detached: true, stdio: 'ignore' }
      );
      child.on('error', () => {});
      child.unref();
      await new Promise((r) => setTimeout(r, 400));
      if (!child.pid || !alive(child.pid)) throw new Error('systemd-inhibit is not available on this system');
      state.pid = child.pid;
    } else {
      if (state.pid) {
        try {
          process.kill(-state.pid, 'SIGTERM'); // whole group: systemd-inhibit and its `sleep`
        } catch {
          try { process.kill(state.pid, 'SIGTERM'); } catch {}
        }
      }
      delete state.pid;
    }
  },
};

// ---------------------------------------------------------------- main
const IMPL = { darwin: mac, win32: win, linux }[process.platform];

function currentlyOn(state) {
  return DRY_RUN ? Boolean(state.awake) : IMPL.isOn(state);
}

async function setAwake(target) {
  if (!IMPL) throw new Error(`keep-awake is not supported on ${process.platform}`);
  const state = loadState();
  const current = currentlyOn(state);
  if (current === target) {
    if (Boolean(state.awake) !== current) {
      state.awake = current;
      state.since = current ? Date.now() : undefined;
      saveState(state);
    }
    return { changed: false, on: current };
  }
  if (!DRY_RUN) await IMPL.set(target, state);
  state.awake = target;
  state.since = target ? Date.now() : undefined;
  saveState(state);
  return { changed: true, on: target };
}

const offHint = () => `Turn it off with /suhailbar:awake off${process.platform === 'linux' ? '' : ` or ${HOTKEY_LABEL[process.platform]}`}.`;

function describe({ changed, on }) {
  if (on) {
    return (
      `${changed ? 'Keep-awake is now ON.' : 'Keep-awake is already ON.'} ` +
      `The computer will not sleep, even with the lid closed, so Claude keeps working. ` +
      `Keep the charger in and don't put the laptop in a bag while it's on. ${offHint()}`
    );
  }
  return changed ? 'Keep-awake is now OFF. Normal sleep is back.' : 'Keep-awake is already OFF.';
}

async function main() {
  const args = process.argv.slice(2);
  const wantNotify = args.includes('--notify');
  const cmd = (args.find((a) => !a.startsWith('--')) || 'toggle').toLowerCase();

  if (cmd === 'help' || cmd === '-h') {
    console.log('Usage: awake.js [toggle|on|off|status|nopass] [--notify]');
    return;
  }
  if (!IMPL) throw new Error(`keep-awake is not supported on ${process.platform}`);

  if (cmd === 'status') {
    const state = loadState();
    const on = currentlyOn(state);
    console.log(`Keep-awake is ${on ? 'ON' : 'OFF'}.${on && state.since ? ` On since ${new Date(state.since).toLocaleTimeString()}.` : ''}`);
    if (process.platform === 'darwin') {
      console.log(fs.existsSync(SUDOERS) ? 'Passwordless toggling: enabled.' : 'Passwordless toggling: off (run /suhailbar:awake nopass to enable).');
    }
    return;
  }

  if (cmd === 'nopass') {
    if (process.platform !== 'darwin') {
      console.log('Not needed on this OS: toggling never asks for a password here.');
      return;
    }
    macNopass();
    console.log('Done. Keep-awake now toggles without asking for your password (only `pmset -a disablesleep 0/1` is allowed).');
    return;
  }

  const target = cmd === 'on' ? true : cmd === 'off' ? false : cmd === 'toggle' ? !currentlyOn(loadState()) : null;
  if (target === null) throw new Error(`unknown option "${cmd}". Use on, off, toggle, status or nopass.`);

  const result = await setAwake(target);
  console.log(describe(result));
  if (wantNotify) notify(result.on ? 'Keep-awake ON: safe to close the lid' : 'Keep-awake OFF: normal sleep restored');
}

module.exports = { setAwake, macRemoveNopass, SUDOERS };

if (require.main === module) {
  main().catch((err) => {
    console.error(`SuhailBar: ${err.message}`);
    if (process.argv.includes('--notify')) notify(`Failed: ${err.message}`);
    process.exit(1);
  });
}
