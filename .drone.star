config = {
	'app': 'owncloud-test-middleware',

	'lintTests': True,

	'unitTests': True,

	'integrationTests': {
		"database": "mysql:5.5"
	}
}

trigger = {
	'ref': [
		'refs/pull/**',
		'refs/tags/**'
	]
}


def main(ctx):
	return lintTest() + unitTests() + integrationTests()


def owncloudService():
	return [{
		"name": "owncloud",
		"image": "owncloudci/php:7.4",
		"pull": "always",
		"environment": {
				"APACHE_WEBROOT": "/var/www/owncloud/server/",
		},
		"command": [
				"/usr/local/bin/apachectl",
				"-e",
				"debug",
				"-D",
				"FOREGROUND",
		],
	}]


def installDependencies():
	return [{
		"name": "yarn-install",
		"image": "node:latest",
		"pull": "always",
		"commands": [
				'yarn install'
		],
	}]


def fixPermissions():
	return [{
		"name": "fix-permissions",
		"image": "owncloudci/php:7.4",
		"pull": "always",
		"commands": [
				"cd /var/www/owncloud/server",
				"chown www-data * -R",
		],
	}]


def owncloudLog():
	return [{
		"name": "owncloud-log",
		"image": "owncloud/ubuntu:16.04",
		"pull": "always",
		"detach": True,
		"commands": [
				"tail -f /var/www/owncloud/server/data/owncloud.log",
		],
	}]


def getDbName(db):
	return db.split(":")[0]


def getDbUsername(db):
	name = getDbName(db)

	if name == "oracle":
			return "system"

	return "owncloud"


def getDbPassword(db):
	name = getDbName(db)

	if name == "oracle":
			return "oracle"

	return "owncloud"


def getDbRootPassword():
	return "owncloud"


def getDbDatabase(db):
	name = getDbName(db)

	if name == "oracle":
			return "XE"

	return "owncloud"


def databaseService(db):
	dbName = getDbName(db)
	if (dbName == "mariadb") or (dbName == "mysql"):
			return [{
					"name": dbName,
					"image": db,
					"pull": "always",
					"environment": {
							"MYSQL_USER": getDbUsername(db),
							"MYSQL_PASSWORD": getDbPassword(db),
							"MYSQL_DATABASE": getDbDatabase(db),
							"MYSQL_ROOT_PASSWORD": getDbRootPassword(),
					},
			}]

	if dbName == "postgres":
			return [{
					"name": dbName,
					"image": db,
					"pull": "always",
					"environment": {
							"POSTGRES_USER": getDbUsername(db),
							"POSTGRES_PASSWORD": getDbPassword(db),
							"POSTGRES_DB": getDbDatabase(db),
					},
			}]

	if dbName == "oracle":
			return [{
					"name": dbName,
					"image": "deepdiver/docker-oracle-xe-11g:latest",
					"pull": "always",
					"environment": {
							"ORACLE_USER": getDbUsername(db),
							"ORACLE_PASSWORD": getDbPassword(db),
							"ORACLE_DB": getDbDatabase(db),
							"ORACLE_DISABLE_ASYNCH_IO": "true",
					},
			}]

	return []

def installCore(db):
	host = getDbName(db)
	dbType = host

	username = getDbUsername(db)
	password = getDbPassword(db)
	database = getDbDatabase(db)

	if host == "mariadb":
			dbType = "mysql"

	if host == "postgres":
			dbType = "pgsql"

	if host == "oracle":
			dbType = "oci"


	return [{
		"name": "install-core",
		"image": "owncloudci/core",
		"pull": "always",
		"settings": {
				"core_path": "/var/www/owncloud/server",
				"db_type": dbType,
				"db_name": database,
				"db_host": host,
				"db_username": username,
				"db_password": password,
		},
		"commands": [
				"ls",
				". /var/www/owncloud/owncloud-test-middleware/.drone.env",
				"export PLUGIN_GIT_REFERENCE=$CORE_COMMITID",
				"bash /usr/sbin/plugin.sh",
		]
	}]



def lintTest():
	if not config['lintTests']:
		return []
	return [{
		'kind': 'pipeline',
		'type': 'docker',
		'name': 'lint',
		'steps': installDependencies() + [{
			'name': 'lint test',
			'image': 'node:latest',
			'pull': 'always',
			'commands': [
				'yarn lint'
			],
		}],
		'trigger': trigger
	}]


def unitTests():
	if not config['unitTests']:
		return []
	return [{
		'kind': 'pipeline',
		'type': 'docker',
		'name': 'unit-tests',
		'steps': installDependencies() + [{
			'name': 'unit-tests',
			'image': 'node:latest',
			'pull': 'always',
			'commands': [
				'yarn test'
			],
		}],
		'trigger': trigger
	}]


def integrationTests():
	if not config['integrationTests']:
		return []

	db = config["integrationTests"]["database"]

	steps = installDependencies()
	steps += installCore(db) + owncloudLog()
	steps += fixPermissions() + setupServer()
	steps += [{
		"name": "integration-tests",
		"image": "owncloudci/php:7.4",
		"pull": "always",
		"environment": {
			"CORE_PATH": "/var/www/owncloud/server",
			"BACKEND_HOST": "http://owncloud"
		},
		"commands": [
			"apt update",
 			"curl -sL https://deb.nodesource.com/setup_14.x | bash -",
 			"apt install -y nodejs",
			'node -v',
			"yarn integration-tests",
		]
	}]

	return [{
		'kind': 'pipeline',
		'type': 'docker',
		'name': 'integration-tests',
		"workspace": {
			"base": "/var/www/owncloud",
			"path": config["app"],
		},
		'steps': steps,
		'services': databaseService(db) + owncloudService(),
		"volumes": [{
				"name": "uploads",
				"temp": {},
			}, {
				"name": "configs",
				"temp": {},
		}],
		'trigger': trigger
	}]


def setupServer():
	return [{
		"name": "setup-server",
		"image": "owncloudci/php:7.4",
		"pull": "always",
		"commands": [
			"cd /var/www/owncloud/server",
			"php occ a:l testing"
		]
	}]
