/* eslint no-undef: 0 */
const { StepDef, Step, Table } = require('./index')

const stepDefPatternData = [
  [
    {
      stepDef: {
        token: 'invalid',
        pattern: 'doesnot matters',
      },
      errMessage: 'Invalid token type',
    },
    false,
  ],
  [
    {
      stepDef: {
        token: 54,
        pattern: 'doesnot matters',
      },
      errMessage: 'Invalid token type',
    },
    false,
  ],
  [
    {
      stepDef: {
        token: true,
        pattern: 'doesnot matters',
      },
      errMessage: 'Invalid token type',
    },
    false,
  ],
  [
    {
      stepDef: {
        token: 'GIVEN',
        pattern: 'user {string} has been created',
      },
      patterns: ['user {string} has been created'],
    },
    true,
  ],
  [
    {
      stepDef: {
        token: 'GIVEN',
        pattern: 'user {string} has shared file/folder {string} with user {string}',
      },
      patterns: [
        'user {string} has shared file {string} with user {string}',
        'user {string} has shared folder {string} with user {string}',
      ],
    },
    true,
  ],
  [
    {
      stepDef: {
        token: 'GIVEN',
        pattern: 'user {string} has shared file/folder {string} with user/group {string}',
      },
      patterns: [
        'user {string} has shared file {string} with user {string}',
        'user {string} has shared file {string} with group {string}',
        'user {string} has shared folder {string} with user {string}',
        'user {string} has shared folder {string} with group {string}',
      ],
    },
    true,
  ],
  [
    {
      stepDef: {
        token: 'GIVEN',
        pattern: 'user {string} has shared file/folder/resource {string} with user/group {string}',
      },
      patterns: [
        'user {string} has shared file {string} with user {string}',
        'user {string} has shared file {string} with group {string}',
        'user {string} has shared folder {string} with user {string}',
        'user {string} has shared folder {string} with group {string}',
        'user {string} has shared resource {string} with user {string}',
        'user {string} has shared resource {string} with group {string}',
      ],
    },
    true,
  ],
  [
    {
      stepDef: {
        token: 'GIVEN',
        pattern:
          'user/person {string} has shared file/folder/resource {string} with user/group {string}',
      },
      patterns: [
        'user {string} has shared file {string} with user {string}',
        'user {string} has shared file {string} with group {string}',
        'user {string} has shared folder {string} with user {string}',
        'user {string} has shared folder {string} with group {string}',
        'user {string} has shared resource {string} with user {string}',
        'user {string} has shared resource {string} with group {string}',
        'person {string} has shared file {string} with user {string}',
        'person {string} has shared file {string} with group {string}',
        'person {string} has shared folder {string} with user {string}',
        'person {string} has shared folder {string} with group {string}',
        'person {string} has shared resource {string} with user {string}',
        'person {string} has shared resource {string} with group {string}',
      ],
    },
    true,
  ],
  [
    {
      stepDef: {
        token: 'GIVEN',
        pattern:
          '/^user "([^"]*)" has been created with default attributes and (without|large|small) skeleton files$/',
      },
      patterns: [
        '/^user "([^"]*)" has been created with default attributes and (without|large|small) skeleton files$/',
      ],
    },
    true,
  ],
]

describe('Checking stepDef generated patterns', () => {
  it.each(stepDefPatternData)('Step def generates valid patterns', (data, expected) => {
    if (expected) {
      const stepDef = new StepDef(data.stepDef.token, data.stepDef.pattern, () => {
        return 0
      })
      expect(stepDef.getPatterns()).toStrictEqual(data.patterns)
    } else {
      try {
        const stepDef = new StepDef(data.stepDef.token, data.stepDef.pattern, () => {
          return 0
        })
        throw new Error('creating invalid stepdef should fail but it passed', stepDef)
      } catch (err) {
        expect(err.message).toBe(data.errMessage)
      }
    }
  })
})

