const { Step, TestContext, StepDef } = require('./index')

const testContextData = [
  [
    {
      textContext: {
        token: 'GIVEN',
        pattern: 'user {string} has been created',
      },
      action: 'function',
    },
  ],
  [
    {
      testContext: {
        token: 'GIVEN',
        pattern: 'user {string} has been created',
      },
      action: 'not function',
    },
  ],
]

const getMatchData = [
  {
    addStep: {
      token: 'GIVEN',
      step: 'user {string} has been created',
      action: (user) => {
        return 0
      },
    },
    newStep: {
      token: 'GIVEN',
      step: 'user "Alice" has been created',
    },
  },
  {
    addStep: {
      token: 'GIVEN',
      step: 'user {string} has been created with default attributes',
      action: (user) => {
        return 0
      },
    },
    newStep: {
      token: 'GIVEN',
      step: 'user "Alice" has been created with default attributes',
    },
  },
  {
    addStep: {
      token: 'WHEN',
      step: 'user {string} shares folder {string} with user {string} with {string} permissions',
      action: (sharer, resource, receiver, permissions) => {
        return 0
      },
    },
    newStep: {
      token: 'WHEN',
      step:
        'user "Alice" shares folder "simple-folder" with user "Brian" with "read, update, create, delete" permissions',
    },
  },
  {
    addStep: {
      token: 'WHEN',
      step:
        'user {string} shares the following resources with user {string} with {string} permissions',
      action: (sharer, receiver, permissions, table) => {
        return 0
      },
    },
    newStep: {
      token: 'WHEN',
      step:
        'user "Alice" shares the following resources with user "Brian" with "read, update, create, delete" permissions',
      table: [
        ['resourceName', 'resourceType'],
        ['simple-folder/subfolder', 'folder'],
        ['lorem.txt', 'file'],
      ],
    },
  },
]

describe('test testContext', () => {
  it.each(testContextData)('test add step for different action types', (Data) => {
    const testContext = new TestContext()
    if (Data.action === 'function') {
      testContext.when(Data.textContext.pattern, () => {
        return 0
      })
    } else {
      expect(() => {
        testContext.when(Data.pattern, 'abc')
      }).toThrowError('not function type')
    }
  })

  const actionFunction = () => {
    return 0
  }

  it('test add step', () => {
    const testContext = new TestContext()

    testContext.addstep('GIVEN', 'user {string} has been created', actionFunction)
    testContext.addstep(
      'GIVEN',
      'user {string} has been created with default attributes',
      actionFunction
    )
    testContext.addstep(
      'GIVEN',
      'user {string} has been created with skeleton files',
      actionFunction
    )

    const expectedSteps = [
      new StepDef('GIVEN', 'user {string} has been created', actionFunction),
      new StepDef(
        'GIVEN',
        'user {string} has been created with default attributes',
        actionFunction
      ),
      new StepDef('GIVEN', 'user {string} has been created with skeleton files', actionFunction),
    ]

    for (let i = 0; i < expectedSteps.length; i++) {
      expect(testContext.steps[i].token).toStrictEqual(expectedSteps[i].token)
      expect(testContext.steps[i].pattern).toStrictEqual(expectedSteps[i].pattern)
      expect(testContext.steps[i].action).toStrictEqual(expectedSteps[i].action)
    }
  })

  it('test add step to check already existing step', () => {
    const testContext = new TestContext()

    testContext.addstep('GIVEN', 'user {string} has been created', () => {
      return 0
    })

    expect(() => {
      testContext.addstep('GIVEN', 'user {string} has been created', () => {
        return 0
      })
    }).toThrowError('step already registered')
  })

  it('test given when and then functions', () => {
    const testContext = new TestContext()

    testContext.given('user {string} has been created', actionFunction)
    testContext.given('user {string} has been created with default attributes', actionFunction)
    testContext.when('admin creates a user {string}', actionFunction)
    testContext.when('admin creates a user {string} with default attributes', actionFunction)
    testContext.then('user {string} should be created', actionFunction)
    testContext.then('user {string} should be created with default attributes', actionFunction)

    const expectedSteps = [
      new StepDef('GIVEN', 'user {string} has been created', actionFunction),
      new StepDef(
        'GIVEN',
        'user {string} has been created with default attributes',
        actionFunction
      ),
      new StepDef('WHEN', 'admin creates a user {string}', actionFunction),
      new StepDef('WHEN', 'admin creates a user {string} with default attributes', actionFunction),
      new StepDef('THEN', 'user {string} should be created', actionFunction),
      new StepDef(
        'THEN',
        'user {string} should be created with default attributes',
        actionFunction
      ),
    ]
    for (let i = 0; i < expectedSteps.length; i++) {
      expect(testContext.steps[i].token).toStrictEqual(expectedSteps[i].token)
      expect(testContext.steps[i].pattern).toStrictEqual(expectedSteps[i].pattern)
      expect(testContext.steps[i].action).toStrictEqual(expectedSteps[i].action)
    }
  })

  it('test getMatch', () => {
    const testContext = new TestContext()
    const expectedStep = []

    for (const Data of getMatchData) {
      let step
      testContext.addstep(Data.addStep.token, Data.addStep.step, Data.addStep.action)

      if (Data.newStep.table) {
        step = new Step(Data.newStep.token, Data.newStep.step, Data.newStep.table)
      } else {
        step = new Step(Data.newStep.token, Data.newStep.step)
      }

      expectedStep.push(testContext.getMatch(step))
    }
    expect(testContext.steps).toStrictEqual(expectedStep)
  })

  it('test before and after function, and setup and cleanup', () => {
    const testContext = new TestContext()
    let called = false
    const beforeFunction = () => {
      called = true
    }
    const afterFunction = () => {
      called = false
    }
    testContext.before(beforeFunction)
    testContext.setup()
    expect(testContext.beforeSteps).toStrictEqual([beforeFunction])
    expect(called).toStrictEqual(true)

    testContext.after(afterFunction)
    testContext.cleanup()
    expect(testContext.afterSteps).toStrictEqual([afterFunction])
    expect(called).toStrictEqual(false)
  })
})
