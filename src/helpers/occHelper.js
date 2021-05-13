const httpHelper = require('../helpers/httpHelper')
const { exec } = require('child_process')

/**
 * Run occ command using the testing API
 *
 * @param {Array} args
 */
exports.runOcc = function (args) {
  const params = new URLSearchParams()
  params.append('command', args.join(' '))
  const apiURL = 'apps/testing/api/v1/occ'
  return httpHelper
    .postOCS(apiURL, 'admin', params)
    .then((res) => {
      httpHelper.checkStatus(res, 'Failed while executing occ command')
      return res.json()
    })
    .then((res) => {
      httpHelper.checkOCSStatus(res, 'Failed while executing occ command')
      return res
    })
}

exports.runOccWithCli = function (args) {
  const CORE_PATH = process.env.CORE_PATH

  return new Promise((resolve, reject) => {
    exec('php ' + CORE_PATH + '/occ ' + args.join(' '), (err, stdout, stderr) => {
      if (err) {
        console.log(err)
      } else {
        resolve(stdout || stderr)
      }
    })
  })
}
