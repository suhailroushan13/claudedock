#!/usr/bin/env node
'use strict';
// ClaudeDock side browser: opens a URL on the right side, next to Claude Code.
//
//   node browse.js                         open your default (Subway Surfers)
//   node browse.js shorts                  open a preset
//   node browse.js example.com             open any URL
//   node browse.js shorts --pane|--window  force a mode for this time
//   node browse.js default <preset|url>    change the default URL
//   node browse.js mode <auto|pane|window> change the default mode
//   node browse.js list                    show presets and current settings
//
// pane   : Carbonyl (Chromium drawn inside the terminal) in a right split pane.
//          iTerm2, tmux, WezTerm and kitty. macOS and Linux only.
// window : a slim Chrome / Brave / Edge app window docked to the right edge of the
//          screen. Needed for WebGL games, which Carbonyl can't run on macOS.
// auto   : window for game sites (or when the terminal can't split), pane otherwise.

const { spawn } = require('child_process');
const L = require('./lib');
const { fs, os, path, APP_DIR, run, readJSON, writeJSON } = L;

const CONFIG_FILE = path.join(APP_DIR, 'config.json');
const PROFILE_DIR = path.join(APP_DIR, 'browser-profile');
const CARBONYL = 'carbonyl@0.0.2-next.bacf3db';
const DRY_RUN = process.env.CLAUDEDOCK_DRY_RUN === '1'; // print the plan, open nothing

const PRESETS = {
  subway: { url: 'https://poki.com/en/g/subway-surfers', about: 'Subway Surfers on Poki (game)' },
  games: { url: 'https://poki.com/en', about: 'Poki free online games' },
  shorts: { url: 'https://www.youtube.com/shorts', about: 'YouTube Shorts' },
  reels: { url: 'https://www.instagram.com/reels/', about: 'Instagram Reels (log in once)' },
  youtube: { url: 'https://www.youtube.com', about: 'YouTube' },
  tiktok: { url: 'https://www.tiktok.com/foryou', about: 'TikTok For You' },
};

// WebGL game sites: Carbonyl can't run these on macOS, so auto mode uses a window.
const GAME_HOSTS = /(^|\.)(poki\.com|crazygames\.com|y8\.com|miniclip\.com|friv\.com|coolmathgames\.com|itch\.io|kongregate\.com|armorgames\.com)$/i;

const DEFAULTS = { defaultUrl: 'subway', mode: 'auto' };
const loadConfig = () => ({ ...DEFAULTS, ...readJSON(CONFIG_FILE, {}) });
const saveConfig = (c) => writeJSON(CONFIG_FILE, c);

function resolveUrl(input) {
  const key = String(input || '').trim();
  if (PRESETS[key.toLowerCase()]) return PRESETS[key.toLowerCase()].url;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(key) ? key : `https://${key}`;
  let u;
  try {
    u = new URL(withScheme);
  } catch {
    u = null;
  }
  if (!u || !/^https?:$/.test(u.protocol) || !u.hostname.includes('.')) {
    throw new Error(`"${key}" is not a preset or a URL. Presets: ${Object.keys(PRESETS).join(', ')}`);
  }
  return u.href;
}

const shq = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;
const asString = L.asString;

// ------------------------------------------------------------------ pane (Carbonyl)

function detectTerminal() {
  const e = process.env;
  if (e.TMUX) return 'tmux';
  if (e.TERM_PROGRAM === 'iTerm.app' && process.platform === 'darwin') return 'iterm';
  if (e.WEZTERM_PANE) return 'wezterm';
  if (e.KITTY_WINDOW_ID) return 'kitty';
  return null;
}

const paneSupported = () => (process.platform === 'darwin' || process.platform === 'linux') && Boolean(detectTerminal());

// The pane runs a small generated script: no quoting games with each terminal's API,
// and PATH points at this Node so `npx` works even with nvm.
function writePaneScript(url) {
  const binDir = path.dirname(process.execPath);
  const script = path.join(APP_DIR, 'browser-pane.sh');
  fs.mkdirSync(APP_DIR, { recursive: true });
  fs.writeFileSync(
    script,
    [
      '#!/bin/sh',
      `export PATH=${shq(binDir)}:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin`,
      `printf '\\033]0;ClaudeDock browser\\007'`,
      `echo ${shq(`ClaudeDock: opening ${url}`)}`,
      `echo 'First time only: downloading the Carbonyl browser (~150 MB)...'`,
      `echo 'Quit: Ctrl+C  |  Address bar: click the top line'`,
      `exec npx --yes ${CARBONYL} ${shq(url)}`,
      '',
    ].join('\n'),
    { mode: 0o755 }
  );
  return script;
}

