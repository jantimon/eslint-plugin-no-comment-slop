# eslint-plugin-no-comment-slop

Flags AI comment slop in JavaScript and TypeScript. One plugin, three linters: the same module runs in [ESLint](https://eslint.org), [oxlint](https://oxc.rs) and [rslint](https://rslint.rs).

Before:

```js
// ============================================
// Utilize this robust helper to seamlessly retrieve the user — it is
// crucial to note that it delves into the cache first.
export const getUser = (id) => cache.get(id) ?? fetchUser(id); // fetches the user
```

After:

```js
/**
 * Cache first, network second
 */
export const getUser = (id) => cache.get(id) ?? fetchUser(id);
```

## Install

```sh
npm install --save-dev eslint-plugin-no-comment-slop
```

## Usage

ESLint (`eslint.config.mjs`):

```js
import noCommentSlop from "eslint-plugin-no-comment-slop";

export default [noCommentSlop.configs.recommended];
```

oxlint (`.oxlintrc.json`):

```json
{
  "jsPlugins": ["eslint-plugin-no-comment-slop"],
  "rules": {
    "no-comment-slop/no-jargon": "error"
  }
}
```

rslint (`rslint.config.mjs`):

```js
import noCommentSlop from "eslint-plugin-no-comment-slop";

export default [
  {
    plugins: { "no-comment-slop": noCommentSlop },
    rules: { "no-comment-slop/no-jargon": "error" },
  },
];
```

CI runs the same fixture through all supported linters and checks they report the same diagnostics.

## Rules

<!-- begin auto-generated rules list -->

💼 Configurations enabled in.\
✅ Set in the `recommended` configuration.\
🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix).\
💡 Manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

| Name                                                               | Description                                                         | 💼 | 🔧 | 💡 |
| :----------------------------------------------------------------- | :------------------------------------------------------------------ | :- | :- | :- |
| [max-comment-lines](docs/rules/max-comment-lines.md)               | Limit how many lines a comment may span                             | ✅  |    |    |
| [no-banner-comment](docs/rules/no-banner-comment.md)               | Disallow ASCII separator and banner comments                        | ✅  | 🔧 |    |
| [no-em-dash](docs/rules/no-em-dash.md)                             | Disallow em dashes (and optionally en dashes) in comments           | ✅  | 🔧 |    |
| [no-foreign-syntax](docs/rules/no-foreign-syntax.md)               | Disallow comment syntax imported from other languages               | ✅  |    |    |
| [no-jargon](docs/rules/no-jargon.md)                               | Disallow inflated vocabulary in comments                            | ✅  |    | 💡 |
| [no-trailing-comment](docs/rules/no-trailing-comment.md)           | Disallow comments on the same line as code                          | ✅  |    |    |
| [no-trailing-period](docs/rules/no-trailing-period.md)             | Disallow a trailing period at the end of a comment                  | ✅  | 🔧 |    |
| [prefer-jsdoc-for-exports](docs/rules/prefer-jsdoc-for-exports.md) | Require /** */ rather than // for the comment documenting an export | ✅  | 🔧 |    |

<!-- end auto-generated rules list -->

## License

[MIT](./LICENSE)
