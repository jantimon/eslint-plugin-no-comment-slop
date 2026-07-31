# no-comment-slop/no-em-dash

📝 Disallow em dashes (and optionally en dashes) in comments.

💼 This rule is enabled in the ✅ `recommended` config.

🔧 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix).

<!-- end auto-generated rule header -->

Nobody types an em dash into a code comment; keyboards make it hard and muscle memory makes it rare. Language models produce it constantly. A plain hyphen says the same thing.

The rule targets prose punctuation, not literal characters. An em dash inside backticks or double quotes never fires, so a comment can describe output the code really prints. When your code emits `—`, write it as `` `—` `` in the comment; the autofix would otherwise change which character the comment claims the code prints.

## Examples

❌ Incorrect:

```js
// caches the value — see the loader
```

✅ Correct:

```js
// caches the value - see the loader
// prints `—` when a value is not measured
```

## Options

| Option          | Type    | Default | Description                      |
| --------------- | ------- | ------- | -------------------------------- |
| `includeEnDash` | boolean | `false` | Also flag en dashes (`–`)        |
| `replacement`   | string  | `"-"`   | Text the fix inserts             |
