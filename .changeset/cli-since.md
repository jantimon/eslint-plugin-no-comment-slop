---
"eslint-plugin-no-comment-slop": minor
---

Add a `no-comment-slop` CLI that reports findings only on changed lines. With no flags it checks uncommitted changes. `--since <rev>` checks everything since the merge base with `<rev>`, and `--all` turns the filter off. It runs oxlint through `npx` and has no dependencies.
