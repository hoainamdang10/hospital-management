/**
 * ESLint configuration for Clinical EMR Service
 * Bảo đảm eslint hiểu TypeScript module syntax và tsconfig paths.
 */

module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./tsconfig.json"],
    tsconfigRootDir: __dirname,
    sourceType: "module",
    ecmaVersion: 2022,
  },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  root: true,
  env: {
    node: true,
    jest: true,
    es2022: true,
  },
  ignorePatterns: [
    "dist",
    "node_modules",
    "*.js",
    "*.d.ts",
    "coverage",
    "build-output.log",
    "tsc-errors.log",
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-empty-function": "warn",
    "no-console": "off",
    "no-debugger": "warn",
    "no-unused-vars": "off",
    "prefer-const": "warn",
    "no-var": "error",
    eqeqeq: ["error", "always"],
    curly: ["error", "all"],
    "brace-style": ["error", "1tbs"],
    "comma-dangle": ["error", "only-multiline"],
    quotes: "off",
    semi: ["error", "always"],
    indent: ["error", 2, { SwitchCase: 1 }],
    "max-len": [
      "warn",
      { code: 120, ignoreComments: true, ignoreStrings: true },
    ],
    "no-trailing-spaces": "error",
    "no-multiple-empty-lines": ["error", { max: 2, maxEOF: 1 }],
    "object-curly-spacing": ["error", "always"],
    "array-bracket-spacing": ["error", "never"],
    "space-before-function-paren": [
      "error",
      { anonymous: "always", named: "never", asyncArrow: "always" },
    ],
  },
};
