# HandmadeFinance

HandmadeFinance helps handmade shop owners manage income and expenses in one place, understand cash flow, and make better day-to-day financial decisions. It brings together transaction tracking, dashboards, reports, Excel imports, activity history, and role-based access for the whole team.

## User Interface

### Overview

![Overview](docs/images/admin/01-dashboard.png)

### Income

![Income](docs/images/admin/02-khoan-thu.png)

### Expenses

![Expenses](docs/images/admin/03-khoan-chi.png)

## Mind map

![HandmadeFinance mind map](docs/mindmap.png)

## Use Case Diagram

```mermaid
flowchart TB
    subgraph roles["Actors"]
        direction LR
        admin(["👤 Administrator"])
        owner(["👤 Shop Owner"])
        employee(["👤 Employee"])
        viewer(["👤 Viewer"])
    end

    subgraph system["HandmadeFinance — System Boundary"]
        direction LR
        adminCases["<b>Administrator</b><br/><br/>UC01 Login · UC02 Logout<br/>UC03 View Dashboard · UC17 Manage Profile<br/>UC04 View Income · UC08 View Expenses<br/>UC05–06 Add/Edit Income<br/>UC09–10 Add/Edit Expenses<br/>UC07 Soft-delete Income<br/>UC11 Soft-delete Expenses<br/>UC12 Import Excel Data<br/>UC13 View Reports · UC14 Export Reports<br/>UC15 View Audit Log<br/>UC16 Manage Users"]
        ownerCases["<b>Shop Owner</b><br/><br/>UC01 Login · UC02 Logout<br/>UC03 View Dashboard · UC17 Manage Profile<br/>UC04 View Income · UC08 View Expenses<br/>UC05–06 Add/Edit Income<br/>UC09–10 Add/Edit Expenses<br/>UC07 Soft-delete Income<br/>UC11 Soft-delete Expenses<br/>UC12 Import Excel Data<br/>UC13 View Reports · UC14 Export Reports<br/>UC15 View Audit Log"]
        employeeCases["<b>Employee</b><br/><br/>UC01 Login · UC02 Logout<br/>UC03 View Dashboard · UC17 Manage Profile<br/>UC04 View Income · UC08 View Expenses<br/>UC05–06 Add/Edit Own Income<br/>UC09–10 Add/Edit Own Expenses<br/>UC12 Import Excel Data"]
        viewerCases["<b>Viewer</b><br/><br/>UC01 Login · UC02 Logout<br/>UC03 View Dashboard · UC17 Manage Profile<br/>UC04 View Income · UC08 View Expenses<br/>UC13 View Reports · UC14 Export Reports"]
    end

    admin --> adminCases
    owner --> ownerCases
    employee --> employeeCases
    viewer --> viewerCases

    classDef actor fill:#666,color:#fff,stroke:#333
    classDef primary fill:#1168bd,color:#fff,stroke:#0b4f9e
    classDef standard fill:#3a7bd5,color:#fff,stroke:#245fa8
    class admin,owner,employee,viewer actor
    class adminCases,ownerCases primary
    class employeeCases,viewerCases standard
    style roles fill:#fff,stroke:#bbb,stroke-dasharray:5 5
    style system fill:#f8fbff,stroke:#1168bd,stroke-dasharray:5 5
```



For detailed actors, permissions, and business flows, see [Actors, roles, and use cases](docs/03-use-cases.md).

## C4 Architecture

This README presents only C1–C3. C4 Level 4 and detailed UML are maintained in the architecture documentation directory.

### C1 — System Context

```mermaid
flowchart LR
    admin(["👤 Administrator"])
    owner(["👤 Shop Owner"])
    employee(["👤 Employee"])
    viewer(["👤 Viewer"])

    subgraph boundary[" "]
        finance["HandmadeFinance<br/><i>[Software System]</i><br/>Manages income, expenses, reports,<br/>data imports, users, and audit logs"]
    end

    admin -- "manages users and all financial data" --> finance
    owner -- "manages finances, reports, and audit logs" --> finance
    employee -- "records income and expenses within permissions" --> finance
    viewer -- "views dashboards, transactions, and reports" --> finance

    style finance fill:#1168bd,color:#fff
```





### C2 — Container

