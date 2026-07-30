# no-comment-slop/prefer-jsdoc-for-exports

📝 Require /** */ rather than // for the comment documenting an export.

💼 This rule is enabled in the ✅ `recommended` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Editors show `/** */` blocks in hover tooltips and completions. A `//` comment above an export is documentation nobody sees at the call site.

The fix converts the `//` run into a JSDoc block, keeping the indentation.

## Examples

❌ Incorrect:

```js
// Parses the config file
export function parseConfig(path) {}
```

✅ Correct:

```js
/**
 * Parses the config file
 */
export function parseConfig(path) {}
```
