/* ESLint config for the ITAP frontend (React 18 + Vite, JavaScript).
 * Uses the classic (eslintrc) format because this repo pins ESLint 8.57.
 * `package.json` is `"type": "module"`, so this file must stay `.cjs`. */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  settings: { react: { version: "detect" } },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime", // React 17+ automatic JSX runtime — no `import React` needed
    "plugin:react-hooks/recommended",
  ],
  plugins: ["react", "react-hooks"],
  rules: {
    // Vite HMR wants components to be the only export of a module; warn, don't fail.
    "react/prop-types": "off",
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
  },
  ignorePatterns: ["dist/", "node_modules/", "*.config.js", "postcss.config.js"],
};
