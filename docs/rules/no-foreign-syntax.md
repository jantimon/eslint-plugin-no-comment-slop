# no-comment-slop/no-foreign-syntax

📝 Disallow comment syntax imported from other languages.

💼 This rule is enabled in the ✅ `recommended` config.

<!-- end auto-generated rule header -->

Models trained on Rust and C# drag those doc habits into JavaScript, where the tooling ignores them:

- `///` doc comments. TypeScript triple-slash directives (`/// <reference>`, `/// <amd-module>`, `/// <amd-dependency>`) stay allowed.
- C# XML doc tags: `<summary>`, `<param name="">`, `<returns>`, `<remarks>`, `<typeparam>`, `<inheritdoc>`, `<see cref>`.
- `#region` / `#endregion` folding markers.

## Examples

❌ Incorrect:

```js
/// Returns the user id
// <summary>Gets the id</summary>
//#region helpers
```

✅ Correct:

```js
/** Returns the user id */
/// <reference path="./globals.d.ts" />
```
