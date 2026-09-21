# HandmadeFinance

HandmadeFinance helps handmade shop owners manage income and expenses in one place, understand cash flow, and make better day-to-day financial decisions. It brings together transaction tracking, dashboards, reports, Excel imports, activity history, and role-based access for the whole team.

## 1. Requirements — INVEST, Use Cases, and Acceptance Criteria

Requirements define what HandmadeFinance must do, who uses it, the value delivered, and the observable conditions of success. User stories are reviewed with INVEST and mapped to use cases and acceptance criteria.

### 1.1 Product mind map

![HandmadeFinance mind map](docs/mindmap.png)

### 1.2 INVEST requirements

The V1 backlog includes 17 user stories. These stories cover login, income and expense management, dashboard, Excel import, reports, audit logs, user management, and personal profile management.
Before a user story is ready for development, it is checked using the INVEST criteria.


| Criterion       | Meaning in HandmadeFinance                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Independent** | Each story should provide a clear feature and depend on other stories only when necessary.                          |
| **Negotiable**  | The UI and technical implementation can change as long as the main goal and permission rules stay the same.         |
| **Valuable**    | Each story should provide value to the user or the business.                                                        |
| **Estimable**   | Roles, inputs, outputs, dependencies, and important failure outcomes are documented.                                |
| **Small**       | Each story covers one primary capability and can be divided into API, application, persistence, UI, and test tasks. |
| **Testable**    | Every story maps to observable acceptance criteria and expected authorization, validation, and error behavior.      |


```text
US01–US02   Authentication and session
US03        Dashboard
US04–US07   Income management
US08–US11   Expense management
US12        Excel import
US13–US14   Reports and export
US15        Audit log
US16        User management
US17        Personal profile and password
```

All V1 stories now have estimable target behavior. Logout is client-side token discard, import is synchronous and atomic within documented limits, and export reuses the approved report filters. The complete story-level review is maintained in [INVEST Requirements](docs/08-invest-requirements.md).

### 1.3 Use cases

```mermaid
flowchart TB
    subgraph roles["Actors"]
        direction LR
        admin(["Administrator"])
        owner(["Shop Owner"])
        employee(["Employee"])
        viewer(["Viewer"])
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

### 1.4 Roles and permissions


| Capability                      | Admin | Shop Owner | Employee         | Viewer |
| ------------------------------- | ----- | ---------- | ---------------- | ------ |
| View dashboard and transactions | Yes   | Yes        | Yes              | Yes    |
| Create income/expenses          | Yes   | Yes        | Yes              | No     |
| Edit income/expenses            | Yes   | Yes        | Own records only | No     |
| Soft-delete income/expenses     | Yes   | Yes        | No               | No     |
| Import Excel                    | Yes   | Yes        | Yes              | No     |
| Reports                         | Yes   | Yes        | No               | Yes    |
| Activity log                    | Yes   | Yes        | No               | No     |
| User management                 | Yes   | No         | No               | No     |


The backend must enforce RBAC and the own-record policy; hiding frontend controls serves UI/UX only.

## 2. Information Architecture, Screen Hierarchy, and UI/UX

The information architecture organizes the authenticated workspace by business capability. Screen permissions and navigation follow the role matrix, while loading, empty, validation, error, saving, and success states are defined consistently.

### 2.1 Information architecture

```text
Public
└── Login

Authenticated
├── Dashboard
├── Income
├── Expenses
├── Reports
├── Import
├── Audit
├── Users
├── Profile
└── Forbidden
```

### 2.2 Screen hierarchy

Login leads to the authenticated shell. The shell owns navigation to feature pages; income, expense, and user create/edit interactions use feature-owned modals. Unauthorized navigation resolves to the Forbidden screen.

Detailed screen IDs, user flows, screen states, accessibility rules, and API mappings are maintained in [Information Architecture](docs/04-information-architecture.md).

### 2.3 Current UI prototype

#### Overview

![Overview](docs/images/admin/01-dashboard.png)

#### Income

![Income](docs/images/admin/02-khoan-thu.png)

#### Expenses

![Expenses](docs/images/admin/03-khoan-chi.png)

## 3. C4 Architecture

This README presents only C1–C3. C4 Level 4 and detailed UML are maintained in the architecture documentation directory.

### C1 — System Context

```mermaid
flowchart LR
    admin(["Administrator"])
    owner(["Shop Owner"])
    employee(["Employee"])
    viewer(["Viewer"])

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
    operator(["Administrator / Shop Owner / Employee"])
    reader(["Viewer"])

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

