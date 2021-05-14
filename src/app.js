const express = require('express')
const bodyParser = require('body-parser')

const { Step, Token, Table } = require('./gherkin/index.js')
const { testContext } = require('./context/index.js')

// Register new contexts here
require('./setup.js')
require('./stepDefinitions/filesContext.js')
require('./stepDefinitions/generalContext.js')
require('./stepDefinitions/notificationsContext.js')
require('./stepDefinitions/provisioningContext.js')
require('./stepDefinitions/publicLinkContext.js')
require('./stepDefinitions/sharingContext.js')
require('./stepDefinitions/webdavContext.js')
const { runOcc } = require('./helpers/occHelper')
const userSettings = require('./helpers/userSettings')

// Create Express Server
const app = express()

app.use(bodyParser.json())

// run cache
let initialized

app.use('/execute', async (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405).end()
  }
  if (!initialized) {
    return res
      .status(403)
      .json({
        success: false,
        message: 'middleware is not initialized yet',
      })
      .end()
  }
  let { step, table } = req.body
  if (!step) {
    return res.status(400).send('Step needs to be provided')
  }
  let token = step.substr(0, step.indexOf(' '))
  const pattern = step.substr(step.indexOf(' ') + 1)

  token = token.toUpperCase()
  if (!Object.keys(Token).includes(token)) {
    return res.status(400).send('invalid token type')
  }

  if (table) {
    table = new Table(table)
  }

  const reqStep = new Step(token, pattern, table)
  const stepDef = testContext.getMatch(reqStep)

  console.log('Executing new step:\n', reqStep)
  if (stepDef) {
    try {
      await stepDef.run(reqStep)
      return res.status(200).json({ success: true, step: reqStep }).end()
    } catch (e) {
      console.log(e)
      return res.status(400).send(e.stack).end()
    }
  } else {
    return res
      .status(404)
      .send(
        `Could not find the matching step definition for "${pattern}"${
          table && table.length ? ' with datatable' : ''
        }`
      )
      .end()
  }
})

app.use('/init', async (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405).end()
  }
  try {
    await runOcc(['app:list', 'testing'])
    await testContext.setup()
    initialized = true
    res
      .status(200)
      .json({
        success: true,
        message: 'test middleware initialized',
      })
      .end()
  } catch (e) {
    if (
      e.message &&
      e.message === 'HTTP Request Failed: Failed while executing occ command, Status: 500 undefined'
    ) {
      return res
        .status(500)
        .json({ success: false, message: 'testing app is not enabled on the server.' })
        .end()
    }
    res.status(400).send(e.stack).end()
  }
})

app.use('/cleanup', async (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405).end()
  }
  if (!initialized) {
    return res
      .status(403)
      .json({
        success: false,
        message: 'middleware is not initialized yet',
      })
      .end()
  }
  try {
    await testContext.cleanup()
    initialized = false
    res.status(200).json({
      success: true,
      message: 'middleware cleaned up.',
    })
  } catch (e) {
    res.status(400).send(e.stack)
  }
  res.end()
})

app.use('/state', (req, res) => {
  if (req.method !== 'GET') {
    return res.writeHead(405).end()
  }
  if (!initialized) {
    return res
      .status(403)
      .json({
        success: false,
        message: 'middleware is not initialized yet',
      })
      .end()
  }
  try {
    return res
      .status(200)
      .json({
        created_users: userSettings.getCreatedUsers(),
        created_remote_users: userSettings.getCreatedUsers('REMOTE'),
        created_groups: userSettings.getCreatedGroups(),
      })
      .end()
  } catch (e) {
    return res.status(400).send(e.stack).end()
  }
})

module.exports = app
