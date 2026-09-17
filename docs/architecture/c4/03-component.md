# C3 — Component — .NET Backend

> **Status:** target architecture. The components below do not yet have C#/.NET source code in the repository.

```mermaid
flowchart TB
    subgraph rt[".NET Backend [Container]"]
        direction TB
        api["HTTP API<br/><i>[Component: ASP.NET Core]</i><br/>REST endpoints, request validation,<br/>response and error mapping"]
        identity["Identity & Access<br/><i>[Component]</i><br/>Login, session/token, RBAC,<br/>and own-record policy"]
        user["User & Profile<br/><i>[Component]</i><br/>Accounts, roles, status, and profiles"]
        ledger["Income & Expense<br/><i>[Component]</i><br/>CRUD, categories, tax, status,<br/>and soft deletion"]
        importer["Excel Import<br/><i>[Component]</i><br/>File validation, preview,<br/>batch import, and row-level results"]
        reporting["Dashboard & Reporting<br/><i>[Component]</i><br/>KPIs, trends, breakdowns,<br/>and export data"]
        audit["Audit Log<br/><i>[Component]</i><br/>Records business actions<br/>for traceability"]
        fileStore["File Storage Adapter<br/><i>[Component]</i><br/>Validates and stores binary files<br/>behind IFileStorage"]
        persistence["Persistence<br/><i>[Component]</i><br/>Repositories, transaction boundaries,<br/>and SQL mapping"]
    end

    web["Web Frontend<br/><i>[Container: React.js]</i>"]
    db[("PostgreSQL<br/><i>[Container: Database]</i>")]
    file[("Excel Workbook<br/><i>[External Data]</i>")]
    disk[("Local File Storage<br/><i>[Container]</i>")]

    web --> api
    file -.->|"uploaded through the Web Frontend"| api
    api --> identity
    api --> user
    api --> ledger
    api --> importer
    api --> reporting
    identity --> persistence
    user --> persistence
    ledger --> persistence
    importer --> ledger
    importer --> persistence
    importer --> fileStore
    ledger --> fileStore
    reporting --> persistence
    user -.->|"administrative events"| audit
    ledger -.->|"transaction events"| audit
    importer -.->|"batch results"| audit
    audit --> persistence
    persistence --> db
    fileStore --> disk

    style api fill:#1168bd,color:#fff
    style identity fill:#1168bd,color:#fff
    style user fill:#1168bd,color:#fff
    style ledger fill:#0b4f9e,color:#fff
    style importer fill:#1168bd,color:#fff
    style reporting fill:#1168bd,color:#fff
    style audit fill:#1168bd,color:#fff
    style persistence fill:#1168bd,color:#fff
    style fileStore fill:#1168bd,color:#fff
```

## Component catalog

| Component | Owns | Does not own |
|---|---|---|
| HTTP API | Transport, validation, error contract | SQL and business decisions |
| Identity & Access | Authentication, RBAC, own-record rule | UI visibility |
| User & Profile | Account lifecycle and profiles | Financial transactions |
| Income & Expense | Income/expense, tax, status, and soft-delete rules | Report rendering |
| Excel Import | Batch parsing, validation, and import orchestration | Bypassing the domain to write transaction tables |
| Dashboard & Reporting | Aggregate queries, KPIs, and export | Modifying transactions |
| Audit Log | Business-action history | Primary operational data |
| File Storage Adapter | File validation, generated keys, binary persistence | Business metadata or authorization |
| Persistence | Repositories, SQL, and transactions | HTTP and UI authorization |

## Dependency Flow

`HTTP API → Identity & Access → domain component → Persistence → PostgreSQL`.

Import calls Income & Expense to reuse validation. Reporting reads only through Persistence. No business component opens its own PostgreSQL connection.

## Import Domain Validation Strategy

**Status:** ACCEPTED

### Confirmed requirement

Import must not duplicate or bypass critical income/expense validation and authorization rules.

Import orchestrates the existing Application income/expense validators and business-rule abstractions. It may batch persistence for efficiency, but it must not duplicate rules or write through a bypass that accepts data rejected by manual entry. `ARCH-013` and `INT-IMPORT-003` verify parity.

**Previous:** [C2 — Container](02-container.md) · **Next:** [C4 — Code for Income and Expense](04-code.md) · **Related:** [arc42 Building Block View](../arc42/05-building-block-view.md).

**Sources of truth:** `docs/02-features.md`, `docs/03-use-cases.md`, `src/database/shop_finance.sql`, `src/frontend/src/lib/store.jsx`.