## 4. Database Diagrams and OpenAPI 3.0 Contract

Step 4 defines the persistence contract and the HTTP contract connecting the future React API adapter to the backend.

### 4.1 Database diagrams

The target PostgreSQL model keeps users, financial transactions, imports, attachments, and audit events connected while preserving separate income and expense categories.

```mermaid
erDiagram
    app_users ||--o{ income_categories : creates
    app_users ||--o{ expense_categories : creates
    app_users ||--o{ incomes : creates
    app_users ||--o{ expenses : creates
    app_users ||--o{ import_batches : imports
    app_users ||--o{ attachments : uploads
    app_users ||--o{ audit_logs : performs

    income_categories ||--o{ incomes : classifies
    expense_categories ||--o{ expenses : classifies
    import_batches ||--o{ incomes : contains
    import_batches ||--o{ expenses : contains
    incomes ||--o{ attachments : has
    expenses ||--o{ attachments : has

    app_users {
        bigint id PK
        varchar email
        user_role role
        boolean is_active
    }
    income_categories {
        bigint id PK
        varchar name
        bigint created_by FK
    }
    incomes {
        bigint id PK
        date income_date
        bigint income_category_id FK
        numeric amount
        data_source source
        bigint import_batch_id FK
        bigint created_by FK
        timestamptz deleted_at
    }
    expense_categories {
        bigint id PK
        varchar name
        bigint created_by FK
    }
    expenses {
        bigint id PK
        date expense_date
        bigint expense_category_id FK
        numeric amount
        data_source source
        bigint import_batch_id FK
        bigint created_by FK
        timestamptz deleted_at
    }
    import_batches {
        bigint id PK
        import_type import_type
        import_status status
        bigint imported_by FK
    }
    attachments {
        bigint id PK
        bigint income_id FK
        bigint expense_id FK
        bigint uploaded_by FK
    }
    audit_logs {
        bigint id PK
        bigint actor_user_id FK
        audit_action action
        varchar module
    }
```



See the [detailed database diagram](docs/DATABASE.md), [data model](docs/05-data-model.md), and [PostgreSQL schema](src/database/shop_finance.sql).

### 4.2 OpenAPI 3.0 API documentation

The HTTP contract is defined with OpenAPI 3.0.4 and organized into Authentication, Dashboard, Categories, Income, Expenses, Reports, Imports, Attachments, Audit, Users, and Profile.

```text
23 paths
33 operations
Bearer JWT security
Role metadata and employee ownership rules
JSON and multipart request contracts
Reusable request/response schemas
RFC 7807-compatible application/problem+json errors
Request, success, and error examples
```

Every operation has a stable `operationId`, documented parameters, request and response schemas, success/error status codes, and target authorization rules. The contract is a design source of truth; the backend runtime has not been implemented yet.

- [OpenAPI 3.0.4 specification](docs/api/openapi.yaml)
- [API documentation and sample calls](docs/api/README.md)

## 5. Frontend and Backend Folder Structures

### 5.1 Current repository layout

```text
finance-manager/
├── src/
│   ├── frontend/                     # React 19 + Vite prototype
│   │   ├── src/
│   │   │   ├── components/           # Login and authenticated application shell
│   │   │   ├── pages/                # Dashboard, ledger, reports, import, audit, users, profile
│   │   │   └── lib/                  # Mock data, browser state, permissions, formatting, UI helpers
│   │   ├── public/                   # Static assets and sample Excel workbooks
│   │   └── package.json              # Frontend scripts and dependencies
│   ├── backend/                      # ASP.NET Core three-tier executable baseline
│   │   ├── src/
│   │   │   ├── HandmadeFinance.Api/  # Presentation/API layer
│   │   │   ├── HandmadeFinance.Application/
│   │   │   └── HandmadeFinance.Infrastructure/
│   │   └── tests/                    # Application, API, and infrastructure tests
│   └── database/
│       ├── shop_finance.sql          # PostgreSQL target schema, constraints, views, triggers, seeds
│       └── shop_finance.dbml         # Database relationship model
├── docs/
│   ├── api/                          # OpenAPI contract and API usage documentation
│   ├── architecture/                 # C4, arc42, class diagrams, and sequence diagrams
│   ├── requirements/                 # Business rules and non-functional requirements
│   ├── traceability/                 # Cross-step master traceability matrix
│   ├── images/                       # Role-based UI screenshots
│   └── 01-scope.md … 09-step-7-readiness.md
└── README.md
```

