/**
 * ESLint config for LectureWeave (React 18 + Vite + JSX, plain JavaScript).
 * Compatible with ESLint 8 (already in devDependencies).
 *
 * Rules are tuned to catch real bugs and let harmless stylistic patterns pass.
 * `npm run lint` uses `--max-warnings 0` — so anything we set to `warn` here
 * must be genuinely clean in the tree. Everything advisory-but-noisy is off.
 */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: { react: { version: '18.2' } },
  ignorePatterns: ['dist', 'node_modules', '.eslintrc.cjs'],
  plugins: ['react-refresh'],
  rules: {
    // Real bugs — keep as errors.
    'no-undef': 'error',
    'no-empty': ['error', { allowEmptyCatch: true }],
    'react/no-unescaped-entities': 'error',

    // Advisory — off (avoid churn on the existing codebase; can tighten later).
    'no-unused-vars': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'react-refresh/only-export-components': 'off',
    'react/prop-types': 'off',
  },
}
