// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = tseslint.config(
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.strict,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      // Angular specific rules
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],

      // Angular performance and best practices
      "@angular-eslint/prefer-on-push-component-change-detection": "error",
      "@angular-eslint/no-lifecycle-call": "error",
      "@angular-eslint/use-lifecycle-interface": "error",
      "@angular-eslint/no-conflicting-lifecycle": "error",
      "@angular-eslint/prefer-output-readonly": "error",
      "@angular-eslint/no-output-native": "error",
      "@angular-eslint/no-output-on-prefix": "error",
      "@angular-eslint/no-input-rename": "error",
      "@angular-eslint/no-output-rename": "error",

      // TypeScript strict rules
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/prefer-readonly-parameter-types": "warn",
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",

      // Code quality rules
      "complexity": ["error", 10],
      "max-depth": ["error", 4],
      "max-lines": ["error", 500],
      "max-lines-per-function": ["error", 50],
      "max-params": ["error", 4],
      "no-console": "warn",
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",

      // Import rules
      "sort-imports": ["error", {
        "ignoreCase": false,
        "ignoreDeclarationSort": true,
        "ignoreMemberSort": false,
        "memberSyntaxSortOrder": ["none", "all", "multiple", "single"],
        "allowSeparatedGroups": false
      }]
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      // Template accessibility rules
      "@angular-eslint/template/accessibility-alt-text": "error",
      "@angular-eslint/template/accessibility-elements-content": "error",
      "@angular-eslint/template/accessibility-label-has-associated-control": "error",
      "@angular-eslint/template/accessibility-table-scope": "error",
      "@angular-eslint/template/accessibility-valid-aria": "error",
      "@angular-eslint/template/click-events-have-key-events": "error",
      "@angular-eslint/template/mouse-events-have-key-events": "error",

      // Template performance
      "@angular-eslint/template/no-call-expression": "error",
      "@angular-eslint/template/use-track-by-function": "error",

      // Template best practices
      "@angular-eslint/template/conditional-complexity": ["error", { "maxComplexity": 3 }],
      "@angular-eslint/template/cyclomatic-complexity": ["error", { "maxComplexity": 5 }],
    },
  },
  {
    files: ["**/*.spec.ts"],
    rules: {
      // Relax some rules for test files
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "max-lines-per-function": "off",
      "complexity": "off",
    },
  }
);
