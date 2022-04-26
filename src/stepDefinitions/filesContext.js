const assert = require('assert')
const fs = require('fs')
const convert = require('xml-js')
const { Given, Then, After } = require('../context')
const backendHelper = require('../helpers/backendHelper')
const { move } = require('../helpers/webdavHelper')
const path = require('../helpers/path')
const { download } = require('../helpers/webdavHelper')
const { client } = require('../config.js')
const webdavHelper = require('../helpers/webdavHelper')

const createdFiles = []
const createdFolders = []

After(() => {
  createdFiles.forEach((fileName) => {
    try {
      fs.unlinkSync(fileName)
    } catch (err) {
      console.info(err.message)
    }
  })
  createdFolders.forEach((folderPath) => {
    try {
      fs.rmSync(folderPath, { recursive: true, force: true })
    } catch (err) {
      console.info(err.message)
    }
  })
})

Given('user {string} has uploaded file with content {string} to {string}', async function(
  user,
  content,
  filename
) {
  await webdavHelper.createFile(user, filename, content)
  return this
})

Given('user {string} has uploaded file {string} to {string}', async function(
  user,
  source,
  filename
) {
  const filePath = path.join(client.globals.filesForUpload, source)
  const content = fs.readFileSync(filePath)
  await webdavHelper.createFile(user, filename, content)
})

Given('user {string} has uploaded file {string} to {string} on remote server', function(
  user,
  source,
  filename
) {
  return backendHelper.runOnRemoteBackend(async function() {
    const filePath = path.join(client.globals.filesForUpload, source)
    const content = fs.readFileSync(filePath)
    await webdavHelper.createFile(user, filename, content)
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
    await webdavHelper.delete(user, entry.name)
  }
  return client
})

Given(
  'a file with the size of {string} bytes and the name {string} has been created locally',
  function (size, name) {
    const fullPathOfLocalFile = path.join(client.globals.filesForUpload, name)
    const fh = fs.openSync(fullPathOfLocalFile, 'w')
    fs.writeSync(fh, 'A', Math.max(0, size - 1))
    fs.closeSync(fh)
    createdFiles.push(fullPathOfLocalFile)
  }
)

Given('a folder {string} has been created with the following files in separate sub-folders', async function(folderName, filesTable) {
  const filesForUpload = client.globals.filesForUpload
  const folderPath = path.join(filesForUpload, folderName)

  function createFolder(path) {
    return fs.mkdirSync(path, { recursive: true })
  }
  try {
    await fs.accessSync(folderPath, fs.constants.F_OK)
    await fs.rmSync(folderPath, { recursive: true, force: true })
    createFolder(folderPath)
  } catch (err) {
    // folder does not exist so create new one
    createFolder(folderPath)
  }

  for (const tableRow of filesTable.hashes()) {
    const subFolderPath = path.join(folderPath, tableRow.subFolder)
    try {
      await fs.accessSync(subFolderPath, fs.constants.F_OK)
    } catch (err) {
      // folder does not exist so create new one
      createFolder(subFolderPath)
    } finally {
      if (tableRow.file) {
        fs.copyFileSync(
          path.join(filesForUpload, tableRow.file),
          path.join(subFolderPath, tableRow.file)
        )
      }
    }
  }
  // only the upper folder is enough to remember
  // every file/folder within will be removed in the after scene
  createdFolders.push(folderPath)
})

Then(
  'as {string} the content of {string} should be the same as the content of local file {string}',
  async function(userId, remoteFile, localFile) {
    const fullPathOfLocalFile = path.join(client.globals.filesForUpload, localFile)
    const body = await webdavHelper.download(userId, remoteFile)

    assertContentOfLocalFileIs(fullPathOfLocalFile, body)

    return this
  }
)

Then(
  'as {string} the content of {string} should not be the same as the content of local file {string}',
  async function(userId, remoteFile, localFile) {
    const fullPathOfLocalFile = path.join(client.globals.filesForUpload, localFile)
    const body = await webdavHelper.download(userId, remoteFile)

    assertContentOfLocalFileIsNot(fullPathOfLocalFile, body)
  }
)

const assertContentOfLocalFileIs = function(fullPathOfLocalFile, actualContent) {
  const expectedContent = fs.readFileSync(fullPathOfLocalFile, { encoding: 'utf-8' })
  return assert.strictEqual(
    actualContent,
    expectedContent,
    'asserting content of local file "' + fullPathOfLocalFile + '"'
  )
}

const assertContentOfLocalFileIsNot = function(fullPathOfLocalFile, actualContent) {
  const expectedContent = fs.readFileSync(fullPathOfLocalFile, { encoding: 'utf-8' })
  return assert.notStrictEqual(
    actualContent,
    expectedContent,
    'asserting content of local file "' + fullPathOfLocalFile + '"'
  )
}


Then('as user {string} file/folder {string} should be marked as favorite', async function(
  userId,
  path
) {
  let isFavorite = await webdavHelper.getProperties(path, userId, ['oc:favorite'])
  isFavorite = isFavorite['oc:favorite']

  return assert.strictEqual(isFavorite, '1', `${path} expected to be favorite but was not`)
})


Then('as user {string} file/folder {string} should not be marked as favorite', async function(
  userId,
  path
) {
  let isFavorite = await webdavHelper.getProperties(path, userId, ['oc:favorite'])
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
      return webdavHelper.move(userId, row['from-name-parts'], row['to-name-parts'])
    })
  )
})