```mermaid
flowchart TB
    operator(["👤 Administrator / Shop Owner / Employee"])
    reader(["👤 Viewer"])

    subgraph platform["HandmadeFinance [Software System Boundary]"]
        direction TB
        subgraph presentation["Presentation"]
            web["Web Frontend<br/><i>[Container: React.js + Vite]</i><br/>UI, routing, forms, tables, and charts"]
        end
        subgraph application["Application"]
            backend[".NET Backend<br/><i>[Container: ASP.NET Core Web API]</i><br/>Authentication, RBAC, business rules,<br/>imports, reporting, and auditing"]
        end
        subgraph data["Data"]
            database[("PostgreSQL<br/><i>[Container: Database]</i><br/>Users, categories, incomes, expenses,<br/>imports, attachments, and audit logs")]
        end
    end

    workbook[("Excel Workbook<br/><i>[External Data]</i><br/>User-provided .xlsx / .xls file")]

    operator --> web
    reader --> web
    web -- "REST / HTTPS / JSON" --> backend
    web -- "upload file import" --> backend
    workbook -.->|"selected from the user's device"| web
    backend -- "SQL / PostgreSQL protocol" --> database

    style web fill:#1168bd,color:#fff
    style backend fill:#1168bd,color:#fff
    style database fill:#1168bd,color:#fff
```





### C3 — Component

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
        persistence["Persistence<br/><i>[Component]</i><br/>Repositories, transaction boundaries,<br/>and SQL mapping"]
    end

    web["Web Frontend<br/><i>[Container: React.js]</i>"]
    db[("PostgreSQL<br/><i>[Container: Database]</i>")]
    file[("Excel Workbook<br/><i>[External Data]</i>")]

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
    reporting --> persistence
    user -.->|"administrative events"| audit
    ledger -.->|"transaction events"| audit
    importer -.->|"batch results"| audit
    audit --> persistence
    persistence --> db

    style api fill:#1168bd,color:#fff
    style identity fill:#1168bd,color:#fff
    style user fill:#1168bd,color:#fff
    style ledger fill:#0b4f9e,color:#fff
    style importer fill:#1168bd,color:#fff
    style reporting fill:#1168bd,color:#fff
    style audit fill:#1168bd,color:#fff
    style persistence fill:#1168bd,color:#fff
```



Complete documentation: [C4 Architecture](docs/architecture/c4/README.md) and [arc42 Architecture Handbook](docs/architecture/arc42/README.md).

## Permissions


| Capability | Admin | Shop Owner | Employee | Viewer |
| ------------------------ | ----- | ---------- | ---------------- | ------ |
| View dashboard and transactions | Yes | Yes | Yes | Yes |
| Create income/expenses | Yes | Yes | Yes | No |
| Edit income/expenses | Yes | Yes | Own records only | No |
| Soft-delete income/expenses | Yes | Yes | No | No |
| Import Excel | Yes | Yes | Yes | No |
| Reports | Yes | Yes | No | Yes |
| Activity log | Yes | Yes | No | No |
| User management | Yes | No | No | No |


The backend must enforce RBAC and the own-record policy; hiding frontend controls serves UI/UX only.

## Documentation

- Requirements: [Scope](docs/01-scope.md), [Features](docs/02-features.md), [INVEST backlog](docs/08-invest-requirements.md), [Acceptance criteria](docs/06-acceptance-criteria.md).
- UI/UX: [Information architecture](docs/04-information-architecture.md).
- Database: [Data model](docs/05-data-model.md), [ER diagram](docs/DATABASE.md), [PostgreSQL schema](database/shop_finance.sql).
- Folder structure: [React and three-tier backend](docs/07-folder-structure.md).
- Code-level design: [Core class diagrams](docs/architecture/uml/01-class-diagrams.md), [remaining module classes](docs/architecture/uml/03-additional-class-diagrams.md), [core sequences](docs/architecture/uml/02-sequence-diagrams.md), and [API traceability/sequences](docs/architecture/uml/03-api-traceability.md).
- API contract: [OpenAPI 3.0.4 specification](docs/api/openapi.yaml) and [API documentation](docs/api/README.md).
- Implementation handoff: [Step 7 readiness and test plan](docs/09-step-7-readiness.md).
