module.exports = {
  env: {
    browser: true,
    es6: true,
    amd: true
  },
  extends: [
    'standard',
    'plugin:jest/recommended'
  ],
  parserOptions: {
    parser: 'babel-eslint',
    sourceType: 'module'
  },
  rules: {
    'require-await': 'warn',
    'no-new': 'off',
    'jest/no-standalone-expect': 'off',
    'node/no-callback-literal': 'off',

    /**
     * These rules are added so that the styling matches with owncloud/web
     */
    'space-before-function-paren': 'off',
    'comma-dangle': 'off',
    'quotes': 'off',
    'no-multiple-empty-lines': 'off',
    'indent': 'off',
    'eol-last': 'off',
  },
  globals: {
    require: false,
    requirejs: false
  },
  plugins: ['jest'],
}