function openPane(url) {
  const term = detectTerminal();
  const script = writePaneScript(url);
  const cmd = `/bin/sh ${shq(script)}`;
  if (DRY_RUN) return `[dry run] ${term} split → ${cmd}`;

  if (term === 'iterm') {
    // Split the exact session Claude Code runs in, then give focus back to it.
    const id = (process.env.ITERM_SESSION_ID || '').split(':')[1] || '';
    const apple = `
      tell application "iTerm2"
        set origSession to missing value
        repeat with w in windows
          repeat with t in tabs of w
            repeat with s in sessions of t
              if unique id of s is ${asString(id)} then set origSession to s
            end repeat
          end repeat
        end repeat
        if origSession is missing value then set origSession to current session of current window
        tell origSession
          set newSession to (split vertically with default profile command ${asString(cmd)})
          select
        end tell
        return unique id of newSession
      end tell`;
    const r = run('/usr/bin/osascript', ['-e', apple]);
    if (r.status !== 0) throw new Error(`iTerm2 refused the split: ${(r.stderr || '').trim()}`);
    return 'iTerm2 split pane';
  }
  if (term === 'tmux') {
    let r = run('tmux', ['split-window', '-h', '-d', '-l', '50%', cmd]);
    if (r.status !== 0) r = run('tmux', ['split-window', '-h', '-d', '-p', '50', cmd]);
    if (r.status !== 0) throw new Error(`tmux refused the split: ${(r.stderr || '').trim()}`);
    return 'tmux split pane';
  }
  if (term === 'wezterm') {
    const r = run('wezterm', ['cli', 'split-pane', '--right', '--percent', '50', '--', '/bin/sh', script]);
    if (r.status !== 0) throw new Error(`WezTerm refused the split: ${(r.stderr || '').trim()}`);
    return 'WezTerm split pane';
  }
  if (term === 'kitty') {
    const r = run('kitty', ['@', 'launch', '--location=vsplit', '--keep-focus', '/bin/sh', script]);
    if (r.status !== 0) throw new Error('kitty refused the split. Add "allow_remote_control yes" to kitty.conf, or use --window');
    return 'kitty split pane';
  }
  throw new Error('this terminal cannot be split from a script');
}

// ------------------------------------------------------------------ window (real browser)

function screenArea() {
  try {
    if (process.platform === 'darwin') {
      const js =
        'ObjC.import("AppKit"); var s=$.NSScreen.mainScreen, v=s.visibleFrame, p=$.NSScreen.screens.objectAtIndex(0).frame;' +
        'JSON.stringify({x:v.origin.x, y:p.size.height-(v.origin.y+v.size.height), w:v.size.width, h:v.size.height})';
      return JSON.parse(run('/usr/bin/osascript', ['-l', 'JavaScript', '-e', js]).stdout);
    }
    if (process.platform === 'win32') {
      const ps = 'Add-Type -AssemblyName System.Windows.Forms; $a=[System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea; "$($a.X) $($a.Y) $($a.Width) $($a.Height)"';
      const [x, y, w, h] = run('powershell', ['-NoProfile', '-Command', ps]).stdout.trim().split(/\s+/).map(Number);
      if (w > 0 && h > 0) return { x, y, w, h };
    }
    if (process.platform === 'linux') {
      const m = (run('xrandr', ['--current']).stdout || '').match(/current (\d+) x (\d+)/);
      if (m) return { x: 0, y: 0, w: Number(m[1]), h: Number(m[2]) };
    }
  } catch {}
  return null;
}

function findBrowser() {
  if (process.platform === 'darwin') {
    for (const name of ['Google Chrome', 'Brave Browser', 'Microsoft Edge', 'Chromium', 'Vivaldi']) {
      for (const dir of ['/Applications', path.join(os.homedir(), 'Applications')]) {
        const app = path.join(dir, `${name}.app`);
        if (fs.existsSync(app)) return { name, app };
      }
    }
    return null;
  }
  if (process.platform === 'win32') return { name: 'Chrome or Edge' };
  for (const bin of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'brave-browser', 'microsoft-edge']) {
    if (run('sh', ['-c', `command -v ${bin}`]).status === 0) return { name: bin, bin };
  }
  return null;
}

