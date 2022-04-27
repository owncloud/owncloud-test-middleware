const httpHelper = require('./httpHelper')
const userSettings = require('./userSettings')
const userHelper = require('./userSettings')


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
