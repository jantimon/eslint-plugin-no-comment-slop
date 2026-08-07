# eslint-plugin-no-comment-slop

## 0.3.0

### Minor Changes

- c47de84: Add multiline-jsdoc-format

  A JSDoc block fits on one line or opens with `/**` alone; text hanging off the `/**` line wraps at a different width than the rest and starts the `*` gutter one line late. The rule reports both ends of the block and fixes them by moving the text, never rewriting it.

## 0.2.0

### Minor Changes

- 462c26b: Add prefer-jsdoc-for-members and require-member-docs

  prefer-jsdoc-for-members converts // comments above interface, type-literal, object-literal, class and enum members into /\*\* \*/ so editors show them on hover. require-member-docs demands at least a one-liner on every member once a type has three documented members or 40% coverage.
