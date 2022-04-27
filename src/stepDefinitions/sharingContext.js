require('url-search-params-polyfill')
const _ = require('lodash')
const util = require('util')
const assert = require('assert')
const { URLSearchParams } = require('url')
const { client } = require('../config.js')
const { Given, When, Then } = require('../context')
const httpHelper = require('../helpers/httpHelper')
const backendHelper = require('../helpers/backendHelper')
const sharingHelper = require('../helpers/sharingHelper')
const { runOcc } = require('../helpers/occHelper')
const path = require('../helpers/path')

let timeOfLastShareOperation = Date.now()

const SHARE_TYPES = sharingHelper.SHARE_TYPES

Given(
  'user {string} from remote server has shared {string} with user {string} from local server',
  function(sharer, file, receiver) {
    receiver = util.format('%s@%s', receiver, client.globals.backend_url)
    return backendHelper.runOnRemoteBackend(
      shareFileFolder,
      file,
      sharer,
      receiver,
      SHARE_TYPES.federated_cloud_share
    )
  }
)

Given(
  'user {string} from remote server has shared {string} with user {string} from local server with {string} permissions',
  function(sharer, file, receiver, permission) {
    receiver = util.format('%s@%s', receiver, client.globals.backend_url)
    return backendHelper.runOnRemoteBackend(
      shareFileFolder,
      file,
      sharer,
      receiver,
      SHARE_TYPES.federated_cloud_share,
      permission
    )
  }
)

When(
  'user {string} from remote server shares {string} with user {string} from local server',
  function(sharer, file, receiver) {
    receiver = util.format('%s@%s', receiver, client.globals.backend_url)
    return backendHelper.runOnRemoteBackend(
      shareFileFolder,
      file,
      sharer,
      receiver,
      SHARE_TYPES.federated_cloud_share
    )
  }
)

/**
 * makes sure share operations are carried out maximum once a second to avoid same stime
 */
 const waitBetweenShareOperations = function() {
  const timeSinceLastShare = Date.now() - timeOfLastShareOperation
  if (timeSinceLastShare <= 1001) {
    return new Promise(resolve => {
      setTimeout(resolve, 1001 - timeSinceLastShare)
    })
  }
 }

/**
 * update time in which the last share operation was carried out
 */
const updateTimeOfLastShareOperation = function() {
  timeOfLastShareOperation = Date.now()
}


/**
 * creates a new share
 *
 * @param {string} elementToShare  path of file/folder being shared
 * @param {string} sharer  username of the sharer
 * @param {string|null} receiver  username of the receiver
 * @param {number} shareType  Type of share 0 = user, 1 = group, 3 = public (link), 6 = federated (cloud share).
 * @param {string} permissionString  permissions of the share for valid permissions see sharingHelper.PERMISSION_TYPES
 * @param {string|null} name name of the link (for public links), default = "New Share"
 * @param {object} extraParams Extra parameters allowed on the share
 * @param {string} extraParams.password Password of the share (public links)
 * @param {string} extraParams.expireDate Expiry date of the share
 */
 const shareFileFolder = async function(
  elementToShare,
  sharer,
  receiver = null,
  shareType = SHARE_TYPES.user,
  permissionString = 'all',
  name = null,
  extraParams = {}
) {
  await waitBetweenShareOperations()
  const params = new URLSearchParams()
  elementToShare = path.resolve(elementToShare)
  const permissions = sharingHelper.humanReadablePermissionsToBitmask(permissionString)
  params.append('path', elementToShare)
  if (receiver) {
    if (receiver.endsWith('@%remote_backend_url%')) {
      shareType = SHARE_TYPES.federated_cloud_share
      receiver = receiver.replace('%remote_backend_url%', client.globals.remote_backend_url)
    }
    params.append('shareWith', receiver)
  }
  params.append('shareType', shareType.toString())
  params.append('permissions', permissions.toString())
  if (name) {
    params.append('name', name)
  }
  for (const key in extraParams) {
    if (extraParams[key]) {
      params.append(key, extraParams[key])
    }
  }
  const url = 'apps/files_sharing/api/v1/shares'
  await httpHelper
    .postOCS(url, sharer, params)
    .then(res => res.json())
    .then(function(json) {
      httpHelper.checkOCSStatus(json, 'Could not create share. Message: ' + json.ocs.meta.message)
    })
  await updateTimeOfLastShareOperation()
}

/**
 * create any share using dataTable
 *
 * @param {string} sharer
 * @param {object} dataTable (attrs like: path, shareWith, expireDate, name, permissionString,
 * shareTypeString, password can be passed inside dataTable)
 *
 * @return void
 */
 Given('user {string} has created a new share with following settings', function(sharer, dataTable) {
  const settings = dataTable.rowsHash()
  const expireDate = settings.expireDate
  let dateToSet = ''
  if (typeof expireDate !== 'undefined') {
    dateToSet = sharingHelper.calculateDate(expireDate)
  }
  let targetShareType = null
  if (settings.shareTypeString) {
    targetShareType = sharingHelper.humanReadableShareTypeToNumber(settings.shareTypeString)
  }
  return shareFileFolder(
    settings.path,
    sharer,
    settings.shareWith,
    targetShareType,
    settings.permissionString,
    settings.name,
    {
      expireDate: dateToSet,
      password: settings.password
    }
  )
})

