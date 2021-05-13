const request = require('supertest')
const app = require('../src/app')
const assert = require('assert')
const { runOccWithCli } = require('../src/helpers/occHelper')

describe('init should not be accessible without testing app enabled on the server', () => {
  beforeEach(async () => {
    await runOccWithCli(['app:disable', 'testing'])
  })
  afterEach(async () => {
    // middle did not initialized successfully so no need of cleanup
    await runOccWithCli(['app:enable', 'testing'])
  })

  it('middleware does not start without testing app enabled on the server', (done) => {
    request(app)
      .post('/init')
      .then((response) => {
        assert.deepStrictEqual(response.body, {
          success: false,
          message: 'testing app is not enabled on the server.',
        })
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})
