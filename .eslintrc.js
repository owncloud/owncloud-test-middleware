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
    indent: ['error', 2],
    'require-await': 'warn',
    'no-new': 'off',
    'jest/no-standalone-expect': 'off',
    'jest/no-conditional-expect': 'off',
    'jest/no-done-callback': 'off',
    'node/no-callback-literal': 'off',
    'sort-imports': ['error', {
      ignoreCase: false,
      ignoreDeclarationSort: false,
      ignoreMemberSort: false,
      memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
      allowSeparatedGroups: false
    }],
    /**
     * These rules are added so that the styling matches with owncloud/web
     */
    'space-before-function-paren': 'off',
    'comma-dangle': 'off',
    quotes: ['error', 'single'],
    'no-multiple-empty-lines': 'off',
    'eol-last': 'off',
  },
  plugins: [
    'jest'
  ]
}