function openWindow(url) {
  const area = screenArea();
  const flags = [`--app=${url}`, `--user-data-dir=${PROFILE_DIR}`, '--no-first-run', '--no-default-browser-check'];
  if (area) {
    const width = Math.round(Math.min(900, Math.max(420, area.w * 0.4)));
    flags.push(`--window-size=${width},${Math.round(area.h)}`, `--window-position=${Math.round(area.x + area.w - width)},${Math.round(area.y)}`);
  }
  const browser = findBrowser();
  if (DRY_RUN) return `[dry run] ${browser ? browser.name : 'default browser'} ${flags.join(' ')}`;

  if (process.platform === 'darwin') {
    if (!browser) {
      run('/usr/bin/open', [url]);
      return 'your default browser (install Chrome, Brave or Edge to dock it on the right)';
    }
    const r = run('/usr/bin/open', ['-na', browser.app, '--args', ...flags]);
    if (r.status !== 0) throw new Error(`could not start ${browser.name}: ${(r.stderr || '').trim()}`);
    return `${browser.name} window on the right`;
  }
  if (process.platform === 'win32') {
    // `start` finds chrome/msedge through App Paths; Edge ships with Windows.
    const quoted = flags.map((f) => `"${f}"`).join(' ');
    let r = run('cmd', ['/c', `start "" chrome ${quoted}`]);
    if (r.status !== 0) r = run('cmd', ['/c', `start "" msedge ${quoted}`]);
    if (r.status !== 0) throw new Error('could not start Chrome or Edge');
    return 'browser window on the right';
  }
  if (browser) {
    spawn(browser.bin, flags, { detached: true, stdio: 'ignore' }).unref();
    return `${browser.name} window on the right`;
  }
  spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
  return 'your default browser';
}

// ------------------------------------------------------------------ main

function pickMode(url, forced, config) {
  const mode = forced || config.mode;
  if (mode === 'window') return 'window';
  if (mode === 'pane') {
    if (!paneSupported()) throw new Error('this terminal cannot open a split pane from a script (works in iTerm2, tmux, WezTerm, kitty on macOS/Linux). Use --window instead.');
    return 'pane';
  }
  if (GAME_HOSTS.test(new URL(url).hostname)) return 'window';
  return paneSupported() ? 'pane' : 'window';
}

function list(config) {
  const lines = ['Presets:'];
  for (const [k, v] of Object.entries(PRESETS)) lines.push(`  ${k.padEnd(8)} ${v.about}  ${v.url}`);
  lines.push('', `Default URL : ${config.defaultUrl}`, `Default mode: ${config.mode}  (auto = games in a window, everything else in a terminal pane)`);
  lines.push(`This terminal can split: ${paneSupported() ? 'yes' : 'no (pane mode falls back to a window)'}`);
  return lines.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const forced = args.includes('--pane') ? 'pane' : args.includes('--window') ? 'window' : null;
  const words = args.filter((a) => !a.startsWith('--'));
  const config = loadConfig();
  const first = (words[0] || '').toLowerCase();

  if (first === 'list' || first === 'help') return console.log(list(config));

  if (first === 'default') {
    if (!words[1]) return console.log(`Default URL: ${config.defaultUrl}`);
    resolveUrl(words[1]); // validate
    config.defaultUrl = PRESETS[words[1].toLowerCase()] ? words[1].toLowerCase() : resolveUrl(words[1]);
    saveConfig(config);
    return console.log(`Default URL is now ${config.defaultUrl}. Run /claudedock:browse to open it.`);
  }

  if (first === 'mode') {
    const m = (words[1] || '').toLowerCase();
    if (!['auto', 'pane', 'window'].includes(m)) return console.log(`Default mode: ${config.mode}. Choose auto, pane or window.`);
    config.mode = m;
    saveConfig(config);
    return console.log(`Default mode is now ${m}.`);
  }

  const url = resolveUrl(words[0] || config.defaultUrl);
  const mode = pickMode(url, forced, config);
  const where = mode === 'pane' ? openPane(url) : openWindow(url);
  let tips =
    mode === 'pane'
      ? 'Quit with Ctrl+C in that pane. The first launch downloads Carbonyl (~150 MB), so give it a minute.'
      : 'Close it like any window. Logins (Instagram, YouTube) stay saved in this ClaudeDock browser.';
  if (mode === 'pane' && GAME_HOSTS.test(new URL(url).hostname)) {
    tips += ' Note: WebGL games usually do not run inside the terminal. If it stays blank, use --window.';
  }
  console.log(`Opened ${url} in a ${where}. ${tips}`);
}

try {
  main();
} catch (err) {
  console.error(`ClaudeDock browse: ${err.message}`);
  process.exit(1);
}