const stepDefMatchData = [
  [
    {
      stepDef: {
        token: 'GIVEN',
        pattern: 'user {string} has shared file {string} with user {string}',
      },
      patterns: ['user "Alice" has shared file "testfile.txt" with user "Brian"'],
    },
    true,
  ],
  [
    {
      stepDef: {
        token: 'GIVEN',
        pattern: 'user {string} has shared file/folder {string} with user {string}',
      },
      patterns: [
        'user "Alice" has shared file "welcome.txt" with user "Brian"',
        'user "Alice" has shared folder "welcome.txt" with user "Brian"',
      ],
    },
    true,
  ],
  [
    {
      stepDef: {
        token: 'GIVEN',
        pattern: 'user {string} has shared file/folder {string} with user/group {string}',
      },
      patterns: [
        'user "Alice" has shared file "testFolder" with user "Brian"',
        'user "Alice" has shared file "testFolder" with group "Brian"',
        'user "Alice" has shared folder "testFolder" with user "Brian"',
        'user "Alice" has shared folder "testFolder" with group "Brian"',
      ],
    },
    true,
  ],
  [
    {
      stepDef: {
        token: 'GIVEN',
        pattern: 'user {string} has shared file/folder/resource {string} with user/group {string}',
      },
      patterns: [
        'user "Alice" has shared file "testfile.txt" with user "Brian"',
        'user "Alice" has shared file "testfile.txt" with group "Brian"',
        'user "Alice" has shared folder "testfile.txt" with user "Brian"',
        'user "Alice" has shared folder "testfile.txt" with group "Brian"',
        'user "Alice" has shared resource "testfile.txt" with user "Brian"',
        'user "Alice" has shared resource "testfile.txt" with group "Brian"',
      ],
    },
    true,
  ],
  [
    {
      stepDef: {
        token: 'GIVEN',
        pattern:
          'user/person {string} has shared file/folder/resource {string} with user/group {string}',
      },
      patterns: [
        'user "Alice" has shared file "testResource/testsub" with user "Brian"',
        'user "Alice" has shared file "testResource/testsub" with group "Brian"',
        'user "Alice" has shared folder "testResource/testsub" with user "Brian"',
        'user "Alice" has shared folder "testResource/testsub" with group "Brian"',
        'user "Alice" has shared resource "testResource/testsub" with user "Brian"',
        'user "Alice" has shared resource "testResource/testsub" with group "Brian"',
        'person "Alice" has shared file "testResource/testsub" with user "Brian"',
        'person "Alice" has shared file "testResource/testsub" with group "Brian"',
        'person "Alice" has shared folder "testResource/testsub" with user "Brian"',
        'person "Alice" has shared folder "testResource/testsub" with group "Brian"',
        'person "Alice" has shared resource "testResource/testsub" with user "Brian"',
        'person "Alice" has shared resource "testResource/testsub" with group "Brian"',
      ],
    },
    true,
  ],
  [
    {
      stepDef: {
        token: 'GIVEN',
        pattern: '/^user "([^"]*)" has shared file "([^"]*)" with user "(Alice|Brian)"$/',
      },
      patterns: [
        'user "Alice" has shared file "testResource/testsub" with user "Brian"',
        'user "Brian" has shared file "hello.txt" with user "Alice"',
        'user "Alice" has shared file "testResource/testsub" with user "Brian"',
        'user "David" has shared file "testResource/tests" with user "Alice"',
      ],
    },
    true,
  ],
  [
    {
      stepDef: {
        token: 'GIVEN',
        pattern: '/^user "([^"]*)" has shared (file|folder|resource) with user "([^"]*)"$/',
      },
      patterns: [
        'user "Alice" has shared file with user "Brian"',
        'user "Brian" has shared folder with user "Alice"',
        'user "Alice" has shared resource with user "Brian"',
      ],
    },
    true,
  ],
]

