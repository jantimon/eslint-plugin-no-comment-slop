# eslint-plugin-no-comment-slop

## 0.4.0

### Minor Changes

- 033ee4b: Add `no-prose-semicolon`, which flags the semicolon that joins two clauses in comment prose. Code, markdown links and HTML entities keep their semicolons.

### Patch Changes

- a44caaf: Treat `globals`, `exported` and `eslint` as config directives only inside a block comment. A line comment that opens with one of those words is prose, so every rule looks at it again.

## 0.3.0

### Minor Changes

- c47de84: Add multiline-jsdoc-format

  A JSDoc block fits on one line or opens with `/**` alone; text hanging off the `/**` line wraps at a different width than the rest and starts the `*` gutter one line late. The rule reports both ends of the block and fixes them by moving the text, never rewriting it.

## 0.2.0

### Minor Changes

- 462c26b: Add prefer-jsdoc-for-members and require-member-docs

  prefer-jsdoc-for-members converts // comments above interface, type-literal, object-literal, class and enum members into /\*\* \*/ so editors show them on hover. require-member-docs demands at least a one-liner on every member once a type has three documented members or 40% coverage.
