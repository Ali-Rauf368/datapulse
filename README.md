
cd ~/projects/datapulse

cat > README.md <<'EOF'
# DataPulse — Automotive Intelligence Platform

DataPulse is a full-stack automotive inventory and analytics application designed to bring vehicle records, operational visibility, and business intelligence into one authenticated workspace.

It combines a React dashboard with a Node.js API and PostgreSQL-backed data storage. The application provides a foundation for managing vehicle inventory, tracking vehicle status, and expanding sales and service reporting.

**Repository:** https://github.com/Ali-Rauf368/datapulse

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Current Project Status](#current-project-status)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Authentication and Authorization](#authentication-and-authorization)
- [Database and Data Model](#database-and-data-model)
- [API and Integrations](#api-and-integrations)
- [Testing and Quality Checks](#testing-and-quality-checks)
- [Security Considerations](#security-considerations)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Automotive businesses need reliable access to inventory, vehicle status, and operational information. DataPulse provides a centralized workspace for viewing this information through a web-based dashboard.

The project focuses on:

- Centralized vehicle inventory.
- Authenticated access to business data.
- Role-aware application access.
- PostgreSQL-backed records.
- Operational analytics for sales and service activity.
- An API layer that separates frontend presentation from backend data access.
- Integration capabilities, including Apache NiFi.

DataPulse is an actively developed portfolio project. Features described as planned or incomplete below should not be considered production-ready.

## Features

### Vehicle Inventory

- View vehicle records retrieved from PostgreSQL through the API.
- Display vehicle names, identifiers, model years, and statuses.
- Distinguish active, sold, and in-service vehicles.
- Search and filter inventory where supported by the current frontend.
- Present inventory totals and status-based KPIs.

### Authentication and Access Control

- Sign in using an account registered with DataPulse.
- Authenticate API requests using bearer tokens.
- Associate users with application roles.
- Support administrator access.
- Require backend permission checks rather than relying exclusively on frontend controls.

### Business Overview

The dashboard presents an overview of vehicle inventory and operational activity, including:

- Total vehicle records.
- Active vehicle count.
- Sold vehicle count.
- Vehicles currently in service.
- Sales activity and recorded revenue, when sales events are available.
- Service activity, when service events are available.
- API and database connection status.

### Database Integration

- Retrieve vehicle records from PostgreSQL.
- Separate API logic from the frontend.
- Expose health-check functionality for service and database connectivity.
- Preserve existing vehicle records during application development.

### Apache NiFi Integration

The project includes NiFi integration work intended to support data movement and integration workflows.

The availability and completeness of individual NiFi flows depend on the current configuration and deployment. A working integration should be verified against the relevant NiFi instance before being treated as production-ready.

---

## Technology Stack

The project includes the following technologies and components:

| Component | Technology |
| --- | --- |
| Frontend | React |
| Frontend language | TypeScript |
| Build and development tooling | Vite |
| Backend runtime | Node.js |
| Backend language | TypeScript |
| API framework | Express |
| Database | PostgreSQL |
| Authentication | Token-based authentication |
| API security | Bearer-token authentication and role checks |
| Data integration | Apache NiFi |

The repository's package files and server configuration are the source of truth for exact dependency versions and available scripts.

---

## Architecture

DataPulse separates its user interface, API, and persistent storage.

```text
┌───────────────────────────────┐
│       Web Browser             │
│                               │
│ React + TypeScript + Vite     │
│ Dashboard and Sign-in         │
└───────────────┬───────────────┘
                │
                │ HTTP / JSON
                │ Bearer token
                ▼
┌───────────────────────────────┐
│       Node.js API             │
│       Express + TypeScript    │
│                               │
│ Authentication                │
│ Authorization                 │
│ Vehicle and analytics routes  │
│ Health checks                 │
└───────────────┬───────────────┘
                │
                │ Database queries
                ▼
┌───────────────────────────────┐
│         PostgreSQL            │
│                               │
│ Vehicle records               │
│ User and role data            │
│ Sales and service events      │
└───────────────────────────────┘

      Apache NiFi integration
      for configured data flows
```

### Request flow

1. A user opens the web application.
2. The user signs in through the authentication API.
3. The frontend uses the authenticated session when requesting protected data.
4. The API validates authentication and enforces the applicable permissions.
5. The API reads or updates data through the database layer.
6. The dashboard displays the API response.

The diagram describes the intended application architecture. Exact route names, database schema, and integration behavior should be verified against the implementation.

---

## Current Project Status

The development environment has successfully demonstrated:

- An authenticated administrator session.
- A working frontend-to-API connection.
- A connected PostgreSQL database.
- Vehicle inventory loaded from stored database records.
- Inventory KPIs based on vehicle statuses.
- API health and database health checks.

At the time of the latest dashboard check, the local database returned 13 vehicle records:

| Metric | Observed value |
| --- | ---: |
| Total vehicles | 13 |
| Active vehicles | 11 |
| Sold vehicles | 1 |
| In-service vehicles | 1 |
| Recorded sales | 0 |
| Recorded sales revenue | €0.00 |

These are development-environment observations, not guaranteed values for a fresh installation or another database.

The inventory includes test/integration records. The sales and service panels reported no recorded events at the time of that check.

---

## Prerequisites

Install the following before setting up DataPulse:

- Git
- Node.js and npm, using versions compatible with the repository
- PostgreSQL
- A terminal and a code editor
- Apache NiFi only if you intend to configure or test the integration workflows

The project has been developed and tested locally with Node.js 24 and npm 11. Other versions should be validated against the package configuration.

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Ali-Rauf368/datapulse.git
cd datapulse
```

If the repository is already cloned, navigate to the project directory instead.

### 2. Install dependencies

```bash
npm install
```

The repository may contain separate frontend and backend packages or scripts. Review the root and server package files if dependency installation or startup fails.

### 3. Configure PostgreSQL

Create or select a PostgreSQL database and a dedicated database user.

For example, the local development environment has used a database named `datapulse` and a database user named `datapulse_user`.

Use your own local credentials. Do not copy real passwords into this README or commit them to Git.

Ensure the required database tables and schema are initialized using the project's existing database setup process.

### 4. Configure environment variables

Configure the variables required by the backend and frontend before starting the application.

Refer to the actual environment-variable references in the repository. Do not assume that this README defines every required variable.

If an example environment file is available, use it as a starting point and fill in the values for your local environment.

---

## Environment Configuration

Environment variables should be stored in local, untracked environment files rather than committed to source control.

The application configuration may include values for:

| Configuration area | Purpose |
| --- | --- |
| Database connection | PostgreSQL host, port, database, username, and password or connection URL |
| Authentication | Token signing or verification configuration required by the implementation |
| Frontend API URL | API base URL used by the browser application |
| CORS / frontend origin | Permitted frontend origins for API requests |
| Application runtime | Server port and other environment-specific settings |

The exact variable names and required values must be taken from the current source code and any existing example environment files.

### Important

- Never commit `.env`, `.env.local`, database passwords, signing secrets, or access tokens.
- Keep frontend-exposed environment variables free of secrets.
- A variable prefixed with `VITE_` is exposed to frontend code and must not contain private credentials.
- Use different credentials for development, testing, and production.
- Configure the API's allowed origins for the actual frontend URL.

---

## Running the Application

Run the frontend and backend in separate terminal windows.

### Terminal 1: Backend API

From the project root:

```bash
npm run server:dev
```

The local development server has previously reported:

```text
DataPulse API running at http://localhost:3000
```

Keep this terminal open while testing the application.

### Terminal 2: Frontend

From the project root:

```bash
npm run dev -- --host 127.0.0.1
```

Open the local URL printed by Vite in your browser. The development environment has previously used:

```text
http://127.0.0.1:5173/
```

The actual port may differ if the default port is occupied.

### Health checks

The following endpoints have been verified in the local development environment:

```text
GET http://localhost:3000/api/health
GET http://localhost:3000/api/health/db
```

Use these endpoints to help diagnose API availability and database connectivity.

### Production build

Build the frontend with:

```bash
npm run build
```

A successful frontend build does not, by itself, prove that a production deployment is configured correctly. Production deployment also requires appropriate server, database, authentication, and frontend-origin configuration.

---

## Authentication and Authorization

DataPulse uses authenticated API requests for protected workspace data.

The intended access-control model includes:

- User authentication at sign-in.
- Token-based access to protected API routes.
- User roles, including administrator access.
- Server-side authorization checks for protected operations.

### Administrator setup

The repository has included an administrator setup script:

```bash
npm run setup:admin
```

Before running this command in a new environment, inspect its behavior and ensure that the database configuration is correct.

Do not assume that every installation should recreate an administrator account. Use the application's intended account-management process.

### Security requirements

- Validate credentials on the backend.
- Hash passwords securely rather than storing plaintext passwords.
- Verify tokens and their expiration.
- Enforce authorization independently of frontend visibility.
- Protect sensitive operations with explicit permission checks.
- Avoid logging passwords, tokens, and other secrets.

User creation and role management are not currently enabled in the dashboard screen described during development. Do not assume that a complete user-management interface is available.

---

## Database and Data Model

PostgreSQL is the persistent data store for the application's vehicle inventory and operational records.

The dashboard has shown data associated with the following conceptual areas:

- Vehicle inventory.
- User accounts and roles.
- Sales events.
- Service events.

These are functional areas, not a substitute for the actual database schema. Refer to the SQL definitions, migrations, or initialization scripts in the repository to determine the exact table names, columns, constraints, and relationships.

### Inventory status

The dashboard currently distinguishes the following vehicle statuses:

- Active
- Sold
- In service

Status totals should be derived from the actual stored records, rather than hard-coded demo values.

### Sales and service reporting

Sales revenue and sales counts depend on recorded sales events. Service metrics depend on recorded service events.

When those tables contain no events, an empty-state message is more accurate than invented sample revenue or activity.

### Development data

The local inventory has included integration-test records. Before using a production database, review the data and separate test fixtures from real business records.

---

## API and Integrations

The frontend communicates with the backend through HTTP API requests.

The repository has included API health checks, authentication routes, and vehicle-related functionality. Refer to the current route definitions for the authoritative list of endpoints, HTTP methods, request schemas, and response formats.

### Health monitoring

Health endpoints help determine whether the API is running and whether the database connection is available.

A healthy API process does not guarantee that every protected route or external integration is working; test those components independently.

### Apache NiFi

Apache NiFi can be used to orchestrate and monitor configured data flows between systems.

For a complete integration deployment, document and verify:

- The NiFi version and deployment URL.
- Authentication and authorization settings.
- Configured process groups and flows.
- Source and destination systems.
- Required credentials and certificates.
- Error handling, retries, and monitoring.
- How to test a complete flow end to end.

Only describe specific NiFi workflows as operational after confirming them in the actual environment.

---

## Testing and Quality Checks

Run the scripts available in the repository.

The following commands have been used during DataPulse development:

```bash
npm run lint
npm test
npm run build
```

The local development history recorded a passing lint check, 41 passing tests, and a successful build at an earlier checkpoint. Run the commands again against the current checkout before relying on those results.

To inspect available npm scripts:

```bash
npm run
```

For authentication and integration testing, verify:

- Successful sign-in with valid credentials.
- Rejection of invalid credentials.
- Correct handling of missing or expired tokens.
- Authorization checks on protected routes.
- Database connectivity and failure handling.
- Correct vehicle counts and status totals.
- Empty states when sales or service events are absent.
- Frontend access to the configured API origin.
- Integration behavior when external services are unavailable.

---

## Security Considerations

DataPulse is a development and portfolio project unless and until it has been separately hardened and reviewed for production use.

Before deploying it publicly:

1. Use strong, unique credentials.
2. Rotate any credentials that have been exposed.
3. Keep environment files and secrets out of version control.
4. Configure production CORS origins explicitly.
5. Use HTTPS for production traffic.
6. Validate and sanitize user-controlled input.
7. Apply authorization checks on the server.
8. Review database permissions and network exposure.
9. Configure safe error handling and logging.
10. Audit dependencies and address relevant vulnerabilities.
11. Back up the database and test restoration procedures.
12. Enable appropriate repository security features and secret scanning.

Do not commit database dumps containing private information or production credentials.

---

## Known Limitations

The following limitations have been identified during development:

- The dashboard's sales panel has shown no recorded sales events.
- The service panel has shown no recorded service events.
- The local inventory contains test/integration records.
- User creation and role management are not available through the current dashboard screen.
- A successful local run does not establish production readiness.
- NiFi workflows and deployment-specific integrations require environment-level verification.

These limitations should be updated as functionality is implemented and tested.

---

## Future Improvements

Potential next steps include:

- Complete vehicle create, update, and delete workflows with backend permission checks.
- Build a dedicated user and role management interface.
- Add validated sales-event and service-event workflows.
- Improve analytics with date ranges, filters, and trend visualizations.
- Add automated integration tests for authentication and database routes.
- Add repeatable database migrations and seed-data management.
- Document NiFi process groups and integration testing.
- Add deployment instructions and health monitoring.
- Improve audit logging, error reporting, and operational observability.
- Add screenshots and a short demonstration of the application.

These are potential improvements, not claims that the features already exist.

---

## Contributing

Contributions and suggestions are welcome.

1. Fork the repository or create a development branch.
2. Make a focused change.
3. Run the relevant lint, test, and build commands.
4. Review the changes for accidental secrets or local configuration.
5. Submit a pull request describing the change and its verification.

For significant changes, explain the problem being solved and any impact on the API, database schema, or security model.

---

## License

No license is asserted by this README.

Before distributing or accepting external contributions, add an appropriate `LICENSE` file if the project owner intends to grant reuse rights. Without an applicable license, users should not assume that they have permission to reuse or redistribute the code.

---

## Project Information

**Project:** DataPulse — Automotive Intelligence  
**Repository:** https://github.com/Ali-Rauf368/datapulse  
**Primary branch:** `main`  
**Purpose:** Full-stack automotive inventory and analytics portfolio project

For setup, API behavior, database schema, and integration details, the source code and configuration files in this repository remain authoritative.
EOF


