// ESLint 8 config for the Vite + React + TypeScript app (the packages in package.json's devDependencies).
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'coverage', 'node_modules'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    // useTheme lives beside ThemeProvider, its context's only reader
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true, allowExportNames: ['useTheme'] },
    ],
    // A leading underscore marks a name as intentionally unused; rest siblings strip props in mocks
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
  },
  overrides: [
    {
      // Code that runs in Node: Vercel functions, build scripts and config
      files: ['api/**', 'scripts/**', '*.config.ts', '*.config.js', '.eslintrc.cjs'],
      env: { node: true, browser: false },
    },
    {
      // vi.mock factories load modules with require() and stub loosely typed props
      files: ['**/__tests__/**', '**/*.test.ts', '**/*.test.tsx', 'src/test/**'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
