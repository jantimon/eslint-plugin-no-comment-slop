import plugin from "../../dist/index.js";

export default [
  {
    files: ["**/fixture/*.{js,ts}"],
    plugins: { "no-comment-slop": plugin },
    rules: {
      "no-comment-slop/max-comment-lines": "error",
      "no-comment-slop/no-banner-comment": "error",
      "no-comment-slop/no-trailing-comment": "error",
      "no-comment-slop/prefer-jsdoc-for-exports": "error",
      "no-comment-slop/prefer-jsdoc-for-members": "error",
      "no-comment-slop/require-member-docs": "error",
      "no-comment-slop/multiline-jsdoc-format": "error",
      "no-comment-slop/no-trailing-period": "error",
      "no-comment-slop/no-em-dash": "error",
      "no-comment-slop/no-prose-semicolon": "error",
      "no-comment-slop/no-jargon": "error",
      "no-comment-slop/no-foreign-syntax": "error"
    }
  }
];
