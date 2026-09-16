# C2 — Container

> **Purpose:** zoom into HandmadeFinance and describe runtime and storage units in the target architecture.

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
            files[("Local File Storage<br/><i>[Container: Filesystem]</i><br/>Import workbooks and transaction attachments;<br/>replaceable through IFileStorage")]
        end
    end

    workbook[("Excel Workbook<br/><i>[External Data]</i><br/>User-provided .xlsx / .xls file")]

    operator --> web
    reader --> web
    web -- "REST / HTTPS / JSON" --> backend
    web -- "upload file import" --> backend
    workbook -.->|"selected from the user's device"| web
    backend -- "SQL / PostgreSQL protocol" --> database
    backend -- "generated storage key / file stream" --> files

    style web fill:#1168bd,color:#fff
    style backend fill:#1168bd,color:#fff
    style database fill:#1168bd,color:#fff
    style files fill:#3a7bd5,color:#fff
```

## Responsibilities

| Container | Technology | Responsibility | Status |
|---|---|---|---|
| Web Frontend | React.js, Vite | UI, route guards, charts, forms, and data tables | Mock implemented |
| .NET Backend | C#, ASP.NET Core Web API, REST/JSON | Trust boundary for authentication, RBAC, business rules, and data access | Not implemented |
| PostgreSQL | PostgreSQL | Persistent data and business relationships | Schema exists; not connected |
| Local File Storage | Filesystem outside the web root | Binary imports and attachments addressed by generated storage keys | Target for local Step 7 implementation |

## Architecture Rules

1. The browser never accesses PostgreSQL directly.
2. Hiding frontend controls is UX only; the .NET Backend must authorize every request.
3. Money is stored in USD; EUR is a display-only conversion.
4. Transaction deletion is soft deletion to preserve history and auditability.
5. PostgreSQL stores file metadata only. Binary files use `IFileStorage`; the local implementation writes outside the web root and production may replace it.

## Current State

```mermaid
flowchart LR
    user(["👤 User"])
    react["React Web<br/><i>implemented</i>"]
    mock["Mock Store + Auth<br/><i>JavaScript / Web Storage</i>"]
    pg[("PostgreSQL schema<br/><i>not connected</i>")]
    user --> react --> mock
    pg -.->|"data design only; no runtime connection"| mock
    style react fill:#1168bd,color:#fff
    style mock fill:#3a7bd5,color:#fff
    style pg fill:#999,color:#fff
```

**Previous:** [C1 — System Context](01-system-context.md) · **Next:** zoom into the .NET Backend → [C3 — Component](03-component.md).
