# HandmadeFinance

Income and expense management web app for a handmade shop: record money in, money out, track total revenue, total expenses, and net profit over time and by category. Amounts are stored in USD; the interface can convert them to EUR for display.

The target stack is a **React.js** frontend (**HandmadeFinance**), a **.NET (C#)** backend, and **PostgreSQL** for data storage. The mock version in this repository still runs entirely in the browser (API integration is not implemented yet).

![Dashboard](docs/images/admin/01-dashboard.png)

## Main features

- Login, logout, and role-based access control in the UI
- Dashboard: total revenue, total expenses, net profit, transaction count, charts, revenue by income category, and recent transactions
- Income management: full-column list (show/hide columns), add/edit modal, detail modal; product name, order code, EU region, sales channel, quantity, unit price, Item / Discount / Subtotal / Shipping / Tax, pre-tax amount / tax rate / post-tax amount, and record status
- Expense management: same workflow; payee, domestic/international scope, payment method, tax rate, and post-tax amount
- Reports & analytics: overview, by day, by month, by income category, by expense category, report export (print)
- Excel data import: file selection, preview, and import history in the UI
- Activity log
- User management (Admin): add/edit, enable/disable, avatar
- Profile: account (phone number, avatar), security, roles & permissions

## Roles

There are four roles. Menus and buttons are shown only when the user has permission.

| | Admin | Shop Owner | Employee | Viewer |
|---|---|---|---|---|
| Dashboard | Yes | Yes | Yes | Yes |
| View income / expenses | Yes | Yes | Yes | Yes |
| Add income / expenses | Yes | Yes | Yes | |
| Edit income / expenses | Yes | Yes | Own records | |
| Soft-delete income / expenses | Yes | Yes | | |
| Import Excel data | Yes | Yes | Yes | |
| Reports | Yes | Yes | | Yes |
| Activity log | Yes | Yes | | |
| Users | Yes | | | |
| Personal profile | Yes | Yes | Yes | Yes |

Demo accounts (password `123456`):

- `admin@demo.local` — Administrator
- `owner@demo.local` — Shop Owner
- `staff@demo.local` — Employee
- `viewer@demo.local` — Viewer

## Mind map

![HandmadeFinance mind map](docs/mindmap.png)

## C4 Architecture

The three C4 levels below describe the system context, containers, and main components of the .NET backend. See the complete documentation and C4 Level 4 diagrams in [docs/architecture/c4](docs/architecture/c4/README.md).

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

### C3 — Component (.NET Backend)

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

## Interface

After login (sidebar + top bar):

- Dashboard
- Income Management
- Expense Management
- Reports & Analytics
- Excel Data Import
- Activity Log
- User Management
- Personal Profile

Screenshots by role:

- [admin](docs/images/admin/)
- [shop-owner](docs/images/chu-shop/)
- [employee](docs/images/nhan-vien/)
- [viewer](docs/images/nguoi-xem/)

Viewer — income list (no add / edit / delete buttons):

![Viewer — income](docs/images/nguoi-xem/02-khoan-thu.png)

Employee — no Reports, Activity Log, or Users menu items:

![Employee — Dashboard](docs/images/nhan-vien/01-dashboard.png)

## Data

The PostgreSQL design (`database/shop_finance.sql`, `database/shop_finance.dbml`) includes:

- users (phone number, avatar, status)
- income categories and income records (sales channel, record status, pre/post-tax amounts)
- expense categories and expense records (payment method, status)
- attachments
- import batches
- audit logs

The UI data comes from `app/src/lib/data.js` (including sample Etsy order `4154185113`). There is one USD dataset; the currency toolbar displays either USD or EUR using a mock exchange rate.

## Repository structure

```text
finance-manager/
  README.md
  app/               React.js mock (Vite)
  docs/              product documentation
  docs/images/       UI screenshots by role
  database/          shop_finance.sql, shop_finance.dbml
  scripts/           serve.sh, serve.bat
```

## Documentation

- [Scope](docs/01-scope.md)
- [Features](docs/02-features.md)
- [Use cases](docs/03-use-cases.md)
- [Use Case Diagram](docs/03-use-cases.md#use-case-diagram)
- [Information architecture](docs/04-information-architecture.md)
- [Data model](docs/05-data-model.md)
- [ER diagram](docs/DATABASE.md)
- [Acceptance criteria](docs/06-acceptance-criteria.md)
- [Mind map](docs/mindmap.png)
- [C4 architecture (C1 → C2 → C3 → C4)](docs/architecture/c4/README.md)
- [arc42 architecture handbook](docs/architecture/arc42/README.md)
