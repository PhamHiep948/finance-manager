# 5. Building Block View

Phần này đồng bộ với C4: Level 1 là toàn hệ thống, Level 2 là Container, Level 3 zoom vào .NET Backend.

## 5.1 Level 1 — HandmadeFinance

HandmadeFinance là một software system phục vụ bốn vai trò: Admin, Chủ shop, Nhân viên và Người xem. Chi tiết: [C1 System Context](../c4/01-system-context.md).

## 5.2 Level 2 — Containers

```mermaid
flowchart TB
    operator(["👤 Admin / Chủ shop / Nhân viên"])
    reader(["👤 Người xem"])

    subgraph platform["HandmadeFinance [Software System Boundary]"]
        direction TB
        subgraph presentation["Presentation"]
            web["Web Frontend<br/><i>[Container: React.js + Vite]</i><br/>Giao diện, routing, form, bảng và biểu đồ"]
        end
        subgraph application["Application"]
            backend[".NET Backend<br/><i>[Container: ASP.NET Core Web API]</i><br/>Xác thực, RBAC, nghiệp vụ,<br/>import, báo cáo và audit"]
        end
        subgraph data["Data"]
            database[("PostgreSQL<br/><i>[Container: Database]</i><br/>Users, categories, incomes, expenses,<br/>imports, attachments và audit logs")]
        end
    end

    workbook[("Excel Workbook<br/><i>[External Data]</i><br/>Tệp .xlsx / .xls do người dùng cung cấp")]

    operator --> web
    reader --> web
    web -- "REST / HTTPS / JSON" --> backend
    web -- "upload file import" --> backend
    workbook -.->|"được chọn từ thiết bị"| web
    backend -- "SQL / PostgreSQL protocol" --> database

    style web fill:#1168bd,color:#fff
    style backend fill:#1168bd,color:#fff
    style database fill:#1168bd,color:#fff
```

| Container | Public surface | Dữ liệu sở hữu |
|---|---|---|
| Web Frontend | Hash routes, forms, tables, charts | Client/session state tạm thời |
| .NET Backend | REST/JSON endpoints | Business rules và transaction orchestration |
| PostgreSQL | Chỉ backend được truy cập | Users, categories, incomes, expenses, imports, attachments, audits |

## 5.3 Level 3 — .NET Backend Components

```mermaid
flowchart TB
    subgraph rt[".NET Backend [Container]"]
        direction TB
        api["HTTP API<br/><i>[Component: ASP.NET Core]</i><br/>REST endpoints, request validation,<br/>response và error mapping"]
        identity["Identity & Access<br/><i>[Component]</i><br/>Đăng nhập, session/token, RBAC,<br/>own-record policy"]
        user["User & Profile<br/><i>[Component]</i><br/>Tài khoản, vai trò, trạng thái và hồ sơ"]
        ledger["Income & Expense<br/><i>[Component]</i><br/>CRUD, danh mục, thuế, trạng thái<br/>và soft delete"]
        importer["Excel Import<br/><i>[Component]</i><br/>Kiểm tra file, preview,<br/>batch import và kết quả từng dòng"]
        reporting["Dashboard & Reporting<br/><i>[Component]</i><br/>KPI, xu hướng, phân nhóm<br/>và dữ liệu export"]
        audit["Audit Log<br/><i>[Component]</i><br/>Ghi nhận hành động nghiệp vụ<br/>để truy vết"]
        persistence["Persistence<br/><i>[Component]</i><br/>Repository, transaction boundary<br/>và SQL mapping"]
    end

    web["Web Frontend<br/><i>[Container: React.js]</i>"]
    db[("PostgreSQL<br/><i>[Container: Database]</i>")]
    file[("Excel Workbook<br/><i>[External Data]</i>")]

    web --> api
    file -.->|"upload qua Web Frontend"| api
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

| Component | Chức năng | API gọi đến |
|---|---|---|
| HTTP API | Parse/validate request, map response/error | Tất cả use case endpoint |
| Identity & Access | Login, credential/session, RBAC, own-record policy | Login và mọi endpoint bảo vệ |
| User & Profile | User lifecycle và profile | Users, profile |
| Income & Expense | CRUD, category, tax, status, soft delete | Incomes, expenses |
| Excel Import | Validate/preview/process batch | Import |
| Dashboard & Reporting | KPI, time series, category aggregate, export model | Dashboard, reports |
| Audit Log | Append hành động cần truy vết | Audit query; nhận event nội bộ |
| Persistence | Repository, transaction và SQL mapping | Được các component khác dùng nội bộ |

## 5.4 Mapping giao diện → component

| UI | Component chính |
|---|---|
| Login và route permission | Identity & Access |
| Quản lý người dùng, hồ sơ | User & Profile |
| Quản lý thu và chi | Income & Expense |
| Import Excel | Excel Import + Income & Expense |
| Dashboard, báo cáo | Dashboard & Reporting |
| Nhật ký | Audit Log |

## 5.5 Quy tắc dependency

1. HTTP API chỉ điều phối, không viết SQL.
2. Import không bỏ qua validation của Income & Expense.
3. Audit được ghi trong cùng transaction nghiệp vụ khi cần tính nhất quán.
4. Reporting không thay đổi giao dịch.
5. Chỉ Persistence giao tiếp PostgreSQL.

Sơ đồ C3 đầy đủ: [C3 — Component](../c4/03-component.md).

## 5.6 Level 4 — Hai feature chính

Code-level target cho `Income Management` và `Expense Management` được mô tả bằng ASP.NET Core Controller, Service, Policy, Validator, Domain Entity và Repository tại [C4 Level 4](../c4/04-code.md). Đây là thiết kế đích; chưa có C# source để đối chiếu implementation.