Given('user {string} has renamed file/folder {string} to {string}', webdavHelper.move)

Given('user {string} has created folder {string} on remote server', function(userId, folderName) {
  return backendHelper.runOnRemoteBackend(async function() {
    await webdavHelper.createFolder(userId, folderName)
  })
})

Given('user {string} has created file {string} on remote server', function(userId, fileName) {
  return backendHelper.runOnRemoteBackend(async function() {
    await webdavHelper.createFile(userId, fileName, '')
  })
})

Given('user {string} has created the following folders', async function(userId, entryList) {
  for (const entry of entryList.rows()) {
    await webdavHelper.createFolder(userId, entry[0])
  }
})

Given('user {string} has created the following files', async function(userId, entryList) {
  for (const entry of entryList.rows()) {
    await webdavHelper.createFile(userId, entry[0])
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
  return webdavHelper.move(user, fromName, toName)
})

Given('user {string} has locked file/folder {string} setting the following properties', function(
  userId,
  fileName,
  table
) {
  const properties = table.rowsHash()
  return webdavHelper.lockResource(userId, fileName, properties)
})

// here regex is used so that it can capture steps that use escape characters on file name
// like : "file with \"nested\" quote"
Given(/^user "([^"]*)" has created file "(.+)"$/, function(userId, fileName) {
  // the captured regex won't filter the backslash present in steps with folder name "file with \"nested\" quote"
  // so we need to replace it and send it as `file with "nested" quote`
  fileName = fileName.replaceAll('\\', '')
  return webdavHelper.createFile(userId, fileName, '')
})

// here regex is used so that it can capture steps that use escape characters on folder name
// like : "folder with \"nested\" quote"
Given(/^user "([^"]*)" has created folder "(.+)"$/, function(userId, folderName) {
  // the captured regex won't filter the backslash present in steps with folder name "folder with \"nested\" quote"
  // so we need to replace it and send it as `folder with "nested" quote`
  folderName = folderName.replaceAll('\\', '')
  return webdavHelper.createFolder(userId, folderName)
})

Then(
  'as user {string} folder {string} should contain {string} items',
  async function (userName, folderName, itemsCount) {
    const davPath = webdavHelper.createDavPath(userName, folderName)
    const xmlResponse = await webdavHelper.propfind(davPath, userName, [])
    const resObj = convert.xml2js(xmlResponse, { compact: true })
    // 'd:response' contains entry for requested folder too
    // so we need to subtract 1 to get the actual items count
    const actualCount = resObj['d:multistatus']['d:response'].length - 1
    itemsCount = parseInt(itemsCount)
    return assert.strictEqual(
      actualCount,
      itemsCount,
      `Expected '${itemsCount}' items inside the folder '${folderName}' but got '${actualCount}'`
    )
  }
)