/**
 * sets up data into a standard format for creating new public link share
 *
 * @param {string} sharer user creating share
 * @param {object} data fields table with required share properties
 * @param {string} data.name Name of the new share(public links)
 * @param {string} data.shareType Type of share
 * @param {string} data.shareWith Receiver of the share
 * @param {string} data.path Path of file/folder/resource to be shared
 * @param {string} data.password Password of the share
 * @param {string} data.permissions Allowed permissions on the share
 * @param {string} data.expireDate Expiry date of the share
 */
 const createPublicLink = function(sharer, data) {
  let { path, permissions = 'read', name, password, expireDate } = data

  if (typeof expireDate !== 'undefined') {
    expireDate = sharingHelper.calculateDate(expireDate)
  }

  return shareFileFolder(path, sharer, null, SHARE_TYPES.public_link, permissions, name, {
    password,
    expireDate
  })
}

const checkReceivedSharesExpirationDate = function(user, target, days) {
  const apiURL = 'apps/files_sharing/api/v1/shares?shared_with_me=true'
  return httpHelper
    .getOCS(apiURL, user)
    .then(res => res.json())
    .then(function(result) {
      httpHelper.checkOCSStatus(result, 'Could not get shares. Message: ' + result.ocs.meta.message)
      const shares = result.ocs.data
      const currentDate = new Date()
      const getDay = Number(currentDate.getDate()) + Number(days)
      let expectedExpirationDate = new Date(currentDate.setDate(getDay))
      // Set time to midnight
      expectedExpirationDate = new Date(expectedExpirationDate.setHours(0, 0, 0, 0))
      let found = false
      const foundDates = []

      for (const share of shares) {
        if (
          share.file_target === `/${target}` &&
          expectedExpirationDate.getTime() === new Date(share.expiration).getTime()
        ) {
          found = true
          break
        }

        if (share.expiration) {
          foundDates.push(`${share.file_target.substr(1)}: ${new Date(share.expiration)}`)
        }
      }

      foundDates.join(', ')

      const message = found
        ? 'Expiration date was found'
        : `Expected ${target}: ${expectedExpirationDate}. Found ${foundDates || 'none'}`

      return client.assert.ok(found, message)
    })
}

Given('user {string} has shared file/folder {string} with user {string}', function(
  sharer,
  elementToShare,
  receiver
) {
  return shareFileFolder(elementToShare, sharer, receiver)
})

Given(
  'user {string} has shared file/folder {string} with user {string} with {string} permission/permissions',
  function(sharer, elementToShare, receiver, permissions) {
    return shareFileFolder(elementToShare, sharer, receiver, SHARE_TYPES.user, permissions)
  }
)

Given('user {string} has shared file/folder {string} with group {string}', function(
  sharer,
  elementToShare,
  receiver
) {
  return shareFileFolder(elementToShare, sharer, receiver, SHARE_TYPES.group)
})

Given(
  'user {string} has shared file/folder {string} with group {string} with {string} permission/permissions',
  function(sharer, elementToShare, receiver, permissions) {
    return shareFileFolder(elementToShare, sharer, receiver, SHARE_TYPES.group, permissions)
  }
)

Given('user {string} has shared file/folder {string} with link with {string} permissions', function(
  sharer,
  elementToShare,
  permissions
) {
  return shareFileFolder(elementToShare, sharer, null, SHARE_TYPES.public_link, permissions)
})

Given(
  'user {string} has shared file/folder {string} with link with {string} permissions and password {string}',
  function(sharer, elementToShare, permissions, password) {
    return shareFileFolder(
      elementToShare,
      sharer,
      null,
      SHARE_TYPES.public_link,
      permissions,
      null,
      { password }
    )
  }
)

Given('the administrator has enabled exclude groups from sharing', function() {
  return runOcc(['config:app:set core shareapi_exclude_groups --value=yes'])
})

Given('the administrator has excluded group {string} from sharing', async function(group) {
  const configList = await runOcc(['config:list'])
  const config = _.get(configList, 'ocs.data.stdOut')
  const configParsed = JSON.parse(config)
  const initialExcludedGroup = JSON.parse(
    _.get(configParsed, 'apps.core.shareapi_exclude_groups_list') || '[]'
  )
  if (!initialExcludedGroup.includes(group)) {
    initialExcludedGroup.push(group)
    const resultGroupList = initialExcludedGroup.map(res => '"' + res + '"')
    const resultToString = resultGroupList.join(',')
    return runOcc([
      'config:app:set',
      'core',
      'shareapi_exclude_groups_list',
      '--value=[' + resultToString + ']'
    ])
  }
})