describe('Checking stepDef.match matches patterns', () => {
  it.each(stepDefMatchData)('Step def match matches valid patterns', (data, expected) => {
    if (expected) {
      // valid match
      let stepDef = new StepDef(data.stepDef.token, data.stepDef.pattern, (user, file, sharee) => {
        return 0
      })
      for (const pattern of data.patterns) {
        const step = new Step(data.stepDef.token, pattern)
        const res = stepDef.match(step)
        expect(res).toBe(true)
      }

      // invalid match invalid number of args
      stepDef = new StepDef(data.stepDef.token, data.stepDef.pattern, (user, file) => {
        return 0
      })
      for (const pattern of data.patterns) {
        const step = new Step(data.stepDef.token, pattern)
        const res = stepDef.match(step)
        expect(res).toBe(false)
      }

      // invalid match invalid token
      stepDef = new StepDef(data.stepDef.token, data.stepDef.pattern, (user, file) => {
        return 0
      })
      for (const pattern of data.patterns) {
        const step = new Step('THEN', pattern)
        const res = stepDef.match(step)
        expect(res).toBe(false)
      }

      // invalid match invalid number of args
      stepDef = new StepDef(data.stepDef.token, data.stepDef.pattern, (user, file) => {
        return 0
      })
      for (const pattern of data.patterns) {
        const step = new Step(data.stepDef.token, pattern, new Table([['test'], ['data']]))
        const res = stepDef.match(step)
        expect(res).toBe(false)
      }

      // invalid match invalid pattern
      stepDef = new StepDef(data.stepDef.token, data.stepDef.pattern, (user, file) => {
        return 0
      })
      for (const pattern of data.patterns) {
        const step = new Step(
          data.stepDef.token,
          pattern + ' some extra text',
          new Table([['test'], ['data']])
        )
        const res = stepDef.match(step)
        expect(res).toBe(false)
      }
    } else {
      expect(() => {
        new StepDef(data.stepDef.token, data.stepDef.pattern, () => {
          return 0
        })
      }).toThrowError(data.errMessage)
    }
  })
})

const getRegexMatchData = [
  [
    {
      regex: '/^user "([^"]*)" has been created$/',
      step: 'user "Alice" has been created',
      matches: ['Alice'],
    },
  ],
  [
    {
      regex: '/^user "([^"]*)" has been created using (small|large|without) skeleton files$/',
      step: 'user "Alice" has been created using small skeleton files',
      matches: ['Alice', 'small'],
    },
  ],
  [
    {
      regex: '/^user "([^"]*)" has been created using (small|large|without) skeleton files$/',
      step: 'user "Alice" has been created using large skeleton files',
      matches: ['Alice', 'large'],
    },
  ],
  [
    {
      regex: '/^user "([^"]*)" has been created with (\\d+) skeleton files$/',
      step: 'user "Alice" has been created with 5 skeleton files',
      matches: ['Alice', '5'],
    },
  ],
]

describe('Checking stepDef.getRegexMatches', () => {
  it.each(getRegexMatchData)('getRegexMatches should return correct data', (data) => {
    const stepDef = new StepDef('GIVEN', data.regex, (arg) => {
      return 0
    })
    const step = new Step('GIVEN', data.step)
    matches = stepDef.getRegexMatches(step)
    expect(matches).toStrictEqual(data.matches)
  })
})

describe('Checking stepDef.run runs the function', () => {
  it('Step def match matches valid patterns', () => {
    let called = false
    let argUser, argFile, argSharee
    const stepDef = new StepDef(
      'GIVEN',
      'user {string} has shared file {string} with user {string}',
      (user, file, sharee) => {
        called = true
        argUser = user
        argFile = file
        argSharee = sharee
        return Promise.resolve()
      }
    )

    const step = new Step('GIVEN', 'user "Alice" has shared file "testfile.txt" with user "Brian"')
    const res = stepDef.match(step)
    expect(res).toBe(true)

    stepDef.run(step)

    expect(called).toBe(true)
    expect(argUser).toBe('Alice')
    expect(argFile).toBe('testfile.txt')
    expect(argSharee).toBe('Brian')
  })
})