The frontend is currently an intentional mock-data prototype and is not connected to the API. The backend has an executable three-project baseline and PostgreSQL repositories for ledger/users; import history, attachments, and audit still require durable production adapters. See [Project Progress](#project-progress) for the current checklist.

### 5.2 Target React feature structure

```text
src/frontend/src/
├── app/                 # Routes, providers, and application composition
├── components/          # Shared layout, forms, feedback, and data display
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── categories/
│   ├── incomes/
│   ├── expenses/
│   ├── reports/
│   ├── imports/
│   ├── audit/
│   ├── users/
│   └── profile/
├── services/            # Shared API client, endpoints, and downloads
├── hooks/               # Shared reusable hooks
├── lib/                 # Pure date, money, formatting, and validation helpers
├── styles/
└── test/                # Setup, fixtures, handlers, and provider-aware rendering
```

Target dependency flow:

```text
Page/Component → Feature Hook → Feature Service → apiClient → REST API
```

### 5.3 Target ASP.NET Core three-tier structure

```text
src/backend/
├── src/
│   ├── HandmadeFinance.Api/             # Presentation: controllers, contracts, middleware, mapping
│   ├── HandmadeFinance.Application/     # Services, policies, validators, entities, interfaces
│   └── HandmadeFinance.Infrastructure/  # PostgreSQL, repositories, files, JWT, exporters
└── tests/
    ├── HandmadeFinance.Application.Tests/
    ├── HandmadeFinance.Api.Tests/
    └── HandmadeFinance.Infrastructure.Tests/
```

Dependency rules:

```text
Api → Application
Infrastructure → Application
Api → Infrastructure only at the dependency-injection composition root
Application → neither Api nor Infrastructure
```

The complete module ownership, naming, dependency, and test-location design is maintained in [Target Folder Structure](docs/07-folder-structure.md).

## 6. Detailed Class and Sequence Design

Detailed design derives from the C4 components in Step 3, the database and OpenAPI contracts in Step 4, and the target folder ownership in Step 5. These diagrams remain target design views; the executable baseline may consolidate classes while preserving the documented layer boundaries.

### 6.1 C4 Level 4 — Code collaboration

#### L4.1 Income Management

```mermaid
flowchart TB
    subgraph income["Income Management [Component]"]
        direction TB
        handler["IncomesController<br/><i>[ASP.NET Core Controller]</i><br/>Receives requests and maps DTOs<br/>and HTTP responses"]
        service["IncomeService<br/><i>[C# class]</i><br/>Coordinates create, update,<br/>soft delete, and queries"]
        policy["IncomePolicy<br/><i>[C# class]</i><br/>Checks roles and employee<br/>record-ownership permissions"]
        validator["IncomeValidator<br/><i>[C# class]</i><br/>Validates dates, amounts, tax,<br/>categories, and status"]
        model["Income<br/><i>[Domain entity]</i><br/>Income data and business rules"]
        repository["IIncomeRepository<br/><i>[C# interface]</i><br/>AddAsync, UpdateAsync,<br/>FindActiveAsync, ListAsync"]
        postgres["IncomeRepository<br/><i>[C# class]</i><br/>Implements the repository with SQL"]

        handler --> service
        service --> policy
        service --> validator
        service --> model
        service --> repository
        postgres -.->|"implements"| repository
    end

    api["HTTP API<br/><i>[Component]</i>"]
    identity["Identity & Access<br/><i>[Component]</i>"]
    audit["Audit Log<br/><i>[Component]</i><br/>DML audit is produced by PostgreSQL triggers"]
    db[("PostgreSQL<br/><i>[Container: Database]</i>")]

    api --> handler
    policy --> identity
    postgres --> db
    db -.->|"trigger event mapped to business audit action"| audit

    style handler fill:#1168bd,color:#fff
    style service fill:#0b4f9e,color:#fff
    style policy fill:#1168bd,color:#fff
    style validator fill:#1168bd,color:#fff
    style model fill:#1168bd,color:#fff
    style repository fill:#1168bd,color:#fff
    style postgres fill:#1168bd,color:#fff
```



#### L4.2 Expense Management

```mermaid
flowchart TB
    subgraph expense["Expense Management [Component]"]
        direction TB
        handler["ExpensesController<br/><i>[ASP.NET Core Controller]</i><br/>Receives requests and maps DTOs<br/>and HTTP responses"]
        service["ExpenseService<br/><i>[C# class]</i><br/>Coordinates create, update,<br/>soft delete, and queries"]
        policy["ExpensePolicy<br/><i>[C# class]</i><br/>Checks roles and employee<br/>record-ownership permissions"]
        validator["ExpenseValidator<br/><i>[C# class]</i><br/>Validates dates, payees, amounts,<br/>tax, scope, and status"]
        model["Expense<br/><i>[Domain entity]</i><br/>Expense data and business rules"]
        repository["IExpenseRepository<br/><i>[C# interface]</i><br/>AddAsync, UpdateAsync,<br/>FindActiveAsync, ListAsync"]
        postgres["ExpenseRepository<br/><i>[C# class]</i><br/>Implements the repository with SQL"]

        handler --> service
        service --> policy
        service --> validator
        service --> model
        service --> repository
        postgres -.->|"implements"| repository
    end

    api["HTTP API<br/><i>[Component]</i>"]
    identity["Identity & Access<br/><i>[Component]</i>"]
    audit["Audit Log<br/><i>[Component]</i><br/>DML audit is produced by PostgreSQL triggers"]
    db[("PostgreSQL<br/><i>[Container: Database]</i>")]

    api --> handler
    policy --> identity
    postgres --> db
    db -.->|"trigger event mapped to business audit action"| audit

    style handler fill:#1168bd,color:#fff
    style service fill:#0b4f9e,color:#fff
    style policy fill:#1168bd,color:#fff
    style validator fill:#1168bd,color:#fff
    style model fill:#1168bd,color:#fff
    style repository fill:#1168bd,color:#fff
    style postgres fill:#1168bd,color:#fff
```



Source: [C4 Level 4 — Code](docs/architecture/c4/04-code.md)

### 6.2 Core class diagrams

#### 1. Authentication

```mermaid
classDiagram
    direction TB

    class AuthController {
        +LoginAsync(LoginRequest, CancellationToken) Task
        +LogoutAsync(CancellationToken) Task
    }

    class LoginRequest {
        +string Email
        +string Password
    }

    class LoginResponse {
        +string AccessToken
        +string TokenType
        +DateTimeOffset ExpiresAt
        +UserResponse User
    }

    class UserResponse {
        +long Id
        +string Username
        +string FullName
        +string? Email
        +string? Phone
        +string? AvatarUrl
        +string Timezone
        +UserRole Role
        +bool IsActive
        +DateTimeOffset? LastLoginAt
        +DateTimeOffset CreatedAt
        +DateTimeOffset UpdatedAt
    }

    class IAuthService {
        <<interface>>
        +LoginAsync(string, string, CancellationToken) Task
        +LogoutAsync(ActorContext, CancellationToken) Task
    }

    class AuthService {
        +LoginAsync(string, string, CancellationToken) Task
        +LogoutAsync(ActorContext, CancellationToken) Task
    }

    class AuthResult {
        +string AccessToken
        +DateTimeOffset ExpiresAt
        +AppUser User
    }

    class AppUser {
        +long Id
        +string Username
        +string? Email
        +string PasswordHash
        +string FullName
        +UserRole Role
        +bool IsActive
        +DateTimeOffset? LastLoginAt
        +DateTimeOffset? DeletedAt
    }

    class IUserRepository {
        <<interface>>
        +FindActiveByEmailAsync(string, CancellationToken) Task
        +UpdateLastLoginAsync(long, DateTimeOffset, CancellationToken) Task
    }

    class IPasswordHasher {
        <<interface>>
        +Verify(string, string) bool
    }

    class ITokenIssuer {
        <<interface>>
        +Issue(AppUser) TokenResult
    }

    class IAuditLogRepository {
        <<interface>>
        +AddAsync(AuditEntry, CancellationToken) Task
    }

    class IUnitOfWork {
        <<interface>>
        +ExecuteAsync(long actorUserId, Func, CancellationToken) Task
    }

    class UserRepository {
        +FindActiveByEmailAsync(string, CancellationToken) Task
        +UpdateLastLoginAsync(long, DateTimeOffset, CancellationToken) Task
    }

    class PasswordHasher
    class JwtTokenIssuer
    class AuditLogRepository
    class EfUnitOfWork

    AuthController --> LoginRequest
    AuthController --> LoginResponse
    AuthController --> IAuthService
    AuthService ..|> IAuthService
    AuthService --> IUserRepository
    AuthService --> IPasswordHasher
    AuthService --> ITokenIssuer
    AuthService --> IAuditLogRepository
    AuthService --> IUnitOfWork
    AuthService --> AuthResult
    AuthResult --> AppUser
    UserRepository ..|> IUserRepository
    PasswordHasher ..|> IPasswordHasher
    JwtTokenIssuer ..|> ITokenIssuer
    AuditLogRepository ..|> IAuditLogRepository
    EfUnitOfWork ..|> IUnitOfWork
```



#### 2. Income

```mermaid
classDiagram
    direction TB

    class IncomesController {
        +ListAsync(IncomeQueryRequest, CancellationToken) Task
        +GetByIdAsync(long, CancellationToken) Task
        +CreateAsync(CreateIncomeRequest, CancellationToken) Task
        +UpdateAsync(long, UpdateIncomeRequest, CancellationToken) Task
        +SoftDeleteAsync(long, CancellationToken) Task
    }

    class CreateIncomeRequest {
        +DateOnly IncomeDate
        +string Description
        +long IncomeCategoryId
        +decimal Amount
        +string CurrencyCode
        +string? ReferenceCode
        +string? OrderCode
        +SaleRegion? SaleRegion
        +SalesChannel? SalesChannel
        +RecordStatus RecordStatus
        +int? ProductQty
        +decimal? UnitPrice
        +decimal? ItemTotal
        +decimal DiscountAmount
        +string? DiscountCode
        +decimal? Subtotal
        +decimal ShippingAmount
        +decimal TaxAmount
        +decimal TaxPercent
        +decimal AmountAfterTax
        +string? Note
    }

    class UpdateIncomeRequest {
        +DateOnly IncomeDate
        +string Description
        +long IncomeCategoryId
        +decimal Amount
        +string CurrencyCode
        +string? ReferenceCode
        +string? OrderCode
        +SaleRegion? SaleRegion
        +SalesChannel? SalesChannel
        +RecordStatus RecordStatus
        +int? ProductQty
        +decimal? UnitPrice
        +decimal? ItemTotal
        +decimal DiscountAmount
        +string? DiscountCode
        +decimal? Subtotal
        +decimal ShippingAmount
        +decimal TaxAmount
        +decimal TaxPercent
        +decimal AmountAfterTax
        +string? Note
    }

    class IncomeResponse {
        +long Id
        +string Description
        +decimal Amount
        +decimal AmountAfterTax
        +RecordStatus RecordStatus
        +long CreatedBy
    }

    class IncomeQuery

    class IIncomeService {
        <<interface>>
        +ListAsync(IncomeQuery, ActorContext, CancellationToken) Task
        +GetByIdAsync(long, ActorContext, CancellationToken) Task
        +CreateAsync(IncomeDraft, ActorContext, CancellationToken) Task
        +UpdateAsync(long, IncomeDraft, ActorContext, CancellationToken) Task
        +SoftDeleteAsync(long, ActorContext, CancellationToken) Task
    }

    class IncomeService

    class IncomePolicy {
        +EnsureCanCreate(ActorContext) void
        +EnsureCanUpdate(ActorContext, Income) void
        +EnsureCanDelete(ActorContext, Income) void
    }

    class IncomeValidator {
        +Validate(IncomeDraft) ValidationResult
    }

    class Income {
        +long Id
        +DateOnly IncomeDate
        +string Description
        +long IncomeCategoryId
        +decimal Amount
        +string CurrencyCode
        +string? ReferenceCode
        +string? OrderCode
        +SaleRegion? SaleRegion
        +SalesChannel? SalesChannel
        +RecordStatus RecordStatus
        +int? ProductQty
        +decimal? UnitPrice
        +decimal? ItemTotal
        +decimal DiscountAmount
        +string? DiscountCode
        +decimal? Subtotal
        +decimal ShippingAmount
        +decimal TaxAmount
        +decimal TaxPercent
        +decimal AmountAfterTax
        +DataSource Source
        +long? ImportBatchId
        +string? Note
        +long? CreatedBy
        +long? UpdatedBy
        +DateTimeOffset CreatedAt
        +DateTimeOffset UpdatedAt
        +DateTimeOffset? DeletedAt
        +long? DeletedBy
        +SoftDelete(long, DateTimeOffset) void
    }

    class IncomeDraft
    class ActorContext {
        +long UserId
        +UserRole Role
    }

    class IIncomeRepository {
        <<interface>>
        +ListAsync(IncomeQuery, CancellationToken) Task
        +FindActiveAsync(long, CancellationToken) Task
        +AddAsync(Income, CancellationToken) Task
        +UpdateAsync(Income, CancellationToken) Task
    }

    class IUnitOfWork {
        <<interface>>
        +ExecuteAsync(long actorUserId, Func, CancellationToken) Task
    }

    class IncomeRepository
    class EfUnitOfWork

    IncomesController --> CreateIncomeRequest
    IncomesController --> UpdateIncomeRequest
    IncomesController --> IncomeResponse
    IncomesController --> IIncomeService
    IncomeService ..|> IIncomeService
    IncomeService --> IncomePolicy
    IncomeService --> IncomeValidator
    IncomeService --> IIncomeRepository
    IncomeService --> IUnitOfWork
    IncomeService --> Income
    IncomePolicy --> ActorContext
    IncomePolicy --> Income
    IncomeRepository ..|> IIncomeRepository
    EfUnitOfWork ..|> IUnitOfWork
```



#### 3. Expense

```mermaid
classDiagram
    direction TB

    class ExpensesController {
        +ListAsync(ExpenseQueryRequest, CancellationToken) Task
        +GetByIdAsync(long, CancellationToken) Task
        +CreateAsync(CreateExpenseRequest, CancellationToken) Task
        +UpdateAsync(long, UpdateExpenseRequest, CancellationToken) Task
        +SoftDeleteAsync(long, CancellationToken) Task
    }

    class CreateExpenseRequest {
        +DateOnly ExpenseDate
        +string Description
        +long ExpenseCategoryId
        +decimal Amount
        +string CurrencyCode
        +string? Payee
        +OriginScope OriginScope
        +PaymentMethod? PaymentMethod
        +RecordStatus RecordStatus
        +decimal TaxPercent
        +decimal AmountAfterTax
        +string? Note
    }

    class UpdateExpenseRequest {
        +DateOnly ExpenseDate
        +string Description
        +long ExpenseCategoryId
        +decimal Amount
        +string CurrencyCode
        +string? Payee
        +OriginScope OriginScope
        +PaymentMethod? PaymentMethod
        +RecordStatus RecordStatus
        +decimal TaxPercent
        +decimal AmountAfterTax
        +string? Note
    }

    class ExpenseResponse {
        +long Id
        +string Description
        +decimal Amount
        +decimal AmountAfterTax
        +RecordStatus RecordStatus
        +long CreatedBy
    }

    class ExpenseQuery

    class IExpenseService {
        <<interface>>
        +ListAsync(ExpenseQuery, ActorContext, CancellationToken) Task
        +GetByIdAsync(long, ActorContext, CancellationToken) Task
        +CreateAsync(ExpenseDraft, ActorContext, CancellationToken) Task
        +UpdateAsync(long, ExpenseDraft, ActorContext, CancellationToken) Task
        +SoftDeleteAsync(long, ActorContext, CancellationToken) Task
    }

    class ExpenseService

    class ExpensePolicy {
        +EnsureCanCreate(ActorContext) void
        +EnsureCanUpdate(ActorContext, Expense) void
        +EnsureCanDelete(ActorContext, Expense) void
    }

    class ExpenseValidator {
        +Validate(ExpenseDraft) ValidationResult
    }

    class Expense {
        +long Id
        +DateOnly ExpenseDate
        +string Description
        +long ExpenseCategoryId
        +decimal Amount
        +string CurrencyCode
        +string? Payee
        +OriginScope OriginScope
        +PaymentMethod? PaymentMethod
        +RecordStatus RecordStatus
        +decimal TaxPercent
        +decimal AmountAfterTax
        +DataSource Source
        +long? ImportBatchId
        +string? Note
        +long? CreatedBy
        +long? UpdatedBy
        +DateTimeOffset CreatedAt
        +DateTimeOffset UpdatedAt
        +DateTimeOffset? DeletedAt
        +long? DeletedBy
        +SoftDelete(long, DateTimeOffset) void
    }

    class ExpenseDraft

    class ActorContext {
        +long UserId
        +UserRole Role
    }

    class IExpenseRepository {
        <<interface>>
        +ListAsync(ExpenseQuery, CancellationToken) Task
        +FindActiveAsync(long, CancellationToken) Task
        +AddAsync(Expense, CancellationToken) Task
        +UpdateAsync(Expense, CancellationToken) Task
    }

    class ExpenseRepository
    class EfUnitOfWork

    class IUnitOfWork {
        <<interface>>
        +ExecuteAsync(long actorUserId, Func, CancellationToken) Task
    }

    ExpensesController --> CreateExpenseRequest
    ExpensesController --> UpdateExpenseRequest
    ExpensesController --> ExpenseResponse
    ExpensesController --> IExpenseService
    ExpenseService ..|> IExpenseService
    ExpenseService --> ExpensePolicy
    ExpenseService --> ExpenseValidator
    ExpenseService --> IExpenseRepository
    ExpenseService --> IUnitOfWork
    ExpenseService --> Expense
    ExpensePolicy --> ActorContext
    ExpensePolicy --> Expense
    ExpenseRepository ..|> IExpenseRepository
    EfUnitOfWork ..|> IUnitOfWork
```



Source: [Core Class Diagrams](docs/architecture/uml/01-class-diagrams.md)

### 6.3 Sequence diagrams

Runtime sequences cover authentication, ledger reads and writes, import validation and atomic processing, report/export, attachments, user administration, and profile/password flows. Each sequence maps the user story and OpenAPI operation to its controller, application service, policy/validator, repository, database interaction, success response, and applicable error paths.

- [Core sequence diagrams](docs/architecture/uml/02-sequence-diagrams.md)
- [API runtime sequences and operation traceability](docs/architecture/uml/03-api-traceability.md)

## Documentation

- Requirements: [Scope](docs/01-scope.md), [Features](docs/02-features.md), [INVEST backlog](docs/08-invest-requirements.md), [Acceptance criteria](docs/06-acceptance-criteria.md).
- Requirements catalogs: [Business rules](docs/requirements/business-rules.md) and [Non-functional requirements](docs/requirements/non-functional-requirements.md).
- UI/UX: [Information architecture](docs/04-information-architecture.md).
- Database: [Data model](docs/05-data-model.md), [ER diagram](docs/DATABASE.md), [PostgreSQL schema](src/database/shop_finance.sql).
- Folder structure: [React and three-tier backend](docs/07-folder-structure.md).
- Code-level design: [Core class diagrams](docs/architecture/uml/01-class-diagrams.md), [remaining module classes](docs/architecture/uml/03-additional-class-diagrams.md), [core sequences](docs/architecture/uml/02-sequence-diagrams.md), and [API traceability/sequences](docs/architecture/uml/03-api-traceability.md).
- API contract: [OpenAPI 3.0.4 specification](docs/api/openapi.yaml) and [API documentation](docs/api/README.md).

## Project Progress

- [x] Xác định phạm vi, mục tiêu và vai trò người dùng
- [x] Viết danh sách tính năng và use cases
- [x] Viết user stories theo INVEST
- [x] Viết acceptance criteria và business rules
- [x] Viết non-functional requirements
- [x] Thiết kế information architecture và phân quyền màn hình
- [x] Thiết kế screen hierarchy, task flows và UI states
- [x] Xây dựng giao diện React prototype cho các vai trò
- [x] Thiết kế C4 System Context
- [x] Thiết kế C4 Container
- [x] Thiết kế C4 Component và tài liệu arc42
- [x] Thiết kế PostgreSQL schema, DBML và quan hệ dữ liệu
- [x] Viết tài liệu API theo OpenAPI 3.0
- [x] Thiết kế folder structure cho React frontend
- [x] Thiết kế folder structure backend ba tầng
- [x] Thiết kế class diagrams và sequence diagrams
- [x] Tạo traceability giữa requirements, màn hình, API và database
- [x] Xây dựng backend ASP.NET Core ba tầng
- [x] Xây dựng API xác thực, quản lý người dùng và hồ sơ cá nhân
- [x] Implement income và expense CRUD API
- [x] Hoàn thiện dashboard, reports, import, attachments và audit API
- [x] Viết unit test và API integration test
- [ ] Hoàn thiện PostgreSQL migrations và integration tests với database thật
- [ ] Hoàn thiện import Excel, file storage và report export cho production
- [ ] Chuẩn hóa JWT, rate limit, authorization và security tests
