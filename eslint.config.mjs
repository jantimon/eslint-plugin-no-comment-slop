import eslintPlugin from "eslint-plugin-eslint-plugin";
import slop from "./dist/index.js";

export default [
  {
    ignores: ["tests/integration/fixture/**"],
  },
  {
    files: ["**/*.{js,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: { "no-comment-slop": slop },
    rules: slop.configs.recommended.rules,
  },
  {
    files: ["dist/index.js"],
    plugins: { "eslint-plugin": eslintPlugin },
    rules: eslintPlugin.configs.recommended.rules,
  },
];
