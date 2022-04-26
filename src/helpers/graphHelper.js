const httpHelper = require('./httpHelper')
const userHelper = require('./userSettings')


exports.createUser = async function (
    user,
    password = null,
    displayName = null,
    email = null
) {
    displayName = displayName || userHelper.getDisplayNameForUser(user)
    email = email || userHelper.getEmailAddressForUser(user)
    password = password || userHelper.getPasswordForUser(user)

    const body = JSON.stringify({
        'displayName': displayName,
        'mail': email,
        'onPremisesSamAccountName': user,
        'passwordProfile': { 'password': password }
    })

    console.log('step2 - create')
    return httpHelper
        .postGraph('users', 'admin', body)
        .then(res => httpHelper.checkStatus(res, 'Failed while creating user'))
}

exports.deleteUser = async function (user) {
    console.log('step1 - delete')
    return httpHelper
        .deleteGraph(`users/${user}`, 'admin')
        .then(res => httpHelper.checkStatus(res, 'Failed while deleting user'))
}

exports.getUser = async function (user) {
    console.log('step3 - init')
    return httpHelper
        .getGraph(`users/${user}`, 'admin')
        .then(res => httpHelper.checkStatus(res, 'user does not found'))
}
