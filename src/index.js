const app = require('./app.js')
const { log } = require('./log.js')

// Configuration
const MIDDLEWARE_PORT = process.env.MIDDLEWARE_PORT || 3000
const MIDDLEWARE_HOST = process.env.MIDDLEWARE_HOST || 'localhost'

const RUN_ON_OCIS = process.env.RUN_ON_OCIS === 'true'
const BACKEND_HOST = process.env.BACKEND_HOST

app.listen(MIDDLEWARE_PORT, MIDDLEWARE_HOST, () => {
  log.info(`Starting Test Middleware At ${MIDDLEWARE_HOST}:${MIDDLEWARE_PORT}`)
  log.info(`Setting up middleware for testing ${RUN_ON_OCIS ? 'ocis' : 'owncloud10'} server at ${BACKEND_HOST}`)
})
