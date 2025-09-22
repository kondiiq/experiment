import { configs } from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  {
    ignores: ['**/dist/**', 'gen/**', '@cds-models/**', 'app/**'],
  },
  configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.jest,
        ...globals.es6,
        SELECT: 'readonly',
        INSERT: 'readonly',
        UPDATE: 'readonly',
        DELETE: 'readonly',
        CREATE: 'readonly',
        DROP: 'readonly',
        CDL: 'readonly',
        CQL: 'readonly',
        CXL: 'readonly',
        cds: 'readonly',
        sap: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      'no-console': 'off',
      'require-atomic-updates': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.jest,
        ...globals.es6,
        SELECT: 'readonly',
        INSERT: 'readonly',
        UPDATE: 'readonly',
        DELETE: 'readonly',
        CREATE: 'readonly',
        DROP: 'readonly',
        CDL: 'readonly',
        CQL: 'readonly',
        CXL: 'readonly',
        cds: 'readonly',
        sap: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'require-atomic-updates': 'off',
    },
  },
];
