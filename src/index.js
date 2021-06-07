const app = require('./app.js')

const { log } = require('./log.js')

// Configuration
const MIDDLEWARE_PORT = process.env.MIDDLEWARE_PORT || 3000
const MIDDLEWARE_HOST = process.env.MIDDLEWARE_HOST || 'localhost'

app.listen(MIDDLEWARE_PORT, MIDDLEWARE_HOST, () => {
  log.info(`Starting Test Middleware At ${MIDDLEWARE_HOST}:${MIDDLEWARE_PORT}`)
})
