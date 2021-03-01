/* eslint-disable no-unused-expressions */
const assert = require("assert");
const { Given, Then } = require("../suite");
const webdav = require("../helpers/webdavHelper");
const { move } = require("../helpers/webdavHelper");
const path = require("../helpers/path");
const { download } = require("../helpers/webdavHelper");
const fs = require("fs");

const { client } = require("../config.js");

Given(
  "user {string} has uploaded file with content {string} to {string}",
  async function (user, content, filename) {
    await webdav.createFile(user, filename, content);
  }
);

Given(
  "user {string} has uploaded file {string} to {string}",
  async function (user, source, filename) {
    const filePath = path.join(client.globals.filesForUpload, source);
    const content = fs.readFileSync(filePath);
    await webdav.createFile(user, filename, content);
  }
);

Given(
  "user {string} has moved file/folder {string} to {string}",
  function (user, fromName, toName) {
    return move(user, fromName, toName);
  }
);

Given(
  "the following files/folders/resources have been deleted by user {string}",
  async function (user, table) {
    const filesToDelete = table.hashes();
    for (const entry of filesToDelete) {
      await webdav.delete(user, entry.name);
    }
  }
);

Then(
  "the content of file {string} for user {string} should be {string}",
  async function (file, user, content) {
    const remote = await download(user, file);
    return client.assert.strictEqual(
      remote,
      content,
      `Failed asserting remote file ${file} is same as content ${content} for user${user}`
    );
  }
);

Then(
  "as user {string} file/folder {string} should be marked as favorite",
  async function (userId, path) {
    let isFavorite = await webdav.getProperties(path, userId, ["oc:favorite"]);
    isFavorite = isFavorite["oc:favorite"];

    return assert.strictEqual(
      isFavorite,
      "1",
      `${path} expected to be favorite but was not`
    );
  }
);

Then(
  "as user {string} file/folder {string} should not be marked as favorite",
  async function (userId, path) {
    let isFavorite = await webdav.getProperties(path, userId, ["oc:favorite"]);
    isFavorite = isFavorite["oc:favorite"];

    return assert.strictEqual(
      isFavorite,
      "0",
      `not expected ${path} to be favorite but was`
    );
  }
);

Given(
  "user {string} has renamed the following files",
  function (userId, table) {
    return Promise.all(
      table.hashes().map((row) => {
        return webdav.move(
          userId,
          row["from-name-parts"],
          row["to-name-parts"]
        );
      })
    );
  }
);

Given(
  "user {string} has renamed file/folder {string} to {string}",
  webdav.move
);

Given("user {string} has created folder {string}", webdav.createFolder);

Given("user {string} has created file {string}", function (userId, fileName) {
  return webdav.createFile(userId, fileName, "");
});

Given(
  "user {string} has created the following folders",
  function (userId, entryList) {
    entryList.rows().forEach((entry) => {
      webdav.createFolder(userId, entry[0]);
    });
    return client;
  }
);

Given(
  "user {string} has created the following files",
  function (userId, entryList) {
    entryList.rows().forEach((entry) => {
      webdav.createFile(userId, entry[0]);
    });
    return client;
  }
);
