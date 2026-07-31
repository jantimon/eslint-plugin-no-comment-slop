# no-comment-slop/prefer-jsdoc-for-members

📝 Require /** */ rather than // for the comment documenting a member.

💼 This rule is enabled in the ✅ `recommended` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Editors show `/** */` on hover wherever the member is used; a `//` comment above it stays invisible. This applies to interface and type-literal members, object literal properties, class members, and enum members.

The fix converts a single `//` line into a one-liner (`/** does Y when active */`) and a run of lines into a block, closing any blank-line gap to the member.

## Examples

❌ Incorrect:

```ts
interface RecordOptions {
  // run without a window
  headless: boolean;
}
```

✅ Correct:

```ts
interface RecordOptions {
  /** run without a window */
  headless: boolean;
}
```
