const winston = require('winston')

const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase()

const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
  },
}

const logFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `[${level}] - ${timestamp} : ${message}`
})

const log = winston.createLogger({
  levels: logLevels.levels,
  level: LOG_LEVEL,
  transports: [new winston.transports.Console({ timestamp: true })],
  format: winston.format.combine(winston.format.colorize(), winston.format.timestamp(), logFormat),
})

winston.addColors(logLevels.colors)

module.exports = {
  log,
}
