// Copyright 2020-2022 Buf Technologies, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const ignoreFiles = [".eslintrc.js", "dist/**/*", "jest.config.js"];

module.exports = {
  env: {
    es2022: true,
    "jest/globals": true,
  },
  ignorePatterns: ignoreFiles,
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:eslint-plugin-jest/recommended",
    "eslint-config-prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "eslint-plugin-node", "eslint-plugin-jest"],
  rules: {
    "@typescript-eslint/no-require-imports": "error",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/ban-ts-comment": [
      "error",
      {
        "ts-ignore": "allow-with-description",
      },
    ],
    "no-console": "error",
    yoda: "error",
    "prefer-const": [
      "error",
      {
        destructuring: "all",
      },
    ],
    "no-control-regex": "off",
    "no-constant-condition": ["error", { checkLoops: false }],
    "node/no-extraneous-import": "error",
  },
  overrides: [
    {
      files: ["**/*{test,spec}.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "jest/no-standalone-expect": "off",
        "jest/no-conditional-expect": "off",
        "no-console": "off",
      },
    },
  ],
};
