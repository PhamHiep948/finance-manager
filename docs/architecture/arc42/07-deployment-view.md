# 7. Deployment View

Distinguish **local (FACT)** from **production (To Be Determined)**. Do not invent Amazon Web Services, Kubernetes, Nginx, or a Content Delivery Network.

## 7.1 Local Development

**FACT** from `docker-compose.yml` and `.env.example`:

| Node | Details |
| ---- | ------- |
| PostgreSQL | `postgres:16`, container `handmade-finance-postgres`, database `handmade_finance`, user/password `postgres`, host port **5433** → 5432, timezone `Asia/Ho_Chi_Minh`, volume `handmade_postgres_data`, healthcheck `pg_isready` |
| App connection string | `postgresql://postgres:postgres@localhost:5433/handmade_finance` |

Go Backend and React **do not yet** have Compose services. Locally, the developer runs Frontend + Go on the workstation; Postgres runs in Docker.

```mermaid
flowchart LR
  Dev[Developer browser]
  React[React.js local]
  Go[Go Backend local]
  PG[PostgreSQL Docker :5433]

  Dev --> React
  React -->|HTTPS or HTTP local REST JSON| Go
  Go -->|DATABASE_URL| PG
```

Local transport may use HTTP (without Transport Layer Security) — **To Be Determined** for the dev environment. Production requires HTTPS (architecture constraint).

## 7.2 Production Target (logical)

No infrastructure ADR has been made yet. Logical model:

```text
Client Browser
     ↓ HTTPS
React.js Web Frontend
     ↓ HTTPS / REST / JSON
Go Backend
     ↓ private SQL
PostgreSQL
```

| Item | Status |
| ---- | ------ |
| Frontend hosting | To Be Determined |
| Go hosting | To Be Determined |
| PostgreSQL hosting | To Be Determined |
| Transport Layer Security terminator | To Be Determined |
| Backup / restore | To Be Determined |
| Object/file storage for `storage_path` | To Be Determined |

Do not deploy the Frontend with SQL-level permissions to the database.

## 7.3 Mapping Container → Node

| Container | Local | Production |
| --------- | ----- | ---------- |
| React.js Web Frontend | Process/dev server on developer machine | To Be Determined |
| Go Backend | Process on developer machine | To Be Determined |
| PostgreSQL | Docker Compose | To Be Determined |

Matches Section 5: three containers, with no additional gateway/message broker.
