import plugin from "../../dist/index.js";

export default [
  {
    files: ["**/*.js"],
    ...plugin.configs.recommended,
  },
];
