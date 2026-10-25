# DataPulse

I built DataPulse to practise full-stack development and learn how different technologies work together in one application.

The project started as an automotive inventory dashboard. I connected the frontend to an Express API and a PostgreSQL database, then added Apache NiFi to send vehicle data into the application.

## Features

- View vehicle inventory stored in PostgreSQL.
- Search and filter vehicles.
- Create, update, and delete vehicle records through the API.
- Validate vehicle data and reject duplicate VINs.
- Ingest vehicle data using Apache NiFi.
- Check API and database connectivity.

The dashboard also includes sales and service charts, which currently use sample data.

## Tech stack

- React, TypeScript and Vite
- Tailwind CSS and Recharts
- Node.js and Express
- PostgreSQL
- Apache NiFi
- Vitest and Supertest
- GitHub Actions

## How it works

The frontend retrieves vehicle records from the Express API, which reads and writes data in PostgreSQL.

The NiFi flow generates a vehicle JSON payload, processes it, and sends it to the API using HTTP POST. The API validates the data and stores the vehicle in the database. I tested this flow and confirmed that the new record appeared in the dashboard.

## Run locally

You'll need Node.js, npm and PostgreSQL. Java 21 and Apache NiFi are needed for the ingestion flow.

Install dependencies:

```bash
npm ci
```

Configure a `.env` file in the project root:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_NAME=datapulse
DB_USER=datapulse_user
DB_PASSWORD=your_local_password
```

The PostgreSQL database and `vehicles` table must exist before starting the API. Use your own database password and don't commit `.env`.

Start the API in one terminal:

```bash
npm run server:dev
```

Start the dashboard in another:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser. The API runs at `http://localhost:3000`.

Run the project checks:

```bash
npm test
npm run lint
npm run build
```

## API endpoints

Base URL: `http://localhost:3000/api`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check API health |
| GET | `/health/db` | Check database connection |
| GET | `/vehicles` | List vehicles |
| GET | `/vehicles?search=Toyota` | Search inventory |
| GET | `/vehicles?status=active` | Filter by status |
| GET | `/vehicles/stats` | Get inventory statistics |
| GET | `/vehicles/:id` | Get one vehicle |
| POST | `/vehicles` | Create a vehicle |
| PATCH | `/vehicles/:id` | Update a vehicle |
| DELETE | `/vehicles/:id` | Delete a vehicle |

Vehicle statuses are `active`, `sold`, and `in_service`. The API validates submitted data and rejects duplicate VINs.

## Apache NiFi

The configured flow uses `GenerateFlowFile`, `EvaluateJsonPath`, `RouteOnAttribute`, `ReplaceText`, `InvokeHTTP`, and `LogAttribute`.

It sends vehicle data to `http://localhost:3000/api/vehicles`. Start the API before running the flow.

The local NiFi interface is `https://localhost:8443/nifi/` when the service is running.

## Tests and CI

The API test suite currently contains 22 tests covering health checks, vehicle creation and validation, duplicate VINs, retrieval, updates, deletion, and error cases.

GitHub Actions runs the tests, lint checks, and production build. The workflow has completed successfully.

[View GitHub Actions](https://github.com/Ali-Rauf368/datapulse/actions)

## What I'd like to improve

- Connect sales and service charts to real database records.
- Improve monitoring for failed NiFi requests.
- Document how to export and restore the NiFi flow.
- Add authentication and role-based access.

This is a portfolio project built with sample inventory data. It has given me practical experience with APIs, PostgreSQL, automated testing, and data integration.