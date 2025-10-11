const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  {
    ignores: ["src/generated/**", "node_modules/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: globals.node,
    },
  },
];
