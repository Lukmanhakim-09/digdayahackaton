import daStyle from 'eslint-config-dicodingacademy';

export default [
  daStyle,
  {
    files: ['**/*.js'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    ignores: ['dist', 'node_modules', 'webpack.common.js', 'webpack.dev.js', 'webpack.prod.js'],
    rules: {
      camelcase: 'off',
      'no-console': 'off',
    },
  },
];
