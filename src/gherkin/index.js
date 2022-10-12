const Token = Object.freeze({
  GIVEN: 'GIVEN',
  WHEN: 'WHEN',
  THEN: 'THEN',
})

const patternTypes = {
  REGULAR: 'REGULAR',
  REGEX: 'REGEX',
}

class StepDef {
  constructor(token, pattern, action) {
    if (typeof action !== 'function') {
      throw new Error('not function type')
    }
    if (!Object.values(Token).includes(token)) {
      throw new Error('Invalid token type')
    }
    pattern = pattern.toString()
    this.type = pattern.startsWith('/') && pattern.endsWith('/')
      ? patternTypes.REGEX
      : patternTypes.REGULAR
    this.token = token
    this.pattern = pattern
    this.action = action
  }

  getPatterns() {
    if (this.type === patternTypes.REGEX) {
      return [this.pattern]
    }
    const reg = /([^\s]+\/\w*)/g
    let steps = []
    const found = this.pattern.match(reg)

    if (!found) {
      return [this.pattern]
    }
    for (const match of found) {
      const parts = match.split('/')
      if (steps.length) {
        let newSteps = []
        for (const step of steps) {
          const temp = []
          for (const part of parts) {
            temp.push(step.replace(match, part))
          }
          newSteps = [...newSteps, ...temp]
        }
        steps = newSteps
      } else {
        for (const part of parts) {
          steps.push(this.pattern.replace(match, part))
        }
      }
    }
    return steps
  }

  getRegexMatches(step) {
    const pattern = this.getPatterns()[0]
    const reg = new RegExp(pattern.substring(1, pattern.length - 1))
    const matches = step.literal.match(reg)
    if (matches === null) {
      return matches
    }
    return matches.splice(1, matches.length - 1)
  }

  matchRegexPattern(step) {
    const matches = this.getRegexMatches(step)
    if (matches === null) {
      return false
    }
    let datalen = matches.length
    if (step.table) {
      datalen += 1
    }
    return datalen === this.action.length
  }

  match(step) {
    if (this.type === patternTypes.REGEX) {
      return this.matchRegexPattern(step)
    }

    // TODO: Decide if this is necessary
    // if (step.token !== this.token) {
    //   return false
    // }

    if (this.getPatterns().includes(step.pattern)) {
      let datalen = step.data.length
      if (step.table) {
        datalen += 1
      }

      return datalen === this.action.length
    }
    return false
  }

  run(reqStep) {
    let args
    if (this.type === patternTypes.REGEX) {
      args = this.getRegexMatches(reqStep)
    } else {
      args = reqStep.data || []
    }
    if (reqStep.table) {
      args.push(reqStep.table)
    }

    if (args.length !== this.action.length) {
      throw new Error('Cannot run step with invalid num of args')
    }

    return this.action(...args)
  }
}

class TestContext {
  constructor() {
    this.steps = []
    this.afterSteps = []
    this.beforeSteps = []
  }

  addstep(token, pattern, action) {
    if (typeof action !== 'function') {
      throw new Error('not function type')
    }

    if (!Object.values(Token).includes(token)) {
      throw new Error('Invalid token type')
    }

    for (const step of this.steps) {
      if (step.pattern === pattern) {
        throw new Error('step already registered')
      }
    }

    this.steps.push(new StepDef(token, pattern, action))
  }

  given(pattern, action) {
    this.addstep(Token.GIVEN, pattern, action)
  }

  when(pattern, action) {
    this.addstep(Token.WHEN, pattern, action)
  }

  then(pattern, action) {
    this.addstep(Token.THEN, pattern, action)
  }

  after(fn) {
    this.afterSteps.push(fn)
  }

  before(fn) {
    this.beforeSteps.push(fn)
  }

  getMatch(step) {
    for (const stepdef of this.steps) {
      if (stepdef.match(step)) {
        return stepdef
      }
    }
    return null
  }

  async cleanup() {
    for (const fn of this.afterSteps) {
      await fn()
    }
  }

  async setup() {
    for (const fn of this.beforeSteps) {
      await fn()
    }
  }
}

class Step {
  constructor(token, stepPattern, table) {
    this.token = token

    const { pattern, data } = verifyMatchParams(stepPattern)
    this.pattern = pattern
    this.data = data
    this.table = table
    this.literal = stepPattern
  }
}

function verifyMatchParams(pattern) {
  const reg = /(\d+|"([^"]*)"|'([^']*)')/g
  const data = []
  let found = pattern.match(reg)

  if (!found) {
    found = []
  }

  for (const match of found) {
    if (match[0] === '"' || match[0] === '\'') {
      data.push(match.substring(1, match.length - 1))
    } else {
      data.push(match)
    }
  }

  pattern = pattern.replace(/\"[^\"]*\"/g, '{string}') // eslint-disable-line no-useless-escape
  pattern = pattern.replace(/\'[^\']*\'/g, '{string}') // eslint-disable-line no-useless-escape
  pattern = pattern.replace(/\d+/g, '{int}') // eslint-disable-line no-useless-escape

  return { pattern, data }
}

class Table {
  constructor(data) {
    this.data = data

    if (!this.valid()) {
      throw new Error('Invalid table provided, please recheck')
    }
  }

  valid() {
    if (!Array.isArray(this.data)) {
      return false
    }

    let len
    for (const item of this.data) {
      if (!Array.isArray(item)) {
        return false
      }
      if (len) {
        if (item.length !== len) {
          return false
        }
      }
      len = item.length
    }
    return true
  }

  rowsHash() {
    if (this.data[0].length > 2) {
      throw new Error('Cannot perform rowsHash on table with more than 2 columns')
    }

    const result = {}
    for (let i = 0; i < this.data.length; i++) {
      result[this.data[i][0]] = this.data[i][1]
    }
    return result
  }

  rows() {
    return this.data.slice(1)
  }

  raw() {
    return this.data
  }

  hashes() {
    const header = this.data[0]
    const result = []
    for (let i = 1; i < this.data.length; i++) {
      const hash = {}
      for (let j = 0; j < this.data[i].length; j++) {
        hash[header[j]] = this.data[i][j]
      }
      result.push(hash)
    }
    return result
  }
}

module.exports = { Token, Step, StepDef, TestContext, Table }
