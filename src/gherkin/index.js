const Token = Object.freeze({
  GIVEN: "GIVEN",
  WHEN: "WHEN",
  THEN: "THEN",
});

class StepDef {
  constructor(token, pattern, action) {
    if (typeof action !== "function") {
      throw new Error("not function type");
    }
    this.token = token;
    this.pattern = pattern;
    this.action = action;
  }

  match(step) {
    if (step.token !== this.token) {
      return false;
    }

    if (step.pattern === this.pattern) {
      let datalen = step.data.length;
      if (step.table && step.table.length) {
        datalen += 1;
      }

      if (datalen !== this.action.length) {
        return false;
      }
      return true;
    }
    return false;
  }

  run() {
    if (arguments.length !== this.action.length) {
      throw new Error("Cannot run step with invalid num of args");
    }

    return this.action(...arguments);
  }
}

class TestContext {
  constructor() {
    this.steps = [];
    this.afterSteps = [];
    this.beforeSteps = [];
  }

  addstep(token, pattern, action) {
    if (typeof action !== "function") {
      throw new Error("not function type");
    }

    for (const step of this.steps) {
      if (step.pattern === pattern) {
        throw new Error("step already registered");
      }
    }

    this.steps.push(new StepDef(token, pattern, action));
  }

  given(pattern, action) {
    this.addstep(Token.GIVEN, pattern, action);
  }

  when(pattern, action) {
    this.addstep(Token.WHEN, pattern, action);
  }

  then(pattern, action) {
    this.addstep(Token.THEN, pattern, action);
  }

  after(fn) {
    this.afterSteps.push(fn);
  }

  before(fn) {
    this.beforeSteps.push(fn);
  }

  getMatch(step) {
    for (const stepdef of this.steps) {
      if (stepdef.match(step)) {
        return stepdef;
      }
    }
    return null;
  }

  async cleanup() {
    for (const fn of this.afterSteps) {
      await fn();
    }
  }

  async setup() {
    for (const fn of this.beforeSteps) {
      await fn();
    }
  }
}

class Step {
  constructor(token, stepPattern, table) {
    this.token = token;

    const { pattern, data } = verifyMatchParams(stepPattern);
    this.pattern = pattern;
    this.data = data;
    this.table = table;
  }
}

function verifyMatchParams(pattern) {
  var reg = RegExp(/(\d+|"([^\"]*)")/g); // eslint-disable-line no-useless-escape
  var data = [];
  let found = pattern.match(reg);

  if (!found) {
    found = [];
  }

  for (const match of found) {
    if (match[0] === '"') {
      data.push(match.replace(/['"]+/g, "")); // eslint-disable-line no-useless-escape
    } else {
      data.push(match);
    }
  }

  pattern = pattern.replace(/\"[^\"]*\"/g, "{string}"); // eslint-disable-line no-useless-escape
  pattern = pattern.replace(/\d+/g, "{int}"); // eslint-disable-line no-useless-escape

  return { pattern, data };
}

module.exports = { Token, Step, StepDef, TestContext };
