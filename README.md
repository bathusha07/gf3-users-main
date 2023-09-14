# gf3-users

This README would normally document whatever steps are necessary to get your application up and running.

## What is this repository for?

- Quick summary
- Version
- [Learn Markdown](https://bitbucket.org/tutorials/markdowndemo)

## How do I get set up?

### Local env setup

First copy .env.local to .env

```
cp .env.local .env
```

Get your personal access token to Github Packages Registry and replace it in the .env file [Creating a personal access token](https://docs.github.com/en/github/authenticating-to-github/keeping-your-account-and-data-secure/creating-a-personal-access-token)

Run the following at the root of the repo:

```
export PKG_AUTH_TOKEN=your_generated_token
npm install or npm ci if you don't want to update the dependencies

docker-compose up # `npm run docker:dev` works as well
```

Get set up with the precommit hooks and code formatting and linting on staged files:

```
npm run prepare
```

If you see an error saying `fatal: cannot run .husky/pre-commit: No such file or directory` when you try to commit, first make sure that there is no`.husky/pre-commit` file (delete it if it's there), then run:

```
npx husky add .husky/pre-commit "npx lint-staged"
```

### Firebase Setup Guide

To integrate Firebase into the project, please follow the steps below:

#### Step 1: Add Firebase Configuration File

1. Obtain the Firebase configuration file (`firebase_config.json`) from Firebase Console.
2. Place the `firebase_config.json` file at the root folder of your project.

#### Step 2: Configure Environment Variable

1. Open your `.env` file.
2. Add the following line to the `.env` file:

```
FIREBASE_CONFIG_FILE=firebase_config.json
```

Make sure to replace `firebase_config.json` with the actual name of your Firebase configuration file if it's different.

### Configuration

To give the application db user permissions, connect to the mysql container and log into the mysql CLI tool:

```
docker exec -it mysql-users /bin/bash

# Inside the container
mysql -u root -proot
```

...then run the following queries:

```sql
GRANT ALL PRIVILEGES ON *.* TO 'gf3'@'%';
FLUSH PRIVILEGES;
```

### Migrations

To run existing migrations, connect to the web container:

```
docker exec -it gf3-users-web-1 /bin/sh
```

...and run:

```
npm run db:deploy
```

To rerun the migrations from the top, destroying all data currently in your db, run:

```
npm run db:reset
```

To create a new migration, make changes to the schema in the prisma/schema.prisma file, then run the following, replacing MIGRATION_NAME with something that describes your change:

```
npm run db:migrate -- --name $YourMigrationName
```

You may have to run this on the container as well if you get the "Invalid `prisma.user.create()` invocation:" error:

```
npm run db:generate
```

### Seeding

To seed the db, connect to the web container:

```
docker exec -it gf3-users_web_1 /bin/sh
```

...and run:

```
npx prisma db seed --preview-feature
```

### Running component tests on local

_Note that this is a work in progress. We will be working to make this process more streamlined with future iterations._

1. Put up the test database and mock GF2 server by running the following from the root gf3-users directory:

```
docker-compose -f docker-compose.ci.yml up
```

2. If the test database is new, whether it's because this is the first time you're doing the compnent testing in your local environment or you've deleted the test database volume for whatever reason, the database must first be seeded. To do that run the following on the command line"

```
docker run --rm \
-e PKG_AUTH_TOKEN=$PKG_AUTH_TOKEN \
-e DATABASE_URL=mysql://root:example@mysql:3306/users \
--network gf3-users_default \
gf3-users \
sh -c "npm run db:deploy && \
npm run db:seed"
```

3. Configure the routes on the mock server by running:

```
./.github/workflows/scripts/mockSetup.sh
```

4. Before we put up the gf3-user service in order to run the component tests against, we need to point it to the test database and the mock GF2 server. Ensure the following are in your .env file.

```
DATABASE_URL="mysql://root:example@localhost:33063/users"
TRANSLATION_LAYER_SERVICE_URL="http://localhost:1080"
```

A good approach for this is to have two env files, say `.env.ci` for the above and `.env.gf2` for when you're running your gf3-users service against your local instance of GF2, and just make the actual `.env` file a sym link to whichever one of those you need. _We are currently investigating using convict.js to make this less clunky._

5. Put up your GF3 service:

```
npm run start
```

6. Run the component tests:

```
npm run test:component
```

### Debugging the container

On macOS/Linux you can run the containers with the debug port open at 9229:

```
# Might not work on Windows
npm run docker:devDebug
```

You can then attach to the debug port at localhost:9229 using your favourite node debugging tool.

### Dependencies

### Database configuration

### How to run tests

Run the following from the root of the repo:

```
npm test
```

### How to debug tests

If using VSCode, you can add the following launch configuration to debug your tests:

```json
{
  "name": "Debug Jest Tests",
  "type": "node",
  "request": "launch",
  "runtimeArgs": ["--inspect-brk", "${workspaceRoot}/node_modules/.bin/jest", "--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen",
  "port": 9229,
  "runtimeExecutable": "/usr/local/opt/node@14/bin/node"
}
```

Remove the `runtimeExecutable` property if using a node binary in a different location.

### Contribution guidelines

- Writing tests
- Code review
- Other guidelines

### Who do I talk to?

- Repo owner or admin
- Other community or team contact

## Github Actions

This application is deployed via Github Action. All Github Action workflows are located in the `./.github/workflows/` directory.

### Pre-requisite

### Env Vars

| Name                          | Description                                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| DATABASE_URL                  | URL to the database                                                                             |
| STRIPE_SECRET                 | Stripe Secret Key                                                                               |
| TRANSLATION_LAYER_AUTH_TOKEN  | Bearer token for GF2 calls                                                                      |
| TRANSLATION_LAYER_SERVICE_URL | URL to the GF2 instance                                                                         |
| NEW_RELIC_LICENSE_KEY         | License Key for New Relic                                                                       |
| NEW_RELIC_APP_NAME            | Name of the app to show in New Relic dashboards. (Dev: gf3-users_dev, QA: gf3-users_qa, etc...) |

See [https://docs.newrelic.com/docs/agents/nodejs-agent/installation-configuration/nodejs-agent-configuration/#environment](New Relic environment variables) for more New Relic variables

#### Github Secrets

The following secrets are used for GitHub Actions for all environments:
| Name | Description |
|----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| PKG_AUTH_TOKEN | Token access to Github Packages Registry |
| DEV_GCP_PROJECT | The ID of the project for the development environment. |
| DEV_GCP_SA_KEY | The service account key for the github-runner for the development environment. |
| DEV_DB_INSTANCE_CONNECTION_NAME | The SQL instance connection name (DEV_GCP_PROJECT:region:instance name) |
| DEV_DATABASE_URL | The database url with a socket connection (postgres://USERNAME:PASSWORD@localhost/DB_NAME?host=/cloudsql/DEV_DB_INSTANCE_CONNECTION_NAME) |
| QA_GCP_PROJECT | The ID of the project for the qa environment. |
| QA_GCP_SA_KEY | The service account key for the github-runner for the qa environment. |
| QA_DB_INSTANCE_CONNECTION_NAME | The SQL instance connection name (QA_GCP_PROJECT:region:instance name) |
| QA_DATABASE_URL | The database url with a socket connection (postgres://USERNAME:PASSWORD@localhost/DB_NAME?host=/cloudsql/QA_DB_INSTANCE_CONNECTION_NAME) |
| PROD_GCP_PROJECT | The ID of the project for the production environment. |
| PROD_GCP_SA_KEY | The service account key for the github-runner for the production environment. |
| PROD_DB_INSTANCE_CONNECTION_NAME | The SQL instance connection name (PROD_GCP_PROJECT:region:instance name) |
| PROD_DATABASE_URL | The database url with a socket connection (postgres://USERNAME:PASSWORD@localhost/DB_NAME?host=/cloudsql/PROD_DB_INSTANCE_CONNECTION_NAME) |

#### GCP roles

The github-runner service account will need the following permissions for each environment to deploy into Cloud Run.

| Name                 | Role                         | Description                                                                                                                                                   |
| -------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cloud Run Admin      | roles/run.admin              | Can create, update, and delete services. Can get and set IAM policies.                                                                                        |
| Service Account User | roles/iam.serviceAccountUser | Service Account User role on a service account can use it to indirectly access all the resources to which the service account has access.                     |
| Storage Admin        | roles/storage.admin          | Grants full control of buckets and objects. When applied to an individual bucket, control applies only to the specified bucket and objects within the bucket. |
| Cloud SQL client     | roles/cloudsql.client        | Connectivity access to Cloud SQL instances from Cloud Run and the Cloud SQL Auth proxy. This is needed for both migrations and connecting within the service. |

### High Level Overview of Github Action Workflows

| Environment | Workflow                     | Trigger           | Branch  | Description                                                                                                                                                                                                                                           |
| ----------- | ---------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Development | Lint                         | push              | None    | Lint                                                                                                                                                                                                                                                  |
| Development | Unit Test                    | pull request      | develop | Unit test and code coverage                                                                                                                                                                                                                           |
| Development | Cloud Run (Development)      | push              | develop | Containerisation and deploy to Cloud Run in Development Environment                                                                                                                                                                                   |
| QA          | Cloud Run (QA)               | push              | master  | Containerisation and deploy to Cloud Run in QA Environment                                                                                                                                                                                            |
| Production  | Cloud Run (Production)       | release           | master  | Containerisation and deploy a new Cloud Run instance in Production Environment with zero traffic and tagged "blue"                                                                                                                                    |
| Production  | Migrate Traffic (Production) | workflow_dispatch | master  | A workflow_dispatch workflow which is a manual step to migrate Cloud Run traffic for blue green deployment in Production Environment. Currently anyone can run this but this can be solved with branch protection where you can enforce restrictions. |

### Restore DB from prod to non-prod

Refrence can be found [here](https://cloud.google.com/sql/docs/mysql/backup-recovery/restoring#projectid) and its implemented in our [pipeline](./.github/workflows/restore-db.yml).

> We need to restore the application user name and password for non-prod after we refresh the DB from prod.
