/* ESLint config for the ITAP backend (Node.js + Express, ESM).
 * Classic (eslintrc) format to match the pinned ESLint 8.57. `package.json` is
 * `"type": "module"`, so this file must stay `.cjs`. */
module.exports = {
  root: true,
  env: { node: true, es2022: true },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  extends: ["eslint:recommended"],
  rules: {
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    // Everything logs through the pino logger; console is a smell outside the one bootstrap
    // warning in config/env.js (which carries an inline disable comment).
    "no-console": "warn",
  },
  ignorePatterns: ["node_modules/", "*.config.js"],
  overrides: [
    {
      // Vitest test files import { describe, it, expect } explicitly, so no globals needed.
      files: ["tests/**/*.js", "**/*.test.js"],
      env: { node: true, es2022: true },
    },
  ],
};
