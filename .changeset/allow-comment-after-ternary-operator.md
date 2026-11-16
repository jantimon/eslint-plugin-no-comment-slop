---
"eslint-plugin-no-comment-slop": patch
---

`no-trailing-comment` allows a comment after the `?` or `:` of a multi-line conditional when the branch starts on the next line. Prettier and oxfmt print a comment before a ternary branch in that place, so the author cannot move it.
