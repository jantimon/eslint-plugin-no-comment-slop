# no-comment-slop/no-prose-semicolon

📝 Disallow semicolons that join two clauses in comment prose.

💼 This rule is enabled in the ✅ `recommended` config.

<!-- end auto-generated rule header -->

Nobody reaches for a semicolon in a code comment. Models reach for it constantly, for the same reason they reach for the em dash: it welds two thoughts into one sentence so neither has to be chosen over the other.

There is no autofix. A comma makes the join a splice, a period can leave a fragment behind, and either way the sentence needs a writer, not a substitution. Decide which clause carries the point and lead with it.

The rule reads shape, not characters. A semicolon reports only where a word comes before it and a letter comes after the gap, which is how prose joins clauses and not how code ends a statement.

## Examples

❌ Incorrect:

```js
// warms the cache; the loader skips it on the next pass
// keep the id stable ; the report groups on it
```

✅ Correct:

```js
// warms the cache, so the loader skips it on the next pass
// console.log(value);
// for (let i = 0; i < n; i++) {
// sends `text/html; charset=utf-8` back
```

## What it skips

The semicolon belongs to code or markup in all of these, so none of them report:

| Skipped                                     | Example                                             |
| ------------------------------------------- | --------------------------------------------------- |
| A statement terminator                      | `// console.log(1);` or `// console.log(2); // foo` |
| Backtick and double-quote spans             | `` // sends `a; b` back ``                           |
| Fenced code blocks in JSDoc                 | ```` ```js ... ``` ````                              |
| Any line holding `=` or a bracket           | `// for (let i = 0; i < n; i++) {`                   |
| A JSDoc object type                         | `@returns {{ok: boolean; count: number}}`            |
| A line opening with a declaration keyword   | `// let a; let b`                                    |
| Markdown links, images and bare URLs        | `// see [docs](https://x.test/a?b=1;c=2)`            |
| HTML entities                               | `// use &nbsp; between the columns`                  |
| Anything but a letter after the semicolon   | `;)` and `data:image/png;base64,`                    |
| Directive comments                          | `// @ts-expect-error shim; remove once typed`        |

Two of those skips buy quiet at the cost of a miss. A line with a parenthesis is treated as code, so a parenthetical aside that also joins clauses goes unreported, and single quotes are not a literal span, because an apostrophe would swallow the rest of the line.
