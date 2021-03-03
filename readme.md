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