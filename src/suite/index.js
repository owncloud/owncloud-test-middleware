const { Suite } = require("../gherkin/index.js");

let suite = new Suite();

const When = (pattern, action) => suite.given(pattern, action);
const Then = (pattern, action) => suite.then(pattern, action);
const Given = (pattern, action) => suite.given(pattern, action);

const Before = (action) => suite.before(action);
const After = (action) => suite.after(action);

const resetSuite = () => {
  suite = new Suite();
};

module.exports = {
  When,
  Then,
  Given,
  Before,
  After,
  suite,
  resetSuite,
};
