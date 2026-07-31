# no-comment-slop/no-em-dash

📝 Disallow em dashes (and optionally en dashes) in comments.

💼 This rule is enabled in the ✅ `recommended` config.

<!-- end auto-generated rule header -->

Nobody types an em dash into a code comment; keyboards make it hard and muscle memory makes it rare. Language models produce it constantly. A plain hyphen says the same thing.

There is no autofix. Swapping the dash for a hyphen keeps the same parenthetical grammar with a worse glyph; the cure is rewriting. Split the sentence, or use a comma, colon, or parentheses.

The rule targets prose punctuation, not literal characters. An em dash inside backticks or double quotes never fires, so a comment can describe output the code really prints. When your code emits `—`, write it as `` `—` `` in the comment.

## Examples

❌ Incorrect:

```js
// caches the value — see the loader
```

✅ Correct:

```js
// caches the value, see the loader
// prints `—` when a value is not measured
```

## Options

| Option          | Type    | Default | Description               |
| --------------- | ------- | ------- | ------------------------- |
| `includeEnDash` | boolean | `false` | Also flag en dashes (`–`) |
