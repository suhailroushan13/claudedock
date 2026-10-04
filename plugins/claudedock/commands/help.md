---
description: Show every ClaudeDock command and what it does
---

Show the user exactly the following, as-is, without running anything:

**ClaudeDock commands**

| Command | What it does |
| --- | --- |
| `/claudedock:help` | Show this list |
| `/claudedock:setup` | Turn on the status bar (model, effort, session %, context) and create the keep-awake hotkey. Run again after updating |
| `/claudedock:awake` | Toggle keep-awake: the computer won't sleep, even with the lid closed, so Claude keeps working |
| `/claudedock:awake on` / `off` | Turn keep-awake on / off |
| `/claudedock:awake status` | Show whether keep-awake is on |
| `/claudedock:awake nopass` | macOS: stop asking for your password when toggling keep-awake |
| `/claudedock:browse` | Open your default page on the right side (Subway Surfers unless you change it) |
| `/claudedock:browse shorts` | Open a preset: `subway`, `games`, `shorts`, `reels`, `youtube`, `tiktok` |
| `/claudedock:browse <url>` | Open any website, like `/claudedock:browse example.com` |
| `/claudedock:browse <x> --pane` | Force it inside the terminal (right split pane, Carbonyl). Not for WebGL games |
| `/claudedock:browse <x> --window` | Force a real browser window docked on the right |
| `/claudedock:browse default <preset or url>` | Change the default page |
| `/claudedock:browse mode <auto, pane or window>` | Change the default mode (auto = games in a window, everything else in a pane) |
| `/claudedock:browse list` | Show presets and your current settings |
| `/claudedock:remove` | Remove ClaudeDock: restores your old status line, turns keep-awake off, deletes the hotkey and files |

**Hotkey:** `Ctrl + Option + Cmd + K` (macOS) or `Ctrl + Alt + K` (Windows) toggles keep-awake from any app.
**Docs:** https://github.com/suhailroushan13/claudedock
