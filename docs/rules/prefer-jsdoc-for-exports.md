# no-comment-slop/prefer-jsdoc-for-exports

📝 Require /** */ rather than // for the comment documenting an export.

💼 This rule is enabled in the ✅ `recommended` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Editors show `/** */` blocks in hover tooltips and completions. A `//` comment above an export is documentation nobody sees at the call site.

The fix converts the `//` run into a JSDoc block, keeping the indentation and closing any blank-line gap to the export. Blank lines between the comment and the export do not break the association; code or another comment does. Two comment kinds are never converted: license and copyright headers (`Copyright`, `License`, `SPDX`, `©`), and a file header separated from the export by a blank line, because that comment describes the module, not the export below it.

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
