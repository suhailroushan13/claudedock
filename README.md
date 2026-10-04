# SuhailBar

**A custom status bar for [Claude Code](https://code.claude.com), plus a keep-awake switch so your Claude session keeps running when you close the laptop lid.**

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
4. [Reload and update](#4-reload-and-update)
5. [Remove everything](#5-remove-everything)
6. [Command reference](#6-command-reference)
7. [Troubleshooting](#7-troubleshooting)
8. [How it works](#8-how-it-works)
9. [For developers](#9-for-developers)

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

### Step 2: Add the SuhailBar marketplace

Type this in Claude Code and press Enter:

```
/plugin marketplace add suhailroushan13/suhailbarplugin
```

You should see: `Successfully added marketplace: suhailbarplugin`.

### Step 3: Install the plugin

```
/plugin install suhailbar@suhailbarplugin
```

This opens the plugin panel. Choose **Install**. "User" scope is best, because it works in all your projects.

### Step 4: Reload plugins

This makes the new `/suhailbar:...` commands available right away, without restarting:

```
/reload-plugins
```

### Step 5: Run setup

```
/suhailbar:setup
```

This turns on the status bar and creates the keep-awake hotkey. You'll see a short summary when it's done.

### Step 6: Send any message

The status bar appears at the bottom of Claude Code after Claude's next reply. Type `hi` and you'll see it. 🎉

### Step 7 (macOS only, optional but recommended)

Keep-awake needs admin rights on macOS. Run this **once**, so it never asks for your password again:

```
/suhailbar:awake nopass
```

macOS shows a password dialog one time. After that, toggling is instant.

---

### Prefer the normal terminal? (same install, outside Claude Code)

```bash
claude plugin marketplace add suhailroushan13/suhailbarplugin
claude plugin install suhailbar@suhailbarplugin
claude -p "/suhailbar:setup"
```

### No plugin at all? (status bar + hotkey only)

```bash
git clone https://github.com/suhailroushan13/suhailbarplugin.git
node suhailbarplugin/plugins/suhailbar/scripts/install.js
```

Without the plugin you don't get the `/suhailbar:...` commands. Use the hotkey or `node ~/.claude/suhailbar/awake.js on|off` instead.

### What setup changes on your computer

| What | Where |
| --- | --- |
| Copies the scripts | `~/.claude/suhailbar/` |
| Sets `statusLine` | `~/.claude/settings.json`. If you already had a status line, it's saved and **restored when you remove SuhailBar** |
| One-time settings backup | `~/.claude/settings.json.suhailbar-backup` |
| Hotkey (macOS) | Quick Action `~/Library/Services/SuhailBar Toggle Awake.workflow` |
| Hotkey (Windows) | Start Menu shortcut `SuhailBar Toggle Awake.lnk` |

Nothing else in your settings is touched.

---

## 3. Keep-awake: keep Claude working with the lid closed

Turn keep-awake **ON** before you close the lid or walk away. The computer won't go to sleep, so a long Claude task keeps running and finishes. Turn it **OFF** when you're done.

### Turn it on and off

| How | What to do |
| --- | --- |
| ⌨️ **Hotkey: macOS** | **`Ctrl + Option + Cmd + K`**, works in any app |
| ⌨️ **Hotkey: Windows** | **`Ctrl + Alt + K`**, works anywhere |
| ⌨️ Hotkey: Linux | Bind `node ~/.claude/suhailbar/awake.js toggle --notify` in your desktop's keyboard settings |
| Toggle in Claude Code | `/suhailbar:awake` |
| Turn on | `/suhailbar:awake on` |
| Turn off | `/suhailbar:awake off` |
| Check | `/suhailbar:awake status` |
| From any terminal | `node ~/.claude/suhailbar/awake.js on` (or `off`, `toggle`, `status`) |

When you press the hotkey, a notification says **ON** or **OFF**, and the status bar shows the yellow **AWAKE** badge while it's on.

### What it does on each OS

- **macOS:** runs `pmset -a disablesleep 1`, which keeps the Mac awake even with the lid closed on battery. It needs your password, unless you ran `/suhailbar:awake nopass`. That adds a sudoers rule allowing **only** `pmset -a disablesleep 0` and `pmset -a disablesleep 1`, nothing else. Removing SuhailBar removes the rule.
- **Windows:** sets *"When I close the lid"* to **Do nothing** and sleep to **Never** (via `powercfg`). Your previous values are saved and **restored when you turn it off**. If you get an access error, run the command once from a terminal opened *as Administrator*.
- **Linux:** holds a `systemd-inhibit` lock for sleep, idle and lid switch. Best effort: some desktops (like GNOME) handle the lid themselves.

The screen still turns off as usual. Only *system sleep* is blocked.

> ⚠️ **Safety:** with keep-awake ON, a closed laptop stays fully running. **Keep the charger plugged in and don't put the laptop in a bag.** It can get hot and drain the battery. Turn it off when the task is done.

---

## 4. Reload and update

### Reload (after installing, updating, or editing the plugin)

```
/reload-plugins
```

This reloads every plugin in your current Claude Code session, so new or changed `/suhailbar:...` commands work without restarting. You can also just quit and start `claude` again.

### Update to the newest version

Inside Claude Code:

```
/plugin marketplace update suhailbarplugin
/reload-plugins
/suhailbar:setup
```

Or from the terminal:

```bash
claude plugin marketplace update suhailbarplugin
claude plugin update suhailbar@suhailbarplugin
claude -p "/suhailbar:setup"
```

> Always run `/suhailbar:setup` after updating. It copies the new scripts into `~/.claude/suhailbar/`, which is what the status bar actually runs.

### Turn the bar off for a while (without uninstalling)

```
/suhailbar:remove
```

This removes the status bar and hotkey but keeps the plugin. Run `/suhailbar:setup` to bring it back.

---

## 5. Remove everything

Do these **in order**. Step 1 needs the plugin to still be installed.

### Step 1: Run the SuhailBar uninstaller

```
/suhailbar:remove
```

It:

- turns keep-awake **OFF** and restores your sleep settings
- **restores your previous status line**, or removes it if you didn't have one
- deletes the hotkey (macOS Quick Action / Windows shortcut)
- removes the macOS password rule, if you added one (macOS may ask for your password)
- deletes `~/.claude/suhailbar/`

### Step 2: Uninstall the plugin

```
/plugin uninstall suhailbar@suhailbarplugin
```

### Step 3: Remove the marketplace

```
/plugin marketplace remove suhailbarplugin
```

### Step 4: Reload

```
/reload-plugins
```

The `/suhailbar:...` commands are now gone.

### Step 5 (optional): Delete the settings backup

```bash
rm ~/.claude/settings.json.suhailbar-backup
```

(On Windows: delete `%USERPROFILE%\.claude\settings.json.suhailbar-backup`.)

---

### Remove everything from the terminal instead

```bash
node ~/.claude/suhailbar/uninstall.js
claude plugin uninstall suhailbar@suhailbarplugin
claude plugin marketplace remove suhailbarplugin
rm -f ~/.claude/settings.json.suhailbar-backup
```

> Already uninstalled the plugin before running `/suhailbar:remove`? No problem. Run `node ~/.claude/suhailbar/uninstall.js` from a terminal.

### Check that everything is gone

After removing, none of these should exist:

| OS | Leftover to check |
| --- | --- |
| All | `~/.claude/suhailbar/` folder |
| All | A `statusLine` entry pointing to `suhailbar` in `~/.claude/settings.json` |
| macOS | `~/Library/Services/SuhailBar Toggle Awake.workflow` |
| macOS | `/etc/sudoers.d/suhailbar` (remove with `sudo rm /etc/sudoers.d/suhailbar`) |
| Windows | `%APPDATA%\Microsoft\Windows\Start Menu\Programs\SuhailBar Toggle Awake.lnk` |

### Emergency: the computer won't sleep anymore

If the files are already gone but keep-awake is still on:

- **macOS:** `sudo pmset -a disablesleep 0`
- **Windows:** Settings → System → Power & battery → *Lid & power button controls* → set "closing the lid" back to **Sleep**, and set the sleep timer back
- **Linux:** `pkill -f "systemd-inhibit --what=sleep:idle:handle-lid-switch"`

---

## 6. Command reference

| Command | What it does |
| --- | --- |
| `/suhailbar:setup` | Install or refresh the status bar and hotkey |
| `/suhailbar:awake` | Toggle keep-awake |
| `/suhailbar:awake on` / `off` | Turn keep-awake on / off |
| `/suhailbar:awake status` | Show whether keep-awake is on |
| `/suhailbar:awake nopass` | macOS: stop asking for your password when toggling |
| `/suhailbar:remove` | Remove the status bar, hotkey, password rule and files |
| `/reload-plugins` | Reload plugins in the current session |
| `/plugin` | Open the plugin manager (browse, enable, disable, uninstall) |

---

## 7. Troubleshooting

**The status bar doesn't show up**
- Run `/suhailbar:setup` again, then send a message.
- Switched Node versions (nvm/asdf)? Re-run `/suhailbar:setup` so it picks up the new `node` path.
- Test the bar by hand:
  ```bash
  echo '{"model":{"id":"claude-opus-5-5"},"effort":{"level":"high"}}' | node ~/.claude/suhailbar/statusline.js
  ```

**`/suhailbar:setup` says "Unknown command"**
- Run `/reload-plugins`, or restart `claude`.
- Check that the plugin is installed and enabled: `/plugin` → **Installed**.

**No "Session" part**
- You're using an API key (not Pro/Max), or Claude hasn't replied yet in this session.

**macOS hotkey does nothing**
- Open **System Settings → Keyboard → Keyboard Shortcuts → Services → General**. Make sure **SuhailBar Toggle Awake** is ticked and has a shortcut. You can change the shortcut there.
- A few apps don't support Services shortcuts. Try it from Finder or Terminal.

**Windows hotkey does nothing**
- Sign out and back in once, so Windows picks up the new Start Menu shortcut.

**Weird colors or symbols**
- Set `NO_COLOR=1` in your environment for a plain-text bar.

---

## 8. How it works

- **Status bar:** Claude Code runs `statusline.js` after each message (and every 10 seconds), passing session info as JSON: model, effort, context window, rate limits. The script prints one colored line. It's plain Node, with no dependencies and no network calls, and it never uses tokens.
- **Keep-awake:** `awake.js` changes the OS sleep setting and saves its state in `~/.claude/suhailbar/state.json`. The status bar reads that file to show the **AWAKE** badge.
- **Hotkey:** Claude Code's own keybindings can't run scripts, so SuhailBar adds a system-wide shortcut: a macOS Quick Action, or a Windows Start Menu shortcut. That way it works even when Claude Code isn't the focused window.

```
suhailbarplugin/
├── .claude-plugin/marketplace.json     # makes this repo installable with /plugin marketplace add
├── plugins/suhailbar/
│   ├── .claude-plugin/plugin.json      # plugin name + version
│   ├── commands/
│   │   ├── setup.md                    # /suhailbar:setup
│   │   ├── awake.md                    # /suhailbar:awake [on|off|status|nopass]
│   │   └── remove.md                   # /suhailbar:remove
│   └── scripts/
│       ├── statusline.js               # draws the bar
│       ├── awake.js                    # keep-awake for macOS / Windows / Linux
│       ├── hotkey.js                   # creates / removes the keyboard shortcut
│       ├── install.js                  # setup
│       ├── uninstall.js                # remove
│       └── lib.js                      # shared paths + helpers
├── LICENSE
└── README.md
```

---

## 9. For developers

**Work on it locally:**

```bash
git clone git@github.com:suhailroushan13/suhailbarplugin.git
cd suhailbarplugin
claude plugin marketplace add ./
claude plugin install suhailbar@suhailbarplugin
```

After editing:

- Commands (`commands/*.md`): run `/reload-plugins`.
- Scripts (`scripts/*.js`): run `/suhailbar:setup` to copy them to `~/.claude/suhailbar/`.

**Check before pushing:**

```bash
claude plugin validate .
claude plugin validate ./plugins/suhailbar
echo '{"model":{"id":"claude-opus-5-5"},"effort":{"level":"xhigh"},"context_window":{"context_window_size":200000,"total_input_tokens":61234,"used_percentage":31}}' \
  | COLUMNS=130 node plugins/suhailbar/scripts/statusline.js
SUHAILBAR_DRY_RUN=1 node plugins/suhailbar/scripts/awake.js toggle   # changes state only, not real sleep settings
```

**Release a new version:** bump `"version"` in `plugins/suhailbar/.claude-plugin/plugin.json`, then commit and push. Users get it with the [update steps](#update-to-the-newest-version).

**Customize the bar:** edit `plugins/suhailbar/scripts/statusline.js` (colors, segments, bar width), then run `/suhailbar:setup`.

---

## License

[MIT](LICENSE) © suhailroushan13
