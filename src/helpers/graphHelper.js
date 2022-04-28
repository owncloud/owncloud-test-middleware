const httpHelper = require('./httpHelper')
const userSettings = require('./userSettings')
const userHelper = require('./userSettings')
const backendHelper = require('../helpers/backendHelper')
const { join } = require('./path')


exports.createUser = function (
    user,
    password = null,
    displayName = null,
    email = null
) {
    displayName = displayName || userHelper.getDisplayNameForUser(user)
    email = email || userHelper.getEmailAddressForUser(user)
    password = password || userHelper.getPasswordForUser(user)

    const body = JSON.stringify({
        displayName,
        mail: email,
        onPremisesSamAccountName: user,
        passwordProfile: { password }
    })
    userSettings.addUserToCreatedUsersList(user, password, displayName, email)
    return httpHelper
        .postGraph('users', 'admin', body)
        .then(res => httpHelper.checkStatus(res, 'Failed while creating user'))
}

exports.deleteUser = function (user) {
    return httpHelper
        .deleteGraph(`users/${user}`, 'admin')
}

exports.getUser = function (user) {
    return httpHelper
        .getGraph(`users/${user}`, 'admin')
        .then(res => httpHelper.checkStatus(res, 'user does not found'))
}

exports.createGroup = function (group) {
    const body = JSON.stringify({ displayName: group })
    return httpHelper
        .postGraph('groups', 'admin', body)
        .then(res => httpHelper.checkStatus(res, 'Failed while creating group'))
}

exports.getGroup = function (group) {
    return httpHelper
        .getGraph(`groups/${group}`, 'admin')
}

exports.deleteGroup = async function (group) {
    // deleting group does not work with the groupname. so we find groupId
    const groupId = await getGroupId(group)
    return httpHelper
        .deleteGraph(`groups/${groupId}`, 'admin')
}

async function getGroupId(group) {
    const response = await httpHelper
        .getGraph('groups/', 'admin')
        .then(res => res.json())

    for (const key in response.value) {
        if (response.value[key].displayName === group) {
            return response.value[key].id
        }
    }
}

async function getUserId(user) {
    const response = await httpHelper
        .getGraph(`users/${user}`, 'admin')
        .then(res => res.json())

    return response.id
}

exports.addToGroup = async function (user, group) {
    const groupId = await getGroupId(group)
    const userId = await getUserId(user)

    const url = join(backendHelper.getCurrentBackendUrl(), 'graph/v1.0/users', userId)
    const body = JSON.stringify({
        '@odata.id': url
    })

    return httpHelper
        .postGraph(`groups/${groupId}/members/$ref`, 'admin', body)
        .then(res => httpHelper.checkStatus(res, 'Failed while adding member to group'))
}
