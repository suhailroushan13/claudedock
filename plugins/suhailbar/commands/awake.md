---
description: Keep the computer awake (even with the lid closed) so Claude keeps working. on | off | status | nopass
argument-hint: "[on|off|status|nopass]"
allowed-tools: Bash(node:*)
---

The SuhailBar keep-awake command just ran (no argument means toggle). Its output:

!`node "${CLAUDE_PLUGIN_ROOT}/scripts/awake.js" $ARGUMENTS`

Repeat the result to the user in one or two short lines, using only the output above. Do not run anything else.
