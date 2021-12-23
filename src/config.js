const path = require('path')
const withHttp = (url) => (/^https?:\/\//i.test(url) ? url : `http://${url}`)

const RUN_WITH_LDAP = !!process.env.RUN_WITH_LDAP
const RUN_ON_OCIS = process.env.RUN_ON_OCIS === 'true'

const LOCAL_BACKEND_URL = withHttp(
  process.env.BACKEND_HOST || (RUN_ON_OCIS ? 'https://localhost:9200' : 'http://localhost:8080')
)
const REMOTE_BACKEND_URL = process.env.REMOTE_BACKEND_HOST
  ? withHttp(process.env.REMOTE_BACKEND_HOST || 'http://localhost:8080')
  : undefined
const BACKEND_ADMIN_USERNAME = process.env.BACKEND_USERNAME || 'admin'
const BACKEND_ADMIN_PASSWORD = process.env.BACKEND_PASSWORD || 'admin'

const REMOTE_UPLOAD_DIR = process.env.REMOTE_UPLOAD_DIR || path.join(__dirname, '../filesForUpload')

const OCIS_REVA_DATA_ROOT = process.env.OCIS_REVA_DATA_ROOT || '/var/tmp/ocis/storage/owncloud'
const LDAP_SERVER_URL = process.env.LDAP_SERVER_URL || 'ldap://127.0.0.1'
const LDAP_BASE_DN = process.env.LDAP_BASE_DN || 'cn=admin,dc=owncloud,dc=com'
const LDAP_ADMIN_PASSWORD = process.env.LDAP_ADMIN_PASSWORD || 'admin'
const TESTING_DATA_DIR = process.env.TESTING_DATA_DIR || path.join(__dirname, '../data')

const assert = require('assert')

if (RUN_ON_OCIS) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

const config = {
  globals: {
    filesForUpload: REMOTE_UPLOAD_DIR,
    backend_url: LOCAL_BACKEND_URL,
    remote_backend_url: REMOTE_BACKEND_URL,
    backend_admin_username: BACKEND_ADMIN_USERNAME,
    backend_admin_password: BACKEND_ADMIN_PASSWORD,
    default_backend: 'LOCAL',
    ocis: RUN_ON_OCIS,
    ldap: RUN_WITH_LDAP,
    ldap_url: LDAP_SERVER_URL,
    ocis_data_dir: OCIS_REVA_DATA_ROOT,
    ldap_base_dn: LDAP_BASE_DN,
    testing_data_dir: TESTING_DATA_DIR,
    ldap_password: LDAP_ADMIN_PASSWORD,
  },
  assert,
}

module.exports.client = config
