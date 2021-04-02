/* eslint no-undef: 0 */
const { Step } = require('./index')

const stepData = [
  [
    {
      data: {
        token: 'Given',
        step: 'these groups have been created:',
        dataTable: [['groupname'], ['HelloGroup']],
        dataValue: [],
      },
      token: 'Given',
      stepPattern: 'these groups have been created:',
      table: [['groupname'], ['HelloGroup']],
    },
  ],
  [
    {
      data: {
        token: 'Given',
        step: 'user {string} has been created with default attributes',
        dataTable: [],
        dataValue: ['Alice'],
      },
      token: 'Given',
      stepPattern: 'user "Alice" has been created with default attributes',
      table: [],
    },
  ],
  [
    {
      data: {
        token: 'Given',
        step: 'user {string} has created these groups',
        dataTable: [['groupname'], ['HelloGroup']],
        dataValue: ['Alice'],
      },
      token: 'Given',
      stepPattern: 'user "Alice" has created these groups',
      table: [['groupname'], ['HelloGroup']],
    },
  ],
  [
    {
      data: {
        token: 'Given',
        step: 'user {string} has created file {string}',
        dataTable: [],
        dataValue: ['Alice', 'textfile.txt'],
      },
      token: 'Given',
      stepPattern: 'user "Alice" has created file "textfile.txt"',
      table: [],
    },
  ],
  [
    {
      data: {
        token: 'When',
        step: 'user {string} shares the following files with user {string}',
        dataTable: [['filename'], ['textfile.txt'], ['lorem.txt']],
        dataValue: ['Alice', 'Brian'],
      },
      token: 'When',
      stepPattern: 'user "Alice" shares the following files with user "Brian"',
      table: [['filename'], ['textfile.txt'], ['lorem.txt']],
    },
  ],
  [
    {
      data: {
        token: 'Then',
        step: 'user {string} should have {int} notifications displayed in the webUI',
        dataTable: [],
        dataValue: ['Alice', '2'],
      },
      token: 'Then',
      stepPattern: 'user "Alice" should have 2 notifications displayed in the webUI',
      table: [],
    },
  ],
  [
    {
      data: {
        token: 'Then',
        step: 'user {string} should have {int} files in the {string} page',
        dataTable: [],
        dataValue: ['Alice', '2', 'Shared with you'],
      },
      token: 'Then',
      stepPattern: 'user "Alice" should have 2 files in the "Shared with you" page',
      table: [],
    },
  ],
  [
    {
      data: {
        token: 'Given',
        step:
          'user {string} has shared folder {string} with user {string} with {string} permissions',
        dataTable: [],
        dataValue: ['Alice', 'simple-folder/sub-folder', 'Brian', 'read, update, create, delete'],
      },
      token: 'Given',
      stepPattern:
        'user "Alice" has shared folder "simple-folder/sub-folder" with user "Brian" with "read, update, create, delete" permissions',
      table: [],
    },
  ],
  [
    {
      data: {
        token: 'Given',
        step:
          'user {string} has shared the following resources with user {string} with {string} permissions',
        dataTable: [
          ['resourceName', 'resourceType'],
          ['simple-folder/subfolder', 'folder'],
          ['lorem.txt', 'file'],
        ],
        dataValue: ['Alice', 'Brian', 'read, update, create, delete'],
      },
      token: 'Given',
      stepPattern:
        'user "Alice" has shared the following resources with user "Brian" with "read, update, create, delete" permissions',
      table: [
        ['resourceName', 'resourceType'],
        ['simple-folder/subfolder', 'folder'],
        ['lorem.txt', 'file'],
      ],
    },
  ],
]

describe('test Step class with and without data and table', () => {
  it.each(stepData)('the step class returns correct data', (Data) => {
    const step = new Step(Data.token, Data.stepPattern, Data.table)
    expect(step.token).toStrictEqual(Data.data.token)
    expect(step.pattern).toStrictEqual(Data.data.step)
    expect(step.data).toStrictEqual(Data.data.dataValue)
    expect(step.table).toStrictEqual(Data.data.dataTable)
    expect(step.literal).toStrictEqual(Data.stepPattern)
  })
})
