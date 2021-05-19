const app = require('./app.js')

// Configuration
const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || 'localhost'

app.listen(PORT, HOST, () => {
  console.log(`Starting Test Middleware At ${HOST}:${PORT}`)
})
