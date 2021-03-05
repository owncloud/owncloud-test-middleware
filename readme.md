## oc Test middleware service

This is a middleware server for testing owncloud (owncloud10 or OCIS) with different Clients. This server handles the operations which are required to "get the server to a certain state"

### How it works
Since most tests in owncloud are written in gherkin, the middleware server accepts gherkin step, parses it and runs the appropriate code to get the server to a certainstate.

for eg. If we want to run a gherkin step `Given user "Alice" has been created with default attributes`, the wen send this step to the middleware server which runs it and creates the user on the oc server with all necessary default attributes (displayname, email etc.) and also stores the user so that we can cleanup after the test is complete.

### Endpoints
- POST /init
    
    reset the server step and start a test scenario execution
    ```
    curl -XPOST http:/localhost:3000/init
    ```

- POST /execute

    execute a gherkin step
    ```
    curl -XPOST http:/localhost:3000/execute -d '{"step": "Given user \"Alice\" has been created with default attributes"}' -H "Content-Type: application/json"
    ```

- POST /cleanup

    cleanup the middleware state and the owncloud server
    ```
    curl -XPOST http:/localhost:3000/cleanup
    ```

### Integration with test frameworks
The middleware service is desiged to used with the gherkin test runner such as cucumber and behat. In order to integrate this service with the tests suite, we need to find a way to capture the steps that needs to be run in the middleware. Most test runners allow use of regex in the matching of the stepdefinition. We can use any regex rule to match all the steps that needs to run in the middleware. you can caputure them at once and send them to the middleware service.
for eg. for all the steps you want to run in the middleware start them with `in the server`, then you can use regex `/^in the server (.*)$/` to capture all the steps

eg. Cucumber Integration

```gherkin
# test.feature
Feature: test feature

  Background:
    Given in the server user "Alice" has been created with default attributes
    And in the server user "Alice" has created folder "new folder"
  
  Scenario: ...
```

```js
// someContext.js
function handler(statement) {
    return fetch("http://localhost:3000/execute", {
        method: "POST",
        body: JSON.stringify({step: "Given " + statement}),
        headers: {
            'Content-Type': 'application/json'
        },
    }).then(res => {
        if (res.ok) {
            return res.text()
        } else {
            throw new Error(res.text())
        }
    }).catch(err => {
        console.error(err)
        return Promise.reject(err)
    })
}

Before(function() {
    return fetch("http://localhost:3000/init", {
        method: "POST"
    })
})

After(function() {
    return fetch("http://localhost:3000/cleanup", {
        method: "POST"
    })
})

Given(/^in the server (.*)$/, handler);
```

**notes**
- You will need to create a seperate matcher if you want to send data tables because cucumber will not match same step with optional datatable.
- Since most of the test runner state such as list of users created by the testrunner are stored in the middleware, no need to remember them in the testrunner iteself.

### Config
#### Server specific config variables

| setting | meaning | default |
|-|-|-|
| `HOST` | Host for the middleware server | localhost |
| `PORT` | Port for the middleware server | 3000 |

#### Test Specific config variables

| setting | meaning | default |
|-|-|-|
| `BACKEND_HOST`      | ownCloud server URL (or reva service url for running with OCIS) | http://localhost:8080 |
| `BACKEND_USERNAME` | ownCloud administrator username | admin                 |
| `BACKEND_PASSWORD` | ownCloud administrator password  | admin                 |
| `REMOTE_BACKEND_HOST` | ownCloud remote server URL | http://localhost:8080 |
| `RUN_ON_OCIS` | Running the tests using the OCIS backend | false |
| `OCIS_REVA_DATA_ROOT` | Data directory of OCIS  | /var/tmp/reva |
| `OCIS_SKELETON_DIR` | Skeleton files directory for new users | - |

#### Ldap Specific config variables
| setting | meaning | default |
| -- | -- | -- |
| `RUN_WITH_LDAP` | use LDAP user backend | false |
| `LDAP_SERVER_URL`  | Url of the ldap server | ldap://127.0.0.1 |
| `LDAP_ADMIN_PASSWORD`  | admin password of the ldap server | admin |
| `LDAP_BASE_DN` | base don of the admin server | cn=admin,dc=owncloud,dc=com |

### Starting the server
To start the middleware server use following command
```
yarn start
```
This command assumes that your backend server is running on `http://localhost:8080/` for oc10 (or `https://localhost:9200` when `RUN_WITH_OCIS` is set). If your backend is running on different address use.
```
BACKEND_HOST=http://localhost/owncloud-server yarn start
```