OC_CI_CORE = "owncloudci/core"
OC_CI_NODEJS = "owncloudci/nodejs:16"
OC_CI_PHP = "owncloudci/php:7.4"
OC_UBUNTU = "owncloud/ubuntu:20.04"
DOCKER_PLUGIN = "plugins/docker:18.09"

config = {
    "app": "owncloud-test-middleware",
    "lintTests": True,
    "unitTests": True,
    "integrationTests": {
        "database": "mysql:5.5",
        "suites": [
            {
                "name": "endpoint-tests",
                "testingAppRequired": True,
                "command": "yarn test:integration:endpoints",
            },
            {
                "name": "testing-app-tests",
                "testingAppRequired": False,
                "command": "yarn test:integration:testing-app",
            },
        ],
    },
}

trigger = {
    "ref": [
        "refs/heads/main",
        "refs/pull/**",
        "refs/tags/**",
    ],
}

def main(ctx):
    return lintTest() + unitTests() + integrationTests() + docker(ctx)

def integrationTests():
    pipelines = []

    if not config["integrationTests"]:
        return pipelines
    for category, matrix in config["integrationTests"].items():
        if category == "suites":
            i = 1
            for suite in matrix:
                db = config["integrationTests"]["database"]

                steps = installDependencies()
                steps += installCore(db) + owncloudLog()
                steps += setupServer(suite["name"], suite["testingAppRequired"])
                steps += fixPermissions()
                steps += [{
                    "name": suite["name"],
                    "image": OC_CI_NODEJS,
                    "environment": {
                        "CORE_PATH": "/var/www/owncloud/server",
                        "BACKEND_HOST": "http://owncloud",
                    },
                    "commands": [
                        suite["command"],
                    ],
                }]

                pipelines.append({
                    "kind": "pipeline",
                    "type": "docker",
                    "name": "integration-tests-{}".format(i),
                    "workspace": {
                        "base": "/var/www/owncloud",
                        "path": config["app"],
                    },
                    "steps": steps,
                    "services": mysqlDbService(db) + owncloudService(),
                    "volumes": [{
                        "name": "uploads",
                        "temp": {},
                    }, {
                        "name": "configs",
                        "temp": {},
                    }],
                    "trigger": trigger,
                })
                i = i + 1
    return pipelines

def owncloudService():
    return [{
        "name": "owncloud",
        "image": OC_CI_PHP,
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
        "image": OC_CI_NODEJS,
        "commands": [
            "yarn install",
        ],
    }]

def fixPermissions():
    return [{
        "name": "fix-permissions",
        "image": OC_CI_PHP,
        "commands": [
            "cd /var/www/owncloud/server",
            "chown www-data * -R",
        ],
    }]

def owncloudLog():
    return [{
        "name": "owncloud-log",
        "image": OC_UBUNTU,
        "detach": True,
        "commands": [
            "tail -f /var/www/owncloud/server/data/owncloud.log",
        ],
    }]

def getDbName(db):
    return db.split(":")[0]

def mysqlDbService(db):
    dbName = getDbName(db)

    return [{
        "name": dbName,
        "image": db,
        "environment": {
            "MYSQL_USER": "owncloud",
            "MYSQL_PASSWORD": "owncloud",
            "MYSQL_DATABASE": "owncloud",
            "MYSQL_ROOT_PASSWORD": "owncloud",
        },
    }]

def installCore(db):
    host = getDbName(db)
    dbType = host

    return [{
        "name": "install-core",
        "image": OC_CI_CORE,
        "settings": {
            "core_path": "/var/www/owncloud/server",
            "db_type": dbType,
            "db_name": "owncloud",
            "db_host": host,
            "db_username": "owncloud",
            "db_password": "owncloud",
        },
        "commands": [
            "ls",
            ". /var/www/owncloud/owncloud-test-middleware/.drone.env",
            "export PLUGIN_GIT_REFERENCE=$CORE_COMMITID",
            "bash /usr/sbin/plugin.sh",
        ],
    }]

def lintTest():
    if not config["lintTests"]:
        return []
    return [{
        "kind": "pipeline",
        "type": "docker",
        "name": "lint",
        "steps": installDependencies() + [{
            "name": "lint test",
            "image": OC_CI_NODEJS,
            "pull": "always",
            "commands": [
                "yarn lint",
            ],
        }],
        "trigger": trigger,
    }]

def unitTests():
    if not config["unitTests"]:
        return []
    return [{
        "kind": "pipeline",
        "type": "docker",
        "name": "unit-tests",
        "steps": installDependencies() + [{
            "name": "unit-tests",
            "image": OC_CI_NODEJS,
            "pull": "always",
            "commands": [
                "yarn test:unit",
            ],
        }],
        "trigger": trigger,
    }]

def setupServer(testingServer, testingAppRequired = True):
    return [{
        "name": "setup-server",
        "image": OC_CI_PHP,
        "commands": [
            "cd /var/www/owncloud/server",
            "php occ a:e testing" if testingAppRequired else "php occ a:l testing",
            "php occ config:system:set trusted_domains 1 --value=owncloud",
            "php occ config:system:set trusted_domains 2 --value=" + testingServer,
        ],
    }]

def docker(ctx):
    result = {
        "kind": "pipeline",
        "type": "docker",
        "name": "docker",
        "workspace": {
            "base": "/var/www/owncloud",
            "path": config["app"],
        },
        "steps": buildDockerImage(),
        "trigger": {
            "ref": [
                "refs/heads/main",
                "refs/tags/**",
            ],
        },
    }

    return [result]

def buildDockerImage():
    return [{
        "name": "build-docker-image",
        "image": DOCKER_PLUGIN,
        "settings": {
            "username": {
                "from_secret": "docker_username",
            },
            "password": {
                "from_secret": "docker_password",
            },
            "auto_tag": True,
            "repo": "owncloud/owncloud-test-middleware",
        },
        "when": {
            "ref": {
                "exclude": [
                    "refs/pull/**",
                ],
            },
        },
    }]
