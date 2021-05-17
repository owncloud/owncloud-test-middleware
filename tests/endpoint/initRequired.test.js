const request = require('supertest')
const app = require('../../src/app')
const assert = require('assert')

describe('middleware should be initialized to perform other actions', () => {
  it('execute endpoint does not work without initialization', (done) => {
    request(app)
      .post('/execute')
      .send({
        step:
          'Given user "Alice" has been created with default attributes and without skeleton files',
      })
      .expect(403)
      .then((response) => {
        assert.deepStrictEqual(response.body, {
          success: false,
          message: 'middleware is not initialized yet',
        })
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
  it('state endpoint does not work without initialization', (done) => {
    request(app)
      .get('/state')
      .expect(403)
      .then((response) => {
        assert.deepStrictEqual(response.body, {
          success: false,
          message: 'middleware is not initialized yet',
        })
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
  it('cleanup endpoint does not work without initialization', (done) => {
    request(app)
      .post('/cleanup')
      .expect(403)
      .then((response) => {
        assert.deepStrictEqual(response.body, {
          success: false,
          message: 'middleware is not initialized yet',
        })
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
})
