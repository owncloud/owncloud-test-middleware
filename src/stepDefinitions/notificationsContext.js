const { client } = require('../config.js')
const { Given } = require('../context')
const httpHelper = require('../helpers/httpHelper')
const assert = require('assert')
const util = require('util')

Given('user {string} is sent a notification', function (user) {
  const body = new URLSearchParams()
  body.append('user', user)
  const apiURL = 'apps/testing/api/v1/notifications'

  return httpHelper
    .postOCS(apiURL, 'admin', body)
    .then((res) => httpHelper.checkStatus(res, 'Could not generate notification.'))
})

Given('app {string} has been {string}', async function (app, action) {
  assert.ok(
    action === 'enabled' || action === 'disabled',
    "only supported either 'enabled' or 'disabled'. Passed: " + action
  )

  if (client.globals.ocis) {
    // TODO: decide if we fail on OCIS when a scenario even tries to use this given step
    return
  }

  const errorMessage = util.format(
    'Failed while trying to %s the app',
    action === 'enabled' ? 'enable' : 'disable'
  )
  const apiURL = `cloud/apps/${app}`
  const response =
    (await action) === 'enabled' ? httpHelper.postOCS(apiURL) : httpHelper.deleteOCS(apiURL)
  response
    .then((res) => {
      httpHelper.checkStatus(res, errorMessage)
      return res.json()
    })
    .then((data) => {
      httpHelper.checkOCSStatus(data, errorMessage)
    })
})
