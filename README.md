[![no-comment-slop: flags AI comment slop](https://raw.githubusercontent.com/jantimon/eslint-plugin-no-comment-slop/main/assets/banner.png)](https://github.com/jantimon/eslint-plugin-no-comment-slop)

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
| [multiline-jsdoc-format](docs/rules/multiline-jsdoc-format.md)     | Require /** and */ on their own lines in a multi-line JSDoc comment | 🔧 |    |
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

## What it catches

One flagged example per rule. Each rule doc has the matching fix.

[`max-comment-lines`](docs/rules/max-comment-lines.md) — a wall of prose above one call:

```js
// This helper computes the value by first checking the cache,
// then falling back to the network, then retrying twice with
// exponential backoff, and finally giving up and returning null
// so the caller can decide what to do next.
const value = load();
```

[`multiline-jsdoc-format`](docs/rules/multiline-jsdoc-format.md) — text hanging off the `/**` line:

```js
/** Stamped into every artifact so files are self-describing.
 * Bump only on a breaking change */
export const schemaVersion = 3;
```

[`no-banner-comment`](docs/rules/no-banner-comment.md) — ASCII rulers and banners:

```js
// ============================
// --- helpers ---
/* ************************** */
```

[`no-em-dash`](docs/rules/no-em-dash.md) — the em dash aside:

```js
// caches the value — see the loader
```

[`no-foreign-syntax`](docs/rules/no-foreign-syntax.md) — Rust and C# doc habits in JavaScript:

```js
/// Returns the user id
// <summary>Gets the id</summary>
//#region helpers
```

[`no-jargon`](docs/rules/no-jargon.md) — inflated vocabulary:

```js
// utilize the robust cache to streamline lookups
```

[`no-trailing-comment`](docs/rules/no-trailing-comment.md) — a comment restating the line it sits on:

```js
const retries = 3; // number of retries
```

[`no-trailing-period`](docs/rules/no-trailing-period.md) — a sentence-ending period on a one-line comment:

```js
// waits for the lock before writing.
```

[`prefer-jsdoc-for-exports`](docs/rules/prefer-jsdoc-for-exports.md) — `//` above an export, which no editor shows on hover:

```js
// Parses the config file
export function parseConfig(path) {}
```

[`prefer-jsdoc-for-members`](docs/rules/prefer-jsdoc-for-members.md) — the same for a member:

```ts
interface RecordOptions {
  // run without a window
  headless: boolean;
}
```

[`require-member-docs`](docs/rules/require-member-docs.md) — one member left out once the rest are documented:

```ts
interface RecordOptions {
  /** module to load */
  module: string;
  /** entry function name */
  fn: string;
  /** browser binary */
  browser: string;
  url: string;
}
```

## License

[MIT](./LICENSE)
