import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Custom rules for better code quality
  {
    rules: {
      // Catch unused variables (allow underscore prefix for intentionally unused)
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      // Warn on explicit any usage to encourage proper typing
      "@typescript-eslint/no-explicit-any": "warn",
      // Restrict console usage (allow error and warn for logging)
      "no-console": ["warn", { allow: ["error", "warn"] }],
      // Ensure consistent return types
      "@typescript-eslint/explicit-function-return-type": "off",
      // Prefer const over let where possible
      "prefer-const": "error",
      // No unused expressions
      "no-unused-expressions": "error",
    }
  },
  // Allow console.log in scripts directory (CLI tools need it)
  {
    files: ["scripts/**/*.ts", "scripts/**/*.js"],
    rules: {
      "no-console": "off"
    }
  }
]);

export default eslintConfig;
