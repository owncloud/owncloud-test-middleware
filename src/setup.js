const { client } = require("./config.js");
const { Before, After } = require("./suite/index.js");
const {
  rollbackConfigs,
  setConfigs,
  cacheConfigs,
} = require("./helpers/config.js");

const ldap = require("./helpers/ldapHelper.js");

Before(function createLdapClient() {
  if (client.globals.ldap) {
    return ldap.createClient().then((ldapClient) => {
      client.globals.ldapClient = ldapClient;
    });
  }
});

After(function deleteLdapClient() {
  if (client.globals.ldap && client.globals.ldapClient) {
    return ldap.terminate(client.globals.ldapClient);
  }
});

async function cacheAndSetConfigs(server) {
  if (client.globals.ocis) {
    return;
  }
  await cacheConfigs(server);
  return setConfigs(server, client.globals.backend_admin_username);
}

Before(function cacheAndSetConfigsOnLocal() {
  if (client.globals.ocis) {
    return;
  }
  return cacheAndSetConfigs(client.globals.backend_url);
});

Before(function cacheAndSetConfigsOnRemoteIfExists() {
  if (client.globals.ocis) {
    return;
  }
  if (client.globals.remote_backend_url) {
    return cacheAndSetConfigs(client.globals.remote_backend_url);
  }
});

// After hooks are run in reverse order in which they are defined
// https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/hooks.md#hooks
After(function rollbackConfigsOnRemoteIfExists() {
  if (client.globals.ocis) {
    return;
  }
  if (client.globals.remote_backend_url) {
    return rollbackConfigs(client.globals.remote_backend_url);
  }
});

After(function rollbackConfigsOnLocal() {
  if (client.globals.ocis) {
    return;
  }
  return rollbackConfigs(client.globals.backend_url);
});
