/* eslint-disable jest/expect-expect */
const request = require('supertest')
const app = require('../../src/app')
const assert = require('assert')

/**
 * following tests are interdependent with each other and ordered with reason
 * 'init' should be done first to support 'execute' and 'state' endpoints
 * finally 'cleanup' test is done to cleanup the middleware.
 */

describe('general endpoints success status', function () {
  it('initialize endpoint', (done) => {
    request(app)
      .post('/init')
      .expect(200)
      .then((response) => {
        assert.ok(response.body.success)
        assert.strictEqual(response.body.message, 'test middleware initialized')
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
  it('execute endpoint', (done) => {
    request(app)
      .post('/execute')
      .send({
        step:
          'Given user "Alice" has been created with default attributes and without skeleton files',
      })
      .set('Content-Type', 'application/json')
      .expect(200)
      .then((response) => {
        assert.ok(response.body.success)
        assert.strictEqual(response.body.step.token, 'GIVEN')
        assert.strictEqual(
          response.body.step.pattern,
          'user {string} has been created with default attributes and without skeleton files'
        )
        assert.strictEqual(
          response.body.step.literal,
          'user "Alice" has been created with default attributes and without skeleton files'
        )
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
  it('state endpoint', (done) => {
    request(app)
      .get('/state')
      .set('Content-Type', 'application/json')
      .expect(200)
      .then((response) => {
        assert.deepStrictEqual(response.body.created_users, {
          Alice: {
            displayname: 'Alice Hansen',
            email: 'alice@example.org',
            password: '1234',
          },
        })
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
  it('cleanup endpoint', (done) => {
    request(app)
      .post('/cleanup')
      .set('Content-Type', 'application/json')
      .expect(200)
      .then((response) => {
        assert.ok(response.body.success)
        assert.strictEqual(response.body.message, 'middleware cleaned up.')
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})
