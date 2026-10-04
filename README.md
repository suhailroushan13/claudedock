# ClaudeDock

**Three tools for [Claude Code](https://code.claude.com) in one plugin:**

- 📊 **Status bar:** model, effort, session usage and context, always visible
- ☕ **Keep-awake:** your Claude session keeps running when you close the laptop lid
- 📺 **Side browser:** watch Shorts or Reels, or play Subway Surfers, on the right side while Claude works

```
Opus 5.5 xhigh │ Session ██████░░░░ 58% ↻ 2h13m │ Context ███░░░░░░░ 61.2k/200k (31%) │ AWAKE 1h05m
```

| Segment | What it shows |
| --- | --- |
| **Model** | The model you're using, like `Opus 5.5`, `Sonnet 5.5` or `Haiku 4.5` |
| **Effort** | Current effort level: `low` · `medium` · `high` · `xhigh` · `max` (plus `fast` when fast mode is on) |
| **Session** | How much of your current 5-hour usage session you've used, as a progress bar, plus the time until it resets (`↻ 2h13m`). Green below 50%, yellow below 80%, red above |
| **Context** | Tokens in the context window out of the total, like `61.2k/200k`, plus the percentage |
| **AWAKE** | A yellow badge while keep-awake is on, so you never forget it |

The bar adapts to your terminal width: full bars when wide, shorter bars when medium, plain numbers when narrow.

> **Session** appears only on **Claude Pro / Max** plans, after Claude's first reply in a session. API-key users won't see that part. Everything else works for everyone.

---

## Contents

1. [Requirements](#1-requirements)
2. [Install in Claude Code (step by step)](#2-install-in-claude-code-step-by-step)
3. [Keep-awake: keep Claude working with the lid closed](#3-keep-awake-keep-claude-working-with-the-lid-closed)
4. [Side browser: Shorts, Reels and games next to Claude](#4-side-browser-shorts-reels-and-games-next-to-claude)
5. [Reload and update](#5-reload-and-update)
6. [Remove everything](#6-remove-everything)
7. [Command reference (`/claudedock:help`)](#7-command-reference)
8. [Troubleshooting](#8-troubleshooting)
9. [How it works](#9-how-it-works)
10. [For developers](#10-for-developers)

---

## 1. Requirements

- **Claude Code**, recent version. Update with:
  ```bash
  claude update
  ```
- **Node.js 18 or newer.** Check with:
  ```bash
  node -v
  ```
  Don't have it? Install it from [nodejs.org](https://nodejs.org).
- **macOS, Windows or Linux.**

---

## 2. Install in Claude Code (step by step)

### Step 1: Open Claude Code

In your terminal:

```bash
claude
```

### Step 2: Add the ClaudeDock marketplace

Type this in Claude Code and press Enter:

```
/plugin marketplace add suhailroushan13/claudedock
```

You should see: `Successfully added marketplace: claudedock`.

### Step 3: Install the plugin

```
/plugin install claudedock@claudedock
```

This opens the plugin panel. Choose **Install**. "User" scope is best, because it works in all your projects.

### Step 4: Reload plugins

This makes the new `/claudedock:...` commands available right away, without restarting:

```
/reload-plugins
```

### Step 5: Run setup

```
/claudedock:setup
```

This turns on the status bar and creates the keep-awake hotkey. You'll see a short summary when it's done.

### Step 6: Send any message

The status bar appears at the bottom of Claude Code after Claude's next reply. Type `hi` and you'll see it. 🎉

### Step 7: See everything you can do

```
/claudedock:help
```

This lists every ClaudeDock command with a short description.

### Step 8 (macOS only, optional but recommended)

Keep-awake needs admin rights on macOS. Run this **once**, so it never asks for your password again:

```
/claudedock:awake nopass
```

macOS shows a password dialog one time. After that, toggling is instant.

---

### Prefer the normal terminal? (same install, outside Claude Code)

```bash
claude plugin marketplace add suhailroushan13/claudedock
claude plugin install claudedock@claudedock
claude -p "/claudedock:setup"
```

### No plugin at all? (status bar + hotkey only)

```bash
git clone https://github.com/suhailroushan13/claudedock.git
node claudedock/plugins/claudedock/scripts/install.js
```

Without the plugin you don't get the `/claudedock:...` commands. Use the hotkey or `node ~/.claude/claudedock/awake.js on|off` instead.

### What setup changes on your computer

| What | Where |
| --- | --- |
| Copies the scripts | `~/.claude/claudedock/` |
| Sets `statusLine` | `~/.claude/settings.json`. If you already had a status line, it's saved and **restored when you remove ClaudeDock** |
| One-time settings backup | `~/.claude/settings.json.claudedock-backup` |
| Hotkey (macOS) | Quick Action `~/Library/Services/ClaudeDock Toggle Awake.workflow` |
| Hotkey (Windows) | Start Menu shortcut `ClaudeDock Toggle Awake.lnk` |

Nothing else in your settings is touched.

---

## 3. Keep-awake: keep Claude working with the lid closed

Turn keep-awake **ON** before you close the lid or walk away. The computer won't go to sleep, so a long Claude task keeps running and finishes. Turn it **OFF** when you're done.

### Turn it on and off

| How | What to do |
| --- | --- |
| ⌨️ **Hotkey: macOS** | **`Ctrl + Option + Cmd + K`**, works in any app |
| ⌨️ **Hotkey: Windows** | **`Ctrl + Alt + K`**, works anywhere |
| ⌨️ Hotkey: Linux | Bind `node ~/.claude/claudedock/awake.js toggle --notify` in your desktop's keyboard settings |
| Toggle in Claude Code | `/claudedock:awake` |
| Turn on | `/claudedock:awake on` |
| Turn off | `/claudedock:awake off` |
| Check | `/claudedock:awake status` |
| From any terminal | `node ~/.claude/claudedock/awake.js on` (or `off`, `toggle`, `status`) |

When you press the hotkey, a notification says **ON** or **OFF**, and the status bar shows the yellow **AWAKE** badge while it's on.

### What it does on each OS

- **macOS:** runs `pmset -a disablesleep 1`, which keeps the Mac awake even with the lid closed on battery. It needs your password, unless you ran `/claudedock:awake nopass`. That adds a sudoers rule allowing **only** `pmset -a disablesleep 0` and `pmset -a disablesleep 1`, nothing else. Removing ClaudeDock removes the rule.
- **Windows:** sets *"When I close the lid"* to **Do nothing** and sleep to **Never** (via `powercfg`). Your previous values are saved and **restored when you turn it off**. If you get an access error, run the command once from a terminal opened *as Administrator*.
- **Linux:** holds a `systemd-inhibit` lock for sleep, idle and lid switch. Best effort: some desktops (like GNOME) handle the lid themselves.

The screen still turns off as usual. Only *system sleep* is blocked.

> ⚠️ **Safety:** with keep-awake ON, a closed laptop stays fully running. **Keep the charger plugged in and don't put the laptop in a bag.** It can get hot and drain the battery. Turn it off when the task is done.

---

## 4. Side browser: Shorts, Reels and games next to Claude

Watch something or play a quick game while Claude works, right next to your terminal.

```
/claudedock:browse
```

That opens your default page (**Subway Surfers**) on the right side.

| Command | Opens |
| --- | --- |
| `/claudedock:browse` | Your default page (Subway Surfers unless you change it) |
| `/claudedock:browse subway` | [Subway Surfers](https://poki.com/en/g/subway-surfers) on Poki |
| `/claudedock:browse games` | All [Poki](https://poki.com/en) games |
| `/claudedock:browse shorts` | YouTube Shorts |
| `/claudedock:browse reels` | Instagram Reels (log in once) |
| `/claudedock:browse youtube` | YouTube |
| `/claudedock:browse tiktok` | TikTok |
| `/claudedock:browse example.com` | **Any website**: just type the address |

### Change your defaults

```
/claudedock:browse default shorts                                    # a preset...
/claudedock:browse default https://poki.com/en/g/temple-run-2        # ...or any URL
/claudedock:browse mode auto                                         # auto | pane | window
/claudedock:browse list                                              # presets + your settings
```

### Two ways it opens

| Mode | What you get | Best for |
| --- | --- | --- |
| **pane** | A split pane on the right side **inside your terminal**, running [Carbonyl](https://github.com/fathyb/carbonyl), a Chromium browser drawn with terminal characters. Lower resolution, but it lives in your terminal | YouTube Shorts, websites |
| **window** | A slim real browser window (Chrome, Brave or Edge) **docked to the right edge of your screen**. Full quality, sound, logins | Games (Subway Surfers), Reels, HD video |
| **auto** (default) | Games open in a **window**. Everything else opens in a **pane**, or in a window if your terminal can't split | Most people |

Force a mode just once with `--pane` or `--window`:

```
/claudedock:browse shorts --window
/claudedock:browse example.com --pane
```

**Where pane mode works:** iTerm2, tmux, WezTerm and kitty (with `allow_remote_control yes`) on macOS and Linux. Other terminals (macOS Terminal, Ghostty, VS Code, Windows) get the docked window instead.

**Good to know**

- The first pane launch downloads Carbonyl one time (~150 MB) through `npx`, so give it a minute.
- Games like Subway Surfers need WebGL, which Carbonyl can't do on macOS. That's why `auto` opens games in a window.
- The window uses its **own ClaudeDock browser profile**, separate from your normal browser. Log in to Instagram or YouTube there once and you stay logged in. Removing ClaudeDock deletes that profile.
- Your typing focus stays in Claude Code after the pane opens.
- To close it: press `Ctrl+C` in the pane (or `Cmd+W` in iTerm2), or close the window as usual.
- If your terminal is in macOS full-screen mode (the green button), the window opens on another Space. Use a maximized (not full-screen) terminal, or pane mode.

---

## 5. Reload and update

### Reload (after installing, updating, or editing the plugin)

```
/reload-plugins
```

This reloads every plugin in your current Claude Code session, so new or changed `/claudedock:...` commands work without restarting. You can also just quit and start `claude` again.

### Update to the newest version

Inside Claude Code:

```
/plugin marketplace update claudedock
/reload-plugins
/claudedock:setup
```

Or from the terminal:

```bash
claude plugin marketplace update claudedock
claude plugin update claudedock@claudedock
claude -p "/claudedock:setup"
```

> Always run `/claudedock:setup` after updating. It copies the new scripts into `~/.claude/claudedock/`, which is what the status bar actually runs.

### Turn the bar off for a while (without uninstalling)

```
/claudedock:remove
```

This removes the status bar and hotkey but keeps the plugin. Run `/claudedock:setup` to bring it back.

---

## 6. Remove everything

Do these **in order**. Step 1 needs the plugin to still be installed.

### Step 1: Run the ClaudeDock uninstaller

```
/claudedock:remove
```

It:

- turns keep-awake **OFF** and restores your sleep settings
- **restores your previous status line**, or removes it if you didn't have one
- deletes the hotkey (macOS Quick Action / Windows shortcut)
- removes the macOS password rule, if you added one (macOS may ask for your password)
- closes the ClaudeDock side browser and deletes its settings and logins
- deletes `~/.claude/claudedock/`

### Step 2: Uninstall the plugin

```
/plugin uninstall claudedock@claudedock
```

### Step 3: Remove the marketplace

```
/plugin marketplace remove claudedock
```

### Step 4: Reload

```
/reload-plugins
```

The `/claudedock:...` commands are now gone.

### Step 5 (optional): Delete the settings backup

```bash
rm ~/.claude/settings.json.claudedock-backup
```

(On Windows: delete `%USERPROFILE%\.claude\settings.json.claudedock-backup`.)

### Step 6 (optional): Free the Carbonyl download

If you used pane mode, Carbonyl (~150 MB) is cached by `npx`. To free the space:

```bash
rm -rf ~/.npm/_npx
```

(That only clears npx's download cache. Anything you run with `npx` later just downloads again.)

---

### Remove everything from the terminal instead

```bash
node ~/.claude/claudedock/uninstall.js
claude plugin uninstall claudedock@claudedock
claude plugin marketplace remove claudedock
rm -f ~/.claude/settings.json.claudedock-backup
```

> Already uninstalled the plugin before running `/claudedock:remove`? No problem. Run `node ~/.claude/claudedock/uninstall.js` from a terminal.

### Check that everything is gone

After removing, none of these should exist:

| OS | Leftover to check |
| --- | --- |
| All | `~/.claude/claudedock/` folder |
| All | A `statusLine` entry pointing to `claudedock` in `~/.claude/settings.json` |
| macOS | `~/Library/Services/ClaudeDock Toggle Awake.workflow` |
| macOS | `/etc/sudoers.d/claudedock` (remove with `sudo rm /etc/sudoers.d/claudedock`) |
| Windows | `%APPDATA%\Microsoft\Windows\Start Menu\Programs\ClaudeDock Toggle Awake.lnk` |

### Emergency: the computer won't sleep anymore

If the files are already gone but keep-awake is still on:

- **macOS:** `sudo pmset -a disablesleep 0`
- **Windows:** Settings → System → Power & battery → *Lid & power button controls* → set "closing the lid" back to **Sleep**, and set the sleep timer back
- **Linux:** `pkill -f "systemd-inhibit --what=sleep:idle:handle-lid-switch"`

---

## 7. Command reference

| Command | What it does |
| --- | --- |
| `/claudedock:help` | Show every command with a short description |
| `/claudedock:setup` | Install or refresh the status bar and hotkey |
| `/claudedock:awake` | Toggle keep-awake |
| `/claudedock:awake on` / `off` | Turn keep-awake on / off |
| `/claudedock:awake status` | Show whether keep-awake is on |
| `/claudedock:awake nopass` | macOS: stop asking for your password when toggling |
| `/claudedock:browse` | Open your default page (Subway Surfers) on the right side |
| `/claudedock:browse <preset>` | `subway`, `games`, `shorts`, `reels`, `youtube`, `tiktok` |
| `/claudedock:browse <url>` | Open any website |
| `/claudedock:browse <x> --pane` / `--window` | Force the terminal pane or the docked window this time |
| `/claudedock:browse default <preset or url>` | Change the default page |
| `/claudedock:browse mode <auto, pane or window>` | Change the default mode |
| `/claudedock:browse list` | Show presets and your current settings |
| `/claudedock:remove` | Remove the status bar, hotkey, password rule, browser profile and files |
| `/reload-plugins` | Reload plugins in the current session |
| `/plugin` | Open the plugin manager (browse, enable, disable, uninstall) |

---

## 8. Troubleshooting

**The status bar doesn't show up**
- Run `/claudedock:setup` again, then send a message.
- Switched Node versions (nvm/asdf)? Re-run `/claudedock:setup` so it picks up the new `node` path.
- Test the bar by hand:
  ```bash
  echo '{"model":{"id":"claude-opus-5-5"},"effort":{"level":"high"}}' | node ~/.claude/claudedock/statusline.js
  ```

**`/claudedock:setup` says "Unknown command"**
- Run `/reload-plugins`, or restart `claude`.
- Check that the plugin is installed and enabled: `/plugin` → **Installed**.

**No "Session" part**
- You're using an API key (not Pro/Max), or Claude hasn't replied yet in this session.

**macOS hotkey does nothing**
- Open **System Settings → Keyboard → Keyboard Shortcuts → Services → General**. Make sure **ClaudeDock Toggle Awake** is ticked and has a shortcut. You can change the shortcut there.
- A few apps don't support Services shortcuts. Try it from Finder or Terminal.

**Windows hotkey does nothing**
- Sign out and back in once, so Windows picks up the new Start Menu shortcut.

**`/claudedock:browse` pane doesn't open**
- Your terminal can't be split from a script, so use `--window`, or set `/claudedock:browse mode window`.
- iTerm2: the first time, macOS may ask to let iTerm2 control itself. Click **OK**.
- kitty: add `allow_remote_control yes` to `kitty.conf`.

**The pane stays blank or shows a game error**
- The first launch is downloading Carbonyl (~150 MB). Wait a minute.
- WebGL games don't run in the pane. Use `--window`.

**The browser window shows up somewhere else**
- Your terminal is in full-screen mode, so the window went to another Space. Use a maximized window instead.
- You need Chrome, Brave or Edge for the docked window. Without one, the page opens in your default browser.

**Weird colors or symbols**
- Set `NO_COLOR=1` in your environment for a plain-text bar.

---

## 9. How it works

- **Status bar:** Claude Code runs `statusline.js` after each message (and every 10 seconds), passing session info as JSON: model, effort, context window, rate limits. The script prints one colored line. It's plain Node, with no dependencies and no network calls, and it never uses tokens.
- **Keep-awake:** `awake.js` changes the OS sleep setting and saves its state in `~/.claude/claudedock/state.json`. The status bar reads that file to show the **AWAKE** badge.
- **Side browser:** `browse.js` either asks your terminal to split (iTerm2 through AppleScript, or the `tmux`, `wezterm` and `kitty` CLIs) and runs Carbonyl in the new pane, or starts Chrome/Brave/Edge in app mode with its own profile, sized to the right ~40% of your screen. Settings live in `~/.claude/claudedock/config.json`.
- **Hotkey:** Claude Code's own keybindings can't run scripts, so ClaudeDock adds a system-wide shortcut: a macOS Quick Action, or a Windows Start Menu shortcut. That way it works even when Claude Code isn't the focused window.

```
claudedock/
├── .claude-plugin/marketplace.json     # makes this repo installable with /plugin marketplace add
├── plugins/claudedock/
│   ├── .claude-plugin/plugin.json      # plugin name + version
│   ├── commands/
│   │   ├── help.md                     # /claudedock:help
│   │   ├── setup.md                    # /claudedock:setup
│   │   ├── awake.md                    # /claudedock:awake [on|off|status|nopass]
│   │   ├── browse.md                   # /claudedock:browse [preset|url]
│   │   └── remove.md                   # /claudedock:remove
│   └── scripts/
│       ├── statusline.js               # draws the bar
│       ├── awake.js                    # keep-awake for macOS / Windows / Linux
│       ├── hotkey.js                   # creates / removes the keyboard shortcut
│       ├── browse.js                   # side browser (terminal pane or docked window)
│       ├── install.js                  # setup
│       ├── uninstall.js                # remove
│       └── lib.js                      # shared paths + helpers
├── LICENSE
└── README.md
```

---

## 10. For developers

**Work on it locally:**

```bash
git clone git@github.com:suhailroushan13/claudedock.git
cd claudedock
claude plugin marketplace add ./
claude plugin install claudedock@claudedock
```

After editing:

- Commands (`commands/*.md`): run `/reload-plugins`.
- Scripts (`scripts/*.js`): run `/claudedock:setup` to copy them to `~/.claude/claudedock/`.

**Check before pushing:**

```bash
claude plugin validate .
claude plugin validate ./plugins/claudedock
echo '{"model":{"id":"claude-opus-5-5"},"effort":{"level":"xhigh"},"context_window":{"context_window_size":200000,"total_input_tokens":61234,"used_percentage":31}}' \
  | COLUMNS=130 node plugins/claudedock/scripts/statusline.js
CLAUDEDOCK_DRY_RUN=1 node plugins/claudedock/scripts/awake.js toggle   # changes state only, not real sleep settings
CLAUDEDOCK_DRY_RUN=1 node plugins/claudedock/scripts/browse.js shorts   # prints what it would open
```

**Release a new version:** bump `"version"` in `plugins/claudedock/.claude-plugin/plugin.json`, then commit and push. Users get it with the [update steps](#update-to-the-newest-version).

**Customize the bar:** edit `plugins/claudedock/scripts/statusline.js` (colors, segments, bar width), then run `/claudedock:setup`.

---

## License

[MIT](LICENSE) © suhailroushan13
