# no-comment-slop/no-jargon

📝 Disallow inflated vocabulary in comments.

💼 This rule is enabled in the ✅ `recommended` config.

💡 This rule is manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

Some words almost never appear in comments a person typed. The default list stays short on purpose: only the undeniable tells, so a hit is worth acting on. Simple inflections are matched too, so `utilizes` and `delving` do not slip past.

The default list: `utilize`, `utilise`, `leverage`, `delve`, `facilitate`, `streamline`, `seamless`, `seamlessly`, `robust`, `comprehensive`, `meticulous`, `meticulously`, `crucial`, `pivotal`, `myriad`, `plethora`. It is exported as `defaultJargonWords`.

Where a clean swap exists (`utilize` → `use`) the rule offers an editor suggestion. There is no autofix: wording changes need a human.

## Examples

❌ Incorrect:

```js
// utilize the robust cache to streamline lookups
```

✅ Correct:

```js
// use the cache
```

## Options

| Option         | Type     | Default            | Description                        |
| -------------- | -------- | ------------------ | ---------------------------------- |
| `words`        | string[] | the default list   | Replace the word list              |
| `extraWords`   | string[] | `[]`               | Add words to the list              |
| `allow`        | string[] | `[]`               | Remove words from the list         |
| `includeJsdoc` | boolean  | `true`             | Also check `/** */` blocks         |
