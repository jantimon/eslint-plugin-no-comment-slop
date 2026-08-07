# no-comment-slop/multiline-jsdoc-format

📝 Require /** and */ on their own lines in a multi-line JSDoc comment.

💼 This rule is enabled in the ✅ `recommended` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

A JSDoc block has two shapes: one line, or a fenced block. `/** text` that runs on to further lines mixes them, so the first line wraps at a different width than the rest and the `*` gutter starts one line late. Models produce it often, because they write the comment as one long string and let it wrap.

Pick a shape. If it fits on one line, keep it there. If it does not, open with `/**` alone and close with `*/` alone.

The fix only moves text between lines, never rewrites it. A comment too long to sit on one line stays long, and [`max-comment-lines`](max-comment-lines.md) is the rule that argues about the length.

## Examples

❌ Incorrect:

```js
/** Stamped into every artifact so files are self-describing.
 * Bump only on a breaking change */
export const schemaVersion = 3;
```

✅ Correct:

```js
/** Stamped into every artifact so files are self-describing */
export const schemaVersion = 3;
```

```js
/**
 * Stamped into every artifact so files are self-describing.
 * Bump only on a breaking change
 */
export const schemaVersion = 3;
```
