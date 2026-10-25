# DataPulse — Automotive Inventory & Data Integration

[![DataPulse CI](https://github.com/Ali-Rauf368/datapulse/actions/workflows/ci.yml/badge.svg)](https://github.com/Ali-Rauf368/datapulse/actions/workflows/ci.yml)

DataPulse is a full-stack automotive inventory application built to explore how a modern web dashboard, REST API, relational database, and data ingestion pipeline work together.

The application uses React and TypeScript for the dashboard, Node.js and Express for the API, PostgreSQL for persistent vehicle records, and Apache NiFi to automate data ingestion.

**Project repository:** [Ali-Rauf368/datapulse](https://github.com/Ali-Rauf368/datapulse)

## Features

- **Inventory dashboard:** View vehicle records stored in PostgreSQL.
- **REST API:** Retrieve, create, update, and delete vehicle records.
- **Input validation:** Validate vehicle data and reject duplicate VINs.
- **Search and filtering:** Search inventory and filter by vehicle status.
- **Database health checks:** Check API availability and database connectivity.
- **Data integration:** Ingest vehicle records through an Apache NiFi flow.
- **Automated testing:** API integration tests using Vitest and Supertest.
- **Continuous integration:** GitHub Actions runs tests, lint checks, and a production build.

Sales, service, and activity figures displayed in the dashboard are illustrative sample data, not live business metrics.

## Technology stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling and charts | Tailwind CSS, Recharts, Lucide |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Data pipeline | Apache NiFi |
| Testing | Vitest, Supertest |
| CI | GitHub Actions |
| Development tools | npm, Git |

## Architecture

```text
                 ┌──────────────────────┐
                 │   React Dashboard    │
                 │   TypeScript / Vite  │
                 └──────────┬───────────┘
                            │ HTTP
                            ▼
                 ┌──────────────────────┐
                 │    Express REST API  │
                 │    Validation        │
                 └──────────┬───────────┘
                            │ SQL
                            ▼
                 ┌──────────────────────┐
                 │     PostgreSQL       │
                 │  Persistent Vehicles │
                 └──────────────────────┘

                 ┌──────────────────────┐
                 │     Apache NiFi      │
                 │ Generate & Transform │
                 └──────────┬───────────┘
                            │ HTTP POST
                            ▼
                      Express API
                            │
                            ▼
                        PostgreSQL
```

The dashboard retrieves inventory through the API rather than relying on a hardcoded vehicle list.

The NiFi pipeline generates a vehicle payload, processes its fields, and submits it to the API. After successful ingestion, the vehicle is stored in PostgreSQL and becomes available to the dashboard.

## Getting started

### Prerequisites

- Node.js 24 and npm
- PostgreSQL 16 or a compatible PostgreSQL version
- Java 21 for the NiFi installation used in this project
- Apache NiFi 2.12.0 for the ingestion workflow

### 1. Clone the repository

```bash
git clone https://github.com/Ali-Rauf368/datapulse.git
cd datapulse
npm ci
```

### 2. Configure PostgreSQL

Create a database and user if you have not already done so. For example, connect to PostgreSQL as an administrator and run:

```sql
CREATE USER datapulse_user WITH PASSWORD 'your_local_password';
CREATE DATABASE datapulse OWNER datapulse_user;
```

Use your own local password. If the database and user already exist, do not create them again.

Create a `.env` file in the project root:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_NAME=datapulse
DB_USER=datapulse_user
DB_PASSWORD=your_local_password
```

Replace the example password with your local database password. Never commit `.env` or real credentials to Git.

Create the `vehicles` table in the `datapulse` database:

```sql
CREATE TABLE vehicles (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    vin VARCHAR(17) NOT NULL UNIQUE,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    model_year INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

If the table already exists, keep your existing data and schema.

### 3. Start the API

In the project root, open a terminal and run:

```bash
npm run server:dev
```

The API should be available at `http://localhost:3000`.

### 4. Start the dashboard

Open a second terminal in the project root:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

Keep both processes running while using the application.

### 5. Run the quality checks

Run the automated tests:

```bash
npm test
```

Run lint checks:

```bash
npm run lint
```

Create a production build:

```bash
npm run build
```

The current API test suite contains 22 tests. The GitHub Actions workflow runs tests, lint checks, and the production build automatically on pushes to `main` and pull requests targeting `main`.

## REST API

Base URL: `http://localhost:3000/api`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check API health |
| GET | `/health/db` | Check database connectivity |
| GET | `/vehicles` | Retrieve vehicle inventory |
| GET | `/vehicles?search=Toyota` | Search vehicle records |
| GET | `/vehicles?status=active` | Filter by status |
| GET | `/vehicles/stats` | Retrieve inventory statistics |
| GET | `/vehicles/:id` | Retrieve a vehicle by ID |
| POST | `/vehicles` | Create a vehicle |
| PATCH | `/vehicles/:id` | Partially update a vehicle |
| DELETE | `/vehicles/:id` | Delete a vehicle |

Supported vehicle statuses are `active`, `sold`, and `in_service`.

### Example: Create a vehicle

Send a `POST` request to `/api/vehicles` with the `Content-Type: application/json` header:

```json
{
  "vin": "1N4AL11D75C109151",
  "make": "Nissan",
  "model": "Altima",
  "model_year": 2021,
  "status": "active"
}
```

The API validates the request before inserting the vehicle. VINs must be unique; duplicate VINs return HTTP `409 Conflict`. Invalid input is rejected, and a successful creation returns HTTP `201 Created`.

### Example: Check API health

```bash
curl http://localhost:3000/api/health
```

Check the database connection:

```bash
curl http://localhost:3000/api/health/db
```

## Apache NiFi integration

Apache NiFi is an integrated part of the DataPulse ingestion workflow.

The configured flow uses these processors:

1. `GenerateFlowFile` — creates a sample vehicle payload.
2. `EvaluateJsonPath` — extracts JSON fields.
3. `RouteOnAttribute` — routes the FlowFile.
4. `ReplaceText` — prepares the JSON request body.
5. `InvokeHTTP` — submits the payload to the DataPulse API.
6. `LogAttribute` — records response or failure details.

The HTTP endpoint is:

```text
POST http://localhost:3000/api/vehicles
```

To test ingestion:

1. Start PostgreSQL and the DataPulse API.
2. Start Apache NiFi.
3. Open the local NiFi interface at `https://localhost:8443/nifi/`.
4. Start the configured flow and inspect processor status and logs.
5. Confirm that the ingested vehicle appears in the dashboard.

NiFi must be able to reach the API at the configured URL. The local setup uses the NiFi installation's configured credentials.

Use a new valid VIN for each test vehicle. Reusing an existing VIN should produce a duplicate-VIN response.

## Testing and continuous integration

The API integration tests cover health checks, database connectivity, vehicle listing and filtering, creation and validation, duplicate VIN handling, retrieval by ID, partial updates, deletion, and related error cases.

GitHub Actions executes the following pipeline:

1. Install dependencies using `npm ci`.
2. Start PostgreSQL as a CI service.
3. Create the test database table.
4. Run the automated tests.
5. Run lint checks.
6. Build the production application.

**[View workflow runs on GitHub](https://github.com/Ali-Rauf368/datapulse/actions)**

## Current limitations

- Vehicle inventory is persisted in PostgreSQL, but sales and service analytics use illustrative sample data.
- The local NiFi workflow depends on the API being available at its configured URL.
- Authentication and role-based authorization have not yet been implemented.
- The project is intended as a development and portfolio application, not a production-ready dealership management system.

## Roadmap

- Connect sales and service analytics to persisted data.
- Improve ingestion error handling and monitoring.
- Document NiFi flow export and recovery.
- Add authentication and role-based authorization.
- Continue expanding automated test coverage.

---

Built as a full-stack portfolio project exploring API development, relational data storage, dashboard development, automated testing, CI, and workflow-based data integration.
