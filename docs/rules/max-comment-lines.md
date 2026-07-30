# no-comment-slop/max-comment-lines

📝 Limit how many lines a comment may span.

💼 This rule is enabled in the ✅ `recommended` config.

<!-- end auto-generated rule header -->

AI-generated code loves to explain itself at length. A comment that needs six lines belongs in the docs, with a link in the code.

A run of `//` lines on consecutive lines counts as one comment. JSDoc blocks get a budget per section: a blank line ends a section and an `@tag` starts a new one, so a description and its tags are counted apart. Fence lines (`/**`, `*/`, bare `*` gutters) never count. File headers get their own, larger budget.

## Examples

❌ Incorrect:

```js
// This helper computes the value by first checking the cache,
// then falling back to the network, then retrying twice with
// exponential backoff, and finally giving up and returning null
// so the caller can decide what to do next.
const value = load();
```

✅ Correct:

```js
// Cache first, network second, two retries; null when all fail
const value = load();
```

## Options

| Option            | Type    | Default | Description                              |
| ----------------- | ------- | ------- | ---------------------------------------- |
| `max`             | integer | `3`     | Line budget for a normal comment         |
| `headerMax`       | integer | `5`     | Line budget for the file header          |
| `jsdocSectionMax` | integer | `5`     | Line budget per JSDoc section            |
