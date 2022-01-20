const httpHelper = require('./httpHelper')
const occHelper = require('./occHelper')
const { difference } = require('./objects')
const _ = require('lodash')
const pLimit = require('p-limit')

// run 10 promises at once at max
const limit = pLimit(10)

const config = {}

async function setSkeletonDirectory(skeletonType) {
  const directoryName = getActualSkeletonDir(skeletonType)

  if (!directoryName) {
    try {
      await occHelper.runOcc(['config:system:get', 'skeletondirectory'])
    } catch (e) {
      if (e.toString().includes('400 undefined')) return
    }
    return await occHelper.runOcc(['config:system:delete', 'skeletondirectory'])
  }

  const data = JSON.stringify({ directory: directoryName })
  const apiUrl = 'apps/testing/api/v1/testingskeletondirectory'
  const resp = await httpHelper.postOCS(apiUrl, 'admin', data, {
    'Content-Type': 'application/json',
  })

  httpHelper.checkStatus(resp, 'Could not set skeletondirectory.')
}

function rollbackSystemConfigs(oldSysConfig, newSysConfig) {
  const configToChange = difference(newSysConfig, oldSysConfig)
  const _rollbacks = []

  for (const key in configToChange) {
    if (typeof configToChange[key] === 'object') {
      continue
    }
    const value = _.get(oldSysConfig, [key])
    if (value === undefined) {
      _rollbacks.push(limit(occHelper.runOcc, ['config:system:delete', key]))
    } else {
      _rollbacks.push(limit(occHelper.runOcc, ['config:system:set', key, `--value=${value}`]))
    }
  }

  return Promise.all(_rollbacks)
}

function rollbackAppConfigs(oldAppConfig, newAppConfig) {
  const configToChange = difference(newAppConfig, oldAppConfig)

  const _rollbacks = []

  for (const app in configToChange) {
    for (const key in configToChange[app]) {
      const value = _.get(oldAppConfig, [app, key])
      if (value === undefined) {
        _rollbacks.push(limit(occHelper.runOcc, ['config:app:delete', app, key]))
      } else {
        _rollbacks.push(limit(occHelper.runOcc, ['config:app:set', app, key, `--value=${value}`]))
      }
    }
  }

  return Promise.all(_rollbacks)
}

async function getConfigs() {
  const resp = await occHelper.runOcc(['config:list'])
  let stdOut = _.get(resp, 'ocs.data.stdOut')
  if (stdOut === undefined) {
    throw new Error('stdOut notFound')
  }
  stdOut = JSON.parse(stdOut)
  return stdOut
}

async function cacheConfigs(server) {
  config[server] = await getConfigs()
  return config
}

async function setConfigs(skeletonType) {
  await setSkeletonDirectory(skeletonType)
}

async function rollbackConfigs(server) {
  const newConfig = await getConfigs()

  const appConfig = _.get(newConfig, 'apps')
  const systemConfig = _.get(newConfig, 'system')

  const initialAppConfig = _.get(config[server], 'apps')
  const initialSysConfig = _.get(config[server], 'system')

  await Promise.all([
    rollbackSystemConfigs(initialSysConfig, systemConfig),
    rollbackAppConfigs(initialAppConfig, appConfig),
  ])
}

function getActualSkeletonDir(skeletonType) {
  let directoryName

  switch (skeletonType) {
    case 'large':
      directoryName = 'webUISkeleton'
      break
    case 'small':
      directoryName = 'apiSkeleton'
      break
    case 'without':
      // "tinySkeleton" is an empty folder
      directoryName = 'tinySkeleton'
      break
    default:
      directoryName = false
      break
  }
  return directoryName
}

module.exports = {
  getConfigs,
  cacheConfigs,
  setConfigs,
  rollbackConfigs,
  getActualSkeletonDir,
}
