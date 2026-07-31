import tseslint from "typescript-eslint";
import plugin from "../../dist/index.js";

export default [
  {
    files: ["**/*.js"],
    ...plugin.configs.recommended,
  },
  {
    files: ["**/*.ts"],
    languageOptions: { parser: tseslint.parser },
    ...plugin.configs.recommended,
  },
];
