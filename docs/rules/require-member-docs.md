# no-comment-slop/require-member-docs

📝 Require docs on every member once most of a type is documented.

💼 This rule is enabled in the ✅ `recommended` config.

<!-- end auto-generated rule header -->

Half-documented types are worse than undocumented ones: the reader assumes the bare members are self-explanatory when they are merely forgotten. Once a type shows intent to be documented, every member needs at least a one-liner.

The trigger: at least `minDocumented` members have a comment, or at least `minRatio` of them do. Each undocumented member then gets its own report. Applies to interfaces, type literals, classes (constructors excluded), and enums; plain object literals are left alone. A fully undocumented type never triggers.

## Examples

❌ Incorrect:

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

✅ Correct:

```ts
interface RecordOptions {
  /** module to load */
  module: string;
  /** entry function name */
  fn: string;
  /** browser binary */
  browser: string;
  /** page to record */
  url: string;
}
```

## Options

| Option         | Type    | Default | Description                                           |
| -------------- | ------- | ------- | ----------------------------------------------------- |
| `minDocumented`| integer | `3`     | Documented-member count that triggers the requirement |
| `minRatio`     | number  | `0.4`   | Documented-member ratio that triggers the requirement |
