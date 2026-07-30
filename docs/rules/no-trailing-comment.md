# no-comment-slop/no-trailing-comment

📝 Disallow comments on the same line as code.

💼 This rule is enabled in the ✅ `recommended` config.

<!-- end auto-generated rule header -->

Same-line comments narrate the obvious (`const foo = 1 // set foo`) and push real information past the edge of the screen. A comment worth keeping deserves its own line above the code.

Directive comments like `// eslint-disable-line` stay allowed.

## Examples

❌ Incorrect:

```js
const retries = 3; // number of retries
```

✅ Correct:

```js
// three retries before the circuit opens
const retries = 3;
```
