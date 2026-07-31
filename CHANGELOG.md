# eslint-plugin-no-comment-slop

## 0.2.0

### Minor Changes

- 462c26b: Add prefer-jsdoc-for-members and require-member-docs

  prefer-jsdoc-for-members converts // comments above interface, type-literal, object-literal, class and enum members into /\*\* \*/ so editors show them on hover. require-member-docs demands at least a one-liner on every member once a type has three documented members or 40% coverage.
