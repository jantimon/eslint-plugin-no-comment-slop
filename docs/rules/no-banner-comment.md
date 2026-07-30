# no-comment-slop/no-banner-comment

📝 Disallow ASCII separator and banner comments.

💼 This rule is enabled in the ✅ `recommended` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Separator rulers and fenced headings are decoration, not information. Use a blank line, or split the file.

The fix removes a ruler when the comment stands alone on its line. Titled banners report without a fix so the heading text is not lost.

## Examples

❌ Incorrect:

```js
// ============================
// --- helpers ---
/* ************************** */
```

✅ Correct:

```js
// helpers
```

## Options

| Option       | Type    | Default | Description                                   |
| ------------ | ------- | ------- | --------------------------------------------- |
| `flagTitled` | boolean | `true`  | Also flag fenced titles like `--- helpers ---` |
| `minLength`  | integer | `3`     | Repeats of one character that count as a ruler |
