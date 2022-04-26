module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
    'jest/globals': true,
  },
  extends: [
    'standard',
    'plugin:jest/recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    'require-await': 'warn',
    'no-new': 'off',
    'jest/no-standalone-expect': 'off',
    'jest/no-conditional-expect': 'off',
    'jest/no-done-callback': 'off',
    'node/no-callback-literal': 'off',
    /**
     * These rules are added so that the styling matches with owncloud/web
     */
    'space-before-function-paren': 'off',
    'comma-dangle': 'off',
    quotes: ['error', 'single'],
    'no-multiple-empty-lines': 'off',
    indent: 'off',
    'eol-last': 'off',
  },
  plugins: [
      'jest'
  ]
}
