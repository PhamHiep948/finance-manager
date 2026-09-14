# C2 — Container

Which high-level applications / data stores make up HandmadeFinance?

C4 flow: [C1 System Context](01-system-context.md) → **C2** → [C3 Component](03-component.md)

This is step 2: zoom into the Software System shown on C1. The diagram represents the **Target Architecture**. The Go Backend **does not yet exist in the source**.

![C2 Container — HandmadeFinance](c2-container.jpg)

Image file: [c2-container.jpg](c2-container.jpg)

## How to read the diagram

Users (**Person**) are **outside** the dashed line. The dashed line is the **System Boundary** of HandmadeFinance.

The three boxes inside the boundary are **Containers**:

| Container | Type | Technology | Status |
| --------- | ---- | ---------- | ------ |
| Web Frontend | Web Application | React.js | Target |
| Go Backend | Backend Application | Go | Planned |
| PostgreSQL Database | Database | PostgreSQL | Designed (schema) |

The browser is not modeled as a separate Container.

## People

The four roles come from `frontend/js/auth.js`. In the diagram, all four use the system through the **Web Frontend**.

| Actor | On the diagram | Relationship to Frontend |
| ----- | -------------- | ------------------------ |
| Shop Owner | Monitors and manages income and expenses | Manages and monitors income and expenses |
| Admin | Administers users and the system | Administers the system and users |
| Employee | Records transactions according to permissions | Records transactions according to permissions |
| Viewer | Views data and reports | Views data and reports |

## Containers

### Web Frontend

| | |
|---|---|
| **Name** | Web Frontend |
| **Type** | Container: Web Application |
| **Technology** | React.js |
| **Status** | Target |
| **Description** | HandmadeFinance user interface (income, expenses, dashboard, reports, import, users, profile). |

### Go Backend

| | |
|---|---|
| **Name** | Go Backend |
| **Type** | Container: Backend Application |
| **Technology** | Go |
| **Status** | Planned / Target |
| **Description** | Provides REST APIs, authentication / authorization, business processing, and data access. |

**Not implemented yet.** The source contains no Go code or HTTP API.

### PostgreSQL Database

| | |
|---|---|
| **Name** | PostgreSQL Database |
| **Type** | Container: Database |
| **Technology** | PostgreSQL |
| **Status** | Designed (schema); not yet connected to the application runtime |
| **Description** | Stores users, permissions, income/expense transactions, categories, imports, and system audit logs. |

Table details belong to the data model and are not modeled as Containers.

## Relationships (Target Architecture)

| Source | Destination | Relationship |
| ------ | ----------- | ------------ |
| Shop Owner, Admin, Employee, Viewer | Web Frontend | Use the system through a browser (one relationship per role in the diagram) |
| Web Frontend | Go Backend | Calls REST API / HTTPS / JSON |
| Go Backend | PostgreSQL Database | Reads/writes data / SQL |

The Frontend **does not** access PostgreSQL directly in the Target Architecture.

## Current State

Source verification: the current mock frontend is not yet React; data lives in browser-side JavaScript. C4 documents **React.js** as the target frontend technology. The PostgreSQL schema exists for design purposes and can run independently through Docker; the mock app does not use it.

```text
Users → Web Frontend ↔ mock JS (data.js, auth.js)
PostgreSQL: schema only, not connected to app
Go Backend: not implemented
```

## Next step

Zoom into the Go Backend to view its Components: [C3 — Component](03-component.md).

## Source of Truth

- Diagram: `c2-container.jpg`
- `README.md` (repo)
- `docs/05-data-model.md`, `docs/DATABASE.md`
- `frontend/`
- `database/shop_finance.sql`
- `docker-compose.yml`
