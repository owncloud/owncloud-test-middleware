module.exports = {
  env: {
    browser: true,
    es6: true,
    amd: true
  },
  extends: [
    'standard',
    'prettier/standard',
    'plugin:prettier/recommended',
    'plugin:jest/recommended'
  ],
  parserOptions: {
    parser: 'babel-eslint',
    sourceType: 'module'
  },
  rules: {
    /**
     * TODO: fix project import issues and then enable it
     * 'sort-imports': 'warn',
     */
    'require-await': 'warn',
    'no-new': 'off',
    'jest/no-standalone-expect': 'off',
    'node/no-callback-literal': 'off'
  },
  globals: {
    require: false,
    requirejs: false
  },
  plugins: ['jest'],
}

