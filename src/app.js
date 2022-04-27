const express = require('express')
const bodyParser = require('body-parser')
const { Step, Token, Table } = require('./gherkin/index.js')
const { testContext } = require('./context/index.js')
const { client } = require('./config.js')
const { log } = require('./log.js')


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

app.post('/execute', async (req, res) => {
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
  let token = step.slice(0, step.indexOf(' '))
  const pattern = step.slice(step.indexOf(' ') + 1)

  token = token.toUpperCase()
  if (!Object.keys(Token).includes(token)) {
    return res.status(400).send('invalid token type')
  }

  if (table) {
    table = new Table(table)
  }

  const reqStep = new Step(token, pattern, table)
  const stepDef = testContext.getMatch(reqStep)

  log.info('Executing new step: ' + JSON.stringify(reqStep))
  if (stepDef) {
    try {
      await stepDef.run(reqStep)
      return res.status(200).json({ success: true, step: reqStep }).end()
    } catch (e) {
      log.error(e.stack)
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

app.post('/init', async (req, res) => {
  try {
    if (!client.globals.ocis) {
      await runOcc(['app:list', 'testing'])
    }
    await testContext.setup()
    initialized = true
    log.info('test middleware initialized')
    return res
      .status(200)
      .json({
        success: true,
        message: 'test middleware initialized',
      })
      .end()
  } catch (e) {
    log.error(e.stack)
    if (
      e.message &&
      e.message === 'HTTP Request Failed: Failed while executing occ command, Status: 500 undefined'
    ) {
      const message = 'testing app is not enabled on the server'
      log.error(message)
      return res.status(500).json({ success: false, message }).end()
    }
    return res.status(400).send(e.stack).end()
  }
})

app.post('/cleanup', async (req, res) => {
  if (!initialized) {
    log.error('Failed to run cleanup: Middleware is not yet initialized')
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
    log.info('Cleaned up the middleware state')
    res.status(200).json({
      success: true,
      message: 'middleware cleaned up.',
    })
  } catch (e) {
    log.error(e.stack)
    res.status(400).send(e.stack)
  }
  res.end()
})

app.get('/state', (req, res) => {
  if (!initialized) {
    log.error('Failed to get the state: Middleware is not yet initialized')
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
    log.error(e.stack)
    return res.status(400).send(e.stack).end()
  }
})

module.exports = app
