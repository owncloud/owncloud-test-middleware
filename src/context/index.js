const { TestContext } = require('../gherkin/index.js')

let testContext = new TestContext()

const When = (pattern, action) => testContext.when(pattern, action)
const Then = (pattern, action) => testContext.then(pattern, action)
const Given = (pattern, action) => testContext.given(pattern, action)

const Before = (action) => testContext.before(action)
const After = (action) => testContext.after(action)

const resetTestContext = () => {
  testContext = new TestContext()
}

module.exports = {
  When,
  Then,
  Given,
  Before,
  After,
  testContext,
  resetTestContext,
}
