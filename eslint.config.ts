// eslint.config.ts
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  js.configs.recommended,

  // Non-type-aware TS rules (fast, no TS program)
  ...tseslint.configs.recommended,

  // Type-aware rules ONLY for TS files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
      },
    },
    rules: {},
  },
]);
