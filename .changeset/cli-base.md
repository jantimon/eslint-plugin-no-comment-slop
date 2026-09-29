---
"eslint-plugin-no-comment-slop": minor
---

Rename the CLI's `--since <rev>` to `--base <rev>`. It compares against the merge base of `<rev>` and `HEAD`, so `--base main` shows only a branch's own changes, even after main was merged into it.
