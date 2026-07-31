# eslint-plugin-no-comment-slop

Flags AI comment slop in JavaScript and TypeScript. The same module runs unchanged in [ESLint](https://eslint.org), [oxlint](https://oxc.rs) and [rslint](https://rslint.rs) because it only uses the rule APIs all three linters implement. CI runs one fixture through eslint 9, eslint 10, oxlint and rslint and requires identical diagnostics.

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

Needs Node 24+ and one of: ESLint 9+ with flat config, oxlint with `jsPlugins`, or rslint.

## Usage

ESLint (`eslint.config.mjs`):

```js
import noCommentSlop from "eslint-plugin-no-comment-slop";

export default [noCommentSlop.configs.recommended];
```

To adjust a rule, override it after the preset:

```js
export default [
  noCommentSlop.configs.recommended,
  {
    rules: {
      "no-comment-slop/no-trailing-period": "off",
      "no-comment-slop/no-jargon": ["error", { extraWords: ["synergy"] }],
    },
  },
];
```

Consider leaving tests alone. Generated tests often earn their comments: a line or two per unit or e2e case documents intent that would otherwise live nowhere. Whether to lint test comments is the maintainer's call; to skip them:

```js
export default [
  {
    ...noCommentSlop.configs.recommended,
    ignores: ["**/*.test.*", "**/*.spec.*", "**/tests/**", "**/e2e/**"],
  },
];
```

oxlint (`.oxlintrc.json`) has no preset support for JS plugins, so enable each rule from the table below:

```json
{
  "jsPlugins": ["eslint-plugin-no-comment-slop"],
  "rules": {
    "no-comment-slop/no-jargon": "error",
    "no-comment-slop/no-em-dash": "error"
  }
}
```

rslint (`rslint.config.mjs`):

```js
import noCommentSlop from "eslint-plugin-no-comment-slop";

export default [
  {
    files: ["**/*.{js,ts}"],
    ...noCommentSlop.configs.recommended,
  },
];
```

## Rules

Every rule is part of the `recommended` config. The 🔧 fixes are mechanical: delete a banner, drop a period, turn `//` into JSDoc. `--fix` never rewrites your wording; `no-jargon` and `no-em-dash` report with guidance instead.

<!-- begin auto-generated rules list -->

🔧 Automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/user-guide/command-line-interface#--fix).\
💡 Manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

| Name                                                               | Description                                                         | 🔧 | 💡 |
| :----------------------------------------------------------------- | :------------------------------------------------------------------ | :- | :- |
| [max-comment-lines](docs/rules/max-comment-lines.md)               | Limit how many lines a comment may span                             |    |    |
| [no-banner-comment](docs/rules/no-banner-comment.md)               | Disallow ASCII separator and banner comments                        | 🔧 |    |
| [no-em-dash](docs/rules/no-em-dash.md)                             | Disallow em dashes (and optionally en dashes) in comments           |    |    |
| [no-foreign-syntax](docs/rules/no-foreign-syntax.md)               | Disallow comment syntax imported from other languages               |    |    |
| [no-jargon](docs/rules/no-jargon.md)                               | Disallow inflated vocabulary in comments                            |    | 💡 |
| [no-trailing-comment](docs/rules/no-trailing-comment.md)           | Disallow comments on the same line as code                          |    |    |
| [no-trailing-period](docs/rules/no-trailing-period.md)             | Disallow a trailing period at the end of a comment                  | 🔧 |    |
| [prefer-jsdoc-for-exports](docs/rules/prefer-jsdoc-for-exports.md) | Require /** */ rather than // for the comment documenting an export | 🔧 |    |
| [prefer-jsdoc-for-members](docs/rules/prefer-jsdoc-for-members.md) | Require /** */ rather than // for the comment documenting a member  | 🔧 |    |
| [require-member-docs](docs/rules/require-member-docs.md)           | Require docs on every member once most of a type is documented      |    |    |

<!-- end auto-generated rules list -->

## License

[MIT](./LICENSE)
