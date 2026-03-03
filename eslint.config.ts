import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import reactCompiler from 'eslint-plugin-react-compiler'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),

  {
    plugins: { 'react-compiler': reactCompiler },
  },

  {
    rules: {
      'react-compiler/react-compiler': 'error',
      'react/react-in-jsx-scope': 'off',
      semi: ['error', 'never'],
      quotes: ['error', 'single'],
      'no-var': 'warn',
      'prefer-const': 'warn',
      indent: ['error', 2],
      'comma-dangle': ['error', 'always-multiline'],
      'comma-style': ['error', 'last'],
      'array-bracket-newline': ['error', 'consistent'],
      'object-curly-newline': ['error', { multiline: true, consistent: true }],
      'object-curly-spacing': ['error', 'always'],
      'space-before-function-paren': ['error', {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'always',
      }],

      'no-trailing-spaces': ['warn'],
      'no-multiple-empty-lines': ['warn', { max: 1, maxBOF: 0, maxEOF: 0 }],
      'eol-last': ['warn', 'always'],

      '@typescript-eslint/consistent-type-definitions': 'error',
      '@typescript-eslint/no-empty-object-type': 'off',

      'react/prop-types': 'off',
      'space-in-parens': ['error', 'never'],
      'quote-props': ['error', 'as-needed'],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'function' },
        { blankLine: 'always', prev: 'function', next: '*' },
      ],
    },
  },
])

export default eslintConfig
