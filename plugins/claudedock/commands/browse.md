---
description: Open a browser on the right side, next to Claude Code (default Subway Surfers). Presets: subway, games, shorts, reels, youtube, tiktok, or any URL
argument-hint: "[preset|url] [--pane|--window] | default <preset|url> | mode <auto|pane|window> | list"
allowed-tools: Bash(node:*)
---

The ClaudeDock browse command just ran. Its output:

!`node "${CLAUDE_PLUGIN_ROOT}/scripts/browse.js" $ARGUMENTS`

Repeat the result to the user in one or two short lines, using only the output above. Do not run anything else.
