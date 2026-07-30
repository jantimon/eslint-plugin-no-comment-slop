# no-comment-slop/no-trailing-period

📝 Disallow a trailing period at the end of a comment.

💼 This rule is enabled in the ✅ `recommended` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Comments are notes, not essays. The closing period is a tell of generated prose and adds nothing.

Ellipses (`...`) and abbreviations (`e.g.`, `etc.`, `vs.`) stay allowed.

## Examples

❌ Incorrect:

```js
// waits for the lock before writing.
```

✅ Correct:

```js
// waits for the lock before writing
```

## Options

| Option         | Type    | Default | Description               |
| -------------- | ------- | ------- | ------------------------- |
| `includeJsdoc` | boolean | `true`  | Also check `/** */` blocks |
