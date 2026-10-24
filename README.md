# DataPulse

DataPulse is a small automotive inventory dashboard I built to practise full-stack development and data integration.

The idea was to bring together a React dashboard, a REST API, a PostgreSQL database, and Apache NiFi in one project. Instead of displaying vehicle data only from a hardcoded array, the dashboard retrieves inventory from the database through the API.

## What it does

- Displays vehicle inventory stored in PostgreSQL.
- Provides an Express API to retrieve and add vehicles.
- Validates vehicle information before saving it.
- Uses Apache NiFi to send vehicle data to the API.
- Shows API and database connection status.
- Includes automated tests for API health and invalid input.

The dashboard also contains sales and service figures to make the overview feel like a real automotive application. Those figures are currently sample data, not live business metrics.

## Built with

- React, TypeScript and Vite
- Tailwind CSS and Recharts
- Node.js and Express
- PostgreSQL
- Apache NiFi
- Vitest and Supertest

## How the pieces work together

The dashboard requests vehicle records from the Express API. The API reads them from PostgreSQL and returns them to the frontend.

For the ingestion part, I configured a NiFi flow that creates a vehicle JSON payload, extracts its fields, routes it, and sends it to the API using an HTTP POST request. The API validates the payload and stores the new vehicle in PostgreSQL. After refreshing the dashboard, the new record appears in the inventory.

## Running it locally

You'll need Node.js, npm, PostgreSQL, and Java 21 for the NiFi setup used in this project.

### 1. Install the project dependencies

```bash
npm install
```

### 2. Configure PostgreSQL

Create a database named `datapulse` and configure the connection in a `.env` file in the project root:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_NAME=datapulse
DB_USER=datapulse_user
DB_PASSWORD=your_local_password
```

Use your own local database password. Make sure the database schema has been created before starting the API. Keep `.env` out of Git.

### 3. Start the API

Open a terminal in the project directory:

```bash
npm run server:dev
```

The API should be available at `http://localhost:3000`.

### 4. Start the dashboard

Open another terminal:

```bash
npm run dev
```

Then visit `http://localhost:5173`.

Keep both terminals running while using the dashboard.

### 5. Run the tests

```bash
npm test
```

You can also check the code and create a production build:

```bash
npm run lint
npm run build
```

## API endpoints

| Method | Endpoint | What it does |
|---|---|---|
| GET | `/api/health` | Checks whether the API is running |
| GET | `/api/health/db` | Checks the database connection |
| GET | `/api/vehicles` | Returns vehicle inventory |
| POST | `/api/vehicles` | Validates and adds a vehicle |

For example, a vehicle can be submitted to `POST /api/vehicles` as JSON:

```json
{
  "vin": "1N4AL11D75C109151",
  "make": "Nissan",
  "model": "Altima",
  "model_year": 2021,
  "status": "active"
}
```

Send the request with the `Content-Type: application/json` header. The API validates the VIN and required fields and rejects duplicate VINs.

## Apache NiFi

NiFi is part of the data flow, not just a separate demo. The configured flow uses these processors:

1. `GenerateFlowFile` creates the sample vehicle payload.
2. `EvaluateJsonPath` extracts its fields.
3. `RouteOnAttribute` routes the FlowFile.
4. `ReplaceText` prepares the JSON body.
5. `InvokeHTTP` sends it to the DataPulse API.
6. `LogAttribute` records the response or failure details.

The HTTP request goes to `http://localhost:3000/api/vehicles`. NiFi must be running, and the API must be available, for the flow to work.

The local NiFi interface is at `https://localhost:8443/nifi/` when the service is running. Use the credentials configured for your installation.

When testing ingestion, use a new valid VIN for each vehicle. Submitting an existing VIN again should be handled as a duplicate.

## Current status

The dashboard, API, and PostgreSQL connection are working together. I also tested the NiFi flow by sending a Nissan Altima through the API and confirming that it appeared in the database-backed inventory.

The current automated test suite covers API health, database connectivity, and basic invalid-input cases. More tests for successful creation, duplicate VINs, and database errors would improve coverage.

The inventory records are sample portfolio data. Sales revenue, service orders, and sales activity are illustrative figures and are not connected to live business systems.

## Next steps

- Expand the API test suite.
- Improve error handling and monitoring for failed ingestion requests.
- Document how to export and restore the NiFi flow.
- Connect sales and service analytics to persisted data.
- Consider authentication and role-based access.

This is an ongoing portfolio project focused on learning how a frontend, backend, database, and data pipeline fit together in a practical application.