# C3 — Component — .NET Backend

> **Trạng thái:** kiến trúc đích. Các component dưới đây chưa có mã C#/.NET trong repository.

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

## Component catalog

| Component | Sở hữu trách nhiệm | Không chịu trách nhiệm |
|---|---|---|
| HTTP API | Transport, validation, error contract | SQL và quyết định nghiệp vụ |
| Identity & Access | Authentication, RBAC, own-record rule | Ẩn/hiện giao diện |
| User & Profile | Vòng đời tài khoản và hồ sơ | Giao dịch tài chính |
| Income & Expense | Quy tắc thu/chi, thuế, trạng thái, soft delete | Render báo cáo |
| Excel Import | Parse/validate batch và điều phối nhập | Ghi bảng giao dịch bỏ qua domain |
| Dashboard & Reporting | Query tổng hợp, KPI, export | Thay đổi giao dịch |
| Audit Log | Nhật ký hành động nghiệp vụ | Dữ liệu vận hành chính |
| Persistence | Repository, SQL, transaction | HTTP và UI authorization |

## Luồng phụ thuộc

`HTTP API → Identity & Access → domain component → Persistence → PostgreSQL`.

Import gọi Income & Expense để dùng chung validation. Reporting chỉ đọc qua Persistence. Không component nghiệp vụ nào mở kết nối PostgreSQL riêng.

**Trước:** [C2 — Container](02-container.md) · **Tiếp theo:** [C4 — Code cho khoản thu và khoản chi](04-code.md) · **Liên quan:** [arc42 Building Block View](../arc42/05-building-block-view.md).

**Nguồn sự thật:** `docs/02-features.md`, `docs/03-use-cases.md`, `database/shop_finance.sql`, `app/src/lib/store.jsx`.
