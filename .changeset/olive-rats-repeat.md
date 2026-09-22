---
"eslint-plugin-no-comment-slop": patch
---

Treat `globals`, `exported` and `eslint` as config directives only inside a block comment. A line comment that opens with one of those words is prose, so every rule looks at it again.
