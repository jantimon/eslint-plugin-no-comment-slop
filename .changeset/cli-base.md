---
"eslint-plugin-no-comment-slop": minor
---

Rename the CLI's `--since <rev>` to `--base <rev>`. It compares against the merge base of `<rev>` and `HEAD`, so `--base main` shows only a branch's own changes, even after main was merged into it. A local branch now counts as the remote branch it tracks, so a stale local `main` no longer adds other people's changes to the report.
