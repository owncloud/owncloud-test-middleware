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

// Create Express Server
const app = express()

app.use(bodyParser.json())

// Configuration
const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || 'localhost'

app.use('/execute', async (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405).end()
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
      const args = [...reqStep.data]
      if (table) {
        args.push(table)
      }
      await stepDef.run(...args)
      return res.writeHead(200).end()
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
    await testContext.setup()
    res.writeHead(200)
  } catch (e) {
    res.status(400).send(e.stack)
  }
  res.end()
})

app.use('/cleanup', async (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405).end()
  }
  try {
    await testContext.cleanup()
    res.writeHead(200)
  } catch (e) {
    res.status(400).send(e.stack)
  }
  res.end()
})

app.listen(PORT, HOST, () => {
  console.log(`Starting Test Middleware At ${HOST}:${PORT}`)
})