Given(
  'the administrator has set the minimum characters for sharing autocomplete to {string}',
  function(value) {
    return runOcc(['config:system:set user.search_min_length --value=' + value])
  }
)

Given('user {string} has created a public link with following settings', function(
  sharer,
  dataTable
) {
  return createPublicLink(sharer, dataTable.rowsHash())
})

Given('the administrator has excluded group {string} from receiving shares', async function(group) {
  const configList = await runOcc(['config:list'])
  const config = _.get(configList, 'ocs.data.stdOut')
  const configParsed = JSON.parse(config)
  const initialExcludedGroup = JSON.parse(
    _.get(configParsed, 'apps.files_sharing.blacklisted_receiver_groups') || '[]'
  )
  if (!initialExcludedGroup.includes(group)) {
    initialExcludedGroup.push(group)
    let excludedGroups = initialExcludedGroup.map(res => `"${res}"`)
    excludedGroups = excludedGroups.join(',')
    return runOcc([
      'config:app:set',
      'files_sharing',
      'blacklisted_receiver_groups',
      '--value=[' + excludedGroups + ']'
    ])
  }
})

Then('user {string} should have received a share with these details:', function(
  user,
  expectedDetailsTable
) {
  return sharingHelper.assertUserHasShareWithDetails(user, expectedDetailsTable, {
    shared_with_me: true
  })
})

Then('user {string} should not have received any shares', function(user) {
  return sharingHelper.assertUserHasNoShares(user)
})

Given('user {string} has created a new public link for resource {string}', function(
  user,
  resource
) {
  return shareFileFolder(resource, user, '', SHARE_TYPES.public_link)
})

Then('user {string} should have shared a file/folder with these details:', function(
  user,
  expectedDetailsTable
) {
  return sharingHelper.assertUserHasShareWithDetails(user, expectedDetailsTable, {
    shared_with_me: false
  })
})

Then('user {string} should have shared a file/folder {string} with these details:', function(
  user,
  path,
  expectedDetailsTable
) {
  return sharingHelper.assertUserHasShareWithDetails(user, expectedDetailsTable, {
    shared_with_me: false,
    path
  })
})

Then('user {string} should have a share with these details:', function(user, expectedDetailsTable) {
  return sharingHelper.assertUserHasShareWithDetails(user, expectedDetailsTable)
})

Given('user {string} has declined the share {string} offered by user {string}', function(
  user,
  filename,
  sharer
) {
  return sharingHelper.declineShare(filename, user, sharer)
})

Given('user {string} has accepted the share {string} offered by user {string}', function(
  user,
  filename,
  sharer
) {
  return sharingHelper.acceptShare(filename, user, sharer)
})

When(
  'user {string} accepts the share {string} offered by user {string} using the sharing API',
  function(user, filename, sharer) {
    return sharingHelper.acceptShare(filename, user, sharer)
  }
)

Given('user {string} from server {string} has accepted the last pending share', function(
  user,
  server
) {
  if (server === backendHelper.BACKENDS.remote) {
    return backendHelper.runOnRemoteBackend(() => sharingHelper.acceptLastPendingShare(user))
  } else {
    return sharingHelper.acceptLastPendingShare(user)
  }
})

When(
  'user {string} from server {string} accepts the last pending share using the sharing API',
  function(user, server) {
    if (server === backendHelper.BACKENDS.remote) {
      return backendHelper.runOnRemoteBackend(() => sharingHelper.acceptLastPendingShare(user))
    } else {
      return sharingHelper.acceptLastPendingShare(user)
    }
  }
)

Then('user {string} should not have created any shares', async function(user) {
  const shares = await sharingHelper.getAllSharesSharedByUser(user)
  assert.strictEqual(shares.length, 0, 'There should not be any share, but there are')
})

Then(
  'user {string} should have received a share with target {string} and expiration date in {int} day/days',
  function(user, target, days) {
    return checkReceivedSharesExpirationDate(user, target, days)
  }
)

Given('the administrator has set the default folder for received shares to {string}', function(
  folder
) {
  if (client.globals.ocis) {
    if (folder === 'Shares') {
      return
    }
    throw Error(`Cannot set ${folder} as default share received folder in OCIS`)
  }
  return runOcc([`config:system:set share_folder --value=${folder}`])
})

Given(
  'the administrator has set the default folder for received shares to {string} on remote server',
  function(folder) {
    if (client.globals.ocis) {
      if (folder === 'Shares') {
        return
      }
      throw Error(`Cannot set ${folder} as default share received folder in OCIS`)
    }
    return backendHelper.runOnRemoteBackend(runOcc, [
      [`config:system:set share_folder --value=${folder}`]
    ])
  }
)

Given(
  'user {string} has updated the share permissions for file/folder {string} to {string} for user {string}',
  function(sharer, resource, permissions, receiver) {
    return sharingHelper.updateSharedFilePermissionByUser(sharer, resource, permissions, receiver)
  }
)
