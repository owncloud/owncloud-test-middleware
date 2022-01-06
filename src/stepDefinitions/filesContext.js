/* eslint-disable no-unused-expressions */
const assert = require('assert')
const { Given, Then } = require('../context')
const webdav = require('../helpers/webdavHelper')
const backendHelper = require('../helpers/backendHelper')
const { move } = require('../helpers/webdavHelper')
const path = require('../helpers/path')
const { download } = require('../helpers/webdavHelper')
const fs = require('fs')

const { client } = require('../config.js')

Given('user {string} has uploaded file with content {string} to {string}', async function(
  user,
  content,
  filename
) {
  await webdav.createFile(user, filename, content)
  return this
})

Given('user {string} has uploaded file {string} to {string}', async function(
  user,
  source,
  filename
) {
  const filePath = path.join(client.globals.filesForUpload, source)
  const content = fs.readFileSync(filePath)
  await webdav.createFile(user, filename, content)
})

Given('user {string} has uploaded file {string} to {string} on remote server', function(
  user,
  source,
  filename
) {
  return backendHelper.runOnRemoteBackend(async function() {
    const filePath = path.join(client.globals.filesForUpload, source)
    const content = fs.readFileSync(filePath)
    await webdav.createFile(user, filename, content)
  })
})

Given('user {string} has moved file/folder {string} to {string}', function(user, fromName, toName) {
  return move(user, fromName, toName)
})

Given('the following files/folders/resources have been deleted by user {string}', async function(
  user,
  table
) {
  const filesToDelete = table.hashes()
  for (const entry of filesToDelete) {
    await webdav.delete(user, entry.name)
  }
  return client
})

Then('as user {string} file/folder {string} should be marked as favorite', async function(
  userId,
  path
) {
  let isFavorite = await webdav.getProperties(path, userId, ['oc:favorite'])
  isFavorite = isFavorite['oc:favorite']

  return assert.strictEqual(isFavorite, '1', `${path} expected to be favorite but was not`)
})


Then('as user {string} file/folder {string} should not be marked as favorite', async function(
  userId,
  path
) {
  let isFavorite = await webdav.getProperties(path, userId, ['oc:favorite'])
  isFavorite = isFavorite['oc:favorite']

  return assert.strictEqual(isFavorite, '0', `not expected ${path} to be favorite but was`)
})

Then('the content of file {string} for user {string} should be {string}', async function(
  file,
  user,
  content
) {
  const remote = await download(user, file)
  return client.assert.strictEqual(
    remote,
    content,
    `Failed asserting remote file ${file} is same as content ${content} for user${user}`
  )
})

Given('user {string} has renamed the following files', function(userId, table) {
  return Promise.all(
    table.hashes().map(row => {
      return webdav.move(userId, row['from-name-parts'], row['to-name-parts'])
    })
  )
})

Given('user {string} has renamed file/folder {string} to {string}', webdav.move)

Given('user {string} has created folder {string} on remote server', function(userId, folderName) {
  return backendHelper.runOnRemoteBackend(async function() {
    await webdav.createFolder(userId, folderName)
  })
})

Given('user {string} has created file {string} on remote server', function(userId, fileName) {
  return backendHelper.runOnRemoteBackend(async function() {
    await webdav.createFile(userId, fileName, '')
  })
})

Given('user {string} has created the following folders', async function(userId, entryList) {
  for (const entry of entryList.rows()) {
    await webdav.createFolder(userId, entry[0])
  }
})

Given('user {string} has created the following files', async function(userId, entryList) {
  for (const entry of entryList.rows()) {
    await webdav.createFile(userId, entry[0])
  }
})

Given('user {string} has renamed the following file', function(user, table) {
  const fromName = table
    .hashes()
    .map(data => data['from-name-parts'])
    .join('')
  const toName = table
    .hashes()
    .map(data => data['to-name-parts'])
    .join('')
  return webdav.move(user, fromName, toName)
})

Given('user {string} has locked file/folder {string} setting the following properties', function(
  userId,
  fileName,
  table
) {
  const properties = table.rowsHash()
  return webdav.lockResource(userId, fileName, properties)
})

// here regex is used so that it can capture steps that use escape characters on file name
// like : "file with \"nested\" quote"
Given(/^user "([^"]*)" has created file "(.+)"$/, function(userId, fileName) {
  // the captured regex won't filter the backslash present in steps with folder name "file with \"nested\" quote"
  // so we need to replace it and send it as `file with "nested" quote`
  fileName = fileName.replaceAll("\\", "")
  return webdav.createFile(userId, fileName, '')
})

// here regex is used so that it can capture steps that use escape characters on folder name
// like : "folder with \"nested\" quote"
Given(/^user "([^"]*)" has created folder "(.+)"$/, function(userId, folderName) {
  // the captured regex won't filter the backslash present in steps with folder name "folder with \"nested\" quote"
  // so we need to replace it and send it as `folder with "nested" quote`
  folderName = folderName.replaceAll("\\", "")
  return webdav.createFolder(userId, folderName)
})
