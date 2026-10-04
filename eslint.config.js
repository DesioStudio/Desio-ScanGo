import js from '@eslint/js';

const browserGlobals = {
  document: 'readonly',
  window: 'readonly',
  navigator: 'readonly',
  WebSocket: 'readonly',
  URLSearchParams: 'readonly',
  Intl: 'readonly'
};

const nodeGlobals = {
  console: 'readonly',
  process: 'readonly',
  Buffer: 'readonly',
  URL: 'readonly',
  __dirname: 'readonly',
  require: 'readonly',
  module: 'readonly'
};

export default [
  {
    ignores: [
      'node_modules/**',
      'release/**',
      '.cache/**',
      'desktop/dist/**',
      'mobile/dist/**'
    ]
  },
  js.configs.recommended,
  {
    files: ['desktop/src/**/*.{js,jsx}', 'mobile/src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: browserGlobals
    },
    rules: {
      'no-unused-vars': 'off'
    }
  },
  {
    files: ['desktop/electron/**/*.cjs', 'desktop/server/**/*.cjs', 'desktop/input/**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: nodeGlobals
    }
  }
];
