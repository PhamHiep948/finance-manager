# HandmadeFinance

Ứng dụng quản lý thu–chi cho cửa hàng đồ thủ công. Stack mục tiêu gồm **React.js**, **ASP.NET Core/C#** và **PostgreSQL**. Repository hiện có UI mock và thiết kế database/kiến trúc; backend cùng OpenAPI 3.0 chưa được triển khai.

## Giao diện

### Tổng quan

![Tổng quan](docs/images/admin/01-dashboard.png)

### Khoản thu

![Khoản thu](docs/images/admin/02-khoan-thu.png)

### Khoản chi

![Khoản chi](docs/images/admin/03-khoan-chi.png)

## Mind map

![HandmadeFinance mind map](docs/mindmap.png)

## Use Case Diagram

```mermaid
flowchart LR
    admin(["🧍<br/>Administrator"])
    owner(["🧍<br/>Shop Owner"])
    employee(["🧍<br/>Employee"])
    viewer(["🧍<br/>Viewer"])

    subgraph system["HandmadeFinance · System Boundary"]
        common["UC01 Login / UC02 Logout<br/>UC03 View Dashboard / UC17 Manage Profile<br/><i>[Shared use cases]</i>"]
        read["UC04 View Income<br/>UC08 View Expenses"]
        write["UC05–06 Add/Edit Income<br/>UC09–10 Add/Edit Expenses"]
        remove["UC07 Soft-delete Income<br/>UC11 Soft-delete Expenses"]
        importUc["UC12 Import Excel Data"]
        reports["UC13 View Reports<br/>UC14 Export Reports"]
        audit["UC15 View Audit Log"]
        users["UC16 Manage Users"]
    end

    admin --> common
    admin --> read
    admin --> write
    admin --> remove
    admin --> importUc
    admin --> reports
    admin --> audit
    admin --> users
    owner --> common
    owner --> read
    owner --> write
    owner --> remove
    owner --> importUc
    owner --> reports
    owner --> audit
    employee --> common
    employee --> read
    employee -->|may edit own records only| write
    employee --> importUc
    viewer --> common
    viewer --> read
    viewer --> reports

    style system fill:#f8fbff,stroke:#1168bd,stroke-dasharray:5 5
    style admin fill:#666,color:#fff
    style owner fill:#666,color:#fff
    style employee fill:#666,color:#fff
    style viewer fill:#666,color:#fff
    style common fill:#1168bd,color:#fff
    style read fill:#3a7bd5,color:#fff
    style write fill:#3a7bd5,color:#fff
    style remove fill:#3a7bd5,color:#fff
    style importUc fill:#3a7bd5,color:#fff
    style reports fill:#3a7bd5,color:#fff
    style audit fill:#3a7bd5,color:#fff
    style users fill:#3a7bd5,color:#fff
```

Chi tiết actor, quyền và luồng nghiệp vụ: [Actors, roles và use cases](docs/03-use-cases.md).

## C4 Architecture

README chỉ trình bày C1–C3. C4 Level 4 và UML chi tiết được giữ trong thư mục tài liệu kiến trúc.

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

Tài liệu đầy đủ: [C4 Architecture](docs/architecture/c4/README.md) và [arc42 Architecture Handbook](docs/architecture/arc42/README.md).

## Phân quyền

| Chức năng | Admin | Shop Owner | Employee | Viewer |
|---|---:|---:|---:|---:|
| Xem dashboard và thu/chi | Có | Có | Có | Có |
| Tạo khoản thu/chi | Có | Có | Có | Không |
| Sửa khoản thu/chi | Có | Có | Bản ghi của mình | Không |
| Xóa mềm khoản thu/chi | Có | Có | Không | Không |
| Import Excel | Có | Có | Có | Không |
| Báo cáo | Có | Có | Không | Có |
| Nhật ký hoạt động | Có | Có | Không | Không |
| Quản lý người dùng | Có | Không | Không | Không |

Backend phải kiểm tra RBAC và own-record policy; việc ẩn nút ở frontend chỉ phục vụ UI/UX.

## Tài liệu

- Requirements: [Scope](docs/01-scope.md), [Features](docs/02-features.md), [Acceptance criteria](docs/06-acceptance-criteria.md).
- UI/UX: [Information architecture](docs/04-information-architecture.md).
- Database: [Data model](docs/05-data-model.md), [ER diagram](docs/DATABASE.md), [PostgreSQL schema](database/shop_finance.sql).
- Folder structure: [React và backend three-tier](docs/07-folder-structure.md).
- Code-level design: [Class diagrams](docs/architecture/uml/01-class-diagrams.md), [Sequence diagrams](docs/architecture/uml/02-sequence-diagrams.md).
- API contract: OpenAPI 3.0/Swagger **chưa có**; các endpoint hiện tại chỉ là provisional contract.

## Chạy UI mock

```bash
cd app
npm install
npm run dev
```

Tài khoản demo dùng mật khẩu `123456`: `admin@demo.local`, `owner@demo.local`, `staff@demo.local`, `viewer@demo.local`.
