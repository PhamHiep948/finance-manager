# C3 — Component

Which **Components** make up the Go Backend?

This level **zooms into the Go Backend Container** from [C2](02-container.md). Web Frontend and PostgreSQL remain Containers (they are not decomposed into components here).

**Architecture status: Target.** The components below are planned Go modules. The current source does not yet contain a backend.

![C3 Component — Go Backend](c3-component.png)

Image file: [c3-component.png](c3-component.png)

C4 flow: [C1](01-system-context.md) → [C2](02-container.md) → **C3**

## How to read the diagram

The purple dashed boundary = **Go Backend**. On the left, Web Frontend calls HTTPS / REST / JSON. On the right, PostgreSQL receives SQL.

Typical request flow:

```text
Web Frontend
    → HTTP API & Routing
        → Identity & Access
        → business module (User, Category, Income, Expense, Import, Dashboard)
            → Persistence / Data Access
                → PostgreSQL
```

Some modules also call Category, Dashboard & Reporting, and Audit Log rather than bypassing them to access the database directly.

## Neighbors (from C2)

| Name | Type | Role on C3 |
| ---- | ---- | ---------- |
| Web Frontend | Container: Web Application (React.js) | Calls REST API |
| PostgreSQL Database | Container: Database | Stores persistent data |

## Components (inside Go Backend)

| Component | Type | Description on diagram |
| --------- | ---- | ---------------------- |
| HTTP API & Routing | Go | Receives REST/JSON requests, routes endpoints, and dispatches to business components |
| Identity & Access | Go | Authenticates users and checks roles / access permissions |
| User & Profile Management | Go | Manages accounts, user status, and user profiles |
| Category Management | Go | Manages income and expense categories used by transactions |
| Income Management | Go | Manages the income lifecycle and related business rules |
| Expense Management | Go | Manages the expense lifecycle and related business rules |
| Excel Import | Go | Validates, previews, and creates transactions from valid Excel data |
| Dashboard & Reporting | Go | Aggregates metrics and provides data for dashboards and reports |
| Audit Log | Go | Records important actions for traceability |
| Persistence / Data Access | Go / SQL | Encapsulates SQL queries, transactions, and PostgreSQL access |

Mapping from current UI (frontend) → target component:

| UI screen / module | C3 Component |
| ------------------ | ------------ |
| Login, button-level authorization | Identity & Access |
| Users, profile | User & Profile Management |
| Income / expense categories | Category Management |
| Income Management | Income Management |
| Expense Management | Expense Management |
| Excel Import | Excel Import |
| Dashboard, reports | Dashboard & Reporting |
| Activity Log | Audit Log |

## Relationships

### Into / out of the Container

| Source | Destination | Relationship |
| ------ | ----------- | ------------ |
| Web Frontend | HTTP API & Routing | HTTPS / REST / JSON |
| Persistence / Data Access | PostgreSQL Database | SQL / PostgreSQL Protocol |

### HTTP API to business components

| Source | Destination | Relationship |
| ------ | ----------- | ------------ |
| HTTP API & Routing | Identity & Access | Authentication / authorization |
| HTTP API & Routing | User & Profile Management | Users / profile |
| HTTP API & Routing | Income Management | Income operations |
| HTTP API & Routing | Expense Management | Expense operations |
| HTTP API & Routing | Excel Import | Excel import |
| HTTP API & Routing | Category Management | Categories |
| HTTP API & Routing | Dashboard & Reporting | Dashboard / reports |

### Business-component relationships

| Source | Destination | Relationship |
| ------ | ----------- | ------------ |
| Income Management | Category Management | Uses income categories |
| Expense Management | Category Management | Uses expense categories |
| Excel Import | Income Management | Creates income records |
| Excel Import | Expense Management | Creates expense records |
| Income Management | Dashboard & Reporting | Sends transaction changes / aggregation impact |
| Expense Management | Dashboard & Reporting | Sends transaction changes / aggregation impact |
| Excel Import | Dashboard & Reporting | Sends import results |
| User & Profile Management | Audit Log | Records administrative actions |
| Income / Expense / Excel Import | Audit Log | Records actions |

### To Persistence

Identity, User & Profile, Category, Income, Expense, Excel Import, Dashboard & Reporting, and Audit Log all use **Persistence / Data Access** (read accounts/permissions, read/write transactions, read aggregate data, store audit logs). No business component connects directly to PostgreSQL.

## Current State

In the current source, equivalent logic lives in browser JavaScript (`frontend/js/auth.js`, `frontend/js/data.js`, `frontend/js/views.js`). C3 describes where those responsibilities will live once the Go Backend exists.

## Source of Truth

- Diagram: `c3-component.png`
- Previous level: [02-container.md](02-container.md)
- `frontend/js/auth.js`, `frontend/js/data.js`, `frontend/js/views.js`
- `docs/02-features.md`, `docs/03-use-cases.md`
- `database/shop_finance.sql`
