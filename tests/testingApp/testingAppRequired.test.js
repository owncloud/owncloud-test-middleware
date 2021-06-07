const request = require('supertest')
const app = require('../../src/app')
const assert = require('assert')

describe('init should not be accessible without testing app enabled on the server', () => {
  it('middleware does not start without testing app enabled on the server', (done) => {
    request(app)
      .post('/init')
      .then((response) => {
        assert.deepStrictEqual(response.body, {
          success: false,
          message: 'testing app is not enabled on the server',
        })
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})
